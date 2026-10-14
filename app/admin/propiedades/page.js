'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/admin/Icon';
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
            <Icon name="activity" size={16} />
            Sincronizar Tokko
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <Icon name="search" size={16} />
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-gold)' }}>Las propiedades se sincronizarán desde la API oficial.</span>
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 48, height: 36, borderRadius: '0.375rem', overflow: 'hidden', position: 'relative', flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                        {/* Fallback image placeholder until we fetch images */}
                        <Icon name="image" size={20} />
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
                    {p.is_featured && <span className={`${styles.badge} ${styles.badgeGold}`}>★ Destacada</span>}
                  </td>
                  <td>
                    <Link href={`/admin/propiedades/${p.id}`} className={styles.btnIcon} title="Editar detalle (Pronto)">
                      <Icon name="edit" size={14} />
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
