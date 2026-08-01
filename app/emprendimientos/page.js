'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './page.module.css';

export default function EmprendimientosPage() {
  const [developments, setDevelopments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevelopments() {
      try {
        setLoading(true);
        const res = await fetch('/api/developments');
        if (res.ok) {
          const data = await res.json();
          setDevelopments(data.developments || []);
        } else {
          setDevelopments([]);
        }
      } catch (err) {
        console.error('Error fetching developments:', err);
        setDevelopments([]);
      } finally {
        setLoading(false);
      }
    }

    loadDevelopments();
  }, []);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className="container">
            <AnimatedSection animation="fade-up">
              <span className="subtitle">Proyectos</span>
              <h1 className={styles.pageTitle}>
                Emprendimientos <span className="text-gold">inmobiliarios</span>
              </h1>
              <p className={styles.pageDesc}>
                Invertí en los mejores desarrollos e invenciones inmobiliarias. Proyectos seleccionados con potencial de valorización y calidad constructiva superior.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <div className={`container ${styles.devGrid}`}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', width: '100%', color: 'var(--text-secondary)' }}>
              <p>Cargando emprendimientos...</p>
            </div>
          ) : developments.length > 0 ? (
            developments.map((dev, i) => (
              <AnimatedSection key={dev.id} animation="fade-up" delay={i * 150}>
                <article className={styles.devCard}>
                  <div className={styles.devImageWrapper}>
                    <Image src={dev.image} alt={dev.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 50vw" />
                    <span className={`${styles.devStatus} ${styles.blue}`}>{dev.status}</span>
                  </div>
                  <div className={styles.devBody}>
                    <div className={styles.devTop}>
                      <h2 className={styles.devTitle}>{dev.title}</h2>
                      <p className={styles.devLocation}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {dev.location}
                      </p>
                      <p className={styles.devDesc}>{dev.description}</p>
                    </div>
                    {dev.units && (
                      <div className={styles.devMeta}>
                        <div className={styles.devMetaItem}>
                          <span className={styles.devMetaLabel}>Unidades</span>
                          <span className={styles.devMetaValue}>{dev.units}</span>
                        </div>
                      </div>
                    )}
                    <Link href="/contacto" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Solicitar información
                    </Link>
                  </div>
                </article>
              </AnimatedSection>
            ))
          ) : (
            <div style={{
              width: '100%',
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '1.25rem',
              backdropFilter: 'blur(10px)',
              marginTop: '1rem'
            }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="1.5">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Próximamente nuevos lanzamientos
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
                En este momento no contamos con emprendimientos en desarrollo activos. Consultanos directamente para conocer oportunidades de inversión en pozo y próximos proyectos.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="https://wa.me/5491166092461?text=Hola%20M%C3%B3nica%20Cardoso%20Propiedades%2C%20quisiera%20consultar%20sobre%20pr%C3%B3ximos%20emprendimientos."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Consultar por WhatsApp
                </a>
                <Link href="/contacto" className="btn btn-secondary">
                  Ir a contacto
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
