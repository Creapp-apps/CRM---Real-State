'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import AiSearchAssistant from './AiSearchAssistant';
import styles from './HeroSection.module.css';

/* ── Rotating Word Component ── */
const ROTATING_WORDS = ['lugar', 'espacio', 'hogar', 'local', 'negocio'];

function RotatingWord({ words }) {
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState([]);
  const measureRef = useRef(null);

  useEffect(() => {
    if (measureRef.current) {
      const children = Array.from(measureRef.current.children);
      const measured = children.map((el) => el.getBoundingClientRect().width);
      setWidths(measured);
    }
  }, [words]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [words]);

  const currentWidth = widths[index] ? widths[index] : 'auto';

  return (
    <>
      {/* Capa oculta para medir exactamente los píxeles de cada palabra */}
      <span ref={measureRef} className={styles.measureContainer} aria-hidden="true">
        {words.map((w) => (
          <span key={w} className={styles.rotatingWord}>
            {w}
          </span>
        ))}
      </span>

      <motion.span
        animate={{ width: currentWidth }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className={styles.rotatingWordWrapper}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[index]}
            initial={{ opacity: 0, y: 18, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -18, filter: 'blur(3px)' }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className={styles.rotatingWord}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}

/* ── Custom Dropdown ── */
function CustomSelect({ label, options, placeholder, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);
  const displayValue = selectedOpt ? selectedOpt.label : placeholder;

  return (
    <div className={styles.searchGroup} ref={ref}>
      <label className={styles.searchLabel}>{label}</label>
      <button
        type="button"
        className={styles.customSelect}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOpt && selectedOpt.value !== '' ? styles.selectValue : styles.selectPlaceholder}>
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
                value === opt.value ? styles.dropdownItemActive : ''
              }`}
              onClick={() => {
                if (onChange) onChange(opt.value);
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
  const [selectedOperacion, setSelectedOperacion] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const heroRef = useRef(null);

  useEffect(() => {
    setLoaded(true);
  }, []);

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
        {/* Title with Rotating Word */}
        <h1 className={`${styles.title} ${loaded ? styles.visible : ''}`}>
          Te acompañamos a encontrar tu{' '}
          <RotatingWord words={ROTATING_WORDS} />{' '}
          ideal
        </h1>

        {/* Subtitle */}
        <p className={`${styles.subtitle} ${loaded ? styles.visible : ''}`}>
          Venta, alquiler y tasaciones de propiedades en Argentina
        </p>

        {/* Unified Search Section: Coexisting AI Assistant + Classic Filters */}
        <div className={`${styles.unifiedSearchContainer} ${loaded ? styles.visible : ''}`}>
          {/* Subtle Compact AI Assistant Bar */}
          <AiSearchAssistant
            onSelectOperacion={(val) => setSelectedOperacion(val)}
          />

          {/* Classic Filter Search Bar */}
          <div className={styles.searchBar}>
            <CustomSelect
              label="Operación"
              options={operacionOptions}
              placeholder="Todas"
              value={selectedOperacion}
              onChange={(val) => setSelectedOperacion(val)}
            />

            <div className={styles.searchDivider} />

            <CustomSelect
              label="Tipo"
              options={tipoOptions}
              placeholder="Todos"
              value={selectedTipo}
              onChange={(val) => setSelectedTipo(val)}
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

            <Link
              href={`/propiedades${
                selectedOperacion || selectedTipo
                  ? `?${new URLSearchParams({
                      ...(selectedOperacion && { operacion: selectedOperacion }),
                      ...(selectedTipo && { tipo: selectedTipo }),
                    }).toString()}`
                  : ''
              }`}
              className={`btn btn-primary ${styles.searchBtn}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Buscar
            </Link>
          </div>
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
