'use client';

import { useParams, useRouter } from 'next/navigation';
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
          <button className={styles.btnPrimary}>Guardar Cambios</button>
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
            <div style={{ border: '2px dashed rgba(201,169,110,0.2)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', color: 'var(--gray-500)', cursor: 'pointer' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <div style={{ fontSize: '0.8rem' }}>Arrastrá imágenes aquí</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
