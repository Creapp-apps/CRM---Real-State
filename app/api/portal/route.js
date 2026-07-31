// API: Validate portal token and return contract data
// GET /api/portal?token=xxx

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  // Validate token
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('portal_tokens')
    .select('*, contrato:contratos(*, locador:clientes!contratos_locador_id_fkey(nombre, telefono, email), locatario:clientes!contratos_locatario_id_fkey(nombre, telefono, email, dni_cuit), inmueble:inmuebles_administrados(direccion, tipo, servicios))')
    .eq('token', token)
    .eq('activo', true)
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  // Update last access
  await supabaseAdmin
    .from('portal_tokens')
    .update({ ultimo_acceso: new Date().toISOString() })
    .eq('id', tokenData.id);

  // Fetch pagos
  const { data: pagos } = await supabaseAdmin
    .from('pagos_alquiler')
    .select('*')
    .eq('contrato_id', tokenData.contrato_id)
    .order('periodo', { ascending: false })
    .limit(24);

  // Fetch liquidaciones (if propietario)
  let liquidaciones = [];
  if (tokenData.tipo === 'propietario') {
    const { data: liq } = await supabaseAdmin
      .from('liquidaciones')
      .select('*')
      .eq('contrato_id', tokenData.contrato_id)
      .order('periodo', { ascending: false })
      .limit(12);
    liquidaciones = liq || [];
  }

  return NextResponse.json({
    tipo: tokenData.tipo,
    contrato: tokenData.contrato,
    pagos: pagos || [],
    liquidaciones,
  });
}
