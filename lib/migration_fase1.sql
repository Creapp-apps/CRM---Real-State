-- ═══════════════════════════════════════════════════════
-- CMPROP — FASE 1: Pagos, Punitorios y Liquidaciones
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Nuevas columnas en contratos ──
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS punitorios_tasa DECIMAL(5,2) DEFAULT 0;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS dia_vencimiento_pago INTEGER DEFAULT 10;

-- ── Pagos de alquiler ──
CREATE TABLE IF NOT EXISTS pagos_alquiler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL, -- YYYY-MM
  monto_alquiler DECIMAL(12,2) NOT NULL,
  monto_expensas DECIMAL(12,2) DEFAULT 0,
  monto_impuestos DECIMAL(12,2) DEFAULT 0,
  monto_punitorios DECIMAL(12,2) DEFAULT 0,
  monto_total DECIMAL(12,2),
  fecha_vencimiento DATE,
  fecha_pago DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','mora','parcial')),
  comprobante_url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Liquidaciones al propietario ──
CREATE TABLE IF NOT EXISTS liquidaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  monto_alquiler DECIMAL(12,2),
  honorarios DECIMAL(12,2),
  iva DECIMAL(12,2) DEFAULT 0,
  expensas DECIMAL(12,2) DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  neto_propietario DECIMAL(12,2),
  pdf_url TEXT,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','emitida','pagada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_pagos_contrato ON pagos_alquiler(contrato_id);
CREATE INDEX IF NOT EXISTS idx_pagos_periodo ON pagos_alquiler(periodo);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_alquiler(estado);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_contrato ON liquidaciones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_periodo ON liquidaciones(periodo);

-- ── RLS ──
ALTER TABLE pagos_alquiler ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access pagos" ON pagos_alquiler;
CREATE POLICY "Admin full access pagos" ON pagos_alquiler FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access liquidaciones" ON liquidaciones;
CREATE POLICY "Admin full access liquidaciones" ON liquidaciones FOR ALL USING (true) WITH CHECK (true);

-- ── Trigger updated_at ──
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
