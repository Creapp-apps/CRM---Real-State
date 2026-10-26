// GET /api/meli/attributes?category=MLAxxxx
// Devuelve los atributos publicables de una categoría MELI, resolviendo primero
// el leaf real (algunas categorías de venta son nodos intermedios que se bifurcan
// en "Emprendimientos" vs "Propiedades Individuales"). Replica el form de MELI:
// agrupa por attribute_group_name, marca requeridos y oculta los hidden/read_only.

import { NextResponse } from 'next/server';
import { isMeliConnected, getValidToken } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

async function meliGet(path) {
  const { accessToken } = await getValidToken();
  const res = await fetch(`https://api.mercadolibre.com${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`MELI ${path} → HTTP ${res.status}`);
  return res.json();
}

// Si la categoría no es publicable, baja al hijo "Propiedades Individuales"
// (publicación de inmueble individual, no emprendimiento).
async function resolveLeaf(categoryId) {
  const cat = await meliGet(`/categories/${categoryId}`);
  if (cat?.settings?.listing_allowed !== false) return categoryId;
  const children = cat.children_categories || [];
  const individual = children.find(c => /individual/i.test(c.name)) || children[0];
  return individual ? individual.id : categoryId;
}

// Orden de grupos como los muestra MELI (lo que no esté acá va al final).
const GROUP_ORDER = ['Principales', 'Ficha técnica', 'Ambientes', 'Comodidades y amenities', 'Características adicionales', 'Servicios', 'Seguridad', 'Otros'];

export async function GET(request) {
  if (!(await isMeliConnected())) {
    return NextResponse.json({ error: 'MELI no conectado' }, { status: 409 });
  }
  const categoryId = new URL(request.url).searchParams.get('category');
  if (!categoryId) {
    return NextResponse.json({ error: 'Falta ?category' }, { status: 400 });
  }

  try {
    const leafId = await resolveLeaf(categoryId);
    const raw = await meliGet(`/categories/${leafId}/attributes`);

    const visible = (Array.isArray(raw) ? raw : []).filter(a => {
      const t = a.tags || {};
      return !t.hidden && !t.read_only && !t.fixed; // fixed = operación/tipo, lo ponemos nosotros
    });

    const attributes = visible.map(a => {
      const t = a.tags || {};
      return {
        id: a.id,
        name: a.name,
        valueType: a.value_type,               // string | list | boolean | number | number_unit
        required: !!t.required,
        multivalued: !!t.multivalued,
        group: a.attribute_group_name || 'Otros',
        hint: a.hint || null,
        values: (a.values || []).map(v => ({ id: v.id, name: v.name })),
        units: (a.allowed_units || []).map(u => ({ id: u.id, name: u.name })),
        defaultUnit: a.default_unit || (a.allowed_units?.[0]?.id ?? null),
        maxLength: a.value_max_length || null,
      };
    });

    // Agrupar respetando el orden de MELI, requeridos primero dentro de cada grupo.
    const groupsMap = {};
    for (const a of attributes) {
      (groupsMap[a.group] = groupsMap[a.group] || []).push(a);
    }
    const groups = Object.entries(groupsMap)
      .sort((x, y) => {
        const ix = GROUP_ORDER.indexOf(x[0]); const iy = GROUP_ORDER.indexOf(y[0]);
        return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy);
      })
      .map(([name, items]) => ({
        name,
        attributes: items.sort((a, b) => (b.required - a.required)),
      }));

    return NextResponse.json({ categoryId, leafId, groups });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
