'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';
import { fetchMeliVisits } from '@/lib/admin-fetchers';

const EMPTY = {
  title: '', price: '', currency: 'USD', status: 'active',
  description: '', bedrooms: '', bathrooms: '', garages: '',
  totalArea: '', coveredArea: '', videoUrl: '',
};

function extractYouTubeId(url) {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : url.replace(/^https?:\/\/(www\.)?youtube\.com\/.*v=/, '').split('&')[0].slice(0, 11);
}

export default function AdminPropertyEdit() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [prop, setProp] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [pictures, setPictures] = useState([]); // [{id, url}]
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]); // [{file, status, error}]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/meli/items?id=${id}`)
      .then(r => r.json())
      .then(data => {
        const p = data.property;
        if (p) {
          setProp(p);
          setPictures(p.pictureIds || []);
          setForm({
            title: p.title || '',
            price: p.price || '',
            currency: p.currency === '$' ? 'ARS' : 'USD',
            status: p.status || 'active',
            description: p.description === 'Sin descripción disponible.' ? '' : (p.description || ''),
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            garages: p.garages ?? '',
            totalArea: p.totalArea || '',
            coveredArea: p.coveredArea || '',
            videoUrl: p.videoId ? `https://www.youtube.com/watch?v=${p.videoId}` : '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const [visitPeriod, setVisitPeriod] = useState(7);
  const { data: visitData } = useSWR(
    id ? ['meli-visits', id, visitPeriod] : null,
    ([, itemId, days]) => fetchMeliVisits(itemId, days),
    { revalidateOnFocus: false }
  );

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleUploadFiles(files) {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!fileArr.length) return;
    setUploading(true);
    setUploadQueue(fileArr.map(f => ({ name: f.name, status: 'uploading' })));

    const results = [];
    for (let i = 0; i < fileArr.length; i++) {
      const f = fileArr[i];
      try {
        const fd = new FormData();
        fd.append('file', f);
        const res = await fetch('/api/meli/pictures', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        results.push({ id: data.id, url: data.url });
        setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'done' } : item));
      } catch (e) {
        setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'error', error: e.message } : item));
      }
    }

    setPictures(prev => [...prev, ...results.filter(r => r.id)]);
    setUploading(false);
    setTimeout(() => setUploadQueue([]), 3000);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleUploadFiles(e.dataTransfer.files);
  }

  function removePicture(picId) {
    setPictures(prev => prev.filter(p => p.id !== picId));
  }

  async function handleSave() {
    setSaving(true);
    setErrors([]);
    setSuccess(false);

    const fields = {};
    if (form.title !== prop.title) fields.title = form.title.trim();
    if (String(form.price) !== String(prop.price)) fields.price = Number(form.price);
    const meliCurrency = form.currency === 'ARS' ? 'ARS' : 'USD';
    const currentCurrency = prop.currency === '$' ? 'ARS' : 'USD';
    if (meliCurrency !== currentCurrency) fields.currency_id = meliCurrency;
    if (form.status !== prop.status) fields.status = form.status;

    // Pictures changed?
    const origIds = (prop.pictureIds || []).map(p => p.id).join(',');
    const newIds = pictures.map(p => p.id).join(',');
    if (origIds !== newIds) {
      fields.pictures = pictures.map(p => ({ id: p.id }));
    }

    // Video
    const newVideoId = extractYouTubeId(form.videoUrl) || '';
    const origVideoId = prop.videoId || '';
    if (newVideoId !== origVideoId) fields.video_id = newVideoId || null;

    // Attributes
    const attrs = [];
    if (String(form.bedrooms) !== String(prop.bedrooms))
      attrs.push({ id: 'BEDROOMS', value_name: String(form.bedrooms) });
    if (String(form.bathrooms) !== String(prop.bathrooms))
      attrs.push({ id: 'BATHROOMS', value_name: String(form.bathrooms) });
    if (String(form.garages) !== String(prop.garages))
      attrs.push({ id: 'PARKING_LOTS', value_name: String(form.garages) });
    if (String(form.totalArea) !== String(prop.totalArea))
      attrs.push({ id: 'TOTAL_AREA', value_name: String(form.totalArea), value_struct: { number: Number(form.totalArea), unit: 'm²' } });
    if (String(form.coveredArea) !== String(prop.coveredArea))
      attrs.push({ id: 'COVERED_AREA', value_name: String(form.coveredArea), value_struct: { number: Number(form.coveredArea), unit: 'm²' } });
    if (attrs.length > 0) fields.attributes = attrs;

    const descChanged = form.description !== (prop.description === 'Sin descripción disponible.' ? '' : (prop.description || ''));
    const hasChanges = Object.keys(fields).length > 0 || descChanged;

    if (!hasChanges) { setSaving(false); setSuccess(true); return; }

    const res = await fetch('/api/meli/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
        description: descChanged ? form.description : undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setErrors([{ message: data.error || 'Error desconocido' }]);
    } else {
      setErrors(data.errors || []);
      setSuccess(true);
      const updated = await fetch(`/api/meli/items?id=${id}`).then(r => r.json());
      if (updated.property) {
        setProp(updated.property);
        setPictures(updated.property.pictureIds || []);
      }
    }
  }

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>Cargando publicación...</div>;
  }
  if (!prop) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>
        Publicación no encontrada.{' '}
        <Link href="/admin/propiedades" style={{ color: 'var(--admin-gold)' }}>Volver</Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Editar Publicación</h2>
          <p className={styles.pageSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {id}
            <a href={prop.publicUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)', display: 'inline-flex' }}>
              <Icon name="external-link" size={12} />
            </a>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className={styles.btnSecondary} onClick={() => router.push('/admin/propiedades')}>← Volver</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving || uploading}>
            <Icon name="save" size={16} />
            {saving ? 'Guardando en MELI...' : 'Guardar en MercadoLibre'}
          </button>
        </div>
      </div>

      {success && errors.length === 0 && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#4ade80', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ✓ Cambios guardados en MercadoLibre correctamente.
        </div>
      )}
      {errors.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#f87171', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {errors.map((e, i) => <div key={i}>{e.field ? `[${e.field}] ` : ''}{e.message}</div>)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Columna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Título */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Título</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Título de la publicación</label>
              <input className={styles.formInput} value={form.title} onChange={e => set('title', e.target.value)} maxLength={60} />
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{form.title.length}/60 caracteres</div>
            </div>
          </div>

          {/* Descripción */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Descripción</h3>
            <textarea
              className={styles.formTextarea}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={8}
              placeholder="Describí la propiedad: ubicación, características, entorno, financiación..."
            />
          </div>

          {/* Características */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Características</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dormitorios</label>
                <input className={styles.formInput} type="number" min={0} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Baños</label>
                <input className={styles.formInput} type="number" min={0} value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cocheras</label>
                <input className={styles.formInput} type="number" min={0} value={form.garages} onChange={e => set('garages', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Superficie total (m²)</label>
                <input className={styles.formInput} type="number" min={0} value={form.totalArea} onChange={e => set('totalArea', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Superficie cubierta (m²)</label>
                <input className={styles.formInput} type="number" min={0} value={form.coveredArea} onChange={e => set('coveredArea', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
              Fotos
              <span className={`${styles.badge} ${styles.badgeGray}`} style={{ marginLeft: '0.75rem', fontSize: '0.7rem' }}>{pictures.length} fotos</span>
            </h3>

            {/* Fotos actuales */}
            {pictures.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {pictures.map((pic, i) => (
                  <div key={pic.id || i} style={{ position: 'relative', width: 96, height: 72, borderRadius: '0.375rem', overflow: 'hidden', flexShrink: 0 }}>
                    {pic.url && (
                      <Image src={pic.url} alt={`foto ${i + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
                    )}
                    <button
                      type="button"
                      onClick={() => removePicture(pic.id)}
                      style={{
                        position: 'absolute', top: 3, right: 3,
                        background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff', padding: 0,
                      }}
                      title="Quitar foto"
                    >
                      <Icon name="x" size={10} />
                    </button>
                    {i === 0 && (
                      <div style={{ position: 'absolute', bottom: 2, left: 4, fontSize: '0.6rem', color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: 2, padding: '1px 4px' }}>
                        Portada
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Zona de upload */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${uploading ? 'var(--admin-gold)' : 'var(--admin-gold-20)'}`,
                borderRadius: '0.5rem', padding: '1.5rem',
                textAlign: 'center', color: 'var(--gray-500)',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
            >
              <div style={{ color: 'var(--admin-gold)', display: 'inline-flex', marginBottom: '0.4rem' }}>
                <Icon name="upload" size={28} />
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                {uploading ? 'Subiendo a MercadoLibre...' : 'Arrastrá fotos aquí o hacé click para seleccionar'}
              </div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>JPG, PNG, WEBP · Múltiples archivos aceptados</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleUploadFiles(e.target.files)}
            />

            {/* Estado de uploads en progreso */}
            {uploadQueue.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {uploadQueue.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.status === 'uploading' && <span style={{ color: 'var(--admin-gold)' }}>↑</span>}
                    {item.status === 'done' && <span style={{ color: '#4ade80' }}>✓</span>}
                    {item.status === 'error' && <span style={{ color: '#f87171' }}>✗</span>}
                    <span style={{ color: item.status === 'error' ? '#f87171' : 'var(--gray-400)' }}>
                      {item.name}{item.error ? ` — ${item.error}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Video</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>URL de YouTube</label>
              <input
                className={styles.formInput}
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.videoUrl}
                onChange={e => set('videoUrl', e.target.value)}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                Solo YouTube. El video aparece en la publicación de MercadoLibre.
              </div>
            </div>
            {form.videoUrl && extractYouTubeId(form.videoUrl) && (
              <div style={{ marginTop: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(form.videoUrl)}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>

        {/* Columna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Publicación</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Estado</label>
              <select className={styles.formSelect} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Activa</option>
                <option value="paused">Pausada</option>
                <option value="closed">Cerrada</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Moneda</label>
              <select className={styles.formSelect} value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="USD">USD</option>
                <option value="ARS">ARS ($)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio</label>
              <input className={styles.formInput} type="number" min={0} value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
          </div>

          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontFamily: 'var(--font-heading)', fontSize: '0.875rem' }}>
              Info fija
              <span className={`${styles.badge} ${styles.badgeGray}`} style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Solo lectura</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[['Tipo', prop.type], ['Operación', prop.operation], ['Dirección', prop.address], ['Zona', prop.location]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
                  <div style={{ color: 'var(--gray-300)', fontSize: '0.875rem' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas de visitas */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--white)', fontFamily: 'var(--font-heading)', fontSize: '0.875rem' }}>Visitas</h3>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[7, 30, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setVisitPeriod(d)}
                    style={{
                      background: visitPeriod === d ? 'rgba(184,141,77,0.15)' : 'none',
                      border: '1px solid',
                      borderColor: visitPeriod === d ? 'var(--admin-gold)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '0.25rem',
                      color: visitPeriod === d ? 'var(--admin-gold)' : 'var(--gray-500)',
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--admin-gold)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                {visitData?.total ?? '—'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>visitas en {visitPeriod} días</span>
            </div>
            {/* Mini sparkline */}
            {visitData?.days?.length > 0 && (() => {
              const maxVal = Math.max(...visitData.days.map(d => d.total), 1);
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 36 }}>
                  {visitData.days.map((d, i) => (
                    <div
                      key={i}
                      title={`${new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}: ${d.total} visitas`}
                      style={{
                        flex: 1,
                        height: `${Math.max((d.total / maxVal) * 100, 4)}%`,
                        background: 'var(--admin-gold)',
                        opacity: 0.6,
                        borderRadius: '2px 2px 0 0',
                        minHeight: 2,
                      }}
                    />
                  ))}
                </div>
              );
            })()}
            {!visitData && (
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Cargando estadísticas...</div>
            )}
          </div>

          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontFamily: 'var(--font-heading)', fontSize: '0.875rem' }}>Acciones rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href={prop.publicUrl} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary} style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Icon name="external-link" size={14} />
                Ver en MercadoLibre
              </a>
              <Link href={`/ficha/${id}`} target="_blank" className={styles.btnSecondary} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Icon name="eye" size={14} />
                Ver ficha interna
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
