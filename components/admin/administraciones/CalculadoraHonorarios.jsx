'use client';

import { useState, useEffect } from 'react';
import styles from '@/components/admin/admin.module.css';

export default function CalculadoraHonorarios({ montoAlquiler: propMonto, porcentaje: propPorcentaje, iva: propIva }) {
  const [monto, setMonto] = useState(propMonto || '');
  const [porcentaje, setPorcentaje] = useState(propPorcentaje || '');
  const [conIva, setConIva] = useState(propIva || false);

  useEffect(() => {
    if (propMonto) setMonto(propMonto);
    if (propPorcentaje) setPorcentaje(propPorcentaje);
    if (propIva !== undefined) setConIva(propIva);
  }, [propMonto, propPorcentaje, propIva]);

  const m = parseFloat(monto) || 0;
  const p = parseFloat(porcentaje) || 0;
  const honorariosNetos = m * (p / 100);
  const ivaAmount = conIva ? honorariosNetos * 0.21 : 0;
  const totalHonorarios = honorariosNetos + ivaAmount;
  const totalACobrar = m + totalHonorarios;

  const hasValues = m > 0 && p > 0;

  return (
    <div className={styles.calcCard}>
      <div className={styles.calcSection}>
        <div className={styles.calcSectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Calculadora de Honorarios
        </div>
        <div className={styles.calcInputGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Monto Alquiler ($)</label>
            <input
              className={styles.formInput}
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="350000"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Porcentaje Honorarios (%)</label>
            <input
              className={styles.formInput}
              type="number"
              step="0.01"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              placeholder="4.00"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>¿Con IVA (21%)?</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '38px' }}>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${conIva ? styles.toggleActive : ''}`}
                onClick={() => setConIva(!conIva)}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-300)' }}>{conIva ? 'Sí' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {hasValues && (
        <div className={styles.calcSection}>
          <div className={styles.calcResultGrid} style={{ marginTop: 0 }}>
            <div className={styles.calcResultItem}>
              <div className={styles.calcResultItemLabel}>Honorarios Netos</div>
              <div className={styles.calcResultItemValue}>
                $ {honorariosNetos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {conIva && (
              <div className={styles.calcResultItem}>
                <div className={styles.calcResultItemLabel}>IVA (21%)</div>
                <div className={styles.calcResultItemValue}>
                  $ {ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
            <div className={styles.calcResultItem}>
              <div className={styles.calcResultItemLabel}>Total Honorarios</div>
              <div className={styles.calcResultItemValue} style={{ color: 'var(--gold)' }}>
                $ {totalHonorarios.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className={styles.calcResultHighlight} style={{ marginTop: '1rem' }}>
            <div className={styles.calcResultLabel}>Total a Cobrar al Locatario</div>
            <div className={styles.calcResultValue}>
              $ {totalACobrar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={styles.calcResultSub}>
              Alquiler $ {m.toLocaleString('es-AR', { minimumFractionDigits: 2 })} + Honorarios $ {totalHonorarios.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
