-- Sistema de contenido editable del sitio (Fase 1)
CREATE TABLE IF NOT EXISTS site_settings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_slug TEXT UNIQUE NOT NULL,
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Fase 1: políticas permisivas (coherentes con el resto del admin actual).
-- TODO futuro: restringir "write" a rol admin cuando exista auth real.
DROP POLICY IF EXISTS "site_settings read" ON site_settings;
CREATE POLICY "site_settings read" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "site_settings write" ON site_settings;
CREATE POLICY "site_settings write" ON site_settings FOR ALL USING (true) WITH CHECK (true);

-- trigger_set_timestamp() ya existe en migration_fase1; se re-crea por si esta
-- migration se corre de forma independiente (idempotente).
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_site_settings ON site_settings;
CREATE TRIGGER set_timestamp_site_settings
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Seed del tenant cardoso (vacío => la web usa defaults hasta que se edite).
INSERT INTO site_settings (tenant_slug, content, theme)
VALUES ('cardoso', '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (tenant_slug) DO NOTHING;
