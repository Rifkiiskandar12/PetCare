-- PetCare Supabase baseline schema v1.1
-- Intended for a NEW Supabase project. Review and run in the SQL Editor or via migrations.
-- Payment is SIMULATED: this schema does not integrate with a bank/payment gateway.
-- Never expose the service_role/secret key in browser code.

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum ('customer', 'staff', 'admin');
create type public.order_status as enum ('pending_payment', 'processing', 'shipped', 'completed', 'cancelled');
create type public.payment_status as enum ('not_submitted', 'pending_verification', 'approved', 'rejected');
create type public.inventory_movement_type as enum ('stock_in', 'adjustment', 'reservation', 'sale', 'release');

-- 1. Core identity and catalog
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  sku text not null unique check (length(trim(sku)) between 2 and 40),
  name text not null check (length(trim(name)) between 2 and 160),
  description text,
  price numeric(12,2) not null check (price > 0),
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  stock_reserved integer not null default 0 check (stock_reserved >= 0 and stock_reserved <= stock_on_hand),
  image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

-- 2. Orders, line-item snapshots, and simulated payment attempts
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  total numeric(12,2) not null check (total >= 0),
  shipping_address text not null check (length(trim(shipping_address)) >= 8),
  contact_phone text not null check (length(trim(contact_phone)) >= 6),
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total = subtotal + shipping_cost),
  check ((status = 'shipped' and tracking_number is not null and length(trim(tracking_number)) > 0) or status <> 'shipped')
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot > 0),
  quantity integer not null check (quantity > 0 and quantity <= 99),
  line_total numeric(14,2) generated always as (unit_price_snapshot * quantity) stored,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  attempt_no integer not null check (attempt_no > 0),
  method text not null default 'simulated_bank_transfer' check (method = 'simulated_bank_transfer'),
  status public.payment_status not null default 'not_submitted',
  amount numeric(12,2) not null check (amount >= 0),
  proof_path text unique,
  submitted_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, attempt_no),
  check ((status = 'rejected' and rejection_reason is not null and length(trim(rejection_reason)) > 0) or status <> 'rejected'),
  check ((status in ('pending_verification', 'approved', 'rejected') and proof_path is not null) or status = 'not_submitted'),
  check ((status in ('approved', 'rejected') and verified_at is not null and verified_by is not null) or status not in ('approved', 'rejected'))
);

-- At most one current attempt may be awaiting submission or verification.
create unique index payments_one_active_attempt_per_order
  on public.payments(order_id)
  where status in ('not_submitted', 'pending_verification');

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null default 0,
  reserved_delta integer not null default 0,
  reason text not null,
  order_id uuid references public.orders(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (quantity_delta <> 0 or reserved_delta <> 0),
  check (length(trim(reason)) >= 3)
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  old_status public.order_status,
  new_status public.order_status not null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index products_category_active_idx on public.products(category_id, is_active);
create index products_name_idx on public.products using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));
create index cart_items_cart_idx on public.cart_items(cart_id);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index order_items_order_idx on public.order_items(order_id);
create index payments_order_attempt_idx on public.payments(order_id, attempt_no desc);
create index payments_status_created_idx on public.payments(status, created_at);
create index inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);
create index order_status_history_order_created_idx on public.order_status_history(order_id, created_at);

-- 3. Common helpers. SECURITY DEFINER helpers pin search_path and qualify all relations.
create or replace function private.has_role(p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and p.role = any (p_roles)
  );
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active = true
  );
$$;

