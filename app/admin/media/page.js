'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/admin/Icon';
import { supabase } from '@/lib/supabase';
import styles from '@/components/admin/admin.module.css';

const BUCKET = 'site-media';
const FOLDER = 'cardoso/galeria';
const ACCEPTED = /^(video|image)\//;
const IS_VIDEO = /\.(mp4|mov|webm|ogg)$/i;

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminMedia() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) {
      setError(error.message);
      setFiles([]);
    } else {
      // Ignorar el placeholder vacío que Storage crea en carpetas nuevas
      const items = (data || []).filter((f) => f.id && f.name !== '.emptyFolderPlaceholder');
      setFiles(
        items.map((f) => {
          const path = `${FOLDER}/${f.name}`;
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          return {
            name: f.name,
            path,
            url: pub.publicUrl,
            size: f.metadata?.size,
            createdAt: f.created_at,
            isVideo: IS_VIDEO.test(f.name),
          };
        })
      );
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFiles(fileList) {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    const invalid = arr.find((f) => !ACCEPTED.test(f.type));
    if (invalid) {
      setError('Solo se permiten imágenes o videos.');
      return;
    }
    setUploading(true);
    setError(null);
    for (const file of arr) {
      const path = `${FOLDER}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (error) {
        setError(error.message);
        break;
      }
    }
    setUploading(false);
    await load();
  }

  async function remove(path) {
    if (!window.confirm('¿Eliminar este archivo? No se puede deshacer.')) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  }

  async function copyUrl(url, name) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(name);
      setTimeout(() => setCopied((c) => (c === name ? null : c)), 1800);
    } catch {
      setError('No se pudo copiar la URL.');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (!uploading) uploadFiles(e.dataTransfer.files);
  }

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Galería de Media</h2>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando…' : `${files.length} archivo${files.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => !uploading && inputRef.current?.click()} disabled={uploading}>
          <Icon name="upload" size={16} />
          {uploading ? 'Subiendo…' : 'Subir Archivos'}
        </button>
      </div>

      {/* Dropzone */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) inputRef.current?.click(); }}
        >
          {uploading ? (
            <>
              <div className={styles.dropzoneSpinner} />
              <div className={styles.dropzoneTitle}>Subiendo…</div>
            </>
          ) : (
            <>
              <div className={styles.dropzoneIcon}><Icon name="upload" size={24} /></div>
              <div className={styles.dropzoneTitle}>
                {dragging ? 'Soltá para subir' : <><b>Arrastrá archivos</b> aquí o hacé click</>}
              </div>
              <div className={styles.dropzoneHint}>Imágenes o videos · podés subir varios a la vez</div>
            </>
          )}
          <input ref={inputRef} type="file" accept="video/*,image/*" multiple hidden
            onChange={(e) => uploadFiles(e.target.files)} />
        </div>
        {error && <div className={styles.fieldDesc} style={{ color: 'var(--error)', marginTop: '0.5rem' }}>{error}</div>}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div className={styles.searchBar} style={{ maxWidth: 300 }}>
          <Icon name="search" size={16} />
          <input placeholder="Buscar archivos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className={styles.card} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Cargando galería…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          {files.length === 0 ? 'Todavía no subiste archivos. Arrastrá imágenes o videos arriba.' : 'No hay archivos que coincidan con la búsqueda.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {filtered.map((media) => (
            <div key={media.path} className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: 130, background: 'var(--navy-900)' }}>
                {media.isVideo ? (
                  <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.url} alt={media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ padding: '0.75rem' }}>
                <div style={{ color: 'var(--white)', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.name.replace(/^\d+-/, '')}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{formatSize(media.size)}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{formatDate(media.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                  <button className={styles.btnIcon} title="Copiar URL" style={{ width: 28, height: 28, color: copied === media.name ? 'var(--success)' : undefined }} onClick={() => copyUrl(media.url, media.name)}>
                    <Icon name={copied === media.name ? 'check' : 'copy'} size={12} />
                  </button>
                  <button className={styles.btnIcon} title="Eliminar" style={{ width: 28, height: 28 }} onClick={() => remove(media.path)}>
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
