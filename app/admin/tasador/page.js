'use client';

import { useState } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const TIPOS = ['Departamento', 'Casa', 'PH', 'Local Comercial', 'Oficina', 'Galpón', 'Terreno', 'Cochera'];
const ESTADOS_CONSERVACION = ['Excelente', 'Muy Bueno', 'Bueno', 'Regular', 'A Refaccionar', 'En Construcción'];

// Precios de referencia por m² en USD según zona (estimativos Argentina 2024-2025)
const PRECIOS_ZONA = {
  'CABA - Palermo': { min: 2800, max: 3800 },
  'CABA - Recoleta': { min: 2500, max: 3500 },
  'CABA - Belgrano': { min: 2400, max: 3200 },
  'CABA - Caballito': { min: 2000, max: 2800 },
  'CABA - Villa Urquiza': { min: 2000, max: 2600 },
  'CABA - Otros': { min: 1600, max: 2400 },
  'GBA Norte': { min: 1400, max: 2200 },
  'GBA Oeste': { min: 1000, max: 1800 },
  'GBA Sur': { min: 900, max: 1500 },
  'Córdoba Capital': { min: 1000, max: 1800 },
  'Rosario': { min: 900, max: 1600 },
  'Mar del Plata': { min: 1100, max: 2000 },
  'Mendoza': { min: 900, max: 1500 },
  'Interior': { min: 600, max: 1200 },
};

const AJUSTES = {
  tipo: {
    'Departamento': 1.0,
    'Casa': 1.05,
    'PH': 0.90,
    'Local Comercial': 1.15,
    'Oficina': 1.10,
    'Galpón': 0.50,
    'Terreno': 0.40,
    'Cochera': 0.25,
  },
  conservacion: {
    'Excelente': 1.15,
    'Muy Bueno': 1.08,
    'Bueno': 1.0,
    'Regular': 0.85,
    'A Refaccionar': 0.65,
    'En Construcción': 0.50,
  },
  antiguedad: (anos) => {
    if (anos <= 2) return 1.10;
    if (anos <= 5) return 1.05;
    if (anos <= 10) return 1.0;
    if (anos <= 20) return 0.92;
    if (anos <= 40) return 0.82;
    return 0.70;
  },
};

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

