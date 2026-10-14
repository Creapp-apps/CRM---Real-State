'use client';

import { useParams, useRouter } from 'next/navigation';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

export default function AdminEmprendimientoEdit() {
  const params = useParams();
  const router = useRouter();

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Editar Emprendimiento</h2>
          <p className={styles.pageSubtitle}>ID: {params.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className={styles.btnSecondary} onClick={() => router.back()}>← Volver</button>
          <button className={styles.btnPrimary}>
            <Icon name="save" size={16} />
            Guardar Cambios
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className={styles.card}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Información General</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre del Emprendimiento</label>
            <input className={styles.formInput} defaultValue="River Park Towers" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ubicación</label>
              <input className={styles.formInput} defaultValue="Puerto Madero" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Dirección</label>
              <input className={styles.formInput} defaultValue="Av. de los Italianos 500" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <textarea className={styles.formTextarea} defaultValue="Complejo residencial premium frente al río con amenities de primer nivel." rows={5} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Unidades totales</label>
              <input className={styles.formInput} type="number" defaultValue={120} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio desde</label>
              <input className={styles.formInput} defaultValue="USD 180.000" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Avance de obra (%)</label>
              <input className={styles.formInput} type="number" defaultValue={75} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Amenities</label>
            <input className={styles.formInput} defaultValue="Pileta, SUM, Gym, Seguridad 24hs" />
          </div>
        </div>

        <div>
          <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Publicación</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Estado</label>
              <select className={styles.formSelect} defaultValue="active">
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fecha de entrega estimada</label>
              <input className={styles.formInput} type="date" defaultValue="2026-12-01" />
            </div>
          </div>
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Imágenes</h3>
            <div style={{ border: '2px dashed var(--admin-gold-20)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', color: 'var(--gray-500)', cursor: 'pointer' }}>
              <div style={{ color: 'var(--admin-gold)', margin: '0 auto 0.5rem', display: 'inline-flex' }}>
                <Icon name="upload" size={32} />
              </div>
              <div style={{ fontSize: '0.8rem' }}>Arrastrá imágenes aquí</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
