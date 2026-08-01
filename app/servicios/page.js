import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './page.module.css';

const SERVICES = [
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    title: 'Venta de Propiedades',
    description: 'Gestionamos la venta de tu propiedad de manera integral. Desde la tasación hasta la escritura, acompañamos cada paso con transparencia y profesionalismo.',
    features: ['Tasación profesional', 'Marketing en portales premium', 'Fotografía profesional', 'Gestión de visitas', 'Asesoría legal'],
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: 'Alquileres',
    description: 'Encontramos el inquilino ideal para tu propiedad y gestionamos todo el proceso contractual. Garantizamos seriedad y cumplimiento.',
    features: ['Selección de inquilinos', 'Contratos legales', 'Garantías', 'Administración mensual', 'Mediación de conflictos'],
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
    title: 'Tasaciones',
    description: 'Valuaciones precisas basadas en análisis de mercado, ubicación, estado y comparables. Certificación profesional para bancos y trámites.',
    features: ['Análisis comparativo', 'Informe detallado', 'Certificación profesional', 'Válido para bancos', 'Entrega rápida'],
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    title: 'Asesoría Inmobiliaria',
    description: 'Te asesoramos para tomar las mejores decisiones inmobiliarias. Analizamos el mercado, evaluamos oportunidades y te guiamos en cada inversión.',
    features: ['Análisis de mercado', 'Negociación', 'Planificación financiera', 'Asesoría legal', 'Acompañamiento integral'],
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    title: 'Inversiones',
    description: 'Identificamos las mejores oportunidades de inversión inmobiliaria. Desde pozo hasta renta, te ayudamos a maximizar tu capital.',
    features: ['Proyectos desde pozo', 'Oportunidades de renta', 'Asesoramiento de inversión', 'Diversificación', 'Seguimiento post-venta'],
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    title: 'Atención Personalizada',
    description: 'Cada cliente es único. Nos adaptamos a tus necesidades, tiempos y preferencias para brindarte la mejor experiencia inmobiliaria.',
    features: ['Agente dedicado', 'Visitas coordinadas', 'Informes periódicos', 'Disponibilidad extendida', 'Postventa'],
  },
];

export default function ServiciosPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className="container">
            <AnimatedSection animation="fade-up">
              <span className="subtitle">Lo que hacemos</span>
              <h1 className={styles.pageTitle}>
                Nuestros <span className="text-gold">servicios</span>
              </h1>
              <p className={styles.pageDesc}>
                Soluciones integrales para todas tus necesidades inmobiliarias. Experiencia, profesionalismo y resultados.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <div className={`container ${styles.servicesGrid}`}>
          {SERVICES.map((service, i) => (
            <AnimatedSection key={i} animation="fade-up" delay={i * 100} className={styles.serviceCard}>
              <div className={styles.serviceIcon}>{service.icon}</div>
              <h2 className={styles.serviceTitle}>{service.title}</h2>
              <p className={styles.serviceDesc}>{service.description}</p>
              <ul className={styles.serviceFeatures}>
                {service.features.map((f, j) => (
                  <li key={j} className={styles.serviceFeature}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
