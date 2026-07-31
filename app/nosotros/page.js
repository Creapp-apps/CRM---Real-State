import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './page.module.css';

const VALUES = [
  { title: 'Transparencia', desc: 'Operaciones claras y honestas. Sin sorpresas ni costos ocultos.', icon: '🔍' },
  { title: 'Compromiso', desc: 'Nos involucramos con cada cliente como si fuera propio.', icon: '🤝' },
  { title: 'Experiencia', desc: 'Más de 15 años en el mercado nos respaldan.', icon: '⭐' },
  { title: 'Innovación', desc: 'Utilizamos las últimas herramientas tecnológicas del sector.', icon: '💡' },
];

export default function NosotrosPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className="container">
            <AnimatedSection animation="fade-up">
              <span className="subtitle">Quiénes somos</span>
              <h1 className={styles.pageTitle}>
                Conocé a <span className="text-gold">Cardoso Propiedades</span>
              </h1>
            </AnimatedSection>
          </div>
        </section>

        {/* Story Section */}
        <section className={`container ${styles.storySection}`}>
          <AnimatedSection animation="fade-right" className={styles.storyImage}>
            <Image
              src="/images/property-interior.jpg"
              alt="Nuestra oficina"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </AnimatedSection>
          <AnimatedSection animation="fade-left" className={styles.storyContent}>
            <span className="subtitle">Nuestra historia</span>
            <h2 className={styles.storyTitle}>Más de 15 años ayudando a personas a encontrar su hogar</h2>
            <hr className="divider" />
            <p className={styles.storyText}>
              Cardoso Propiedades nació con la visión de transformar la experiencia inmobiliaria en Buenos Aires. 
              Fundada por Mónica Cardoso, una apasionada del real estate con más de una década de trayectoria, 
              nuestra inmobiliaria se destaca por el trato personalizado y la dedicación a cada cliente.
            </p>
            <p className={styles.storyText}>
              Creemos que comprar, vender o alquilar una propiedad es una de las decisiones más importantes en la vida 
              de una persona. Por eso, nos comprometemos a acompañarte en cada paso del camino con profesionalismo, 
              honestidad y la calidez que nos caracteriza.
            </p>
            <p className={styles.storyText}>
              Hoy, con un equipo de profesionales altamente capacitados y una red de contactos sólida, 
              seguimos creciendo y evolucionando para brindarte el mejor servicio inmobiliario del mercado.
            </p>
          </AnimatedSection>
        </section>

        {/* Values */}
        <section className={styles.valuesSection}>
          <div className="container">
            <AnimatedSection animation="fade-up" className="text-center">
              <span className="subtitle">Lo que nos define</span>
              <h2 className={styles.valuesTitle}>Nuestros <span className="text-gold">valores</span></h2>
              <hr className="divider divider-center" />
            </AnimatedSection>
            <div className={styles.valuesGrid}>
              {VALUES.map((val, i) => (
                <AnimatedSection key={i} animation="fade-up" delay={i * 100} className={styles.valueCard}>
                  <span className={styles.valueEmoji}>{val.icon}</span>
                  <h3 className={styles.valueTitle}>{val.title}</h3>
                  <p className={styles.valueDesc}>{val.desc}</p>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Founder */}
        <section className={`container ${styles.founderSection}`}>
          <AnimatedSection animation="fade-up" className={styles.founderCard}>
            <div className={styles.founderImageWrapper}>
              <Image
                src="/logos/Mónica Cardoso - Logo_Mesa de trabajo 1.jpg"
                alt="Mónica Cardoso"
                fill
                style={{ objectFit: 'contain' }}
                sizes="200px"
              />
            </div>
            <div className={styles.founderInfo}>
              <span className="subtitle">Fundadora</span>
              <h3 className={styles.founderName}>Mónica Cardoso</h3>
              <p className={styles.founderBio}>
                Martillera y Corredora Pública con más de 15 años de experiencia en el mercado inmobiliario argentino. 
                Su pasión por el real estate y su compromiso con cada cliente la han convertido en un referente del sector, 
                reconocida por su profesionalismo y su trato cercano.
              </p>
            </div>
          </AnimatedSection>
        </section>
      </main>
      <Footer />
    </>
  );
}
