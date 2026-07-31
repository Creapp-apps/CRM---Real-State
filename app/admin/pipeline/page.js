'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const ETAPAS = [
  { key: 'consulta', label: 'Consulta', color: '#818cf8', icon: '💬' },
  { key: 'visita', label: 'Visita', color: '#38bdf8', icon: '🏠' },
  { key: 'oferta', label: 'Oferta', color: '#fbbf24', icon: '📋' },
  { key: 'reserva', label: 'Reserva', color: '#f97316', icon: '🔖' },
  { key: 'firma', label: 'Firma', color: '#a78bfa', icon: '✍️' },
  { key: 'cerrado', label: 'Cerrado', color: '#4ade80', icon: '✅' },
  { key: 'perdido', label: 'Perdido', color: '#f87171', icon: '❌' },
];

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

export default function PipelinePage() {
  const [oportunidades, setOportunidades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [inmuebles, setInmuebles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filterTipo, setFilterTipo] = useState('todos');
  const dragItem = useRef(null);
  const dragOverColumn = useRef(null);

  const fetchData = useCallback(async () => {
    const [{ data: ops }, { data: cls }, { data: inm }] = await Promise.all([
      supabase.from('oportunidades')
        .select('*, cliente:clientes(nombre), inmueble:inmuebles_administrados(direccion)')
        .order('updated_at', { ascending: false }),
      supabase.from('clientes').select('id, nombre').order('nombre'),
      supabase.from('inmuebles_administrados').select('id, direccion').order('direccion'),
    ]);
    setOportunidades(ops || []);
    setClientes(cls || []);
    setInmuebles(inm || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filterTipo === 'todos'
    ? oportunidades
    : oportunidades.filter(o => o.tipo === filterTipo);

  const moveToEtapa = async (id, newEtapa) => {
    const updates = { etapa: newEtapa, updated_at: new Date().toISOString() };
    if (newEtapa === 'cerrado') updates.fecha_cierre = new Date().toISOString().slice(0, 10);
    await supabase.from('oportunidades').update(updates).eq('id', id);
    setOportunidades(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleDragStart = (e, id) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, etapa) => {
    e.preventDefault();
    dragOverColumn.current = etapa;
  };

  const handleDrop = (e, etapa) => {
    e.preventDefault();
    if (dragItem.current) {
      moveToEtapa(dragItem.current, etapa);
      dragItem.current = null;
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta oportunidad?')) return;
    await supabase.from('oportunidades').delete().eq('id', id);
    fetchData();
  };

  // Stats
  const totalOps = filtered.length;
  const cerrados = filtered.filter(o => o.etapa === 'cerrado').length;
  const montoTotal = filtered.filter(o => o.etapa === 'cerrado').reduce((s, o) => s + Number(o.monto_estimado || 0), 0);
  const conversion = totalOps > 0 ? ((cerrados / totalOps) * 100).toFixed(0) : 0;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Pipeline de Operaciones</h2>
          <p className={styles.pageSubtitle}>Seguimiento de consultas, visitas y cierres</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className={styles.formSelect}
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
            style={{ width: 'auto', minWidth: 120 }}
          >
            <option value="todos">Todos</option>
            <option value="venta">Ventas</option>
            <option value="alquiler">Alquileres</option>
          </select>
          <button className={styles.btnPrimary} onClick={() => { setEditData(null); setShowModal(true); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Oportunidad
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className={styles.statInfo}><h3>En Pipeline</h3><p>{totalOps}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className={styles.statInfo}><h3>Cerrados</h3><p>{cerrados}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGold}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className={styles.statInfo}><h3>Monto Cerrado</h3><p>$ {formatCurrency(montoTotal)}</p></div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconPurple}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className={styles.statInfo}><h3>Conversión</h3><p>{conversion}%</p></div>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', minWidth: ETAPAS.length * 220 }}>
          {ETAPAS.map(etapa => {
            const cards = filtered.filter(o => o.etapa === etapa.key);
            return (
              <div
                key={etapa.key}
                onDragOver={e => handleDragOver(e, etapa.key)}
                onDrop={e => handleDrop(e, etapa.key)}
                style={{
                  flex: '1 0 200px',
                  minHeight: '300px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                }}
              >
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${etapa.color}30` }}>
                  <span>{etapa.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)', flex: 1 }}>{etapa.label}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: `${etapa.color}20`, color: etapa.color, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cards.map(op => (
                    <div
                      key={op.id}
                      draggable
                      onDragStart={e => handleDragStart(e, op.id)}
                      onClick={() => { setEditData(op); setShowModal(true); }}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        cursor: 'grab',
                        transition: 'all 0.15s',
                        borderLeft: `3px solid ${etapa.color}`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--white)', marginBottom: '0.25rem' }}>
                        {op.inmueble?.direccion || op.notas?.slice(0, 30) || 'Sin dirección'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.375rem' }}>
                        {op.cliente?.nombre || 'Sin cliente'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: etapa.color }}>
                          {op.monto_estimado ? `$ ${formatCurrency(op.monto_estimado)}` : '-'}
                        </span>
                        <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', background: op.tipo === 'venta' ? 'rgba(129,140,248,0.1)' : 'rgba(56,189,248,0.1)', color: op.tipo === 'venta' ? '#818cf8' : '#38bdf8' }}>
                          {op.tipo === 'venta' ? 'Venta' : 'Alquiler'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <OportunidadModal
          editData={editData}
          clientes={clientes}
          inmuebles={inmuebles}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSaved={fetchData}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

// ── Oportunidad Modal ──
function OportunidadModal({ editData, clientes, inmuebles, onClose, onSaved, onDelete }) {
  const [form, setForm] = useState({
    tipo: editData?.tipo || 'venta',
    inmueble_id: editData?.inmueble_id || '',
    cliente_id: editData?.cliente_id || '',
    etapa: editData?.etapa || 'consulta',
    monto_estimado: editData?.monto_estimado || '',
    moneda: editData?.moneda || 'ARS',
    agente: editData?.agente || '',
    notas: editData?.notas || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload = {
      ...form,
      monto_estimado: parseFloat(form.monto_estimado) || null,
      inmueble_id: form.inmueble_id || null,
      cliente_id: form.cliente_id || null,
      updated_at: new Date().toISOString(),
    };

    if (form.etapa === 'cerrado' && !editData?.fecha_cierre) {
      payload.fecha_cierre = new Date().toISOString().slice(0, 10);
    }

    try {
      if (editData?.id) {
        const { error } = await supabase.from('oportunidades').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('oportunidades').insert(payload);
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{editData ? 'Editar Oportunidad' : 'Nueva Oportunidad'}</h3>
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
                <label className={styles.formLabel}>Tipo *</label>
                <select className={styles.formSelect} name="tipo" value={form.tipo} onChange={handleChange}>
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Etapa</label>
                <select className={styles.formSelect} name="etapa" value={form.etapa} onChange={handleChange}>
                  {ETAPAS.map(e => <option key={e.key} value={e.key}>{e.icon} {e.label}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Inmueble</label>
                <select className={styles.formSelect} name="inmueble_id" value={form.inmueble_id} onChange={handleChange}>
                  <option value="">— Seleccionar —</option>
                  {inmuebles.map(i => <option key={i.id} value={i.id}>{i.direccion}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cliente</label>
                <select className={styles.formSelect} name="cliente_id" value={form.cliente_id} onChange={handleChange}>
                  <option value="">— Seleccionar —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Monto Estimado ($)</label>
                <input className={styles.formInput} type="number" step="0.01" name="monto_estimado" value={form.monto_estimado} onChange={handleChange} placeholder="500000" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Agente</label>
                <input className={styles.formInput} type="text" name="agente" value={form.agente} onChange={handleChange} placeholder="Nombre del agente" />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Notas</label>
                <textarea className={styles.formTextarea} name="notas" value={form.notas} onChange={handleChange} rows={3} placeholder="Detalles de la operación..." />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            {editData?.id && (
              <button type="button" style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', marginRight: 'auto' }} onClick={() => { onDelete(editData.id); onClose(); }}>
                Eliminar
              </button>
            )}
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando...' : (editData ? 'Guardar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
