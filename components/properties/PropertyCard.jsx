'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/mockData';
import styles from './PropertyCard.module.css';

export default function PropertyCard({ property, view = 'grid' }) {
  const {
    id, title, operation, price, currency, priceLabel,
    location, bedrooms, bathrooms, totalArea, garages, images, type
  } = property;

  if (view === 'list') {
    return (
      <Link href={`/propiedades/${id}`} className={styles.listCard}>
        <div className={styles.listImage}>
          <Image
            src={images[0]}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="300px"
          />
          <span className={styles.badge}>{operation}</span>
          <span className={styles.typeBadge}>{type}</span>
        </div>
        <div className={styles.listBody}>
          <div className={styles.listTop}>
            <span className={styles.price}>{formatPrice(price, currency, priceLabel)}</span>
            <h3 className={styles.listTitle}>{title}</h3>
            <p className={styles.location}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {location}
            </p>
          </div>
          <div className={styles.listFeatures}>
            {bedrooms > 0 && <span className={styles.feature}><FeatureIcon type="bed" />{bedrooms} amb</span>}
            {bathrooms > 0 && <span className={styles.feature}><FeatureIcon type="bath" />{bathrooms} baño{bathrooms > 1 ? 's' : ''}</span>}
            <span className={styles.feature}><FeatureIcon type="area" />{totalArea} m²</span>
            {garages > 0 && <span className={styles.feature}><FeatureIcon type="car" />{garages} coch.</span>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/propiedades/${id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={images[0]}
          alt={title}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className={styles.badge}>{operation}</span>
        <span className={styles.typeBadge}>{type}</span>
        <div className={styles.imageOverlay} />
      </div>
      <div className={styles.body}>
        <span className={styles.price}>{formatPrice(price, currency, priceLabel)}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.location}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {location}
        </p>
        <div className={styles.features}>
          {bedrooms > 0 && <span className={styles.feature}><FeatureIcon type="bed" />{bedrooms} amb</span>}
          {bathrooms > 0 && <span className={styles.feature}><FeatureIcon type="bath" />{bathrooms} baño{bathrooms > 1 ? 's' : ''}</span>}
          <span className={styles.feature}><FeatureIcon type="area" />{totalArea} m²</span>
          {garages > 0 && <span className={styles.feature}><FeatureIcon type="car" />{garages} coch.</span>}
        </div>
      </div>
    </Link>
  );
}

function FeatureIcon({ type }) {
  const icons = {
    bed: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7"/><path d="M21 7H3l2-4h14l2 4z"/></svg>,
    bath: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5"/><rect x="2" y="12" width="20" height="4" rx="1"/><path d="M6 16v4"/><path d="M18 16v4"/></svg>,
    area: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>,
    car: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2M5 17l-1 3M19 17l1 3"/><circle cx="7.5" cy="12.5" r="1.5"/><circle cx="16.5" cy="12.5" r="1.5"/></svg>,
  };
  return icons[type] || null;
}
