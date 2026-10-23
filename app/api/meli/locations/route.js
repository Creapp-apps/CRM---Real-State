// GET /api/meli/locations
// Proxy para classified_locations de MELI (no requiere auth).
// ?type=states                 → provincias de Argentina
// ?type=cities&stateId=...     → ciudades de una provincia
// ?type=neighborhoods&cityId=... → barrios de una ciudad

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BASE = 'https://api.mercadolibre.com/classified_locations';

async function classifiedGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 86400 }, // 24 h cache — datos casi estáticos
  });
  if (!res.ok) throw new Error(`classified_locations ${path} → ${res.status}`);
  return res.json();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'states') {
      const data = await classifiedGet('/countries/AR');
      const states = (data.states || []).map(s => ({ id: s.id, name: s.name }));
      return NextResponse.json({ states });
    }

    if (type === 'cities') {
      const stateId = searchParams.get('stateId');
      if (!stateId) return NextResponse.json({ error: 'stateId requerido' }, { status: 400 });
      const data = await classifiedGet(`/states/${stateId}`);
      const cities = (data.cities || []).map(c => ({ id: c.id, name: c.name }));
      return NextResponse.json({ cities });
    }

    if (type === 'neighborhoods') {
      const cityId = searchParams.get('cityId');
      if (!cityId) return NextResponse.json({ error: 'cityId requerido' }, { status: 400 });
      const data = await classifiedGet(`/cities/${cityId}`);
      const neighborhoods = (data.neighborhoods || []).map(n => ({ id: n.id, name: n.name }));
      return NextResponse.json({ neighborhoods });
    }

    return NextResponse.json({ error: 'type requerido: states|cities|neighborhoods' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
