import { NextResponse } from 'next/server';
import { getMeliProperties, getMeliPropertyById } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

const PAGE = 50; // máximo por búsqueda en la API de MercadoLibre
const HARD_MAX = 300; // tope de seguridad para el paginado del catálogo

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const property = await getMeliPropertyById(id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
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

  // Solo se publican las activas de ML (una publicación pausada no sale del aire).
  let properties = all;

  // Filtros opcionales: en ML se derivan de los atributos, así que filtramos tras normalizar.
  if (operationType) properties = properties.filter((p) => p.operationType === operationType);
  if (propertyType) properties = properties.filter((p) => (p.type || '').toLowerCase() === propertyType.toLowerCase());
  properties = properties.slice(0, limit);

  return NextResponse.json({ properties, total: properties.length });
}
