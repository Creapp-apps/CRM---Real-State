'use client';
import { COLOR_VAR_MAP } from '@/lib/content/theme';
import styles from '@/components/admin/admin.module.css';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function cssVars(colors = {}) {
  const s = {};
  for (const [k, v] of Object.entries(COLOR_VAR_MAP)) {
    if (HEX.test(colors[k] || '')) s[v] = colors[k];
  }
  return s;
}

const gold = { color: 'var(--gold)' };
const white = { color: 'var(--white)' };
const muted = { color: 'var(--gray-300)' };
const subtitle = { color: 'var(--gold)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' };

export default function LivePreview({ category, content, theme }) {
  const style = cssVars(theme?.colors);
  const c = content;

  return (
    <div>
      <div className={styles.previewLabel}>Vista previa</div>
      <div className={styles.previewFrame} style={style}>
        {category === 'hero' && (
          <div>
            <h2 style={white}>
              {c.hero.titlePrefix}{' '}
              <em style={gold}>{c.hero.rotatingWords?.[0]}</em>{' '}
              {c.hero.titleSuffix}
            </h2>
            <p style={muted}>{c.hero.subtitle}</p>
            <small style={gold}>{c.hero.scrollText} ↓</small>
          </div>
        )}

        {category === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {c.stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ ...gold, fontSize: '1.6rem', fontWeight: 700 }}>{s.value}{s.suffix}</div>
                <div style={{ ...muted, fontSize: '0.75rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {category === 'values' && (
          <div>
            <div style={subtitle}>{c.values.subtitle}</div>
            <h3 style={white}>{c.values.titlePrefix} <span style={gold}>{c.values.titleHighlight}</span></h3>
            <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.75rem' }}>
              {c.values.items.map((v, i) => (
                <div key={i}>
                  <strong style={white}>{v.title}</strong>
                  <p style={{ ...muted, fontSize: '0.78rem', margin: '0.15rem 0 0' }}>{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {category === 'operations' && (
          <div>
            <div style={subtitle}>{c.operations.subtitle}</div>
            <h3 style={white}>{c.operations.titlePrefix} <span style={gold}>{c.operations.titleHighlight}</span>?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginTop: '0.75rem' }}>
              {c.operations.items.map((op, i) => (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', padding: '0.6rem' }}>
                  <strong style={white}>{op.title}</strong>
                  <p style={{ ...muted, fontSize: '0.75rem', margin: '0.15rem 0 0' }}>{op.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {category === 'cta' && (
          <div>
            <div style={subtitle}>{c.cta.subtitle}</div>
            <h3 style={white}>{c.cta.titlePrefix} <span style={gold}>{c.cta.titleHighlight}</span> {c.cta.titleSuffix}</h3>
            <p style={{ ...muted, fontSize: '0.8rem' }}>{c.cta.description}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--gold)', color: 'var(--navy-900)', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 600 }}>{c.cta.btnPrimary}</span>
              <span style={{ border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 600 }}>{c.cta.btnSecondary}</span>
            </div>
          </div>
        )}

        {category === 'footer' && (
          <div>
            <p style={{ ...muted, fontSize: '0.82rem' }}>{c.footer.brandText}</p>
            <ul style={{ ...muted, fontSize: '0.78rem', listStyle: 'none', padding: 0, marginTop: '0.5rem', display: 'grid', gap: '0.25rem' }}>
              <li>📞 {c.footer.phone}</li>
              <li>✉️ {c.footer.email}</li>
              <li>📍 {c.footer.location}</li>
            </ul>
          </div>
        )}

        {category === 'navbar' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <strong style={white}>Cardoso Propiedades</strong>
            <span style={{ background: 'var(--gold)', color: 'var(--navy-900)', padding: '0.4rem 0.9rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 600 }}>{c.navbar.ctaText}</span>
          </div>
        )}

        {category === 'colors' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {Object.entries(COLOR_VAR_MAP).map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ height: '36px', borderRadius: '0.35rem', background: `var(${v})`, border: '1px solid rgba(255,255,255,0.15)' }} />
                <div style={{ ...muted, fontSize: '0.62rem', marginTop: '0.25rem' }}>{k}</div>
              </div>
            ))}
          </div>
        )}

        {category === 'media' && (
          theme?.media?.heroVideo ? (
            <video src={theme.media.heroVideo} style={{ width: '100%', borderRadius: '0.5rem' }} muted loop autoPlay playsInline />
          ) : (
            <div style={{ ...muted, fontSize: '0.8rem', textAlign: 'center' }}>Video por defecto (hero actual)</div>
          )
        )}
      </div>
    </div>
  );
}