revoke all on function private.has_role(public.app_role[]) from public;
revoke all on function private.is_active_user() from public;
grant execute on function private.has_role(public.app_role[]) to authenticated;
grant execute on function private.is_active_user() to authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not private.has_role(array['admin']::public.app_role[]) then
    raise exception 'Only an active admin can change account role or active status';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, is_active)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'customer', true)
  on conflict (id) do nothing;
  insert into public.carts (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Trigger-only functions are not callable directly through ordinary client permissions.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.protect_profile_admin_fields() from public, anon, authenticated;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger profiles_protect_admin_fields before update on public.profiles
  for each row execute function private.protect_profile_admin_fields();
create trigger categories_touch_updated_at before update on public.categories
  for each row execute function private.touch_updated_at();
create trigger products_touch_updated_at before update on public.products
  for each row execute function private.touch_updated_at();
create trigger carts_touch_updated_at before update on public.carts
  for each row execute function private.touch_updated_at();
create trigger cart_items_touch_updated_at before update on public.cart_items
  for each row execute function private.touch_updated_at();
create trigger orders_touch_updated_at before update on public.orders
  for each row execute function private.touch_updated_at();
create trigger payments_touch_updated_at before update on public.payments
  for each row execute function private.touch_updated_at();

-- 4. RLS: enable on every application table.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.order_status_history enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_select_admin on public.profiles
  for select to authenticated using (private.has_role(array['admin']::public.app_role[]));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_update_admin on public.profiles
  for update to authenticated using (private.has_role(array['admin']::public.app_role[])) with check (private.has_role(array['admin']::public.app_role[]));

create policy categories_public_read_active on public.categories
  for select to anon, authenticated using (is_active = true);
create policy categories_staff_read_all on public.categories
  for select to authenticated using (private.has_role(array['staff','admin']::public.app_role[]));
create policy categories_admin_insert on public.categories
  for insert to authenticated with check (private.has_role(array['admin']::public.app_role[]));
create policy categories_admin_update on public.categories
  for update to authenticated using (private.has_role(array['admin']::public.app_role[])) with check (private.has_role(array['admin']::public.app_role[]));
create policy categories_admin_delete on public.categories
  for delete to authenticated using (private.has_role(array['admin']::public.app_role[]));

create policy products_public_read_active on public.products
  for select to anon, authenticated using (is_active = true and exists (
    select 1 from public.categories c where c.id = category_id and c.is_active = true
  ));
create policy products_staff_read_all on public.products
  for select to authenticated using (private.has_role(array['staff','admin']::public.app_role[]));
create policy products_admin_insert on public.products
  for insert to authenticated with check (private.has_role(array['admin']::public.app_role[]));
create policy products_admin_update on public.products
  for update to authenticated using (private.has_role(array['admin']::public.app_role[])) with check (private.has_role(array['admin']::public.app_role[]));
create policy products_admin_delete on public.products
  for delete to authenticated using (private.has_role(array['admin']::public.app_role[]));

create policy carts_select_own on public.carts
  for select to authenticated using (user_id = (select auth.uid()));
create policy carts_insert_own on public.carts
  for insert to authenticated with check (user_id = (select auth.uid()) and private.is_active_user());
create policy carts_update_own on public.carts
  for update to authenticated using (user_id = (select auth.uid()) and private.is_active_user()) with check (user_id = (select auth.uid()) and private.is_active_user());
create policy carts_delete_own on public.carts
  for delete to authenticated using (user_id = (select auth.uid()));

create policy cart_items_select_own on public.cart_items
  for select to authenticated using (exists (
    select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())
  ));
create policy cart_items_insert_own on public.cart_items
  for insert to authenticated with check (
    private.is_active_user() and
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())) and
    exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );
create policy cart_items_update_own on public.cart_items
  for update to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
  ) with check (
    private.is_active_user() and
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())) and
    exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );
create policy cart_items_delete_own on public.cart_items
  for delete to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
  );

create policy orders_select_owner on public.orders
  for select to authenticated using (user_id = (select auth.uid()));
create policy orders_select_staff on public.orders
  for select to authenticated using (private.has_role(array['staff','admin']::public.app_role[]));
create policy order_items_select_owner_or_staff on public.order_items
  for select to authenticated using (exists (
    select 1 from public.orders o where o.id = order_id
      and (o.user_id = (select auth.uid()) or private.has_role(array['staff','admin']::public.app_role[]))
  ));
create policy payments_select_owner_or_staff on public.payments
  for select to authenticated using (exists (
    select 1 from public.orders o where o.id = order_id
      and (o.user_id = (select auth.uid()) or private.has_role(array['staff','admin']::public.app_role[]))
  ));
create policy inventory_movements_select_staff on public.inventory_movements
  for select to authenticated using (private.has_role(array['staff','admin']::public.app_role[]));
create policy order_status_history_select_owner_or_staff on public.order_status_history
  for select to authenticated using (exists (
    select 1 from public.orders o where o.id = order_id
      and (o.user_id = (select auth.uid()) or private.has_role(array['staff','admin']::public.app_role[]))
  ));
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated using (private.has_role(array['admin']::public.app_role[]));

