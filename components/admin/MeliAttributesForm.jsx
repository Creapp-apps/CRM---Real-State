'use client';
import { useEffect, useState } from 'react';
import Icon from '@/components/admin/Icon';

/* ─── Estilos (calcan los del wizard) ─────────────────────────────────── */
const lbl = { display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' };
const inp = { width: '100%', padding: '0.625rem 0.875rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
const sel = { ...inp, background: '#0d1f3c', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.25rem' };
const opt = { background: '#0d1f3c', color: '#e5e7eb' };
const hintS = { fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem', display: 'block' };

/* ─── Helpers de payload/validación (los usa el wizard al publicar) ───── */

// Convierte los valores del form al formato `attributes` de MELI.
export function buildMeliAttributes(values, byId) {
  const out = [];
  for (const [id, v] of Object.entries(values || {})) {
    const a = byId?.[id];
    if (!a) continue;
    if (a.valueType === 'number_unit') {
      const num = v?.num;
      if (num === '' || num == null) continue;
      out.push({ id, value_name: `${num} ${v.unit || a.defaultUnit || ''}`.trim() });
    } else {
      if (v === '' || v == null) continue;
      if (a.valueType === 'list') out.push({ id, value_id: v });
      else out.push({ id, value_name: String(v) }); // boolean / number / string
    }
  }
  return out;
}

// IDs de atributos requeridos sin completar.
export function missingRequired(values, byId) {
  const miss = [];
  for (const a of Object.values(byId || {})) {
    if (!a.required) continue;
    const v = values?.[a.id];
    const empty = a.valueType === 'number_unit' ? (v?.num === '' || v?.num == null) : (v === '' || v == null);
    if (empty) miss.push(a.id);
  }
  return miss;
}

/* ─── Input por tipo ──────────────────────────────────────────────────── */
function Field({ attr, value, onChange }) {
  const id = attr.id;
  if (attr.valueType === 'boolean') {
    return (
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {['Sí', 'No'].map(o => (
          <button key={o} type="button" onClick={() => onChange(id, value === o ? '' : o)}
            style={{ flex: 1, padding: '0.55rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: value === o ? 'var(--admin-gold-15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${value === o ? 'var(--admin-gold)' : 'rgba(255,255,255,0.1)'}`,
              color: value === o ? 'var(--admin-gold)' : 'var(--gray-300)' }}>
            {o}
          </button>
        ))}
      </div>
    );
  }
  if (attr.valueType === 'list') {
    return (
      <select style={sel} value={value || ''} onChange={e => onChange(id, e.target.value)}>
        <option style={opt} value="">Elegir</option>
        {attr.values.map(v => <option key={v.id} style={opt} value={v.id}>{v.name}</option>)}
      </select>
    );
  }
  if (attr.valueType === 'number_unit') {
    const cur = value || { num: '', unit: attr.defaultUnit || '' };
    return (
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input style={{ ...inp, flex: 1 }} type="number" inputMode="decimal" value={cur.num}
          onChange={e => onChange(id, { num: e.target.value, unit: cur.unit || attr.defaultUnit || '' })} />
        {attr.units.length > 1 ? (
          <select style={{ ...sel, width: 'auto' }} value={cur.unit || attr.defaultUnit || ''}
            onChange={e => onChange(id, { num: cur.num, unit: e.target.value })}>
            {attr.units.map(u => <option key={u.id} style={opt} value={u.id}>{u.name}</option>)}
          </select>
        ) : (
          <span style={{ ...inp, width: 'auto', color: 'var(--gray-400)', display: 'flex', alignItems: 'center' }}>{attr.defaultUnit || attr.units[0]?.name || ''}</span>
        )}
      </div>
    );
  }
  // number / string
  return (
    <input style={inp} type={attr.valueType === 'number' ? 'number' : 'text'}
      inputMode={attr.valueType === 'number' ? 'numeric' : undefined}
      maxLength={attr.maxLength || undefined}
      value={value || ''} onChange={e => onChange(id, e.target.value)} />
  );
}

/* ─── Componente ──────────────────────────────────────────────────────── */
export default function MeliAttributesForm({ categoryId, values, onChange, onSchemaLoaded }) {
  const [state, setState] = useState({ loading: false, error: null, groups: [] });
  const [open, setOpen] = useState({}); // grupos expandidos

  useEffect(() => {
    if (!categoryId) return;
    let cancel = false;
    setState({ loading: true, error: null, groups: [] });
    fetch(`/api/meli/attributes?category=${categoryId}`)
      .then(r => r.json())
      .then(d => {
        if (cancel) return;
        if (d.error) { setState({ loading: false, error: d.error, groups: [] }); return; }
        setState({ loading: false, error: null, groups: d.groups });
        // Índice por id + leaf, para que el wizard arme el payload y use el leaf correcto.
        const byId = {};
        d.groups.forEach(g => g.attributes.forEach(a => { byId[a.id] = a; }));
        onSchemaLoaded?.({ leafId: d.leafId, byId });
        // Abrir por defecto los grupos con requeridos.
        const initOpen = {};
        d.groups.forEach(g => { initOpen[g.name] = g.attributes.some(a => a.required); });
        setOpen(initOpen);
      })
      .catch(e => { if (!cancel) setState({ loading: false, error: e.message, groups: [] }); });
    return () => { cancel = true; };
  }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (id, v) => onChange({ ...values, [id]: v });

  if (state.loading) return <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Cargando campos de MercadoLibre…</p>;
  if (state.error) return <p style={{ color: '#f87171', fontSize: '0.85rem' }}>No se pudieron cargar los campos: {state.error}</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {state.groups.map(group => {
        const isOpen = open[group.name];
        const reqCount = group.attributes.filter(a => a.required).length;
        return (
          <div key={group.name} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.6rem', overflow: 'hidden' }}>
            <button type="button" onClick={() => setOpen(o => ({ ...o, [group.name]: !o[group.name] }))}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', color: 'var(--white)', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>{group.name} {reqCount > 0 && <span style={{ color: 'var(--admin-gold)', fontSize: '0.72rem', fontWeight: 500 }}>· {reqCount} requerido{reqCount > 1 ? 's' : ''}</span>}</span>
              <Icon name="chevron-down" size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--gray-400)' }} />
            </button>
            {isOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '1rem' }}>
                {group.attributes.map(attr => (
                  <div key={attr.id}>
                    <label style={lbl}>
                      {attr.name}
                      {attr.required && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}
                    </label>
                    <Field attr={attr} value={values[attr.id]} onChange={set} />
                    {attr.hint && <span style={hintS}>{attr.hint}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
