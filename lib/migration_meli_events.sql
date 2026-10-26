-- Eventos de notificaciones (webhooks) de MercadoLibre.
-- Diagnóstico: cuando MELI cambia el estado de un ítem (p. ej. lo finaliza),
-- guardamos el evento acá para ver qué pasó y cuándo.

create table if not exists public.meli_events (
  id               bigint generated always as identity primary key,
  received_at      timestamptz not null default now(),
  topic            text,
  resource         text,
  application_id   text,
  meli_user_id     bigint,
  item_id          text,
  item_status      text,
  item_sub_status  text,
  raw              jsonb
);

create index if not exists meli_events_received_at_idx on public.meli_events (received_at desc);
create index if not exists meli_events_item_id_idx on public.meli_events (item_id);

-- Solo acceso vía service_role (el webhook escribe y el endpoint GET lee con esa key).
alter table public.meli_events enable row level security;
