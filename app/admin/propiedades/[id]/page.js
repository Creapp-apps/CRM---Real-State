'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '@/components/admin/admin.module.css';

const MOCK_PROPERTY = {
  id: 1,
  title: 'Departamento en Palermo Soho',
  type: 'Departamento',
  operation: 'Venta',
  price: 'USD 185.000',
  neighborhood: 'Palermo',
  address: 'Thames 1800, Palermo, CABA',
  bedrooms: 2,
  bathrooms: 1,
  area: 65,
  image: '/images/property-interior.jpg',
  tokkoId: 'TK-48291',
  // Complementary fields (editable)
  customDescription: '',
  featured: true,
  displayOrder: 1,
  tags: 'luminoso, balcón',
};

export default function AdminPropertyEdit() {
  const params = useParams();
  const router = useRouter();
  const property = { ...MOCK_PROPERTY, id: params.id };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Editar Propiedad</h2>
          <p className={styles.pageSubtitle}>ID Tokko: {property.tokkoId}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className={styles.btnSecondary} onClick={() => router.back()}>
            ← Volver
          </button>
          <button className={styles.btnPrimary}>
            Guardar Cambios
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Tokko Data (read-only) */}
        <div className={styles.card}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Datos de Tokko
            <span className={`${styles.badge} ${styles.badgeBlue}`} style={{ marginLeft: '0.75rem' }}>Solo lectura</span>
          </h3>
          <div style={{ position: 'relative', height: 200, borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
            <Image src={property.image} alt={property.title} fill style={{ objectFit: 'cover' }} sizes="400px" />
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Título</span><div style={{ color: 'var(--white)' }}>{property.title}</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo</span><div style={{ color: 'var(--white)' }}>{property.type}</div></div>
              <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Operación</span><div style={{ color: 'var(--white)' }}>{property.operation}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Precio</span><div style={{ color: 'var(--gold)', fontWeight: 600 }}>{property.price}</div></div>
              <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Ambientes</span><div style={{ color: 'var(--white)' }}>{property.bedrooms}</div></div>
              <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Superficie</span><div style={{ color: 'var(--white)' }}>{property.area} m²</div></div>
            </div>
            <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Dirección</span><div style={{ color: 'var(--white)' }}>{property.address}</div></div>
          </div>
        </div>

        {/* Complementary Fields (editable) */}
        <div className={styles.card}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Datos Complementarios
            <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ marginLeft: '0.75rem' }}>Editable</span>
          </h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción personalizada</label>
            <textarea className={styles.formTextarea} defaultValue={property.customDescription} placeholder="Descripción adicional que se mostrará en la web..." rows={4} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tags / Características</label>
            <input className={styles.formInput} defaultValue={property.tags} placeholder="luminoso, balcón, pileta..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Orden de visualización</label>
              <input className={styles.formInput} type="number" defaultValue={property.displayOrder} min={1} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Propiedad Destacada</label>
              <select className={styles.formSelect} defaultValue={property.featured ? 'yes' : 'no'}>
                <option value="yes">★ Sí — Destacada</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
