'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatPeriodo(p) {
  if (!p) return '-';
  const [y, m] = p.split('-');
  return `${MESES[parseInt(m) - 1]} ${y}`;
}

export default function LiquidacionPanel({ contratoId, contrato }) {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));

  const fetchLiquidaciones = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('liquidaciones')
      .select('*')
      .eq('contrato_id', contratoId)
      .order('periodo', { ascending: false });
    setLiquidaciones(data || []);
    setLoading(false);
  }, [contratoId]);

  useEffect(() => { fetchLiquidaciones(); }, [fetchLiquidaciones]);

  const generarLiquidacion = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      // Fetch pagos del período
      const { data: pagos } = await supabase
        .from('pagos_alquiler')
        .select('*')
        .eq('contrato_id', contratoId)
        .eq('periodo', periodo)
        .eq('estado', 'pagado');

      const totalAlquiler = pagos?.reduce((s, p) => s + Number(p.monto_alquiler || 0), 0) || Number(contrato?.monto_inicial || 0);

      // Fetch expensas del período
      const { data: expensas } = await supabase
        .from('expensas')
        .select('*')
        .eq('contrato_id', contratoId)
        .eq('periodo', periodo);

      const totalExpensas = expensas?.reduce((s, e) => s + Number(e.monto || 0), 0) || 0;

      // Fetch impuestos del período
      const { data: impuestos } = await supabase
        .from('impuestos')
        .select('*')
        .eq('inmueble_id', contrato?.inmueble_id)
        .eq('periodo', periodo);

      const totalImpuestos = impuestos?.reduce((s, i) => s + Number(i.monto || 0), 0) || 0;

      // Calculate honorarios
      const porcHonorarios = Number(contrato?.honorarios_porcentaje || 0);
      const honorarios = totalAlquiler * (porcHonorarios / 100);
      const iva = contrato?.honorarios_iva ? honorarios * 0.21 : 0;

      // Neto = Alquiler - Honorarios - IVA - Expensas extraordinarias - Impuestos
      const neto = totalAlquiler - honorarios - iva;

      const payload = {
        contrato_id: contratoId,
        periodo,
        monto_alquiler: totalAlquiler,
        honorarios,
        iva,
        expensas: totalExpensas,
        impuestos: totalImpuestos,
        neto_propietario: neto,
        estado: 'borrador',
      };

      // Check if already exists for this period
      const existing = liquidaciones.find(l => l.periodo === periodo);
      if (existing) {
        const { error } = await supabase.from('liquidaciones').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('liquidaciones').insert(payload);
        if (error) throw error;
      }

      fetchLiquidaciones();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const marcarEmitida = async (id) => {
    await supabase.from('liquidaciones').update({ estado: 'emitida' }).eq('id', id);
    fetchLiquidaciones();
  };

  const marcarPagada = async (id) => {
    await supabase.from('liquidaciones').update({ estado: 'pagada' }).eq('id', id);
    fetchLiquidaciones();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta liquidación?')) return;
    await supabase.from('liquidaciones').delete().eq('id', id);
    fetchLiquidaciones();
  };

  const ESTADO_COLOR = { borrador: styles.badgeGray, emitida: styles.badgeYellow, pagada: styles.badgeGreen };
  const ESTADO_LABEL = { borrador: 'Borrador', emitida: 'Emitida', pagada: 'Pagada' };

  return (
    <div>
      {/* Generator */}
      <div className={styles.card} style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Generar Liquidación
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.formLabel}>Período</label>
            <input className={styles.formInput} type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} />
          </div>
          <button className={styles.btnPrimary} onClick={generarLiquidacion} disabled={generating} style={{ height: 42 }}>
            {generating ? 'Generando...' : 'Generar'}
          </button>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
          La liquidación se calcula con los pagos cobrados, expensas e impuestos del período, descontando honorarios e IVA.
        </p>
      </div>

      {/* Liquidaciones table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Período</th>
              <th>Alquiler</th>
              <th>Honorarios</th>
              <th>IVA</th>
              <th>Neto Propietario</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando...</td></tr>
            ) : liquidaciones.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>No hay liquidaciones generadas</td></tr>
            ) : liquidaciones.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600, color: 'var(--white)' }}>{formatPeriodo(l.periodo)}</td>
                <td>$ {formatCurrency(l.monto_alquiler)}</td>
                <td style={{ color: '#f87171' }}>- $ {formatCurrency(l.honorarios)}</td>
                <td style={{ color: '#f87171' }}>{Number(l.iva) > 0 ? `- $ ${formatCurrency(l.iva)}` : '-'}</td>
                <td style={{ fontWeight: 700, color: '#4ade80' }}>$ {formatCurrency(l.neto_propietario)}</td>
                <td>
                  <span className={`${styles.badge} ${ESTADO_COLOR[l.estado]}`}>{ESTADO_LABEL[l.estado]}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {l.estado === 'borrador' && (
                      <button className={styles.btnIcon} onClick={() => marcarEmitida(l.id)} title="Marcar emitida" style={{ color: '#fbbf24' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                      </button>
                    )}
                    {l.estado === 'emitida' && (
                      <button className={styles.btnIcon} onClick={() => marcarPagada(l.id)} title="Marcar pagada" style={{ color: '#4ade80' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    )}
                    <button className={styles.btnIcon} onClick={() => handleDelete(l.id)} title="Eliminar" style={{ color: '#f87171' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Desglose de la última liquidación generada */}
      {liquidaciones.length > 0 && (
        <div className={styles.card} style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>
            Desglose — {formatPeriodo(liquidaciones[0].periodo)}
          </h4>
          <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--white)' }}>
              <span>Alquiler cobrado:</span>
              <span>$ {formatCurrency(liquidaciones[0].monto_alquiler)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
              <span>(-) Honorarios ({contrato?.honorarios_porcentaje || 0}%):</span>
              <span>-$ {formatCurrency(liquidaciones[0].honorarios)}</span>
            </div>
            {Number(liquidaciones[0].iva) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                <span>(-) IVA s/honorarios:</span>
                <span>-$ {formatCurrency(liquidaciones[0].iva)}</span>
              </div>
            )}
            {Number(liquidaciones[0].expensas) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-400)' }}>
                <span>Expensas deducidas:</span>
                <span>$ {formatCurrency(liquidaciones[0].expensas)}</span>
              </div>
            )}
            {Number(liquidaciones[0].impuestos) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-400)' }}>
                <span>Impuestos deducidos:</span>
                <span>$ {formatCurrency(liquidaciones[0].impuestos)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid rgba(201,169,110,0.2)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span style={{ color: 'var(--gold)' }}>NETO A TRANSFERIR:</span>
              <span style={{ color: '#4ade80', fontSize: '1.1rem' }}>$ {formatCurrency(liquidaciones[0].neto_propietario)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
