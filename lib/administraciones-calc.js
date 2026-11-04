// Lógica pura de Administraciones: alquiler vigente, honorarios, neto al
// propietario, próxima actualización, estado vigente y totales por moneda.
// Sin React ni Supabase → testeable en aislamiento (vitest, env node).

export const PER_MESES = {
  mensual: 1, bimestral: 2, trimestral: 3, cuatrimestral: 4, semestral: 6, anual: 12,
};

// Parsea 'YYYY-MM-DD' al mediodía local para evitar corrimientos por zona horaria.
function parseFecha(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  return new Date(s + 'T12:00:00');
}

// Actualizaciones ordenadas de más reciente a más antigua.
function actsDesc(contrato) {
  return (contrato?.acts || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

// Alquiler vigente = último monto_nuevo registrado, o monto_inicial si no hubo.
export function montoVigente(contrato) {
  const acts = actsDesc(contrato);
  if (acts.length) return Number(acts[0].monto_nuevo);
  return Number(contrato?.monto_inicial || 0);
}

// Honorarios sobre un monto → { neto, iva, total }.
export function honorarios(monto, porcentaje, conIva = false) {
  const neto = Number(monto || 0) * (Number(porcentaje || 0) / 100);
  const iva = conIva ? neto * 0.21 : 0;
  return { neto, iva, total: neto + iva };
}

// Neto al propietario = alquiler − honorarios (con IVA incluido).
export function netoPropietario(monto, honorariosTotal) {
  return Number(monto || 0) - Number(honorariosTotal || 0);
}

// Próxima fecha de actualización programada (inicio + k·periodicidad).
// Calca la lógica del dashboard (fetchAdminStats).
export function proximaActualizacion(contrato) {
  const inicio = parseFecha(contrato?.fecha_inicio);
  if (!inicio) return null;
  const period = PER_MESES[contrato?.periodicidad_ajuste] || 3;
  const acts = actsDesc(contrato);
  const ultima = acts.length ? parseFecha(acts[0].fecha) : inicio;
  const addM = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  let k = 1, next = addM(inicio, period);
  while (next <= ultima) { k++; next = addM(inicio, k * period); }
  return next;
}

// Estado derivado por fecha. 'rescindido' es manual y se respeta.
export function estadoVigente(contrato, hoy = new Date()) {
  if (contrato?.estado === 'rescindido') return 'rescindido';
  const h = new Date(hoy); h.setHours(0, 0, 0, 0);
  const fin = parseFecha(contrato?.fecha_fin);
  if (!fin) return 'activo';
  const dias = Math.ceil((fin - h) / 86400000);
  if (dias < 0) return 'vencido';
  if (dias <= 30) return 'proximo_a_vencer';
  return 'activo';
}

// ¿El contrato está vigente y genera honorarios este mes?
export function estaVigente(contrato, hoy = new Date()) {
  const e = estadoVigente(contrato, hoy);
  return e === 'activo' || e === 'proximo_a_vencer';
}

// Normaliza la moneda a 'ARS' | 'USD'.
export function monedaDe(contrato) {
  return contrato?.moneda === 'USD' ? 'USD' : 'ARS';
}

// Fila lista para la grilla: suma los derivados al contrato.
export function filaGrilla(contrato, hoy = new Date()) {
  const alquilerVigente = montoVigente(contrato);
  const hon = honorarios(alquilerVigente, contrato?.honorarios_porcentaje, contrato?.honorarios_iva);
  return {
    ...contrato,
    moneda: monedaDe(contrato),
    alquilerVigente,
    honorarios: hon.total,
    honorariosNeto: hon.neto,
    honorariosIva: hon.iva,
    netoPropietario: netoPropietario(alquilerVigente, hon.total),
    proximaActualizacion: proximaActualizacion(contrato),
    estadoCalculado: estadoVigente(contrato, hoy),
  };
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Meses del año en que toca actualizar (inicio + k·periodicidad), estilo excel
// de Mónica ("Mar/Jun/Sep/Dic"). Devuelve array de labels cortos en orden.
export function mesesActualizacion(contrato) {
  const inicio = parseFecha(contrato?.fecha_inicio);
  if (!inicio) return [];
  const period = PER_MESES[contrato?.periodicidad_ajuste] || 3;
  const count = Math.round(12 / period);
  const start = inicio.getMonth();
  const out = [];
  for (let k = 0; k < count; k++) out.push(MESES_CORTOS[(start + k * period) % 12]);
  return out;
}

// Clasifica una fecha de actualización respecto a hoy: 'vencida' | 'este_mes' | null.
export function estadoActualizacion(fecha, hoy = new Date()) {
  if (!fecha) return null;
  const f = fecha instanceof Date ? fecha : parseFecha(fecha);
  const inicioHoy = new Date(hoy); inicioHoy.setHours(0, 0, 0, 0);
  const finDeMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
  if (f < inicioHoy) return 'vencida';
  if (f <= finDeMes) return 'este_mes';
  return null;
}

// Nombre visible de la contraparte de un saldo (cliente vinculado o texto libre).
export function nombreContraparte(saldo) {
  return saldo?.contraparte?.nombre || saldo?.contraparte_texto || 'Sin contraparte';
}

// Saldo acumulado por (contraparte, moneda). 'a_favor' suma, 'en_contra' resta.
// Positivo = a favor de la contraparte; negativo = la contraparte debe.
// Nunca cruza monedas.
export function saldoPorContraparte(saldos) {
  const map = new Map();
  for (const s of saldos || []) {
    const contraparte = nombreContraparte(s);
    const moneda = s.moneda === 'USD' ? 'USD' : 'ARS';
    const key = `${contraparte}||${moneda}`;
    const signo = s.sentido === 'en_contra' ? -1 : 1;
    const prev = map.get(key) || { contraparte, moneda, saldo: 0, movimientos: 0 };
    prev.saldo += signo * Number(s.monto || 0);
    prev.movimientos += 1;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.contraparte.localeCompare(b.contraparte) || a.moneda.localeCompare(b.moneda)
  );
}

// Totales de alquiler/honorarios/neto por moneda, solo contratos vigentes.
// Nunca mezcla ni convierte monedas.
export function totalesPorMoneda(contratos, hoy = new Date()) {
  const vacio = () => ({ alquiler: 0, honorarios: 0, neto: 0, count: 0 });
  const out = { ARS: vacio(), USD: vacio() };
  for (const c of contratos || []) {
    if (!estaVigente(c, hoy)) continue;
    const moneda = monedaDe(c);
    const alquiler = montoVigente(c);
    const hon = honorarios(alquiler, c.honorarios_porcentaje, c.honorarios_iva);
    out[moneda].alquiler += alquiler;
    out[moneda].honorarios += hon.total;
    out[moneda].neto += netoPropietario(alquiler, hon.total);
    out[moneda].count += 1;
  }
  return out;
}
