import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

const QUICK_LINKS = [
  { href: '/propiedades?operation=venta', label: 'Propiedades en Venta' },
  { href: '/propiedades?operation=alquiler', label: 'Alquileres' },
  { href: '/emprendimientos', label: 'Emprendimientos' },
  { href: '/tasar', label: 'Tasá tu Propiedad' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/nosotros', label: 'Nosotros' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Gold accent line */}
      <div className={styles.topAccent} />

      <div className={`container ${styles.footerContent}`}>
        {/* Brand Column */}
        <div className={styles.brandCol}>
          <Link href="/" className={styles.footerLogo}>
            <Image
              src="/logos/Mónica Cardoso - Logo-05.png"
              alt="Cardoso Propiedades"
              width={180}
              height={55}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <p className={styles.brandText}>
            Tu socio de confianza en el mercado inmobiliario. 
            Experiencia, dedicación y compromiso para encontrar el hogar de tus sueños.
          </p>
        </div>

        {/* Quick Links */}
        <div className={styles.linksCol}>
          <h4 className={styles.colTitle}>Enlaces</h4>
          <ul className={styles.linksList}>
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className={styles.contactCol}>
          <h4 className={styles.colTitle}>Contacto</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <a href="tel:+5491100000000">+54 9 11 0000-0000</a>
            </li>
            <li className={styles.contactItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <a href="mailto:info@cardosopropiedades.com">info@cardosopropiedades.com</a>
            </li>
            <li className={styles.contactItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Buenos Aires, Argentina</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomContent}`}>
          <p className={styles.copyright}>
            © {currentYear} Cardoso Propiedades. Todos los derechos reservados.
          </p>
          <p className={styles.powered}>
            Desarrollado con ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
