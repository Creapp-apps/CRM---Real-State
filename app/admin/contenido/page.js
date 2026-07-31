'use client';

import { useState } from 'react';
import styles from '@/components/admin/admin.module.css';

const TABS = ['Hero', 'Estadísticas', 'Valores', 'CTA'];

const INITIAL_HERO = {
  subtitle: 'Venta, alquiler y tasaciones de propiedades en Argentina',
  scrollText: 'Descubrí Más',
};

const INITIAL_STATS = [
  { value: '500', suffix: '+', label: 'Propiedades vendidas' },
  { value: '15', suffix: '+', label: 'Años de experiencia' },
  { value: '1200', suffix: '+', label: 'Clientes satisfechos' },
  { value: '98', suffix: '%', label: 'Satisfacción' },
];

const INITIAL_VALUES = [
  { title: 'Confianza', description: 'Transparencia y honestidad en cada operación. Tu tranquilidad es nuestra prioridad.' },
  { title: 'Alcance', description: 'Amplia red de contactos y presencia en los principales portales inmobiliarios.' },
  { title: 'Dedicación', description: 'Acompañamiento personalizado desde la primera consulta hasta la escritura.' },
];

const INITIAL_CTA = {
  subtitle: 'Valorá tu inmueble',
  title: '¿Querés tasar tu propiedad?',
  description: 'Obtené una tasación profesional sin cargo. Nuestro equipo de expertos evalúa tu propiedad con los mejores datos del mercado.',
  btn1: 'Solicitar tasación gratuita',
  btn2: 'Contactanos',
};

export default function AdminContenido() {
  const [tab, setTab] = useState('Hero');

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Contenido del Sitio</h2>
          <p className={styles.pageSubtitle}>Editá los textos de la página principal</p>
        </div>
        <button className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          Guardar Todo
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'rgba(15,33,64,0.4)', padding: '0.25rem', borderRadius: '0.5rem', width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: tab === t ? 'rgba(201,169,110,0.15)' : 'transparent',
              color: tab === t ? 'var(--gold)' : 'var(--gray-400)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Hero' && (
        <div className={styles.card}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Sección Hero</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Subtítulo</label>
            <input className={styles.formInput} defaultValue={INITIAL_HERO.subtitle} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Texto de scroll</label>
            <input className={styles.formInput} defaultValue={INITIAL_HERO.scrollText} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Video de fondo</label>
            <div style={{ border: '2px dashed rgba(201,169,110,0.2)', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', color: 'var(--gray-500)', cursor: 'pointer' }}>
              <div style={{ fontSize: '0.8rem' }}>Arrastrá un video aquí o hacé click para seleccionar</div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Actual: hero-video.mp4</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Estadísticas' && (
        <div className={styles.card}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Contadores</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {INITIAL_STATS.map((stat, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 2fr', gap: '0.75rem', alignItems: 'end' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.formLabel}>Valor</label>
                  <input className={styles.formInput} defaultValue={stat.value} />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.formLabel}>Sufijo</label>
                  <input className={styles.formInput} defaultValue={stat.suffix} />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.formLabel}>Etiqueta</label>
                  <input className={styles.formInput} defaultValue={stat.label} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Valores' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {INITIAL_VALUES.map((val, i) => (
            <div key={i} className={styles.card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.formLabel}>Título</label>
                  <input className={styles.formInput} defaultValue={val.title} />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.formLabel}>Descripción</label>
                  <input className={styles.formInput} defaultValue={val.description} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'CTA' && (
        <div className={styles.card}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Sección CTA (Tasación)</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Subtítulo</label>
            <input className={styles.formInput} defaultValue={INITIAL_CTA.subtitle} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Título</label>
            <input className={styles.formInput} defaultValue={INITIAL_CTA.title} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <textarea className={styles.formTextarea} defaultValue={INITIAL_CTA.description} rows={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Botón primario</label>
              <input className={styles.formInput} defaultValue={INITIAL_CTA.btn1} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Botón secundario</label>
              <input className={styles.formInput} defaultValue={INITIAL_CTA.btn2} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
