'use client';

// Detalle / editor de una tasación: datos, motor de cálculo, comparables,
// y generación del link público a la ficha branded.

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import Icon from '@/components/admin/Icon';
import AdminSelect from '@/components/admin/AdminSelect';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';
import { fetchTasacion } from '@/lib/admin-fetchers';
import {
  calcularTasacion, PRECIOS_ZONA, TIPOS, ESTADOS_CONSERVACION, AMENITIES,
  ESTADO_TASACION, formatUSD, formatPct,
} from '@/lib/tasacion-engine';

const EMPTY_COMP = { direccion: '', tipo: '', m2: '', ambientes: '', precio: '', foto: '' };

export default function TasacionDetalle() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR(id ? `tasacion-${id}` : null, () => fetchTasacion(id));

  const [form, setForm] = useState(null);
  const [token, setToken] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Comparables: alta manual + sugerencias del portfolio
  const [newComp, setNewComp] = useState(EMPTY_COMP);
  const [suggests, setSuggests] = useState(null); // null = no cargado, [] = sin resultados
  const [loadingSug, setLoadingSug] = useState(false);
  const [sugError, setSugError] = useState('');

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
      ajuste_manual: data.ajuste_manual ?? 0,
      observaciones: data.observaciones || '',
      estado: data.estado || 'solicitada',
      comparables: Array.isArray(data.comparables) ? data.comparables : [],
    });
  }, [data, form]);

  const resultado = useMemo(() => (form ? calcularTasacion(form) : null), [form]);

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

  const addComp = (comp) => {
    const c = {
      direccion: comp.direccion || '', tipo: comp.tipo || '',
      m2: comp.m2 ? Number(comp.m2) : null, ambientes: comp.ambientes ? Number(comp.ambientes) : null,
      precio: comp.precio ? Number(comp.precio) : null, foto: comp.foto || '',
    };
    setForm(prev => ({ ...prev, comparables: [...prev.comparables, c] }));
  };
  const removeComp = (i) => setForm(prev => ({ ...prev, comparables: prev.comparables.filter((_, idx) => idx !== i) }));

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
    const r = resultado;
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
      ajuste_manual: parseFloat(form.ajuste_manual) || 0,
      observaciones: form.observaciones || null,
      comparables: form.comparables,
      valor_estimado_usd: r?.valorUSD ?? null,
      valor_min_usd: r?.valorMin ?? null,
      valor_max_usd: r?.valorMax ?? null,
      precio_m2_usd: r?.precioM2 ?? null,
      factores: r?.factores ?? [],
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
                <label className={styles.formLabel}>Zona (para el cálculo) *</label>
                <AdminSelect value={form.zona} onChange={v => setField('zona', v)} options={Object.keys(PRECIOS_ZONA).map(z => ({ value: z, label: z }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo *</label>
                <AdminSelect value={form.tipo_propiedad} onChange={v => setField('tipo_propiedad', v)} options={TIPOS.map(t => ({ value: t, label: t }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado de conservación</label>
                <AdminSelect value={form.estado_conservacion} onChange={v => setField('estado_conservacion', v)} options={ESTADOS_CONSERVACION.map(e => ({ value: e, label: e }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Superficie cubierta (m²) *</label>
                <input className={styles.formInput} type="number" value={form.superficie_cubierta} onChange={e => setField('superficie_cubierta', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Superficie total (m²)</label>
                <input className={styles.formInput} type="number" value={form.superficie_total} onChange={e => setField('superficie_total', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ambientes</label>
                <input className={styles.formInput} type="number" value={form.ambientes} onChange={e => setField('ambientes', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Baños</label>
                <input className={styles.formInput} type="number" value={form.banos} onChange={e => setField('banos', e.target.value)} />
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
                    {a} <span style={{ opacity: 0.7 }}>+{Math.round(AMENITIES[a] * 100)}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparables */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--white)', fontSize: '1rem', margin: 0 }}>Comparables de mercado</h3>
              <button className={styles.btnSecondary} onClick={suggestFromPortfolio} disabled={loadingSug}>
                <Icon name="building" size={14} /> {loadingSug ? 'Buscando…' : 'Sugerir del portfolio'}
              </button>
            </div>

            {form.comparables.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {form.comparables.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--white)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.direccion || 'Comparable'}</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>
                        {[c.tipo, c.m2 ? `${c.m2} m²` : null, c.precio ? formatUSD(c.precio) : null].filter(Boolean).join(' · ')}
                      </div>
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

            {/* Alta manual */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Dirección</label><input className={styles.formInput} value={newComp.direccion} onChange={e => setNewComp({ ...newComp, direccion: e.target.value })} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>m²</label><input className={styles.formInput} type="number" value={newComp.m2} onChange={e => setNewComp({ ...newComp, m2: e.target.value })} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Precio USD</label><input className={styles.formInput} type="number" value={newComp.precio} onChange={e => setNewComp({ ...newComp, precio: e.target.value })} /></div>
              <button className={styles.btnSecondary} style={{ height: 38 }} onClick={() => { if (newComp.direccion || newComp.precio) { addComp(newComp); setNewComp(EMPTY_COMP); } }}><Icon name="plus" size={14} /></button>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: resultado + acciones ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: 16 }}>
          {/* Valor */}
          <div style={{ background: 'linear-gradient(135deg, var(--admin-gold-12), var(--admin-gold-03))', border: '1px solid var(--admin-gold-20)', borderRadius: '0.75rem', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--admin-gold)', fontWeight: 700 }}>Valor estimado</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>
              {resultado ? formatUSD(resultado.valorUSD) : '—'}
            </div>
            {resultado && <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>{formatUSD(resultado.precioM2)} / m²</div>}
            {resultado && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                <span>Mín: <b style={{ color: '#fff' }}>{formatUSD(resultado.valorMin)}</b></span>
                <span>Máx: <b style={{ color: '#fff' }}>{formatUSD(resultado.valorMax)}</b></span>
              </div>
            )}
            {!resultado && <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>Cargá la superficie cubierta para calcular.</div>}
          </div>

          {/* Ajuste manual + factores */}
          <div className={styles.card}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ajuste del tasador (%)</label>
              <input className={styles.formInput} type="number" step="1" value={form.ajuste_manual} onChange={e => setField('ajuste_manual', e.target.value)} placeholder="0" />
              <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.3rem' }}>Tu criterio profesional sobre el valor base calculado. Ej: -5 o 8.</p>
            </div>
            {resultado && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {resultado.factores.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--gray-400)' }}>{f.label}</span>
                    <span style={{ fontWeight: 700, color: f.kind === 'pct' ? (f.pct >= 0 ? '#4ade80' : '#f87171') : 'var(--white)' }}>
                      {f.kind === 'pct' ? formatPct(f.pct) : f.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className={styles.card}>
            <label className={styles.formLabel}>Observaciones (se muestran en la ficha)</label>
            <textarea className={styles.formInput} rows={3} value={form.observaciones} onChange={e => setField('observaciones', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          {/* Estado */}
          <div className={styles.card}>
            <label className={styles.formLabel}>Estado</label>
            <AdminSelect value={form.estado} onChange={v => setField('estado', v)}
              options={Object.entries(ESTADO_TASACION).map(([value, m]) => ({ value, label: m.label }))} />
          </div>

          {/* Guardar + acciones */}
          <button className={styles.btnPrimary} onClick={() => save()} disabled={saving || !resultado} style={{ justifyContent: 'center' }}>
            <Icon name="save" size={15} /> {saving ? 'Guardando…' : 'Guardar tasación'}
          </button>

          {token && resultado && (
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
