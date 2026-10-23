'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import GooglePlacePicker from '@/components/admin/GooglePlacePicker';
import styles from '@/components/admin/admin.module.css';

/* ─── Categorías MELI ─────────────────────────────────────────────────── */
/* Leafs verificados contra api.mercadolibre.com/categories/MLA1459 (árbol Inmuebles) */
const CATEGORY_MAP = {
  departamento:      { venta: 'MLA1474',   alquiler: 'MLA1473',   temporario: 'MLA50279' },
  casa:              { venta: 'MLA1468',   alquiler: 'MLA1467',   temporario: 'MLA50278' },
  camas_nauticas:    { venta: 'MLA374732', alquiler: 'MLA374731' },
  campo:             { venta: 'MLA6413',   alquiler: 'MLA6414' },
  cochera:           { venta: 'MLA50543',  alquiler: 'MLA50542' },
  consultorio:       { venta: 'MLA392267', alquiler: 'MLA392266' },
  deposito:          { venta: 'MLA1477',   alquiler: 'MLA1476' },
  fondo_comercio:    { venta: 'MLA50550',  alquiler: 'MLA50546' },
  local:             { venta: 'MLA79244',  alquiler: 'MLA79243' },
  oficina:           { venta: 'MLA50540',  alquiler: 'MLA50539' },
  otro:              { venta: 'MLA6396',   alquiler: 'MLA6395',   temporario: 'MLA50283' },
  ph:                { venta: 'MLA105182', alquiler: 'MLA105181', temporario: 'MLA105180' },
  parcelas:          { venta: 'MLA50548' },
  quinta:            { venta: 'MLA50551',  alquiler: 'MLA50549',  temporario: 'MLA52745' },
  terreno:           { venta: 'MLA1495',   alquiler: 'MLA1494' },
  tiempo_compartido: { venta: 'MLA50537',                        temporario: 'MLA52741' },
};

/* Orden y etiquetas idénticos a la lista de MELI. `label` = lista (plural), `singular` = auto-título. */
const TIPOS = [
  { key: 'departamento',      label: 'Departamentos',          singular: 'Departamento' },
  { key: 'casa',              label: 'Casas',                  singular: 'Casa' },
  { key: 'camas_nauticas',    label: 'Camas Náuticas',         singular: 'Cama Náutica' },
  { key: 'campo',             label: 'Campos',                 singular: 'Campo' },
  { key: 'cochera',           label: 'Cocheras',               singular: 'Cochera' },
  { key: 'consultorio',       label: 'Consultorios',           singular: 'Consultorio' },
  { key: 'deposito',          label: 'Depósitos y Galpones',   singular: 'Depósito / Galpón' },
  { key: 'fondo_comercio',    label: 'Fondo de Comercio',      singular: 'Fondo de Comercio' },
  { key: 'local',             label: 'Locales',                singular: 'Local' },
  { key: 'oficina',           label: 'Oficinas',               singular: 'Oficina' },
  { key: 'otro',              label: 'Otros Inmuebles',        singular: 'Inmueble' },
  { key: 'ph',                label: 'PH',                     singular: 'PH' },
  { key: 'parcelas',          label: 'Parcelas, Nichos y Bóvedas', singular: 'Parcela / Nicho / Bóveda' },
  { key: 'quinta',            label: 'Quintas',                singular: 'Quinta' },
  { key: 'terreno',           label: 'Terrenos y Lotes',       singular: 'Terreno / Lote' },
  { key: 'tiempo_compartido', label: 'Tiempo Compartido',      singular: 'Tiempo Compartido' },
];

