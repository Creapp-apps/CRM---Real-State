'use client';

import { useState, useEffect } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

export default function AdminContacto() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  // Fetch messages on mount
  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('message_type', 'contacto')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    }
    fetchMessages();
  }, []);

  // Mark as read when selected
  const handleSelectMessage = async (msg) => {
    setSelected(msg);
    if (!msg.is_read) {
      // Optimistic update
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      // Supabase update
      await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
    }
  };

  const archiveMessage = async (id) => {
    // Optimistic remove
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelected(null);
    // Supabase update
    await supabase.from('messages').update({ is_archived: true }).eq('id', id);
  };

  const filtered = messages.filter(m =>
    m.is_archived !== true && (
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const statusLabels = { new: 'Nuevo', read: 'Leído' };
  const statusColors = { new: 'Green', read: 'Gray' };

  // Helper formatting for timeframe
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Mensajes de Contacto</h2>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando...' : `${messages.filter(m => !m.is_read && !m.is_archived).length} mensajes nuevos`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.searchBar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input placeholder="Buscar remitente o email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Remitente</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem', color: 'var(--gray-500)'}}>Cargando mensajes...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem', color: 'var(--gray-500)'}}>No hay mensajes para mostrar</td></tr>
              ) : (
                filtered.map(m => {
                  const status = m.is_read ? 'read' : 'new';
                  return (
                    <tr key={m.id} onClick={() => handleSelectMessage(m)} style={{ cursor: 'pointer', background: selected?.id === m.id ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td>
                        <div style={{ color: status === 'new' ? 'var(--white)' : 'var(--gray-400)', fontWeight: status === 'new' ? 600 : 400 }}>{m.full_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{m.email}</div>
                      </td>
                      <td style={{ color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{formatDate(m.created_at)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${statusColors[status]}`]}`}>
                          {statusLabels[status]}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--white)', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Mensaje de Contacto</h3>
                <p style={{ color: 'var(--gray-400)', fontSize: '0.8rem', marginTop: '0.25rem' }}>De: {selected.full_name} · {formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className={styles.btnIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</span>
                <div style={{ color: 'var(--gold)', marginTop: '0.25rem' }}>{selected.email}</div>
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>Teléfono</span>
                <div style={{ color: 'var(--white)', marginTop: '0.25rem' }}>{selected.phone || 'No especificado'}</div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem', color: 'var(--gray-300)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
              {selected.message}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href={`mailto:${selected.email}?subject=Re: Consulta a Cardoso Propiedades`} className={styles.btnPrimary}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                Responder
              </a>
              <button className={styles.btnSecondary} onClick={() => archiveMessage(selected.id)}>Archivar</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
