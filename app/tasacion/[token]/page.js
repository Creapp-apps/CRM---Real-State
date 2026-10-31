'use client';

// Ficha de tasación pública (branded) — se comparte con el cliente por link.
// Tema claro, imprimible A4 (window.print). Lee por token vía /api/tasacion/public.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatUSD, formatPct } from '@/lib/tasacion-engine';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const num = (n) => Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function FichaTasacionPublica() {
  const { token } = useParams();
  const [tas, setTas] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tasacion/public?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) { setMsg(data.error || 'No se pudo cargar la tasación.'); setState('error'); return; }
        setTas(data.tasacion); setState('ready');
      } catch {
        setMsg('No se pudo cargar la tasación.'); setState('error');
      }
    })();
  }, [token]);

  if (state === 'loading') return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7686', fontFamily: 'Inter,system-ui,sans-serif' }}>Cargando ficha…</div>;
  if (state === 'error') return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7686', fontFamily: 'Inter,system-ui,sans-serif', textAlign: 'center', padding: '2rem' }}>{msg}</div>;

  const t = tas;
  const amenities = Array.isArray(t.amenities) ? t.amenities : [];
  const factores = Array.isArray(t.factores) ? t.factores : [];
  const comparables = Array.isArray(t.comparables) ? t.comparables : [];
  const car = [
    ['Tipo', t.tipo_propiedad],
    ['Superficie cubierta', t.superficie_cubierta ? `${num(t.superficie_cubierta)} m²` : null],
    ['Ambientes', t.ambientes],
    ['Superficie total', t.superficie_total ? `${num(t.superficie_total)} m²` : null],
    ['Baños', t.banos],
    ['Antigüedad', t.antiguedad != null ? `${t.antiguedad} años` : null],
    ['Cochera', t.cochera ? 'Sí' : 'No'],
    ['Estado', t.estado_conservacion],
  ].filter(([, v]) => v != null && v !== '');

  return (
    <>
      <style>{`
        :root{--navy:#0a1628;--gold:#c9a96e;--gold-ink:#8a6d2f;--ink:#1c2430;--muted:#6b7686;--line:#e7e9ee;--paper:#fff;--bg:#aeb4be}
        .tf-wrap{background:var(--bg);min-height:100vh;font-family:Inter,system-ui,sans-serif;color:var(--ink);padding:28px 16px 60px}
        .tf-bar{max-width:794px;margin:0 auto 14px;display:flex;justify-content:flex-end;gap:10px}
        .tf-print{background:var(--gold);color:#1a1a1a;font-weight:700;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font:700 14px Inter,system-ui}
        .tf-sheet{width:794px;max-width:100%;margin:0 auto;background:var(--paper);box-shadow:0 18px 50px rgba(10,22,40,.28);border-radius:4px;overflow:hidden}
        .tf-head{background:var(--navy);color:#fff;padding:30px 44px 26px;position:relative}
        .tf-head:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--gold),transparent 70%)}
        .tf-brand{display:flex;align-items:center;gap:14px}
        .tf-logo{width:46px;height:46px;border-radius:50%;border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:Fraunces,Georgia,serif;font-weight:700;color:var(--gold);font-size:1.05rem}
        .tf-brand h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.25rem;margin:0;line-height:1.1}
        .tf-brand .sub{font-size:.62rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-top:3px}
        .tf-meta{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px}
        .tf-title{font-family:Fraunces,Georgia,serif;font-size:1.9rem;font-weight:600}
        .tf-nums{text-align:right;font-size:.72rem;color:#aeb8c9;line-height:1.7}
        .tf-nums b{color:#fff;font-weight:600}
        .tf-body{padding:30px 44px 10px}
        .tf-label{font-size:.66rem;letter-spacing:2.2px;text-transform:uppercase;color:var(--gold-ink);font-weight:700;margin:0 0 12px;display:flex;align-items:center;gap:10px}
        .tf-label:after{content:"";height:1px;flex:1;background:var(--line)}
        .tf-prop{display:grid;grid-template-columns:1fr 1fr;gap:4px 28px;margin-bottom:28px}
        .tf-addr{font-family:Fraunces,Georgia,serif;font-size:1.25rem;font-weight:600;grid-column:1/-1;margin-bottom:6px}
        .tf-kv{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line);font-size:.86rem}
        .tf-kv span:first-child{color:var(--muted)}
        .tf-kv span:last-child{font-weight:600}
        .tf-value{background:linear-gradient(135deg,#0d1b30,#13233d);border-radius:12px;color:#fff;padding:26px 30px;margin-bottom:28px}
        .tf-value .tag{font-size:.64rem;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold)}
        .tf-big{font-family:Fraunces,Georgia,serif;font-size:2.9rem;font-weight:700;margin:6px 0 2px}
        .tf-big small{font-size:1.1rem;color:var(--gold);font-weight:600;vertical-align:super;margin-left:4px}
        .tf-vsub{font-size:.8rem;color:#aeb8c9}
        .tf-range{margin-top:20px}
        .tf-ends{display:flex;justify-content:space-between;font-size:.74rem;color:#aeb8c9}
        .tf-ends b{color:#fff}
        .tf-bar2{height:8px;border-radius:999px;background:rgba(255,255,255,.12);position:relative;margin:10px 0 6px}
        .tf-fill{position:absolute;left:18%;right:18%;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--gold),#e7cd97)}
        .tf-dot{position:absolute;left:50%;top:50%;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid var(--gold);transform:translate(-50%,-50%)}
        .tf-factors{display:grid;grid-template-columns:1fr 1fr;gap:10px 22px;margin-bottom:28px}
        .tf-factor{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;background:#f7f8fa;border:1px solid var(--line);border-radius:8px;font-size:.84rem}
        .tf-factor .lbl{color:var(--muted)}
        .tf-factor .val{font-weight:700}
        .tf-factor .val.up{color:#1f8a4c}.tf-factor .val.down{color:#c0453b}
        .tf-comps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:10px}
        .tf-comp{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
        .tf-comp .ph{height:74px;background:linear-gradient(135deg,#dfe3ea,#c9ced8) center/cover;display:flex;align-items:center;justify-content:center;color:#9aa3b1;font-size:.7rem}
        .tf-comp .cb{padding:10px 12px}
        .tf-comp h4{margin:0 0 2px;font-size:.82rem}
        .tf-comp .cm{font-size:.72rem;color:var(--muted);margin-bottom:8px}
        .tf-comp .cp{font-weight:700;font-size:.92rem}
        .tf-comp .cmm{font-size:.7rem;color:var(--gold-ink);font-weight:600}
        .tf-note{font-size:.72rem;color:var(--muted);line-height:1.6;background:#f7f8fa;border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 8px 8px 0;margin:22px 0 4px}
        .tf-foot{background:var(--navy);color:#fff;margin-top:26px;padding:22px 44px;display:flex;justify-content:space-between;align-items:center;font-size:.76rem}
        .tf-foot .who b{display:block;font-family:Fraunces,Georgia,serif;font-size:.95rem;font-weight:600}
        .tf-foot .who span{color:#aeb8c9}
        .tf-foot .ct{text-align:right;color:#aeb8c9;line-height:1.7}
        .tf-foot .ct b{color:var(--gold);font-weight:600}
        @media print{
          .tf-wrap{background:#fff;padding:0}
          .tf-bar{display:none}
          .tf-sheet{box-shadow:none;max-width:none;width:auto;border-radius:0}
          @page{size:A4;margin:0}
        }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="tf-wrap">
        <div className="tf-bar">
          <button className="tf-print" onClick={() => window.print()}>Descargar PDF</button>
        </div>

        <div className="tf-sheet">
          <div className="tf-head">
            <div className="tf-brand">
              <div className="tf-logo">CP</div>
              <div>
                <h1>Cardoso Propiedades</h1>
                <div className="sub">Tasaciones Inmobiliarias</div>
              </div>
            </div>
            <div className="tf-meta">
              <div className="tf-title">Informe de Tasación</div>
              <div className="tf-nums">
                Fecha: <b>{fmtDate(t.created_at)}</b> · Validez: <b>{t.validez_dias || 60} días</b>
              </div>
            </div>
          </div>

          <div className="tf-body">
            <div className="tf-label">Propiedad evaluada</div>
            <div className="tf-prop">
              <div className="tf-addr">{[t.direccion, t.barrio].filter(Boolean).join(' · ') || 'Propiedad'}</div>
              {car.map(([k, v]) => (
                <div className="tf-kv" key={k}><span>{k}</span><span>{v}</span></div>
              ))}
            </div>

            <div className="tf-label">Valor de mercado estimado</div>
            <div className="tf-value">
              <div className="tag">Valor estimado</div>
              <div className="tf-big">{formatUSD(t.valor_estimado_usd)} <small>aprox.</small></div>
              {t.precio_m2_usd ? <div className="tf-vsub">≈ {formatUSD(t.precio_m2_usd)} / m² cubierto</div> : null}
              <div className="tf-range">
                <div className="tf-ends">
                  <span>Mínimo <b>{formatUSD(t.valor_min_usd)}</b></span>
                  <span>Máximo <b>{formatUSD(t.valor_max_usd)}</b></span>
                </div>
                <div className="tf-bar2"><div className="tf-fill" /><div className="tf-dot" /></div>
                <div className="tf-vsub">Rango de negociación sugerido según mercado actual de la zona.</div>
              </div>
            </div>

            {factores.length > 0 && (
              <>
                <div className="tf-label">Factores considerados</div>
                <div className="tf-factors">
                  {factores.map((f, i) => (
                    <div className="tf-factor" key={i}>
                      <span className="lbl">{f.label}</span>
                      <span className={`val ${f.kind === 'pct' ? (f.pct >= 0 ? 'up' : 'down') : ''}`}>
                        {f.kind === 'pct' ? formatPct(f.pct) : f.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {comparables.length > 0 && (
              <>
                <div className="tf-label">Comparables de mercado</div>
                <div className="tf-comps">
                  {comparables.slice(0, 3).map((c, i) => (
                    <div className="tf-comp" key={i}>
                      <div className="ph" style={c.foto ? { backgroundImage: `url(${c.foto})` } : undefined}>{c.foto ? '' : 'Propiedad'}</div>
                      <div className="cb">
                        <h4>{c.direccion || 'Comparable'}</h4>
                        <div className="cm">{[c.tipo, c.m2 ? `${num(c.m2)} m²` : null, c.ambientes ? `${c.ambientes} amb.` : null].filter(Boolean).join(' · ')}</div>
                        {c.precio ? <div className="cp">{formatUSD(c.precio)}</div> : null}
                        {c.m2 && c.precio ? <div className="cmm">{num(Math.round(c.precio / c.m2))} / m²</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="tf-note">
              <b>Metodología.</b> Esta tasación combina el valor de mercado por m² de la zona, el estado y antigüedad del inmueble,
              sus amenities{amenities.length ? ` (${amenities.join(', ')})` : ''} y comparables del portfolio de Cardoso Propiedades,
              con ajuste profesional del tasador.{t.observaciones ? ` ${t.observaciones}` : ''} Es una estimación orientativa sujeta a
              inspección y a las condiciones del mercado al momento de la operación.
            </div>
          </div>

          <div className="tf-foot">
            <div className="who">
              <b>{t.tasador || 'Cardoso Propiedades'}</b>
              <span>Tasador responsable</span>
            </div>
            <div className="ct">
              <b>cardosopropiedades.com.ar</b>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
