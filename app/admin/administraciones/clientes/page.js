'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import { supabase } from '@/lib/supabase';
import ClienteModal from '@/components/admin/administraciones/ClienteModal';
import { fetchClientes } from '@/lib/admin-fetchers';

// Tipo de cliente → etiqueta + color de badge.
const TIPO_META = {
  locador:    { label: 'Locador',    badge: 'badgeBlue' },
  locatario:  { label: 'Locatario',  badge: 'badgeGreen' },
  ambos:      { label: 'Ambos',      badge: 'badgeYellow' },
  comprador:  { label: 'Comprador',  badge: 'badgeGold' },
  vendedor:   { label: 'Vendedor',   badge: 'badgeRed' },
  prospecto:  { label: 'Prospecto',  badge: 'badgeGray' },
};
const tipoMeta = (t) => TIPO_META[t] || { label: t || '—', badge: 'badgeGray' };

// Filtros (pestañas). 'ambos' cuenta como locador y locatario.
const FILTER_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'locador', label: 'Locadores' },
  { key: 'locatario', label: 'Locatarios' },
  { key: 'comprador', label: 'Compradores' },
  { key: 'vendedor', label: 'Vendedores' },
  { key: 'prospecto', label: 'Prospectos' },
];

// Helpers de contacto.
const onlyDigits = (s) => (s || '').replace(/\D/g, '');
const waLink = (phone) => {
  const d = onlyDigits(phone);
  if (!d) return null;
  const intl = d.startsWith('54') ? d : '549' + d; // Argentina (best-effort)
  return `https://wa.me/${intl}`;
};
const telLink = (phone) => { const d = onlyDigits(phone); return d ? `tel:${d}` : null; };

const ETAPA_LABELS = { consulta: 'Consulta', visita: 'Visita', oferta: 'Oferta', reserva: 'Reserva', firma: 'Firma', cerrado: 'Cerrado', perdido: 'Perdido' };
const ESTADO_CONTRATO = { activo: 'badgeGreen', vencido: 'badgeRed', rescindido: 'badgeGray', proximo_a_vencer: 'badgeYellow' };
const fmtFecha = (s) => s ? new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';

