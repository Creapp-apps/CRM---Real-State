'use client';
import { useEffect } from 'react';
import styles from '@/components/admin/admin.module.css';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const cls = toast.type === 'error' ? styles.toastError : styles.toastSuccess;
  return (
    <div className={`${styles.toast} ${cls} ${styles.toastShow}`} role="status">
      {toast.message}
    </div>
  );
}
