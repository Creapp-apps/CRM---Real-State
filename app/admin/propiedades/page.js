'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';
import { fetchMeliItems } from '@/lib/admin-fetchers';

export default function AdminProperties() {
  const { data, isLoading: loading, error: swrError } = useSWR('meli-items', fetchMeliItems);
  const properties = data?.properties || [];
  const error = swrError?.message || null;
  const [search, setSearch] = useState('');

  const filtered = properties.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase()) ||
    p.type?.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (currency, price, priceLabel) => {
    if (!price) return '-';
    return `${currency} ${Number(price).toLocaleString('es-AR')}${priceLabel || ''}`;
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Propiedades</h2>
          <p className={styles.pageSubtitle}>Publicaciones activas en MercadoLibre</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href="https://www.mercadolibre.com.ar/anuncios"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnSecondary}
          >
            <Icon name="external-link" size={16} />
            Ver en MercadoLibre
          </a>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <Icon name="search" size={16} />
            <input
              placeholder="Buscar por título, zona o tipo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.tableActions}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
              {loading ? 'Cargando...' : `${filtered.length} publicaciones`}
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
              <th>Zona</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  Cargando publicaciones de MercadoLibre...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  {error === 'MELI no conectado' || error?.includes('conectado')
                    ? 'Cuenta MercadoLibre no conectada'
                    : error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  No hay publicaciones activas.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 60, height: 44, borderRadius: '0.375rem', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                            <Icon name="image" size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ color: 'var(--white)', fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.address}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-300)' }}>{p.type}</td>
                  <td>
                    <span className={`${styles.badge} ${p.operationType === 'venta' ? styles.badgeBlue : styles.badgeYellow}`}>
                      {p.operation}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--white)' }}>
                    {formatPrice(p.currency, p.price, p.priceLabel)}
                  </td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>{p.location}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/admin/propiedades/${p.id}`}
                        className={styles.btnIcon}
                        title="Editar publicación"
                      >
                        <Icon name="edit" size={14} />
                      </Link>
                      <Link
                        href={`/ficha/${p.id}`}
                        className={styles.btnIcon}
                        title="Ver ficha"
                        target="_blank"
                      >
                        <Icon name="eye" size={14} />
                      </Link>
                      <a
                        href={p.publicUrl}
                        className={styles.btnIcon}
                        title="Ver en MercadoLibre"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon name="external-link" size={14} />
                      </a>
                    </div>
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
