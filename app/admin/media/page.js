'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from '@/components/admin/admin.module.css';

const MOCK_MEDIA = [
  { id: 1, name: 'hero-bg.jpg', size: '2.4 MB', type: 'image/jpeg', date: '10 Mar 2026', src: '/images/hero-bg.jpg', usage: 'Hero, Propiedades' },
  { id: 2, name: 'property-interior.jpg', size: '1.8 MB', type: 'image/jpeg', date: '10 Mar 2026', src: '/images/property-interior.jpg', usage: 'Propiedades' },
  { id: 3, name: 'hero-bg.jpg', size: '3.1 MB', type: 'image/jpeg', date: '08 Mar 2026', src: '/images/hero-bg.jpg', usage: 'Emprendimientos' },
  { id: 4, name: 'property-interior.jpg', size: '1.2 MB', type: 'image/jpeg', date: '08 Mar 2026', src: '/images/property-interior.jpg', usage: 'Propiedades' },
  { id: 5, name: 'hero-bg.jpg', size: '2.0 MB', type: 'image/jpeg', date: '05 Mar 2026', src: '/images/hero-bg.jpg', usage: 'Sin usar' },
  { id: 6, name: 'property-interior.jpg', size: '1.5 MB', type: 'image/jpeg', date: '05 Mar 2026', src: '/images/property-interior.jpg', usage: 'Sin usar' },
];

export default function AdminMedia() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_MEDIA.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Galería de Media</h2>
          <p className={styles.pageSubtitle}>{MOCK_MEDIA.length} archivos</p>
        </div>
        <button className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          Subir Archivos
        </button>
      </div>

      {/* Upload Area */}
      <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
        <div style={{
          border: '2px dashed rgba(201,169,110,0.2)',
          borderRadius: '0.75rem',
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--gray-500)',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Arrastrá imágenes aquí para subirlas</div>
          <div style={{ fontSize: '0.75rem' }}>JPG, PNG, WEBP — máximo 5MB por archivo</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div className={styles.searchBar} style={{ maxWidth: 300 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input placeholder="Buscar archivos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Gallery Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {filtered.map(media => (
          <div key={media.id} className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: 130 }}>
              <Image src={media.src} alt={media.name} fill style={{ objectFit: 'cover' }} sizes="200px" />
            </div>
            <div style={{ padding: '0.75rem' }}>
              <div style={{ color: 'var(--white)', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{media.size}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{media.date}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                <button className={styles.btnIcon} title="Copiar URL" style={{ width: 28, height: 28 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </button>
                <button className={styles.btnIcon} title="Eliminar" style={{ width: 28, height: 28 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
