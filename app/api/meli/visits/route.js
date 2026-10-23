// GET /api/meli/visits?id=MLA123&days=7
import { NextResponse } from 'next/server';
import { isMeliConnected, getMeliItemVisits } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

export async function GET(request) {
  if (!(await isMeliConnected())) {
    return NextResponse.json({ error: 'MELI no conectado' }, { status: 409 });
  }

  const { searchParams } = new URL(request.url);
  const id   = searchParams.get('id');
  const days = Number(searchParams.get('days') || 7);

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const visits = await getMeliItemVisits(id, days);
  return NextResponse.json(visits);
}
