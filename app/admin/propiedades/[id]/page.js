'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

const EMPTY = {
  title: '', price: '', currency: 'USD', status: 'active',
  description: '', bedrooms: '', bathrooms: '', garages: '',
  totalArea: '', coveredArea: '',
};

export default function AdminPropertyEdit() {
  const { id } = useParams();
  const router = useRouter();
  const [prop, setProp] = useState(null);
  const [form, setForm] = useState(EMPTY);
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
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

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

    // Attributes changed
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
      // Refresh prop data
      const updated = await fetch(`/api/meli/items?id=${id}`).then(r => r.json());
      if (updated.property) setProp(updated.property);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>
        Cargando publicación...
      </div>
    );
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
          <button className={styles.btnSecondary} onClick={() => router.push('/admin/propiedades')}>
            ← Volver
          </button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            <Icon name="save" size={16} />
            {saving ? 'Guardando en MercadoLibre...' : 'Guardar en MercadoLibre'}
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
              <input
                className={styles.formInput}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                maxLength={60}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                {form.title.length}/60 caracteres
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Descripción</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descripción de la propiedad</label>
              <textarea
                className={styles.formTextarea}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={8}
                placeholder="Describí la propiedad con detalle: ubicación, características, entorno, financiación..."
              />
            </div>
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
            <h3 style={{ color: 'var(--white)', marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>
              Fotos
              <span className={`${styles.badge} ${styles.badgeGray}`} style={{ marginLeft: '0.75rem', fontSize: '0.7rem' }}>
                {prop.images?.length || 0} fotos
              </span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
              Para agregar o eliminar fotos usá{' '}
              <a href={prop.publicUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-gold)' }}>
                MercadoLibre directamente →
              </a>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {prop.images?.slice(0, 8).map((img, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 60, borderRadius: '0.375rem', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={img} alt={`foto ${i + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
                </div>
              ))}
              {(prop.images?.length || 0) > 8 && (
                <div style={{ width: 80, height: 60, borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                  +{prop.images.length - 8}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Estado y precio */}
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
              <input
                className={styles.formInput}
                type="number"
                min={0}
                value={form.price}
                onChange={e => set('price', e.target.value)}
              />
            </div>
          </div>

          {/* Info de solo lectura */}
          <div className={styles.card}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1rem', fontFamily: 'var(--font-heading)', fontSize: '0.875rem' }}>
              Info de la publicación
              <span className={`${styles.badge} ${styles.badgeGray}`} style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Solo lectura</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                ['Tipo', prop.type],
                ['Operación', prop.operation],
                ['Dirección', prop.address],
                ['Zona', prop.location],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
                  <div style={{ color: 'var(--gray-300)', fontSize: '0.875rem' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
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
