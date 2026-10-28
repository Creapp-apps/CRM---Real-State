'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/mockData';
import { parseDescription, extractHighlights } from '@/lib/parseDescription';
import { ESTADO_META } from '@/lib/estados';
import styles from './ficha.module.css';

// Estado comercial -> color del pill (solo los que se muestran al público).
const ESTADO_STYLE = {
  reservado: { background: '#facc15', color: '#0A1628', borderColor: '#facc15' },
  vendido: { background: '#ef4444', color: '#fff', borderColor: '#ef4444' },
  concretado: { background: '#22c55e', color: '#0A1628', borderColor: '#22c55e' },
};

const WHATSAPP = '5491166092461';
const WEB = 'www.cardosopropiedades.com.ar';
const EMAIL = 'cardosom.prop@gmail.com';
const AGENTE = 'Mónica Cardoso';
const MATRICULA = 'CMCPSI 4464';

/** Íconos de línea para las secciones de la descripción. */
function DescIcon({ name }) {
  const paths = {
    building: <><path d="M3 21h18" /><path d="M6 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" /><path d="M15 21V9h3a1 1 0 0 1 1 1v11" /><path d="M9 7h2M9 10.5h2M9 14h2" /></>,
    pin: <><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></>,
    clipboard: <><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 4.5V3.5h6v1" /><path d="M9 10h6M9 14h4" /></>,
    home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /><path d="M21 20c0-2.5-1.8-4.2-4.2-4.8" /></>,
    ruler: <><rect x="3" y="8" width="18" height="8" rx="1.2" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></>,
    layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
    flame: <path d="M12 3c2 3 5 4.5 5 8a5 5 0 0 1-10 0c0-1.8.8-3 2-4 .2 1.2 1 2 2 2 .5-2-1-3.5 1-6z" />,
    droplet: <path d="M12 3c3 4 6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 3-6 6-10z" />,
    star: <path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8z" />,
    check: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.4 2.4 4.6-5" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.6" /></>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.sparkle}
    </svg>
  );
}

/* ---------- Animaciones (solo pantalla; respetan reduced-motion; no afectan el PDF) ---------- */

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(m.matches);
    const h = () => setReduce(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return reduce;
}

/** Observa un elemento y devuelve true una vez que entra en viewport. */
function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setInView(true); return undefined; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

/** Revela su contenido al entrar en viewport (slide/fade o stagger de hijos). */
function Reveal({ children, as: Tag = 'div', variant = 'up', className = '', style }) {
  const [ref, inView] = useInView();
  const v = variant === 'group' ? styles.stagger : styles[`rv-${variant}`];
  return (
    <Tag ref={ref} style={style} className={`${v || ''} ${inView ? styles.in : ''} ${className}`}>
      {children}
    </Tag>
  );
}

/** Número que crece de 0 al valor meta cuando entra en viewport. */
function CountUp({ to, duration = 1300, format = (n) => n }) {
  const reduce = usePrefersReducedMotion();
  const [ref, inView] = useInView();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (reduce || !inView) { setVal(to); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, duration]);
  useEffect(() => {
    const f = () => setVal(to);
    window.addEventListener('beforeprint', f);
    return () => window.removeEventListener('beforeprint', f);
  }, [to]);
  return <span ref={ref}>{format(val)}</span>;
}

/** Efecto typewriter al entrar en viewport. */
function Typewriter({ text, speed = 24, as: Tag = 'span', className = '' }) {
  const reduce = usePrefersReducedMotion();
  const [ref, inView] = useInView();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce || !inView) { setN(text.length); return undefined; }
    let i = 0;
    let id;
    const step = () => { i += 1; setN(i); if (i < text.length) id = setTimeout(step, speed); };
    id = setTimeout(step, speed);
    return () => clearTimeout(id);
  }, [inView, reduce, text, speed]);
  useEffect(() => {
    const f = () => setN(text.length);
    window.addEventListener('beforeprint', f);
    return () => window.removeEventListener('beforeprint', f);
  }, [text]);
  const done = n >= text.length;
  return <Tag ref={ref} className={`${className} ${!done ? styles.typing : ''}`}>{text.slice(0, n)}</Tag>;
}

