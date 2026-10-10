/**
 * MercadoLibre API Service
 * Centraliza OAuth2 (Authorization Code + PKCE), el refresh de tokens
 * y la lectura/normalización de publicaciones al formato interno de CMPROP.
 *
 * Los tokens se persisten en Supabase (tabla meli_tokens) vía service_role.
 * Secretos: solo server-side (process.env sin prefijo NEXT_PUBLIC_).
 */

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const CLIENT_ID = process.env.MELI_CLIENT_ID;
const CLIENT_SECRET = process.env.MELI_CLIENT_SECRET;
const REDIRECT_URI = process.env.MELI_REDIRECT_URI;

// Dominio de autorización para Argentina (MLA).
const AUTH_BASE = 'https://auth.mercadolibre.com.ar/authorization';
const API_BASE = 'https://api.mercadolibre.com';
const TOKEN_URL = `${API_BASE}/oauth/token`;

// Cliente Supabase admin (service_role). Mismo patrón que app/api/portal/route.js.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ──────────────────────────────  PKCE  ────────────────────────────── */

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generatePkce() {
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

export function generateState() {
  return base64url(crypto.randomBytes(16));
}

/**
 * Construye la URL de autorización de MercadoLibre.
 */
export function buildAuthUrl({ codeChallenge, state }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

/* ─────────────────────────  Token exchange  ───────────────────────── */

/**
 * Intercambia el authorization code por tokens y los guarda en Supabase.
 */
export async function exchangeCodeForToken({ code, codeVerifier }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[MELI token exchange] HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  await saveTokens(data);
  return data;
}

/**
 * Renueva el access_token usando el refresh_token (single-use: MELI devuelve uno nuevo).
 */
async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[MELI token refresh] HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  await saveTokens(data);
  return data;
}

/**
 * Persiste (upsert) los tokens en Supabase. Guarda SIEMPRE el último refresh_token.
 */
async function saveTokens(tokenData) {
  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 21600) * 1000).toISOString();

  const row = {
    meli_user_id: tokenData.user_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: expiresAt,
    scope: tokenData.scope || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('meli_tokens')
    .upsert(row, { onConflict: 'meli_user_id' });

  if (error) {
    throw new Error(`[MELI saveTokens] Supabase: ${error.message}`);
  }
}

/**
 * Devuelve un access_token válido. Refresca automáticamente si está por vencer.
 * Single-tenant: toma la fila más reciente de meli_tokens.
 */
export async function getValidToken() {
  const { data: rows, error } = await supabaseAdmin
    .from('meli_tokens')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(`[MELI getValidToken] Supabase: ${error.message}`);
  if (!rows || rows.length === 0) {
    throw new Error('MELI no conectado. Visitá /api/meli/auth para autorizar la cuenta.');
  }

  const token = rows[0];
  const expiresAt = new Date(token.expires_at).getTime();
  // Margen de 5 min para evitar usar un token que vence durante el request.
  const isExpiring = Date.now() > expiresAt - 5 * 60 * 1000;

  if (isExpiring) {
    const refreshed = await refreshAccessToken(token.refresh_token);
    return { accessToken: refreshed.access_token, userId: refreshed.user_id };
  }

  return { accessToken: token.access_token, userId: token.meli_user_id };
}

/**
 * Indica si la cuenta MELI ya está conectada (hay tokens guardados).
 */
