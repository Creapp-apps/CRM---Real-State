import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './page.module.css';

const DEVELOPMENTS = [
  {
    id: 'river-park-towers',
    title: 'River Park Towers',
    location: 'Puerto Madero, CABA',
    status: 'En construcción',
    statusColor: 'orange',
    delivery: 'Diciembre 2027',
    priceFrom: 'USD 180.000',
    units: '120 unidades',
    image: '/images/hero-bg.jpg',
    description: 'Complejo residencial de dos torres con vista al río. Amenities premium: pileta infinita, spa, coworking, sky bar.',
    features: ['1 a 4 ambientes', 'Cocheras', 'Amenities premium', 'Vista al río'],
  },
  {
    id: 'nordelta-village',
    title: 'Nordelta Village',
    location: 'Nordelta, Tigre',
    status: 'En pozo',
    statusColor: 'blue',
    delivery: 'Junio 2028',
    priceFrom: 'USD 120.000',
    units: '80 unidades',
    image: '/images/property-house.jpg',
    description: 'Barrio residencial con casas y departamentos en el corazón de Nordelta. Entorno natural con laguna propia.',
    features: ['Casas y departamentos', 'Laguna', 'Club house', 'Seguridad 24hs'],
  },
  {
    id: 'palermo-lofts',
    title: 'Palermo Design Lofts',
    location: 'Palermo Hollywood, CABA',
    status: 'Entrega inmediata',
    statusColor: 'green',
    delivery: 'Inmediata',
    priceFrom: 'USD 95.000',
    units: '24 unidades',
    image: '/images/property-interior.jpg',
    description: 'Lofts de diseño en Palermo Hollywood. Ideales para inversión con renta. Edificio boutique con detalles premium.',
    features: ['Lofts 1 y 2 amb', 'Terraza común', 'Laundry', 'Bicicletero'],
  },
];

export default function EmprendimientosPage() {
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
                Invertí en los mejores desarrollos inmobiliarios. Proyectos seleccionados con potencial de valorización y calidad constructiva superior.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <div className={`container ${styles.devGrid}`}>
          {DEVELOPMENTS.map((dev, i) => (
            <AnimatedSection key={dev.id} animation="fade-up" delay={i * 150}>
              <article className={styles.devCard}>
                <div className={styles.devImageWrapper}>
                  <Image src={dev.image} alt={dev.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 50vw" />
                  <span className={`${styles.devStatus} ${styles[dev.statusColor]}`}>{dev.status}</span>
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
                  <div className={styles.devFeatures}>
                    {dev.features.map((f, j) => (
                      <span key={j} className={styles.devFeature}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className={styles.devMeta}>
                    <div className={styles.devMetaItem}>
                      <span className={styles.devMetaLabel}>Desde</span>
                      <span className={styles.devMetaValue}>{dev.priceFrom}</span>
                    </div>
                    <div className={styles.devMetaItem}>
                      <span className={styles.devMetaLabel}>Entrega</span>
                      <span className={styles.devMetaValue}>{dev.delivery}</span>
                    </div>
                    <div className={styles.devMetaItem}>
                      <span className={styles.devMetaLabel}>Unidades</span>
                      <span className={styles.devMetaValue}>{dev.units}</span>
                    </div>
                  </div>
                  <Link href="/contacto" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Solicitar información
                  </Link>
                </div>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
