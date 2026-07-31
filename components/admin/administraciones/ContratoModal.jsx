'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const EMPTY_FORM = {
  inmueble_id: '', locador_id: '', locatario_id: '',
  fecha_inicio: '', fecha_fin: '', monto_inicial: '',
  moneda: 'ARS', indice_ajuste: 'ICL', periodicidad_ajuste: 'trimestral',
  honorarios_porcentaje: '', honorarios_iva: false, honorarios_notas: '',
  punitorios_tasa: '', dia_vencimiento_pago: 10,
  estado: 'activo', notas: '',
};

export default function ContratoModal({ isOpen, onClose, onSaved, editData }) {
  const [form, setForm] = useState(editData || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [inmuebles, setInmuebles] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState(editData?.contrato_pdf_url ? 'Contrato cargado' : '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      supabase.from('clientes').select('id, nombre, tipo').order('nombre'),
      supabase.from('inmuebles_administrados').select('id, direccion').order('direccion'),
    ]).then(([{ data: c }, { data: i }]) => {
      setClientes(c || []);
      setInmuebles(i || []);
    });

    if (editData) {
      setForm({
        ...EMPTY_FORM,
        ...editData,
        honorarios_porcentaje: editData.honorarios_porcentaje ?? '',
        honorarios_iva: editData.honorarios_iva ?? false,
      });
      setPdfName(editData.contrato_pdf_url ? 'Contrato cargado' : '');
      setPdfFile(null);
    } else {
      setForm(EMPTY_FORM);
      setPdfName('');
      setPdfFile(null);
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return alert('Solo se permiten archivos PDF o Word (.doc, .docx)');
    }
    if (file.size > 10 * 1024 * 1024) {
      return alert('El archivo no puede superar 10 MB');
    }
    setPdfFile(file);
    setPdfName(file.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) return alert('Solo se permiten archivos PDF o Word (.doc, .docx)');
    if (file.size > 10 * 1024 * 1024) return alert('El archivo no puede superar 10 MB');
    setPdfFile(file);
    setPdfName(file.name);
  };

  const uploadPdf = async (contratoId) => {
    if (!pdfFile) return null;
    const filePath = `contratos/${contratoId}/${Date.now()}_${pdfFile.name}`;
    const { error } = await supabase.storage.from('contratos-pdf').upload(filePath, pdfFile);
    if (error) throw new Error('Error subiendo PDF: ' + error.message);
    const { data: { publicUrl } } = supabase.storage.from('contratos-pdf').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return; // prevent double-click

    if (!pdfFile && !editData?.contrato_pdf_url) {
      return alert('Debés cargar el contrato en formato PDF o Word');
    }
    if (!form.fecha_inicio || !form.fecha_fin || !form.monto_inicial) {
      return alert('Fecha de inicio, fin y monto inicial son obligatorios');
    }

    setSaving(true);
    setUploading(true);

    try {
      const payload = {
        inmueble_id: form.inmueble_id || null,
        locador_id: form.locador_id || null,
        locatario_id: form.locatario_id || null,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        monto_inicial: parseFloat(form.monto_inicial),
        moneda: form.moneda,
        indice_ajuste: form.indice_ajuste,
        periodicidad_ajuste: form.periodicidad_ajuste,
        honorarios_porcentaje: form.honorarios_porcentaje ? parseFloat(form.honorarios_porcentaje) : 0,
        honorarios_iva: form.honorarios_iva,
        honorarios_notas: form.honorarios_notas,
        estado: form.estado,
        notas: form.notas,
      };

      if (editData?.id) {
        // Update existing
        if (pdfFile) {
          const pdfUrl = await uploadPdf(editData.id);
          if (pdfUrl) payload.contrato_pdf_url = pdfUrl;
        }
        const { error } = await supabase.from('contratos').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        // Create new — first insert to get ID, then upload PDF
        const { data: newContrato, error: insertErr } = await supabase.from('contratos').insert(payload).select('id').single();
        if (insertErr) throw insertErr;

        if (pdfFile) {
          const pdfUrl = await uploadPdf(newContrato.id);
          if (pdfUrl) {
            await supabase.from('contratos').update({ contrato_pdf_url: pdfUrl }).eq('id', newContrato.id);
          }
        }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const locadores = clientes.filter(c => c.tipo === 'locador' || c.tipo === 'ambos');
  const locatarios = clientes.filter(c => c.tipo === 'locatario' || c.tipo === 'ambos');

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.modalContentWide}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {editData?.id ? 'Editar Contrato' : 'Cargar Contrato'}
          </h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>

            {/* ── PDF Upload Zone ── */}
            <div
              className={styles.formGridFull}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${pdfName ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '0.75rem',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: pdfName ? 'rgba(201,169,110,0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
                marginBottom: '1.5rem',
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
              {pdfName ? (
                <>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.9rem' }}>{pdfName}</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Click para reemplazar
                  </div>
                </>
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.95rem' }}>
                    Arrastrá el contrato o hacé click para seleccionar
                  </div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: '0.375rem' }}>
                    Máximo 10 MB · Archivos PDF, DOC o DOCX
                  </div>
                </>
              )}
            </div>

            {/* ── Metadata Section ── */}
            <div style={{ borderTop: '1px solid rgba(201,169,110,0.08)', paddingTop: '1rem', marginBottom: '0.25rem' }}>
              <label className={styles.formLabel} style={{ color: 'var(--gold)', marginBottom: '0', letterSpacing: '2px' }}>
                DATOS DEL CONTRATO
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                Estos datos se usan para las calculadoras y el control de vencimientos
              </p>
            </div>

            <div className={styles.formGrid}>
              {/* Partes */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Inmueble</label>
                <select className={styles.formSelect} name="inmueble_id" value={form.inmueble_id} onChange={handleChange}>
                  <option value="">— Seleccionar inmueble —</option>
                  {inmuebles.map(i => <option key={i.id} value={i.id}>{i.direccion}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado</label>
                <select className={styles.formSelect} name="estado" value={form.estado} onChange={handleChange}>
                  <option value="activo">Activo</option>
                  <option value="proximo_a_vencer">Próximo a vencer</option>
                  <option value="vencido">Vencido</option>
                  <option value="rescindido">Rescindido</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Locador (Propietario)</label>
                <select className={styles.formSelect} name="locador_id" value={form.locador_id} onChange={handleChange}>
                  <option value="">— Seleccionar locador —</option>
                  {locadores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Locatario (Inquilino)</label>
                <select className={styles.formSelect} name="locatario_id" value={form.locatario_id} onChange={handleChange}>
                  <option value="">— Seleccionar locatario —</option>
                  {locatarios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Fechas y Monto */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha Inicio *</label>
                <input className={styles.formInput} type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha Fin *</label>
                <input className={styles.formInput} type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Monto Inicial *</label>
                <input className={styles.formInput} type="number" step="0.01" name="monto_inicial" value={form.monto_inicial} onChange={handleChange} placeholder="250000" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Moneda</label>
                <select className={styles.formSelect} name="moneda" value={form.moneda} onChange={handleChange}>
                  <option value="ARS">ARS (Pesos)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>

              {/* Ajuste */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Índice de Ajuste</label>
                <select className={styles.formSelect} name="indice_ajuste" value={form.indice_ajuste} onChange={handleChange}>
                  <option value="IPC">IPC (INDEC)</option>
                  <option value="ICL">ICL (Banco Central)</option>
                  <option value="UVA">UVA</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Periodicidad de Ajuste</label>
                <select className={styles.formSelect} name="periodicidad_ajuste" value={form.periodicidad_ajuste} onChange={handleChange}>
                  <option value="mensual">Mensual</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="cuatrimestral">Cuatrimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              {/* Honorarios */}
              <div className={`${styles.formGroup} ${styles.formGridFull}`} style={{ borderTop: '1px solid rgba(201,169,110,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label className={styles.formLabel} style={{ color: 'var(--gold)', marginBottom: '0' }}>Honorarios del Martillero</label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Porcentaje Pactado (%)</label>
                <input className={styles.formInput} type="number" step="0.01" name="honorarios_porcentaje" value={form.honorarios_porcentaje} onChange={handleChange} placeholder="4.00" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>¿Incluye IVA?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '38px' }}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${form.honorarios_iva ? styles.toggleActive : ''}`}
                    onClick={() => setForm({ ...form, honorarios_iva: !form.honorarios_iva })}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-300)' }}>{form.honorarios_iva ? 'Sí' : 'No'}</span>
                </div>
              </div>

              {/* ── Real-time Preview ── */}
              {parseFloat(form.monto_inicial) > 0 && parseFloat(form.honorarios_porcentaje) > 0 && (() => {
                const monto = parseFloat(form.monto_inicial);
                const pct = parseFloat(form.honorarios_porcentaje);
                const honorarios = monto * (pct / 100);
                const iva = form.honorarios_iva ? honorarios * 0.21 : 0;
                const totalDeducciones = honorarios + iva;
                const netoTransferir = monto - totalDeducciones;
                return (
                  <div className={`${styles.formGroup} ${styles.formGridFull}`} style={{
                    background: 'rgba(201,169,110,0.04)',
                    border: '1px solid rgba(201,169,110,0.12)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Total a cobrar</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)' }}>
                          $ {monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Honorarios correspondientes ({pct}%)</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f87171' }}>
                          - $ {honorarios.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {form.honorarios_iva && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>IVA (21%)</span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f87171' }}>
                            - $ {iva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid rgba(201,169,110,0.15)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>Neto a transferir al propietario</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>
                          $ {netoTransferir.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Notas del Arreglo</label>
                <textarea className={styles.formTextarea} name="honorarios_notas" value={form.honorarios_notas} onChange={handleChange} placeholder="Detalle del acuerdo de honorarios..." rows={2} />
              </div>

              {/* Punitorios */}
              <div className={`${styles.formGroup} ${styles.formGridFull}`} style={{ borderTop: '1px solid rgba(201,169,110,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label className={styles.formLabel} style={{ color: 'var(--gold)', marginBottom: '0' }}>Punitorios por Mora</label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tasa diaria (%)</label>
                <input className={styles.formInput} type="number" step="0.01" name="punitorios_tasa" value={form.punitorios_tasa} onChange={handleChange} placeholder="0.10" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Día de vencimiento de pago</label>
                <input className={styles.formInput} type="number" min="1" max="28" name="dia_vencimiento_pago" value={form.dia_vencimiento_pago} onChange={handleChange} placeholder="10" />
              </div>

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Notas Generales</label>
                <textarea className={styles.formTextarea} name="notas" value={form.notas} onChange={handleChange} placeholder="Observaciones del contrato..." rows={2} />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {uploading ? 'Subiendo PDF...' : saving ? 'Guardando...' : (editData?.id ? 'Guardar Cambios' : 'Cargar Contrato')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
