// Definición declarativa de las categorías y campos del editor de contenido.
// scope: 'content' | 'theme' (de qué objeto del draft sale cada campo).
// Cada categoría puede tener: fields (campos simples), listPath + itemFields
// (ítems repetidos), o special ('colors' | 'media').

export const CATEGORIES = [
  { key: 'hero', label: 'Hero', scope: 'content' },
  { key: 'stats', label: 'Estadísticas', scope: 'content' },
  { key: 'values', label: 'Valores', scope: 'content' },
  { key: 'operations', label: 'Operaciones', scope: 'content' },
  { key: 'cta', label: 'CTA', scope: 'content' },
  { key: 'footer', label: 'Footer', scope: 'content' },
  { key: 'navbar', label: 'Navbar', scope: 'content' },
  { key: 'colors', label: 'Colores', scope: 'theme' },
  { key: 'media', label: 'Media', scope: 'theme' },
];

export const FIELDS = {
  hero: {
    fields: [
      { path: 'hero.titlePrefix', label: 'Título — primera parte', desc: 'Arranque del título principal de la portada, antes de la palabra que rota.', type: 'text' },
      { path: 'hero.titleSuffix', label: 'Título — última parte', desc: 'Cierre del título principal, después de la palabra que rota.', type: 'text' },
      { path: 'hero.rotatingWords', label: 'Palabras que rotan', desc: 'Palabras que se van alternando dentro del título (una por línea).', type: 'list' },
      { path: 'hero.subtitle', label: 'Subtítulo', desc: 'Frase que aparece debajo del título principal.', type: 'text' },
      { path: 'hero.scrollText', label: 'Texto del indicador de scroll', desc: 'Micro-texto que invita al visitante a seguir bajando (ej. "Descubrí más").', type: 'text' },
    ],
  },
  stats: {
    intro: 'Los contadores que se muestran en la franja de estadísticas. El valor debe ser un número.',
    listPath: 'stats',
    itemLabel: 'Estadística',
    itemFields: [
      { key: 'value', label: 'Valor', desc: 'Número que se cuenta en pantalla (ej. 500).', type: 'text' },
      { key: 'suffix', label: 'Sufijo', desc: 'Símbolo después del número (ej. "+" o "%").', type: 'text' },
      { key: 'label', label: 'Etiqueta', desc: 'Texto descriptivo debajo del número.', type: 'text' },
    ],
  },
  values: {
    fields: [
      { path: 'values.subtitle', label: 'Subtítulo de la sección', desc: 'Pequeño rótulo arriba del título (ej. "Por qué elegirnos").', type: 'text' },
      { path: 'values.titlePrefix', label: 'Título de la sección', desc: 'Título principal del bloque de valores.', type: 'text' },
      { path: 'values.titleHighlight', label: 'Título — parte destacada', desc: 'Parte del título resaltada en color de acento.', type: 'text' },
    ],
    listPath: 'values.items',
    itemLabel: 'Valor',
    itemFields: [
      { key: 'title', label: 'Título', desc: 'Nombre del valor (ej. "Confianza").', type: 'text' },
      { key: 'description', label: 'Descripción', desc: 'Explicación breve del valor.', type: 'textarea' },
    ],
  },
  operations: {
    fields: [
      { path: 'operations.subtitle', label: 'Subtítulo de la sección', desc: 'Pequeño rótulo arriba del título (ej. "Explorá").', type: 'text' },
      { path: 'operations.titlePrefix', label: 'Título de la sección', desc: 'Título principal del bloque de operaciones.', type: 'text' },
      { path: 'operations.titleHighlight', label: 'Título — parte destacada', desc: 'Parte del título resaltada en color de acento.', type: 'text' },
    ],
    intro: 'Las tarjetas de operaciones. Solo se editan el título y la descripción; el destino de cada tarjeta es fijo.',
    listPath: 'operations.items',
    itemLabel: 'Operación',
    itemFields: [
      { key: 'title', label: 'Título', desc: 'Nombre de la operación (ej. "Venta").', type: 'text' },
      { key: 'description', label: 'Descripción', desc: 'Texto breve debajo del título de la tarjeta.', type: 'text' },
    ],
  },
  cta: {
    fields: [
      { path: 'cta.subtitle', label: 'Subtítulo', desc: 'Pequeño rótulo arriba del título (ej. "Valorá tu inmueble").', type: 'text' },
      { path: 'cta.titlePrefix', label: 'Título — primera parte', desc: 'Arranque del título del bloque de tasación.', type: 'text' },
      { path: 'cta.titleHighlight', label: 'Título — parte destacada', desc: 'Parte del título resaltada en color de acento.', type: 'text' },
      { path: 'cta.titleSuffix', label: 'Título — última parte', desc: 'Cierre del título del bloque.', type: 'text' },
      { path: 'cta.description', label: 'Descripción', desc: 'Párrafo que explica la propuesta de tasación.', type: 'textarea' },
      { path: 'cta.btnPrimary', label: 'Botón principal', desc: 'Texto del botón destacado (lleva a tasar).', type: 'text' },
      { path: 'cta.btnSecondary', label: 'Botón secundario', desc: 'Texto del segundo botón (lleva a contacto).', type: 'text' },
    ],
  },
  footer: {
    fields: [
      { path: 'footer.brandText', label: 'Texto de marca', desc: 'Descripción breve de la inmobiliaria en el pie de página.', type: 'textarea' },
      { path: 'footer.phone', label: 'Teléfono (visible)', desc: 'Número tal como se muestra al visitante.', type: 'text' },
      { path: 'footer.whatsapp', label: 'WhatsApp (solo números)', desc: 'Número para el enlace de WhatsApp, sin espacios ni símbolos (ej. 5491166092461).', type: 'text' },
      { path: 'footer.email', label: 'Email', desc: 'Correo de contacto que ve el visitante.', type: 'text' },
      { path: 'footer.location', label: 'Ubicación', desc: 'Ciudad o zona de la inmobiliaria.', type: 'text' },
    ],
  },
  navbar: {
    fields: [
      { path: 'navbar.ctaText', label: 'Botón de la barra superior', desc: 'Texto del botón destacado del menú (ej. "Tasá tu propiedad").', type: 'text' },
    ],
  },
  colors: {
    special: 'colors',
    intro: 'Colores de marca del sitio. Los cambios aplican a toda la web.',
  },
  media: {
    special: 'media',
    intro: 'Video de fondo de la portada. Si no subís nada, se usa el video por defecto.',
  },
};
