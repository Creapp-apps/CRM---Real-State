'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

/* ─── Categorías MELI ─────────────────────────────────────────────────── */
const CATEGORY_MAP = {
  casa:         { venta: 'MLA1468', alquiler: 'MLA1467', temporario: 'MLA50278' },
  departamento: { venta: 'MLA1474', alquiler: 'MLA1473', temporario: 'MLA50279' },
  ph:           { venta: 'MLA105182', alquiler: 'MLA105181', temporario: 'MLA105180' },
  local:        { venta: 'MLA79244', alquiler: 'MLA79243' },
  oficina:      { venta: 'MLA50540', alquiler: 'MLA50539' },
  cochera:      { venta: 'MLA50543', alquiler: 'MLA50542' },
  deposito:     { venta: 'MLA1477', alquiler: 'MLA1476' },
  campo:        { venta: 'MLA6413', alquiler: 'MLA6414' },
  quinta:       { venta: 'MLA50551', alquiler: 'MLA50549', temporario: 'MLA52745' },
  otro:         { venta: 'MLA6396', alquiler: 'MLA6395', temporario: 'MLA50283' },
};

const TIPOS = [
  { key: 'casa',         label: 'Casa',           icon: 'home' },
  { key: 'departamento', label: 'Departamento',    icon: 'building' },
  { key: 'ph',           label: 'PH',              icon: 'layers' },
  { key: 'local',        label: 'Local Comercial', icon: 'store' },
  { key: 'oficina',      label: 'Oficina',         icon: 'briefcase' },
  { key: 'cochera',      label: 'Cochera',         icon: 'car' },
  { key: 'deposito',     label: 'Depósito/Galpón', icon: 'package' },
  { key: 'campo',        label: 'Campo',           icon: 'map' },
  { key: 'quinta',       label: 'Quinta',          icon: 'tree' },
  { key: 'otro',         label: 'Otro',            icon: 'more-horizontal' },
];

const OPS = [
  { key: 'venta',      label: 'Venta' },
  { key: 'alquiler',   label: 'Alquiler' },
  { key: 'temporario', label: 'Alquiler temporario' },
];

/* Tipos residenciales (muestran campos de ambientes/dorms/baños) */
const RESIDENTIAL = new Set(['casa', 'departamento', 'ph', 'quinta']);

/* Comodidades — atributos booleanos MELI (IDs verificados contra /categories/{id}/attributes) */
const AMENITIES = [
  { id: 'HAS_SWIMMING_POOL',     label: 'Pileta' },
  { id: 'HAS_GRILL',             label: 'Parrilla' },
  { id: 'HAS_GARDEN',            label: 'Jardín / Parque' },
  { id: 'HAS_BALCONY',           label: 'Balcón' },
  { id: 'HAS_TERRACE',           label: 'Terraza' },
  { id: 'HAS_PATIO',             label: 'Patio' },
  { id: 'HAS_LAUNDRY',           label: 'Lavadero' },
  { id: 'HAS_SECURITY',          label: 'Seguridad' },
  { id: 'HAS_GYM',               label: 'Gimnasio' },
  { id: 'IS_SUITABLE_FOR_PETS',  label: 'Admite mascotas' },
  { id: 'PROFESSIONAL_USE_ALLOWED', label: 'Apto profesional' },
  { id: 'FURNISHED',             label: 'Amoblado' },
  { id: 'HAS_AIR_CONDITIONING',  label: 'Aire acondicionado' },
  { id: 'HAS_HEATING',           label: 'Calefacción' },
  { id: 'HAS_CLOSETS',           label: 'Placards' },
  { id: 'IN_GATED_COMMUNITY',    label: 'Barrio cerrado' },
  { id: 'HAS_NATURAL_GAS',       label: 'Gas natural' },
  { id: 'HAS_HALF_BATH',         label: 'Toilette' },
  { id: 'HAS_INTERNET_ACCESS',   label: 'Internet' },
  { id: 'HAS_JACUZZI',           label: 'Jacuzzi' },
];

