'use client';
import { useEffect } from 'react';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

// Modal de alerta central flotante (navy + dorado). Se cierra con Escape,
// con clic en el fondo o con el botón. Úsalo para avisos que requieren leer,
// como "Formato no admitido".
export default function AlertModal({
  open,
  title,
  children,
  icon = 'alert-triangle',
  confirmLabel = 'Entendido',
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={styles.modalContent}
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '2rem 1.75rem 1.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: 56, height: 56, margin: '0 auto 1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
            }}
          >
            <Icon name={icon} size={26} />
          </div>
          <h3 className={styles.modalTitle} style={{ marginBottom: '0.6rem' }}>{title}</h3>
          <div style={{ color: 'var(--gray-300)', fontSize: '0.9rem', lineHeight: 1.55 }}>
            {children}
          </div>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onClose}
            style={{ marginTop: '1.5rem', minWidth: 140 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
