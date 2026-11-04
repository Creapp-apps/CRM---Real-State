# Data model: Panel del mes

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)

## Tablas existentes (reutilizadas, sin cambios de schema)

- `contratos` — ya tiene `moneda`, `honorarios_porcentaje`, `honorarios_iva`, `periodicidad_ajuste`, `estado`, fechas, `monto_inicial`.
- `actualizaciones_contrato` — `fecha`, `monto_nuevo` → define el **alquiler vigente**.
- `clientes` — `nombre`, `dni_cuit` → locador, locatario y contraparte opcional de un saldo.
- `inmuebles_administrados` — `direccion`.

> La feature **no altera** estas tablas. Todos los derivados (monto vigente, honorarios, neto, próx. actualización) se calculan en el cliente con `lib/administraciones-calc.js`.

## Tabla nueva: `saldos_cuenta` (única migración)

Movimientos informales de cuenta corriente entre la inmobiliaria y una contraparte (dueño, inquilino o tercero como "Lorena").

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `fecha` | DATE NOT NULL | fecha del movimiento |
| `concepto` | TEXT NOT NULL | descripción libre ("saldo a favor por reparación") |
| `monto` | NUMERIC(12,2) NOT NULL | siempre positivo; el signo lo da `sentido` |
| `moneda` | TEXT | CHECK ('ARS','USD'), default 'ARS' |
| `sentido` | TEXT NOT NULL | CHECK ('a_favor','en_contra') — a favor / en contra de la contraparte |
| `contraparte_cliente_id` | UUID NULL | FK → `clientes(id)` ON DELETE SET NULL |
| `contraparte_texto` | TEXT NULL | contraparte libre si no es un cliente ("Lorena") |
| `contrato_id` | UUID NULL | FK → `contratos(id)` ON DELETE SET NULL (opcional) |
| `created_at` | TIMESTAMPTZ | default NOW() |
| `updated_at` | TIMESTAMPTZ | default NOW() |

**Regla:** al menos uno de `contraparte_cliente_id` / `contraparte_texto` debe estar presente (validado en UI; CHECK a nivel DB opcional).

**Saldo acumulado** (derivado, no se guarda): por `(contraparte, moneda)` = Σ(`a_favor`) − Σ(`en_contra`). Nunca se cruzan monedas.

### Migración — `lib/migration_saldos_cuenta.sql`

```sql
-- ── Saldos / Cuentas corrientes ──
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
```

> ⚠️ Correr en Supabase antes de usar la pestaña "Saldos" (igual que el pendiente de `tasaciones`).
