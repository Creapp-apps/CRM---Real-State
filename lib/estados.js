// Estado comercial de una publicación. Concepto propio de CMPROP, NO existe en MercadoLibre.
// Se persiste en Supabase (tabla publicacion_estados) por meli_item_id. Sin fila = 'disponible'.
//
// Única regla de sincronización con ML: 'inactiva' pausa la publicación (status=paused);
// cualquier otro estado la deja/vuelve activa (status=active). El resto de estados no toca ML.

export const ESTADO_DEFAULT = 'disponible';

export const ESTADOS_COMERCIALES = ['disponible', 'reservado', 'vendido', 'concretado', 'inactiva'];

// Metadatos de UI. `color` es un token semántico que cada componente mapea a su propio estilo
// (el admin y la web pública usan CSS Modules distintos). `hidePublic` oculta del listado público.
export const ESTADO_META = {
  disponible: { label: 'Disponible', color: 'gold', hidePublic: false },
  reservado: { label: 'Reservado', color: 'yellow', hidePublic: false },
  vendido: { label: 'Vendido', color: 'red', hidePublic: false },
  concretado: { label: 'Concretado', color: 'green', hidePublic: false },
  inactiva: { label: 'Inactiva', color: 'gray', hidePublic: true },
};

export function isEstadoValido(estado) {
  return ESTADOS_COMERCIALES.includes(estado);
}

export function estadoMeta(estado) {
  return ESTADO_META[estado] || ESTADO_META[ESTADO_DEFAULT];
}
