import Link from 'next/link';
import AnimatedSection from '@/components/ui/AnimatedSection';
import MovingBorderButton from '@/components/ui/MovingBorderButton';
import styles from './CTASection.module.css';

export default function CTASection() {
  return (
    <section className={styles.section}>

      <div className={`container ${styles.content}`}>
        <AnimatedSection animation="fade-up">
          <span className="subtitle">Valorá tu inmueble</span>
          <h2 className={styles.title}>
            ¿Querés <span className="text-gold">tasar</span> tu propiedad?
          </h2>
          <p className={styles.desc}>
            Obtené una tasación profesional sin cargo. Nuestro equipo de expertos
            evalúa tu propiedad con los mejores datos del mercado para que tomes
            las mejores decisiones.
          </p>
          <div className={styles.buttons}>
            <MovingBorderButton href="/tasar" borderRadius="1.75rem">
              Solicitar tasación gratuita
            </MovingBorderButton>
            <MovingBorderButton href="/contacto" borderRadius="1.75rem">
              Contactanos
            </MovingBorderButton>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

