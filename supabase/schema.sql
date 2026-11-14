-- LogiTrack Logistics - Supabase PostgreSQL Schema & RLS Policies
-- Run this script in your Supabase project's SQL Editor.

create extension if not exists pgcrypto;

-- 1. Profiles table linked to Supabase Auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  photo_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Shipments table
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique,
  customer text,
  origin text not null,
  destination text not null,
  status text not null default 'Pending' check (status in ('In Transit', 'Delivered', 'Pending', 'Delayed')),
  direction text not null default 'Outbound' check (direction in ('Inbound', 'Outbound')),
  estimated_arrival text,
  value numeric not null default 0,
  weight text,
  cargo_type text,
  special_handling text,
  type text default 'Standard',
  priority text default 'Normal',
  created_by uuid references auth.users(id) on delete set null,
  history jsonb not null default '[]'::jsonb,
  origin_lat double precision,
  origin_lng double precision,
  dest_lat double precision,
  dest_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Vehicles table
create table if not exists public.vehicles (
  id text primary key,
  type text not null check (type in ('Truck', 'Van', 'Ship', 'Plane')),
  status text not null default 'Active' check (status in ('Active', 'Maintenance', 'Idle')),
  location text,
  fuel_level numeric not null default 100,
  driver text not null,
  lat double precision not null,
  lng double precision not null,
  speed numeric,
  altitude numeric,
  odometer numeric,
  temperature numeric,
  tire_pressure jsonb,
  engine_oil_level numeric,
  weight_capacity text,
  volume_capacity text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Maintenance table
create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  date text not null,
  time text not null,
  service_type text not null check (service_type in ('Routine', 'Repair', 'Inspection', 'Oil Change', 'Tire Rotation')),
  notes text,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Inventory table
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  category text not null,
  quantity integer not null default 0 check (quantity >= 0),
  min_stock integer not null default 10 check (min_stock >= 0),
  location text,
  status text not null default 'In Stock' check (status in ('In Stock', 'Low Stock', 'Out of Stock')),
  value numeric not null default 0 check (value >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text,
  shipping_address text,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0 check (total_amount >= 0),
  status text not null default 'Pending' check (status in ('Pending', 'Processing', 'Fulfilled', 'Cancelled')),
  shipment_id uuid references public.shipments(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_shipments_updated_at on public.shipments;
create trigger set_shipments_updated_at before update on public.shipments for each row execute function public.set_updated_at();

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

drop trigger if exists set_maintenance_updated_at on public.maintenance;
create trigger set_maintenance_updated_at before update on public.maintenance for each row execute function public.set_updated_at();

drop trigger if exists set_inventory_updated_at on public.inventory;
create trigger set_inventory_updated_at before update on public.inventory for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- Automatically create profile on new user sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'User'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'photo_url')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.shipments enable row level security;
alter table public.vehicles enable row level security;
alter table public.maintenance enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Shipments policies (public read allowed for tracking lookup, authenticated full CRUD)
drop policy if exists "Anyone can view shipments for tracking" on public.shipments;
create policy "Anyone can view shipments for tracking" on public.shipments
  for select to anon, authenticated using (true);

drop policy if exists "Authenticated users can create shipments" on public.shipments;
create policy "Authenticated users can create shipments" on public.shipments
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Authenticated users can update shipments" on public.shipments;
create policy "Authenticated users can update shipments" on public.shipments
  for update to authenticated using (true);

drop policy if exists "Authenticated users can delete shipments" on public.shipments;
create policy "Authenticated users can delete shipments" on public.shipments
  for delete to authenticated using (true);

-- Vehicles policies
drop policy if exists "Authenticated users can view vehicles" on public.vehicles;
create policy "Authenticated users can view vehicles" on public.vehicles
  for select to authenticated using (true);

drop policy if exists "Authenticated users can create vehicles" on public.vehicles;
create policy "Authenticated users can create vehicles" on public.vehicles
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Authenticated users can update vehicles" on public.vehicles;
create policy "Authenticated users can update vehicles" on public.vehicles
  for update to authenticated using (true);

drop policy if exists "Authenticated users can delete vehicles" on public.vehicles;
create policy "Authenticated users can delete vehicles" on public.vehicles
  for delete to authenticated using (true);

-- Maintenance policies
drop policy if exists "Authenticated users can view maintenance" on public.maintenance;
create policy "Authenticated users can view maintenance" on public.maintenance
  for select to authenticated using (true);

drop policy if exists "Authenticated users can create maintenance" on public.maintenance;
create policy "Authenticated users can create maintenance" on public.maintenance
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Authenticated users can update maintenance" on public.maintenance;
create policy "Authenticated users can update maintenance" on public.maintenance
  for update to authenticated using (true);

drop policy if exists "Authenticated users can delete maintenance" on public.maintenance;
create policy "Authenticated users can delete maintenance" on public.maintenance
  for delete to authenticated using (true);

-- Inventory policies
drop policy if exists "Authenticated users can view inventory" on public.inventory;
create policy "Authenticated users can view inventory" on public.inventory
  for select to authenticated using (true);

drop policy if exists "Authenticated users can create inventory" on public.inventory;
create policy "Authenticated users can create inventory" on public.inventory
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Authenticated users can update inventory" on public.inventory;
create policy "Authenticated users can update inventory" on public.inventory
  for update to authenticated using (true);

drop policy if exists "Authenticated users can delete inventory" on public.inventory;
create policy "Authenticated users can delete inventory" on public.inventory
  for delete to authenticated using (true);

-- Orders policies
drop policy if exists "Authenticated users can view orders" on public.orders;
create policy "Authenticated users can view orders" on public.orders
  for select to authenticated using (true);

drop policy if exists "Authenticated users can create orders" on public.orders;
create policy "Authenticated users can create orders" on public.orders
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Authenticated users can update orders" on public.orders;
create policy "Authenticated users can update orders" on public.orders
  for update to authenticated using (true);

drop policy if exists "Authenticated users can delete orders" on public.orders;
create policy "Authenticated users can delete orders" on public.orders
  for delete to authenticated using (true);

-- Enable Supabase Realtime on application tables
alter publication supabase_realtime add table public.shipments;
alter publication supabase_realtime add table public.vehicles;
alter publication supabase_realtime add table public.maintenance;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.orders;
