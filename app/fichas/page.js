// Índice de publicaciones de MercadoLibre para generar fichas.
// /fichas — lista las publicaciones activas con link a /ficha/[id].

import Image from 'next/image';
import Link from 'next/link';
import { getMeliProperties, isMeliConnected } from '@/lib/mercadolibre';
import { formatPrice } from '@/lib/mockData';
import styles from './fichas.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fichas | Cardoso Propiedades',
  robots: { index: false, follow: false },
};

export default async function FichasPage() {
  const connected = await isMeliConnected();
  const { properties } = connected ? await getMeliProperties({ limit: 50 }) : { properties: [] };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Image src="/logohorizontal.png" alt="Cardoso Propiedades" width={220} height={36} className={styles.logo} priority />
        <div>
          <h1 className={styles.title}>Fichas de publicaciones</h1>
          <p className={styles.sub}>
            {connected
              ? `${properties.length} publicaciones activas de MercadoLibre. Elegí una para abrir su ficha.`
              : 'Conectá tu cuenta de MercadoLibre para ver tus publicaciones.'}
          </p>
        </div>
      </header>

      {!connected && (
        <p className={styles.empty}>
          La cuenta de MercadoLibre no está conectada todavía.
        </p>
      )}

      <div className={styles.grid}>
        {properties.map((p) => (
          <Link key={p.id} href={`/ficha/${p.id}`} className={styles.card}>
            <div className={styles.thumb}>
              <Image src={p.images[0]} alt={p.title} fill sizes="(max-width: 700px) 100vw, 33vw" className={styles.thumbImg} />
              <span className={styles.badge}>{p.operation}</span>
            </div>
            <div className={styles.info}>
              <span className={styles.cardType}>{p.type} · {p.location}</span>
              <h2 className={styles.cardTitle}>{p.title}</h2>
              <span className={styles.cardPrice}>{formatPrice(p.price, p.currency, p.priceLabel)}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
