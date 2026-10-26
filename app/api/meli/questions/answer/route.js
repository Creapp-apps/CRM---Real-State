// Responde una pregunta de MercadoLibre desde el CRM (POST /answers) y
// refleja la respuesta en meli_questions.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { answerMeliQuestion } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { question_id, text } = body || {};
  if (!question_id || !text?.trim()) {
    return NextResponse.json({ ok: false, error: 'Falta question_id o text' }, { status: 400 });
  }

  try {
    await answerMeliQuestion(question_id, text.trim());
    const now = new Date().toISOString();
    await admin.from('meli_questions')
      .update({ status: 'ANSWERED', answer_text: text.trim(), answer_date: now, updated_at: now })
      .eq('id', question_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[meli questions answer]', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
