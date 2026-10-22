// POST /api/meli/pictures  — sube una imagen a MELI y devuelve { id, url }
// Body: multipart/form-data con campo "file"

import { NextResponse } from 'next/server';
import { isMeliConnected, uploadMeliPicture } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(await isMeliConnected())) {
    return NextResponse.json({ error: 'MELI no conectado' }, { status: 409 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ error: 'Campo "file" requerido' }, { status: 400 });
  }

  try {
    const meliForm = new FormData();
    meliForm.append('file', file);
    const data = await uploadMeliPicture(meliForm);
    // MELI devuelve { id, variations: { ... } }
    const url = data.variations?.['720x540']?.secure_url
      || data.variations?.['500x375']?.secure_url
      || Object.values(data.variations || {})[0]?.secure_url
      || null;
    return NextResponse.json({ id: data.id, url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