const CONDITIONS = [
  { value: '',               label: '— No especificado —' },
  { value: 'Nuevo',          label: 'Nuevo / A estrenar' },
  { value: 'Renovado',       label: 'Renovado' },
  { value: 'Buen estado',    label: 'Buen estado' },
  { value: 'En construcción',label: 'En construcción' },
  { value: 'Usado',          label: 'Usado' },
];

const DISPOSITIONS = [
  { value: '',              label: '— No especificada —' },
  { value: 'Frente',        label: 'Frente' },
  { value: 'Contrafrente',  label: 'Contrafrente' },
  { value: 'Lateral',       label: 'Lateral' },
  { value: 'Interno',       label: 'Interno' },
];

const FACINGS = [
  { value: '',      label: '— No especificada —' },
  { value: 'Norte', label: 'Norte' },
  { value: 'Sur',   label: 'Sur' },
  { value: 'Este',  label: 'Este' },
  { value: 'Oeste', label: 'Oeste' },
];

const STEPS = [
  { n: 1, label: '¿Qué publicás?' },
  { n: 2, label: 'Datos del inmueble' },
  { n: 3, label: 'Fotos' },
  { n: 4, label: 'Revisión' },
];

/* ─── Normalización 4:3 ────────────────────────────────────────────────── */
function normalizeImageForMeli(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.height <= img.width) { resolve(file); return; }
      const W = Math.max(img.width, img.height * 4 / 3);
      const H = W * 3 / 4;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, (W - img.width) / 2, (H - img.height) / 2, img.width, img.height);
      canvas.toBlob(
        blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
        'image/jpeg', 0.92
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/* ─── Componente principal ──────────────────────────────────────────────── */
export default function NuevaPublicacion() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* — Paso 1 — */
  const [tipo, setTipo] = useState('');
  const [operacion, setOperacion] = useState('');

  /* — Paso 2: precio — */
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expensas, setExpensas] = useState('');

  /* — Paso 2: título — */
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);

  /* — Paso 2: ubicación — */
  const [states, setStates]             = useState(null);
  const [cities, setCities]             = useState(null);
  const [neighborhoods, setNeighborhoods] = useState(null);
  const [stateId, setStateId]           = useState('');
  const [stateName, setStateName]       = useState('');
  const [cityId, setCityId]             = useState('');
  const [cityName, setCityName]         = useState('');
  const [neighborhoodId, setNeighborhoodId]     = useState('');
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [loadingLoc, setLoadingLoc]     = useState(false);

  /* — Paso 2: superficies y características — */
  const [coveredArea, setCoveredArea] = useState('');
  const [totalArea, setTotalArea]     = useState('');
  const [rooms, setRooms]             = useState('');
  const [bedrooms, setBedrooms]       = useState('');
  const [bathrooms, setBathrooms]     = useState('');
  const [parking, setParking]         = useState('');
  const [age, setAge]               = useState('');
  const [condition, setCondition]   = useState('');
  const [disposition, setDisposition] = useState('');
  const [facing, setFacing]         = useState('');
  const [warehouses, setWarehouses] = useState('');
  const [unitFloor, setUnitFloor]   = useState('');

  /* — Paso 2: descripción y comodidades — */
  const [description, setDescription] = useState('');
  const [amenities, setAmenities]     = useState(new Set());

  /* — Paso 3: fotos — */
  const [photos, setPhotos] = useState([]);
  const [dragging, setDragging] = useState(false);

  /* ── Auto-título (se regenera mientras no fue editado manualmente) ── */
  const autoTitle = useMemo(() => {
    const tipoLabel = TIPOS.find(t => t.key === tipo)?.label || '';
    const opLabel = operacion === 'venta' ? 'en Venta'
      : operacion === 'temporario' ? 'en Alquiler Temporario' : 'en Alquiler';
    const parts = [rooms && `${rooms} amb.`, coveredArea && `${coveredArea} m²`].filter(Boolean);
    const loc = [neighborhoodName, cityName].filter(Boolean).join(', ');
    return [tipoLabel, opLabel, parts.join(' · '), loc].filter(Boolean).join(' · ');
  }, [tipo, operacion, rooms, coveredArea, neighborhoodName, cityName]);

  useEffect(() => {
    if (!titleTouched) setTitle(autoTitle);
  }, [autoTitle, titleTouched]);

  /* ── Carga de ubicaciones ── */
  useEffect(() => {
    if (step === 2 && !states) {
      (async () => {
        setLoadingLoc(true);
        try {
          const res = await fetch('/api/meli/locations?type=states');
          const data = await res.json();
          setStates(data.states || []);
        } finally { setLoadingLoc(false); }
      })();
    }
  }, [step, states]);

  async function onStateChange(id, name) {
    setStateId(id); setStateName(name);
    setCityId(''); setCityName(''); setNeighborhoodId(''); setNeighborhoodName('');
    setCities(null); setNeighborhoods(null);
    if (!id) return;
    setLoadingLoc(true);
    try {
      const res = await fetch(`/api/meli/locations?type=cities&stateId=${encodeURIComponent(id)}`);
      const data = await res.json();
      setCities(data.cities || []);
    } finally { setLoadingLoc(false); }
  }

  async function onCityChange(id, name) {
    setCityId(id); setCityName(name);
    setNeighborhoodId(''); setNeighborhoodName('');
    setNeighborhoods(null);
    if (!id) return;
    setLoadingLoc(true);
    try {
      const res = await fetch(`/api/meli/locations?type=neighborhoods&cityId=${encodeURIComponent(id)}`);
      const data = await res.json();
      setNeighborhoods(data.neighborhoods || []);
    } finally { setLoadingLoc(false); }
  }

  /* ── Validación por step ── */
  function canNext() {
    if (step === 1) return !!tipo && !!operacion;
    if (step === 2) return !!price && !!stateId && !!cityId && title.trim().length >= 10;
    if (step === 3) return true;
    return false;
  }

  function goNext() {
    if (step === 4) { publish(); return; }
    setError(null);
    setStep(s => s + 1);
  }
  function goPrev() { setError(null); setStep(s => s - 1); }

  /* ── Toggle comodidades ── */
  function toggleAmenity(id) {
    setAmenities(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ── Upload fotos ── */
  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    setPhotos(prev => [
      ...prev,
      ...files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        pictureId: null,
      })),
    ]);

    for (let i = 0; i < files.length; i++) {
      const globalIdx = photos.length + i;
      setPhotos(prev => prev.map((p, j) => j === globalIdx ? { ...p, status: 'uploading' } : p));
      try {
        const normalized = await normalizeImageForMeli(files[i]);
        const fd = new FormData();
        fd.append('file', normalized, normalized.name);
        const res = await fetch('/api/meli/pictures', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { id: pictureId } = await res.json();
        setPhotos(prev => prev.map((p, j) => j === globalIdx ? { ...p, status: 'done', pictureId } : p));
      } catch (e) {
        setPhotos(prev => prev.map((p, j) => j === globalIdx ? { ...p, status: 'error', errorMsg: e.message } : p));
      }
    }
  }, [photos.length]);

  function removePhoto(idx) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  /* ── Publicar ── */
  async function publish() {
    setError(null);
    setSaving(true);
    try {
      const categoryId = CATEGORY_MAP[tipo]?.[operacion];
      if (!categoryId) throw new Error('Categoría no encontrada.');

      const attrs = [];
      if (rooms)       attrs.push({ id: 'ROOMS',              value_name: String(rooms) });
      if (bedrooms)    attrs.push({ id: 'BEDROOMS',           value_name: String(bedrooms) });
      if (bathrooms)   attrs.push({ id: 'FULL_BATHROOMS',     value_name: String(bathrooms) });
      if (parking !== '') attrs.push({ id: 'PARKING_LOTS',   value_name: String(parking || 0) });
      // number_unit: MELI espera "valor unidad" (ej: "120 m²")
      if (coveredArea) attrs.push({ id: 'COVERED_AREA',    value_name: `${coveredArea} m²` });
      if (totalArea)   attrs.push({ id: 'TOTAL_AREA',      value_name: `${totalArea} m²` });
      if (age)         attrs.push({ id: 'PROPERTY_AGE',    value_name: `${age} años` });
      if (expensas)    attrs.push({ id: 'MAINTENANCE_FEE', value_name: `${expensas} ARS` });
      // list attributes
      if (condition)   attrs.push({ id: 'PROPERTY_CONDITION', value_name: condition });
      if (disposition) attrs.push({ id: 'DISPOSITION',        value_name: disposition });
      if (facing)      attrs.push({ id: 'FACING',             value_name: facing });
      // number attributes adicionales
      if (warehouses)  attrs.push({ id: 'WAREHOUSES',   value_name: String(warehouses) });
      if (unitFloor)   attrs.push({ id: 'UNIT_FLOOR',   value_name: String(unitFloor) });
      // booleanos — MELI value "Sí" (con tilde)
      amenities.forEach(id => attrs.push({ id, value_name: 'Sí' }));

      const pictures = photos
        .filter(p => p.status === 'done' && p.pictureId)
        .map(p => ({ id: p.pictureId }));

      const payload = {
        title: title.trim(),
        category_id: categoryId,
        price: Number(price),
        currency_id: currency,
        listing_type_id: 'silver',
        location: {
          state: { id: stateId },
          city:  { id: cityId },
          ...(neighborhoodId ? { neighborhood: { id: neighborhoodId } } : {}),
        },
        attributes: attrs,
        pictures,
        description: description.trim() || undefined,
      };

      const res = await fetch('/api/meli/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.push(`/admin/propiedades/${data.item.id}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  /* ─── Render ──────────────────────────────────────────────────────────── */
  const isResidential = RESIDENTIAL.has(tipo);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Nueva publicación</h2>
          <p className={styles.pageSubtitle}>Publicar en MercadoLibre · Plan Silver</p>
        </div>
        <Link href="/admin/propiedades" className={styles.btnSecondary}>
          <Icon name="arrow-left" size={16} /> Volver
        </Link>
      </div>

      {/* ── Step indicator ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: 0 }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: s.n > step ? 0.35 : 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: s.n < step ? 'var(--admin-gold)' : s.n === step ? 'var(--admin-gold)' : 'rgba(255,255,255,0.08)',
                color: s.n <= step ? 'var(--navy-900, #0a1628)' : 'var(--gray-500)',
              }}>
                {s.n < step ? <Icon name="check" size={13} /> : s.n}
              </div>
              <span style={{ fontSize: '0.8rem', color: s.n === step ? 'var(--white)' : 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0.75rem' }} />
            )}
          </div>
        ))}
      </div>

      {/* ══════════════════ PASO 1 — Tipo y operación ══════════════════ */}
      {step === 1 && (
        <div className={styles.card} style={{ maxWidth: 680 }}>
          <h3 style={sectionTitle}>Tipo de propiedad</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '1.75rem' }}>
            {TIPOS.map(t => (
              <button key={t.key} onClick={() => { setTipo(t.key); setOperacion(''); }}
                style={{
                  padding: '0.75rem 0.5rem', borderRadius: '0.5rem', cursor: 'pointer',
                  background: tipo === t.key ? 'var(--admin-gold-15)' : 'rgba(255,255,255,0.04)',
                  border: tipo === t.key ? '1px solid var(--admin-gold-40)' : '1px solid rgba(255,255,255,0.08)',
                  color: tipo === t.key ? 'var(--admin-gold)' : 'var(--gray-300)',
                  fontWeight: tipo === t.key ? 600 : 400, fontSize: '0.8rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s',
                }}>
                <Icon name={t.icon} size={20} />
                {t.label}
              </button>
            ))}
          </div>

          {tipo && (
            <>
              <h3 style={sectionTitle}>Operación</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {OPS.filter(o => CATEGORY_MAP[tipo]?.[o.key]).map(o => (
                  <button key={o.key} onClick={() => setOperacion(o.key)}
                    style={{
                      padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer',
                      background: operacion === o.key ? 'var(--admin-gold)' : 'rgba(255,255,255,0.05)',
                      border: operacion === o.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: operacion === o.key ? 'var(--navy-900, #0a1628)' : 'var(--gray-300)',
                      fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s',
                    }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <NavBar step={step} canNext={canNext()} saving={saving} onPrev={goPrev} onNext={goNext} />
        </div>
      )}

      {/* ══════════════════ PASO 2 — Datos del inmueble ══════════════════ */}
      {step === 2 && (
        <div className={styles.card} style={{ maxWidth: 720 }}>

          {/* ─ Precio ─ */}
          <FormSection title="Precio">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Precio *</label>
                <input type="number" min="0" style={inp}
                  value={price} onChange={e => setPrice(e.target.value)} placeholder="Ej: 150000" />
              </div>
              <div>
                <label style={lbl}>Moneda</label>
                <select style={sel} value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="USD" style={opt}>USD (dólares)</option>
                  <option value="ARS" style={opt}>$ (pesos)</option>
                </select>
              </div>
            </div>
            {(operacion === 'alquiler' || operacion === 'temporario') && (
              <div style={{ marginTop: '0.75rem' }}>
                <label style={lbl}>Expensas mensuales (ARS, opcional)</label>
                <input type="number" min="0" style={inp}
                  value={expensas} onChange={e => setExpensas(e.target.value)} placeholder="Ej: 50000" />
              </div>
            )}
          </FormSection>

          {/* ─ Título ─ */}
          <FormSection title="Título de la publicación">
            <input style={inp} value={title}
              onChange={e => { setTitle(e.target.value); setTitleTouched(true); }}
              onBlur={() => !title.trim() && setTitleTouched(false)}
              placeholder="Ej: Casa en Venta · 3 amb · Palermo, Capital Federal"
              maxLength={200} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                Se genera automáticamente a medida que completás los datos
              </span>
              <span style={{ fontSize: '0.7rem', color: title.length > 180 ? '#f87171' : 'var(--gray-500)' }}>
                {title.length}/200
              </span>
            </div>
          </FormSection>

          {/* ─ Ubicación ─ */}
          <FormSection title="Ubicación">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Provincia *</label>
                <select style={sel} value={stateId}
                  onChange={e => onStateChange(e.target.value, e.target.options[e.target.selectedIndex].dataset.name || '')}>
                  <option value="" style={opt}>— Seleccioná una provincia —</option>
                  {(states || []).map(s => (
                    <option key={s.id} value={s.id} data-name={s.name} style={opt}>{s.name}</option>
                  ))}
                </select>
                {loadingLoc && !stateId && <span style={hint}>Cargando provincias...</span>}
              </div>

              {cities && (
                <div>
                  <label style={lbl}>Ciudad / Municipio *</label>
                  <select style={sel} value={cityId}
                    onChange={e => onCityChange(e.target.value, e.target.options[e.target.selectedIndex].dataset.name || '')}>
                    <option value="" style={opt}>— Seleccioná una ciudad —</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id} data-name={c.name} style={opt}>{c.name}</option>
                    ))}
                  </select>
                  {loadingLoc && cityId === '' && <span style={hint}>Cargando ciudades...</span>}
                </div>
              )}

              {neighborhoods && neighborhoods.length > 0 && (
                <div>
                  <label style={lbl}>Barrio (opcional)</label>
                  <select style={sel} value={neighborhoodId}
                    onChange={e => {
                      setNeighborhoodId(e.target.value);
                      setNeighborhoodName(e.target.options[e.target.selectedIndex].dataset.name || '');
                    }}>
                    <option value="" style={opt}>— Seleccioná un barrio —</option>
                    {neighborhoods.map(n => (
                      <option key={n.id} value={n.id} data-name={n.name} style={opt}>{n.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </FormSection>

          {/* ─ Superficies ─ */}
          <FormSection title="Superficies">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Superficie cubierta (m²)</label>
                <input type="number" min="1" style={inp}
                  value={coveredArea} onChange={e => setCoveredArea(e.target.value)} placeholder="Ej: 85" />
              </div>
              <div>
                <label style={lbl}>Superficie total (m²)</label>
                <input type="number" min="1" style={inp}
                  value={totalArea} onChange={e => setTotalArea(e.target.value)} placeholder="Ej: 100" />
              </div>
            </div>
          </FormSection>

          {/* ─ Características (solo residencial) ─ */}
          {isResidential && (
            <FormSection title="Características">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Ambientes</label>
                  <input type="number" min="1" max="20" style={inp}
                    value={rooms} onChange={e => setRooms(e.target.value)} placeholder="Ej: 3" />
                </div>
                <div>
                  <label style={lbl}>Dormitorios</label>
                  <input type="number" min="0" max="20" style={inp}
                    value={bedrooms} onChange={e => setBedrooms(e.target.value)} placeholder="Ej: 2" />
                </div>
                <div>
                  <label style={lbl}>Baños</label>
                  <input type="number" min="0" max="10" style={inp}
                    value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="Ej: 1" />
                </div>
                <div>
                  <label style={lbl}>Cocheras</label>
                  <input type="number" min="0" max="10" style={inp}
                    value={parking} onChange={e => setParking(e.target.value)} placeholder="Ej: 1" />
                </div>
              </div>
            </FormSection>
          )}

          {/* ─ Detalles adicionales ─ */}
          <FormSection title="Detalles adicionales">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Antigüedad (años)</label>
                <input type="number" min="0" style={inp}
                  value={age} onChange={e => setAge(e.target.value)} placeholder="0 = a estrenar" />
              </div>
              <div>
                <label style={lbl}>Estado del inmueble</label>
                <select style={sel} value={condition} onChange={e => setCondition(e.target.value)}>
                  {CONDITIONS.map(c => (
                    <option key={c.value} value={c.value} style={opt}>{c.label}</option>
                  ))}
                </select>
              </div>
              {(isResidential || tipo === 'oficina') && (
                <>
                  <div>
                    <label style={lbl}>Disposición</label>
                    <select style={sel} value={disposition} onChange={e => setDisposition(e.target.value)}>
                      {DISPOSITIONS.map(d => (
                        <option key={d.value} value={d.value} style={opt}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Orientación</label>
                    <select style={sel} value={facing} onChange={e => setFacing(e.target.value)}>
                      {FACINGS.map(f => (
                        <option key={f.value} value={f.value} style={opt}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label style={lbl}>Bauleras</label>
                <input type="number" min="0" max="10" style={inp}
                  value={warehouses} onChange={e => setWarehouses(e.target.value)} placeholder="0" />
              </div>
              {(tipo === 'departamento' || tipo === 'ph' || tipo === 'oficina') && (
                <div>
                  <label style={lbl}>Piso de la unidad</label>
                  <input type="number" min="1" max="99" style={inp}
                    value={unitFloor} onChange={e => setUnitFloor(e.target.value)} placeholder="Ej: 3" />
                </div>
              )}
            </div>
          </FormSection>

          {/* ─ Descripción ─ */}
          <FormSection title="Descripción">
            <textarea style={{ ...inp, minHeight: 130, resize: 'vertical' }}
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describí la propiedad: distribución, estado, entorno, servicios cercanos..." />
          </FormSection>

          {/* ─ Comodidades ─ */}
          <FormSection title="Comodidades">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              {AMENITIES.map(a => (
                <button key={a.id} type="button"
                  onClick={() => toggleAmenity(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer',
                    background: amenities.has(a.id) ? 'var(--admin-gold-15)' : 'rgba(255,255,255,0.04)',
                    border: amenities.has(a.id) ? '1px solid var(--admin-gold-40)' : '1px solid rgba(255,255,255,0.08)',
                    color: amenities.has(a.id) ? 'var(--admin-gold)' : 'var(--gray-400)',
                    fontSize: '0.8rem', fontWeight: amenities.has(a.id) ? 600 : 400,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '3px', flexShrink: 0,
                    background: amenities.has(a.id) ? 'var(--admin-gold)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {amenities.has(a.id) && <Icon name="check" size={10} style={{ color: '#0a1628' }} />}
                  </div>
                  {a.label}
                </button>
              ))}
            </div>
          </FormSection>

          <NavBar step={step} canNext={canNext()} saving={saving} onPrev={goPrev} onNext={goNext} />
        </div>
      )}

      {/* ══════════════════ PASO 3 — Fotos ══════════════════════════════ */}
      {step === 3 && (
        <div className={styles.card} style={{ maxWidth: 720 }}>
          <h3 style={sectionTitle}>Fotos de la propiedad</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
            La primera foto es la portada. Las fotos verticales se convierten a 4:3 automáticamente.
          </p>

          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--admin-gold)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '0.75rem', padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s',
              marginBottom: '1.25rem',
            }}
          >
            <Icon name="upload-cloud" size={30} style={{ color: 'var(--gray-500)' }} />
            <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem', margin: '0.75rem 0 0.25rem' }}>
              Arrastrá fotos acá o hacé click para seleccionar
            </p>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.75rem', margin: 0 }}>JPG, PNG · Máximo 24 fotos</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)} />
          </div>

          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem' }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: '0.375rem', overflow: 'hidden', aspectRatio: '4/3', background: 'rgba(255,255,255,0.05)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {p.status === 'uploading' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="loader" size={18} style={{ color: 'var(--admin-gold)', animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                  {p.status === 'done' && (
                    <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(34,197,94,0.9)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={11} style={{ color: '#fff' }} />
                    </div>
                  )}
                  {p.status === 'error' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="x-circle" size={18} style={{ color: '#fff' }} />
                    </div>
                  )}
                  {i === 0 && (
                    <div style={{ position: 'absolute', bottom: 3, left: 3, background: 'var(--admin-gold)', color: '#0a1628', fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.5px' }}>
                      PORTADA
                    </div>
                  )}
                  <button onClick={() => removePhoto(i)}
                    style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 0 }}>
                    <Icon name="x" size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <NavBar step={step} canNext={canNext()} saving={saving} onPrev={goPrev} onNext={goNext} />
        </div>
      )}

      {/* ══════════════════ PASO 4 — Revisión ════════════════════════════ */}
      {step === 4 && (
        <div className={styles.card} style={{ maxWidth: 720 }}>
          <h3 style={sectionTitle}>Revisión antes de publicar</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <ReviewRow label="Tipo" value={`${TIPOS.find(t => t.key === tipo)?.label} · ${OPS.find(o => o.key === operacion)?.label}`} />
            <ReviewRow label="Categoría MELI" value={CATEGORY_MAP[tipo]?.[operacion]} mono />
            <ReviewRow label="Título" value={title} />
            <ReviewRow label="Precio" value={`${currency} ${Number(price || 0).toLocaleString('es-AR')}${operacion !== 'venta' ? '/mes' : ''}`} />
            {expensas && <ReviewRow label="Expensas" value={`$ ${Number(expensas).toLocaleString('es-AR')}/mes`} />}
            <ReviewRow label="Ubicación" value={[neighborhoodName, cityName, stateName].filter(Boolean).join(', ')} />
            {coveredArea && <ReviewRow label="Sup. cubierta" value={`${coveredArea} m²`} />}
            {totalArea && <ReviewRow label="Sup. total" value={`${totalArea} m²`} />}
            {isResidential && rooms && <ReviewRow label="Ambientes" value={rooms} />}
            {isResidential && bedrooms && <ReviewRow label="Dormitorios" value={bedrooms} />}
            {isResidential && bathrooms && <ReviewRow label="Baños" value={bathrooms} />}
            {isResidential && parking && <ReviewRow label="Cocheras" value={parking} />}
            {age && <ReviewRow label="Antigüedad" value={`${age} años`} />}
            {condition && <ReviewRow label="Estado" value={condition} />}
            <ReviewRow label="Fotos" value={`${photos.filter(p => p.status === 'done').length} subidas`} />
            {amenities.size > 0 && (
              <ReviewRow label="Comodidades" value={AMENITIES.filter(a => amenities.has(a.id)).map(a => a.label).join(', ')} />
            )}
            <ReviewRow label="Plan" value="Silver / Plata" gold />
          </div>

          {error && (
            <div style={{ marginTop: '1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.85rem' }}>
              <strong>Error al publicar:</strong> {error}
            </div>
          )}

          <NavBar step={step} canNext={canNext()} saving={saving} onPrev={goPrev} onNext={goNext} publishLabel="Publicar en MercadoLibre" />
        </div>
      )}
    </>
  );
}

/* ─── Sub-componentes ────────────────────────────────────────────────────── */

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: '1.75rem', paddingBottom: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <h4 style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function ReviewRow({ label, value, mono, gold }) {
  return (
    <div style={{ display: 'flex', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ width: 140, flexShrink: 0, fontSize: '0.78rem', color: 'var(--gray-500)', paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: gold ? 'var(--admin-gold)' : 'var(--gray-200)', fontFamily: mono ? 'monospace' : undefined, fontWeight: gold ? 600 : 400 }}>
        {value || '—'}
      </span>
    </div>
  );
}

function NavBar({ step, canNext, saving, onPrev, onNext, publishLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={onPrev} disabled={step === 1 || saving}
        style={{ opacity: step === 1 ? 0 : 1, pointerEvents: step === 1 ? 'none' : 'auto' }}
        className="btn-secondary-inline">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'var(--gray-300)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
          ← Anterior
        </span>
      </button>

      <button onClick={onNext} disabled={!canNext || saving}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 1.25rem',
          background: !canNext || saving ? 'rgba(212,175,55,0.3)' : 'var(--admin-gold)',
          color: !canNext || saving ? 'rgba(255,255,255,0.4)' : 'var(--navy-900, #0a1628)',
          border: 'none', borderRadius: '0.5rem', cursor: !canNext || saving ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.15s',
        }}>
        {saving ? '⏳ Publicando...' : publishLabel || 'Siguiente →'}
      </button>
    </div>
  );
}

/* ─── Estilos ────────────────────────────────────────────────────────────── */
const sectionTitle = {
  color: 'var(--white)', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 600,
};

const lbl = {
  display: 'block', marginBottom: '0.375rem',
  fontSize: '0.75rem', color: 'var(--gray-400)',
  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px',
};

const inp = {
  width: '100%', padding: '0.625rem 0.875rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem', color: 'var(--white)',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

const sel = {
  ...inp,
  background: '#0d1f3c',
  cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.25rem',
};

const opt = { background: '#0d1f3c', color: '#e5e7eb' };

const hint = { fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem', display: 'block' };