-- 5. Explicit grants. Stock, orders, payments, histories and logs are modified only by trusted DB functions.
revoke all on public.profiles, public.categories, public.products, public.carts, public.cart_items,
  public.orders, public.order_items, public.payments, public.inventory_movements,
  public.order_status_history, public.audit_logs from public, anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert (category_id, sku, name, description, price, image_path, is_active) on public.products to authenticated;
grant update (category_id, sku, name, description, price, image_path, is_active) on public.products to authenticated;
grant delete on public.products to authenticated;
grant select, insert, update, delete on public.carts to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select on public.orders, public.order_items, public.payments, public.inventory_movements,
  public.order_status_history, public.audit_logs to authenticated;

-- 6. Atomic checkout. Physical stock remains unchanged while units are reserved.
create or replace function public.checkout_cart(p_shipping_address text, p_contact_phone text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_cart_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item record;
begin
  if v_user is null or not private.has_role(array['customer']::public.app_role[]) then
    raise exception 'Active customer session required';
  end if;
  if length(trim(coalesce(p_shipping_address, ''))) < 8 then raise exception 'Shipping address is required'; end if;
  if length(trim(coalesce(p_contact_phone, ''))) < 6 then raise exception 'Contact phone is required'; end if;

  insert into public.carts(user_id) values (v_user) on conflict (user_id) do nothing;
  select c.id into v_cart_id from public.carts c where c.user_id = v_user for update;
  if not exists (select 1 from public.cart_items ci where ci.cart_id = v_cart_id) then
    raise exception 'Cart is empty';
  end if;

  -- Lock product rows in deterministic order to avoid overselling and reduce deadlocks.
  perform p.id
    from public.products p
    join public.cart_items ci on ci.product_id = p.id
    where ci.cart_id = v_cart_id
    order by p.id
    for update of p;

  for v_item in
    select ci.product_id, ci.quantity, p.price, p.stock_on_hand, p.stock_reserved, p.is_active, c.is_active as category_active, p.name, p.sku
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.categories c on c.id = p.category_id
    where ci.cart_id = v_cart_id
    order by p.id
  loop
    if not v_item.is_active or not v_item.category_active then raise exception 'A product or its category in the cart is no longer active'; end if;
    if v_item.stock_on_hand - v_item.stock_reserved < v_item.quantity then
      raise exception 'Insufficient available stock for product %', v_item.sku;
    end if;
    v_subtotal := v_subtotal + (v_item.price * v_item.quantity);
  end loop;

  v_total := v_subtotal + v_shipping;
  v_order_number := 'PC-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.orders (order_number, user_id, status, subtotal, shipping_cost, total, shipping_address, contact_phone)
  values (v_order_number, v_user, 'pending_payment', v_subtotal, v_shipping, v_total, trim(p_shipping_address), trim(p_contact_phone))
  returning id into v_order_id;

  insert into public.order_status_history(order_id, old_status, new_status, actor_id, note)
  values (v_order_id, null, 'pending_payment', v_user, 'Order created; stock reserved pending simulated payment');

  for v_item in
    select ci.product_id, ci.quantity, p.price, p.stock_on_hand, p.stock_reserved, p.name, p.sku
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
    order by p.id
  loop
    insert into public.order_items(order_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity)
    values (v_order_id, v_item.product_id, v_item.name, v_item.sku, v_item.price, v_item.quantity);

    update public.products
      set stock_reserved = stock_reserved + v_item.quantity
      where id = v_item.product_id;

    insert into public.inventory_movements(product_id, actor_id, movement_type, quantity_delta, reserved_delta, reason, order_id)
    values (v_item.product_id, v_user, 'reservation', 0, v_item.quantity, 'Reserved during checkout', v_order_id);
  end loop;

  insert into public.payments(order_id, attempt_no, method, status, amount)
  values (v_order_id, 1, 'simulated_bank_transfer', 'not_submitted', v_total);

  delete from public.cart_items where cart_id = v_cart_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_user, 'checkout_created', 'order', v_order_id, jsonb_build_object('order_number', v_order_number, 'total', v_total));
  return v_order_id;
end;
$$;

