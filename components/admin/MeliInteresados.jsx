'use client';

/* Bandeja de Interesados de MercadoLibre.
   Fuente: preguntas que los compradores hacen en las publicaciones (meli_questions).
   Permite responder en MELI y volcar el interesado al Pipeline (oportunidades). */

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const MELI_STATUS = {
  UNANSWERED:        { label: 'Sin responder', badge: 'badgeGold' },
  ANSWERED:          { label: 'Respondida',    badge: 'badgeGray' },
  CLOSED_UNANSWERED: { label: 'Cerrada',       badge: 'badgeGray' },
  BANNED:            { label: 'Bloqueada',     badge: 'badgeGray' },
};

const formatDate = (s) => s ? new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
// El texto estándar de MELI es "Hola X, estoy interesado en <PROPIEDAD>, comunícate...".
const opToTipo = (op) => op === 'venta' ? 'venta' : 'alquiler'; // temporario/alquiler/null → alquiler salvo venta

export default function MeliInteresados() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('meli_questions')
      .select('*')
      .neq('crm_status', 'archivado')
      .order('date_created', { ascending: false });
    setRows(data || []);
    setLoading(false);
    return data || [];
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try { await fetch('/api/meli/questions/sync', { cache: 'no-store' }); } catch {}
    await load();
    setSyncing(false);
  }, [load]);

  // Carga inicial: muestra lo que haya en DB y dispara un sync en paralelo.
  useEffect(() => { load(); sync(); }, [load, sync]);

  const openRow = (r) => { setSelected(r); setAnswer(''); };

  const filtered = rows.filter(r =>
    !search ||
    r.item_title?.toLowerCase().includes(search.toLowerCase()) ||
    r.buyer_nickname?.toLowerCase().includes(search.toLowerCase()) ||
    r.text?.toLowerCase().includes(search.toLowerCase())
  );

  const sinResponder = rows.filter(r => r.status === 'UNANSWERED').length;

  const responder = async () => {
    if (!selected || !answer.trim() || busy) return;
    if (!confirm('Se publicará tu respuesta en MercadoLibre, visible públicamente en la publicación. ¿Confirmás?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/meli/questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: selected.id, text: answer.trim() }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'No se pudo responder');
      setAnswer('');
      const fresh = await load();
      setSelected(fresh.find(r => r.id === selected.id) || null);
    } catch (e) {
      alert('Error al responder: ' + e.message);
    } finally { setBusy(false); }
  };

  const volcarAPipeline = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const notas = [
        'Interesado desde MercadoLibre.',
        selected.item_title ? `Propiedad: ${selected.item_title}${selected.item_id ? ` (${selected.item_id})` : ''}` : null,
        selected.buyer_nickname ? `Comprador: ${selected.buyer_nickname}` : null,
        selected.text ? `Consulta: "${selected.text}"` : null,
        selected.item_permalink || null,
      ].filter(Boolean).join('\n');

      const { data: op, error: e1 } = await supabase.from('oportunidades').insert({
        tipo: opToTipo(selected.item_operation),
        etapa: 'consulta',
        origen: 'mercadolibre',
        meli_item_id: selected.item_id || null,
        titulo_propiedad: selected.item_title || null,
        contacto_nombre: selected.buyer_nickname || null,
        notas,
        fecha_consulta: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      }).select('id').single();
      if (e1) throw e1;

      const { error: e2 } = await supabase.from('meli_questions')
        .update({ crm_status: 'volcado', opportunity_id: op.id, updated_at: new Date().toISOString() })
        .eq('id', selected.id);
      if (e2) throw e2;

      const fresh = await load();
      setSelected(fresh.find(r => r.id === selected.id) || null);
    } catch (e) {
      alert('Error al volcar al pipeline: ' + e.message);
    } finally { setBusy(false); }
  };

  const archivar = async (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
    setSelected(null);
    await supabase.from('meli_questions').update({ crm_status: 'archivado', updated_at: new Date().toISOString() }).eq('id', id);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className={styles.searchBar} style={{ flex: 1 }}>
            <Icon name="search" size={16} />
            <input placeholder="Buscar propiedad, comprador o texto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={styles.btnSecondary} onClick={sync} disabled={syncing}>
            <Icon name="activity" size={14} />
            {syncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Interesado / Propiedad</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando interesados…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                {syncing ? 'Sincronizando con MercadoLibre…' : 'No hay interesados para mostrar'}
              </td></tr>
            ) : filtered.map(r => {
              const st = MELI_STATUS[r.status] || { label: r.status || '—', badge: 'badgeGray' };
              const isNew = r.status === 'UNANSWERED';
              return (
                <tr key={r.id} onClick={() => openRow(r)} style={{ cursor: 'pointer', background: selected?.id === r.id ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <td>
                    <div style={{ color: isNew ? 'var(--white)' : 'var(--gray-300)', fontWeight: isNew ? 600 : 400 }}>
                      {r.item_title || r.item_id || 'Publicación'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                      {r.buyer_nickname || 'Comprador'}{r.crm_status === 'volcado' ? ' · en pipeline' : ''}
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{formatDate(r.date_created)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[st.badge]}`}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ color: 'var(--white)', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Interesado de MercadoLibre</h3>
              <p style={{ color: 'var(--gray-400)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {selected.buyer_nickname || 'Comprador'} · {formatDate(selected.date_created)}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className={styles.btnIcon}><Icon name="x" size={14} /></button>
          </div>

          <div style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>Propiedad</span>
            <div style={{ color: 'var(--admin-gold)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              {selected.item_title || selected.item_id || '—'}
              {selected.item_permalink && (
                <a href={selected.item_permalink} target="_blank" rel="noreferrer" style={{ color: 'var(--gray-400)', display: 'inline-flex' }}>
                  <Icon name="external-link" size={13} />
                </a>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem', color: 'var(--gray-300)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
            {selected.text}
          </div>

          {selected.answer_text ? (
            <div style={{ borderLeft: '3px solid var(--admin-gold)', paddingLeft: '0.9rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Tu respuesta</div>
              <div style={{ color: 'var(--gray-300)', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.answer_text}</div>
            </div>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>Responder en MercadoLibre</label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={3}
                placeholder="Escribí tu respuesta. Se publica en la publicación, visible para todos."
                style={{ width: '100%', marginTop: '0.4rem', padding: '0.7rem 0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'var(--white)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              />
              <button className={styles.btnPrimary} style={{ marginTop: '0.5rem' }} onClick={responder} disabled={busy || !answer.trim()}>
                <Icon name="send" size={14} /> {busy ? 'Enviando…' : 'Responder'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            {selected.crm_status === 'volcado' ? (
              <span className={`${styles.badge} ${styles.badgeGold}`} style={{ alignSelf: 'center' }}>Ya está en el Pipeline</span>
            ) : (
              <button className={styles.btnPrimary} onClick={volcarAPipeline} disabled={busy}>
                <Icon name="activity" size={14} /> Volcar al Pipeline
              </button>
            )}
            <button className={styles.btnSecondary} onClick={() => archivar(selected.id)} disabled={busy}>Archivar</button>
          </div>
        </div>
      )}
    </div>
  );
}
