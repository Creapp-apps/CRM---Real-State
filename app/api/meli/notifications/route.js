// Webhook de notificaciones de MercadoLibre.
// MELI hace POST acá cuando cambia algo de la cuenta (ítems, moderaciones, etc.).
// Guardamos cada evento en `meli_events` para diagnosticar por qué se finalizan
// las publicaciones (p. ej. una ficha que se cierra 2s después de crearse).
//
// Configurar en DevCenter → Notificaciones:
//   Callback URL: https://www.cardosopropiedades.com.ar/api/meli/notifications
//   Tópicos: items  (y moderations / orders si se quiere)
//
// Ver eventos: GET /api/meli/notifications?key=MELI_CONNECT_SECRET

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidToken } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: true }); }

  // MELI manda: { resource, user_id, topic, application_id, attempts, sent, received }
  const { resource, user_id, topic, application_id } = body || {};

  // Si el recurso es un ítem, lo traemos para registrar su estado/sub_estado actual.
  let item_id = null, item_status = null, item_sub_status = null;
  try {
    if (resource && resource.includes('/items/')) {
      item_id = resource.split('/items/')[1]?.split('/')[0] || null;
      const { accessToken } = await getValidToken();
      const r = await fetch(`https://api.mercadolibre.com${resource}`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      });
      const it = await r.json().catch(() => ({}));
      item_status = it.status ?? null;
      item_sub_status = it.sub_status ? JSON.stringify(it.sub_status) : null;
    }
  } catch (e) {
    console.error('[meli notifications] fetch item:', e.message);
  }

  try {
    await admin.from('meli_events').insert({
      topic: topic ?? null,
      resource: resource ?? null,
      application_id: application_id != null ? String(application_id) : null,
      meli_user_id: user_id ?? null,
      item_id,
      item_status,
      item_sub_status,
      raw: body,
    });
  } catch (e) {
    console.error('[meli notifications] insert:', e.message);
  }

  console.log('[meli notification]', topic, resource, '→ status', item_status, item_sub_status);

  // MELI requiere 200 rápido; si no, reintenta.
  return NextResponse.json({ ok: true });
}

// Lectura de los últimos eventos (protegida con el mismo secreto que /api/meli/auth).
export async function GET(request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!process.env.MELI_CONNECT_SECRET || key !== process.env.MELI_CONNECT_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { data, error } = await admin
    .from('meli_events')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data || [] });
}
