'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';

const MESES_OPCIONES = [1, 2, 3, 4, 6, 12];
const INDICES = ['ICL', 'IPC', 'UVA'];
const MESES_NOMBRE = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const INDICE_DESC = {
  ICL: 'Índice de Contratos de Locación (BCRA · Ley 27.551)',
  IPC: 'Índice de Precios al Consumidor (INDEC)',
  UVA: 'Unidad de Valor Adquisitivo (BCRA)',
};

/* ── Helpers de fecha ── */
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtDay = (d) => `${fmtMonth(d)}-${String(d.getDate()).padStart(2, '0')}`;
const fmtCorta = (d) => `${MESES_NOMBRE[d.getMonth()]} ${d.getFullYear()}`;
const fmtISO = (d) => fmtDay(d);

// Valor del índice en una fecha (serie desc). Proyecta si la fecha supera el último dato.
function indexAt(serie, freq, date) {
  if (!serie?.length) return null;
  const key = freq === 'mensual' ? fmtMonth(date) : fmtDay(date);
  const keyOf = (d) => (freq === 'mensual' ? d.periodo : d.fecha);
  const latest = serie[0];
  const earliest = serie[serie.length - 1];
  if (key < keyOf(earliest)) return null;                 // antes de la serie
  if (key <= keyOf(latest)) {
    const found = serie.find(d => keyOf(d) <= key);        // más reciente ≤ fecha
    return found ? { valor: found.valor, aprox: false } : null;
  }
  // Más allá del último dato → proyección por tendencia reciente.
  if (freq === 'mensual') {
    const r = serie.length > 1 ? latest.valor / serie[1].valor - 1 : 0;
    const latestDate = new Date(keyOf(latest) + '-01T12:00:00');
    const monthsBeyond = (date.getFullYear() - latestDate.getFullYear()) * 12 + (date.getMonth() - latestDate.getMonth());
    return { valor: latest.valor * Math.pow(1 + r, Math.max(1, monthsBeyond)), aprox: true };
  } else {
    const ref = serie[Math.min(30, serie.length - 1)];
    const r = Math.pow(latest.valor / ref.valor, 1 / 30) - 1;
    const latestDate = new Date(keyOf(latest) + 'T12:00:00');
    const daysBeyond = Math.max(1, Math.round((date - latestDate) / 86400000));
    return { valor: latest.valor * Math.pow(1 + r, daysBeyond), aprox: true };
  }
}

