-- ============================================
-- MÓDULO ADMINISTRACIONES — Supabase Migration
-- Cardoso Propiedades
-- ============================================

-- ── Clientes (Locadores / Locatarios) ──
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  dni_cuit TEXT,
  tipo TEXT NOT NULL DEFAULT 'locatario' CHECK (tipo IN ('locador', 'locatario', 'ambos')),
  telefono TEXT,
  email TEXT,
  domicilio TEXT,
  cbu TEXT,
  banco TEXT,
  titular_cuenta TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Inmuebles Administrados ──
CREATE TABLE IF NOT EXISTS inmuebles_administrados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direccion TEXT NOT NULL,
  tipo TEXT DEFAULT 'departamento' CHECK (tipo IN ('departamento', 'casa', 'local', 'oficina', 'galpon', 'terreno', 'otro')),
  superficie_cubierta NUMERIC(10,2),
  superficie_descubierta NUMERIC(10,2),
  ambientes INTEGER,
  banos INTEGER,
  cochera BOOLEAN DEFAULT FALSE,
  servicios JSONB DEFAULT '{"gas": {"activo": false, "nro_cuenta": "", "nro_cliente": "", "digito_verificador": ""}, "agua": {"activo": false, "nro_cuenta": "", "nro_cliente": "", "digito_verificador": ""}, "luz": {"activo": false, "nro_cuenta": "", "nro_cliente": "", "digito_verificador": ""}, "boleta_municipal": {"activo": false, "nro_cuenta": "", "nro_cliente": "", "digito_verificador": ""}}'::jsonb,
  estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'alquilado', 'en_mantenimiento')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Contratos ──
CREATE TABLE IF NOT EXISTS contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inmueble_id UUID REFERENCES inmuebles_administrados(id) ON DELETE SET NULL,
  locador_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  locatario_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  monto_inicial NUMERIC(12,2) NOT NULL,
  moneda TEXT DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  indice_ajuste TEXT DEFAULT 'ICL' CHECK (indice_ajuste IN ('IPC', 'ICL', 'UVA', 'personalizado')),
  periodicidad_ajuste TEXT DEFAULT 'trimestral' CHECK (periodicidad_ajuste IN ('mensual', 'bimestral', 'trimestral', 'cuatrimestral', 'semestral', 'anual')),
  honorarios_porcentaje NUMERIC(5,2) DEFAULT 0,
  honorarios_iva BOOLEAN DEFAULT FALSE,
  honorarios_notas TEXT,
  contrato_pdf_url TEXT, -- URL del PDF del contrato subido a Supabase Storage
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'vencido', 'rescindido', 'proximo_a_vencer')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚠️ IMPORTANTE: Crear bucket de Storage en Supabase Dashboard
-- Storage > New bucket > Nombre: "contratos-pdf" > Public: true

-- ── Actualizaciones de Contrato ──
CREATE TABLE IF NOT EXISTS actualizaciones_contrato (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  monto_anterior NUMERIC(12,2) NOT NULL,
  monto_nuevo NUMERIC(12,2) NOT NULL,
  indice_usado TEXT NOT NULL,
  valor_indice_inicio NUMERIC(12,4),
  valor_indice_fin NUMERIC(12,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices de Actualización ──
CREATE TABLE IF NOT EXISTS indices_actualizacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('IPC', 'ICL', 'UVA')),
  periodo TEXT NOT NULL, -- format YYYY-MM
  valor NUMERIC(12,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tipo, periodo)
);

-- ── Expensas ──
CREATE TABLE IF NOT EXISTS expensas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  inmueble_id UUID REFERENCES inmuebles_administrados(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ordinaria', 'extraordinaria')),
  concepto TEXT,
  monto NUMERIC(12,2) NOT NULL,
  periodo TEXT NOT NULL, -- format YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Impuestos Regionales / Municipales ──
CREATE TABLE IF NOT EXISTS impuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inmueble_id UUID REFERENCES inmuebles_administrados(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, -- e.g. 'Municipal', 'ABL', 'Tasa servicios', etc.
  monto NUMERIC(12,2) NOT NULL,
  periodo TEXT NOT NULL, -- format YYYY-MM
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente')),
  fecha_vencimiento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON clientes(tipo);
CREATE INDEX IF NOT EXISTS idx_clientes_dni_cuit ON clientes(dni_cuit);
CREATE INDEX IF NOT EXISTS idx_contratos_estado ON contratos(estado);
CREATE INDEX IF NOT EXISTS idx_contratos_fecha_fin ON contratos(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_contratos_inmueble ON contratos(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_contratos_locador ON contratos(locador_id);
CREATE INDEX IF NOT EXISTS idx_contratos_locatario ON contratos(locatario_id);
CREATE INDEX IF NOT EXISTS idx_actualizaciones_contrato ON actualizaciones_contrato(contrato_id);
CREATE INDEX IF NOT EXISTS idx_indices_tipo_periodo ON indices_actualizacion(tipo, periodo);
CREATE INDEX IF NOT EXISTS idx_expensas_contrato ON expensas(contrato_id);
CREATE INDEX IF NOT EXISTS idx_expensas_periodo ON expensas(periodo);
CREATE INDEX IF NOT EXISTS idx_impuestos_inmueble ON impuestos(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_impuestos_estado ON impuestos(estado);

-- ── Updated_at trigger ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clientes_updated_at') THEN
    CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inmuebles_admin_updated_at') THEN
    CREATE TRIGGER trg_inmuebles_admin_updated_at BEFORE UPDATE ON inmuebles_administrados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contratos_updated_at') THEN
    CREATE TRIGGER trg_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ── RLS Policies (public access for admin — adjust for production) ──
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmuebles_administrados ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE actualizaciones_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE indices_actualizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE expensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE impuestos ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin)
DROP POLICY IF EXISTS "Admin full access clientes" ON clientes;
CREATE POLICY "Admin full access clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access inmuebles" ON inmuebles_administrados;
CREATE POLICY "Admin full access inmuebles" ON inmuebles_administrados FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access contratos" ON contratos;
CREATE POLICY "Admin full access contratos" ON contratos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access actualizaciones" ON actualizaciones_contrato;
CREATE POLICY "Admin full access actualizaciones" ON actualizaciones_contrato FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access indices" ON indices_actualizacion;
CREATE POLICY "Admin full access indices" ON indices_actualizacion FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access expensas" ON expensas;
CREATE POLICY "Admin full access expensas" ON expensas FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access impuestos" ON impuestos;
CREATE POLICY "Admin full access impuestos" ON impuestos FOR ALL USING (true) WITH CHECK (true);
