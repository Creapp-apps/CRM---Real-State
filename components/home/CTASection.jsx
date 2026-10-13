import Link from 'next/link';
import AnimatedSection from '@/components/ui/AnimatedSection';
import MovingBorderButton from '@/components/ui/MovingBorderButton';
import { CONTENT_DEFAULTS } from '@/lib/content/defaults';
import styles from './CTASection.module.css';

export default function CTASection({ cta } = {}) {
  const c = { ...CONTENT_DEFAULTS.cta, ...(cta || {}) };
  return (
    <section className={styles.section}>

      <div className={`container ${styles.content}`}>
        <AnimatedSection animation="fade-up">
          <span className="subtitle">{c.subtitle}</span>
          <h2 className={styles.title}>
            {c.titlePrefix} <span className="text-gold">{c.titleHighlight}</span> {c.titleSuffix}
          </h2>
          <p className={styles.desc}>
            {c.description}
          </p>
          <div className={styles.buttons}>
            <MovingBorderButton href="/tasar" borderRadius="1.75rem">
              {c.btnPrimary}
            </MovingBorderButton>
            <MovingBorderButton href="/contacto" borderRadius="1.75rem">
              {c.btnSecondary}
            </MovingBorderButton>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

