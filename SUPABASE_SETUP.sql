-- ==========================================
-- 1. STORAGE SETUP (Buckets & Policies)
-- ==========================================

-- Create Buckets
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public) 
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- Ensure profiles table has necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- AVATARS POLICIES
-- Public read
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Access" on storage.objects;
    CREATE POLICY "Public Access" on storage.objects FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- Auth upload (Only own folder)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "User can upload own avatar" on storage.objects;
    CREATE POLICY "User can upload own avatar" on storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'avatars' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- User can update own avatar
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "User can update own avatar" on storage.objects;
    CREATE POLICY "User can update own avatar" on storage.objects FOR UPDATE USING (
      bucket_id = 'avatars' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- PAYMENT PROOFS POLICIES
-- Admin/Staff can read all
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admin can view all proofs" on storage.objects;
    CREATE POLICY "Admin can view all proofs" on storage.objects FOR SELECT USING (
      bucket_id = 'payment-proofs' AND 
      exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
    );
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- User can view own proofs
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "User can view own proofs" on storage.objects;
    CREATE POLICY "User can view own proofs" on storage.objects FOR SELECT USING (
      bucket_id = 'payment-proofs' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- User can upload proof
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "User can upload proof" on storage.objects;
    CREATE POLICY "User can upload proof" on storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'payment-proofs' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- PRODUCTS POLICIES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public can view product images" on storage.objects;
    CREATE POLICY "Public can view product images" on storage.objects FOR SELECT USING (bucket_id = 'products');

    DROP POLICY IF EXISTS "Admin can manage product images" on storage.objects;
    CREATE POLICY "Admin can manage product images" on storage.objects FOR ALL USING (
      bucket_id = 'products' AND 
      exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
    );
EXCEPTION WHEN others THEN
    NULL;
END $$;


-- ==========================================
-- 2. ESSENTIAL RPC FUNCTIONS
-- ==========================================

-- Cleanup existing functions
drop function if exists public.adjust_stock(uuid, integer, text);
drop function if exists public.checkout_cart(jsonb, numeric, text);
drop function if exists public.verify_simulated_payment(uuid, boolean, text);
drop function if exists public.cancel_pending_order(uuid);
drop function if exists public.admin_set_user_access(uuid, text, boolean);
drop function if exists public.submit_payment_proof(uuid, text);
drop function if exists public.ship_order(uuid, text);
drop function if exists public.confirm_order_received(uuid);

-- RPC: adjust_stock
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text
) returns void as $$
begin
  update public.products
  set stock_on_hand = stock_on_hand + p_quantity_delta,
      updated_at = now()
  where id = p_product_id;

  insert into public.audit_logs (action, entity_type, entity_id, actor_id, metadata)
  values ('update_stock', 'product', p_product_id, auth.uid(), jsonb_build_object('delta', p_quantity_delta, 'reason', p_reason));
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: checkout_cart
create or replace function public.checkout_cart(
  p_items jsonb,
  p_total numeric,
  p_shipping_address text
) returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  insert into public.orders (user_id, total, shipping_address, status)
  values (auth.uid(), p_total, p_shipping_address, 'pending_payment')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if not exists (
      select 1 from public.products 
      where id = (v_item->>'product_id')::uuid 
      and (stock_on_hand - stock_reserved) >= (v_item->>'quantity')::integer
    ) then
      raise exception 'Stok tidak mencukupi untuk %', v_item->>'name';
    end if;

    insert into public.order_items (order_id, product_id, quantity, price_at_purchase)
    values (v_order_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::integer, (v_item->>'price')::numeric);

    update public.products
    set stock_reserved = stock_reserved + (v_item->>'quantity')::integer
    where id = (v_item->>'product_id')::uuid;
  end loop;

  return v_order_id;
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: verify_simulated_payment
create or replace function public.verify_simulated_payment(
  p_payment_id uuid,
  p_approve boolean,
  p_rejection_reason text default null
) returns void as $$
declare
  v_order_id uuid;
  v_status text;
begin
  select order_id into v_order_id from public.payments where id = p_payment_id;
  
  if p_approve then
    v_status := 'processing';
    update public.payments set status = 'verified' where id = p_payment_id;
    
    update public.products p
    set stock_on_hand = p.stock_on_hand - oi.quantity,
        stock_reserved = p.stock_reserved - oi.quantity
    from public.order_items oi
    where oi.order_id = v_order_id and p.id = oi.product_id;
  else
    v_status := 'pending_payment';
    update public.payments set status = 'rejected', notes = p_rejection_reason where id = p_payment_id;
  end if;

  update public.orders set status = v_status where id = v_order_id;
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: cancel_pending_order
create or replace function public.cancel_pending_order(p_order_id uuid) returns void as $$
declare
  v_user_id uuid;
  v_status text;
begin
  select user_id, status into v_user_id, v_status from public.orders where id = p_order_id;

  if v_user_id is null then
    raise exception 'Pesanan tidak ditemukan (ID: %)', p_order_id;
  end if;

  if v_user_id != auth.uid() and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Anda tidak memiliki akses untuk membatalkan pesanan ini';
  end if;

  if v_status != 'pending_payment' then
    raise exception 'Pesanan tidak dapat dibatalkan karena statusnya sudah %', v_status;
  end if;

  update public.products p
  set stock_reserved = greatest(0, p.stock_reserved - oi.quantity)
  from public.order_items oi
  where oi.order_id = p_order_id and p.id = oi.product_id;

  update public.orders set status = 'cancelled', updated_at = now() where id = p_order_id;
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: admin_set_user_access
create or replace function public.admin_set_user_access(
  p_target_user_id uuid,
  p_role text,
  p_is_active boolean
) returns void as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set role = p_role,
      is_active = p_is_active,
      updated_at = now()
  where id = p_target_user_id;

  insert into public.audit_logs (action, entity_type, entity_id, actor_id, metadata)
  values ('update_user_access', 'profile', p_target_user_id, auth.uid(), jsonb_build_object('role', p_role, 'is_active', p_is_active));
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: submit_payment_proof
create or replace function public.submit_payment_proof(
  p_order_id uuid,
  p_proof_path text
) returns void as $$
declare
  v_attempt integer;
begin
  select coalesce(max(attempt_no), 0) + 1 into v_attempt from public.payments where order_id = p_order_id;

  insert into public.payments (order_id, proof_path, status, attempt_no, amount)
  select p_order_id, p_proof_path, 'pending_verification', v_attempt, total
  from public.orders where id = p_order_id;

  update public.orders set status = 'pending_payment' where id = p_order_id;
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: ship_order
create or replace function public.ship_order(
  p_order_id uuid,
  p_tracking_number text
) returns void as $$
begin
  update public.orders
  set status = 'shipped',
      tracking_number = p_tracking_number,
      shipped_at = now()
  where id = p_order_id;
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: confirm_order_received
create or replace function public.confirm_order_received(p_order_id uuid) returns void as $$
begin
  update public.orders
  set status = 'completed',
      completed_at = now()
  where id = p_order_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ==========================================
-- 3. HELPER FUNCTIONS & RLS POLICIES
-- ==========================================

-- Helper functions to check role without recursion
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'staff')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- GRANT PERMISSIONS (Critical for "permission denied" errors)
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant all on all routines in schema public to authenticated;

