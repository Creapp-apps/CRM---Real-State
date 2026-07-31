-- ═══════════════════════════════════════════════════════
-- CMPROP — FASE 2: Pipeline + Tasador
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Oportunidades (Pipeline) ──
CREATE TABLE IF NOT EXISTS oportunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('venta','alquiler')),
  inmueble_id UUID REFERENCES inmuebles_administrados(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  etapa TEXT DEFAULT 'consulta' CHECK (etapa IN ('consulta','visita','oferta','reserva','firma','cerrado','perdido')),
  monto_estimado DECIMAL(12,2),
  moneda TEXT DEFAULT 'ARS',
  agente TEXT,
  notas TEXT,
  fecha_consulta DATE DEFAULT CURRENT_DATE,
  fecha_cierre DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tasaciones ──
CREATE TABLE IF NOT EXISTS tasaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direccion TEXT NOT NULL,
  tipo_propiedad TEXT,
  superficie_cubierta DECIMAL(8,2),
  superficie_total DECIMAL(8,2),
  ambientes INTEGER,
  banos INTEGER,
  cochera BOOLEAN DEFAULT FALSE,
  antiguedad INTEGER,
  estado_conservacion TEXT DEFAULT 'bueno',
  zona TEXT,
  valor_estimado_usd DECIMAL(12,2),
  valor_estimado_ars DECIMAL(14,2),
  precio_m2_usd DECIMAL(8,2),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa ON oportunidades(etapa);
CREATE INDEX IF NOT EXISTS idx_oportunidades_tipo ON oportunidades(tipo);

-- ── RLS ──
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access oportunidades" ON oportunidades;
CREATE POLICY "Admin full access oportunidades" ON oportunidades FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access tasaciones" ON tasaciones;
CREATE POLICY "Admin full access tasaciones" ON tasaciones FOR ALL USING (true) WITH CHECK (true);
