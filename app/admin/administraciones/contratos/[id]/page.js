'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';
import CalculadoraActualizacion from '@/components/admin/administraciones/CalculadoraActualizacion';
import CalculadoraHonorarios from '@/components/admin/administraciones/CalculadoraHonorarios';
import ExpensasPanel from '@/components/admin/administraciones/ExpensasPanel';
import ImpuestosPanel from '@/components/admin/administraciones/ImpuestosPanel';
import PagosPanel from '@/components/admin/administraciones/PagosPanel';
import LiquidacionPanel from '@/components/admin/administraciones/LiquidacionPanel';
import PortalTokenManager from '@/components/admin/administraciones/PortalTokenManager';

const TABS = ['Contrato', 'General', 'Pagos', 'Liquidación', 'Actualización', 'Honorarios', 'Expensas', 'Impuestos', 'Portal'];

const ESTADO_BADGE = {
  activo: styles.badgeGreen,
  proximo_a_vencer: styles.badgeYellow,
  vencido: styles.badgeRed,
  rescindido: styles.badgeGray,
};
const ESTADO_LABEL = {
  activo: 'Activo', proximo_a_vencer: 'Próx. vencer', vencido: 'Vencido', rescindido: 'Rescindido',
};

export default function ContratoDetailPage() {
  const { id } = useParams();
  const [contrato, setContrato] = useState(null);
  const [actualizaciones, setActualizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Contrato');

  useEffect(() => {
    async function fetchContrato() {
      const [{ data: c }, { data: acts }] = await Promise.all([
        supabase
          .from('contratos')
          .select('*, locador:clientes!contratos_locador_id_fkey(*), locatario:clientes!contratos_locatario_id_fkey(*), inmueble:inmuebles_administrados!contratos_inmueble_id_fkey(*)')
          .eq('id', id)
          .single(),
        supabase
          .from('actualizaciones_contrato')
          .select('*')
          .eq('contrato_id', id)
          .order('fecha', { ascending: false }),
      ]);

      setContrato(c);
      setActualizaciones(acts || []);
      setLoading(false);
    }
    fetchContrato();
  }, [id]);

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>Cargando contrato...</div>;
  }

  if (!contrato) {
    return (
      <div className={styles.emptyState}>
        <h3>Contrato no encontrado</h3>
        <Link href="/admin/administraciones/contratos" className={styles.btnSecondary} style={{ marginTop: '1rem', display: 'inline-flex' }}>
          Volver a Contratos
        </Link>
      </div>
    );
  }

  // Get the last updated amount or initial
  const lastUpdate = actualizaciones[0];
  const montoActual = lastUpdate ? Number(lastUpdate.monto_nuevo) : Number(contrato.monto_inicial);

  return (
    <>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Link href="/admin/administraciones/contratos" style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
              ← Contratos
            </Link>
          </div>
          <h2 className={styles.pageTitle}>{contrato.inmueble?.direccion || 'Contrato sin inmueble'}</h2>
          <div className={styles.detailMeta}>
            <div className={styles.detailMetaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(contrato.fecha_inicio)} — {formatDate(contrato.fecha_fin)}
            </div>
            <div className={styles.detailMetaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {contrato.moneda} {montoActual.toLocaleString('es-AR')} / mes
            </div>
            <span className={`${styles.badge} ${ESTADO_BADGE[contrato.estado] || styles.badgeGray}`}>
              {ESTADO_LABEL[contrato.estado] || contrato.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.sectionTabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.sectionTab} ${activeTab === tab ? styles.sectionTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Contrato' && (
        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
          {contrato.contrato_pdf_url ? (
            <>
              <iframe
                src={
                  contrato.contrato_pdf_url.toLowerCase().endsWith('.doc') || 
                  contrato.contrato_pdf_url.toLowerCase().endsWith('.docx') 
                    ? `https://docs.google.com/viewer?url=${encodeURIComponent(contrato.contrato_pdf_url)}&embedded=true`
                    : contrato.contrato_pdf_url
                }
                style={{ width: '100%', height: '70vh', border: 'none' }}
                title="Documento del Contrato"
              />
              <div style={{ padding: '1rem', borderTop: '1px solid rgba(201,169,110,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  href={contrato.contrato_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                   Descargar Documento
                </a>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p style={{ fontWeight: 500, color: 'var(--gray-400)' }}>No hay documento cargado para este contrato</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.375rem' }}>Editá el contrato para subir el archivo (PDF o Word)</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'General' && (
        <>
          {/* Parties cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Locador */}
            <div className={styles.card}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Locador (Propietario)</div>
              <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '1rem' }}>{contrato.locador?.nombre || '-'}</div>
              {contrato.locador && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                  {contrato.locador.telefono && <div>📞 {contrato.locador.telefono}</div>}
                  {contrato.locador.email && <div>✉️ {contrato.locador.email}</div>}
                  {contrato.locador.dni_cuit && <div>🆔 {contrato.locador.dni_cuit}</div>}
                </div>
              )}
            </div>

            {/* Locatario */}
            <div className={styles.card}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Locatario (Inquilino)</div>
              <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '1rem' }}>{contrato.locatario?.nombre || '-'}</div>
              {contrato.locatario && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                  {contrato.locatario.telefono && <div>📞 {contrato.locatario.telefono}</div>}
                  {contrato.locatario.email && <div>✉️ {contrato.locatario.email}</div>}
                  {contrato.locatario.dni_cuit && <div>🆔 {contrato.locatario.dni_cuit}</div>}
                </div>
              )}
            </div>

            {/* Contract Info */}
            <div className={styles.card}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Datos del Contrato</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-300)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div><strong>Monto inicial:</strong> {contrato.moneda} {Number(contrato.monto_inicial).toLocaleString('es-AR')}</div>
                <div><strong>Índice ajuste:</strong> {contrato.indice_ajuste}</div>
                <div><strong>Periodicidad:</strong> {contrato.periodicidad_ajuste}</div>
                <div><strong>Honorarios:</strong> {contrato.honorarios_porcentaje}% {contrato.honorarios_iva ? '+ IVA' : '(sin IVA)'}</div>
                {contrato.honorarios_notas && <div style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>{contrato.honorarios_notas}</div>}
              </div>
            </div>
          </div>

          {/* Update History */}
          {actualizaciones.length > 0 && (
            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>
                <h2 className={styles.tableTitle}>Historial de Actualizaciones</h2>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr><th>Fecha</th><th>Monto Anterior</th><th>Monto Nuevo</th><th>Índice</th><th>Variación</th></tr>
                </thead>
                <tbody>
                  {actualizaciones.map(a => {
                    const variacion = ((Number(a.monto_nuevo) / Number(a.monto_anterior)) - 1) * 100;
                    return (
                      <tr key={a.id}>
                        <td>{formatDate(a.fecha)}</td>
                        <td>$ {Number(a.monto_anterior).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 600, color: 'var(--white)' }}>$ {Number(a.monto_nuevo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td>{a.indice_usado}</td>
                        <td>
                          <span className={`${styles.badge} ${styles.badgeGreen}`}>+{variacion.toFixed(1)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {contrato.notas && (
            <div className={styles.card} style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Notas</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-300)' }}>{contrato.notas}</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'Actualización' && (
        <CalculadoraActualizacion
          montoBase={montoActual}
          indice={contrato.indice_ajuste}
        />
      )}

      {activeTab === 'Honorarios' && (
        <CalculadoraHonorarios
          montoAlquiler={montoActual}
          porcentaje={contrato.honorarios_porcentaje}
          iva={contrato.honorarios_iva}
        />
      )}

      {activeTab === 'Expensas' && (
        <ExpensasPanel
          contratoId={contrato.id}
          inmuebleId={contrato.inmueble_id}
        />
      )}

      {activeTab === 'Pagos' && (
        <PagosPanel
          contratoId={contrato.id}
          contrato={contrato}
        />
      )}

      {activeTab === 'Liquidación' && (
        <LiquidacionPanel
          contratoId={contrato.id}
          contrato={contrato}
        />
      )}

      {activeTab === 'Impuestos' && (
        <ImpuestosPanel
          inmuebleId={contrato.inmueble_id}
        />
      )}

      {activeTab === 'Portal' && (
        <PortalTokenManager
          contratoId={contrato.id}
          locatarioId={contrato.locatario_id}
          locadorId={contrato.locador_id}
        />
      )}
    </>
  );
}
