// Ruta temporal de diagnóstico — atributos reales de categorías MELI
// GET /api/meli/setup-info
import { NextResponse } from 'next/server';
import { isMeliConnected, getValidToken } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

async function meliGet(path, params = {}) {
  const { accessToken } = await getValidToken();
  const url = new URL(`https://api.mercadolibre.com${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!res.ok) return { error: `HTTP ${res.status}`, path };
  return res.json();
}

// Categorías clave para inmuebles Argentina
const KEY_CATEGORIES = [
  { key: 'casa_venta',         id: 'MLA1468' },
  { key: 'casa_alquiler',      id: 'MLA1467' },
  { key: 'dpto_venta',         id: 'MLA1474' },
  { key: 'dpto_alquiler',      id: 'MLA1473' },
  { key: 'ph_venta',           id: 'MLA105182' },
  { key: 'local_venta',        id: 'MLA79244' },
  { key: 'oficina_alquiler',   id: 'MLA50539' },
];

export async function GET() {
  if (!(await isMeliConnected())) {
    return NextResponse.json({ error: 'MELI no conectado' }, { status: 409 });
  }

  // Atributos por categoría
  const attributesByCat = {};
  for (const cat of KEY_CATEGORIES) {
    const data = await meliGet(`/categories/${cat.id}/attributes`);
    attributesByCat[cat.key] = Array.isArray(data)
      ? data.map(a => ({
          id: a.id,
          name: a.name,
          type: a.value_type,
          required: a.tags?.required ?? false,
          variation: a.tags?.variation_attribute ?? false,
          values: a.values?.slice(0, 10).map(v => ({ id: v.id, name: v.name })) || [],
          hint: a.hint || null,
        }))
      : data;
  }

  // Tipos de listado disponibles para la cuenta
  const listingTypes = await meliGet('/sites/MLA/listing_types');

  // Límites del plan (usuario)
  const { userId } = await getValidToken();
  const userInfo = await meliGet(`/users/${userId}`);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    userId,
    siteDomain: userInfo.site_id,
    listingTypes: listingTypes.map ? listingTypes.map(t => ({ id: t.id, name: t.name })) : listingTypes,
    attributesByCat,
  }, { status: 200 });
}
