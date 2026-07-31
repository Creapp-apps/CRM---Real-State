'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

/* ── Custom Dropdown ── */
function CustomSelect({ label, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = selected ? selected.label : placeholder;

  return (
    <div className={styles.searchGroup} ref={ref}>
      <label className={styles.searchLabel}>{label}</label>
      <button
        type="button"
        className={styles.customSelect}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selected ? styles.selectValue : styles.selectPlaceholder}>
          {displayValue}
        </span>
        <svg
          className={`${styles.selectChevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.dropdownItem} ${
                selected?.value === opt.value ? styles.dropdownItemActive : ''
              }`}
              onClick={() => {
                setSelected(opt.value === '' ? null : opt);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Hero Section ── */
export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setLoaded(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const title = "Te acompañamos a encontrar tu lugar ideal";

  const operacionOptions = [
    { value: '', label: 'Todas' },
    { value: 'venta', label: 'Venta' },
    { value: 'alquiler', label: 'Alquiler' },
    { value: 'temporario', label: 'Temporario' },
  ];

  const tipoOptions = [
    { value: '', label: 'Todos' },
    { value: 'departamento', label: 'Departamento' },
    { value: 'casa', label: 'Casa' },
    { value: 'ph', label: 'PH' },
    { value: 'terreno', label: 'Terreno' },
    { value: 'local', label: 'Local' },
    { value: 'oficina', label: 'Oficina' },
  ];

  return (
    <section className={styles.hero} ref={heroRef}>

      {/* Content */}
      <div className={`container ${styles.content}`}>
        {/* Staggered Title */}
        <h1 className={styles.title}>
          {title.split(' ').map((word, i) => (
            <span
              key={i}
              className={`${styles.word} ${loaded ? styles.wordVisible : ''}`}
              style={{ animationDelay: `${600 + i * 100}ms` }}
            >
              {word}{' '}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p className={`${styles.subtitle} ${loaded ? styles.visible : ''}`}>
          Venta, alquiler y tasaciones de propiedades en Argentina
        </p>

        {/* Quick Search Bar */}
        <div className={`${styles.searchBar} ${loaded ? styles.visible : ''}`}>
          <CustomSelect
            label="Operación"
            options={operacionOptions}
            placeholder="Todas"
          />

          <div className={styles.searchDivider} />

          <CustomSelect
            label="Tipo"
            options={tipoOptions}
            placeholder="Todos"
          />

          <div className={styles.searchDivider} />

          <div className={styles.searchGroup}>
            <label className={styles.searchLabel}>Ubicación</label>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Barrio o zona..."
            />
          </div>

          <div className={styles.searchDivider} />

          <div className={styles.searchGroup}>
            <label className={styles.searchLabel}>Características</label>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Ej: pileta, 2 ambientes..."
            />
          </div>

          <Link href="/propiedades" className={`btn btn-primary ${styles.searchBtn}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Buscar
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className={`${styles.scrollIndicator} ${loaded ? styles.visible : ''}`}>
        <span className={styles.scrollText}>Descubrí más</span>
        <div className={styles.scrollArrow}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