-- PRODUCTS TABLE
alter table public.products enable row level security;
drop policy if exists "Allow public read active products" on public.products;
create policy "Allow public read active products" on public.products for select using (is_active = true);

drop policy if exists "Allow admin/staff full access to products" on public.products;
create policy "Allow admin/staff full access to products" on public.products 
for all 
using (public.is_staff())
with check (public.is_staff());

-- CATEGORIES TABLE
alter table public.categories enable row level security;
drop policy if exists "Allow public read active categories" on public.categories;
create policy "Allow public read active categories" on public.categories for select using (is_active = true);

drop policy if exists "Allow admin/staff full access to categories" on public.categories;
create policy "Allow admin/staff full access to categories" on public.categories 
for all 
using (public.is_staff())
with check (public.is_staff());

-- ORDERS TABLE
alter table public.orders enable row level security;
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders for select using (user_id = auth.uid());

drop policy if exists "Admin/Staff can view all orders" on public.orders;
create policy "Admin/Staff can view all orders" on public.orders for select using (public.is_staff());

drop policy if exists "Admin/Staff can update orders" on public.orders;
create policy "Admin/Staff can update orders" on public.orders for update using (public.is_staff());

-- PROFILES TABLE
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());

drop policy if exists "Admin can view all profiles" on public.profiles;
create policy "Admin can view all profiles" on public.profiles for select using (public.is_admin());

drop policy if exists "Admin can update all profiles" on public.profiles;
create policy "Admin can update all profiles" on public.profiles for update using (public.is_admin());

-- AUDIT LOGS TABLE
alter table public.audit_logs enable row level security;
drop policy if exists "Admin/Staff can view audit logs" on public.audit_logs;
create policy "Admin/Staff can view audit logs" on public.audit_logs for select using (public.is_staff());

-- Trigger for profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, is_active)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User Baru'), 'customer', true);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