export default function TasadorPage() {
  const [form, setForm] = useState({
    direccion: '',
    tipo_propiedad: 'Departamento',
    superficie_cubierta: '',
    superficie_total: '',
    ambientes: '',
    banos: '',
    cochera: false,
    antiguedad: '',
    estado_conservacion: 'Bueno',
    zona: 'CABA - Otros',
  });
  const [resultado, setResultado] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const calcular = () => {
    const sup = parseFloat(form.superficie_cubierta);
    if (!sup || sup <= 0) return alert('Ingresá la superficie cubierta');

    const zona = PRECIOS_ZONA[form.zona] || PRECIOS_ZONA['Interior'];
    const precioBaseM2 = (zona.min + zona.max) / 2;

    let precioM2 = precioBaseM2;
    precioM2 *= AJUSTES.tipo[form.tipo_propiedad] || 1;
    precioM2 *= AJUSTES.conservacion[form.estado_conservacion] || 1;
    precioM2 *= AJUSTES.antiguedad(parseInt(form.antiguedad) || 10);

    // Bonuses
    if (form.cochera) precioM2 *= 1.05;
    const banos = parseInt(form.banos) || 1;
    if (banos >= 3) precioM2 *= 1.03;

    const valorUSD = sup * precioM2;
    const valorMin = sup * zona.min * (AJUSTES.tipo[form.tipo_propiedad] || 1) * (AJUSTES.conservacion[form.estado_conservacion] || 1);
    const valorMax = sup * zona.max * (AJUSTES.tipo[form.tipo_propiedad] || 1) * (AJUSTES.conservacion[form.estado_conservacion] || 1);

    setResultado({
      precioM2: Math.round(precioM2),
      valorUSD: Math.round(valorUSD),
      valorMin: Math.round(valorMin),
      valorMax: Math.round(valorMax),
    });
  };

  const guardar = async () => {
    if (!resultado) return;
    setSaving(true);
    const { error } = await supabase.from('tasaciones').insert({
      direccion: form.direccion || 'Sin dirección',
      tipo_propiedad: form.tipo_propiedad,
      superficie_cubierta: parseFloat(form.superficie_cubierta) || null,
      superficie_total: parseFloat(form.superficie_total) || null,
      ambientes: parseInt(form.ambientes) || null,
      banos: parseInt(form.banos) || null,
      cochera: form.cochera,
      antiguedad: parseInt(form.antiguedad) || null,
      estado_conservacion: form.estado_conservacion,
      zona: form.zona,
      valor_estimado_usd: resultado.valorUSD,
      precio_m2_usd: resultado.precioM2,
    });
    if (error) alert('Error: ' + error.message);
    else alert('✅ Tasación guardada correctamente');
    setSaving(false);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Tasador Online</h2>
          <p className={styles.pageSubtitle}>Estimación de valor de mercado basada en datos referenciales</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: resultado ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className={styles.card} style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Datos de la Propiedad
          </h3>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Dirección</label>
              <input className={styles.formInput} name="direccion" value={form.direccion} onChange={handleChange} placeholder="Av. Corrientes 1234, CABA" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo de Propiedad *</label>
              <select className={styles.formSelect} name="tipo_propiedad" value={form.tipo_propiedad} onChange={handleChange}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Zona *</label>
              <select className={styles.formSelect} name="zona" value={form.zona} onChange={handleChange}>
                {Object.keys(PRECIOS_ZONA).map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Superficie Cubierta (m²) *</label>
              <input className={styles.formInput} type="number" name="superficie_cubierta" value={form.superficie_cubierta} onChange={handleChange} placeholder="65" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Superficie Total (m²)</label>
              <input className={styles.formInput} type="number" name="superficie_total" value={form.superficie_total} onChange={handleChange} placeholder="80" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ambientes</label>
              <input className={styles.formInput} type="number" name="ambientes" value={form.ambientes} onChange={handleChange} placeholder="3" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Baños</label>
              <input className={styles.formInput} type="number" name="banos" value={form.banos} onChange={handleChange} placeholder="1" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Antigüedad (años)</label>
              <input className={styles.formInput} type="number" name="antiguedad" value={form.antiguedad} onChange={handleChange} placeholder="10" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Estado de Conservación</label>
              <select className={styles.formSelect} name="estado_conservacion" value={form.estado_conservacion} onChange={handleChange}>
                {ESTADOS_CONSERVACION.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>¿Tiene cochera?</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}>
                <input type="checkbox" name="cochera" checked={form.cochera} onChange={handleChange} style={{ width: 18, height: 18, accentColor: '#c9a96e' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-300)' }}>{form.cochera ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={calcular} style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Calcular Valuación
          </button>
        </div>

        {/* Result */}
        {resultado && (
          <div>
            {/* Main value */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.03))',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRadius: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#c9a96e', fontWeight: 700, marginBottom: '0.5rem' }}>
                Valor Estimado
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>
                USD {formatCurrency(resultado.valorUSD)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                USD {formatCurrency(resultado.precioM2)} / m²
              </div>
            </div>

            {/* Range */}
            <div className={styles.card} style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '0.75rem' }}>Rango de Mercado</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Mínimo</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>USD {formatCurrency(resultado.valorMin)}</div>
                </div>
                <div style={{ height: '2px', flex: 2, background: 'linear-gradient(90deg, #f87171, #4ade80)', borderRadius: '1px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: `${((resultado.valorUSD - resultado.valorMin) / (resultado.valorMax - resultado.valorMin)) * 100}%`,
                    width: '10px', height: '10px',
                    background: '#c9a96e', borderRadius: '50%',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 6px rgba(201,169,110,0.5)',
                  }} />
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Máximo</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>USD {formatCurrency(resultado.valorMax)}</div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className={styles.card} style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '0.75rem' }}>Desglose del Cálculo</div>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Propiedad</span><span style={{ color: '#fff' }}>{form.tipo_propiedad}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Zona</span><span style={{ color: '#fff' }}>{form.zona}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Superficie</span><span style={{ color: '#fff' }}>{form.superficie_cubierta} m²</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Conservación</span><span style={{ color: '#fff' }}>{form.estado_conservacion}</span>
                </div>
                {form.antiguedad && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Antigüedad</span><span style={{ color: '#fff' }}>{form.antiguedad} años</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cochera</span><span style={{ color: '#fff' }}>{form.cochera ? 'Sí (+5%)' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className={styles.btnPrimary} onClick={guardar} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                </svg>
                {saving ? 'Guardando...' : 'Guardar Tasación'}
              </button>
            </div>

            <p style={{ fontSize: '0.65rem', color: '#555', marginTop: '1rem', textAlign: 'center' }}>
              * Los valores son estimativos basados en datos referenciales del mercado. No constituyen una tasación oficial.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
