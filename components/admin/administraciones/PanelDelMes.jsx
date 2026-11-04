'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import { fetchContratosGrilla } from '@/lib/admin-fetchers';
import {
  filaGrilla, estaVigente, totalesPorMoneda,
  mesesActualizacion, estadoActualizacion,
} from '@/lib/administraciones-calc';

const ESTADO_BADGE = {
  activo: styles.badgeGreen,
  proximo_a_vencer: styles.badgeYellow,
  vencido: styles.badgeRed,
  rescindido: styles.badgeGray,
};
const ESTADO_LABEL = {
  activo: 'Activo',
  proximo_a_vencer: 'Próx. vencer',
  vencido: 'Vencido',
  rescindido: 'Rescindido',
};

const PREFIJO = { ARS: '$', USD: 'US$' };

function money(moneda, value, { decimales = false } = {}) {
  const n = Number(value || 0);
  return `${PREFIJO[moneda] || '$'} ${n.toLocaleString('es-AR', {
    minimumFractionDigits: decimales ? 2 : 0,
    maximumFractionDigits: decimales ? 2 : 0,
  })}`;
}

function formatDate(d) {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Número para CSV abrible en Excel es-AR: coma decimal, sin separador de miles.
function csvNum(n) {
  return Number(n || 0).toLocaleString('es-AR', { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function descargarCSV(filas, totales, hayUSD) {
  const cols = ['Inmueble', 'Locador', 'CUIT Locador', 'Locatario', 'CUIT Locatario', 'Moneda',
    'Alquiler vigente', 'Hon %', 'Hon $', 'Neto Prop', 'Inicio', 'Vto', 'Próx actualización', 'Meses actualización', 'Estado'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [cols.map(esc).join(';')];
  for (const f of filas) {
    lines.push([
      f.inmueble?.direccion || '', f.locador?.nombre || '', f.locador?.dni_cuit || '',
      f.locatario?.nombre || '', f.locatario?.dni_cuit || '', f.moneda,
      csvNum(f.alquilerVigente), Number(f.honorarios_porcentaje || 0), csvNum(f.honorarios), csvNum(f.netoPropietario),
      formatDate(f.fecha_inicio), formatDate(f.fecha_fin), formatDate(f.proximaActualizacion),
      mesesActualizacion(f).join('/'), ESTADO_LABEL[f.estadoCalculado] || f.estadoCalculado,
    ].map(esc).join(';'));
  }
  lines.push('');
  lines.push([esc('TOTAL honorarios ARS'), esc(csvNum(totales.ARS.honorarios)), esc('Neto ARS'), esc(csvNum(totales.ARS.neto))].join(';'));
  if (hayUSD) lines.push([esc('TOTAL honorarios USD'), esc(csvNum(totales.USD.honorarios)), esc('Neto USD'), esc(csvNum(totales.USD.neto))].join(';'));

  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const hoy = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `administraciones-${hoy}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PanelDelMes() {
  const { data: contratos = [], isLoading: loading } = useSWR('contratos-grilla', fetchContratosGrilla);
  const [query, setQuery] = useState('');
  const [verMas, setVerMas] = useState(false);

  // Solo contratos vigentes (generan honorarios este mes), calculados por fecha.
  const filasMes = useMemo(
    () => contratos.filter(c => estaVigente(c)).map(c => filaGrilla(c)),
    [contratos]
  );

  const q = query.trim().toLowerCase();
  const filas = useMemo(() => {
    if (!q) return filasMes;
    return filasMes.filter(f =>
      (f.inmueble?.direccion || '').toLowerCase().includes(q) ||
      (f.locador?.nombre || '').toLowerCase().includes(q) ||
      (f.locatario?.nombre || '').toLowerCase().includes(q)
    );
  }, [filasMes, q]);

  // D3: totales sobre las filas visibles (filtradas) + total del mes completo como referencia.
  const totales = useMemo(() => totalesPorMoneda(filas), [filas]);
  const totalesMes = useMemo(() => totalesPorMoneda(filasMes), [filasMes]);
  const hayUSD = totalesMes.USD.count > 0;
  const filtrando = q.length > 0;

  const totalCols = 11 + (verMas ? 3 : 0);

  return (
    <div className={styles.tableWrapper} style={{ marginBottom: '1.5rem' }}>
      <div className={styles.tableHeader}>
        <div>
          <h2 className={styles.tableTitle}>Panel del mes</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
            {loading ? 'Cargando...' : `${filas.length}${filtrando ? ` de ${filasMes.length}` : ''} contratos vigentes`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={styles.searchBar} style={{ minWidth: 220 }}>
            <Icon name="search" size={14} />
            <input
              type="text"
              placeholder="Buscar inmueble, locador o inquilino…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className={styles.btnSecondary} onClick={() => setVerMas(v => !v)}>
            <Icon name={verMas ? 'minus' : 'plus'} size={16} />
            {verMas ? 'Ver menos' : 'Ver más'}
          </button>
          <button className={styles.btnSecondary} onClick={() => descargarCSV(filas, totales, hayUSD)} disabled={filas.length === 0}>
            <Icon name="download" size={16} />
            CSV
          </button>
        </div>
      </div>

      {/* KPI "Tu ganancia este mes" — honorarios por moneda, sin mezclar */}
      <div className={styles.statsGrid} style={{ marginBottom: '1.25rem' }}>
        <div className={`${styles.summaryCard} ${styles.summaryCardGold}`}>
          <div className={styles.summaryCardLabel}>Tu ganancia {filtrando ? '(filtrado)' : 'este mes'} · ARS</div>
          <div className={styles.summaryCardValue}>{money('ARS', totales.ARS.honorarios, { decimales: true })}</div>
          {filtrando && (
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
              Mes completo: {money('ARS', totalesMes.ARS.honorarios, { decimales: true })}
            </div>
          )}
        </div>
        {hayUSD && (
          <div className={`${styles.summaryCard} ${styles.summaryCardGold}`}>
            <div className={styles.summaryCardLabel}>Tu ganancia {filtrando ? '(filtrado)' : 'este mes'} · USD</div>
            <div className={styles.summaryCardValue}>{money('USD', totales.USD.honorarios, { decimales: true })}</div>
            {filtrando && (
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                Mes completo: {money('USD', totalesMes.USD.honorarios, { decimales: true })}
              </div>
            )}
          </div>
        )}
        <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
          <div className={styles.summaryCardLabel}>Neto a propietarios · ARS</div>
          <div className={styles.summaryCardValue}>{money('ARS', totales.ARS.neto, { decimales: true })}</div>
        </div>
        {hayUSD && (
          <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
            <div className={styles.summaryCardLabel}>Neto a propietarios · USD</div>
            <div className={styles.summaryCardValue}>{money('USD', totales.USD.neto, { decimales: true })}</div>
          </div>
        )}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Inmueble</th>
            <th>Locador</th>
            <th>Locatario</th>
            <th style={{ textAlign: 'right' }}>Alquiler vigente</th>
            <th style={{ textAlign: 'right' }}>Hon. %</th>
            <th style={{ textAlign: 'right' }}>Hon. $</th>
            <th style={{ textAlign: 'right' }}>Neto Prop.</th>
            <th>Inicio</th>
            <th>Vto</th>
            <th>Próx. actualización</th>
            <th>Estado</th>
            {verMas && <th>CUIT Locador</th>}
            {verMas && <th>CUIT Locatario</th>}
            {verMas && <th>Meses actualiz.</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={totalCols} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando...</td></tr>
          ) : filas.length === 0 ? (
            <tr><td colSpan={totalCols} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
              {filtrando ? 'Sin resultados para la búsqueda' : 'No hay contratos vigentes'}
            </td></tr>
          ) : (
            filas.map(f => {
              const actEstado = estadoActualizacion(f.proximaActualizacion);
              const actColor = actEstado === 'vencida' ? '#f87171' : actEstado === 'este_mes' ? 'var(--admin-gold)' : 'var(--gray-400)';
              return (
                <tr key={f.id}>
                  <td style={{ color: 'var(--white)', fontWeight: 500 }}>{f.inmueble?.direccion || '-'}</td>
                  <td>{f.locador?.nombre || '-'}</td>
                  <td>{f.locatario?.nombre || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--white)' }}>{money(f.moneda, f.alquilerVigente)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--gray-400)' }}>{Number(f.honorarios_porcentaje || 0)}%</td>
                  <td style={{ textAlign: 'right', color: 'var(--admin-gold)', fontWeight: 600 }}>{money(f.moneda, f.honorarios, { decimales: true })}</td>
                  <td style={{ textAlign: 'right', color: 'var(--white)' }}>{money(f.moneda, f.netoPropietario, { decimales: true })}</td>
                  <td style={{ fontSize: '0.8rem' }}>{formatDate(f.fecha_inicio)}</td>
                  <td style={{ fontSize: '0.8rem' }}>{formatDate(f.fecha_fin)}</td>
                  <td style={{ fontSize: '0.8rem', color: actColor, fontWeight: actEstado ? 600 : 400 }}>
                    {formatDate(f.proximaActualizacion)}{actEstado === 'vencida' ? ' · vencida' : actEstado === 'este_mes' ? ' · este mes' : ''}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${ESTADO_BADGE[f.estadoCalculado] || styles.badgeGray}`}>
                      {ESTADO_LABEL[f.estadoCalculado] || f.estadoCalculado}
                    </span>
                  </td>
                  {verMas && <td style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{f.locador?.dni_cuit || '-'}</td>}
                  {verMas && <td style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{f.locatario?.dni_cuit || '-'}</td>}
                  {verMas && <td style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{mesesActualizacion(f).join('/') || '-'}</td>}
                </tr>
              );
            })
          )}
        </tbody>
        {!loading && filas.length > 0 && (
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--admin-gold-20)' }}>
              <td colSpan="5" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gray-400)' }}>
                Total honorarios {hayUSD ? '(ARS)' : ''}
              </td>
              <td style={{ textAlign: 'right', color: 'var(--admin-gold)', fontWeight: 700 }}>{money('ARS', totales.ARS.honorarios, { decimales: true })}</td>
              <td style={{ textAlign: 'right', color: 'var(--white)', fontWeight: 700 }}>{money('ARS', totales.ARS.neto, { decimales: true })}</td>
              <td colSpan={totalCols - 7}></td>
            </tr>
            {hayUSD && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gray-400)' }}>Total honorarios (USD)</td>
                <td style={{ textAlign: 'right', color: 'var(--admin-gold)', fontWeight: 700 }}>{money('USD', totales.USD.honorarios, { decimales: true })}</td>
                <td style={{ textAlign: 'right', color: 'var(--white)', fontWeight: 700 }}>{money('USD', totales.USD.neto, { decimales: true })}</td>
                <td colSpan={totalCols - 7}></td>
              </tr>
            )}
          </tfoot>
        )}
      </table>
    </div>
  );
}
