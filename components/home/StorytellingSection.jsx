'use client';

import { useState } from 'react';

import { useScrollAnimation, useCountUp } from '@/hooks/useScrollAnimation';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { CONTENT_DEFAULTS } from '@/lib/content/defaults';
import styles from './StorytellingSection.module.css';

// Íconos fijos (estructurales) para las tarjetas de valores, por índice.
const VALUE_ICONS = [
  (
    <svg key="confianza" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  (
    <svg key="alcance" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  (
    <svg key="dedicacion" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
];

function StatCounter({ value, suffix, label }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  const count = useCountUp(value, 2000, isVisible);

  return (
    <div className={styles.stat} ref={ref}>
      <span className={styles.statNumber}>
        {count}
        <span className={styles.statSuffix}>{suffix}</span>
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

export default function StorytellingSection({ stats, values } = {}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const statsData = Array.isArray(stats) && stats.length ? stats : CONTENT_DEFAULTS.stats;
  const v = { ...CONTENT_DEFAULTS.values, ...(values || {}) };
  const itemsRaw = Array.isArray(v.items) && v.items.length ? v.items : CONTENT_DEFAULTS.values.items;
  const valueItems = itemsRaw.map((item, i) => ({ ...item, icon: VALUE_ICONS[i] }));

  return (
    <section className={styles.section}>
      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={`container ${styles.statsContent}`}>
          {statsData.map((stat, i) => (
            <StatCounter key={i} value={Number(stat.value)} suffix={stat.suffix} label={stat.label} />
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className={`container ${styles.valuesSection}`}>
        <AnimatedSection animation="fade-up" className={styles.valuesHeader}>
          <span className="subtitle">{v.subtitle}</span>
          <h2 className={styles.valuesTitle}>
            {v.titlePrefix}<br />
            <span className="text-gold">{v.titleHighlight}</span>
          </h2>
          <hr className="divider divider-center" />
        </AnimatedSection>

        <div
          className={styles.valuesGrid}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {valueItems.map((value, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              className={`${styles.valueCard} ${
                hoveredIdx !== null && hoveredIdx !== i
                  ? styles.valueCardDimmed
                  : ''
              } ${hoveredIdx === i ? styles.valueCardFocused : ''}`}
            >
              <AnimatedSection
                animation="fade-up"
                delay={i * 150}
              >
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDesc}>{value.description}</p>
              </AnimatedSection>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
