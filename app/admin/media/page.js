'use client';

import { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/admin/Icon';
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
          <Icon name="upload" size={16} />
          Subir Archivos
        </button>
      </div>

      {/* Upload Area */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className={styles.dropzone}>
          <div className={styles.dropzoneIcon}><Icon name="upload" size={24} /></div>
          <div className={styles.dropzoneTitle}><b>Arrastrá imágenes</b> aquí para subirlas</div>
          <div className={styles.dropzoneHint}>JPG, PNG, WEBP — máximo 5MB por archivo</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div className={styles.searchBar} style={{ maxWidth: 300 }}>
          <Icon name="search" size={16} />
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
                  <Icon name="file-text" size={12} />
                </button>
                <button className={styles.btnIcon} title="Eliminar" style={{ width: 28, height: 28 }}>
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
