'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';

const MESES_OPCIONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const INDICES = ['ICL', 'IPC', 'UVA'];
const MESES_NOMBRE = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function CalculadoraActualizacion({ montoBase: propMonto, indice: propIndice }) {
  const [monto, setMonto] = useState(propMonto || '');
  const [fechaInicio, setFechaInicio] = useState('');
  const [cadaMeses, setCadaMeses] = useState(3);
  const [indice, setIndice] = useState(propIndice || 'IPC');
  const [ipcData, setIpcData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState(null);

  // Fetch IPC data
  const fetchIPC = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/indices?tipo=IPC&limit=60');
      if (!res.ok) throw new Error('Error');
      const json = await res.json();
      setIpcData(json.data || []);
    } catch { /* fallback to manual */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIPC(); }, [fetchIPC]);

  // Get IPC value for a given YYYY-MM period
  const getIpcForPeriod = (periodo) => {
    const found = ipcData.find(d => d.periodo === periodo);
    return found ? found.valor : null;
  };

  const calcular = () => {
    const m = parseFloat(monto);
    if (!m || !fechaInicio) return alert('Ingresá el monto y la fecha de inicio');

    const startDate = new Date(fechaInicio + 'T12:00:00');
    const periods = [];
    let currentMonto = m;

    // First period is always the starting value (0% increase)
    periods.push({
      numero: 1,
      label: `Per. 1`,
      fecha: fechaInicio,
      fechaLabel: formatFechaCorta(startDate),
      aumento: 0,
      valor: m,
      ipcInicio: null,
      ipcFin: null,
      aproximado: false,
    });

    // Calculate up to 12 periods forward
    const maxPeriods = Math.min(Math.ceil(36 / cadaMeses), 12);

    for (let i = 1; i < maxPeriods; i++) {
      const mesOffset = i * cadaMeses;
      const periodDate = new Date(startDate);
      periodDate.setMonth(periodDate.getMonth() + mesOffset);

      const periodoActual = formatPeriodo(periodDate);
      const periodoAnterior = formatPeriodo(new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1) * cadaMeses, 1));

      // For IPC: use period start and period end values
      const periodoInicioContrato = formatPeriodo(startDate);
      const periodoBuscarInicio = formatPeriodo(new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1) * cadaMeses, 1));
      const periodoBuscarFin = formatPeriodo(new Date(startDate.getFullYear(), startDate.getMonth() + i * cadaMeses, 1));

      const ipcInicio = getIpcForPeriod(periodoBuscarInicio);
      const ipcFin = getIpcForPeriod(periodoBuscarFin);

      let aumento = 0;
      let nuevoMonto = currentMonto;
      let aproximado = false;

      if (indice === 'IPC' && ipcInicio && ipcFin) {
        aumento = ((ipcFin / ipcInicio) - 1) * 100;
        nuevoMonto = currentMonto * (ipcFin / ipcInicio);
      } else if (indice === 'IPC' && ipcInicio && !ipcFin) {
        // Estimate based on last known variation
        const lastKnown = ipcData[0]?.valor;
        const secondLast = ipcData[1]?.valor;
        if (lastKnown && secondLast) {
          const monthlyRate = (lastKnown / secondLast) - 1;
          const monthsAhead = cadaMeses;
          aumento = (Math.pow(1 + monthlyRate, monthsAhead) - 1) * 100;
          nuevoMonto = currentMonto * (1 + aumento / 100);
          aproximado = true;
        }
      }

      if (aumento !== 0) {
        currentMonto = nuevoMonto;
      }

      periods.push({
        numero: i + 1,
        label: `Per. ${i + 1}`,
        fecha: formatFechaISO(periodDate),
        fechaLabel: formatFechaCorta(periodDate),
        aumento,
        valor: currentMonto,
        ipcInicio,
        ipcFin,
        aproximado,
      });

      // Stop if we've gone past available data and can't estimate
      if (indice === 'IPC' && !ipcInicio) break;
    }

    setResultados({
      periods,
      params: {
        monto: m,
        fecha: fechaInicio,
        cadaMeses,
        indice,
      }
    });
  };

  function formatPeriodo(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function formatFechaISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }

  function formatFechaCorta(date) {
    return `${MESES_NOMBRE[date.getMonth()]} ${date.getFullYear()}`;
  }

  // Find the last confirmed and first approximate
  const lastConfirmed = resultados?.periods?.filter(p => !p.aproximado && p.numero > 1).pop();
  const nextApprox = resultados?.periods?.find(p => p.aproximado);

  return (
    <div className={styles.calcCard}>
      <div className={styles.calcSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div className={styles.calcSectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="12" y2="14" /><line x1="8" y1="18" x2="12" y2="18" />
            </svg>
            Calculadora de Actualización
          </div>
          {!loading && ipcData.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Conectado · INDEC
            </span>
          )}
        </div>

        {/* Valor inicial */}
        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
          <label className={styles.formLabel}>Valor inicial del alquiler</label>
          <input
            className={styles.formInput}
            type="number"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej: 475.000"
          />
        </div>

        {/* Fecha inicio */}
        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
          <label className={styles.formLabel}>Fecha de inicio de contrato</label>
          <input
            className={styles.formInput}
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        {/* Cada cuanto se actualiza */}
        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
          <label className={styles.formLabel}>Cada cuanto se actualiza (meses)</label>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
            {MESES_OPCIONES.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setCadaMeses(n)}
                style={{
                  width: 36, height: 36,
                  borderRadius: '0.375rem',
                  border: cadaMeses === n ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                  background: cadaMeses === n ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.03)',
                  color: cadaMeses === n ? 'var(--gold)' : 'var(--gray-400)',
                  fontWeight: cadaMeses === n ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Índice */}
        <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
          <label className={styles.formLabel}>Índice de actualización</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
            {INDICES.map(idx => (
              <button
                key={idx}
                type="button"
                onClick={() => setIndice(idx)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: indice === idx ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                  background: indice === idx ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.03)',
                  color: indice === idx ? 'var(--gold)' : 'var(--gray-400)',
                  fontWeight: indice === idx ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {idx}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
            {indice === 'IPC' && 'Índice de Precios al Consumidor (INDEC)'}
            {indice === 'ICL' && 'Índice de Contratos de Locación (BCRA)'}
            {indice === 'UVA' && 'Unidad de Valor Adquisitivo'}
          </div>
        </div>

        {/* Calcular */}
        <button className={styles.btnPrimary} type="button" onClick={calcular} style={{ width: '100%', justifyContent: 'center' }}>
          CALCULAR
        </button>
      </div>

      {/* Results */}
      {resultados && (
        <>
          {/* Summary Cards */}
          {(lastConfirmed || nextApprox) && (
            <div className={styles.calcSection} style={{ padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: lastConfirmed && nextApprox ? '1fr 1fr' : '1fr', gap: 0 }}>
                {lastConfirmed && (
                  <div style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    borderRight: nextApprox ? '1px solid rgba(201,169,110,0.1)' : 'none',
                    background: 'rgba(201,169,110,0.05)',
                  }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gold)', fontWeight: 700, marginBottom: '0.375rem' }}>
                      CONFIRMADO
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>
                      {lastConfirmed.fechaLabel}
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--white)' }}>
                      $ {lastConfirmed.valor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}
                {nextApprox && (
                  <div style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: 'rgba(99,102,241,0.05)',
                  }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#818cf8', fontWeight: 700, marginBottom: '0.375rem' }}>
                      PRÓXIMO (Aprox.)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>
                      {nextApprox.fechaLabel}
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--white)' }}>
                      $ {nextApprox.valor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                      ⚠ Aproximado
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parameters summary */}
          <div className={styles.calcSection} style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              <span>💰 {parseFloat(monto).toLocaleString('es-AR')}</span>
              <span>📅 {fechaInicio}</span>
              <span>🔄 {cadaMeses} meses</span>
              <span>📊 {indice}</span>
            </div>
          </div>

          {/* Timeline Table */}
          <div className={styles.calcSection} style={{ padding: 0 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Fecha</th>
                  <th>Aumento</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {resultados.periods.map((p, i) => (
                  <tr key={p.numero} style={{
                    background: p.aproximado ? 'rgba(99,102,241,0.05)' : 'transparent',
                  }}>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {p.label}
                    </td>
                    <td>{p.fechaLabel}</td>
                    <td>
                      {p.aumento === 0 ? (
                        <span style={{ color: 'var(--gray-500)' }}>—</span>
                      ) : (
                        <span style={{ color: p.aumento > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                          {p.aumento.toFixed(2)} %
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--white)' }}>
                      $ {p.valor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      {p.aproximado && (
                        <span style={{ fontSize: '0.65rem', color: '#818cf8', marginLeft: '0.375rem' }}>≈</span>
                      )}
                    </td>
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
