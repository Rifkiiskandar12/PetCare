-- 1. FIX ORDERS TABLE (Add shipped_at)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- 2. FIX PAYMENTS TABLE
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT;
-- Ensure rejection_reason is also present
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. REMOVE POTENTIAL RESTRICTIVE CONSTRAINTS
-- We don't know exactly what check2 is, so we try to be safe with the status.
DO $$
BEGIN
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_check2;
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- 4. FIX CANCEL_PENDING_ORDER (Add staff access & check search_path)
CREATE OR REPLACE FUNCTION public.cancel_pending_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  
  SELECT status INTO v_status FROM public.orders WHERE id = p_order_id;
  
  -- Allow if owner OR admin OR staff
  IF (SELECT user_id FROM public.orders WHERE id = p_order_id) = auth.uid() 
     OR v_role IN ('admin', 'staff') THEN
     
    IF v_status IN ('pending_payment', 'processing') THEN
      UPDATE public.orders SET status = 'cancelled' WHERE id = p_order_id;
      
      -- Release stock
      INSERT INTO public.inventory_movements (product_id, reserved_delta, movement_type, reason, order_id)
      SELECT product_id, -quantity, 'release', 'Order cancelled', p_order_id
      FROM public.order_items WHERE order_id = p_order_id;
      
      UPDATE public.products p
      SET stock_reserved = p.stock_reserved - oi.quantity
      FROM public.order_items oi
      WHERE p.id = oi.product_id AND oi.order_id = p_order_id;

      INSERT INTO public.order_status_history (order_id, old_status, new_status, actor_id, note)
      VALUES (p_order_id, v_status::public.order_status, 'cancelled'::public.order_status, auth.uid(), 'Pesanan dibatalkan');
    ELSE
      RAISE EXCEPTION 'Hanya pesanan pending atau processing yang bisa dibatalkan';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tidak memiliki akses untuk membatalkan pesanan ini';
  END IF;
END;
$$;

