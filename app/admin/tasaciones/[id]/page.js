'use client';

// Detalle / editor de una tasación: junta la info de la propiedad y los
// comparables para armar la ficha. El valor lo define el tasador a mano.

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import Icon from '@/components/admin/Icon';
import AdminSelect from '@/components/admin/AdminSelect';
import AdminStepper from '@/components/admin/AdminStepper';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';
import { fetchTasacion } from '@/lib/admin-fetchers';
import {
  PRECIOS_ZONA, TIPOS, ESTADOS_CONSERVACION, AMENITIES,
  ESTADO_TASACION, formatUSD,
} from '@/lib/tasacion-engine';

const EMPTY_COMP = { direccion: '', tipo: '', m2: '', ambientes: '', precio: '', foto: '', fuente: '', link: '' };
const DESC_MAX = 600;

export default function TasacionDetalle() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR(id ? `tasacion-${id}` : null, () => fetchTasacion(id));

  const [form, setForm] = useState(null);
  const [token, setToken] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [amenityDraft, setAmenityDraft] = useState(''); // alta de amenitie custom

  // Comparables: alta manual + sugerencias del portfolio + link de ML
  const [newComp, setNewComp] = useState(EMPTY_COMP);
  const [suggests, setSuggests] = useState(null); // null = no cargado, [] = sin resultados
  const [loadingSug, setLoadingSug] = useState(false);
  const [sugError, setSugError] = useState('');
  const [meliUrl, setMeliUrl] = useState('');
  const [meliLoading, setMeliLoading] = useState(false);
  const [meliMsg, setMeliMsg] = useState(null); // { type: 'error'|'warn', text }

  useEffect(() => {
    if (!data || form) return;
    setToken(data.public_token || null);
    setForm({
      full_name: data.full_name || '', email: data.email || '', phone: data.phone || '',
      direccion: data.direccion || '', barrio: data.barrio || '',
      tipo_propiedad: data.tipo_propiedad || 'Departamento',
      zona: PRECIOS_ZONA[data.zona] ? data.zona : 'CABA - Otros',
      superficie_cubierta: data.superficie_cubierta ?? '', superficie_total: data.superficie_total ?? '',
      ambientes: data.ambientes ?? '', banos: data.banos ?? '',
      cochera: !!data.cochera, antiguedad: data.antiguedad ?? '',
      estado_conservacion: ESTADOS_CONSERVACION.includes(data.estado_conservacion) ? data.estado_conservacion : 'Bueno',
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      valor_estimado_usd: data.valor_estimado_usd ?? '',
      valor_min_usd: data.valor_min_usd ?? '',
      valor_max_usd: data.valor_max_usd ?? '',
      observaciones: data.observaciones || '',
      estado: data.estado || 'solicitada',
      comparables: Array.isArray(data.comparables) ? data.comparables : [],
    });
  }, [data, form]);

  if (isLoading || !form) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>Cargando tasación…</div>;
  }
  if (!data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>
        Tasación no encontrada. <Link href="/admin/tasaciones" style={{ color: 'var(--admin-gold)' }}>Volver</Link>
      </div>
    );
  }

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleAmenity = (a) => setForm(prev => ({
    ...prev,
    amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a],
  }));
  const removeAmenity = (a) => setForm(prev => ({
    ...prev, amenities: prev.amenities.filter(x => x !== a),
  }));
  const addCustomAmenity = () => {
    const a = amenityDraft.trim();
    if (!a) return;
    setAmenityDraft('');
    setForm(prev => {
      // evita duplicados (contra presets y los ya cargados, sin distinguir mayúsculas)
      const exists = [...Object.keys(AMENITIES), ...prev.amenities]
        .some(x => x.toLowerCase() === a.toLowerCase());
      return exists ? prev : { ...prev, amenities: [...prev.amenities, a] };
    });
  };

  const addComp = (comp) => {
    const c = {
      direccion: comp.direccion || '', tipo: comp.tipo || '',
      m2: comp.m2 ? Number(comp.m2) : null, ambientes: comp.ambientes ? Number(comp.ambientes) : null,
      precio: comp.precio ? Number(comp.precio) : null, foto: comp.foto || '',
      fuente: comp.fuente || '', link: comp.link || '',
    };
    setForm(prev => ({ ...prev, comparables: [...prev.comparables, c] }));
  };
  const removeComp = (i) => setForm(prev => ({ ...prev, comparables: prev.comparables.filter((_, idx) => idx !== i) }));
  // Edita un comparable ya cargado (ej: corregir el domicilio o el precio a mano).
  const updateComp = (i, patch) => setForm(prev => ({
    ...prev,
    comparables: prev.comparables.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
  }));

  const addFromMeliLink = async () => {
    const link = meliUrl.trim();
    if (!link) return;
    setMeliLoading(true); setMeliMsg(null);
    try {
      const res = await fetch(`/api/meli/comparable?url=${encodeURIComponent(link)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo traer la publicación');
      addComp(json.comparable);
      setMeliUrl('');
      if (!json.priceLoaded) {
        setMeliMsg({ type: 'warn', text: 'Cargada, pero la publicación está en pesos: completá el precio en USD a mano.' });
      }
    } catch (e) {
      setMeliMsg({ type: 'error', text: e.message || 'Error al traer la publicación' });
    } finally {
      setMeliLoading(false);
    }
  };

  const suggestFromPortfolio = async () => {
    setLoadingSug(true); setSugError(''); setSuggests(null);
    try {
      const res = await fetch('/api/meli/items?status=active&limit=50');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar el portfolio');
      const props = Array.isArray(json.properties) ? json.properties : [];
      // Solo precios en USD; priorizar mismo tipo.
      const usd = props.filter(p => p.currency === 'USD' && p.price > 0);
      const sameType = usd.filter(p => (p.type || '').toLowerCase() === (form.tipo_propiedad || '').toLowerCase());
      const list = (sameType.length ? sameType : usd).slice(0, 8).map(p => ({
        direccion: p.address || p.title, tipo: p.type || '',
        m2: p.coveredArea || p.totalArea || null, ambientes: p.bedrooms || null,
        precio: p.price || null, foto: Array.isArray(p.images) ? p.images[0] : '',
        fuente: 'Portfolio Cardoso',
      }));
      setSuggests(list);
    } catch (e) {
      setSugError(e.message || 'Error al cargar el portfolio');
      setSuggests([]);
    } finally {
      setLoadingSug(false);
    }
  };

  const save = async (overrideEstado) => {
    setSaving(true);
    let tk = token;
    if (!tk) { tk = crypto.randomUUID(); setToken(tk); }
    const estadoNext = overrideEstado
      || (['solicitada', 'en_proceso'].includes(form.estado) ? 'tasada' : form.estado);

    const payload = {
      full_name: form.full_name || null, email: form.email || null, phone: form.phone || null,
      direccion: form.direccion || null, barrio: form.barrio || null,
      tipo_propiedad: form.tipo_propiedad, zona: form.zona,
      superficie_cubierta: parseFloat(form.superficie_cubierta) || null,
      superficie_total: parseFloat(form.superficie_total) || null,
      ambientes: parseInt(form.ambientes, 10) || null,
      banos: parseInt(form.banos, 10) || null,
      cochera: !!form.cochera,
      antiguedad: parseInt(form.antiguedad, 10) || null,
      estado_conservacion: form.estado_conservacion,
      amenities: form.amenities,
      observaciones: form.observaciones || null,
      comparables: form.comparables,
      valor_estimado_usd: parseFloat(form.valor_estimado_usd) || null,
      valor_min_usd: parseFloat(form.valor_min_usd) || null,
      valor_max_usd: parseFloat(form.valor_max_usd) || null,
      estado: estadoNext,
      public_token: tk,
      updated_at: new Date().toISOString(),
      ...(overrideEstado === 'enviada' ? { sent_at: new Date().toISOString() } : {}),
    };

    const { error } = await supabase.from('tasaciones').update(payload).eq('id', id);
    setSaving(false);
    if (error) { setToast('Error al guardar: ' + error.message); return; }
    setForm(prev => ({ ...prev, estado: estadoNext }));
    mutate();
    setToast(overrideEstado === 'enviada' ? 'Marcada como enviada ✓' : 'Tasación guardada ✓');
    setTimeout(() => setToast(''), 3000);
  };

  const publicUrl = token && typeof window !== 'undefined' ? `${window.location.origin}/tasacion/${token}` : '';
  const copyLink = () => { if (publicUrl) { navigator.clipboard?.writeText(publicUrl); setToast('Link copiado ✓'); setTimeout(() => setToast(''), 2500); } };
  const waText = encodeURIComponent(`Hola ${form.full_name || ''}, te comparto la tasación de tu propiedad: ${publicUrl}`);
  const waPhone = (form.phone || '').replace(/[^\d]/g, '');
  const mailSubject = encodeURIComponent('Tu tasación — Cardoso Propiedades');
  const mailBody = encodeURIComponent(`Hola ${form.full_name || ''},\n\nTe compartimos la ficha de tasación de tu propiedad:\n${publicUrl}\n\nSaludos,\nCardoso Propiedades`);

  const estadoMeta = ESTADO_TASACION[form.estado] || ESTADO_TASACION.solicitada;

  return (
    <>
      <div className={styles.pageHeader} style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/tasaciones" className={styles.btnIcon} title="Volver" style={{ fontSize: '1.1rem', lineHeight: 1, textDecoration: 'none' }}>←</Link>
          <div>
            <h2 className={styles.pageTitle}>Tasación</h2>
            <p className={styles.pageSubtitle}>
              {form.full_name || 'Sin solicitante'} · <span className={`${styles.badge} ${styles[`badge${estadoMeta.color}`]}`}>{estadoMeta.label}</span>
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 50, background: 'var(--navy, #0d1b30)', color: '#fff', border: '1px solid var(--admin-gold-40)', padding: '0.7rem 1.1rem', borderRadius: 8, fontSize: '0.85rem', boxShadow: '0 8px 30px rgba(0,0,0,.35)' }}>{toast}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Columna izquierda: datos ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Solicitante */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', fontSize: '1rem', marginBottom: '1rem' }}>Solicitante</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre</label>
                <input className={styles.formInput} value={form.full_name} onChange={e => setField('full_name', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono</label>
                <input className={styles.formInput} value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} value={form.email} onChange={e => setField('email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Propiedad */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', fontSize: '1rem', marginBottom: '1rem' }}>Propiedad</h3>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Dirección</label>
                <input className={styles.formInput} value={form.direccion} onChange={e => setField('direccion', e.target.value)} placeholder="Calle y número" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Barrio (del cliente)</label>
                <input className={styles.formInput} value={form.barrio} onChange={e => setField('barrio', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Zona (referencia)</label>
                <AdminSelect value={form.zona} onChange={v => setField('zona', v)} options={Object.keys(PRECIOS_ZONA).map(z => ({ value: z, label: z }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo</label>
                <AdminSelect value={form.tipo_propiedad} onChange={v => setField('tipo_propiedad', v)} options={TIPOS.map(t => ({ value: t, label: t }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado de conservación</label>
                <AdminSelect value={form.estado_conservacion} onChange={v => setField('estado_conservacion', v)} options={ESTADOS_CONSERVACION.map(e => ({ value: e, label: e }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Superficie cubierta (m²)</label>
                <input className={styles.formInput} type="number" value={form.superficie_cubierta} onChange={e => setField('superficie_cubierta', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Superficie total (m²)</label>
                <input className={styles.formInput} type="number" value={form.superficie_total} onChange={e => setField('superficie_total', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ambientes</label>
                <AdminStepper value={form.ambientes} onChange={v => setField('ambientes', v)} min={0} ariaLabel="Ambientes" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Baños</label>
                <AdminStepper value={form.banos} onChange={v => setField('banos', v)} min={0} ariaLabel="Baños" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Antigüedad (años)</label>
                <input className={styles.formInput} type="number" value={form.antiguedad} onChange={e => setField('antiguedad', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cochera</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 38 }}>
                  <input type="checkbox" checked={form.cochera} onChange={e => setField('cochera', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--admin-gold)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-300)' }}>{form.cochera ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>

            <label className={styles.formLabel} style={{ marginTop: '1rem', display: 'block' }}>Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              {/* Presets: se seleccionan/deseleccionan con un click */}
              {Object.keys(AMENITIES).map(a => {
                const on = form.amenities.includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    style={{
                      padding: '0.4rem 0.7rem', borderRadius: 999, fontSize: '0.78rem', cursor: 'pointer',
                      border: `1px solid ${on ? 'var(--admin-gold)' : 'var(--admin-gold-20)'}`,
                      background: on ? 'var(--admin-gold)' : 'transparent',
                      color: on ? '#0a1628' : 'var(--gray-300)', fontWeight: on ? 700 : 500,
                    }}>
                    {a}
                  </button>
                );
              })}
              {/* Custom: exclusivos de esta tasación, siempre activos, con ✕ para quitar */}
              {form.amenities.filter(a => !AMENITIES[a]).map(a => (
                <span key={a}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.4rem 0.4rem 0.7rem', borderRadius: 999, fontSize: '0.78rem',
                    border: '1px solid var(--admin-gold)', background: 'var(--admin-gold)',
                    color: '#0a1628', fontWeight: 700,
                  }}>
                  {a}
                  <button type="button" onClick={() => removeAmenity(a)} aria-label={`Quitar ${a}`}
                    style={{
                      display: 'grid', placeItems: 'center', width: 16, height: 16, borderRadius: 999,
                      border: 'none', background: 'rgba(10,22,40,0.18)', color: '#0a1628', cursor: 'pointer',
                      fontSize: '0.7rem', lineHeight: 1, padding: 0,
                    }}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
            {/* Alta de amenitie exclusivo de esta propiedad */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <input
                className={styles.formInput}
                value={amenityDraft}
                onChange={e => setAmenityDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
                placeholder="Agregar amenitie exclusivo (ej: Cava de vinos, Rooftop…)"
                style={{ flex: 1 }}
              />
              <button type="button" className={styles.btnSecondary} onClick={addCustomAmenity}
                disabled={!amenityDraft.trim()} style={{ flexShrink: 0 }}>
                <Icon name="plus" size={14} /> Agregar
              </button>
            </div>
          </div>

          {/* Comparables */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem', gap: '1rem' }}>
              <div>
                <h3 style={{ color: 'var(--white)', fontSize: '1rem', margin: 0 }}>Comparables de mercado</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', margin: '0.25rem 0 0' }}>
                  Sugerí del portfolio propio o cargá a mano propiedades de la competencia / colegas. En la ficha se muestran las 3 primeras.
                </p>
              </div>
              <button className={styles.btnSecondary} onClick={suggestFromPortfolio} disabled={loadingSug} style={{ flexShrink: 0 }}>
                <Icon name="building" size={14} /> {loadingSug ? 'Buscando…' : 'Sugerir del portfolio'}
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: form.comparables.length >= 3 ? 'var(--admin-gold)' : 'var(--gray-500)', marginBottom: '0.9rem' }}>
              {form.comparables.length} cargado{form.comparables.length === 1 ? '' : 's'}{form.comparables.length >= 3 ? ' · suficiente para la ficha' : ` · recomendado: 3`}
            </div>

            {/* Pegar link de cualquier publicación de MercadoLibre */}
            <div style={{ background: 'var(--admin-gold-03)', border: '1px solid var(--admin-gold-20)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
              <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icon name="external-link" size={13} /> Traer desde un link de MercadoLibre
              </label>
              <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', margin: '0.2rem 0 0.5rem' }}>
                Pegá el link del aviso de cualquier vendedor; se carga solo con foto, precio y datos.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className={styles.formInput}
                  value={meliUrl}
                  onChange={e => { setMeliUrl(e.target.value); setMeliMsg(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFromMeliLink(); } }}
                  placeholder="https://articulo.mercadolibre.com.ar/MLA-…"
                />
                <button className={styles.btnSecondary} onClick={addFromMeliLink} disabled={meliLoading || !meliUrl.trim()} style={{ flexShrink: 0 }}>
                  {meliLoading ? 'Trayendo…' : <><Icon name="plus" size={14} /> Traer</>}
                </button>
              </div>
              {meliMsg && (
                <div style={{ fontSize: '0.72rem', marginTop: '0.5rem', color: meliMsg.type === 'error' ? '#f87171' : 'var(--admin-gold)' }}>
                  {meliMsg.text}
                </div>
              )}
            </div>

            {form.comparables.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {form.comparables.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <img
                      src={c.foto || '/comparable-ph.svg'} alt=""
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/comparable-ph.svg'; }}
                      style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#eef1f5' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Domicilio editable: se puede corregir el de ML o escribir uno a mano */}
                      <input
                        value={c.direccion || ''}
                        onChange={e => updateComp(i, { direccion: e.target.value })}
                        placeholder="Domicilio del comparable"
                        style={{
                          width: '100%', background: 'transparent', border: 'none', color: 'var(--white)',
                          fontSize: '0.85rem', fontFamily: 'inherit', padding: 0, outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-500)', fontSize: '0.72rem', marginTop: 2 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[c.tipo, c.m2 ? `${c.m2} m²` : null, c.ambientes ? `${c.ambientes} amb.` : null].filter(Boolean).join(' · ') || '—'}
                        </span>
                        <span style={{ color: 'var(--gray-600)' }}>·</span>
                        {/* Precio USD editable: para los avisos en pesos que hay que cargar a mano */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--admin-gold)' }}>
                          US$
                          <input
                            type="number" value={c.precio ?? ''}
                            onChange={e => updateComp(i, { precio: e.target.value === '' ? null : Number(e.target.value) })}
                            placeholder="precio"
                            style={{
                              width: 90, background: 'transparent', border: 'none', borderBottom: '1px dashed var(--admin-gold-20)',
                              color: 'var(--admin-gold)', fontSize: '0.72rem', fontFamily: 'inherit', padding: '0 2px', outline: 'none',
                            }}
                          />
                        </span>
                      </div>
                      {c.fuente && (
                        <div style={{ color: 'var(--admin-gold)', fontSize: '0.66rem', marginTop: 1 }}>
                          {c.link
                            ? <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)', textDecoration: 'none' }}>{c.fuente} ↗</a>
                            : c.fuente}
                        </div>
                      )}
                    </div>
                    <button className={styles.btnIcon} onClick={() => removeComp(i)} title="Quitar"><Icon name="x" size={13} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Sugerencias */}
            {suggests && (
              <div style={{ marginBottom: '1rem', border: '1px dashed var(--admin-gold-20)', borderRadius: 8, padding: '0.75rem' }}>
                {sugError && <div style={{ color: '#f87171', fontSize: '0.8rem' }}>{sugError}</div>}
                {!sugError && suggests.length === 0 && <div style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>No se encontraron publicaciones en USD en el portfolio.</div>}
                {suggests.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--gray-200)', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.direccion}</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>{[s.tipo, s.m2 ? `${s.m2} m²` : null, s.precio ? formatUSD(s.precio) : null].filter(Boolean).join(' · ')}</div>
                    </div>
                    <button className={styles.btnSecondary} onClick={() => addComp(s)}><Icon name="plus" size={13} /> Agregar</button>
                  </div>
                ))}
              </div>
            )}

            {/* Alta manual (incluye propiedades externas / de la competencia) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.9rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, marginBottom: '0.6rem' }}>Agregar comparable manual</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className={`${styles.formGroup} ${styles.formGridFull}`}><label className={styles.formLabel}>Dirección / título</label><input className={styles.formInput} value={newComp.direccion} onChange={e => setNewComp({ ...newComp, direccion: e.target.value })} placeholder="Av. Rivadavia 4500, 3° piso" /></div>
                <div className={styles.formGroup}><label className={styles.formLabel}>Tipo</label><input className={styles.formInput} value={newComp.tipo} onChange={e => setNewComp({ ...newComp, tipo: e.target.value })} placeholder="Departamento" /></div>
                <div className={styles.formGroup}><label className={styles.formLabel}>Fuente</label><input className={styles.formInput} value={newComp.fuente} onChange={e => setNewComp({ ...newComp, fuente: e.target.value })} placeholder="Zonaprop / colega / MercadoLibre" /></div>
                <div className={styles.formGroup}><label className={styles.formLabel}>m²</label><input className={styles.formInput} type="number" value={newComp.m2} onChange={e => setNewComp({ ...newComp, m2: e.target.value })} /></div>
                <div className={styles.formGroup}><label className={styles.formLabel}>Ambientes</label><input className={styles.formInput} type="number" value={newComp.ambientes} onChange={e => setNewComp({ ...newComp, ambientes: e.target.value })} /></div>
                <div className={styles.formGroup}><label className={styles.formLabel}>Precio USD</label><input className={styles.formInput} type="number" value={newComp.precio} onChange={e => setNewComp({ ...newComp, precio: e.target.value })} /></div>
                <div className={styles.formGroup}><label className={styles.formLabel}>Foto (URL)</label><input className={styles.formInput} value={newComp.foto} onChange={e => setNewComp({ ...newComp, foto: e.target.value })} placeholder="https://…" /></div>
                <div className={`${styles.formGroup} ${styles.formGridFull}`}><label className={styles.formLabel}>Link del aviso</label><input className={styles.formInput} value={newComp.link} onChange={e => setNewComp({ ...newComp, link: e.target.value })} placeholder="https://www.zonaprop.com.ar/… (o cualquier fuente)" /></div>
              </div>
              <button className={styles.btnSecondary} style={{ width: '100%', justifyContent: 'center', marginTop: '0.6rem' }} disabled={!newComp.direccion && !newComp.precio} onClick={() => { if (newComp.direccion || newComp.precio) { addComp(newComp); setNewComp(EMPTY_COMP); } }}>
                <Icon name="plus" size={14} /> Agregar comparable
              </button>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: valor (manual) + acciones ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: 16 }}>
          {/* Valor — lo define el tasador */}
          <div style={{ background: 'linear-gradient(135deg, var(--admin-gold-12), var(--admin-gold-03))', border: '1px solid var(--admin-gold-20)', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--admin-gold)', fontWeight: 700, textAlign: 'center', marginBottom: '0.9rem' }}>Valor de la tasación</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valor estimado (USD) *</label>
              <input className={styles.formInput} type="number" value={form.valor_estimado_usd} onChange={e => setField('valor_estimado_usd', e.target.value)} placeholder="Ej: 130000" style={{ fontSize: '1.15rem', fontWeight: 700 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mínimo (USD)</label>
                <input className={styles.formInput} type="number" value={form.valor_min_usd} onChange={e => setField('valor_min_usd', e.target.value)} placeholder="Opcional" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Máximo (USD)</label>
                <input className={styles.formInput} type="number" value={form.valor_max_usd} onChange={e => setField('valor_max_usd', e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.6rem', textAlign: 'center' }}>
              El valor lo definís vos según tu criterio profesional. El rango es opcional.
            </p>
          </div>

          {/* Descripción / fundamento de la tasación */}
          <div className={styles.card}>
            <label className={styles.formLabel}>Descripción de la tasación</label>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', margin: '0.2rem 0 0.5rem' }}>
              Fundamentá el valor: qué aspectos viste (ubicación, estado, luz, orientación, mejoras, comparables) que justifican el número. Se muestra en la ficha del cliente.
            </p>
            <textarea
              className={styles.formInput}
              rows={5}
              maxLength={DESC_MAX}
              value={form.observaciones}
              onChange={e => setField('observaciones', e.target.value.slice(0, DESC_MAX))}
              style={{ resize: 'vertical' }}
              placeholder="El valor se fundamenta en la excelente ubicación sobre…"
            />
            <div style={{ fontSize: '0.7rem', color: (form.observaciones?.length || 0) >= DESC_MAX ? 'var(--admin-gold)' : 'var(--gray-500)', textAlign: 'right', marginTop: '0.3rem' }}>
              {form.observaciones?.length || 0} / {DESC_MAX}
            </div>
          </div>

          {/* Estado */}
          <div className={styles.card}>
            <label className={styles.formLabel}>Estado</label>
            <AdminSelect value={form.estado} onChange={v => setField('estado', v)}
              options={Object.entries(ESTADO_TASACION).map(([value, m]) => ({ value, label: m.label }))} />
          </div>

          {/* Guardar + acciones */}
          <button className={styles.btnPrimary} onClick={() => save()} disabled={saving} style={{ justifyContent: 'center' }}>
            <Icon name="save" size={15} /> {saving ? 'Guardando…' : 'Guardar tasación'}
          </button>

          {token && form.valor_estimado_usd && (
            <div className={styles.card}>
              <h3 style={{ color: 'var(--white)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Ficha para el cliente</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input className={styles.formInput} readOnly value={publicUrl} style={{ fontSize: '0.75rem' }} />
                <button className={styles.btnSecondary} onClick={copyLink} title="Copiar"><Icon name="copy" size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <a className={styles.btnSecondary} href={publicUrl} target="_blank" rel="noreferrer" style={{ justifyContent: 'center' }}><Icon name="eye" size={14} /> Ver ficha</a>
                <a className={styles.btnSecondary} href={waPhone ? `https://wa.me/${waPhone}?text=${waText}` : `https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" style={{ justifyContent: 'center' }}><Icon name="whatsapp" size={14} /> WhatsApp</a>
                <a className={styles.btnSecondary} href={`mailto:${form.email || ''}?subject=${mailSubject}&body=${mailBody}`} style={{ justifyContent: 'center' }}><Icon name="message" size={14} /> Mail</a>
                <button className={styles.btnPrimary} onClick={() => save('enviada')} disabled={saving} style={{ justifyContent: 'center' }}><Icon name="check" size={14} /> Marcar enviada</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
