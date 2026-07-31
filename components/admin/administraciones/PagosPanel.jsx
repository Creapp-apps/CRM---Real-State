'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const ESTADO_LABEL = { pendiente: 'Pendiente', pagado: 'Pagado', mora: 'En Mora', parcial: 'Parcial' };
const ESTADO_BADGE = { pendiente: styles.badgeYellow, pagado: styles.badgeGreen, mora: styles.badgeRed, parcial: styles.badgeGray };

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatPeriodo(p) {
  if (!p) return '-';
  const [y, m] = p.split('-');
  return `${MESES[parseInt(m) - 1]} ${y}`;
}

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcularPunitorios(fechaVencimiento, fechaPago, montoAlquiler, tasa) {
  if (!fechaVencimiento || !tasa || tasa === 0) return 0;
  const venc = new Date(fechaVencimiento + 'T12:00:00');
  const pago = fechaPago ? new Date(fechaPago + 'T12:00:00') : new Date();
  const diasMora = Math.max(0, Math.floor((pago - venc) / (1000 * 60 * 60 * 24)));
  if (diasMora === 0) return 0;
  return montoAlquiler * (tasa / 100) * diasMora;
}

export default function PagosPanel({ contratoId, contrato }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPago, setEditPago] = useState(null);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pagos_alquiler')
      .select('*')
      .eq('contrato_id', contratoId)
      .order('periodo', { ascending: false });
    setPagos(data || []);
    setLoading(false);
  }, [contratoId]);

  useEffect(() => { fetchPagos(); }, [fetchPagos]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro de pago?')) return;
    await supabase.from('pagos_alquiler').delete().eq('id', id);
    fetchPagos();
  };

  const handleMarkPaid = async (pago) => {
    const today = new Date().toISOString().slice(0, 10);
    const punitorios = calcularPunitorios(pago.fecha_vencimiento, today, pago.monto_alquiler, contrato?.punitorios_tasa);
    const total = (pago.monto_alquiler || 0) + (pago.monto_expensas || 0) + (pago.monto_impuestos || 0) + punitorios;

    await supabase.from('pagos_alquiler').update({
      estado: 'pagado',
      fecha_pago: today,
      monto_punitorios: punitorios,
      monto_total: total,
    }).eq('id', pago.id);
    fetchPagos();
  };

  // Stats
  const pendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'mora');
  const totalPendiente = pendientes.reduce((s, p) => s + Number(p.monto_alquiler || 0), 0);
  const enMora = pendientes.filter(p => {
    if (!p.fecha_vencimiento) return false;
    return new Date(p.fecha_vencimiento + 'T12:00:00') < new Date();
  });

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className={styles.card} style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)' }}>Pendientes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pendientes.length > 0 ? '#fbbf24' : '#4ade80' }}>{pendientes.length}</div>
        </div>
        <div className={styles.card} style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)' }}>En Mora</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: enMora.length > 0 ? '#f87171' : '#4ade80' }}>{enMora.length}</div>
        </div>
        <div className={styles.card} style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)' }}>Total Pendiente</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--white)' }}>$ {formatCurrency(totalPendiente)}</div>
        </div>
        <div className={styles.card} style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)' }}>Tasa Punitorio</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold)' }}>{contrato?.punitorios_tasa || 0}% / día</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>Registro de Pagos</h3>
        <button className={styles.btnPrimary} onClick={() => { setEditPago(null); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrar Período
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Período</th>
              <th>Alquiler</th>
              <th>Expensas</th>
              <th>Impuestos</th>
              <th>Punitorios</th>
              <th>Total</th>
              <th>Vencimiento</th>
              <th>Pago</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando...</td></tr>
            ) : pagos.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>No hay pagos registrados</td></tr>
            ) : pagos.map(p => {
              const diasMora = p.fecha_vencimiento && p.estado !== 'pagado'
                ? Math.max(0, Math.floor((new Date() - new Date(p.fecha_vencimiento + 'T12:00:00')) / (1000 * 60 * 60 * 24)))
                : 0;
              const punitorioVivo = p.estado !== 'pagado'
                ? calcularPunitorios(p.fecha_vencimiento, null, p.monto_alquiler, contrato?.punitorios_tasa)
                : Number(p.monto_punitorios || 0);

              return (
                <tr key={p.id} style={{ background: diasMora > 0 && p.estado !== 'pagado' ? 'rgba(248,113,113,0.04)' : 'transparent' }}>
                  <td style={{ fontWeight: 600, color: 'var(--white)' }}>{formatPeriodo(p.periodo)}</td>
                  <td>$ {formatCurrency(p.monto_alquiler)}</td>
                  <td>$ {formatCurrency(p.monto_expensas)}</td>
                  <td>$ {formatCurrency(p.monto_impuestos)}</td>
                  <td style={{ color: punitorioVivo > 0 ? '#f87171' : 'var(--gray-500)' }}>
                    {punitorioVivo > 0 ? `$ ${formatCurrency(punitorioVivo)}` : '-'}
                    {diasMora > 0 && p.estado !== 'pagado' && (
                      <div style={{ fontSize: '0.65rem', color: '#f87171' }}>{diasMora} días mora</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--white)' }}>
                    $ {formatCurrency(p.estado === 'pagado' ? p.monto_total : (Number(p.monto_alquiler || 0) + Number(p.monto_expensas || 0) + Number(p.monto_impuestos || 0) + punitorioVivo))}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{p.fecha_vencimiento || '-'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{p.fecha_pago || '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${ESTADO_BADGE[diasMora > 0 && p.estado === 'pendiente' ? 'mora' : p.estado]}`}>
                      {diasMora > 0 && p.estado === 'pendiente' ? 'En Mora' : ESTADO_LABEL[p.estado]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {p.estado !== 'pagado' && (
                        <button className={styles.btnIcon} onClick={() => handleMarkPaid(p)} title="Marcar pagado" style={{ color: '#4ade80' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                      <button className={styles.btnIcon} onClick={() => { setEditPago(p); setShowModal(true); }} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className={styles.btnIcon} onClick={() => handleDelete(p.id)} title="Eliminar" style={{ color: '#f87171' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for register/edit payment */}
      {showModal && (
        <PagoModal
          contrato={contrato}
          editData={editPago}
          onClose={() => { setShowModal(false); setEditPago(null); }}
          onSaved={fetchPagos}
        />
      )}
    </div>
  );
}

// ── Pago Modal ──
function PagoModal({ contrato, editData, onClose, onSaved }) {
  const [form, setForm] = useState({
    periodo: editData?.periodo || new Date().toISOString().slice(0, 7),
    monto_alquiler: editData?.monto_alquiler || contrato?.monto_inicial || '',
    monto_expensas: editData?.monto_expensas || 0,
    monto_impuestos: editData?.monto_impuestos || 0,
    fecha_vencimiento: editData?.fecha_vencimiento || '',
    fecha_pago: editData?.fecha_pago || '',
    estado: editData?.estado || 'pendiente',
    notas: editData?.notas || '',
  });
  const [saving, setSaving] = useState(false);

  // Auto-calculate vencimiento from periodo + dia_vencimiento_pago
  useEffect(() => {
    if (!editData && form.periodo && contrato?.dia_vencimiento_pago) {
      const dia = String(contrato.dia_vencimiento_pago).padStart(2, '0');
      setForm(prev => ({ ...prev, fecha_vencimiento: `${form.periodo}-${dia}` }));
    }
  }, [form.periodo, contrato?.dia_vencimiento_pago, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const alq = parseFloat(form.monto_alquiler) || 0;
    const exp = parseFloat(form.monto_expensas) || 0;
    const imp = parseFloat(form.monto_impuestos) || 0;
    const total = alq + exp + imp;

    const payload = {
      contrato_id: contrato.id,
      periodo: form.periodo,
      monto_alquiler: alq,
      monto_expensas: exp,
      monto_impuestos: imp,
      monto_total: total,
      fecha_vencimiento: form.fecha_vencimiento || null,
      fecha_pago: form.fecha_pago || null,
      estado: form.estado,
      notas: form.notas,
    };

    try {
      if (editData?.id) {
        const { error } = await supabase.from('pagos_alquiler').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pagos_alquiler').insert(payload);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const total = (parseFloat(form.monto_alquiler) || 0) + (parseFloat(form.monto_expensas) || 0) + (parseFloat(form.monto_impuestos) || 0);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{editData ? 'Editar Pago' : 'Registrar Período'}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Período *</label>
                <input className={styles.formInput} type="month" name="periodo" value={form.periodo} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado</label>
                <select className={styles.formSelect} name="estado" value={form.estado} onChange={handleChange}>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Monto Alquiler ($)</label>
                <input className={styles.formInput} type="number" step="0.01" name="monto_alquiler" value={form.monto_alquiler} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expensas ($)</label>
                <input className={styles.formInput} type="number" step="0.01" name="monto_expensas" value={form.monto_expensas} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Impuestos ($)</label>
                <input className={styles.formInput} type="number" step="0.01" name="monto_impuestos" value={form.monto_impuestos} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha Vencimiento</label>
                <input className={styles.formInput} type="date" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de Pago</label>
                <input className={styles.formInput} type="date" name="fecha_pago" value={form.fecha_pago} onChange={handleChange} />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Notas</label>
                <textarea className={styles.formTextarea} name="notas" value={form.notas} onChange={handleChange} rows={2} placeholder="Observaciones..." />
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>Total a cobrar</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>$ {formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando...' : (editData ? 'Guardar Cambios' : 'Registrar Pago')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
