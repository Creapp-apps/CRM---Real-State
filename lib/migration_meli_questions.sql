-- ═══════════════════════════════════════════════════════
-- CMPROP — Interesados de MercadoLibre (preguntas) → Pipeline
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Preguntas recibidas en las publicaciones (interesados) ──
-- Se sincronizan desde la API de MELI (/questions/search) y por webhook
-- (tópico questions). Guardamos el estado propio del CRM para la bandeja.
CREATE TABLE IF NOT EXISTS meli_questions (
  id              BIGINT PRIMARY KEY,                 -- id de la pregunta en MELI
  item_id         TEXT,                               -- MLA de la publicación
  item_title      TEXT,                               -- título cacheado para mostrar
  item_permalink  TEXT,
  item_operation  TEXT,                               -- venta / alquiler / temporario (best-effort)
  buyer_id        BIGINT,
  buyer_nickname  TEXT,
  text            TEXT,                               -- la consulta del interesado
  status          TEXT,                               -- estado MELI: UNANSWERED / ANSWERED / CLOSED_UNANSWERED / BANNED
  answer_text     TEXT,
  answer_date     TIMESTAMPTZ,
  date_created    TIMESTAMPTZ,                        -- fecha de la pregunta en MELI
  crm_status      TEXT DEFAULT 'nuevo'                -- flujo propio: nuevo / volcado / archivado
                  CHECK (crm_status IN ('nuevo','volcado','archivado')),
  opportunity_id  UUID REFERENCES oportunidades(id) ON DELETE SET NULL,
  received_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  raw             JSONB
);

CREATE INDEX IF NOT EXISTS idx_meli_questions_crm_status ON meli_questions(crm_status);
CREATE INDEX IF NOT EXISTS idx_meli_questions_item ON meli_questions(item_id);
CREATE INDEX IF NOT EXISTS idx_meli_questions_date ON meli_questions(date_created DESC);

-- RLS permisiva (igual que oportunidades/clientes: el admin usa el cliente anon;
-- la sincronización y las respuestas van por API con service_role).
ALTER TABLE meli_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access meli_questions" ON meli_questions;
CREATE POLICY "Admin full access meli_questions" ON meli_questions FOR ALL USING (true) WITH CHECK (true);

-- ── Oportunidades: metadatos de origen (para volcar interesados de MELI) ──
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'manual';          -- manual / mercadolibre
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS meli_item_id TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS titulo_propiedad TEXT;                  -- título de la publicación (cuando no hay inmueble_id)
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS contacto_nombre TEXT;                   -- nombre/nickname del interesado (cuando no hay cliente_id)