export async function isMeliConnected() {
  const { data, error } = await supabaseAdmin
    .from('meli_tokens')
    .select('meli_user_id')
    .limit(1);
  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

/* ──────────────────────────  API requests  ───────────────────────── */

async function meliFetch(path, { params } = {}) {
  const { accessToken } = await getValidToken();
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    next: { revalidate: 300 }, // cache 5 min, igual que Tokko
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[MELI API] ${path} HTTP ${res.status}: ${errText}`);
  }
  return res.json();
}

/**
 * IDs de las publicaciones del seller. status: active | paused | closed | all.
 */
async function getUserItemIds({ status = 'active', limit = 50, offset = 0 } = {}) {
  const { userId } = await getValidToken();
  const data = await meliFetch(`/users/${userId}/items/search`, {
    params: { status: status === 'all' ? undefined : status, limit, offset },
  });
  return { ids: data.results || [], total: data.paging ? data.paging.total : 0 };
}

/**
 * Multiget de items (máx 20 por llamada).
 */
async function getItemsByIds(ids) {
  if (!ids.length) return [];
  const batches = [];
  for (let i = 0; i < ids.length; i += 20) batches.push(ids.slice(i, i + 20));

  const results = [];
  for (const batch of batches) {
    const data = await meliFetch('/items', { params: { ids: batch.join(',') } });
    // /items?ids= devuelve [{ code, body }]
    for (const entry of data) {
      if (entry.code === 200 && entry.body) results.push(entry.body);
    }
  }
  return results;
}

/* ──────────────────────────  Normalización  ──────────────────────── */

/**
 * Extrae un mapa { attributeId: value_name } de los atributos de un item MELI.
 */
function attrMap(item) {
  const map = {};
  (item.attributes || []).forEach((a) => {
    if (a.id) map[a.id] = a.value_name ?? (a.values && a.values[0] ? a.values[0].name : null);
  });
  return map;
}

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  const n = parseFloat(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Decodifica las entidades HTML más comunes que trae MELI en los títulos (ej. &amp;).
 */
function decodeEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Normaliza un item de MercadoLibre al formato interno de CMPROP
 * (mismo shape que normalizeTokkoProperty en lib/tokko.js).
 */
export function normalizeMeliItem(item, description = null) {
  if (!item) return null;

  const attrs = attrMap(item);

  const operationRaw = attrs.OPERATION || '';
  const titleStr = decodeEntities(item.title);
  const isTemporary = /temporar|temporal/i.test(operationRaw) || /temporar/i.test(titleStr);
  const isRent = isTemporary || /alquiler|renta/i.test(operationRaw) || (/alquiler/i.test(titleStr) && !/venta/i.test(titleStr));
  const operationLabel = isTemporary ? 'Alquiler temporario' : isRent ? 'Alquiler' : 'Venta';
  const operationType = isRent ? 'alquiler' : 'venta';
  const priceLabel = isTemporary ? '/noche' : isRent ? '/mes' : '';

  const typeLabel = attrs.PROPERTY_TYPE || 'Propiedad';

  const loc = item.location || {};
  const neighborhood = loc.neighborhood?.name || attrs.NEIGHBORHOOD || '';
  const city = loc.city?.name || attrs.CITY || '';
  const state = loc.state?.name || attrs.STATE || '';
  const addressLine = loc.address_line || attrs.FULL_ADDRESS || '';
  const locationName = [neighborhood, city, state].filter(Boolean).join(', ') || 'Argentina';

  const images = Array.isArray(item.pictures) && item.pictures.length
    ? item.pictures.map((p) => p.secure_url || p.url).filter(Boolean)
    : ['/images/hero-bg.jpg'];

  // Amenities: atributos booleanos en "Sí" (curado liviano).
  const amenities = (item.attributes || [])
    .filter((a) => /^(Sí|Si|Yes)$/i.test(a.value_name || ''))
    .map((a) => a.name)
    .filter(Boolean);

  const currency = item.currency_id === 'USD' ? 'USD' : '$';

  return {
    id: String(item.id),
    meliId: item.id,
    referenceCode: item.id,
    title: titleStr || `${typeLabel} en ${operationLabel} en ${locationName}`,
    slug: String(item.id),
    operation: operationLabel,
    operationType,
    type: typeLabel,
    price: Number(item.price) || 0,
    currency,
    priceLabel,
    location: locationName,
    address: addressLine || locationName,
    neighborhood,
    // UI muestra "bedrooms" como "Ambientes" => mapeamos ROOMS (ambientes).
    bedrooms: toNumber(attrs.ROOMS || attrs.BEDROOMS),
    bathrooms: toNumber(attrs.FULL_BATHROOMS || attrs.BATHROOMS),
    garages: toNumber(attrs.PARKING_LOTS),
    totalArea: toNumber(attrs.TOTAL_AREA),
    coveredArea: toNumber(attrs.COVERED_AREA),
    description: description || item.subtitle || 'Sin descripción disponible.',
    images,
    featured: false,
    lat: loc.latitude ? Number(loc.latitude) : null,
    lng: loc.longitude ? Number(loc.longitude) : null,
    amenities,
    producer: null,
    publicUrl: item.permalink || null,
    status: item.status || null,
    createdAt: item.date_created || new Date().toISOString(),
  };
}

/* ──────────────────────────  Public API  ─────────────────────────── */

/**
 * Lista las publicaciones del seller normalizadas (sin descripción larga).
 */
export async function getMeliProperties({ status = 'active', limit = 50, offset = 0 } = {}) {
  try {
    const { ids, total } = await getUserItemIds({ status, limit, offset });
    const items = await getItemsByIds(ids);
    const properties = items.map((it) => normalizeMeliItem(it)).filter(Boolean);
    return { properties, total };
  } catch (error) {
    console.error('[MELI getMeliProperties]:', error.message);
    return { properties: [], total: 0, error: error.message };
  }
}

/**
 * Obtiene una publicación por ID con su descripción completa (para la ficha).
 */
export async function getMeliPropertyById(id) {
  try {
    const item = await meliFetch(`/items/${id}`);
    let description = null;
    try {
      const desc = await meliFetch(`/items/${id}/description`);
      description = desc.plain_text || desc.text || null;
    } catch {
      // La descripción puede no existir; seguimos sin ella.
    }
    return normalizeMeliItem(item, description);
  } catch (error) {
    console.error('[MELI getMeliPropertyById]:', error.message);
    return null;
  }
}
