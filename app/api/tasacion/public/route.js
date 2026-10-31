// API pública: devuelve la ficha de tasación por token (solo lectura).
// GET /api/tasacion/public?token=xxx
// Mismo patrón que /api/portal (service role, acceso por token).

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Campos expuestos públicamente (no mandamos teléfono/email del solicitante).
const PUBLIC_FIELDS = [
  'direccion', 'barrio', 'tipo_propiedad', 'superficie_cubierta', 'superficie_total',
  'ambientes', 'banos', 'cochera', 'antiguedad', 'estado_conservacion', 'zona',
  'amenities', 'valor_estimado_usd', 'valor_min_usd', 'valor_max_usd', 'precio_m2_usd',
  'factores', 'comparables', 'observaciones', 'tasador', 'validez_dias',
  'estado', 'created_at', 'full_name',
].join(', ');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('tasaciones')
    .select(PUBLIC_FIELDS)
    .eq('public_token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Tasación no encontrada' }, { status: 404 });
  }
  if (!data.valor_estimado_usd) {
    return NextResponse.json({ error: 'La tasación aún no está lista' }, { status: 409 });
  }

  return NextResponse.json({ tasacion: data });
}
