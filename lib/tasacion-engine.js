// Motor de tasación (lógica pura, sin dependencias de React/Supabase).
// Combina valor por m² de zona × ajustes (tipo, conservación, antigüedad,
// cochera, baños, amenities) + ajuste manual del tasador (criterio profesional).
// Lo comparten la herramienta /admin/tasador y el detalle de tasación.

export const TIPOS = ['Departamento', 'Casa', 'PH', 'Local Comercial', 'Oficina', 'Galpón', 'Terreno', 'Cochera'];

export const ESTADOS_CONSERVACION = ['Excelente', 'Muy Bueno', 'Bueno', 'Regular', 'A Refaccionar', 'En Construcción'];

// Precios de referencia por m² en USD según zona (estimativos Argentina 2024-2025).
export const PRECIOS_ZONA = {
  'CABA - Palermo': { min: 2800, max: 3800 },
  'CABA - Recoleta': { min: 2500, max: 3500 },
  'CABA - Belgrano': { min: 2400, max: 3200 },
  'CABA - Caballito': { min: 2000, max: 2800 },
  'CABA - Villa Urquiza': { min: 2000, max: 2600 },
  'CABA - Otros': { min: 1600, max: 2400 },
  'GBA Norte': { min: 1400, max: 2200 },
  'GBA Oeste': { min: 1000, max: 1800 },
  'GBA Sur': { min: 900, max: 1500 },
  'Córdoba Capital': { min: 1000, max: 1800 },
  'Rosario': { min: 900, max: 1600 },
  'Mar del Plata': { min: 1100, max: 2000 },
  'Mendoza': { min: 900, max: 1500 },
  'Interior': { min: 600, max: 1200 },
};

export const AJUSTES = {
  tipo: {
    'Departamento': 1.0, 'Casa': 1.05, 'PH': 0.90, 'Local Comercial': 1.15,
    'Oficina': 1.10, 'Galpón': 0.50, 'Terreno': 0.40, 'Cochera': 0.25,
  },
  conservacion: {
    'Excelente': 1.15, 'Muy Bueno': 1.08, 'Bueno': 1.0,
    'Regular': 0.85, 'A Refaccionar': 0.65, 'En Construcción': 0.50,
  },
  antiguedad: (anos) => {
    if (anos <= 2) return 1.10;
    if (anos <= 5) return 1.05;
    if (anos <= 10) return 1.0;
    if (anos <= 20) return 0.92;
    if (anos <= 40) return 0.82;
    return 0.70;
  },
};

// Amenities: bonus por ítem (se suman). La cochera va aparte (campo propio).
export const AMENITIES = {
  'Pileta': 0.04,
  'Seguridad 24h': 0.03,
  'SUM': 0.02,
  'Gimnasio': 0.02,
  'Balcón / Terraza': 0.02,
  'Parrilla': 0.01,
  'Laundry': 0.01,
  'Baulera': 0.01,
};

export const ESTADO_TASACION = {
  solicitada:  { label: 'Solicitada', color: 'Yellow' },
  en_proceso:  { label: 'En proceso', color: 'Blue' },
  tasada:      { label: 'Tasada',     color: 'Green' },
  enviada:     { label: 'Enviada',    color: 'Gold' },
  descartada:  { label: 'Descartada', color: 'Gray' },
};

function round(n) { return Math.round(Number(n) || 0); }

/**
 * Calcula la tasación. Devuelve null si falta la superficie cubierta.
 * @returns {{precioM2:number, valorUSD:number, valorMin:number, valorMax:number,
 *            baseM2:number, factores:Array<{label:string, kind:string, pct?:number, value?:string}>}|null}
 */
export function calcularTasacion(input = {}) {
  const sup = parseFloat(input.superficie_cubierta);
  if (!sup || sup <= 0) return null;

  const zonaKey = PRECIOS_ZONA[input.zona] ? input.zona : 'Interior';
  const zona = PRECIOS_ZONA[zonaKey];
  const baseM2 = (zona.min + zona.max) / 2;

  const fTipo = AJUSTES.tipo[input.tipo_propiedad] || 1;
  const fCons = AJUSTES.conservacion[input.estado_conservacion] || 1;
  const anios = parseInt(input.antiguedad, 10);
  const fAnt = AJUSTES.antiguedad(Number.isFinite(anios) ? anios : 10);
  const fCochera = input.cochera ? 1.05 : 1;
  const banos = parseInt(input.banos, 10) || 0;
  const fBanos = banos >= 3 ? 1.03 : 1;

  const amenities = Array.isArray(input.amenities) ? input.amenities : [];
  const amenBonus = amenities.reduce((acc, a) => acc + (AMENITIES[a] || 0), 0);
  const fAmen = 1 + amenBonus;

  const ajusteManual = parseFloat(input.ajuste_manual) || 0; // en %
  const fManual = 1 + ajusteManual / 100;

  const precioM2 = baseM2 * fTipo * fCons * fAnt * fCochera * fBanos * fAmen * fManual;
  const valorUSD = sup * precioM2;
  // Rango de negociación: ±8% del estimado (siempre contiene el estimado).
  const valorMin = valorUSD * 0.92;
  const valorMax = valorUSD * 1.08;

  const factores = [
    { label: `Valor m² de zona (${zonaKey})`, kind: 'base', value: `USD ${round(baseM2).toLocaleString('es-AR')} / m²` },
  ];
  const addPct = (label, factor) => {
    const pct = factor - 1;
    if (Math.abs(pct) > 0.0001) factores.push({ label, kind: 'pct', pct });
  };
  addPct(`Tipo: ${input.tipo_propiedad || '—'}`, fTipo);
  addPct(`Estado: ${input.estado_conservacion || '—'}`, fCons);
  if (Number.isFinite(anios)) addPct(`Antigüedad (${anios} años)`, fAnt);
  if (input.cochera) factores.push({ label: 'Cochera', kind: 'pct', pct: 0.05 });
  if (banos >= 3) factores.push({ label: `${banos} baños`, kind: 'pct', pct: 0.03 });
  if (amenBonus > 0) factores.push({ label: `Amenities (${amenities.join(', ')})`, kind: 'pct', pct: amenBonus });
  if (Math.abs(ajusteManual) > 0.0001) factores.push({ label: 'Ajuste del tasador', kind: 'pct', pct: ajusteManual / 100 });

  return {
    precioM2: round(precioM2),
    valorUSD: round(valorUSD),
    valorMin: round(valorMin),
    valorMax: round(valorMax),
    baseM2: round(baseM2),
    factores,
  };
}

export function formatUSD(n) {
  return `USD ${Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

export function formatPct(p) {
  const v = Math.round(p * 100);
  return `${v > 0 ? '+' : ''}${v}%`;
}
