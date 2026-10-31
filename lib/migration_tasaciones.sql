-- ═══════════════════════════════════════════════════════
-- CMPROP — Sistema de Tasaciones (Fase 1)
-- Amplía la tabla `tasaciones` (creada en migration_fase2_pipeline.sql)
-- para soportar el flujo completo: solicitud → tasación → ficha pública.
-- Ejecutar en Supabase SQL Editor. Idempotente.
-- ═══════════════════════════════════════════════════════

-- Por si el proyecto nunca corrió la Fase 2: crear la tabla base.
CREATE TABLE IF NOT EXISTS tasaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direccion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Datos del solicitante (del form público /tasar) ──
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS barrio TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS extras TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'manual'; -- 'web' | 'manual'

-- ── Características (algunas ya existen por Fase 2; IF NOT EXISTS las deja igual) ──
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS tipo_propiedad TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS superficie_cubierta DECIMAL(8,2);
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS superficie_total DECIMAL(8,2);
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS ambientes INTEGER;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS banos INTEGER;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS cochera BOOLEAN DEFAULT FALSE;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS antiguedad INTEGER;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS estado_conservacion TEXT DEFAULT 'Bueno';
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS zona TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- ── Valuación ──
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS ajuste_manual DECIMAL(5,2) DEFAULT 0; -- %
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS valor_estimado_usd DECIMAL(12,2);
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS valor_min_usd DECIMAL(12,2);
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS valor_max_usd DECIMAL(12,2);
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS valor_estimado_ars DECIMAL(14,2);
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS precio_m2_usd DECIMAL(8,2);
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS factores JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS comparables JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- ── Ficha / gestión ──
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'solicitada';
  -- 'solicitada' | 'en_proceso' | 'tasada' | 'enviada' | 'descartada'
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS public_token TEXT;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS tasador TEXT DEFAULT 'Mónica Cardoso';
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS validez_dias INTEGER DEFAULT 60;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE tasaciones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- `direccion` puede venir vacía desde el form web; relajar el NOT NULL.
ALTER TABLE tasaciones ALTER COLUMN direccion DROP NOT NULL;

-- Token único para la ficha pública.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasaciones_token ON tasaciones(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasaciones_estado ON tasaciones(estado);
CREATE INDEX IF NOT EXISTS idx_tasaciones_created ON tasaciones(created_at DESC);

-- RLS: mantener acceso abierto (igual que el resto del app).
ALTER TABLE tasaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access tasaciones" ON tasaciones;
CREATE POLICY "Admin full access tasaciones" ON tasaciones FOR ALL USING (true) WITH CHECK (true);