-- Upload the file to Storage first, then call this function to bind it to the order/payment attempt.
create or replace function public.submit_payment_proof(p_order_id uuid, p_proof_path text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_new_payment_id uuid;
  v_next_attempt integer;
begin
  if v_user is null or not private.has_role(array['customer']::public.app_role[]) then raise exception 'Active customer session required'; end if;
  if array_length(string_to_array(coalesce(p_proof_path, ''), '/'), 1) <> 3
     or split_part(p_proof_path, '/', 1) <> v_user::text
     or split_part(p_proof_path, '/', 2) <> p_order_id::text
     or split_part(p_proof_path, '/', 3) = ''
     or p_proof_path like '%..%' then
    raise exception 'Invalid payment proof path';
  end if;
  if not exists (select 1 from storage.objects so where so.bucket_id = 'payment-proofs' and so.name = p_proof_path) then
    raise exception 'Payment proof file was not found in private Storage';
  end if;

  select * into v_order from public.orders o where o.id = p_order_id and o.user_id = v_user for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'Order is not awaiting payment'; end if;

  select * into v_payment from public.payments p where p.order_id = p_order_id order by p.attempt_no desc limit 1 for update;
  if v_payment.status = 'pending_verification' then raise exception 'A payment proof is already awaiting verification'; end if;
  if v_payment.status = 'approved' then raise exception 'Payment already approved'; end if;

  if v_payment.status = 'not_submitted' then
    update public.payments
      set status = 'pending_verification', proof_path = p_proof_path, submitted_at = now(), rejection_reason = null
      where id = v_payment.id
      returning id into v_new_payment_id;
  elsif v_payment.status = 'rejected' then
    select coalesce(max(p.attempt_no), 0) + 1 into v_next_attempt from public.payments p where p.order_id = p_order_id;
    insert into public.payments(order_id, attempt_no, method, status, amount, proof_path, submitted_at)
    values (p_order_id, v_next_attempt, 'simulated_bank_transfer', 'pending_verification', v_order.total, p_proof_path, now())
    returning id into v_new_payment_id;
  else
    raise exception 'Payment attempt is not eligible for proof submission';
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_user, 'payment_proof_submitted', 'payment', v_new_payment_id, jsonb_build_object('order_id', p_order_id));
  return v_new_payment_id;
end;
$$;