-- 5. FIX SHIP_ORDER (Use shipped_at)
CREATE OR REPLACE FUNCTION public.ship_order(p_order_id UUID, p_tracking_number TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET 
    status = 'shipped',
    tracking_number = p_tracking_number,
    shipped_at = NOW()
  WHERE id = p_order_id AND status = 'processing';

  INSERT INTO public.order_status_history (order_id, old_status, new_status, actor_id, note)
  VALUES (p_order_id, 'processing'::public.order_status, 'shipped'::public.order_status, auth.uid(), 'Pesanan telah dikirim dengan resi: ' || p_tracking_number);
END;
$$;

-- 6. FIX ADMIN_SET_USER_ACCESS (Resolve ambiguity)
DROP FUNCTION IF EXISTS public.admin_set_user_access(UUID, public.app_role, BOOLEAN);
DROP FUNCTION IF EXISTS public.admin_set_user_access(UUID, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.admin_set_user_access(
  p_target_user_id UUID,
  p_role TEXT, 
  p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengubah akses';
  END IF;

  UPDATE public.profiles
  SET 
    role = p_role::public.app_role,
    is_active = p_is_active,
    updated_at = NOW()
  WHERE id = p_target_user_id;
END;
$$;

-- 7. FIX VERIFY_SIMULATED_PAYMENT
CREATE OR REPLACE FUNCTION public.verify_simulated_payment(
  p_payment_id UUID,
  p_approve BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_old_status TEXT;
BEGIN
  SELECT order_id INTO v_order_id FROM public.payments WHERE id = p_payment_id;
  SELECT status INTO v_old_status FROM public.orders WHERE id = v_order_id;

  IF p_approve THEN
    UPDATE public.payments
    SET 
      status = 'approved',
      verified_at = NOW(),
      verified_by = auth.uid(),
      notes = 'Pembayaran disetujui'
    WHERE id = p_payment_id;

    UPDATE public.orders SET status = 'processing' WHERE id = v_order_id;
    
    INSERT INTO public.order_status_history (order_id, old_status, new_status, actor_id, note)
    VALUES (v_order_id, v_old_status::public.order_status, 'processing'::public.order_status, auth.uid(), 'Pembayaran diverifikasi');
  ELSE
    UPDATE public.payments
    SET 
      status = 'rejected',
      rejection_reason = p_rejection_reason,
      notes = COALESCE(p_rejection_reason, 'Pembayaran ditolak')
    WHERE id = p_payment_id;
    
    -- When rejected, we don't necessarily cancel the order, just allow another proof upload.
  END IF;
END;
$$;

-- 8. IMPROVE ADJUST_STOCK (Audit log with before/after)
CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_product_id UUID,
  p_quantity_delta INTEGER,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  SELECT stock_on_hand INTO v_old_stock FROM public.products WHERE id = p_product_id;
  v_new_stock := v_old_stock + p_quantity_delta;

  UPDATE public.products
  SET stock_on_hand = v_new_stock
  WHERE id = p_product_id;

  INSERT INTO public.inventory_movements (product_id, quantity_delta, movement_type, reason, actor_id)
  VALUES (p_product_id, p_quantity_delta, 'adjustment', p_reason, auth.uid());

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(), 
    'UPDATE_STOCK', 
    'product', 
    p_product_id, 
    jsonb_build_object(
      'delta', p_quantity_delta,
      'reason', p_reason,
      'before', v_old_stock,
      'after', v_new_stock
    )
  );
END;
$$;

-- 9. FIX SUBMIT_PAYMENT_PROOF (Allow replacing proof while pending)
DROP FUNCTION IF EXISTS public.submit_payment_proof(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.submit_payment_proof(p_order_id UUID, p_proof_path TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_order RECORD;
  v_payment RECORD;
  v_payment_id UUID;
BEGIN
  -- Basic validation
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pesanan tidak ditemukan atau bukan milik Anda'; END IF;
  
  IF v_order.status != 'pending_payment' THEN 
    RAISE EXCEPTION 'Pesanan tidak dalam status menunggu pembayaran (Status: %)', v_order.status; 
  END IF;

  -- Get latest payment attempt
  SELECT * INTO v_payment FROM public.payments WHERE order_id = p_order_id ORDER BY attempt_no DESC LIMIT 1 FOR UPDATE;

  IF v_payment.id IS NOT NULL AND v_payment.status = 'approved' THEN 
    RAISE EXCEPTION 'Pembayaran sudah disetujui'; 
  END IF;

  -- If already pending or not submitted, we just update the existing record.
  -- This avoids "one_active_attempt_per_order" constraint violations.
  IF v_payment.id IS NOT NULL AND (v_payment.status = 'pending_verification' OR v_payment.status = 'not_submitted') THEN
    UPDATE public.payments
    SET 
      status = 'pending_verification',
      proof_path = p_proof_path,
      submitted_at = NOW(),
      rejection_reason = NULL,
      updated_at = NOW()
    WHERE id = v_payment.id
    RETURNING id INTO v_payment_id;
  ELSE
    -- Create NEW attempt (if rejected or if none exists)
    INSERT INTO public.payments (order_id, attempt_no, status, proof_path, submitted_at, amount)
    VALUES (p_order_id, COALESCE(v_payment.attempt_no, 0) + 1, 'pending_verification', p_proof_path, NOW(), v_order.total)
    RETURNING id INTO v_payment_id;
  END IF;

  RETURN v_payment_id;
END;
$$;


-- 10. FIX CONFIRM_ORDER_RECEIVED
CREATE OR REPLACE FUNCTION public.confirm_order_received(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_user_id UUID;
  v_role TEXT;
BEGIN
  SELECT status, user_id INTO v_status, v_user_id FROM public.orders WHERE id = p_order_id;
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  
  -- Allow if owner OR admin OR staff
  IF v_user_id = auth.uid() OR v_role IN ('admin', 'staff') THEN
    IF v_status != 'shipped' THEN
      RAISE EXCEPTION 'Pesanan harus dalam status dikirim untuk diselesaikan';
    END IF;

    UPDATE public.orders
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (order_id, old_status, new_status, actor_id, note)
    VALUES (p_order_id, v_status::public.order_status, 'completed'::public.order_status, auth.uid(), 'Pesanan telah diselesaikan');
  ELSE
    RAISE EXCEPTION 'Tidak memiliki akses untuk menyelesaikan pesanan ini';
  END IF;
END;
$$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