export default function CalculadoraActualizacion({ montoBase: propMonto, indice: propIndice, periodicidadMeses, fechaInicioContrato, onRegistrar }) {
  const [monto, setMonto] = useState(propMonto || '');
  const [fechaInicio, setFechaInicio] = useState(fechaInicioContrato || '');
  const [cadaMeses, setCadaMeses] = useState(periodicidadMeses || 3);
  const [indice, setIndice] = useState(propIndice || 'ICL');
  const [serie, setSerie] = useState([]);
  const [freq, setFreq] = useState('diaria');
  const [fuente, setFuente] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState(null);

  // Trae la serie del índice elegido (y cada vez que cambia el índice).
  const fetchSerie = useCallback(async (tipo) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/indices?tipo=${tipo}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSerie(json.data || []);
      setFreq(json.frecuencia || 'diaria');
      setFuente(json.fuente || '');
    } catch { setSerie([]); setFuente(''); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSerie(indice); }, [indice, fetchSerie]);

  const calcular = () => {
    const m = parseFloat(monto);
    if (!m || !fechaInicio) return alert('Ingresá el monto y la fecha de inicio');
    if (!serie.length) return alert('No hay datos del índice. Probá de nuevo en unos segundos.');

    const start = new Date(fechaInicio + 'T12:00:00');
    const periods = [{ numero: 1, fecha: fechaInicio, fechaLabel: fmtCorta(start), aumento: 0, valor: m, aprox: false }];
    let current = m;
    const maxPeriods = Math.min(Math.ceil(36 / cadaMeses) + 1, 13);

    for (let i = 1; i < maxPeriods; i++) {
      const Di = addMonths(start, i * cadaMeses);
      const Dprev = addMonths(start, (i - 1) * cadaMeses);
      const idxI = indexAt(serie, freq, Di);
      const idxPrev = indexAt(serie, freq, Dprev);
      if (!idxI || !idxPrev || !idxPrev.valor) break; // sin dato suficiente

      const ratio = idxI.valor / idxPrev.valor;
      const aumento = (ratio - 1) * 100;
      const anterior = current;
      current = current * ratio;
      periods.push({
        numero: i + 1,
        fecha: fmtISO(Di),
        fechaLabel: fmtCorta(Di),
        aumento,
        valor: current,
        montoAnterior: anterior,
        idxInicio: idxPrev.valor,
        idxFin: idxI.valor,
        aprox: idxI.aprox || idxPrev.aprox,
      });
    }

    setResultados({ periods, params: { monto: m, fecha: fechaInicio, cadaMeses, indice } });
  };

  const lastConfirmed = resultados?.periods?.filter(p => !p.aprox && p.numero > 1).pop();
  const nextApprox = resultados?.periods?.find(p => p.aprox);

  const registrar = (p) => {
    if (!onRegistrar) return;
    onRegistrar({
      fecha: p.fecha,
      monto_anterior: Math.round(p.montoAnterior),
      monto_nuevo: Math.round(p.valor),
      indice_usado: indice,
      valor_indice_inicio: p.idxInicio ?? null,
      valor_indice_fin: p.idxFin ?? null,
      aumento: p.aumento,
    });
  };

  return (
    <div className={styles.calcCard}>
      <div className={styles.calcSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div className={styles.calcSectionTitle}>
            <span style={{ color: 'var(--admin-gold)', display: 'inline-flex' }}><Icon name="layers" size={18} /></span>
            Calculadora de Actualización
          </div>
          {!loading && serie.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              {fuente || 'Conectado'}
            </span>
          )}
          {loading && <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Cargando índice…</span>}
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
          <label className={styles.formLabel}>Valor inicial del alquiler</label>
          <input className={styles.formInput} type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 475000" />
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
          <label className={styles.formLabel}>Fecha de inicio de contrato</label>
          <input className={styles.formInput} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
          <label className={styles.formLabel}>Cada cuánto se actualiza (meses)</label>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
            {MESES_OPCIONES.map(n => (
              <button key={n} type="button" onClick={() => setCadaMeses(n)}
                style={{ minWidth: 40, height: 36, padding: '0 0.5rem', borderRadius: '0.375rem',
                  border: cadaMeses === n ? '2px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.1)',
                  background: cadaMeses === n ? 'var(--admin-gold-15)' : 'rgba(255,255,255,0.03)',
                  color: cadaMeses === n ? 'var(--admin-gold)' : 'var(--gray-400)',
                  fontWeight: cadaMeses === n ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
          <label className={styles.formLabel}>Índice de actualización</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
            {INDICES.map(idx => (
              <button key={idx} type="button" onClick={() => setIndice(idx)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem',
                  border: indice === idx ? '2px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.1)',
                  background: indice === idx ? 'var(--admin-gold-15)' : 'rgba(255,255,255,0.03)',
                  color: indice === idx ? 'var(--admin-gold)' : 'var(--gray-400)',
                  fontWeight: indice === idx ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                {idx}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>{INDICE_DESC[indice]}</div>
        </div>

        <button className={styles.btnPrimary} type="button" onClick={calcular} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          CALCULAR
        </button>
      </div>

      {resultados && (
        <>
          {(lastConfirmed || nextApprox) && (
            <div className={styles.calcSection} style={{ padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: lastConfirmed && nextApprox ? '1fr 1fr' : '1fr', gap: 0 }}>
                {lastConfirmed && (
                  <div style={{ padding: '1.25rem', textAlign: 'center', borderRight: nextApprox ? '1px solid var(--admin-gold-10)' : 'none', background: 'var(--admin-gold-05)' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--admin-gold)', fontWeight: 700, marginBottom: '0.375rem' }}>CONFIRMADO</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>{lastConfirmed.fechaLabel}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--white)' }}>$ {lastConfirmed.valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                  </div>
                )}
                {nextApprox && (
                  <div style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(99,102,241,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#818cf8', fontWeight: 700, marginBottom: '0.375rem' }}>PRÓXIMO (Aprox.)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>{nextApprox.fechaLabel}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--white)' }}>$ {nextApprox.valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>⚠ Estimado</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.calcSection} style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              <span>💰 {parseFloat(monto).toLocaleString('es-AR')}</span>
              <span>📅 {fechaInicio}</span>
              <span>🔄 cada {cadaMeses} {cadaMeses === 1 ? 'mes' : 'meses'}</span>
              <span>📊 {indice}</span>
            </div>
          </div>

          <div className={styles.calcSection} style={{ padding: 0 }}>
            <table className={styles.table}>
              <thead>
                <tr><th></th><th>Fecha</th><th>Aumento</th><th>Valor</th>{onRegistrar && <th></th>}</tr>
              </thead>
              <tbody>
                {resultados.periods.map((p) => (
                  <tr key={p.numero} style={{ background: p.aprox ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: 600 }}>Per. {p.numero}</td>
                    <td>{p.fechaLabel}</td>
                    <td>
                      {p.aumento === 0 ? <span style={{ color: 'var(--gray-500)' }}>—</span>
                        : <span style={{ color: p.aumento > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>{p.aumento.toFixed(2)} %</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--white)' }}>
                      $ {p.valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      {p.aprox && <span style={{ fontSize: '0.65rem', color: '#818cf8', marginLeft: '0.375rem' }}>≈</span>}
                    </td>
                    {onRegistrar && (
                      <td>
                        {p.numero > 1 && !p.aprox && (
                          <button type="button" className={styles.btnSecondary} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }} onClick={() => registrar(p)}>
                            Registrar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
