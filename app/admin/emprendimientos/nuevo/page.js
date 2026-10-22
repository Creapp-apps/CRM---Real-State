'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const INITIAL = {
  title: '', location: '', address: '', description: '',
  total_units: '', price_from: '', progress: 0,
  amenities: '', status: 'draft', delivery_date: '',
};

export default function AdminEmprendimientoForm() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('developments').insert([{
      title: form.title.trim(),
      location: form.location.trim() || null,
      address: form.address.trim() || null,
      description: form.description.trim() || null,
      total_units: form.total_units ? Number(form.total_units) : null,
      price_from: form.price_from.trim() || null,
      progress: Number(form.progress) || 0,
      amenities: form.amenities.trim() || null,
      status: form.status,
      delivery_date: form.delivery_date || null,
    }]);
    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push('/admin/emprendimientos');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Nuevo Emprendimiento</h2>
          <p className={styles.pageSubtitle}>Completá los datos del proyecto</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className={styles.btnSecondary} onClick={() => router.back()}>← Volver</button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            <Icon name="save" size={16} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#f87171', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className={styles.card}>
          <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Información General</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre del Emprendimiento *</label>
            <input className={styles.formInput} placeholder="Ej: River Park Towers" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ubicación</label>
              <input className={styles.formInput} placeholder="Barrio / Ciudad" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Dirección</label>
              <input className={styles.formInput} placeholder="Dirección completa" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <textarea className={styles.formTextarea} placeholder="Descripción detallada del emprendimiento..." rows={5} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Unidades totales</label>
              <input className={styles.formInput} type="number" placeholder="120" value={form.total_units} onChange={e => set('total_units', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio desde</label>
              <input className={styles.formInput} placeholder="USD 100.000" value={form.price_from} onChange={e => set('price_from', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Avance de obra (%)</label>
              <input className={styles.formInput} type="number" placeholder="75" min={0} max={100} value={form.progress} onChange={e => set('progress', e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Amenities</label>
            <input className={styles.formInput} placeholder="Pileta, SUM, Gym, Seguridad 24hs..." value={form.amenities} onChange={e => set('amenities', e.target.value)} />
          </div>
        </div>

        <div>
          <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--white)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>Publicación</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Estado</label>
              <select className={styles.formSelect} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="sold_out">Vendido</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fecha de entrega estimada</label>
              <input className={styles.formInput} type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