/** Iniciales para el avatar de la agente. */
function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Lugar principal (barrio o primera localidad). */
function placeOf(p) {
  return (p.neighborhood || p.location?.split(',')[0] || '').trim();
}

/** Titular limpio de una línea (para WhatsApp / alt). */
function headlineOf(p) {
  const addr = (p.address || '').replace(/\s+0+$/, '').trim();
  const poor = !addr || /^ruta\s*0?$/i.test(addr) || addr.length < 5;
  if (!poor) return addr;
  const where = placeOf(p) || p.location;
  return `${p.type} en ${where}`;
}

export default function FichaView({ property }) {
  const [lightbox, setLightbox] = useState(null);
  const [copied, setCopied] = useState(false);

  const images = property.images?.length ? property.images : ['/images/hero-bg.jpg'];
  const cover = images[0];
  const gallery = images.slice(1);
  const tiles = gallery.slice(0, 4);
  const extra = gallery.length - tiles.length;

  const headline = headlineOf(property);
  const place = placeOf(property);
  const titleTop = place || property.type;
  const titleBot = place ? property.type : '';
  const desc = parseDescription(property.description);
  const highlights = extractHighlights(property.description);
  const hasDesc = desc.tagline || desc.sections.length > 0;

  const specs = [
    { label: 'Ambientes', value: property.bedrooms },
    { label: 'Baños', value: property.bathrooms },
    { label: 'Cocheras', value: property.garages },
    { label: 'Cubiertos', value: property.coveredArea, unit: ' m²' },
    { label: 'Totales', value: property.totalArea, unit: ' m²' },
  ].filter((s) => Number(s.value) > 0);

  const facts = [
    { k: 'Operación', v: property.operation },
    { k: 'Tipo', v: property.type },
    { k: 'Dormitorios', v: property.bedroomsOnly > 0 ? property.bedroomsOnly : null },
    { k: 'Sup. cubierta', v: property.coveredArea > 0 ? `${property.coveredArea} m²` : null },
    { k: 'Sup. total', v: property.totalArea > 0 ? `${property.totalArea} m²` : null },
    { k: 'Expensas', v: property.maintenanceFee },
    { k: 'Antigüedad', v: property.age },
    { k: 'Orientación', v: property.orientation },
    { k: 'Disposición', v: property.disposition },
  ].filter((f) => f.v);

  const lead = [
    property.type,
    property.bedrooms > 0 ? `de ${property.bedrooms} ambiente${property.bedrooms > 1 ? 's' : ''}` : null,
    `en ${property.operation.toLowerCase()}`,
    property.coveredArea > 0 ? `· ${property.coveredArea} m² cubiertos` : null,
  ].filter(Boolean).join(' ') + (place ? ` en ${place}.` : '.');

  const closeLightbox = useCallback(() => setLightbox(null), []);
  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightbox((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightbox((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length, closeLightbox]);

  const handlePrint = () => window.print();
  const handleWhatsApp = () => {
    const url = window.location.href;
    const text = `${headline} — ${formatPrice(property.price, property.currency, property.priceLabel)}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* sin permiso de clipboard */ }
  };

  const mapsUrl = property.lat && property.lng
    ? `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`
    : null;

  return (
    <div className={`${styles.sheet} ${styles.js}`}>
      {/* Barra de acciones (no se imprime) */}
      <div className={styles.actions}>
        <button type="button" onClick={handleWhatsApp} className={styles.actionBtn}>Compartir</button>
        <button type="button" onClick={handleCopy} className={styles.actionBtn}>{copied ? 'Link copiado' : 'Copiar link'}</button>
        <button type="button" onClick={handlePrint} className={styles.actionBtnPrimary}>Descargar PDF</button>
      </div>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.topbar}>
          <Image src="/logohorizontal.png" alt="Cardoso Propiedades" width={200} height={32} className={styles.logo} priority />
          <div className={styles.agent}>
            <div className={styles.who}>
              <strong>{AGENTE}</strong>
              <span>Martillera &amp; Corredora · {MATRICULA}</span>
            </div>
            <div className={styles.ring}>{initials(AGENTE)}</div>
          </div>
        </div>

        <div className={styles.herogrid}>
          <div>
            <div className={styles.pillrow}>
              <span className={`${styles.pill} ${styles.pillSolid}`}>{property.operation}</span>
              <span className={styles.pill}>{property.type}</span>
              {ESTADO_STYLE[property.estadoComercial] && (
                <span className={styles.pill} style={ESTADO_STYLE[property.estadoComercial]}>
                  {ESTADO_META[property.estadoComercial].label}
                </span>
              )}
              {property.referenceCode && <span className={styles.ref}>Ref. {property.referenceCode}</span>}
            </div>
            <h1 className={styles.title}>{titleTop}{titleBot && <b>{titleBot}</b>}</h1>
            <div className={styles.subLoc}>
              <Typewriter text={property.address || property.location} />
            </div>
          </div>

          <div className={styles.heroCard}>
            <div className={styles.heroPhoto}>
              <Image src={cover} alt={headline} fill priority sizes="(max-width: 760px) 100vw, 420px" className={styles.heroImg} />
            </div>
            <div className={styles.heroPrice}>
              <div className={styles.plabel}>{property.operationType === 'venta' ? 'Precio de venta' : 'Valor de alquiler'}</div>
              <div className={styles.price}>
                <CountUp to={property.price} format={(n) => formatPrice(n, property.currency)} />
                {property.priceLabel && <span className={styles.per}> {property.priceLabel}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPEC RAIL */}
      {specs.length > 0 && (
        <Reveal variant="group" className={styles.specs} style={{ gridTemplateColumns: `repeat(${specs.length}, 1fr)` }}>
          {specs.map((s, i) => (
            <div key={s.label} className={styles.spec} style={{ '--i': i }}>
              <div className={styles.specN}>
                <CountUp to={Number(s.value)} />{s.unit && <span className={styles.specU}>{s.unit}</span>}
              </div>
              <div className={styles.specL}>{s.label}</div>
            </div>
          ))}
        </Reveal>
      )}

      {/* LA PROPIEDAD */}
      <section className={styles.block}>
        <Reveal variant="left" className={styles.secHead}><span className={styles.tick} /><h2>La propiedad</h2></Reveal>
        {highlights.length > 0 && (
          <Reveal variant="group" className={styles.hiGrid}>
            {highlights.map((h, i) => (
              <div key={i} className={`${styles.hiCard} ${h.wide ? styles.hiWide : ''}`} style={{ '--i': i }}>
                <span className={styles.hiIco}><DescIcon name={h.icon} /></span>
                <div className={styles.hiText}>
                  <span className={styles.hiLabel}>{h.label}</span>
                  <span className={styles.hiValue}>{h.value}</span>
                </div>
              </div>
            ))}
          </Reveal>
        )}
        <div className={styles.propgrid}>
          <div>
            <Typewriter as="p" className={styles.lead} text={lead} />
            {desc.tagline && <Reveal as="p" variant="left" className={styles.descLead}>{desc.tagline}</Reveal>}
            {desc.sections.map((sec, si) => (
              <Reveal key={si} variant="up" className={styles.descSec}>
                {sec.title && (
                  <div className={styles.descSecHead}>
                    <span className={styles.descIco}><DescIcon name={sec.icon} /></span>
                    <h3>{sec.title}</h3>
                  </div>
                )}
                {sec.blocks.map((b, bi) =>
                  b.type === 'ul' ? (
                    <ul key={bi} className={styles.descList}>
                      {b.items.map((it, ii) => <li key={ii} className={styles.descLi}>{it}</li>)}
                    </ul>
                  ) : (
                    <p key={bi} className={styles.descP}>{b.text}</p>
                  )
                )}
              </Reveal>
            ))}
          </div>
          {facts.length > 0 && (
            <Reveal variant="right" className={styles.facts}>
              <dl>
                {facts.map((f) => (
                  <div key={f.k} className={styles.factRow}>
                    <dt>{f.k}</dt><dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </section>

      {/* COMODIDADES */}
      {property.amenities?.length > 0 && (
        <section className={styles.block}>
          <Reveal variant="left" className={styles.secHead}><span className={styles.tick} /><h2>Comodidades</h2></Reveal>
          <Reveal variant="group" className={styles.amen}>
            {property.amenities.map((a, i) => <div key={a} className={styles.amenItem} style={{ '--i': i }}>{a}</div>)}
          </Reveal>
        </section>
      )}

      {/* GALERÍA */}
      {tiles.length > 0 && (
        <section className={styles.block}>
          <Reveal variant="left" className={styles.secHead}><span className={styles.tick} /><h2>Galería</h2></Reveal>
          <Reveal variant="group" className={styles.mosaic}>
            {tiles.map((src, i) => {
              const cls = i === 0 ? styles.big : i === 3 ? styles.wide : '';
              const last = i === tiles.length - 1 && extra > 0;
              return (
                <figure key={src} className={`${styles.cell} ${cls}`} style={{ '--i': i }} onClick={() => setLightbox(i + 1)}>
                  <Image src={src} alt="" fill sizes="(max-width: 760px) 50vw, 25vw" className={styles.cellImg} />
                  {last && <span className={styles.more}>+{extra}</span>}
                </figure>
              );
            })}
          </Reveal>
        </section>
      )}

      {/* UBICACIÓN */}
      <section className={styles.block}>
        <Reveal variant="left" className={styles.secHead}><span className={styles.tick} /><h2>Ubicación</h2></Reveal>
        <Reveal variant="up" className={styles.loc}>
          <div>
            <div className={styles.where}>{property.address || headline}<br />{property.location}</div>
            {property.lat && property.lng && (
              <div className={styles.coords}>{property.lat.toFixed(6)}, {property.lng.toFixed(6)}</div>
            )}
          </div>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>Ver en el mapa</a>
          )}
        </Reveal>
      </section>

      {/* CIERRE */}
      <footer className={styles.footer}>
        <Reveal variant="up" className={styles.footTop}>
          <div>
            <Image src="/logohorizontal.png" alt="Cardoso Propiedades" width={210} height={34} className={styles.footLogo} />
            <h3 className={styles.footTitle} style={{ marginTop: 16 }}>Hablemos de<br /><b>tu próxima casa</b></h3>
          </div>
          <div className={styles.footContact}>
            <strong>{AGENTE} Propiedades</strong>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">WhatsApp +54 9 11 6609 2461</a>
            <a href={`https://${WEB}`} target="_blank" rel="noopener noreferrer">{WEB}</a>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            {property.publicUrl && (
              <a href={property.publicUrl} target="_blank" rel="noopener noreferrer" className={styles.noPrint}>Ver publicación en MercadoLibre</a>
            )}
          </div>
        </Reveal>
        <p className={styles.legal}>
          La información y medidas son aproximadas y deberán ratificarse con la documentación pertinente; no comprometen contractualmente. Gastos (expensas, ABL) según la última información disponible. Fotografías no vinculantes ni contractuales.
        </p>
      </footer>

      {/* LIGHTBOX */}
      {lightbox !== null && (
        <div className={styles.lightbox} onClick={closeLightbox} role="dialog" aria-modal="true">
          <button type="button" className={styles.lbClose} onClick={closeLightbox} aria-label="Cerrar">✕</button>
          <div className={styles.lbWrap} onClick={(e) => e.stopPropagation()}>
            <Image src={images[lightbox]} alt="" fill sizes="90vw" className={styles.lbImg} />
          </div>
          <button type="button" className={`${styles.lbNav} ${styles.lbPrev}`} aria-label="Anterior"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i - 1 + images.length) % images.length); }}>‹</button>
          <button type="button" className={`${styles.lbNav} ${styles.lbNext}`} aria-label="Siguiente"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i + 1) % images.length); }}>›</button>
          <span className={styles.lbCount}>{lightbox + 1} / {images.length}</span>
        </div>
      )}
    </div>
  );
}
