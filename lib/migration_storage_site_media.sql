-- Policies de Storage para el bucket `site-media`
-- Habilitan subir / actualizar / borrar / leer con la anon key.
-- Fase actual: escritura abierta (coherente con el resto del admin).
-- TODO futuro: restringir insert/update/delete a rol admin cuando exista auth real.
-- Ejecutar en Supabase → SQL Editor.

-- storage.objects ya tiene RLS habilitado por Supabase; solo agregamos policies.

DROP POLICY IF EXISTS "site-media read" ON storage.objects;
CREATE POLICY "site-media read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site-media insert" ON storage.objects;
CREATE POLICY "site-media insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site-media update" ON storage.objects;
CREATE POLICY "site-media update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-media') WITH CHECK (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site-media delete" ON storage.objects;
CREATE POLICY "site-media delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-media');
