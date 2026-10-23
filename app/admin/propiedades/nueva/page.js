'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

/* ── Categorías MELI ── */
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
  { key: 'casa',         label: 'Casa',             icon: 'home' },
  { key: 'departamento', label: 'Departamento',      icon: 'building' },
  { key: 'ph',           label: 'PH',                icon: 'layers' },
  { key: 'local',        label: 'Local Comercial',   icon: 'store' },
  { key: 'oficina',      label: 'Oficina',           icon: 'briefcase' },
  { key: 'cochera',      label: 'Cochera',           icon: 'car' },
  { key: 'deposito',     label: 'Depósito/Galpón',   icon: 'package' },
  { key: 'campo',        label: 'Campo',             icon: 'map' },
  { key: 'quinta',       label: 'Quinta',            icon: 'tree' },
  { key: 'otro',         label: 'Otro',              icon: 'more-horizontal' },
];

const OPS = [
  { key: 'venta',      label: 'Venta' },
  { key: 'alquiler',   label: 'Alquiler' },
  { key: 'temporario', label: 'Alquiler temporario' },
];

const RESIDENTIAL = ['casa', 'departamento', 'ph', 'quinta'];

/* ── Normalización 4:3 (canvas) ── */
function normalizeImageForMeli(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const isPortrait = img.height > img.width;
      if (!isPortrait) { resolve(file); return; }
      const W = Math.max(img.width, img.height * 4 / 3);
      const H = W * 3 / 4;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      const x = (W - img.width) / 2;
      const y = (H - img.height) / 2;
      ctx.drawImage(img, x, y, img.width, img.height);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function generateTitle(tipo, op, neighborhood, city, state) {
  const tipoLabel = TIPOS.find(t => t.key === tipo)?.label || '';
  const opLabel = op === 'venta' ? 'en Venta' : op === 'temporario' ? 'en Alquiler Temporario' : 'en Alquiler';
  const loc = [neighborhood, city, state].filter(Boolean).join(', ');
  return `${tipoLabel} ${opLabel}${loc ? ' en ' + loc : ''}`;
}

/* ── Steps ── */
const STEPS = ['Tipo', 'Ubicación', 'Detalles', 'Fotos', 'Publicar'];

/* ── Componente principal ── */
export default function NuevaPublicacion() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 — tipo + operación
  const [tipo, setTipo] = useState('');
  const [operacion, setOperacion] = useState('');

  // Step 2 — ubicación
  const [states, setStates] = useState(null);
  const [cities, setCities] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState(null);
  const [stateId, setStateId] = useState('');
  const [stateName, setStateName] = useState('');
  const [cityId, setCityId] = useState('');
  const [cityName, setCityName] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [loadingLoc, setLoadingLoc] = useState(false);

  // Step 3 — detalles
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [coveredArea, setCoveredArea] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [parking, setParking] = useState('');

  // Step 4 — fotos
  const [photos, setPhotos] = useState([]); // [{ file, preview, status, pictureId }]
  const [dragging, setDragging] = useState(false);

  // Step 5 — título + descripción
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  /* Carga provincias al llegar al step 1 */
  useEffect(() => {
    if (step === 1 && !states) loadStates();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Navegación ── */
  function canNext() {
    if (step === 0) return !!tipo && !!operacion;
    if (step === 1) return !!stateId && !!cityId;
    if (step === 2) return !!price;
    if (step === 3) return true;
    return false;
  }

  function goNext() {
    if (step === 4) { publish(); return; }
    if (step === 3) {
      // Al llegar al step 5 auto-genero el título
      setTitle(prev => prev || generateTitle(tipo, operacion, neighborhoodName, cityName, stateName));
    }
    setStep(s => s + 1);
  }

  function goPrev() { setStep(s => s - 1); }

  /* ── Locations lazy load ── */
  async function loadStates() {
    setLoadingLoc(true);
    try {
      const res = await fetch('/api/meli/locations?type=states');
      const data = await res.json();
      setStates(data.states || []);
    } finally { setLoadingLoc(false); }
  }

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

  /* ── Fotos ── */
  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      pictureId: null,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const idx = photos.length + i;

      setPhotos(prev => prev.map((p, j) => j === idx ? { ...p, status: 'uploading' } : p));

      try {
        const normalized = await normalizeImageForMeli(file);
        const fd = new FormData();
        fd.append('file', normalized, normalized.name);

        const res = await fetch('/api/meli/pictures', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const pictureId = data.id;

        setPhotos(prev => prev.map((p, j) =>
          j === idx ? { ...p, status: 'done', pictureId } : p
        ));
      } catch (e) {
        setPhotos(prev => prev.map((p, j) =>
          j === idx ? { ...p, status: 'error', errorMsg: e.message } : p
        ));
      }
    }
  }, [photos.length]);

  function removePhoto(idx) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  /* ── Publish ── */
  async function publish() {
    setError(null);
    setSaving(true);

    try {
      const categoryId = CATEGORY_MAP[tipo]?.[operacion];
      if (!categoryId) throw new Error('Categoría no encontrada para ese tipo y operación.');

      const attributes = [];
      if (RESIDENTIAL.includes(tipo)) {
        if (rooms)    attributes.push({ id: 'ROOMS',           value_name: String(rooms) });
        if (bedrooms) attributes.push({ id: 'BEDROOMS',        value_name: String(bedrooms) });
        if (bathrooms) attributes.push({ id: 'FULL_BATHROOMS', value_name: String(bathrooms) });
        if (parking)  attributes.push({ id: 'PARKING_LOTS',    value_name: String(parking) });
      }
      if (coveredArea) attributes.push({ id: 'COVERED_AREA', value_name: String(coveredArea) });
      if (totalArea)   attributes.push({ id: 'TOTAL_AREA',   value_name: String(totalArea) });

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
          state:        { id: stateId },
          city:         { id: cityId },
          ...(neighborhoodId ? { neighborhood: { id: neighborhoodId } } : {}),
        },
        attributes,
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

      // Redirigir al editor de la publicación recién creada
      router.push(`/admin/propiedades/${data.item.id}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  /* ── Render ── */
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Nueva publicación</h2>
          <p className={styles.pageSubtitle}>Publicar en MercadoLibre</p>
        </div>
        <Link href="/admin/propiedades" className={styles.btnSecondary}>
          <Icon name="arrow-left" size={16} />
          Volver
        </Link>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '2rem' }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              opacity: i > step ? 0.35 : 1,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                background: i < step ? 'var(--admin-gold)' : i === step ? 'var(--admin-gold)' : 'rgba(255,255,255,0.08)',
                color: i <= step ? 'var(--navy-900, #0a1628)' : 'var(--gray-500)',
                flexShrink: 0,
              }}>
                {i < step ? <Icon name="check" size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: '0.8rem', color: i === step ? 'var(--white)' : 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0.75rem' }} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.card} style={{ maxWidth: 720 }}>
        {/* ── STEP 0: Tipo + Operación ── */}
        {step === 0 && (
          <div>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>
              Tipo de propiedad
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1.75rem' }}>
              {TIPOS.map(t => (
                <button key={t.key} onClick={() => { setTipo(t.key); setOperacion(''); }}
                  style={{
                    padding: '0.75rem 0.5rem', background: tipo === t.key ? 'var(--admin-gold-15)' : 'rgba(255,255,255,0.04)',
                    border: tipo === t.key ? '1px solid var(--admin-gold-40)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.5rem', color: tipo === t.key ? 'var(--admin-gold)' : 'var(--gray-300)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: tipo === t.key ? 600 : 400,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s',
                  }}>
                  <Icon name={t.icon} size={20} />
                  {t.label}
                </button>
              ))}
            </div>

            {tipo && (
              <>
                <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                  Operación
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {OPS.filter(o => CATEGORY_MAP[tipo]?.[o.key]).map(o => (
                    <button key={o.key} onClick={() => setOperacion(o.key)}
                      style={{
                        padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer',
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
          </div>
        )}

        {/* ── STEP 1: Ubicación ── */}
        {step === 1 && (
          <div>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>
              Ubicación
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Provincia *</label>
                <select style={selectStyle}
                  value={stateId}
                  onChange={e => {
                    const opt = e.target.options[e.target.selectedIndex];
                    onStateChange(e.target.value, opt.dataset.name || '');
                  }}
                  onClick={() => { if (!states) loadStates(); }}
                >
                  <option value="" style={optStyle}>— Seleccionar provincia —</option>
                  {(states || []).map(s => (
                    <option key={s.id} value={s.id} data-name={s.name} style={optStyle}>{s.name}</option>
                  ))}
                </select>
                {loadingLoc && <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem', display: 'block' }}>Cargando...</span>}
              </div>

              {cities && (
                <div>
                  <label style={labelStyle}>Ciudad *</label>
                  <select style={selectStyle}
                    value={cityId}
                    onChange={e => {
                      const opt = e.target.options[e.target.selectedIndex];
                      onCityChange(e.target.value, opt.dataset.name || '');
                    }}
                  >
                    <option value="" style={optStyle}>— Seleccionar ciudad —</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id} data-name={c.name} style={optStyle}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {neighborhoods && neighborhoods.length > 0 && (
                <div>
                  <label style={labelStyle}>Barrio (opcional)</label>
                  <select style={selectStyle}
                    value={neighborhoodId}
                    onChange={e => {
                      const opt = e.target.options[e.target.selectedIndex];
                      setNeighborhoodId(e.target.value);
                      setNeighborhoodName(opt.dataset.name || '');
                    }}
                  >
                    <option value="" style={optStyle}>— Seleccionar barrio —</option>
                    {neighborhoods.map(n => (
                      <option key={n.id} value={n.id} data-name={n.name} style={optStyle}>{n.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Detalles ── */}
        {step === 2 && (
          <div>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>
              Precio y características
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Precio *</label>
                <input type="number" min="0" style={inputStyle}
                  value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="150000" />
              </div>
              <div>
                <label style={labelStyle}>Moneda</label>
                <select style={selectStyle} value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="USD" style={optStyle}>USD</option>
                  <option value="ARS" style={optStyle}>ARS $</option>
                </select>
              </div>

              {RESIDENTIAL.includes(tipo) && (
                <>
                  <div>
                    <label style={labelStyle}>Ambientes (ROOMS)</label>
                    <input type="number" min="1" max="20" style={inputStyle}
                      value={rooms} onChange={e => setRooms(e.target.value)} placeholder="3" />
                  </div>
                  <div>
                    <label style={labelStyle}>Dormitorios</label>
                    <input type="number" min="0" max="20" style={inputStyle}
                      value={bedrooms} onChange={e => setBedrooms(e.target.value)} placeholder="2" />
                  </div>
                  <div>
                    <label style={labelStyle}>Baños</label>
                    <input type="number" min="0" max="10" style={inputStyle}
                      value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="1" />
                  </div>
                  <div>
                    <label style={labelStyle}>Cocheras</label>
                    <input type="number" min="0" max="10" style={inputStyle}
                      value={parking} onChange={e => setParking(e.target.value)} placeholder="1" />
                  </div>
                </>
              )}

              <div>
                <label style={labelStyle}>M² cubiertos</label>
                <input type="number" min="1" style={inputStyle}
                  value={coveredArea} onChange={e => setCoveredArea(e.target.value)} placeholder="80" />
              </div>
              <div>
                <label style={labelStyle}>M² totales</label>
                <input type="number" min="1" style={inputStyle}
                  value={totalArea} onChange={e => setTotalArea(e.target.value)} placeholder="100" />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Fotos ── */}
        {step === 3 && (
          <div>
            <h3 style={{ color: 'var(--white)', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              Fotos
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              Las fotos verticales se convierten a 4:3 automáticamente. Podés publicar sin fotos y agregarlas después.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--admin-gold)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'var(--admin-gold-05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s', marginBottom: '1.25rem',
              }}
            >
              <Icon name="upload-cloud" size={28} style={{ color: 'var(--gray-500)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
                Arrastrá fotos acá o hacé click para seleccionar
              </p>
              <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)} />
            </div>

            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: '0.375rem', overflow: 'hidden', aspectRatio: '4/3', background: 'rgba(255,255,255,0.05)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                    {/* overlay status */}
                    {p.status === 'uploading' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="loader" size={18} style={{ color: 'var(--admin-gold)', animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                    {p.status === 'done' && (
                      <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(34,197,94,0.85)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={11} style={{ color: '#fff' }} />
                      </div>
                    )}
                    {p.status === 'error' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="x-circle" size={18} style={{ color: '#fff' }} />
                      </div>
                    )}
                    {i === 0 && <div style={{ position: 'absolute', bottom: 3, left: 3, background: 'var(--admin-gold)', color: '#0a1628', fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>PORTADA</div>}
                    <button onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 2, left: 2, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 0 }}>
                      <Icon name="x" size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Publicar ── */}
        {step === 4 && (
          <div>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>
              Título y descripción
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Título *</label>
                <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Casa en Venta en Palermo, Capital Federal" maxLength={60} />
                <span style={{ fontSize: '0.7rem', color: title.length > 50 ? '#f87171' : 'var(--gray-500)', display: 'block', marginTop: '0.25rem' }}>
                  {title.length}/60 caracteres
                </span>
              </div>
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describí la propiedad: comodidades, estado, entorno, etc." />
              </div>

              {/* Resumen */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.8rem', color: 'var(--gray-400)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--gray-300)', display: 'block', marginBottom: '0.5rem' }}>Resumen</strong>
                <span>Tipo: <b style={{ color: 'var(--white)' }}>{TIPOS.find(t => t.key === tipo)?.label}</b></span><br />
                <span>Operación: <b style={{ color: 'var(--white)' }}>{OPS.find(o => o.key === operacion)?.label}</b></span><br />
                <span>Ubicación: <b style={{ color: 'var(--white)' }}>{[neighborhoodName, cityName, stateName].filter(Boolean).join(', ')}</b></span><br />
                <span>Precio: <b style={{ color: 'var(--white)' }}>{currency} {Number(price || 0).toLocaleString('es-AR')}</b></span><br />
                <span>Fotos: <b style={{ color: 'var(--white)' }}>{photos.filter(p => p.status === 'done').length} subidas</b></span><br />
                <span>Plan: <b style={{ color: 'var(--admin-gold)' }}>Silver / Plata</b></span>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Navegación ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={goPrev} disabled={step === 0 || saving}
            className={styles.btnSecondary} style={{ opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}>
            <Icon name="arrow-left" size={15} /> Anterior
          </button>

          <button onClick={goNext} disabled={!canNext() || saving} className={styles.btnPrimary}>
            {saving ? (
              <><Icon name="loader" size={15} /> Publicando...</>
            ) : step === 4 ? (
              <><Icon name="send" size={15} /> Publicar en MercadoLibre</>
            ) : (
              <>Siguiente <Icon name="arrow-right" size={15} /></>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Estilos inline reutilizables ── */
const labelStyle = {
  display: 'block', marginBottom: '0.375rem',
  fontSize: '0.78rem', color: 'var(--gray-400)',
  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px',
};

const inputStyle = {
  width: '100%', padding: '0.625rem 0.875rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem', color: 'var(--white)',
  fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  background: '#0d1f3c', // sólido — evita que el dropdown nativo quede blanco
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2.25rem',
};

const optStyle = { background: '#0d1f3c', color: '#e5e7eb' };
