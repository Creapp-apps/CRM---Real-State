// API: callback OAuth2 de MercadoLibre.
// GET /api/meli/callback?code=...&state=...
// Valida el state, intercambia el code por tokens (PKCE) y los guarda en Supabase.

import { NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/meli-conectado?status=error&reason=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.json({ error: 'Falta el parámetro code' }, { status: 400 });
  }

  // Validar state (CSRF) contra la cookie.
  const savedState = request.cookies.get('meli_oauth_state')?.value;
  const codeVerifier = request.cookies.get('meli_pkce_verifier')?.value;

  if (!savedState || !state || savedState !== state) {
    return NextResponse.json({ error: 'State inválido' }, { status: 400 });
  }
  if (!codeVerifier) {
    return NextResponse.json({ error: 'Falta code_verifier (cookie expirada). Reintentá el login.' }, { status: 400 });
  }

  try {
    await exchangeCodeForToken({ code, codeVerifier });
  } catch (e) {
    console.error('[MELI callback]:', e.message);
    return NextResponse.redirect(`${origin}/meli-conectado?status=error&reason=token`);
  }

  // Limpiamos cookies temporales y redirigimos a la página de confirmación.
  const res = NextResponse.redirect(`${origin}/meli-conectado?status=ok`);
  res.cookies.delete('meli_oauth_state');
  res.cookies.delete('meli_pkce_verifier');
  return res;
}
