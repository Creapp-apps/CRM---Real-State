'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/mockData';
import styles from './ficha.module.css';

const WHATSAPP = '5491166092461';
const WEB = 'www.cardosopropiedades.com.ar';
const EMAIL = 'cardosom.prop@gmail.com';
const AGENTE = 'Mónica Cardoso';
const MATRICULA = 'CMCPSI 4464';

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
  const hasDesc = property.description && !/^sin descripci/i.test(property.description);

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
    property.bedrooms > 0 ? `de ${property.bedrooms} ambientes` : null,
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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handlePrint = () => window.print();
  const handleWhatsApp = () => {
    const text = `${headline} — ${formatPrice(property.price, property.currency, property.priceLabel)}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* sin permiso de clipboard */ }
  };

  const mapsUrl = property.lat && property.lng
    ? `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`
    : null;

  return (
    <div className={styles.sheet}>
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
              {property.referenceCode && <span className={styles.ref}>Ref. {property.referenceCode}</span>}
            </div>
            <h1 className={styles.title}>{titleTop}{titleBot && <b>{titleBot}</b>}</h1>
            <div className={styles.subLoc}>{property.address || property.location}</div>
          </div>

          <div className={styles.heroCard}>
            <div className={styles.heroPhoto}>
              <Image src={cover} alt={headline} fill priority sizes="(max-width: 760px) 100vw, 420px" className={styles.heroImg} />
            </div>
            <div className={styles.heroPrice}>
              <div className={styles.plabel}>{property.operationType === 'venta' ? 'Precio de venta' : 'Valor de alquiler'}</div>
              <div className={styles.price}>
                {formatPrice(property.price, property.currency)}
                {property.priceLabel && <span className={styles.per}> {property.priceLabel}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPEC RAIL */}
      {specs.length > 0 && (
        <div className={styles.specs} style={{ gridTemplateColumns: `repeat(${specs.length}, 1fr)` }}>
          {specs.map((s) => (
            <div key={s.label} className={styles.spec}>
              <div className={styles.specN}>{s.value}{s.unit && <span className={styles.specU}>{s.unit}</span>}</div>
              <div className={styles.specL}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* LA PROPIEDAD */}
      <section className={styles.block}>
        <div className={styles.secHead}><span className={styles.tick} /><h2>La propiedad</h2></div>
        <div className={styles.propgrid}>
          <div>
            <p className={styles.lead}>{lead}</p>
            {hasDesc && (
              <div className={styles.bodyCopy}>
                {property.description.split('\n').filter((l) => l.trim()).map((para, i) => <p key={i}>{para}</p>)}
              </div>
            )}
          </div>
          {facts.length > 0 && (
            <div className={styles.facts}>
              <dl>
                {facts.map((f) => (
                  <div key={f.k} className={styles.factRow}>
                    <dt>{f.k}</dt><dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      {/* COMODIDADES */}
      {property.amenities?.length > 0 && (
        <section className={styles.block}>
          <div className={styles.secHead}><span className={styles.tick} /><h2>Comodidades</h2></div>
          <div className={styles.amen}>
            {property.amenities.map((a) => <div key={a} className={styles.amenItem}>{a}</div>)}
          </div>
        </section>
      )}

      {/* GALERÍA */}
      {tiles.length > 0 && (
        <section className={styles.block}>
          <div className={styles.secHead}><span className={styles.tick} /><h2>Galería</h2></div>
          <div className={styles.mosaic}>
            {tiles.map((src, i) => {
              const cls = i === 0 ? styles.big : i === 3 ? styles.wide : '';
              const last = i === tiles.length - 1 && extra > 0;
              return (
                <figure key={src} className={`${styles.cell} ${cls}`} onClick={() => setLightbox(i + 1)}>
                  <Image src={src} alt="" fill sizes="(max-width: 760px) 50vw, 25vw" className={styles.cellImg} />
                  {last && <span className={styles.more}>+{extra}</span>}
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* UBICACIÓN */}
      <section className={styles.block}>
        <div className={styles.secHead}><span className={styles.tick} /><h2>Ubicación</h2></div>
        <div className={styles.loc}>
          <div>
            <div className={styles.where}>{property.address || headline}<br />{property.location}</div>
            {property.lat && property.lng && (
              <div className={styles.coords}>{property.lat.toFixed(6)}, {property.lng.toFixed(6)}</div>
            )}
          </div>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>Ver en el mapa</a>
          )}
        </div>
      </section>

      {/* CIERRE */}
      <footer className={styles.footer}>
        <div className={styles.footTop}>
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
        </div>
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
