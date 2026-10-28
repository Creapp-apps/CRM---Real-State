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
import { getValidToken, getMeliQuestion, getMeliItemBrief, getMeliUserNickname } from '@/lib/mercadolibre';
import { ESTADO_DEFAULT } from '@/lib/estados';

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

  // Anti-rebote: si ML cambió el status del ítem por fuera (p. ej. pausado desde la app de ML),
  // reflejamos SOLO el par inactiva <-> disponible. Nunca pisamos reservado/vendido
  // (estados de negocio): un ítem puede estar activo y reservado/vendido a la vez.
  try {
    if (item_id && (item_status === 'active' || item_status === 'paused')) {
      const { data: row } = await admin
        .from('publicacion_estados')
        .select('estado_comercial')
        .eq('meli_item_id', item_id)
        .maybeSingle();
      const current = row?.estado_comercial || ESTADO_DEFAULT;
      let next = null;
      if (item_status === 'paused' && current === ESTADO_DEFAULT) next = 'inactiva';
      else if (item_status === 'active' && current === 'inactiva') next = ESTADO_DEFAULT;
      if (next) {
        await admin.from('publicacion_estados').upsert(
          { meli_item_id: item_id, estado_comercial: next, updated_at: new Date().toISOString() },
          { onConflict: 'meli_item_id' },
        );
      }
    }
  } catch (e) {
    console.error('[meli notifications] reconcile estado:', e.message);
  }

  // Si es una pregunta (interesado), la traemos y la volcamos a meli_questions
  // para que aparezca en la bandeja de Interesados en tiempo real.
  try {
    const isQuestion = (topic && topic.includes('question')) || (resource && resource.includes('/questions/'));
    if (isQuestion && resource) {
      const qId = resource.split('/questions/')[1]?.split('/')[0] || resource.split('/').pop();
      if (qId) {
        const q = await getMeliQuestion(qId);
        const [brief, nick] = await Promise.all([
          q.item_id ? getMeliItemBrief(q.item_id) : Promise.resolve({}),
          q.from?.id ? getMeliUserNickname(q.from.id) : Promise.resolve(null),
        ]);
        // No tocamos crm_status ni opportunity_id (se preservan en el upsert).
        await admin.from('meli_questions').upsert({
          id: q.id,
          item_id: q.item_id || null,
          item_title: brief?.title || null,
          item_permalink: brief?.permalink || null,
          item_operation: brief?.operation || null,
          buyer_id: q.from?.id || null,
          buyer_nickname: nick || null,
          text: q.text || null,
          status: q.status || null,
          answer_text: q.answer?.text || null,
          answer_date: q.answer?.date_created || null,
          date_created: q.date_created || null,
          raw: q,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    }
  } catch (e) {
    console.error('[meli notifications] question upsert:', e.message);
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
