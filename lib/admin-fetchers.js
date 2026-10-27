// Fetchers centralizados para SWR — admin panel
import { supabase } from './supabase';

export async function fetchMessagesContacto() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('message_type', 'contacto')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchMessagesTasacion() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('message_type', 'tasacion')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchDevelopments() {
  const { data, error } = await supabase
    .from('developments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchContratos(filterEstado = 'todos') {
  let query = supabase
    .from('contratos')
    .select('*, locador:clientes!contratos_locador_id_fkey(nombre), locatario:clientes!contratos_locatario_id_fkey(nombre), inmueble:inmuebles_administrados!contratos_inmueble_id_fkey(direccion)')
    .order('created_at', { ascending: false });
  if (filterEstado !== 'todos') query = query.eq('estado', filterEstado);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchAdminStats() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [
    { count: contratos },
    { count: clientes },
    { count: inmuebles },
    { count: vencimientos },
    { data: proximos },
    { count: pendientes },
    { data: mora },
    { data: activos },
  ] = await Promise.all([
    supabase.from('contratos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('inmuebles_administrados').select('*', { count: 'exact', head: true }),
    supabase.from('contratos').select('*', { count: 'exact', head: true }).lte('fecha_fin', in30Days).gte('fecha_fin', today),
    supabase.from('contratos')
      .select('id, monto_inicial, moneda, fecha_inicio, fecha_fin, estado, locador:clientes!contratos_locador_id_fkey(nombre), locatario:clientes!contratos_locatario_id_fkey(nombre), inmueble:inmuebles_administrados!contratos_inmueble_id_fkey(direccion)')
      .lte('fecha_fin', in30Days).gte('fecha_fin', today)
      .order('fecha_fin', { ascending: true }).limit(10),
    supabase.from('pagos_alquiler').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('pagos_alquiler')
      .select('*, contrato:contratos(inmueble:inmuebles_administrados(direccion), locatario:clientes!contratos_locatario_id_fkey(nombre))')
      .eq('estado', 'pendiente').lt('fecha_vencimiento', today)
      .order('fecha_vencimiento', { ascending: true }).limit(10),
    // Contratos activos + sus actualizaciones (para detectar ajustes pendientes).
    supabase.from('contratos')
      .select('id, monto_inicial, moneda, fecha_inicio, fecha_fin, estado, indice_ajuste, periodicidad_ajuste, locatario:clientes!contratos_locatario_id_fkey(nombre), inmueble:inmuebles_administrados!contratos_inmueble_id_fkey(direccion), acts:actualizaciones_contrato(fecha, monto_nuevo)')
      .eq('estado', 'activo'),
  ]);

  // Alquileres a actualizar este mes (o con ajuste vencido): la próxima fecha
  // programada (inicio + k·periodicidad) cae hasta fin de este mes y no se registró.
  const PER_MESES = { mensual: 1, bimestral: 2, trimestral: 3, cuatrimestral: 4, semestral: 6, anual: 12 };
  const addM = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  const finDeMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const hoyD = new Date(today + 'T00:00:00');
  const actualizacionesMes = (activos || []).map(c => {
    const period = PER_MESES[c.periodicidad_ajuste] || 3;
    const inicio = new Date(c.fecha_inicio + 'T12:00:00');
    const acts = (c.acts || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    const ultima = acts.length ? new Date(acts[0].fecha + 'T12:00:00') : inicio;
    const montoActual = acts.length ? Number(acts[0].monto_nuevo) : Number(c.monto_inicial);
    let k = 1, next = addM(inicio, period);
    while (next <= ultima) { k++; next = addM(inicio, k * period); }
    return { ...c, proximaActualizacion: next, montoActual };
  }).filter(c =>
    c.proximaActualizacion <= finDeMes &&            // toca este mes o está vencida
    new Date(c.fecha_fin + 'T12:00:00') >= hoyD      // contrato aún vigente
  ).sort((a, b) => a.proximaActualizacion - b.proximaActualizacion);

  return {
    stats: { contratos: contratos || 0, clientes: clientes || 0, inmuebles: inmuebles || 0, vencimientos: vencimientos || 0, pendientes: pendientes || 0, actualizaciones: actualizacionesMes.length },
    proximosVencimientos: proximos || [],
    pagosMora: mora || [],
    actualizacionesMes,
  };
}

export async function fetchMeliItems(status = 'active') {
  const res = await fetch(`/api/meli/items?status=${status}&limit=50`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.error || 'Error MELI'), { status: res.status });
  }
  return res.json();
}

export async function fetchMeliVisits(id, days = 7) {
  const res = await fetch(`/api/meli/visits?id=${id}&days=${days}`);
  if (!res.ok) return { total: 0, days: [] };
  return res.json();
}
