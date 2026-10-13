'use client';
import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

const ACCEPTED = /^(video|image)\//;

function fileLabel(url) {
  if (!url) return null;
  try {
    const name = decodeURIComponent(url.split('/').pop().split('?')[0]);
    return name.replace(/^\d+-/, '');
  } catch {
    return 'archivo';
  }
}

export default function MediaUploader({ value, onChange, bucket = 'site-media' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState(null);

  async function upload(file) {
    if (!file) return;
    if (!ACCEPTED.test(file.type)) {
      setErr('Formato no válido. Subí un video o una imagen.');
      return;
    }
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

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    upload(e.dataTransfer.files?.[0]);
  }

  // Estado: ya hay un archivo subido
  if (value && !busy) {
    const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(value);
    return (
      <div className={styles.dropzonePreview}>
        {isVideo ? (
          <video className={styles.dropzonePreviewMedia} src={value} muted loop autoPlay playsInline />
        ) : (
          <img className={styles.dropzonePreviewMedia} src={value} alt="Media actual" />
        )}
        <div className={styles.dropzonePreviewBody}>
          <div className={styles.dropzonePreviewName}>{fileLabel(value)}</div>
          <div className={styles.dropzonePreviewMeta}>Archivo subido · se usa en la portada</div>
          <div className={styles.dropzoneActions}>
            <button type="button" className={styles.btnSecondary} onClick={() => inputRef.current?.click()}>
              <Icon name="upload" size={14} /> Reemplazar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => onChange(null)}>
              <Icon name="trash" size={14} /> Quitar
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="video/*,image/*" hidden
          onChange={(e) => upload(e.target.files?.[0])} />
      </div>
    );
  }

  // Estado: subiendo o vacío (dropzone)
  return (
    <div>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''}`}
        onClick={() => !busy && inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click(); }}
      >
        {busy ? (
          <>
            <div className={styles.dropzoneSpinner} />
            <div className={styles.dropzoneTitle}>Subiendo…</div>
            <div className={styles.dropzoneHint}>No cierres esta ventana</div>
          </>
        ) : (
          <>
            <div className={styles.dropzoneIcon}><Icon name="upload" size={24} /></div>
            <div className={styles.dropzoneTitle}>
              {dragging ? 'Soltá para subir' : <><b>Arrastrá tu video</b> aquí o hacé click</>}
            </div>
            <div className={styles.dropzoneHint}>Video o imagen · si no subís nada, se usa el archivo por defecto</div>
          </>
        )}
        <input ref={inputRef} type="file" accept="video/*,image/*" hidden
          onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      {err && (
        <div className={styles.fieldDesc} style={{ color: 'var(--error)', marginTop: '0.5rem' }}>{err}</div>
      )}
    </div>
  );
}
