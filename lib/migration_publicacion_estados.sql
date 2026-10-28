-- Estado comercial de cada publicación de MercadoLibre.
-- Concepto propio de CMPROP (no existe en ML): Disponible/Reservado/Vendido/Inactiva.
-- Se guarda por meli_item_id. Sin fila = 'disponible'.
-- 'inactiva' es el único estado que además pausa la publicación en ML (status=paused);
-- el resto no toca ML.

create table if not exists public.publicacion_estados (
  meli_item_id     text primary key,
  estado_comercial text not null default 'disponible'
    check (estado_comercial in ('disponible', 'reservado', 'vendido', 'inactiva')),
  updated_at       timestamptz not null default now()
);

create index if not exists publicacion_estados_estado_idx
  on public.publicacion_estados (estado_comercial);

-- Solo acceso vía service_role (las rutas /api/meli/estados leen y escriben con esa key).
alter table public.publicacion_estados enable row level security;
