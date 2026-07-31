'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from './portal.module.css';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatPeriodo(p) {
  if (!p) return '-';
  const [y, m] = p.split('-');
  return `${MESES[parseInt(m) - 1]} ${y}`;
}

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function PortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    if (token) fetchPortal(token);
    else setLoading(false);
  }, [token]);

  const fetchPortal = async (t) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/portal?token=${t}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      window.location.href = `/portal?token=${manualToken.trim()}`;
    }
  };

  // Login screen
  if (!token && !loading) {
    return (
      <div className={styles.portalBody}>
        <div className={styles.portalLogin}>
          <div className={styles.portalLoginCard}>
            <div className={styles.portalLogo}>CARDOSO PROPIEDADES</div>
            <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Portal del Inquilino</h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Ingresá tu código de acceso para consultar tu cuenta</p>
            <form onSubmit={handleLogin}>
              <input
                className={styles.portalLoginInput}
                type="text"
                placeholder="Código de acceso"
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                required
              />
              <button className={styles.portalLoginBtn} type="submit">Ingresar</button>
            </form>
            <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '1.5rem' }}>
              Si no tenés tu código, contactá a la administración.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className={styles.portalBody}>
        <div className={styles.portalContainer} style={{ textAlign: 'center', paddingTop: '20vh' }}>
          <div className={styles.portalLogo}>CARDOSO PROPIEDADES</div>
          <p style={{ color: '#888', marginTop: '1rem' }}>Cargando tu portal...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={styles.portalBody}>
        <div className={styles.portalLogin}>
          <div className={styles.portalLoginCard}>
            <div className={styles.portalLogo}>CARDOSO PROPIEDADES</div>
            <h2 style={{ color: '#f87171', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Acceso Denegado</h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{error}</p>
            <a href="/portal" className={styles.portalLoginBtn} style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>Reintentar</a>
          </div>
        </div>
      </div>
    );
  }

  const { contrato, pagos, tipo } = data;
  const inmueble = contrato?.inmueble;
  const pagoPendiente = pagos?.find(p => p.estado === 'pendiente' || p.estado === 'mora');
  const pagosPagados = pagos?.filter(p => p.estado === 'pagado') || [];

  // Calculate current total to pay
  const montoActual = Number(contrato?.monto_inicial || 0);
  const hasMora = pagoPendiente && pagoPendiente.fecha_vencimiento && new Date(pagoPendiente.fecha_vencimiento + 'T12:00:00') < new Date();
  const diasMora = pagoPendiente?.fecha_vencimiento
    ? Math.max(0, Math.floor((new Date() - new Date(pagoPendiente.fecha_vencimiento + 'T12:00:00')) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className={styles.portalBody}>
      <div className={styles.portalContainer}>
        {/* Header */}
        <div className={styles.portalHeader}>
          <div className={styles.portalLogo}>CARDOSO PROPIEDADES</div>
          <h1 className={styles.portalTitle}>{inmueble?.direccion || 'Mi Alquiler'}</h1>
          <p className={styles.portalSubtitle}>
            {tipo === 'inquilino' ? 'Portal del Inquilino' : 'Portal del Propietario'}
            {' · '}{contrato?.locatario?.nombre}
          </p>
        </div>

        {/* Current Amount */}
        <div className={styles.portalHighlight}>
          <div className={styles.portalHighlightLabel}>Alquiler Actual</div>
          <div className={styles.portalHighlightValue}>
            $ {formatCurrency(montoActual)}
          </div>
          <div className={styles.portalHighlightSub}>
            {contrato?.moneda} / mes · Ajuste {contrato?.periodicidad_ajuste} por {contrato?.indice_ajuste}
          </div>
        </div>

        {/* Alert if mora */}
        {hasMora && (
          <div style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>Pago en mora — {diasMora} días</div>
              <div style={{ color: '#888', fontSize: '0.8rem' }}>
                Período {formatPeriodo(pagoPendiente.periodo)} · Vencimiento: {formatDate(pagoPendiente.fecha_vencimiento)}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className={styles.portalStatsRow}>
          <div className={styles.portalStat}>
            <div className={styles.portalStatLabel}>Contrato</div>
            <div className={styles.portalStatValue} style={{ fontSize: '0.85rem' }}>
              {formatDate(contrato?.fecha_inicio)} — {formatDate(contrato?.fecha_fin)}
            </div>
          </div>
          <div className={styles.portalStat}>
            <div className={styles.portalStatLabel}>Pagos Realizados</div>
            <div className={styles.portalStatValue}>{pagosPagados.length}</div>
          </div>
          <div className={styles.portalStat}>
            <div className={styles.portalStatLabel}>Estado</div>
            <div className={styles.portalStatValue} style={{ color: contrato?.estado === 'activo' ? '#4ade80' : '#fbbf24' }}>
              {contrato?.estado === 'activo' ? '✓ Activo' : contrato?.estado}
            </div>
          </div>
        </div>

        {/* Next Payment */}
        {pagoPendiente && (
          <div className={styles.portalSection}>
            <div className={styles.portalSectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              Próximo Pago
            </div>
            <div className={styles.portalCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{formatPeriodo(pagoPendiente.periodo)}</span>
                <span className={`${styles.portalBadge} ${hasMora ? styles.portalBadgeRed : styles.portalBadgeYellow}`}>
                  {hasMora ? `En Mora (${diasMora} días)` : 'Pendiente'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Alquiler</span>
                  <span style={{ color: '#fff' }}>$ {formatCurrency(pagoPendiente.monto_alquiler)}</span>
                </div>
                {Number(pagoPendiente.monto_expensas) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expensas</span>
                    <span style={{ color: '#fff' }}>$ {formatCurrency(pagoPendiente.monto_expensas)}</span>
                  </div>
                )}
                {Number(pagoPendiente.monto_impuestos) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Impuestos</span>
                    <span style={{ color: '#fff' }}>$ {formatCurrency(pagoPendiente.monto_impuestos)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ color: '#c9a96e' }}>Total a Abonar</span>
                  <span style={{ color: '#c9a96e', fontSize: '1.1rem' }}>
                    $ {formatCurrency(Number(pagoPendiente.monto_alquiler || 0) + Number(pagoPendiente.monto_expensas || 0) + Number(pagoPendiente.monto_impuestos || 0))}
                  </span>
                </div>
              </div>
              {pagoPendiente.fecha_vencimiento && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#888' }}>
                  Vencimiento: {formatDate(pagoPendiente.fecha_vencimiento)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className={styles.portalSection}>
          <div className={styles.portalSectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Historial de Pagos
          </div>
          {pagos?.length > 0 ? (
            <div className={styles.portalCard} style={{ padding: 0, overflow: 'hidden' }}>
              <table className={styles.portalTable}>
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Monto</th>
                    <th>Fecha Pago</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{formatPeriodo(p.periodo)}</td>
                      <td>$ {formatCurrency(p.monto_total || p.monto_alquiler)}</td>
                      <td>{p.fecha_pago ? formatDate(p.fecha_pago) : '-'}</td>
                      <td>
                        <span className={`${styles.portalBadge} ${p.estado === 'pagado' ? styles.portalBadgeGreen : p.estado === 'mora' ? styles.portalBadgeRed : styles.portalBadgeYellow}`}>
                          {p.estado === 'pagado' ? 'Pagado' : p.estado === 'mora' ? 'Mora' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.portalCard} style={{ textAlign: 'center', color: '#888' }}>
              No hay pagos registrados aún
            </div>
          )}
        </div>

        {/* Contract PDF */}
        {contrato?.contrato_pdf_url && (
          <div className={styles.portalSection}>
            <div className={styles.portalSectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Contrato
            </div>
            <div className={styles.portalCard} style={{ textAlign: 'center' }}>
              <a href={contrato.contrato_pdf_url} target="_blank" rel="noopener noreferrer" className={styles.portalBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar Contrato PDF
              </a>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className={styles.portalSection}>
          <div className={styles.portalSectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
            </svg>
            Contacto
          </div>
          <div className={styles.portalCard}>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Para consultas sobre tu alquiler, contactanos:</p>
            <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Cardoso Propiedades</p>
            <p style={{ fontSize: '0.8rem', color: '#888' }}>Administración de Alquileres</p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.portalFooter}>
          Cardoso Propiedades © {new Date().getFullYear()} · Portal del Inquilino
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className={styles.portalBody}>
        <div className={styles.portalContainer} style={{ textAlign: 'center', paddingTop: '20vh' }}>
          <p style={{ color: '#888' }}>Cargando...</p>
        </div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
