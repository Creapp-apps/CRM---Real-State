// Constantes de tasación (datos de referencia, sin lógica de cálculo).
// El valor de cada tasación lo define el tasador a mano; acá solo viven
// las listas que arman los selects/chips del editor y los estados.

export const TIPOS = ['Departamento', 'Casa', 'PH', 'Local Comercial', 'Oficina', 'Galpón', 'Terreno', 'Cochera'];

export const ESTADOS_CONSERVACION = ['Excelente', 'Muy Bueno', 'Bueno', 'Regular', 'A Refaccionar', 'En Construcción'];

// Zonas de referencia (solo se usan las claves como opciones; sin cálculo).
export const PRECIOS_ZONA = {
  'CABA - Palermo': true,
  'CABA - Recoleta': true,
  'CABA - Belgrano': true,
  'CABA - Caballito': true,
  'CABA - Villa Urquiza': true,
  'CABA - Otros': true,
  'GBA Norte': true,
  'GBA Oeste': true,
  'GBA Sur': true,
  'Córdoba Capital': true,
  'Rosario': true,
  'Mar del Plata': true,
  'Mendoza': true,
  'Interior': true,
};

// Amenities disponibles para marcar en la ficha (solo info, sin ponderación).
export const AMENITIES = {
  'Pileta': true,
  'Seguridad 24h': true,
  'SUM': true,
  'Gimnasio': true,
  'Balcón / Terraza': true,
  'Parrilla': true,
  'Laundry': true,
  'Baulera': true,
};

export const ESTADO_TASACION = {
  solicitada:  { label: 'Solicitada', color: 'Yellow' },
  en_proceso:  { label: 'En proceso', color: 'Blue' },
  tasada:      { label: 'Tasada',     color: 'Green' },
  enviada:     { label: 'Enviada',    color: 'Gold' },
  descartada:  { label: 'Descartada', color: 'Gray' },
};

export function formatUSD(n) {
  return `USD ${Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}
