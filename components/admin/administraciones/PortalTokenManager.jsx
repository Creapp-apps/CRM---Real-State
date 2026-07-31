'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function PortalTokenManager({ contratoId, locatarioId, locadorId }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  const fetchTokens = useCallback(async () => {
    const { data } = await supabase
      .from('portal_tokens')
      .select('*, cliente:clientes(nombre)')
      .eq('contrato_id', contratoId)
      .order('created_at', { ascending: false });
    setTokens(data || []);
    setLoading(false);
  }, [contratoId]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const createToken = async (tipo, clienteId) => {
    const token = generateToken();
    const { error } = await supabase.from('portal_tokens').insert({
      contrato_id: contratoId,
      cliente_id: clienteId,
      tipo,
      token,
    });
    if (error) return alert('Error: ' + error.message);
    fetchTokens();
  };

  const toggleActive = async (id, activo) => {
    await supabase.from('portal_tokens').update({ activo: !activo }).eq('id', id);
    fetchTokens();
  };

  const deleteToken = async (id) => {
    if (!confirm('¿Eliminar este acceso?')) return;
    await supabase.from('portal_tokens').delete().eq('id', id);
    fetchTokens();
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/portal?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(''), 2000);
  };

  const inquilinoToken = tokens.find(t => t.tipo === 'inquilino' && t.activo);
  const propietarioToken = tokens.find(t => t.tipo === 'propietario' && t.activo);

  return (
    <div>
      {/* Quick Create */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {!inquilinoToken && locatarioId && (
          <button className={styles.btnPrimary} onClick={() => createToken('inquilino', locatarioId)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Crear Acceso Inquilino
          </button>
        )}
        {!propietarioToken && locadorId && (
          <button className={styles.btnSecondary} onClick={() => createToken('propietario', locadorId)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Crear Acceso Propietario
          </button>
        )}
      </div>

      {/* Active Tokens */}
      {loading ? (
        <p style={{ color: 'var(--gray-500)' }}>Cargando...</p>
      ) : tokens.length === 0 ? (
        <div className={styles.card} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p>No hay accesos de portal creados</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Creá un acceso para que el inquilino o propietario puedan consultar su cuenta</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tokens.map(t => (
            <div key={t.id} className={styles.card} style={{ padding: '1rem', opacity: t.activo ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`${styles.badge} ${t.tipo === 'inquilino' ? styles.badgeBlue : styles.badgeGold}`}>
                    {t.tipo === 'inquilino' ? '🏠 Inquilino' : '🏛️ Propietario'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--white)', fontWeight: 600 }}>{t.cliente?.nombre}</span>
                  {!t.activo && <span className={`${styles.badge} ${styles.badgeRed}`}>Desactivado</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className={styles.btnIcon} onClick={() => copyLink(t.token)} title="Copiar link" style={{ color: copied === t.token ? '#4ade80' : 'var(--gold)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {copied === t.token ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
                      )}
                    </svg>
                  </button>
                  <button className={styles.btnIcon} onClick={() => toggleActive(t.id, t.activo)} title={t.activo ? 'Desactivar' : 'Activar'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {t.activo ? (
                        <><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></>
                      ) : (
                        <><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></>
                      )}
                    </svg>
                  </button>
                  <button className={styles.btnIcon} onClick={() => deleteToken(t.id)} title="Eliminar" style={{ color: '#f87171' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'flex', gap: '1rem' }}>
                <span>Token: <code style={{ color: 'var(--gray-400)' }}>{t.token.slice(0, 8)}...</code></span>
                {t.ultimo_acceso && <span>Último acceso: {new Date(t.ultimo_acceso).toLocaleDateString('es-AR')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
