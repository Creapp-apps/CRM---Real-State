'use client';

import { useState, useEffect } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const TIPOS = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'ph', label: 'PH' },
  { value: 'local', label: 'Local' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'galpon', label: 'Galpón' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'otro', label: 'Otro' },
];

const SERVICIOS_LABELS = {
  gas: 'Gas',
  agua: 'Agua',
  luz: 'Luz',
  boleta_municipal: 'Boleta Municipal',
};

const EMPTY_SERVICIO = { activo: false, nro_cuenta: '', nro_cliente: '', digito_verificador: '' };

const EMPTY_FORM = {
  direccion: '', tipo: 'departamento',
  superficie_cubierta: '', superficie_descubierta: '',
  ambientes: '', banos: '', cochera: false,
  servicios: {
    gas: { ...EMPTY_SERVICIO },
    agua: { ...EMPTY_SERVICIO },
    luz: { ...EMPTY_SERVICIO },
    boleta_municipal: { ...EMPTY_SERVICIO },
  },
  estado: 'disponible', observaciones: '',
};

// Normalize old boolean format to new object format
function normalizeServicios(servicios) {
  if (!servicios) return EMPTY_FORM.servicios;
  const result = {};
  for (const key of ['gas', 'agua', 'luz', 'boleta_municipal']) {
    if (typeof servicios[key] === 'boolean') {
      result[key] = { ...EMPTY_SERVICIO, activo: servicios[key] };
    } else if (typeof servicios[key] === 'object' && servicios[key] !== null) {
      result[key] = { ...EMPTY_SERVICIO, ...servicios[key] };
    } else {
      result[key] = { ...EMPTY_SERVICIO };
    }
  }
  return result;
}

export default function InmuebleModal({ isOpen, onClose, onSaved, editData }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Sync form with editData whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setForm({
        ...EMPTY_FORM,
        ...editData,
        superficie_cubierta: editData.superficie_cubierta ?? '',
        superficie_descubierta: editData.superficie_descubierta ?? '',
        ambientes: editData.ambientes ?? '',
        banos: editData.banos ?? '',
        cochera: editData.cochera ?? false,
        servicios: normalizeServicios(editData.servicios),
        observaciones: editData.observaciones ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const toggleServicio = (key) => {
    setForm({
      ...form,
      servicios: {
        ...form.servicios,
        [key]: { ...form.servicios[key], activo: !form.servicios[key].activo }
      }
    });
  };

  const handleServicioField = (servKey, field, value) => {
    setForm({
      ...form,
      servicios: {
        ...form.servicios,
        [servKey]: { ...form.servicios[servKey], [field]: value }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.direccion.trim()) return alert('La dirección es obligatoria');
    setSaving(true);

    const payload = {
      ...form,
      superficie_cubierta: form.superficie_cubierta ? parseFloat(form.superficie_cubierta) : null,
      superficie_descubierta: form.superficie_descubierta ? parseFloat(form.superficie_descubierta) : null,
      ambientes: form.ambientes ? parseInt(form.ambientes) : null,
      banos: form.banos ? parseInt(form.banos) : null,
    };

    try {
      if (editData?.id) {
        const { error } = await supabase.from('inmuebles_administrados').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inmuebles_administrados').insert(payload);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.modalContentWide}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {editData?.id ? 'Editar Inmueble' : 'Nuevo Inmueble'}
          </h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Dirección Completa *</label>
                <input className={styles.formInput} name="direccion" value={form.direccion} onChange={handleChange} placeholder="Av. San Martín 1234, Piso 3° A" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo</label>
                <select className={styles.formSelect} name="tipo" value={form.tipo} onChange={handleChange}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado</label>
                <select className={styles.formSelect} name="estado" value={form.estado} onChange={handleChange}>
                  <option value="disponible">Disponible</option>
                  <option value="alquilado">Alquilado</option>
                  <option value="en_mantenimiento">En Mantenimiento</option>
                </select>
              </div>

              {/* Superficies */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sup. Cubierta (m²)</label>
                <input className={styles.formInput} type="number" step="0.01" name="superficie_cubierta" value={form.superficie_cubierta} onChange={handleChange} placeholder="85.00" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sup. Descubierta (m²)</label>
                <input className={styles.formInput} type="number" step="0.01" name="superficie_descubierta" value={form.superficie_descubierta} onChange={handleChange} placeholder="20.00" />
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
                <label className={styles.formLabel}>Cochera</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '38px' }}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${form.cochera ? styles.toggleActive : ''}`}
                    onClick={() => setForm({ ...form, cochera: !form.cochera })}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-300)' }}>{form.cochera ? 'Sí' : 'No'}</span>
                </div>
              </div>

              {/* ── Servicios con datos de cuenta ── */}
              <div className={`${styles.formGroup} ${styles.formGridFull}`} style={{ borderTop: '1px solid rgba(201,169,110,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label className={styles.formLabel} style={{ color: 'var(--gold)', marginBottom: '0', letterSpacing: '2px' }}>SERVICIOS</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                  Datos identificatorios únicos del inmueble por servicio
                </p>
              </div>

              {['gas', 'agua', 'luz', 'boleta_municipal'].map(servKey => {
                const serv = form.servicios[servKey];
                return (
                  <div key={servKey} className={styles.formGridFull} style={{
                    background: serv.activo ? 'rgba(201,169,110,0.03)' : 'transparent',
                    border: `1px solid ${serv.activo ? 'rgba(201,169,110,0.1)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.2s',
                  }}>
                    {/* Toggle + Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: serv.activo ? '0.75rem' : 0 }}>
                      <button
                        type="button"
                        className={`${styles.toggleSwitch} ${serv.activo ? styles.toggleActive : ''}`}
                        onClick={() => toggleServicio(servKey)}
                      />
                      <span style={{ fontSize: '0.9rem', color: serv.activo ? 'var(--white)' : 'var(--gray-400)', fontWeight: serv.activo ? 600 : 400, textTransform: 'capitalize' }}>
                        {SERVICIOS_LABELS[servKey]}
                      </span>
                    </div>

                    {/* Account Details (shown when active) */}
                    {serv.activo && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label className={styles.formLabel} style={{ fontSize: '0.7rem' }}>N° de Cuenta</label>
                          <input
                            className={styles.formInput}
                            value={serv.nro_cuenta}
                            onChange={(e) => handleServicioField(servKey, 'nro_cuenta', e.target.value)}
                            placeholder="Ej: 0012345"
                          />
                        </div>
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label className={styles.formLabel} style={{ fontSize: '0.7rem' }}>N° de Cliente</label>
                          <input
                            className={styles.formInput}
                            value={serv.nro_cliente}
                            onChange={(e) => handleServicioField(servKey, 'nro_cliente', e.target.value)}
                            placeholder="Ej: 987654"
                          />
                        </div>
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label className={styles.formLabel} style={{ fontSize: '0.7rem' }}>Dígito Verificador</label>
                          <input
                            className={styles.formInput}
                            value={serv.digito_verificador}
                            onChange={(e) => handleServicioField(servKey, 'digito_verificador', e.target.value)}
                            placeholder="Ej: 3"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Observaciones</label>
                <textarea className={styles.formTextarea} name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Detalles adicionales del inmueble..." rows={3} />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando...' : (editData?.id ? 'Guardar Cambios' : 'Crear Inmueble')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
