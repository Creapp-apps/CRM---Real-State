// API Route: fetch IPC index data from datos.gob.ar (INDEC official)
// GET /api/indices?tipo=IPC&limit=24

import { NextResponse } from 'next/server';

const SERIES_IDS = {
  IPC: '148.3_INIVELNAL_DICI_M_26', // IPC Nivel General Nacional, base dic 2016
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'IPC';
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 120);

  const serieId = SERIES_IDS[tipo];
  if (!serieId) {
    return NextResponse.json({ error: `Índice "${tipo}" no soportado` }, { status: 400 });
  }

  try {
    const url = `https://apis.datos.gob.ar/series/api/series/?ids=${serieId}&limit=${limit}&sort=desc&format=json`;
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // cache 24h server-side
      headers: { 'User-Agent': 'CMPROP-Admin/1.0' },
    });

    if (!res.ok) throw new Error(`datos.gob.ar responded ${res.status}`);

    const json = await res.json();

    // Transform to a cleaner format
    const data = (json.data || []).map(([fecha, valor]) => ({
      periodo: fecha.slice(0, 7), // YYYY-MM
      valor: valor,
    }));

    return NextResponse.json({
      tipo,
      fuente: 'INDEC - datos.gob.ar',
      actualizacion: data[0]?.periodo || null,
      data,
    });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo obtener el índice: ' + error.message }, { status: 502 });
  }
}
