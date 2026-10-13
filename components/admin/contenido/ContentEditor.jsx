'use client';
import { useEffect, useMemo, useState } from 'react';
import styles from '@/components/admin/admin.module.css';
import { getSiteContent, saveSiteContent } from '@/lib/siteContent';
import { cleanStringArrays } from '@/lib/content/defaults';
import { CATEGORIES, FIELDS } from './fields';
import ContentCategorySidebar from './ContentCategorySidebar';
import FieldGroup from './FieldGroup';
import ColorEditor from './ColorEditor';
import MediaUploader from './MediaUploader';
import LivePreview from './LivePreview';
import Toast from './Toast';

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, val) {
  const keys = path.split('.');
  const copy = structuredClone(obj);
  let cur = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = val;
  return copy;
}

export default function ContentEditor() {
  const [draft, setDraft] = useState(null); // { content, theme }
  const [saved, setSaved] = useState(null);
  const [active, setActive] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getSiteContent('cardoso').then((d) => {
      setDraft(d);
      setSaved(d);
      setLoading(false);
    });
  }, []);

  const isDirty = useMemo(
    () => draft && saved && JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved]
  );

  // Aviso del navegador si hay cambios sin guardar al intentar salir.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const dirtyKeys = useMemo(() => {
    const s = new Set();
    if (!draft || !saved) return s;
    for (const cat of CATEGORIES) {
      let a, b;
      if (cat.key === 'colors') {
        a = draft.theme.colors; b = saved.theme.colors;
      } else if (cat.key === 'media') {
        a = draft.theme.media; b = saved.theme.media;
      } else {
        a = draft.content[cat.key]; b = saved.content[cat.key];
      }
      if (JSON.stringify(a) !== JSON.stringify(b)) s.add(cat.key);
    }
    return s;
  }, [draft, saved]);

  if (loading || !draft) return <div className={styles.card}>Cargando contenido…</div>;

  const cat = CATEGORIES.find((c) => c.key === active);
  const def = FIELDS[active] || {};
  const update = (scope, path, val) =>
    setDraft((d) => ({ ...d, [scope]: setPath(d[scope], path, val) }));

  const listItems = def.listPath ? getPath(draft[cat.scope], def.listPath) || [] : [];

  async function handleSave() {
    setSaving(true);
    // Limpia strings vacíos de listas (ej. rotatingWords) antes de persistir.
    const cleanContent = cleanStringArrays(draft.content);
    const payload = { content: cleanContent, theme: draft.theme };
    const res = await saveSiteContent('cardoso', payload);
    setSaving(false);
    if (res.ok) {
      setDraft(payload);
      setSaved(payload);
      setToast({ type: 'success', message: 'Cambios guardados ✓' });
    } else {
      setToast({ type: 'error', message: `No se pudo guardar: ${res.error}` });
    }
  }
  function handleDiscard() {
    setDraft(saved);
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          {isDirty ? (
            <span className={styles.dirtyBadge}>● Cambios sin guardar</span>
          ) : (
            <span className={styles.fieldDesc}>Todo guardado</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isDirty && (
            <button className={styles.btnGhost} onClick={handleDiscard} disabled={saving}>
              Descartar
            </button>
          )}
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'Guardando…' : 'Guardar Todo'}
          </button>
        </div>
      </div>

      <div className={styles.editorLayout}>
        <ContentCategorySidebar active={active} onSelect={setActive} dirtyKeys={dirtyKeys} />

        <div className={styles.editorForm}>
          {def.intro && <p className={styles.fieldDesc} style={{ marginBottom: '1rem' }}>{def.intro}</p>}

          {/* Campos simples */}
          {(def.fields || []).map((f) => (
            <FieldGroup
              key={f.path}
              field={f}
              value={getPath(draft[cat.scope], f.path)}
              onChange={(v) => update(cat.scope, f.path, v)}
            />
          ))}

          {/* Ítems repetidos (stats, values, operations) */}
          {def.listPath &&
            listItems.map((item, i) => (
              <div key={i} className={styles.itemBlock}>
                <div className={styles.itemBlockTitle}>{def.itemLabel} {i + 1}</div>
                {def.itemFields.map((f) => (
                  <FieldGroup
                    key={f.key}
                    field={f}
                    value={item[f.key]}
                    onChange={(v) => update(cat.scope, `${def.listPath}.${i}.${f.key}`, v)}
                  />
                ))}
              </div>
            ))}

          {/* Secciones especiales */}
          {def.special === 'colors' && (
            <ColorEditor
              colors={draft.theme.colors}
              onChange={(k, hex) => update('theme', `colors.${k}`, hex)}
            />
          )}
          {def.special === 'media' && (
            <MediaUploader
              value={draft.theme.media.heroVideo}
              onChange={(url) => update('theme', 'media.heroVideo', url)}
            />
          )}
        </div>

        <div className={styles.editorPreview}>
          <LivePreview category={active} content={draft.content} theme={draft.theme} />
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
