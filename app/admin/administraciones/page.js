'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import { supabase } from '@/lib/supabase';

export default function AdministracionesDashboard() {
  const [stats, setStats] = useState({ contratos: 0, clientes: 0, inmuebles: 0, vencimientos: 0, pendientes: 0 });
  const [proximosVencimientos, setProximosVencimientos] = useState([]);
  const [pagosMora, setPagosMora] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [
        { count: contratosCount },
        { count: clientesCount },
        { count: inmueblesCount },
        { count: vencimientosCount },
        { data: proximos },
        { count: pendientesCount },
        { data: mora }
      ] = await Promise.all([
        supabase.from('contratos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('inmuebles_administrados').select('*', { count: 'exact', head: true }),
        supabase.from('contratos').select('*', { count: 'exact', head: true })
          .lte('fecha_fin', in30Days.toISOString().split('T')[0])
          .gte('fecha_fin', today),
        supabase.from('contratos')
          .select('id, monto_inicial, moneda, fecha_inicio, fecha_fin, estado, locador:clientes!contratos_locador_id_fkey(nombre), locatario:clientes!contratos_locatario_id_fkey(nombre), inmueble:inmuebles_administrados!contratos_inmueble_id_fkey(direccion)')
          .lte('fecha_fin', in30Days.toISOString().split('T')[0])
          .gte('fecha_fin', today)
          .order('fecha_fin', { ascending: true })
          .limit(10),
        supabase.from('pagos_alquiler').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pagos_alquiler')
          .select('*, contrato:contratos(inmueble:inmuebles_administrados(direccion), locatario:clientes!contratos_locatario_id_fkey(nombre))')
          .eq('estado', 'pendiente')
          .lt('fecha_vencimiento', today)
          .order('fecha_vencimiento', { ascending: true })
          .limit(10),
      ]);

      setStats({
        contratos: contratosCount || 0,
        clientes: clientesCount || 0,
        inmuebles: inmueblesCount || 0,
        vencimientos: vencimientosCount || 0,
        pendientes: pendientesCount || 0,
      });
      setProximosVencimientos(proximos || []);
      setPagosMora(mora || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const daysUntil = (d) => {
    if (!d) return 0;
    const diff = new Date(d) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const STAT_CARDS = [
    { label: 'Contratos Activos', value: stats.contratos, color: 'Blue', icon: (
      <Icon name="file-text" size={22} />
    )},
    { label: 'Clientes Registrados', value: stats.clientes, color: 'Green', icon: (
      <Icon name="users" size={22} />
    )},
    { label: 'Inmuebles Administrados', value: stats.inmuebles, color: 'Gold', icon: (
      <Icon name="building" size={22} />
    )},
    { label: 'Próximos Vencimientos', value: stats.vencimientos, color: 'Purple', icon: (
      <Icon name="clock" size={22} />
    )},
    { label: 'Cobros Pendientes', value: stats.pendientes, color: 'Red', icon: (
      <Icon name="dollar" size={22} />
    )},
  ];

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Administraciones</h2>
          <p className={styles.pageSubtitle}>Control de contratos, clientes e inmuebles administrados</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={`${styles.statIconWrap} ${styles[`statIcon${stat.color}`]}`}>
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <h3>{stat.label}</h3>
              <p>{loading ? '...' : stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/admin/administraciones/contratos" className={styles.btnPrimary}>
          <Icon name="plus" size={16} />
          Nuevo Contrato
        </Link>
        <Link href="/admin/administraciones/clientes" className={styles.btnSecondary}>
          <Icon name="user-plus" size={16} />
          Nuevo Cliente
        </Link>
        <Link href="/admin/administraciones/inmuebles" className={styles.btnSecondary}>
          <Icon name="building" size={16} />
          Nuevo Inmueble
        </Link>
      </div>

      {/* Pagos en Mora */}
      {pagosMora.length > 0 && (
        <div className={styles.tableWrapper} style={{ borderColor: 'rgba(248,113,113,0.2)', marginBottom: '1.5rem' }}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle} style={{ color: '#f87171' }}>
              ⚠️ Pagos en Mora ({pagosMora.length})
            </h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Inmueble</th>
                <th>Inquilino</th>
                <th>Período</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th>Días Mora</th>
              </tr>
            </thead>
            <tbody>
              {pagosMora.map(p => {
                const dias = Math.max(0, Math.floor((new Date() - new Date(p.fecha_vencimiento + 'T12:00:00')) / (1000 * 60 * 60 * 24)));
                return (
                  <tr key={p.id} style={{ background: 'rgba(248,113,113,0.03)' }}>
                    <td style={{ color: 'var(--white)', fontWeight: 500 }}>{p.contrato?.inmueble?.direccion || '-'}</td>
                    <td>{p.contrato?.locatario?.nombre || '-'}</td>
                    <td>{p.periodo}</td>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>$ {Number(p.monto_alquiler).toLocaleString('es-AR')}</td>
                    <td>{formatDate(p.fecha_vencimiento)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeRed}`}>{dias} días</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Próximos Vencimientos */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Contratos por Vencer (30 días)</h2>
          <Link href="/admin/administraciones/contratos" className={styles.btnSecondary}>
            Ver todos
          </Link>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Inmueble</th>
              <th>Locador</th>
              <th>Locatario</th>
              <th>Monto</th>
              <th>Vencimiento</th>
              <th>Días</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando...</td></tr>
            ) : proximosVencimientos.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>No hay contratos por vencer en los próximos 30 días</td></tr>
            ) : (
              proximosVencimientos.map(c => {
                const days = daysUntil(c.fecha_fin);
                return (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--white)', fontWeight: 500 }}>{c.inmueble?.direccion || '-'}</td>
                    <td>{c.locador?.nombre || '-'}</td>
                    <td>{c.locatario?.nombre || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>
                      {c.moneda} {Number(c.monto_inicial).toLocaleString('es-AR')}
                    </td>
                    <td>{formatDate(c.fecha_fin)}</td>
                    <td>
                      <span className={`${styles.badge} ${days <= 7 ? styles.badgeRed : days <= 15 ? styles.badgeYellow : styles.badgeGreen}`}>
                        {days} días
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
