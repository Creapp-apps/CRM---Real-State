'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import PropertyCard from '@/components/properties/PropertyCard';
import MortgageCalculator from '@/components/properties/MortgageCalculator';
import { MOCK_PROPERTIES, formatPrice } from '@/lib/mockData';
import styles from './page.module.css';

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function loadProperty() {
      if (!params?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/properties?id=${params.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.property) {
            setProperty(data.property);
          } else {
            // Fallback to MOCK_PROPERTIES
            const mock = MOCK_PROPERTIES.find(p => p.id === params.id);
            setProperty(mock || null);
          }
        } else {
          const mock = MOCK_PROPERTIES.find(p => p.id === params.id);
          setProperty(mock || null);
        }

        // Fetch all properties to get similar ones
        const allRes = await fetch('/api/properties');
        if (allRes.ok) {
          const allData = await allRes.json();
          const allProps = allData.properties || MOCK_PROPERTIES;
          const sim = allProps.filter(p => String(p.id) !== String(params.id)).slice(0, 3);
          setSimilarProperties(sim);
        } else {
          setSimilarProperties(MOCK_PROPERTIES.filter(p => p.id !== params.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading property detail:', err);
        const mock = MOCK_PROPERTIES.find(p => p.id === params.id);
        setProperty(mock || null);
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [params?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message || `Consulta por la propiedad ${property?.title || ''}`,
          propertyId: property?.tokkoId || property?.id
        })
      });

      if (res.ok) {
        setFormSent(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setFormSent(false), 5000);
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Ocurrió un problema al enviar la consulta. Intente nuevamente.');
      }
    } catch (err) {
      console.error('Error enviando contacto:', err);
      setFormError('Ocurrió un problema de conexión. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className="container" style={{ padding: '8rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h2>Cargando detalle de la propiedad...</h2>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={`container ${styles.notFound}`}>
            <h1>Propiedad no encontrada</h1>
            <p>La propiedad que buscás no existe o fue removida.</p>
            <Link href="/propiedades" className="btn btn-primary">Ver propiedades</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const whatsappMsg = encodeURIComponent(`Hola! Me interesa la propiedad: ${property.title} (${formatPrice(property.price, property.currency, property.priceLabel)}). Ref: ${property.referenceCode || property.id}. ¿Podemos coordinar una visita?`);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={`container ${styles.breadcrumb}`}>
          <Link href="/">Inicio</Link>
          <span>/</span>
          <Link href="/propiedades">Propiedades</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{property.title}</span>
        </div>

        {/* Gallery */}
        <section className={`container ${styles.gallery}`}>
          <div className={styles.mainImage} onClick={() => setLightboxOpen(true)}>
            <Image
              src={property.images[selectedImage] || property.images[0] || '/images/hero-bg.jpg'}
              alt={property.title}
              fill
              style={{ objectFit: 'cover' }}
              quality={90}
              priority
              sizes="(max-width: 768px) 100vw, 70vw"
            />
            <div className={styles.zoomHint}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </div>
            <div className={styles.imageBadges}>
              <span className={styles.opBadge}>{property.operation}</span>
              <span className={styles.tpBadge}>{property.type}</span>
            </div>
          </div>
          <div className={styles.thumbnails}>
            {property.images.map((img, i) => (
              <button
                key={i}
                className={`${styles.thumb} ${i === selectedImage ? styles.thumbActive : ''}`}
                onClick={() => setSelectedImage(i)}
              >
                <Image src={img} alt={`Vista ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="120px" />
              </button>
            ))}
          </div>
        </section>

        {/* Lightbox */}
        {lightboxOpen && (
          <div className={styles.lightbox} onClick={() => setLightboxOpen(false)}>
            <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
              <Image
                src={property.images[selectedImage] || property.images[0]}
                alt={property.title}
                fill
                style={{ objectFit: 'contain' }}
                quality={90}
              />
            </div>
            <div className={styles.lightboxNav}>
              <button
                className={styles.lightboxArrow}
                onClick={e => { e.stopPropagation(); setSelectedImage(p => p > 0 ? p - 1 : property.images.length - 1); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className={styles.lightboxCounter}>{selectedImage + 1} / {property.images.length}</span>
              <button
                className={styles.lightboxArrow}
                onClick={e => { e.stopPropagation(); setSelectedImage(p => p < property.images.length - 1 ? p + 1 : 0); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Detail Content */}
        <div className={`container ${styles.detailLayout}`}>
          {/* Left Column — Info */}
          <div className={styles.infoCol}>
            <AnimatedSection animation="fade-up">
              {/* Price & Title */}
              <div className={styles.priceBlock}>
                <span className={styles.price}>{formatPrice(property.price, property.currency, property.priceLabel)}</span>
                <h1 className={styles.detailTitle}>{property.title}</h1>
                <p className={styles.detailLocation}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {property.address} {property.referenceCode ? `(Ref: ${property.referenceCode})` : ''}
                </p>
              </div>
            </AnimatedSection>

            {/* Features Grid */}
            <AnimatedSection animation="fade-up" delay={100}>
              <div className={styles.featuresGrid}>
                {property.bedrooms > 0 && (
                  <div className={styles.featureItem}>
                    <span className={styles.featureValue}>{property.bedrooms}</span>
                    <span className={styles.featureLabel}>Ambientes</span>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className={styles.featureItem}>
                    <span className={styles.featureValue}>{property.bathrooms}</span>
                    <span className={styles.featureLabel}>Baños</span>
                  </div>
                )}
                {property.totalArea > 0 && (
                  <div className={styles.featureItem}>
                    <span className={styles.featureValue}>{property.totalArea}</span>
                    <span className={styles.featureLabel}>m² totales</span>
                  </div>
                )}
                {property.coveredArea > 0 && (
                  <div className={styles.featureItem}>
                    <span className={styles.featureValue}>{property.coveredArea}</span>
                    <span className={styles.featureLabel}>m² cubiertos</span>
                  </div>
                )}
                {property.garages > 0 && (
                  <div className={styles.featureItem}>
                    <span className={styles.featureValue}>{property.garages}</span>
                    <span className={styles.featureLabel}>Cochera{property.garages > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </AnimatedSection>

            {/* Description */}
            <AnimatedSection animation="fade-up" delay={200}>
              <div className={styles.descriptionBlock}>
                <h2 className={styles.sectionTitle}>Descripción</h2>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: property.description.replace(/\n/g, '<br />') }}
                />
              </div>
            </AnimatedSection>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <AnimatedSection animation="fade-up" delay={300}>
                <div className={styles.amenitiesBlock}>
                  <h2 className={styles.sectionTitle}>Amenities y características</h2>
                  <div className={styles.amenitiesList}>
                    {property.amenities.map((amenity, i) => (
                      <span key={i} className={styles.amenityTag}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* Mortgage Calculator */}
            {property.operationType === 'venta' && property.price > 0 && (
              <AnimatedSection animation="fade-up" delay={400}>
                <MortgageCalculator propertyPrice={property.price} />
              </AnimatedSection>
            )}
          </div>

          {/* Right Column — Contact & Share */}
          <div className={styles.contactCol}>
            <div className={styles.contactCard}>
              <h3 className={styles.contactTitle}>¿Te interesa esta propiedad?</h3>
              <p className={styles.contactSubtitle}>Completá el formulario y la consulta ingresa directo a nuestro CRM en Tokko Broker</p>

              {formSent ? (
                <div className={styles.successMsg}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <p>¡Consulta enviada con éxito! Te contactaremos pronto.</p>
                </div>
              ) : (
                <form className={styles.contactForm} onSubmit={handleSubmit}>
                  {formError && (
                    <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {formError}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    required
                    className={styles.formInput}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    className={styles.formInput}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    className={styles.formInput}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <textarea
                    placeholder="Mensaje (opcional)"
                    rows={4}
                    className={styles.formTextarea}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    {submitting ? 'Enviando a Tokko...' : 'Enviar consulta'}
                  </button>
                </form>
              )}

              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/5491166092461?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar por WhatsApp
              </a>

              {/* Share */}
              <div className={styles.shareBlock}>
                <span className={styles.shareLabel}>Compartir</span>
                <div className={styles.shareButtons}>
                  <button className={styles.shareBtn} onClick={() => navigator.clipboard.writeText(window.location.href)} title="Copiar link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <a className={styles.shareBtn} href={`https://wa.me/?text=${encodeURIComponent(property.title + ' - ' + (typeof window !== 'undefined' ? window.location.href : ''))}`} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <a className={styles.shareBtn} href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent('Mirá esta propiedad: ' + (typeof window !== 'undefined' ? window.location.href : ''))}`} title="Email">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <section className={styles.similarSection}>
            <div className="container">
              <AnimatedSection animation="fade-up">
                <h2 className={styles.similarTitle}>Propiedades similares</h2>
              </AnimatedSection>
              <div className={styles.similarGrid}>
                {similarProperties.map(p => (
                  <AnimatedSection key={p.id} animation="fade-up" delay={100}>
                    <PropertyCard property={p} />
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
