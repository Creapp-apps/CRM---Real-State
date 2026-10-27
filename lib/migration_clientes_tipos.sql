-- ═══════════════════════════════════════════════════════
-- CMPROP — Ampliar tipos de cliente (venta + prospectos)
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════
-- Antes: locador / locatario / ambos (solo lado alquiler).
-- Ahora: suma comprador / vendedor / prospecto (lado venta + interesados,
-- p. ej. para volcar un interesado de MercadoLibre como cliente).

ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_tipo_check;
ALTER TABLE clientes ADD CONSTRAINT clientes_tipo_check
  CHECK (tipo IN ('locador','locatario','ambos','comprador','vendedor','prospecto'));
