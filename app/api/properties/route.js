import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMeliProperties, getMeliPropertyById } from '@/lib/mercadolibre';
import { ESTADO_DEFAULT } from '@/lib/estados';

export const runtime = 'nodejs';

const PAGE = 50; // máximo por búsqueda en la API de MercadoLibre
const HARD_MAX = 300; // tope de seguridad para el paginado del catálogo

const supaAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Mapa { meli_item_id: estado_comercial } de todas las publicaciones con estado guardado.
async function getEstadosMap() {
  try {
    const { data } = await supaAdmin.from('publicacion_estados').select('meli_item_id, estado_comercial');
    const map = {};
    for (const row of data || []) map[row.meli_item_id] = row.estado_comercial;
    return map;
  } catch {
    return {};
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const property = await getMeliPropertyById(id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    const estados = await getEstadosMap();
    property.estadoComercial = estados[property.id] || ESTADO_DEFAULT;
    return NextResponse.json({ property });
  }

  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const operationType = searchParams.get('operationType');
  const propertyType = searchParams.get('propertyType');

  // Público: solo publicaciones activas de ML. Paginamos en lotes de 50 (máximo de la API).
  let all = [];
  for (let offset = 0; offset < HARD_MAX; offset += PAGE) {
    const res = await getMeliProperties({ status: 'active', limit: PAGE, offset });
    if (!res.properties.length) break;
    all = all.concat(res.properties);
    if (all.length >= (res.total || 0)) break;
  }

  // Estado comercial: adjuntamos y ocultamos las 'inactiva' del público (doble seguro al filtro 'active').
  const estados = await getEstadosMap();
  let properties = all
    .map((p) => ({ ...p, estadoComercial: estados[p.id] || ESTADO_DEFAULT }))
    .filter((p) => p.estadoComercial !== 'inactiva');

  // Filtros opcionales: en ML se derivan de los atributos, así que filtramos tras normalizar.
  if (operationType) properties = properties.filter((p) => p.operationType === operationType);
  if (propertyType) properties = properties.filter((p) => (p.type || '').toLowerCase() === propertyType.toLowerCase());
  properties = properties.slice(0, limit);

  return NextResponse.json({ properties, total: properties.length });
}