-- Staff/admin verifies once. Approval atomically converts the reservation to a sale.
create or replace function public.verify_simulated_payment(p_payment_id uuid, p_approve boolean, p_rejection_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_item record;
  v_new_status public.order_status;
begin
  if v_actor is null or not private.has_role(array['staff','admin']::public.app_role[]) then raise exception 'Staff/admin access required'; end if;
  select o.* into v_order
    from public.orders o
    join public.payments p on p.order_id = o.id
    where p.id = p_payment_id
    for update of o;
  if not found then raise exception 'Payment not found'; end if;
  select * into v_payment from public.payments p where p.id = p_payment_id for update;
  if v_payment.status <> 'pending_verification' then raise exception 'Payment is not awaiting verification'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'Order is not awaiting payment'; end if;

  if p_approve then
    for v_item in
      select oi.product_id, oi.quantity, p.stock_on_hand, p.stock_reserved
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = v_order.id
      order by p.id
      for update of p
    loop
      if v_item.stock_reserved < v_item.quantity or v_item.stock_on_hand < v_item.quantity then
        raise exception 'Reserved stock invariant failed for order %', v_order.order_number;
      end if;
      update public.products
        set stock_on_hand = stock_on_hand - v_item.quantity,
            stock_reserved = stock_reserved - v_item.quantity
        where id = v_item.product_id;
      insert into public.inventory_movements(product_id, actor_id, movement_type, quantity_delta, reserved_delta, reason, order_id)
      values (v_item.product_id, v_actor, 'sale', -v_item.quantity, -v_item.quantity, 'Simulated payment approved; sale committed', v_order.id);
    end loop;
    update public.payments set status = 'approved', verified_by = v_actor, verified_at = now(), rejection_reason = null where id = v_payment.id;
    update public.orders set status = 'processing' where id = v_order.id;
    v_new_status := 'processing';
    insert into public.order_status_history(order_id, old_status, new_status, actor_id, note)
    values (v_order.id, v_order.status, v_new_status, v_actor, 'Simulated payment approved');
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values (v_actor, 'payment_approved', 'payment', v_payment.id, jsonb_build_object('order_id', v_order.id));
  else
    if length(trim(coalesce(p_rejection_reason, ''))) < 3 then raise exception 'A rejection reason of at least 3 characters is required'; end if;
    update public.payments
      set status = 'rejected', verified_by = v_actor, verified_at = now(), rejection_reason = trim(p_rejection_reason)
      where id = v_payment.id;
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values (v_actor, 'payment_rejected', 'payment', v_payment.id, jsonb_build_object('order_id', v_order.id, 'reason', trim(p_rejection_reason)));
  end if;
end;
$$;

create or replace function public.cancel_pending_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders%rowtype;
  v_latest_payment public.payments%rowtype;
  v_item record;
begin
  if v_user is null or not private.has_role(array['customer']::public.app_role[]) then raise exception 'Active customer session required'; end if;
  select * into v_order from public.orders o where o.id = p_order_id and o.user_id = v_user for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'Only orders awaiting payment can be cancelled'; end if;
  select * into v_latest_payment from public.payments p where p.order_id = p_order_id order by p.attempt_no desc limit 1 for update;
  if v_latest_payment.status = 'pending_verification' then raise exception 'Cannot cancel while payment proof is under verification'; end if;
  if v_latest_payment.status = 'approved' then raise exception 'Paid orders cannot be cancelled in the MVP'; end if;

  for v_item in
    select oi.product_id, oi.quantity, p.stock_reserved
    from public.order_items oi join public.products p on p.id = oi.product_id
    where oi.order_id = v_order.id order by p.id for update of p
  loop
    if v_item.stock_reserved < v_item.quantity then raise exception 'Reserved stock invariant failed for order %', v_order.order_number; end if;
    update public.products set stock_reserved = stock_reserved - v_item.quantity where id = v_item.product_id;
    insert into public.inventory_movements(product_id, actor_id, movement_type, quantity_delta, reserved_delta, reason, order_id)
    values (v_item.product_id, v_user, 'release', 0, -v_item.quantity, 'Reservation released after order cancellation', v_order.id);
  end loop;

  update public.orders set status = 'cancelled' where id = v_order.id;
  insert into public.order_status_history(order_id, old_status, new_status, actor_id, note)
  values (v_order.id, v_order.status, 'cancelled', v_user, 'Customer cancelled unpaid order; reservation released');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_user, 'order_cancelled', 'order', v_order.id, '{}'::jsonb);
end;
$$;

create or replace function public.ship_order(p_order_id uuid, p_tracking_number text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  if v_actor is null or not private.has_role(array['staff','admin']::public.app_role[]) then raise exception 'Staff/admin access required'; end if;
  if length(trim(coalesce(p_tracking_number, ''))) < 3 then raise exception 'A tracking number is required'; end if;
  select * into v_order from public.orders o where o.id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'processing' then raise exception 'Only processing orders can be shipped'; end if;
  update public.orders set status = 'shipped', tracking_number = trim(p_tracking_number) where id = p_order_id;
  insert into public.order_status_history(order_id, old_status, new_status, actor_id, note)
  values (p_order_id, v_order.status, 'shipped', v_actor, 'Order shipped with tracking number');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'order_shipped', 'order', p_order_id, jsonb_build_object('tracking_number', trim(p_tracking_number)));
end;
$$;

create or replace function public.confirm_order_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  if v_user is null or not private.has_role(array['customer']::public.app_role[]) then raise exception 'Active customer session required'; end if;
  select * into v_order from public.orders o where o.id = p_order_id and o.user_id = v_user for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'shipped' then raise exception 'Only shipped orders can be completed'; end if;
  update public.orders set status = 'completed' where id = p_order_id;
  insert into public.order_status_history(order_id, old_status, new_status, actor_id, note)
  values (p_order_id, v_order.status, 'completed', v_user, 'Customer confirmed order received');
end;
$$;

