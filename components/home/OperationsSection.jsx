'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './OperationsSection.module.css';

const OPERATIONS = [
  {
    title: 'Venta',
    description: 'Encontrá tu propiedad ideal para comprar',
    image: '/images/hero-bg.jpg',
    href: '/propiedades?operacion=venta',
    count: 'Propiedades disponibles',
  },
  {
    title: 'Alquiler',
    description: 'Las mejores opciones para alquilar',
    image: '/images/property-interior.jpg',
    href: '/propiedades?operacion=alquiler',
    count: 'Propiedades disponibles',
  },
  {
    title: 'Temporario',
    description: 'Alquileres temporarios y turísticos',
    image: '/images/hero-bg.jpg',
    href: '/propiedades?operacion=temporario',
    count: 'Propiedades disponibles',
  },
  {
    title: 'Emprendimientos',
    description: 'Proyectos nuevos y en construcción',
    image: '/images/property-interior.jpg',
    href: '/emprendimientos',
    count: 'Proyectos activos',
  },
];

/* ── 3D Card Wrapper ── */
function Card3D({ children }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = useCallback((e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotateX = (0.5 - y) * 20; // -10deg to +10deg
    const rotateY = (x - 0.5) * 20;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`
    );
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('');
  }, []);

  return (
    <div
      ref={cardRef}
      className={styles.card3dContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform }}
    >
      {children}
    </div>
  );
}

export default function OperationsSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <AnimatedSection animation="fade-up" className={styles.header}>
          <span className="subtitle">Explorá</span>
          <h2 className={styles.title}>
            ¿Qué estás <span className="text-gold">buscando</span>?
          </h2>
          <hr className="divider divider-center" />
        </AnimatedSection>

        <div className={styles.grid}>
          {OPERATIONS.map((op, i) => (
            <AnimatedSection
              key={i}
              animation="scale-in"
              delay={i * 100}
            >
              <Card3D>
                <Link href={op.href} className={styles.card}>
                  <div className={styles.cardImage}>
                    <Image
                      src={op.image}
                      alt={op.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className={styles.cardOverlay} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{op.title}</h3>
                    <p className={styles.cardDesc}>{op.description}</p>
                    <span className={styles.cardCta}>
                      Ver propiedades
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </span>
                  </div>
                </Link>
              </Card3D>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