export default function ClientesPage() {
  const { data: clientes = [], isLoading: loading, mutate } = useSWR('clientes', fetchClientes);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [fichaCliente, setFichaCliente] = useState(null);
  const [fichaRels, setFichaRels] = useState({ contratos: [], oportunidades: [], loading: false });

  // Al abrir la ficha, trae contratos y oportunidades del cliente.
  useEffect(() => {
    if (!fichaCliente) return;
    let cancel = false;
    setFichaRels({ contratos: [], oportunidades: [], loading: true });
    (async () => {
      const [ct, op] = await Promise.all([
        supabase.from('contratos')
          .select('id, estado, fecha_inicio, fecha_fin, monto_inicial, moneda, inmueble:inmuebles_administrados(direccion)')
          .or(`locador_id.eq.${fichaCliente.id},locatario_id.eq.${fichaCliente.id}`)
          .order('fecha_inicio', { ascending: false }),
        supabase.from('oportunidades')
          .select('id, etapa, tipo, titulo_propiedad, inmueble:inmuebles_administrados(direccion)')
          .eq('cliente_id', fichaCliente.id)
          .order('updated_at', { ascending: false }),
      ]);
      if (!cancel) setFichaRels({ contratos: ct.data || [], oportunidades: op.data || [], loading: false });
    })();
    return () => { cancel = true; };
  }, [fichaCliente]);

  const q = search.toLowerCase();
  const qDigits = onlyDigits(search);
  const matchTipo = (c) =>
    filterTipo === 'todos' ||
    c.tipo === filterTipo ||
    (c.tipo === 'ambos' && (filterTipo === 'locador' || filterTipo === 'locatario'));
  const filtered = clientes.filter(c => matchTipo(c) && (
    !search ||
    c.nombre?.toLowerCase().includes(q) ||
    c.dni_cuit?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    (qDigits && onlyDigits(c.telefono).includes(qDigits))
  ));

  const handleEdit = (cliente) => { setEditData(cliente); setModalOpen(true); };
  const handleNew  = ()        => { setEditData(null);    setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return alert('Error: ' + error.message);
    mutate(prev => prev.filter(c => c.id !== id), false);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Clientes</h2>
          <p className={styles.pageSubtitle}>Base de datos de locadores y locatarios</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleNew}>
          <Icon name="plus" size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {FILTER_TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.filterTab} ${filterTipo === t.key ? styles.filterTabActive : ''}`}
            onClick={() => setFilterTipo(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <Icon name="search" size={16} />
            <input placeholder="Buscar por nombre, DNI o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
            {loading ? 'Cargando...' : `${filtered.length} clientes`}
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>DNI / CUIT</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando clientes...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  No hay clientes registrados
                  <br /><br />
                  <button className={styles.btnPrimary} onClick={handleNew}>Crear primer cliente</button>
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--white)', fontWeight: 500 }}>{c.nombre}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[tipoMeta(c.tipo).badge]}`}>
                      {tipoMeta(c.tipo).label}
                    </span>
                  </td>
                  <td>{c.dni_cuit || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {c.telefono && (
                        <a className={styles.btnIcon} href={waLink(c.telefono)} target="_blank" rel="noreferrer" title="WhatsApp" style={{ color: '#25D366' }}>
                          <Icon name="whatsapp" size={14} />
                        </a>
                      )}
                      <button className={styles.btnIcon} onClick={() => setFichaCliente(c)} title="Ver ficha" style={{ color: 'var(--admin-gold)' }}>
                        <Icon name="eye" size={14} />
                      </button>
                      <button className={styles.btnIcon} onClick={() => handleEdit(c)} title="Editar">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className={styles.btnIcon} onClick={() => handleDelete(c.id)} title="Eliminar" style={{ color: '#f87171' }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ClienteModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSaved={() => mutate()}
        editData={editData}
      />

      {/* Ficha del Cliente */}
      {fichaCliente && (
        <div className={styles.modalOverlay} onClick={() => setFichaCliente(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ficha del Cliente</h3>
              <button className={styles.modalClose} onClick={() => setFichaCliente(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Nombre y tipo */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--admin-gold-20), var(--admin-gold-08))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '1.3rem', fontWeight: 700, color: 'var(--admin-gold)' }}>
                  {fichaCliente.nombre?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)' }}>{fichaCliente.nombre}</div>
                <span className={`${styles.badge} ${styles[tipoMeta(fichaCliente.tipo).badge]}`} style={{ marginTop: '0.375rem' }}>
                  {tipoMeta(fichaCliente.tipo).label}
                </span>
              </div>

              {/* Acciones rápidas de contacto */}
              {(fichaCliente.telefono || fichaCliente.email) && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {fichaCliente.telefono && (
                    <a href={waLink(fichaCliente.telefono)} target="_blank" rel="noreferrer" className={styles.btnSecondary} style={{ color: '#25D366' }}>
                      <Icon name="whatsapp" size={14} /> WhatsApp
                    </a>
                  )}
                  {fichaCliente.telefono && (
                    <a href={telLink(fichaCliente.telefono)} className={styles.btnSecondary}>
                      <Icon name="phone" size={14} /> Llamar
                    </a>
                  )}
                  {fichaCliente.email && (
                    <a href={`mailto:${fichaCliente.email}`} className={styles.btnSecondary}>
                      <Icon name="mail" size={14} /> Email
                    </a>
                  )}
                </div>
              )}

              {/* Datos Personales */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>Datos Personales</div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  {[['DNI / CUIT', fichaCliente.dni_cuit], ['Teléfono', fichaCliente.telefono], ['Email', fichaCliente.email], ['Domicilio', fichaCliente.domicilio]].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                      <span style={{ color: '#888' }}>{label}</span>
                      <span style={{ color: val ? 'var(--white)' : '#555', fontWeight: val ? 500 : 400 }}>{val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Datos Bancarios */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--admin-gold)', fontWeight: 600, marginBottom: '0.5rem' }}>Datos Bancarios</div>
                <div style={{ background: 'var(--admin-gold-08)', border: '1px solid var(--admin-gold-10)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  {[['CBU', fichaCliente.cbu], ['Alias', fichaCliente.alias], ['Banco', fichaCliente.banco], ['Titular', fichaCliente.titular_cuenta]].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--admin-gold-08)', fontSize: '0.85rem' }}>
                      <span style={{ color: '#888' }}>{label}</span>
                      <span style={{ color: val ? 'var(--white)' : '#555', fontWeight: val ? 500 : 400, fontFamily: label === 'CBU' ? 'monospace' : 'inherit' }}>{val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              {fichaCliente.notas && (
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>Notas</div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-300)', whiteSpace: 'pre-wrap' }}>
                    {fichaCliente.notas}
                  </div>
                </div>
              )}

              {/* Relaciones: contratos y oportunidades del cliente */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Contratos {fichaRels.loading ? '' : `(${fichaRels.contratos.length})`}
                </div>
                {fichaRels.loading ? (
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Cargando…</div>
                ) : fichaRels.contratos.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>Sin contratos</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {fichaRels.contratos.map(ct => (
                      <div key={ct.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.4rem', padding: '0.5rem 0.65rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--gray-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ct.inmueble?.direccion || 'Inmueble'} · {fmtFecha(ct.fecha_inicio)}–{fmtFecha(ct.fecha_fin)}
                        </span>
                        <span className={`${styles.badge} ${styles[ESTADO_CONTRATO[ct.estado] || 'badgeGray']}`} style={{ flexShrink: 0 }}>{ct.estado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Oportunidades {fichaRels.loading ? '' : `(${fichaRels.oportunidades.length})`}
                </div>
                {fichaRels.loading ? (
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Cargando…</div>
                ) : fichaRels.oportunidades.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>Sin oportunidades</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {fichaRels.oportunidades.map(op => (
                      <div key={op.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.4rem', padding: '0.5rem 0.65rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--gray-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {op.inmueble?.direccion || op.titulo_propiedad || 'Oportunidad'} · {op.tipo === 'venta' ? 'Venta' : 'Alquiler'}
                        </span>
                        <span className={`${styles.badge} ${styles.badgeGray}`} style={{ flexShrink: 0 }}>{ETAPA_LABELS[op.etapa] || op.etapa}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => { setFichaCliente(null); handleEdit(fichaCliente); }}>Editar</button>
              <button className={styles.btnPrimary} onClick={() => setFichaCliente(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
