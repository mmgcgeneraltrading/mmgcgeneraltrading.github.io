-- MMGC Admin Dashboard schema v1. Run once in the existing Supabase project's SQL Editor.
-- IMPORTANT: Only the project owner should grant the first admin role (instructions below).
create extension if not exists pgcrypto;

create table if not exists public.mmgc_admin_users(
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'admin' check(role in ('admin')),
 created_at timestamptz not null default now()
);
alter table public.mmgc_admin_users enable row level security;
revoke all on public.mmgc_admin_users from anon, authenticated;
grant select on public.mmgc_admin_users to authenticated;
drop policy if exists mmgc_admin_self_read on public.mmgc_admin_users;
create policy mmgc_admin_self_read on public.mmgc_admin_users for select to authenticated
 using (user_id = (select auth.uid()));

-- Separate, fixed-privilege function: no user can grant themselves admin status.
create or replace function public.mmgc_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.mmgc_admin_users
                where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.mmgc_is_admin() from public;
grant execute on function public.mmgc_is_admin() to authenticated, anon;

create table if not exists public.mmgc_admin_products(
 id uuid primary key default gen_random_uuid(),
 source_id text unique,
 name text not null check(length(trim(name)) between 2 and 180),
 category text not null default 'general-supplies',
 description text not null default '',
 image_url text,
 product_url text,
 price_lsl numeric(14,2) check(price_lsl is null or price_lsl >= 0),
 price_note text not null default '',
 supplier text not null default '',
 stock_status text not null default 'enquiry' check(stock_status in ('enquiry','available','preorder','unavailable')),
 authorization_status text not null default 'unverified' check(authorization_status in ('unverified','pending','authorized','not_required')),
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.mmgc_admin_products enable row level security;
revoke all on public.mmgc_admin_products from anon, authenticated;
grant select on public.mmgc_admin_products to anon, authenticated;
grant insert,update,delete on public.mmgc_admin_products to authenticated;
drop policy if exists mmgc_products_public_read on public.mmgc_admin_products;
drop policy if exists mmgc_products_admin_read on public.mmgc_admin_products;
drop policy if exists mmgc_products_admin_insert on public.mmgc_admin_products;
drop policy if exists mmgc_products_admin_update on public.mmgc_admin_products;
drop policy if exists mmgc_products_admin_delete on public.mmgc_admin_products;
create policy mmgc_products_public_read on public.mmgc_admin_products for select to anon, authenticated
 using (published = true);
create policy mmgc_products_admin_read on public.mmgc_admin_products for select to authenticated
 using ((select public.mmgc_is_admin()));
create policy mmgc_products_admin_insert on public.mmgc_admin_products for insert to authenticated
 with check ((select public.mmgc_is_admin()));
create policy mmgc_products_admin_update on public.mmgc_admin_products for update to authenticated
 using ((select public.mmgc_is_admin())) with check ((select public.mmgc_is_admin()));
create policy mmgc_products_admin_delete on public.mmgc_admin_products for delete to authenticated
 using ((select public.mmgc_is_admin()));

create table if not exists public.mmgc_enquiries(
 id uuid primary key default gen_random_uuid(),
 customer_name text not null check(length(trim(customer_name)) between 2 and 150),
 customer_email text,
 customer_phone text,
 subject text not null check(length(trim(subject)) between 2 and 200),
 details text not null default '',
 source text not null default 'manual',
 status text not null default 'new' check(status in ('new','contacted','quoted','closed')),
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.mmgc_enquiries enable row level security;
revoke all on public.mmgc_enquiries from anon, authenticated;
grant select,insert,update,delete on public.mmgc_enquiries to authenticated;
drop policy if exists mmgc_enquiries_admin_only on public.mmgc_enquiries;
create policy mmgc_enquiries_admin_only on public.mmgc_enquiries for all to authenticated
 using ((select public.mmgc_is_admin())) with check ((select public.mmgc_is_admin()));
-- There is deliberately no public insert policy. Enquiries can be entered by MMGC staff.
-- Connect public web forms only through a future server-side, rate-limited, bot-protected endpoint.

create table if not exists public.mmgc_suppliers(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 2 and 160),
 brands text not null default '',
 contact_email text,
 contact_person text,
 website text,
 authorization_status text not null default 'requested' check(authorization_status in ('researching','requested','applied','pending','authorized','declined','expired')),
 authorized_territory text not null default '',
 approval_reference text,
 approval_expires_on date,
 approved_price_list_url text,
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.mmgc_suppliers enable row level security;
revoke all on public.mmgc_suppliers from anon, authenticated;
grant select,insert,update,delete on public.mmgc_suppliers to authenticated;
drop policy if exists mmgc_suppliers_admin_only on public.mmgc_suppliers;
create policy mmgc_suppliers_admin_only on public.mmgc_suppliers for all to authenticated
 using ((select public.mmgc_is_admin())) with check ((select public.mmgc_is_admin()));

create table if not exists public.mmgc_quotations(
 id uuid primary key default gen_random_uuid(),
 quote_number text unique not null,
 customer_name text not null check(length(trim(customer_name)) between 2 and 160),
 customer_email text,
 customer_phone text,
 issue_date date not null default current_date,
 expires_on date,
 currency text not null default 'LSL' check(currency in ('LSL','ZAR')),
 items jsonb not null default '[]'::jsonb check(jsonb_typeof(items) = 'array'),
 subtotal numeric(14,2) not null default 0 check(subtotal>=0),
 tax numeric(14,2) not null default 0 check(tax>=0),
 total numeric(14,2) not null default 0 check(total>=0),
 status text not null default 'draft' check(status in ('draft','sent','accepted','declined','expired')),
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.mmgc_quotations enable row level security;
revoke all on public.mmgc_quotations from anon, authenticated;
grant select,insert,update,delete on public.mmgc_quotations to authenticated;
drop policy if exists mmgc_quotations_admin_only on public.mmgc_quotations;
create policy mmgc_quotations_admin_only on public.mmgc_quotations for all to authenticated
 using ((select public.mmgc_is_admin())) with check ((select public.mmgc_is_admin()));

-- Keep updated_at current for auditability.
create or replace function public.mmgc_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
do $$
declare t text;
begin
 foreach t in array array['mmgc_admin_products','mmgc_enquiries','mmgc_suppliers','mmgc_quotations'] loop
   execute format('drop trigger if exists mmgc_touch on public.%I',t);
   execute format('create trigger mmgc_touch before update on public.%I for each row execute function public.mmgc_touch_updated_at()',t);
 end loop;
end $$;

-- Admin bootstrap, to run MANUALLY after confirming the account's UUID in
-- Supabase > Authentication > Users (never from a public signup form):
-- insert into public.mmgc_admin_users(user_id,role)
-- values ('REPLACE-WITH-YOUR-VERIFIED-AUTH-USER-UUID'::uuid, 'admin')
-- on conflict(user_id) do nothing;
-- DO NOT embed service_role keys, grant everyone admin or remove RLS.
