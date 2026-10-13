'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '@/components/admin/admin.module.css';

export default function MediaUploader({ value, onChange, bucket = 'site-media' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    const path = `cardoso/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className={styles.uploader}>
      <input type="file" accept="video/*,image/*" onChange={handleFile} disabled={busy} />
      {busy && <div className={styles.uploadProgress}>Subiendo…</div>}
      {err && (
        <div className={styles.fieldDesc} style={{ color: 'var(--error)' }}>
          {err}
        </div>
      )}
      <div className={styles.fieldDesc}>Actual: {value || 'archivo por defecto'}</div>
      {value && (
        <button
          type="button"
          className={styles.btnGhost}
          style={{ marginTop: '0.5rem' }}
          onClick={() => onChange(null)}
          disabled={busy}
        >
          Quitar (volver al video por defecto)
        </button>
      )}
    </div>
  );
}
