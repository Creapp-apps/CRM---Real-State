-- Migración: integración MercadoLibre (OAuth tokens)
-- Guarda los tokens OAuth de la cuenta de MercadoLibre del dueño.
-- Single-tenant: normalmente hay una sola fila (la cuenta de Cardoso Propiedades).

create table if not exists meli_tokens (
  meli_user_id   bigint primary key,            -- user_id de MercadoLibre (seller)
  access_token   text        not null,
  refresh_token  text        not null,
  expires_at     timestamptz not null,          -- cuándo vence el access_token
  scope          text,
  nickname       text,                           -- nombre de la cuenta MELI (opcional)
  updated_at     timestamptz not null default now()
);

-- RLS activado: solo el service_role (server-side) puede leer/escribir.
-- El cliente anon NUNCA debe acceder a esta tabla (contiene secretos).
alter table meli_tokens enable row level security;

-- Sin políticas para anon/authenticated => acceso bloqueado salvo service_role (que bypassea RLS).

create index if not exists idx_meli_tokens_updated on meli_tokens (updated_at desc);
