'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';
import InmuebleModal from '@/components/admin/administraciones/InmuebleModal';

const TIPO_LABEL = {
  departamento: 'Depto', casa: 'Casa', ph: 'PH', local: 'Local',
  oficina: 'Oficina', galpon: 'Galpón', terreno: 'Terreno', otro: 'Otro',
};

const ESTADO_BADGE = {
  disponible: styles.badgeGreen,
  alquilado: styles.badgeBlue,
  en_mantenimiento: styles.badgeYellow,
};

const ESTADO_LABEL = {
  disponible: 'Disponible',
  alquilado: 'Alquilado',
  en_mantenimiento: 'En Mant.',
};

export default function InmueblesPage() {
  const [inmuebles, setInmuebles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [fichaInmueble, setFichaInmueble] = useState(null);

  const fetchInmuebles = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('inmuebles_administrados').select('*').order('created_at', { ascending: false });
    if (filterEstado !== 'todos') query = query.eq('estado', filterEstado);
    const { data, error } = await query;
    if (!error && data) setInmuebles(data);
    setLoading(false);
  }, [filterEstado]);

  useEffect(() => { fetchInmuebles(); }, [fetchInmuebles]);

  const filtered = inmuebles.filter(i =>
    i.direccion?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => { setEditData(null); setModalOpen(true); };
  const handleEdit = (inmueble) => { setEditData(inmueble); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este inmueble?')) return;
    const { error } = await supabase.from('inmuebles_administrados').delete().eq('id', id);
    if (error) return alert('Error: ' + error.message);
    fetchInmuebles();
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Inmuebles Administrados</h2>
          <p className={styles.pageSubtitle}>Gestión de propiedades en administración</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Inmueble
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filterTabs}>
        {['todos', 'disponible', 'alquilado', 'en_mantenimiento'].map(t => (
          <button
            key={t}
            className={`${styles.filterTab} ${filterEstado === t ? styles.filterTabActive : ''}`}
            onClick={() => setFilterEstado(t)}
          >
            {t === 'todos' ? 'Todos' : ESTADO_LABEL[t]}
          </button>
        ))}
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Buscar por dirección..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
            {loading ? 'Cargando...' : `${filtered.length} inmuebles`}
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Dirección</th>
              <th>Tipo</th>
              <th>Sup. (m²)</th>
              <th>Amb.</th>
              <th>Cochera</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando inmuebles...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  No hay inmuebles registrados
                  <br /><br />
                  <button className={styles.btnPrimary} onClick={handleNew}>Cargar primer inmueble</button>
                </td>
              </tr>
            ) : (
              filtered.map(i => (
                <tr key={i.id}>
                  <td style={{ color: 'var(--white)', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i.direccion}
                  </td>
                  <td>{TIPO_LABEL[i.tipo] || i.tipo}</td>
                  <td>
                    {i.superficie_cubierta ? `${i.superficie_cubierta} cub.` : '-'}
                    {i.superficie_descubierta ? ` / ${i.superficie_descubierta} desc.` : ''}
                  </td>
                  <td>{i.ambientes || '-'}</td>
                  <td>{i.cochera ? '✓' : '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${ESTADO_BADGE[i.estado] || styles.badgeGray}`}>
                      {ESTADO_LABEL[i.estado] || i.estado}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button className={styles.btnIcon} onClick={() => setFichaInmueble(i)} title="Ver ficha" style={{ color: 'var(--gold)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className={styles.btnIcon} onClick={() => handleEdit(i)} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className={styles.btnIcon} onClick={() => handleDelete(i.id)} title="Eliminar" style={{ color: '#f87171' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InmuebleModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSaved={fetchInmuebles}
        editData={editData}
      />

      {/* Ficha del Inmueble */}
      {fichaInmueble && (
        <div className={styles.modalOverlay} onClick={() => setFichaInmueble(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ficha del Inmueble</h3>
              <button className={styles.modalClose} onClick={() => setFichaInmueble(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)' }}>{fichaInmueble.direccion}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
                  <span className={`${styles.badge} ${styles.badgeGold}`}>{TIPO_LABEL[fichaInmueble.tipo] || fichaInmueble.tipo}</span>
                  <span className={`${styles.badge} ${ESTADO_BADGE[fichaInmueble.estado] || styles.badgeGray}`}>{ESTADO_LABEL[fichaInmueble.estado] || fichaInmueble.estado}</span>
                </div>
              </div>

              {/* Características */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>Características</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    ['Sup. Cubierta', fichaInmueble.superficie_cubierta ? `${fichaInmueble.superficie_cubierta} m²` : null],
                    ['Sup. Descubierta', fichaInmueble.superficie_descubierta ? `${fichaInmueble.superficie_descubierta} m²` : null],
                    ['Ambientes', fichaInmueble.ambientes],
                    ['Baños', fichaInmueble.banos],
                    ['Cochera', fichaInmueble.cochera ? 'Sí' : 'No'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '0.15rem' }}>{label}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: val ? 'var(--white)' : '#555' }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Servicios */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#c9a96e', fontWeight: 600, marginBottom: '0.5rem' }}>Servicios</div>
                <div style={{ background: 'rgba(201,169,110,0.03)', border: '1px solid rgba(201,169,110,0.1)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  {Object.entries({ gas: 'Gas', agua: 'Agua', luz: 'Luz', boleta_municipal: 'Boleta Municipal' }).map(([key, label]) => {
                    const serv = fichaInmueble.servicios?.[key];
                    const activo = typeof serv === 'boolean' ? serv : serv?.activo;
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(201,169,110,0.06)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: activo ? '#4ade80' : '#f87171', fontSize: '0.7rem' }}>{activo ? '●' : '○'}</span>
                          <span style={{ color: '#888' }}>{label}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {serv?.nro_cuenta ? (
                            <span style={{ color: 'var(--white)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{serv.nro_cuenta}</span>
                          ) : (
                            <span style={{ color: '#555' }}>{activo ? 'Sin número' : '—'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones */}
              {fichaInmueble.observaciones && (
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>Observaciones</div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-300)', whiteSpace: 'pre-wrap' }}>
                    {fichaInmueble.observaciones}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => { setFichaInmueble(null); handleEdit(fichaInmueble); }}>Editar</button>
              <button className={styles.btnPrimary} onClick={() => setFichaInmueble(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
