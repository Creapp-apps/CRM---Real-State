// API: inicia el flujo OAuth2 (Authorization Code + PKCE) con MercadoLibre.
// GET /api/meli/auth?key=MELI_CONNECT_SECRET
// Protegido con un secreto para que solo el dueño pueda conectar la cuenta.

import { NextResponse } from 'next/server';
import { generatePkce, generateState, buildAuthUrl } from '@/lib/mercadolibre';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!process.env.MELI_CONNECT_SECRET || key !== process.env.MELI_CONNECT_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { codeVerifier, codeChallenge } = generatePkce();
  const state = generateState();

  const authUrl = buildAuthUrl({ codeChallenge, state });
  const res = NextResponse.redirect(authUrl);

  // Guardamos verifier y state en cookies httpOnly para validarlos en el callback.
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min
  };
  res.cookies.set('meli_pkce_verifier', codeVerifier, cookieOpts);
  res.cookies.set('meli_oauth_state', state, cookieOpts);

  return res;
}