/* Orden y nombres idénticos a MELI (hijos de cada categoría) */
const OPS = [
  { key: 'alquiler',   label: 'Alquiler' },
  { key: 'temporario', label: 'Alquiler Temporario' },
  { key: 'venta',      label: 'Venta' },
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

/* Pasos macro visibles (3, como MELI). El flujo interno `step` es más granular:
   macro 1 = step 1 · macro 2 = step 2 · macro 3 = steps 3-5. */
const STEPS = [
  { n: 1, label: 'Categoría' },
  { n: 2, label: 'Ubicación y fotos' },
  { n: 3, label: 'Detalles' },
];
const macroOf = (step) => (step <= 1 ? 1 : step === 2 ? 2 : 3);
const LAST_STEP = 4;

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

  /* — Paso 1 — sub-pantallas MELI: 'cat' → 'op' → 'confirm' */
  const [tipo, setTipo] = useState('');
  const [operacion, setOperacion] = useState('');
  const [catStep, setCatStep] = useState('cat');

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
  /* — Paso 2: dirección + geo (Google Maps) — */
  const [addressLine, setAddressLine] = useState('');
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [hideExact, setHideExact] = useState(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [zip, setZip] = useState('');
  const [geoMatchMsg, setGeoMatchMsg] = useState('');
  /* Paso 2: cards reveladas MELI → 'ubicacion' confirma y despliega 'fotos' */
  const [locStep, setLocStep] = useState('ubicacion');

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
    const tipoLabel = TIPOS.find(t => t.key === tipo)?.singular || '';
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

  /* ── Google Maps: dirección elegida o pin movido ── */
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  async function matchMeliLocation(provincia, ciudad) {
    if (!provincia) { setGeoMatchMsg(''); return; }
    setGeoMatchMsg('Resolviendo provincia y ciudad…');
    try {
      let st = states;
      if (!st) {
        const r = await fetch('/api/meli/locations?type=states');
        st = (await r.json()).states || [];
        setStates(st);
      }
      const p = norm(provincia);
      const isCABA = p.includes('ciudad autonoma') || p.includes('caba') || p.includes('capital federal');
      const match = st.find(s =>
        isCABA ? norm(s.name).includes('capital federal')
               : norm(s.name) === p || norm(s.name).includes(p) || p.includes(norm(s.name)));
      if (!match) { setGeoMatchMsg('No pudimos autodetectar la provincia. Seleccionala abajo.'); return; }
      setStateId(match.id); setStateName(match.name);
      setCityId(''); setCityName(''); setNeighborhoodId(''); setNeighborhoodName(''); setNeighborhoods(null);
      const rc = await fetch(`/api/meli/locations?type=cities&stateId=${encodeURIComponent(match.id)}`);
      const cs = (await rc.json()).cities || [];
      setCities(cs);
      if (ciudad) {
        const c = norm(ciudad);
        const cm = cs.find(x => norm(x.name) === c || norm(x.name).includes(c) || c.includes(norm(x.name)));
        if (cm) {
          setCityId(cm.id); setCityName(cm.name);
          const rn = await fetch(`/api/meli/locations?type=neighborhoods&cityId=${encodeURIComponent(cm.id)}`);
          setNeighborhoods((await rn.json()).neighborhoods || []);
          setGeoMatchMsg('');
          return;
        }
      }
      setGeoMatchMsg('Detectamos la provincia. Confirmá la ciudad abajo.');
    } catch {
      setGeoMatchMsg('No pudimos autodetectar la ubicación. Completala abajo.');
    }
  }

  function handlePick(d) {
    if (d.lat != null) setLat(d.lat);
    if (d.lng != null) setLng(d.lng);
    if (!('addressLine' in d)) return; // drag del pin: sólo coordenadas
    if (d.addressLine) setAddressLine(d.addressLine);
    if (d.zip) setZip(d.zip);
    setCalle(d.calle || '');
    setAltura(d.altura || '');
    setLocalidad(d.ciudad || '');
    matchMeliLocation(d.provincia, d.ciudad);
  }

  /* Dirección aproximada (rango de altura) cuando se oculta la exacta — como MELI */
  const rangoDireccion = useMemo(() => {
    const loc = cityName || localidad;
    const n = parseInt(altura, 10);
    if (calle && Number.isFinite(n)) {
      const base = Math.floor(n / 100) * 100;
      const low = Math.max(0, base - 200);
      const high = base + 100;
      return `${calle} ${low} - ${high}${loc ? `, ${loc}` : ''}`;
    }
    if (calle) return `${calle}${loc ? `, ${loc}` : ''}`;
    return addressLine;
  }, [calle, altura, localidad, cityName, addressLine]);

  /* ── Validación por step (flujo interno 1-5) ── */
  function canNext() {
    if (step === 3) return !!price && title.trim().length >= 10;
    if (step === 4) return true;
    return !!tipo && !!operacion;
  }

  function goNext() {
    if (step === LAST_STEP) { publish(); return; }
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

  /* ── Upload fotos ── (cada foto tiene uid estable: se actualiza por uid, no por índice) */
  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    const items = files.map(file => ({
      uid: (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      pictureId: null,
      errorMsg: null,
    }));
    setPhotos(prev => [...prev, ...items]);

    for (const it of items) {
      setPhotos(prev => prev.map(p => p.uid === it.uid ? { ...p, status: 'uploading' } : p));
      try {
        const normalized = await normalizeImageForMeli(it.file);
        const fd = new FormData();
        fd.append('file', normalized, normalized.name || 'foto.jpg');
        const res = await fetch('/api/meli/pictures', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        // Falla si no hay id: evita marcar "done" una foto que MELI no guardó.
        if (!res.ok || !data.id) throw new Error(data.error || `HTTP ${res.status} (sin id de MELI)`);
        setPhotos(prev => prev.map(p => p.uid === it.uid ? { ...p, status: 'done', pictureId: data.id } : p));
      } catch (e) {
        setPhotos(prev => prev.map(p => p.uid === it.uid ? { ...p, status: 'error', errorMsg: e.message } : p));
      }
    }
  }, []);

  function removePhoto(uid) {
    setPhotos(prev => {
      const tgt = prev.find(p => p.uid === uid);
      if (tgt) URL.revokeObjectURL(tgt.preview);
      return prev.filter(p => p.uid !== uid);
    });
  }

  function retryPhoto(uid) {
    const tgt = photos.find(p => p.uid === uid);
    if (tgt?.file) { removePhoto(uid); handleFiles([tgt.file]); }
  }

  /* Estado agregado de las fotos */
  const photosUploading = photos.some(p => p.status === 'pending' || p.status === 'uploading');
  const photosError = photos.filter(p => p.status === 'error');
  const photosDone = photos.filter(p => p.status === 'done' && p.pictureId);

  /* ── Publicar ── */
  async function publish() {
    setError(null);
    if (photosUploading) { setError('Esperá a que terminen de subir las fotos.'); return; }
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
          ...(addressLine ? { address_line: hideExact ? rangoDireccion : addressLine } : {}),
          ...(zip ? { zip_code: zip } : {}),
          ...(!hideExact && lat != null && lng != null ? { latitude: Number(lat), longitude: Number(lng) } : {}),
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

      {/* ── Step indicator (3 pasos macro, como MELI) ──────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: 0 }}>
        {STEPS.map((s, i) => {
          const macro = macroOf(step);
          return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: s.n > macro ? 0.35 : 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: s.n <= macro ? 'var(--admin-gold)' : 'rgba(255,255,255,0.08)',
                color: s.n <= macro ? 'var(--navy-900, #0a1628)' : 'var(--gray-500)',
              }}>
                {s.n < macro ? <Icon name="check" size={13} /> : s.n}
              </div>
              <span style={{ fontSize: '0.8rem', color: s.n === macro ? 'var(--white)' : 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0.75rem' }} />
            )}
          </div>
          );
        })}
      </div>

      {/* ══════════════════ PASO 1 — Empezá describiendo el inmueble ══════ */}
      {step === 1 && (
        <div className={styles.card} style={{ maxWidth: 680 }}>

          {/* ─ 1A · Categoría ─ */}
          {catStep === 'cat' && (
            <>
              <h3 style={sectionTitle}>¿A qué categoría pertenece?</h3>
              <div style={listWrap}>
                {TIPOS.map(t => (
                  <button key={t.key} type="button"
                    onClick={() => { setTipo(t.key); setOperacion(''); setCatStep('op'); }}
                    style={listRow(tipo === t.key)}>
                    <span style={{ paddingLeft: '0.25rem' }}>{t.label}</span>
                    <Icon name="chevron-right" size={18} style={{ color: 'var(--gray-500)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ─ 1B · Operación ─ */}
          {catStep === 'op' && (
            <>
              <h3 style={sectionTitle}>¿A qué categoría pertenece?</h3>
              <div style={listWrap}>
                {OPS.filter(o => CATEGORY_MAP[tipo]?.[o.key]).map(o => (
                  <button key={o.key} type="button"
                    onClick={() => { setOperacion(o.key); setCatStep('confirm'); }}
                    style={listRow(operacion === o.key)}>
                    <span style={{ paddingLeft: '0.25rem' }}>{o.label}</span>
                    <Icon name="chevron-right" size={18} style={{ color: 'var(--gray-500)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setCatStep('cat')} style={backLink}>← Anterior</button>
            </>
          )}

          {/* ─ 1C · Confirmación (breadcrumb MELI) ─ */}
          {catStep === 'confirm' && (
            <>
              <h3 style={sectionTitle}>Confirmá la categoría</h3>
              <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '1.1rem 1.25rem' }}>
                <div style={{ fontSize: '1rem', color: 'var(--white)', fontWeight: 600, marginBottom: '0.6rem' }}>
                  {OPS.find(o => o.key === operacion)?.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--admin-gold)' }}>
                  <span>Inmuebles</span>
                  <Icon name="chevron-right" size={12} style={{ color: 'var(--gray-500)' }} />
                  <span>{TIPOS.find(t => t.key === tipo)?.label}</span>
                  <Icon name="chevron-right" size={12} style={{ color: 'var(--gray-500)' }} />
                  <span>{OPS.find(o => o.key === operacion)?.label}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCatStep('cat')}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-gold)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  Cambiar categoría
                </button>
                <button type="button" onClick={() => setStep(2)}
                  style={{ padding: '0.55rem 1.5rem', background: 'var(--admin-gold)', color: 'var(--navy-900, #0a1628)', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Confirmar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════ PASO 2 — Ubicación → Fotos (cards reveladas) ══ */}
      {step === 2 && (
        <>
          {/* ─ Card Ubicación ─ */}
          <div className={styles.card} style={{ maxWidth: 720, marginBottom: '1.25rem' }}>
            {locStep === 'ubicacion' ? (
              <>
                <FormSection title="Ubicación">
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.82rem', margin: '-0.5rem 0 1rem' }}>
                    Ingresá la dirección del inmueble. Ésta se verá en la publicación.
                  </p>
                  <GooglePlacePicker onPick={handlePick} />
                  {addressLine && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--gray-300)' }}>
                      <Icon name="map-pin" size={13} style={{ color: 'var(--admin-gold)', verticalAlign: '-2px', marginRight: 4 }} />
                      {addressLine}
                    </div>
                  )}

                  {addressLine && (
                    <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '0.9rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={hideExact} onChange={e => setHideExact(e.target.checked)}
                        style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--admin-gold)', cursor: 'pointer', flexShrink: 0 }} />
                      <span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--gray-200)' }}>Ocultar dirección exacta</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>
                          {hideExact
                            ? <>Se mostrará: <strong style={{ color: 'var(--gray-300)', fontWeight: 600 }}>{rangoDireccion}</strong></>
                            : 'Se mostrará la dirección exacta en la publicación.'}
                        </span>
                      </span>
                    </label>
                  )}
                </FormSection>

                {/* Provincia/ciudad → IDs que MELI necesita (autocompletados desde la dirección) */}
                <FormSection title="Provincia y ciudad (para MercadoLibre)">
                  {geoMatchMsg && <p style={{ ...hint, marginTop: 0, marginBottom: '0.75rem' }}>{geoMatchMsg}</p>}
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

                <CardActions
                  onCancel={goPrev}
                  onConfirm={() => setLocStep('fotos')}
                  confirmEnabled={!!stateId && !!cityId}
                />
              </>
            ) : (
              /* Resumen colapsado al confirmar */
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    Ubicación
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="map-pin" size={14} style={{ color: 'var(--admin-gold)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(hideExact ? rangoDireccion : addressLine) || [neighborhoodName, cityName, stateName].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setLocStep('ubicacion')}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--gray-300)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', borderRadius: '0.4rem', padding: '0.35rem 0.8rem', flexShrink: 0 }}>
                  Editar
                </button>
              </div>
            )}
          </div>

          {/* ─ Card Fotos (se despliega al confirmar la ubicación) ─ */}
          {locStep === 'fotos' && (
            <div className={styles.card} style={{ maxWidth: 720 }}>
              <h3 style={sectionTitle}>Fotos de la propiedad</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
                Agregá hasta 24 fotos. La primera es la portada. Las verticales se convierten a 4:3 automáticamente.
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
                <Icon name="upload" size={30} style={{ color: 'var(--gray-500)' }} />
                <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem', margin: '0.75rem 0 0.25rem' }}>
                  Seleccioná o arrastrá los archivos aquí
                </p>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.75rem', margin: 0 }}>JPG, PNG o WEBP · mínimo 600×400 · hasta 10 MB</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleFiles(e.target.files)} />
              </div>

              {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem' }}>
                  {photos.map((p, i) => (
                    <div key={p.uid} style={{ position: 'relative', borderRadius: '0.375rem', overflow: 'hidden', aspectRatio: '4/3', background: 'rgba(255,255,255,0.05)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {p.status === 'uploading' && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="clock" size={18} style={{ color: 'var(--admin-gold)' }} />
                        </div>
                      )}
                      {p.status === 'done' && (
                        <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(34,197,94,0.9)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="check" size={11} style={{ color: '#fff' }} />
                        </div>
                      )}
                      {p.status === 'error' && (
                        <button type="button" onClick={() => retryPhoto(p.uid)} title={p.errorMsg || 'Error'}
                          style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.55)', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#fff' }}>
                          <Icon name="upload" size={16} style={{ color: '#fff' }} />
                          <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>Reintentar</span>
                        </button>
                      )}
                      {i === 0 && p.status === 'done' && (
                        <div style={{ position: 'absolute', bottom: 3, left: 3, background: 'var(--admin-gold)', color: '#0a1628', fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.5px' }}>
                          PORTADA
                        </div>
                      )}
                      <button onClick={() => removePhoto(p.uid)}
                        style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 0 }}>
                        <Icon name="x" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Estado de subida */}
              {(photosUploading || photosError.length > 0 || photosDone.length > 0) && (
                <div style={{ marginTop: '0.9rem', fontSize: '0.78rem' }}>
                  {photosUploading && <span style={{ color: 'var(--admin-gold)' }}>Subiendo fotos… no cierres esta pantalla.</span>}
                  {!photosUploading && photosError.length > 0 && (
                    <span style={{ color: '#f87171' }}>
                      {photosError.length} foto{photosError.length > 1 ? 's' : ''} con error. Tocá «Reintentar» sobre la foto en rojo.
                    </span>
                  )}
                  {!photosUploading && photosError.length === 0 && photosDone.length > 0 && (
                    <span style={{ color: '#4ade80' }}>{photosDone.length} foto{photosDone.length > 1 ? 's' : ''} lista{photosDone.length > 1 ? 's' : ''} ✓</span>
                  )}
                </div>
              )}

              <CardActions
                onCancel={() => setLocStep('ubicacion')}
                onConfirm={() => { setError(null); setStep(3); }}
                confirmEnabled={!photosUploading}
              />
            </div>
          )}
        </>
      )}

      {/* ══════════════════ PASO 3 — Datos del inmueble ══════════════════ */}
      {step === 3 && (
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

      {/* ══════════════════ PASO 3 (final) — Revisión ════════════════════ */}
      {step === 4 && (
        <div className={styles.card} style={{ maxWidth: 720 }}>
          <h3 style={sectionTitle}>Revisión antes de publicar</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <ReviewRow label="Tipo" value={`${TIPOS.find(t => t.key === tipo)?.label} · ${OPS.find(o => o.key === operacion)?.label}`} />
            <ReviewRow label="Categoría MELI" value={CATEGORY_MAP[tipo]?.[operacion]} mono />
            <ReviewRow label="Título" value={title} />
            <ReviewRow label="Precio" value={`${currency} ${Number(price || 0).toLocaleString('es-AR')}${operacion !== 'venta' ? '/mes' : ''}`} />
            {expensas && <ReviewRow label="Expensas" value={`$ ${Number(expensas).toLocaleString('es-AR')}/mes`} />}
            {addressLine && <ReviewRow label="Dirección" value={hideExact ? rangoDireccion : addressLine} />}
            {hideExact && <ReviewRow label="Dirección exacta" value="Oculta (se publica rango)" />}
            <ReviewRow label="Ubicación" value={[neighborhoodName, cityName, stateName].filter(Boolean).join(', ')} />
            {!hideExact && lat != null && lng != null && <ReviewRow label="Coordenadas" value={`${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`} mono />}
            {coveredArea && <ReviewRow label="Sup. cubierta" value={`${coveredArea} m²`} />}
            {totalArea && <ReviewRow label="Sup. total" value={`${totalArea} m²`} />}
            {isResidential && rooms && <ReviewRow label="Ambientes" value={rooms} />}
            {isResidential && bedrooms && <ReviewRow label="Dormitorios" value={bedrooms} />}
            {isResidential && bathrooms && <ReviewRow label="Baños" value={bathrooms} />}
            {isResidential && parking && <ReviewRow label="Cocheras" value={parking} />}
            {age && <ReviewRow label="Antigüedad" value={`${age} años`} />}
            {condition && <ReviewRow label="Estado" value={condition} />}
            <ReviewRow label="Fotos"
              value={`${photosDone.length} lista${photosDone.length === 1 ? '' : 's'}`
                + (photosUploading ? ' · subiendo…' : '')
                + (photosError.length ? ` · ${photosError.length} con error` : '')
                + (photosDone.length === 0 ? '  ⚠ se publicará sin fotos' : '')}
              gold={photosDone.length === 0} />
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

function CardActions({ onCancel, cancelLabel = 'Cancelar', onConfirm, confirmLabel = 'Confirmar', confirmEnabled = true }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button type="button" onClick={onCancel}
        style={{ background: 'none', border: 'none', color: 'var(--gray-300)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
        {cancelLabel}
      </button>
      <button type="button" onClick={onConfirm} disabled={!confirmEnabled}
        style={{
          padding: '0.55rem 1.5rem', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem',
          background: confirmEnabled ? 'var(--admin-gold)' : 'rgba(212,175,55,0.3)',
          color: confirmEnabled ? 'var(--navy-900, #0a1628)' : 'rgba(255,255,255,0.4)',
          cursor: confirmEnabled ? 'pointer' : 'not-allowed',
        }}>
        {confirmLabel}
      </button>
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

/* Lista vertical estilo MELI (filas texto + chevron) */
const listWrap = {
  display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.06)',
};
const listRow = (selected) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  width: '100%', padding: '0.9rem 0.25rem', cursor: 'pointer', textAlign: 'left',
  background: selected ? 'var(--admin-gold-15)' : 'transparent',
  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
  color: selected ? 'var(--admin-gold)' : 'var(--gray-200)',
  fontWeight: selected ? 600 : 400, fontSize: '0.95rem', transition: 'background 0.12s',
});
const backLink = {
  marginTop: '1.25rem', background: 'none', border: 'none',
  color: 'var(--gray-300)', fontSize: '0.8rem', cursor: 'pointer', padding: 0,
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
