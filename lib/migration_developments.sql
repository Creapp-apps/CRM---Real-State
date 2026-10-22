-- Tabla de emprendimientos
create table if not exists public.developments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text,
  address text,
  description text,
  total_units integer default 0,
  price_from text,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  amenities text,
  status text not null default 'draft' check (status in ('draft', 'active', 'sold_out')),
  delivery_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.developments enable row level security;

-- Lectura pública
create policy "developments_select_public" on public.developments
  for select using (true);

-- Escritura solo service_role (admin server-side)
create policy "developments_all_service" on public.developments
  for all using (auth.role() = 'service_role');

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger developments_updated_at
  before update on public.developments
  for each row execute procedure public.set_updated_at();
