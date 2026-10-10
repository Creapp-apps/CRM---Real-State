// API: publicaciones de MercadoLibre (normalizadas al shape interno de CMPROP).
// GET /api/meli/items              -> lista (status=active por defecto)
// GET /api/meli/items?id=MLA123    -> item único con descripción
// GET /api/meli/items?status=all&limit=50&offset=0

import { NextResponse } from 'next/server';
import { getMeliProperties, getMeliPropertyById, isMeliConnected } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!(await isMeliConnected())) {
    return NextResponse.json(
      { error: 'MELI no conectado', connected: false },
      { status: 409 }
    );
  }

  if (id) {
    const property = await getMeliPropertyById(id);
    if (!property) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ property });
  }

  const status = searchParams.get('status') || 'active';
  const limit = Number(searchParams.get('limit')) || 50;
  const offset = Number(searchParams.get('offset')) || 0;

  const { properties, total, error } = await getMeliProperties({ status, limit, offset });
  if (error) {
    return NextResponse.json({ error, properties: [], total: 0 }, { status: 502 });
  }
  return NextResponse.json({ properties, total });
}
