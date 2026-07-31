-- ═══════════════════════════════════════════════════════
-- CMPROP — FASE 2: Portal del Inquilino
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Tokens de acceso al portal ──
CREATE TABLE IF NOT EXISTS portal_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('inquilino','propietario')),
  token TEXT UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Index ──
CREATE INDEX IF NOT EXISTS idx_portal_token ON portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_portal_contrato ON portal_tokens(contrato_id);

-- ── RLS ──
ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access portal_tokens" ON portal_tokens;
CREATE POLICY "Admin full access portal_tokens" ON portal_tokens FOR ALL USING (true) WITH CHECK (true);

-- ── Bucket para comprobantes (crear manualmente si no existe) ──
-- Nombre: comprobantes-pago
-- Público: NO (privado con signed URLs)
