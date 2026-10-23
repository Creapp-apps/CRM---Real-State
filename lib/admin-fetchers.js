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
  ]);

  return {
    stats: { contratos: contratos || 0, clientes: clientes || 0, inmuebles: inmuebles || 0, vencimientos: vencimientos || 0, pendientes: pendientes || 0 },
    proximosVencimientos: proximos || [],
    pagosMora: mora || [],
  };
}

export async function fetchMeliItems() {
  const res = await fetch('/api/meli/items?status=active&limit=50');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.error || 'Error MELI'), { status: res.status });
  }
  return res.json();
}
