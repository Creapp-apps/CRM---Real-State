// API: arma un comparable a partir del link de CUALQUIER publicación de ML.
// GET /api/meli/comparable?url=<link de mercadolibre>
// Extrae el item id (MLA…) del link —siguiendo el redirect si es un link corto—
// y devuelve los datos normalizados para cargar como comparable en una tasación.

import { NextResponse } from 'next/server';
import { getMeliPropertyById, isMeliConnected } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

const ID_RE = /\bML[A-Z]-?\d{6,}\b/i;

function extractId(text) {
  const m = String(text || '').match(ID_RE);
  return m ? m[0].replace('-', '').toUpperCase() : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Falta el link de MercadoLibre' }, { status: 400 });
  }
  if (!/mercadolibre|mercadolivre|melistatic/i.test(url)) {
    return NextResponse.json({ error: 'El link no parece de MercadoLibre' }, { status: 400 });
  }
  if (!(await isMeliConnected())) {
    return NextResponse.json({ error: 'MercadoLibre no está conectado', connected: false }, { status: 409 });
  }

  // 1) Intentar sacar el id del link directo.
  let id = extractId(url);

  // 2) Links cortos / de catálogo: seguir el redirect y buscar en la URL final y el HTML.
  if (!id) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      id = extractId(res.url);
      if (!id) {
        const html = await res.text();
        id = extractId(html);
      }
    } catch {
      // seguimos; devolvemos error abajo
    }
  }

  if (!id) {
    return NextResponse.json(
      { error: 'No se pudo identificar la publicación. Pegá el link directo del aviso (el que abre la publicación del vendedor).' },
      { status: 422 }
    );
  }

  const property = await getMeliPropertyById(id);
  if (!property) {
    return NextResponse.json({ error: 'No se encontró la publicación en MercadoLibre' }, { status: 404 });
  }

  const isUSD = property.currency === 'USD';
  const comparable = {
    direccion: property.address || property.title || '',
    tipo: property.type || '',
    m2: property.coveredArea || property.totalArea || null,
    ambientes: property.bedrooms || null,
    // El comparable se expresa en USD; si la publicación está en pesos, no cargamos
    // el precio para no mezclar monedas (Mónica puede completarlo a mano).
    precio: isUSD ? property.price || null : null,
    foto: Array.isArray(property.images) ? property.images[0] : '',
    fuente: 'MercadoLibre',
    link: property.publicUrl || url,
  };

  return NextResponse.json({ comparable, currency: property.currency, priceLoaded: isUSD });
}
