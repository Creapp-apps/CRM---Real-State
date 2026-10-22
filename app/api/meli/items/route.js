// API: publicaciones de MercadoLibre (normalizadas al shape interno de CMPROP).
// GET /api/meli/items              -> lista (status=active por defecto)
// GET /api/meli/items?id=MLA123    -> item único con descripción
// GET /api/meli/items?status=all&limit=50&offset=0
// PUT /api/meli/items              -> { id, fields: {...}, description? }

import { NextResponse } from 'next/server';
import { getMeliProperties, getMeliPropertyById, getMeliRawItem, isMeliConnected, updateMeliItem, updateMeliDescription } from '@/lib/mercadolibre';

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

// PUT /api/meli/items
// Body: { id: "MLA123", fields: { title?, price?, currency_id?, status?, attributes? }, description? }
export async function PUT(request) {
  if (!(await isMeliConnected())) {
    return NextResponse.json({ error: 'MELI no conectado' }, { status: 409 });
  }

  const body = await request.json();
  const { id, fields, description } = body;

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }

  const errors = [];
  let updatedItem = null;

  if (fields && Object.keys(fields).length > 0) {
    try {
      updatedItem = await updateMeliItem(id, fields);
    } catch (e) {
      errors.push({ field: 'item', message: e.message });
    }
  }

  if (typeof description === 'string') {
    try {
      await updateMeliDescription(id, description);
    } catch (e) {
      errors.push({ field: 'description', message: e.message });
    }
  }

  if (errors.length > 0 && !updatedItem) {
    return NextResponse.json({ error: errors[0].message, errors }, { status: 502 });
  }

  return NextResponse.json({ success: true, errors, item: updatedItem });
}
