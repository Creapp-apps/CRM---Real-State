// API de índices de actualización de alquileres.
//   GET /api/indices?tipo=IPC   → mensual (INDEC, datos.gob.ar)  → [{ periodo:'YYYY-MM', valor }]
//   GET /api/indices?tipo=ICL   → diario  (BCRA, vía ikiwi)       → [{ fecha:'YYYY-MM-DD', valor }]
//   GET /api/indices?tipo=UVA   → diario  (BCRA, vía argentinadatos) → [{ fecha:'YYYY-MM-DD', valor }]
// Respuesta: { tipo, fuente, frecuencia: 'mensual'|'diaria', data } (ordenada desc por fecha/periodo).

import { NextResponse } from 'next/server';

const IPC_SERIE = '148.3_INIVELNAL_DICI_M_26'; // IPC Nivel General Nacional (datos.gob.ar)
const MAX_DIARIO = 1600; // ~4,4 años de valores diarios (acota el payload)

async function fetchJson(url, { timeout = 9000, ...opts } = {}) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, {
      next: { revalidate: 43200 }, // cache 12h
      headers: { 'User-Agent': 'Mozilla/5.0 CMPROP-Admin/1.0', Accept: 'application/json' },
      signal: ac.signal,
      ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(to); }
}

// Normaliza fechas DD-MM-YYYY → YYYY-MM-DD; deja pasar las ISO.
function toISO(fecha) {
  if (!fecha) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha.slice(0, 10);
  const m = fecha.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : fecha;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tipo = (searchParams.get('tipo') || 'IPC').toUpperCase();
  const limit = Math.min(parseInt(searchParams.get('limit') || '120'), 240);

  try {
    // ── IPC: mensual (INDEC) ──
    // Fuente: argentinadatos (inflación mensual %). datos.gob.ar es más oficial
    // pero intermitente, así que lo usamos de fallback. Construimos un índice de
    // nivel acumulado (base 100 al inicio de la ventana) para que el cálculo use
    // ratios igual que ICL/UVA. El ratio no depende de la base.
    if (tipo === 'IPC') {
      let infl = null;
      try {
        infl = await fetchJson('https://api.argentinadatos.com/v1/finanzas/indices/inflacion', { timeout: 10000 });
      } catch { /* probamos datos.gob.ar abajo */ }

      if (Array.isArray(infl) && infl.length) {
        const asc = infl
          .map(d => ({ periodo: toISO(d.fecha || d.date)?.slice(0, 7), pct: Number(d.valor ?? d.value) }))
          .filter(d => d.periodo && !Number.isNaN(d.pct))
          .sort((a, b) => (a.periodo < b.periodo ? -1 : 1))
          .slice(-Math.max(limit, 160)); // ventana reciente
        let nivel = 100;
        const data = asc.map(d => { nivel *= 1 + d.pct / 100; return { periodo: d.periodo, valor: Number(nivel.toFixed(6)) }; })
          .sort((a, b) => (a.periodo < b.periodo ? 1 : -1)); // desc
        return NextResponse.json({ tipo, fuente: 'INDEC · IPC (inflación mensual)', frecuencia: 'mensual', actualizacion: data[0]?.periodo || null, data });
      }

      // Fallback: datos.gob.ar (índice de nivel directo)
      const json = await fetchJson(`https://apis.datos.gob.ar/series/api/series/?ids=${IPC_SERIE}&limit=${limit}&sort=desc&format=json`, { timeout: 15000 });
      const data = (json.data || []).map(([fecha, valor]) => ({ periodo: fecha.slice(0, 7), valor }));
      return NextResponse.json({ tipo, fuente: 'INDEC · datos.gob.ar', frecuencia: 'mensual', actualizacion: data[0]?.periodo || null, data });
    }

    // ── ICL: diario (BCRA, vía ikiwi) ──
    if (tipo === 'ICL') {
      const json = await fetchJson('https://prestamos.ikiwi.net.ar/api/v1/engine/icl/valores/');
      const data = (Array.isArray(json) ? json : [])
        .map(d => ({ fecha: toISO(d.date || d.fecha), valor: Number(d.value ?? d.valor) }))
        .filter(d => d.fecha && !Number.isNaN(d.valor))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)) // desc
        .slice(0, MAX_DIARIO);
      return NextResponse.json({ tipo, fuente: 'BCRA · ICL (Ley 27.551)', frecuencia: 'diaria', actualizacion: data[0]?.fecha || null, data });
    }

    // ── UVA: diario (BCRA, vía argentinadatos) ──
    if (tipo === 'UVA') {
      const json = await fetchJson('https://api.argentinadatos.com/v1/finanzas/indices/uva');
      const data = (Array.isArray(json) ? json : [])
        .map(d => ({ fecha: toISO(d.fecha || d.date), valor: Number(d.valor ?? d.value) }))
        .filter(d => d.fecha && !Number.isNaN(d.valor))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)) // desc
        .slice(0, MAX_DIARIO);
      return NextResponse.json({ tipo, fuente: 'BCRA · UVA', frecuencia: 'diaria', actualizacion: data[0]?.fecha || null, data });
    }

    return NextResponse.json({ error: `Índice "${tipo}" no soportado` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: `No se pudo obtener ${tipo}: ${error.message}` }, { status: 502 });
  }
}
