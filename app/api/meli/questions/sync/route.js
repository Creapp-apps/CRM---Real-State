// Sincroniza las preguntas (interesados) de MercadoLibre hacia meli_questions.
// Lo llama la bandeja de Interesados al abrir y con el botón "Sincronizar".
// La captura en tiempo real la hace el webhook (tópico questions); esto es el
// respaldo / carga inicial.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMeliQuestions, getMeliItemBrief, getMeliUserNickname } from '@/lib/mercadolibre';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  try {
    // Traer hasta ~150 preguntas (3 páginas de 50).
    let all = [];
    let total = Infinity;
    for (let offset = 0; offset < Math.min(total, 150); offset += 50) {
      const { total: t, questions } = await getMeliQuestions({ limit: 50, offset });
      total = t;
      all = all.concat(questions);
      if (questions.length < 50) break;
    }

    // Enriquecer item + comprador una sola vez por id.
    const itemIds = [...new Set(all.map(q => q.item_id).filter(Boolean))];
    const buyerIds = [...new Set(all.map(q => q.from?.id).filter(Boolean))];
    const itemBriefs = {};
    const nicks = {};
    await Promise.all([
      ...itemIds.map(async id => { itemBriefs[id] = await getMeliItemBrief(id); }),
      ...buyerIds.map(async id => { nicks[id] = await getMeliUserNickname(id); }),
    ]);

    // OJO: NO incluimos crm_status ni opportunity_id → en upsert se preservan
    // (columnas omitidas no se tocan al actualizar; default 'nuevo' al insertar).
    const rows = all.map(q => ({
      id: q.id,
      item_id: q.item_id || null,
      item_title: itemBriefs[q.item_id]?.title || null,
      item_permalink: itemBriefs[q.item_id]?.permalink || null,
      item_operation: itemBriefs[q.item_id]?.operation || null,
      buyer_id: q.from?.id || null,
      buyer_nickname: nicks[q.from?.id] || null,
      text: q.text || null,
      status: q.status || null,
      answer_text: q.answer?.text || null,
      answer_date: q.answer?.date_created || null,
      date_created: q.date_created || null,
      raw: q,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length) {
      const { error } = await admin.from('meli_questions').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, synced: rows.length, total });
  } catch (e) {
    console.error('[meli questions sync]', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
