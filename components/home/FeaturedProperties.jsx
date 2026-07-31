'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import MovingBorderButton from '@/components/ui/MovingBorderButton';
import { formatPrice } from '@/lib/mockData';
import styles from './FeaturedProperties.module.css';

// Placeholder data — used as initial fallback while loading Tokko API
const FALLBACK_FEATURED = [
  {
    id: '1',
    title: 'Departamento Premium en Puerto Madero',
    operation: 'Venta',
    price: 'USD 320.000',
    location: 'Puerto Madero, CABA',
    bedrooms: 3,
    bathrooms: 2,
    area: '120 m²',
    image: '/images/hero-bg.jpg',
    description:
      'Espectacular departamento de 3 ambientes con vista panorámica al río. Cocina integrada de primer nivel, pisos de porcelanato y ventanales de piso a techo. Incluye cochera cubierta y amenities premium: pileta climatizada, gimnasio, SUM y seguridad 24hs.',
  },
  {
    id: '2',
    title: 'Casa con Jardín en Nordelta',
    operation: 'Venta',
    price: 'USD 450.000',
    location: 'Nordelta, Tigre',
    bedrooms: 4,
    bathrooms: 3,
    area: '250 m²',
    image: '/images/property-interior.jpg',
    description:
      'Hermosa casa con amplio jardín parquizado y pileta. Living-comedor con doble altura, suite principal con vestidor y jacuzzi. Barrio privado con seguridad las 24hs, acceso a laguna y club house. Ideal para familias que buscan calidad de vida.',
  },
];

/* ── Icons ── */
function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BedroomIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7" />
      <path d="M21 7H3l2-4h14l2 4z" />
      <line x1="12" y1="11" x2="12" y2="15" />
    </svg>
  );
}

function BathroomIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5" />
      <rect x="2" y="12" width="20" height="4" rx="1" />
      <path d="M6 16v4" />
      <path d="M18 16v4" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
}

/* ── Property Card (in grid) ── */
function PropertyCard({ property, onClick, layoutId }) {
  return (
    <motion.div
      layoutId={`card-${property.id}-${layoutId}`}
      onClick={onClick}
      className={styles.card}
    >
      <motion.div
        layoutId={`image-${property.id}-${layoutId}`}
        className={styles.cardImageWrapper}
      >
        <Image
          src={property.image}
          alt={property.title}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 90vw, 300px"
        />
        <div className={styles.cardBadge}>{property.operation}</div>
      </motion.div>
      <div className={styles.cardBody}>
        <motion.span
          layoutId={`price-${property.id}-${layoutId}`}
          className={styles.cardPrice}
        >
          {property.price}
        </motion.span>
        <motion.h3
          layoutId={`title-${property.id}-${layoutId}`}
          className={styles.cardTitle}
        >
          {property.title}
        </motion.h3>
        <p className={styles.cardLocation}>
          <LocationIcon />
          {property.location}
        </p>
        <div className={styles.cardFeatures}>
          {property.bedrooms > 0 && (
            <span className={styles.feature}>
              <BedroomIcon />
              {property.bedrooms} amb
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className={styles.feature}>
              <BathroomIcon />
              {property.bathrooms} baño{property.bathrooms > 1 ? 's' : ''}
            </span>
          )}
          {property.area && (
            <span className={styles.feature}>
              <AreaIcon />
              {property.area}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Expanded Card Overlay ── */
function ExpandedCard({ property, layoutId, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.expandedOverlay}>
      <motion.div
        layoutId={`card-${property.id}-${layoutId}`}
        ref={ref}
        className={styles.expandedCard}
      >
        {/* Close button */}
        <button className={styles.expandedClose} onClick={onClose}>
          <CloseIcon />
        </button>

        {/* Image */}
        <motion.div
          layoutId={`image-${property.id}-${layoutId}`}
          className={styles.expandedImageWrapper}
        >
          <Image
            src={property.image}
            alt={property.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="600px"
          />
          <div className={styles.cardBadge}>{property.operation}</div>
        </motion.div>

        {/* Content */}
        <div className={styles.expandedBody}>
          <div className={styles.expandedHeader}>
            <div>
              <motion.span
                layoutId={`price-${property.id}-${layoutId}`}
                className={styles.cardPrice}
              >
                {property.price}
              </motion.span>
              <motion.h3
                layoutId={`title-${property.id}-${layoutId}`}
                className={styles.expandedTitle}
              >
                {property.title}
              </motion.h3>
              <p className={styles.cardLocation}>
                <LocationIcon />
                {property.location}
              </p>
            </div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.expandedFeatures}
          >
            {property.bedrooms > 0 && (
              <span className={styles.expandedFeature}>
                <BedroomIcon />
                {property.bedrooms} ambientes
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className={styles.expandedFeature}>
                <BathroomIcon />
                {property.bathrooms} baño{property.bathrooms > 1 ? 's' : ''}
              </span>
            )}
            {property.area && (
              <span className={styles.expandedFeature}>
                <AreaIcon />
                {property.area}
              </span>
            )}
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            className={styles.expandedDescription}
          >
            {property.description}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Link
              href={`/propiedades/${property.id}`}
              className={`btn btn-primary ${styles.expandedCta}`}
            >
              Ver ficha completa
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Section ── */
export default function FeaturedProperties() {
  const [active, setActive] = useState(null);
  const [featuredList, setFeaturedList] = useState(FALLBACK_FEATURED);
  const layoutId = useId();

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/properties?limit=6');
        if (res.ok) {
          const data = await res.json();
          if (data.properties && data.properties.length > 0) {
            const formatted = data.properties.map(p => ({
              id: p.id,
              title: p.title,
              operation: p.operation,
              price: formatPrice(p.price, p.currency, p.priceLabel),
              location: p.address || p.location,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              area: p.coveredArea ? `${p.coveredArea} m²` : (p.totalArea ? `${p.totalArea} m²` : ''),
              image: p.images && p.images[0] ? p.images[0] : '/images/hero-bg.jpg',
              description: p.description
            }));
            setFeaturedList(formatted);
          }
        }
      } catch (err) {
        console.error('Error fetching featured properties from Tokko:', err);
      }
    }

    loadFeatured();
  }, []);

  useEffect(() => {
    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [active]);

  return (
    <section className={styles.section}>
      <div className="container">
        <AnimatedSection animation="fade-up" className={styles.header}>
          <span className="subtitle">Destacadas Tokko</span>
          <h2 className={styles.sectionTitle}>
            Propiedades <span className="text-gold">seleccionadas</span>
          </h2>
          <hr className="divider divider-center" />
        </AnimatedSection>

        <div className={styles.scrollContainer}>
          <div className={styles.scrollTrack}>
            {featuredList.map((property, i) => (
              <AnimatedSection key={property.id} animation="fade-up" delay={i * 100}>
                <PropertyCard
                  property={property}
                  layoutId={layoutId}
                  onClick={() => setActive(property)}
                />
              </AnimatedSection>
            ))}
          </div>
        </div>

        {/* Expanded Overlay */}
        <AnimatePresence>
          {active && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.expandedBackdrop}
              />
              <ExpandedCard
                property={active}
                layoutId={layoutId}
                onClose={() => setActive(null)}
              />
            </>
          )}
        </AnimatePresence>

        <AnimatedSection animation="fade-up" className={styles.viewAll}>
          <MovingBorderButton href="/propiedades" borderRadius="1.75rem">
            Ver todas las propiedades
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </MovingBorderButton>
        </AnimatedSection>
      </div>
    </section>
  );
}