create or replace function public.adjust_stock(p_product_id uuid, p_quantity_delta integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_product public.products%rowtype;
  v_type public.inventory_movement_type;
begin
  if v_actor is null or not private.has_role(array['staff','admin']::public.app_role[]) then raise exception 'Staff/admin access required'; end if;
  if coalesce(p_quantity_delta, 0) = 0 then raise exception 'Stock quantity adjustment must be non-zero'; end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'A reason is required for stock adjustment'; end if;
  select * into v_product from public.products p where p.id = p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if v_product.stock_on_hand + p_quantity_delta < v_product.stock_reserved then
    raise exception 'Adjustment would reduce physical stock below reserved stock';
  end if;
  v_type := case when p_quantity_delta > 0 then 'stock_in'::public.inventory_movement_type else 'adjustment'::public.inventory_movement_type end;
  update public.products set stock_on_hand = stock_on_hand + p_quantity_delta where id = p_product_id;
  insert into public.inventory_movements(product_id, actor_id, movement_type, quantity_delta, reserved_delta, reason)
  values (p_product_id, v_actor, v_type, p_quantity_delta, 0, trim(p_reason));
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'stock_adjusted', 'product', p_product_id, jsonb_build_object('quantity_delta', p_quantity_delta, 'reason', trim(p_reason)));
end;
$$;

create or replace function public.admin_set_user_access(p_target_user_id uuid, p_role public.app_role, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not private.has_role(array['admin']::public.app_role[]) then raise exception 'Admin access required'; end if;
  if p_target_user_id = v_actor then raise exception 'Admin cannot change own role/active status through this function'; end if;
  update public.profiles set role = p_role, is_active = p_is_active where id = p_target_user_id;
  if not found then raise exception 'Target profile not found'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'user_access_changed', 'profile', p_target_user_id, jsonb_build_object('role', p_role, 'is_active', p_is_active));
end;
$$;

-- Lock down RPC execution: do not leave SECURITY DEFINER functions callable by anon/PUBLIC.
revoke all on function public.checkout_cart(text, text) from public, anon;
revoke all on function public.submit_payment_proof(uuid, text) from public, anon;
revoke all on function public.verify_simulated_payment(uuid, boolean, text) from public, anon;
revoke all on function public.cancel_pending_order(uuid) from public, anon;
revoke all on function public.ship_order(uuid, text) from public, anon;
revoke all on function public.confirm_order_received(uuid) from public, anon;
revoke all on function public.adjust_stock(uuid, integer, text) from public, anon;
revoke all on function public.admin_set_user_access(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.checkout_cart(text, text) to authenticated;
grant execute on function public.submit_payment_proof(uuid, text) to authenticated;
grant execute on function public.verify_simulated_payment(uuid, boolean, text) to authenticated;
grant execute on function public.cancel_pending_order(uuid) to authenticated;
grant execute on function public.ship_order(uuid, text) to authenticated;
grant execute on function public.confirm_order_received(uuid) to authenticated;
grant execute on function public.adjust_stock(uuid, integer, text) to authenticated;
grant execute on function public.admin_set_user_access(uuid, public.app_role, boolean) to authenticated;

-- 7. Storage buckets: product images are public; payment proof files are PRIVATE.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and private.has_role(array['admin']::public.app_role[]));
create policy product_images_admin_select on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and private.has_role(array['admin']::public.app_role[]));
create policy product_images_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and private.has_role(array['admin']::public.app_role[]))
  with check (bucket_id = 'product-images' and private.has_role(array['admin']::public.app_role[]));
create policy product_images_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and private.has_role(array['admin']::public.app_role[]));

create policy payment_proofs_upload_own_pending_order on storage.objects
  for insert to authenticated with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.user_id = (select auth.uid())
        and o.status = 'pending_payment'
    )
    and not exists (
      select 1 from public.payments p
      where p.order_id::text = (storage.foldername(name))[2]
        and p.status = 'pending_verification'
    )
  );
create policy payment_proofs_read_owner_or_staff on storage.objects
  for select to authenticated using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[2]
        and (o.user_id = (select auth.uid()) or private.has_role(array['staff','admin']::public.app_role[]))
    )
  );

commit;

-- OPERATIONAL NOTES
-- 1. Promote the initial admin manually in SQL Editor after signing up:
--    update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';
-- 2. Create product with stock_on_hand defaulting to 0; then call adjust_stock(product_id, quantity, reason).
-- 3. Upload proof to: <AUTH_USER_UUID>/<ORDER_UUID>/<random-uuid>.png
--    then call submit_payment_proof(order_id, proof_path).
-- 4. For payment approval: select public.verify_simulated_payment(payment_id, true, null).
--    For rejection: select public.verify_simulated_payment(payment_id, false, 'Bukti tidak terbaca').
-- 5. This is a baseline migration; test in a non-production Supabase project before using it.
