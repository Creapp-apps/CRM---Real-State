'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/mockData';
import styles from './ficha.module.css';

const WHATSAPP = '5491166092461';
const WEB = 'www.cardosopropiedades.com.ar';

export default function FichaView({ property }) {
  const [lightbox, setLightbox] = useState(null); // índice de imagen o null
  const [copied, setCopied] = useState(false);

  const images = property.images?.length ? property.images : ['/images/hero-bg.jpg'];
  const cover = images[0];
  const gallery = images.slice(1, 9); // hasta 8 secundarias en la grilla
  const extra = images.length - 9;

  const specs = [
    { label: 'Ambientes', value: property.bedrooms },
    { label: 'Baños', value: property.bathrooms },
    { label: 'Cocheras', value: property.garages },
    { label: 'Cubiertos', value: property.coveredArea, unit: ' m²' },
    { label: 'Totales', value: property.totalArea, unit: ' m²' },
  ].filter((s) => Number(s.value) > 0);

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleWhatsApp = () => {
    const text = `${property.title} — ${formatPrice(property.price, property.currency, property.priceLabel)}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard puede fallar en contextos sin permiso */
    }
  };

  const mapsUrl = property.lat && property.lng
    ? `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`
    : null;

  return (
    <main className={styles.ficha}>
      {/* Barra superior: marca + acciones (las acciones no se imprimen) */}
      <header className={styles.topbar}>
        <Image
          src="/logohorizontal.png"
          alt="Cardoso Propiedades"
          width={220}
          height={36}
          className={styles.logo}
          priority
        />
        <div className={styles.actions}>
          <button type="button" onClick={handleWhatsApp} className={styles.actionBtn}>
            Compartir por WhatsApp
          </button>
          <button type="button" onClick={handleCopy} className={styles.actionBtn}>
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
          <button type="button" onClick={handlePrint} className={styles.actionBtnPrimary}>
            Descargar PDF
          </button>
        </div>
      </header>

      {/* Hero: foto de portada + datos clave */}
      <section className={styles.hero}>
        <Image
          src={cover}
          alt={property.title}
          fill
          className={styles.heroImg}
          sizes="100vw"
          priority
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.chips}>
            <span className={styles.chip}>{property.operation}</span>
            <span className={styles.chipGhost}>{property.type}</span>
          </div>
          <h1 className={styles.title}>{property.title}</h1>
          {property.address && (
            <p className={styles.location}>
              {property.address}
              {property.location ? ` · ${property.location}` : ''}
            </p>
          )}
          <p className={styles.price}>
            {formatPrice(property.price, property.currency, property.priceLabel)}
          </p>
        </div>
      </section>

      {/* Banda de especificaciones (solo las que existen) */}
      {specs.length > 0 && (
        <section className={styles.specs}>
          {specs.map((s) => (
            <div key={s.label} className={styles.specItem}>
              <span className={styles.specValue}>
                {s.value}
                {s.unit || ''}
              </span>
              <span className={styles.specLabel}>{s.label}</span>
            </div>
          ))}
        </section>
      )}

      {/* Galería */}
      {gallery.length > 0 && (
        <section className={styles.gallery}>
          {gallery.map((src, i) => {
            const idx = i + 1; // índice real en images
            const isLast = i === gallery.length - 1 && extra > 0;
            return (
              <button
                type="button"
                key={src}
                className={styles.galleryItem}
                onClick={() => setLightbox(idx)}
                aria-label={`Ver foto ${idx + 1}`}
              >
                <Image src={src} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" className={styles.galleryImg} />
                {isLast && <span className={styles.galleryMore}>+{extra}</span>}
              </button>
            );
          })}
        </section>
      )}

      {/* Descripción + comodidades */}
      <section className={styles.body}>
        <div className={styles.description}>
          <h2 className={styles.h2}>Descripción</h2>
          {property.description.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {property.amenities?.length > 0 && (
          <aside className={styles.amenities}>
            <h2 className={styles.h2}>Comodidades</h2>
            <ul className={styles.amenityList}>
              {property.amenities.map((a) => (
                <li key={a} className={styles.amenity}>{a}</li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      {/* Ubicación */}
      <section className={styles.locationBlock}>
        <h2 className={styles.h2}>Ubicación</h2>
        <p className={styles.locationText}>
          {[property.address, property.neighborhood, property.location]
            .filter(Boolean)
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .join(' · ')}
        </p>
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
            Ver en Google Maps
          </a>
        )}
      </section>

      {/* Footer branded + contacto */}
      <footer className={styles.footer}>
        <Image
          src="/logohorizontal.png"
          alt="Cardoso Propiedades"
          width={240}
          height={38}
          className={styles.footerLogo}
        />
        <div className={styles.contact}>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
            WhatsApp +54 9 11 6609 2461
          </a>
          <a href={`https://${WEB}`} target="_blank" rel="noopener noreferrer">
            {WEB}
          </a>
          {property.publicUrl && (
            <a href={property.publicUrl} target="_blank" rel="noopener noreferrer" className={styles.noPrint}>
              Ver publicación en MercadoLibre
            </a>
          )}
        </div>
        <p className={styles.ref}>Referencia {property.referenceCode}</p>
      </footer>

      {/* Lightbox (no se imprime) */}
      {lightbox !== null && (
        <div className={styles.lightbox} onClick={closeLightbox} role="dialog" aria-modal="true">
          <button type="button" className={styles.lightboxClose} onClick={closeLightbox} aria-label="Cerrar">
            ✕
          </button>
          <div className={styles.lightboxImgWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lightbox]}
              alt=""
              fill
              sizes="90vw"
              className={styles.lightboxImg}
            />
          </div>
          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i - 1 + images.length) % images.length); }}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxNext}`}
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i + 1) % images.length); }}
            aria-label="Siguiente"
          >
            ›
          </button>
          <span className={styles.lightboxCount}>{lightbox + 1} / {images.length}</span>
        </div>
      )}
    </main>
  );
}
