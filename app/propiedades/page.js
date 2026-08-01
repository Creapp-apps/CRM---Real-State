'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/properties/PropertyCard';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GlassSelect from '@/components/ui/GlassSelect';
import { MOCK_PROPERTIES, filterProperties, sortProperties } from '@/lib/mockData';
import styles from './page.module.css';

function PropertyFilters({ filters, setFilters, resultCount, availableOptions }) {
  const options = useMemo(() => {
    return {
      operations: ['Venta', 'Alquiler'],
      types: availableOptions?.types || ['Casa', 'Departamento', 'Terreno', 'PH', 'Local', 'Oficina'],
      neighborhoods: availableOptions?.neighborhoods || ['Buenos Aires', 'Costa Esmeralda', 'San Martín de los Andes', 'Nordelta', 'Palermo'],
    };
  }, [availableOptions]);

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasFilters = Object.values(filters).some(v => v);

  return (
    <div className={styles.filters}>
      <div className={styles.filtersHeader}>
        <h3 className={styles.filtersTitle}>Filtros</h3>
        {hasFilters && (
          <button className={styles.clearBtn} onClick={clearFilters}>
            Limpiar
          </button>
        )}
      </div>

      {/* Search */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Buscar</label>
        <div className={styles.searchWrapper}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Barrio, tipo, zona..."
            value={filters.search || ''}
            onChange={e => handleChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Operation */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Operación</label>
        <div className={styles.chipGroup}>
          {options.operations.map(op => (
            <button
              key={op}
              className={`${styles.chip} ${filters.operation === op.toLowerCase() ? styles.chipActive : ''}`}
              onClick={() => handleChange('operation', filters.operation === op.toLowerCase() ? '' : op.toLowerCase())}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Tipo de propiedad</label>
        <GlassSelect
          value={filters.type || ''}
          onChange={(val) => handleChange('type', val)}
          options={[
            { value: '', label: 'Todos los tipos' },
            ...options.types.map((type) => ({ value: type, label: type })),
          ]}
          placeholder="Todos los tipos"
        />
      </div>

      {/* Neighborhood */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Ubicación</label>
        <GlassSelect
          value={filters.neighborhood || ''}
          onChange={(val) => handleChange('neighborhood', val)}
          options={[
            { value: '', label: 'Todas las zonas' },
            ...options.neighborhoods.map((n) => ({ value: n, label: n })),
          ]}
          placeholder="Todas las zonas"
        />
      </div>

      {/* Bedrooms */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Ambientes mínimos</label>
        <div className={styles.chipGroup}>
          {['1', '2', '3', '4'].map(n => (
            <button
              key={n}
              className={`${styles.chip} ${styles.chipSmall} ${filters.bedrooms === n ? styles.chipActive : ''}`}
              onClick={() => handleChange('bedrooms', filters.bedrooms === n ? '' : n)}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className={styles.resultCount}>
        <span className={styles.resultNumber}>{resultCount}</span> propiedad{resultCount !== 1 ? 'es' : ''} encontrada{resultCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialOperation = searchParams.get('operacion') || '';

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    operation: initialOperation,
  });
  const [sortBy, setSortBy] = useState('recent');
  const [view, setView] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch('/api/properties');
        if (res.ok) {
          const data = await res.json();
          if (data.properties && data.properties.length > 0) {
            setProperties(data.properties);
          } else {
            setProperties(MOCK_PROPERTIES);
          }
        } else {
          setProperties(MOCK_PROPERTIES);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setProperties(MOCK_PROPERTIES);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const availableOptions = useMemo(() => {
    const types = Array.from(new Set(properties.map(p => p.type).filter(Boolean))).sort();
    const neighborhoods = Array.from(new Set(properties.map(p => p.neighborhood || p.location).filter(Boolean))).sort();
    return { types, neighborhoods };
  }, [properties]);

  const filtered = useMemo(() => {
    const result = filterProperties(properties, filters);
    return sortProperties(result, sortBy);
  }, [properties, filters, sortBy]);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Page Header */}
        <section className={styles.pageHeader}>
          <div className="container">
            <AnimatedSection animation="fade-up">
              <span className="subtitle">Catálogo Exclusivo</span>
              <h1 className={styles.pageTitle}>
                Nuestras <span className="text-gold">Propiedades</span>
              </h1>
              <p className={styles.pageDesc}>
                Explorá nuestra selección de propiedades en tiempo real. Usá los filtros para encontrar exactamente lo que buscás.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <div className={`container ${styles.catalogLayout}`}>
          {/* Mobile Filter Toggle */}
          <button
            className={styles.mobileFilterBtn}
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtros
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className={styles.filterBadge}>{Object.values(filters).filter(Boolean).length}</span>
            )}
          </button>

          {/* Sidebar Filters Animated Entrance */}
          <motion.aside
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`${styles.sidebar} ${mobileFiltersOpen ? styles.sidebarOpen : ''}`}
          >
            <div className={styles.sidebarOverlay} onClick={() => setMobileFiltersOpen(false)} />
            <div className={styles.sidebarContent}>
              <button className={styles.sidebarClose} onClick={() => setMobileFiltersOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <PropertyFilters
                filters={filters}
                setFilters={setFilters}
                resultCount={filtered.length}
                availableOptions={availableOptions}
              />
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className={styles.content}>
            {/* Toolbar Animated Entrance */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={styles.toolbar}
            >
              <div className={styles.toolbarLeft}>
                <span className={styles.resultText}>
                  <strong>{filtered.length}</strong> propiedad{filtered.length !== 1 ? 'es' : ''}
                </span>
              </div>
              <div className={styles.toolbarRight}>
                {/* Sort */}
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="recent">Más recientes</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="area">Mayor superficie</option>
                </select>

                {/* View Toggle */}
                <div className={styles.viewToggle}>
                  <button
                    className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
                    onClick={() => setView('grid')}
                    aria-label="Vista grilla"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                  </button>
                  <button
                    className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
                    onClick={() => setView('list')}
                    aria-label="Vista lista"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Loading / Property Grid with Staggered Lateral Slide Animation */}
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinnerWrapper}>
                  <div className={styles.spinnerPulse} />
                  <div className={styles.spinnerRing} />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div>
                  <h3 className={styles.loadingText}>Cargando catálogo de propiedades...</h3>
                  <span className={styles.loadingSubtext}>Mónica Cardoso Propiedades</span>
                </div>
              </div>
            ) : filtered.length > 0 ? (
              <motion.div
                layout
                className={view === 'grid' ? styles.grid : styles.list}
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((property, index) => (
                    <motion.div
                      key={property.id}
                      layout
                      initial={{ opacity: 0, x: 50, y: 15 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, x: -20 }}
                      transition={{
                        duration: 0.48,
                        delay: Math.min(index * 0.07, 0.4), // Staggered lateral slide animation!
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <PropertyCard property={property} view={view} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.empty}
              >
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
                <h3>No encontramos propiedades</h3>
                <p>Probá ajustando los filtros para ver más resultados.</p>
                <button className="btn btn-secondary" onClick={() => setFilters({})}>
                  Limpiar filtros
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function PropiedadesPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
