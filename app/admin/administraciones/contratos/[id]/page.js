'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
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
const PERIODICIDAD_MESES = { mensual: 1, bimestral: 2, trimestral: 3, cuatrimestral: 4, semestral: 6, anual: 12 };

// Estado vigente por fecha ('rescindido' es manual y se respeta).
function estadoVigente(c) {
  if (!c) return 'activo';
  if (c.estado === 'rescindido') return 'rescindido';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const fin = new Date(c.fecha_fin + 'T12:00:00');
  const dias = Math.ceil((fin - hoy) / 86400000);
  if (dias < 0) return 'vencido';
  if (dias <= 30) return 'proximo_a_vencer';
  return 'activo';
}

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

  // Registra una actualización calculada (persiste + refresca el monto vigente).
  async function registrarActualizacion(data) {
    const ok = confirm(
      `Registrar actualización al ${data.fecha}:\n` +
      `$ ${Number(data.monto_anterior).toLocaleString('es-AR')} → $ ${Number(data.monto_nuevo).toLocaleString('es-AR')} (${data.indice_usado}, +${data.aumento.toFixed(1)}%)\n\n` +
      `El monto vigente del contrato pasará a ser el nuevo valor.`
    );
    if (!ok) return;
    const { error } = await supabase.from('actualizaciones_contrato').insert({
      contrato_id: id,
      fecha: data.fecha,
      monto_anterior: data.monto_anterior,
      monto_nuevo: data.monto_nuevo,
      indice_usado: data.indice_usado,
      valor_indice_inicio: data.valor_indice_inicio,
      valor_indice_fin: data.valor_indice_fin,
    });
    if (error) return alert('Error al registrar: ' + error.message);
    const { data: acts } = await supabase.from('actualizaciones_contrato').select('*').eq('contrato_id', id).order('fecha', { ascending: false });
    setActualizaciones(acts || []);
    setActiveTab('General');
    alert('Actualización registrada. El monto vigente se actualizó.');
  }

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
              <Icon name="calendar" size={14} />
              {formatDate(contrato.fecha_inicio)} — {formatDate(contrato.fecha_fin)}
            </div>
            <div className={styles.detailMetaItem}>
              <Icon name="dollar" size={14} />
              {contrato.moneda} {montoActual.toLocaleString('es-AR')} / mes
            </div>
            {(() => { const est = estadoVigente(contrato); return (
              <span className={`${styles.badge} ${ESTADO_BADGE[est] || styles.badgeGray}`}>
                {ESTADO_LABEL[est] || est}
              </span>
            ); })()}
          </div>
        </div>
        <Link href={`/admin/administraciones/contratos/${id}/documento`} target="_blank" className={styles.btnPrimary}>
          <Icon name="file-text" size={16} />
          Generar contrato
        </Link>
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
              <div style={{ padding: '1rem', borderTop: '1px solid var(--admin-gold-08)', display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  href={contrato.contrato_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                >
                  <Icon name="download" size={16} />
                   Descargar Documento
                </a>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
              <div style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
                <Icon name="file-text" size={48} />
              </div>
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
          periodicidadMeses={PERIODICIDAD_MESES[contrato.periodicidad_ajuste] || 3}
          fechaInicioContrato={contrato.fecha_inicio}
          onRegistrar={registrarActualizacion}
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
