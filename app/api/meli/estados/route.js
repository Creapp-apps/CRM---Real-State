// Estado comercial de las publicaciones (tabla publicacion_estados en Supabase).
// Concepto propio de CMPROP: Disponible/Reservado/Vendido/Concretado/Inactiva.
// La regla 'inactiva' -> pausar en ML se aplica en la Fase 2 (al guardar desde el admin).
//
//   GET                  -> { estados: { [meli_item_id]: estado } }  (todas las filas)
//   GET ?id=MLA123       -> { estado }                               (default 'disponible')
//   PUT { id, estado }   -> { ok, id, estado }                       (upsert)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ESTADO_DEFAULT, isEstadoValido } from '@/lib/estados';
import { getMeliItemStatus, updateMeliItem } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data, error } = await admin
      .from('publicacion_estados')
      .select('estado_comercial')
      .eq('meli_item_id', id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ estado: data?.estado_comercial || ESTADO_DEFAULT });
  }

  const { data, error } = await admin
    .from('publicacion_estados')
    .select('meli_item_id, estado_comercial');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const estados = {};
  for (const row of data || []) estados[row.meli_item_id] = row.estado_comercial;
  return NextResponse.json({ estados });
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const id = body?.id;
  const estado = body?.estado;
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  if (!isEstadoValido(estado)) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });

  // 1) Persistimos el estado comercial primero (fuente de verdad propia).
  const { error } = await admin
    .from('publicacion_estados')
    .upsert(
      { meli_item_id: id, estado_comercial: estado, updated_at: new Date().toISOString() },
      { onConflict: 'meli_item_id' },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2) Regla única de sync con ML (best-effort): 'inactiva' pausa; salir de 'inactiva' reactiva.
  //    Nunca tocamos una publicación 'closed'. Si ML falla, el estado igual quedó guardado.
  let meliStatus = null;
  let meliWarning = null;
  try {
    const current = await getMeliItemStatus(id); // 'active' | 'paused' | 'closed' | null
    if (estado === 'inactiva' && current === 'active') {
      await updateMeliItem(id, { status: 'paused' });
      meliStatus = 'paused';
    } else if (estado !== 'inactiva' && current === 'paused') {
      await updateMeliItem(id, { status: 'active' });
      meliStatus = 'active';
    } else {
      meliStatus = current;
    }
  } catch (e) {
    meliWarning = e.message;
  }

  return NextResponse.json({ ok: true, id, estado, meliStatus, meliWarning });
}
