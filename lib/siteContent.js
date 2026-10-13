import { supabase } from '@/lib/supabase';
import { CONTENT_DEFAULTS, THEME_DEFAULTS, withDefaults } from '@/lib/content/defaults';

const DEFAULT_TENANT = 'cardoso';

export async function getSiteContent(tenant = DEFAULT_TENANT) {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('content, theme')
      .eq('tenant_slug', tenant)
      .maybeSingle();
    if (error) throw error;
    return {
      content: withDefaults(data?.content, CONTENT_DEFAULTS),
      theme: withDefaults(data?.theme, THEME_DEFAULTS),
    };
  } catch (e) {
    // Resiliencia: la web nunca rompe por contenido. Cae a defaults.
    console.error('[siteContent] getSiteContent fallo, usando defaults:', e?.message || e);
    return {
      content: withDefaults(undefined, CONTENT_DEFAULTS),
      theme: withDefaults(undefined, THEME_DEFAULTS),
    };
  }
}

export async function saveSiteContent(tenant, { content, theme }) {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { tenant_slug: tenant, content, theme, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_slug' }
      );
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || 'Error desconocido al guardar' };
  }
}
