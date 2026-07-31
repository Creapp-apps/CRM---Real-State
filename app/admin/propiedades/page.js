'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchProperties() {
      // In a real scenario with Tokko sync, these would come from the properties table
      // and we'd likely join a property_images table. For now, we fetch the base table.
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setProperties(data);
      }
      setLoading(false);
    }
    fetchProperties();
  }, []);

  const filtered = properties.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.neighborhood?.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (currency, price) => {
    if (!price) return '-';
    // Format number with dots: 150000 -> 150.000
    return `${currency || 'USD'} ${Number(price).toLocaleString('es-AR')}`;
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Propiedades</h2>
          <p className={styles.pageSubtitle}>Sincronizadas con Tokko · Gestión complementaria</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className={styles.btnSecondary} onClick={() => alert("La sincronización de TokkoBroker será implementada pronto.")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            Sincronizar Tokko
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input placeholder="Buscar propiedades..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.tableActions}>
             <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
              {loading ? 'Cargando...' : `${filtered.length} propiedades`}
            </span>
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Tipo</th>
              <th>Operación</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Destacada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: 'var(--gray-500)'}}>Cargando catálogo...</td></tr>
            ) : filtered.length === 0 ? (
               <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: 'var(--gray-500)'}}>
                  No hay propiedades registradas o coincidiendo con la búsqueda.
                  <br /><br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>Las propiedades se sincronizarán desde la API oficial.</span>
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 48, height: 36, borderRadius: '0.375rem', overflow: 'hidden', position: 'relative', flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Fallback image placeholder until we fetch images */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      </div>
                      <div>
                        <div style={{ color: 'var(--white)', fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.neighborhood}</div>
                      </div>
                    </div>
                  </td>
                  <td>{capitalize(p.property_type)}</td>
                  <td>
                    <span className={`${styles.badge} ${p.operation_type === 'venta' ? styles.badgeBlue : p.operation_type === 'alquiler' ? styles.badgeGreen : styles.badgeYellow}`}>
                      {capitalize(p.operation_type)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--white)' }}>{formatPrice(p.currency, p.price)}</td>
                  <td>
                    <span className={`${styles.badge} ${p.is_active ? styles.badgeGreen : styles.badgeGray}`}>
                      {p.is_active ? 'Activa' : 'Archivada'}
                    </span>
                  </td>
                  <td>
                    {p.is_featured && <span className={`${styles.badge} ${styles.badgeGold}`} style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)' }}>★ Destacada</span>}
                  </td>
                  <td>
                    <Link href={`/admin/propiedades/${p.id}`} className={styles.btnIcon} title="Editar detalle (Pronto)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
