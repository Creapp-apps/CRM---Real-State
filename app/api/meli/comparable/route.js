// API: arma un comparable a partir del link de CUALQUIER publicación de ML.
// GET /api/meli/comparable?url=<link de mercadolibre>
//
// Dos caminos:
//   1) API oficial de ML (solo funciona para publicaciones de la cuenta propia).
//   2) Fallback: scraping de la página pública (OG + JSON-LD) — necesario porque ML
//      devuelve 403 al leer por API los avisos de OTROS vendedores (que es justo
//      lo que se usa como comparable).

import { NextResponse } from 'next/server';
import { getMeliPropertyById, isMeliConnected } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

const ID_RE = /\bML[A-Z]-?\d{6,}\b/i;

function extractId(text) {
  const m = String(text || '').match(ID_RE);
  return m ? m[0].replace('-', '').toUpperCase() : null;
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// Lee la página pública y arma el comparable desde las metas OG + JSON-LD.
async function scrapeListing(url) {
  let html;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const meta = (prop) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i');
    const m = html.match(re);
    return m ? decodeEntities(m[1]) : null;
  };

  const title = meta('og:title');
  const image = meta('og:image');

  // Precio y moneda desde JSON-LD (<script type="application/ld+json">).
  let price = null;
  let currency = null;
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const offers = node?.offers && (Array.isArray(node.offers) ? node.offers[0] : node.offers);
        if (offers?.price) {
          price = Number(offers.price);
          currency = offers.priceCurrency || null;
          break;
        }
      }
    } catch {
      // seguimos con el próximo bloque
    }
    if (price) break;
  }
  // Fallback: metas itemprop de precio.
  if (!price) {
    const mp = html.match(/itemprop=["']price["'][^>]*content=["']([\d.]+)["']/i);
    if (mp) price = Number(mp[1]);
    const mc = html.match(/itemprop=["']priceCurrency["'][^>]*content=["']([A-Z]{3})["']/i);
    if (mc) currency = mc[1];
  }

  if (!title && !image && !price) return null;

  const isUSD = (currency || '').toUpperCase() === 'USD';
  return {
    comparable: {
      direccion: title || '',
      tipo: '',
      m2: null,
      ambientes: null,
      precio: isUSD ? price || null : null,
      foto: image || '',
      fuente: 'MercadoLibre',
      link: url,
    },
    currency,
    priceLoaded: isUSD,
  };
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

  // 1) Intentar sacar el id del link directo; si no, seguir el redirect.
  let id = extractId(url);
  if (!id) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      id = extractId(res.url);
      if (!id) id = extractId(await res.text());
    } catch {
      // seguimos; intentamos por scraping igual
    }
  }

  // 2) API oficial: solo trae publicaciones de la cuenta propia.
  if (id && (await isMeliConnected())) {
    const property = await getMeliPropertyById(id);
    if (property) {
      const isUSD = property.currency === 'USD';
      const comparable = {
        direccion: property.address || property.title || '',
        tipo: property.type || '',
        m2: property.coveredArea || property.totalArea || null,
        ambientes: property.bedrooms || null,
        precio: isUSD ? property.price || null : null,
        foto: Array.isArray(property.images) ? property.images[0] : '',
        fuente: 'MercadoLibre',
        link: property.publicUrl || url,
      };
      return NextResponse.json({ comparable, currency: property.currency, priceLoaded: isUSD });
    }
  }

  // 3) Fallback: scraping de la página pública (avisos de otros vendedores → API 403).
  const scraped = await scrapeListing(url);
  if (scraped) {
    return NextResponse.json(scraped);
  }

  return NextResponse.json(
    { error: 'No se pudo leer la publicación. Pegá el link directo del aviso (el que abre la publicación del vendedor), o cargá el comparable a mano.' },
    { status: 404 },
  );
}
