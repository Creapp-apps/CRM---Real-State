-- ============================================
-- SALDOS / CUENTAS CORRIENTES — Supabase Migration
-- Cardoso Propiedades · módulo Administraciones (Panel del mes, Fase 3)
-- ============================================
-- Movimientos informales de cuenta corriente entre la inmobiliaria y una
-- contraparte (dueño, inquilino o tercero como "Lorena"). El saldo acumulado
-- se calcula por (contraparte, moneda); nunca se cruzan monedas.

CREATE TABLE IF NOT EXISTS saldos_cuenta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  sentido TEXT NOT NULL CHECK (sentido IN ('a_favor', 'en_contra')),
  contraparte_cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  contraparte_texto TEXT,
  contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT contraparte_presente CHECK (
    contraparte_cliente_id IS NOT NULL OR contraparte_texto IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_saldos_contraparte ON saldos_cuenta(contraparte_cliente_id);
CREATE INDEX IF NOT EXISTS idx_saldos_contrato ON saldos_cuenta(contrato_id);

-- RLS (acceso admin, igual que el resto del módulo)
ALTER TABLE saldos_cuenta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access saldos_cuenta" ON saldos_cuenta;
CREATE POLICY "Admin full access saldos_cuenta" ON saldos_cuenta FOR ALL USING (true) WITH CHECK (true);
