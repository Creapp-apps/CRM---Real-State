'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './page.module.css';

const PROPERTY_TYPES = ['Departamento', 'Casa', 'PH', 'Terreno', 'Local', 'Oficina', 'Otro'];

export default function TasarPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: '', address: '', neighborhood: '', area: '', bedrooms: '',
    bathrooms: '', age: '', garages: '', extras: '',
    name: '', email: '', phone: '',
  });
  const [sent, setSent] = useState(false);

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div className="container">
            <AnimatedSection animation="fade-up">
              <span className="subtitle">Tasación gratuita</span>
              <h1 className={styles.pageTitle}>
                Tasá tu <span className="text-gold">propiedad</span>
              </h1>
              <p className={styles.pageDesc}>
                Obtené una tasación profesional sin cargo. Completá los datos de tu propiedad y nuestro equipo te contactará con una valuación precisa.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <div className={`container ${styles.tasarLayout}`}>
          {/* Left - Steps */}
          <AnimatedSection animation="fade-right" className={styles.stepsCol}>
            <div className={styles.stepsCard}>
              <h3 className={styles.stepsTitle}>¿Cómo funciona?</h3>
              <div className={styles.stepsList}>
                <div className={`${styles.stepItem} ${step >= 1 ? styles.stepActive : ''}`}>
                  <div className={styles.stepNumber}>1</div>
                  <div>
                    <h4 className={styles.stepName}>Datos de la propiedad</h4>
                    <p className={styles.stepDesc}>Contanos las características principales</p>
                  </div>
                </div>
                <div className={styles.stepLine} />
                <div className={`${styles.stepItem} ${step >= 2 ? styles.stepActive : ''}`}>
                  <div className={styles.stepNumber}>2</div>
                  <div>
                    <h4 className={styles.stepName}>Tus datos de contacto</h4>
                    <p className={styles.stepDesc}>Para enviarte el informe de tasación</p>
                  </div>
                </div>
                <div className={styles.stepLine} />
                <div className={`${styles.stepItem} ${sent ? styles.stepActive : ''}`}>
                  <div className={styles.stepNumber}>3</div>
                  <div>
                    <h4 className={styles.stepName}>Recibí tu tasación</h4>
                    <p className={styles.stepDesc}>Te contactamos en menos de 48hs</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Right - Form */}
          <AnimatedSection animation="fade-left" className={styles.formCol}>
            {sent ? (
              <div className={styles.successCard}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h2 className={styles.successTitle}>¡Solicitud enviada!</h2>
                <p className={styles.successDesc}>
                  Recibimos los datos de tu propiedad. Un profesional de nuestro equipo te contactará en las próximas 48 horas hábiles con la tasación.
                </p>
              </div>
            ) : (
              <form className={styles.formCard} onSubmit={handleSubmit}>
                {step === 1 && (
                  <>
                    <h3 className={styles.formTitle}>Datos de la propiedad</h3>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label className={styles.label}>Tipo de propiedad *</label>
                        <div className={styles.typeChips}>
                          {PROPERTY_TYPES.map(type => (
                            <button key={type} type="button"
                              className={`${styles.typeChip} ${formData.type === type ? styles.typeChipActive : ''}`}
                              onClick={() => updateField('type', type)}
                            >{type}</button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label className={styles.label}>Dirección *</label>
                        <input type="text" required className={styles.input} value={formData.address} onChange={e => updateField('address', e.target.value)} placeholder="Calle y número" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Barrio / Zona *</label>
                        <input type="text" required className={styles.input} value={formData.neighborhood} onChange={e => updateField('neighborhood', e.target.value)} placeholder="Ej: Palermo" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Superficie (m²)</label>
                        <input type="number" className={styles.input} value={formData.area} onChange={e => updateField('area', e.target.value)} placeholder="Total" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Ambientes</label>
                        <input type="number" className={styles.input} value={formData.bedrooms} onChange={e => updateField('bedrooms', e.target.value)} placeholder="Cant." />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Baños</label>
                        <input type="number" className={styles.input} value={formData.bathrooms} onChange={e => updateField('bathrooms', e.target.value)} placeholder="Cant." />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Antigüedad (años)</label>
                        <input type="number" className={styles.input} value={formData.age} onChange={e => updateField('age', e.target.value)} placeholder="0 = A estrenar" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Cocheras</label>
                        <input type="number" className={styles.input} value={formData.garages} onChange={e => updateField('garages', e.target.value)} placeholder="Cant." />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label className={styles.label}>Extras / Comentarios</label>
                        <textarea className={styles.textarea} rows={3} value={formData.extras} onChange={e => updateField('extras', e.target.value)} placeholder="Pileta, terraza, reformas recientes..." />
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(2)}>
                      Siguiente →
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className={styles.formTitle}>Tus datos de contacto</h3>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label className={styles.label}>Nombre completo *</label>
                        <input type="text" required className={styles.input} value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="Tu nombre" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Email *</label>
                        <input type="email" required className={styles.input} value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="tu@email.com" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Teléfono *</label>
                        <input type="tel" required className={styles.input} value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+54 9 11..." />
                      </div>
                    </div>
                    <div className={styles.formButtons}>
                      <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Atrás</button>
                      <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}>Solicitar tasación</button>
                    </div>
                  </>
                )}
              </form>
            )}
          </AnimatedSection>
        </div>
      </main>
      <Footer />
    </>
  );
}
