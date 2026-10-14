'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import { supabase } from '@/lib/supabase';
import ClienteModal from '@/components/admin/administraciones/ClienteModal';

const TIPO_LABELS = { locador: 'Locador', locatario: 'Locatario', ambos: 'Ambos' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [fichaCliente, setFichaCliente] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('clientes').select('*').order('created_at', { ascending: false });
    if (filterTipo !== 'todos') {
      query = filterTipo === 'locador'
        ? query.in('tipo', ['locador', 'ambos'])
        : query.in('tipo', ['locatario', 'ambos']);
    }
    const { data, error } = await query;
    if (!error && data) setClientes(data);
    setLoading(false);
  }, [filterTipo]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const filtered = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.dni_cuit?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search)
  );

  const handleEdit = (cliente) => {
    setEditData(cliente);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return alert('Error: ' + error.message);
    fetchClientes();
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
        {['todos', 'locador', 'locatario'].map(t => (
          <button
            key={t}
            className={`${styles.filterTab} ${filterTipo === t ? styles.filterTabActive : ''}`}
            onClick={() => setFilterTipo(t)}
          >
            {t === 'todos' ? 'Todos' : t === 'locador' ? 'Locadores' : 'Locatarios'}
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
                    <span className={`${styles.badge} ${c.tipo === 'locador' ? styles.badgeBlue : c.tipo === 'locatario' ? styles.badgeGreen : styles.badgeYellow}`}>
                      {TIPO_LABELS[c.tipo]}
                    </span>
                  </td>
                  <td>{c.dni_cuit || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
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
        onSaved={fetchClientes}
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
                <span className={`${styles.badge} ${fichaCliente.tipo === 'locador' ? styles.badgeBlue : fichaCliente.tipo === 'locatario' ? styles.badgeGreen : styles.badgeYellow}`} style={{ marginTop: '0.375rem' }}>
                  {TIPO_LABELS[fichaCliente.tipo]}
                </span>
              </div>

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
