export const CONTENT_DEFAULTS = {
  hero: {
    rotatingWords: ['lugar', 'espacio', 'hogar', 'local', 'negocio'],
    titlePrefix: 'Te acompañamos a encontrar tu',
    titleSuffix: 'ideal',
    subtitle: 'Venta, alquiler y tasaciones de propiedades en Argentina',
    scrollText: 'Descubrí más',
  },
  stats: [
    { value: '500', suffix: '+', label: 'Propiedades vendidas' },
    { value: '15', suffix: '+', label: 'Años de experiencia' },
    { value: '1200', suffix: '+', label: 'Clientes satisfechos' },
    { value: '98', suffix: '%', label: 'Satisfacción' },
  ],
  values: {
    subtitle: 'Por qué elegirnos',
    titlePrefix: 'Hacemos de cada operación',
    titleHighlight: 'una experiencia única',
    items: [
      { title: 'Confianza', description: 'Transparencia y honestidad en cada operación. Tu tranquilidad es nuestra prioridad.' },
      { title: 'Alcance', description: 'Amplia red de contactos y presencia en los principales portales inmobiliarios.' },
      { title: 'Dedicación', description: 'Acompañamiento personalizado desde la primera consulta hasta la escritura.' },
    ],
  },
  operations: {
    subtitle: 'Explorá',
    titlePrefix: '¿Qué estás',
    titleHighlight: 'buscando',
    items: [
      { title: 'Venta', description: 'Encontrá tu propiedad ideal para comprar' },
      { title: 'Alquiler', description: 'Las mejores opciones para alquilar' },
      { title: 'Temporario', description: 'Alquileres temporarios y turísticos' },
      { title: 'Emprendimientos', description: 'Proyectos nuevos y en construcción' },
    ],
  },
  cta: {
    subtitle: 'Valorá tu inmueble',
    titlePrefix: '¿Querés',
    titleHighlight: 'tasar',
    titleSuffix: 'tu propiedad?',
    description: 'Obtené una tasación profesional sin cargo. Nuestro equipo de expertos evalúa tu propiedad con los mejores datos del mercado para que tomes las mejores decisiones.',
    btnPrimary: 'Solicitar tasación gratuita',
    btnSecondary: 'Contactanos',
  },
  footer: {
    brandText: 'Tu socio de confianza en el mercado inmobiliario. Experiencia, dedicación y compromiso para encontrar el hogar de tus sueños.',
    phone: '+54 9 11 6609 2461',
    whatsapp: '5491166092461',
    email: 'cardosom.prop@gmail.com',
    location: 'Buenos Aires, Argentina',
  },
  navbar: {
    ctaText: 'Tasá tu propiedad',
  },
};

export const THEME_DEFAULTS = {
  colors: {
    navy900: '#0A1628',
    navy800: '#0F2140',
    navy700: '#142C54',
    navy600: '#1A3A6B',
    navy500: '#1E4D8F',
    gold: '#FFFFFF',
    goldLight: '#F8F9FA',
    goldDark: '#E9ECEF',
  },
  media: {
    heroVideo: null,
    heroPoster: null,
  },
};

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Deep-merge: partial pisa defaults. Arrays se reemplazan completos.
// null/undefined en partial => cae al default.
export function withDefaults(partial, defaults) {
  if (!isPlainObject(partial)) return clone(defaults);
  const out = clone(defaults);
  for (const key of Object.keys(partial)) {
    const pv = partial[key];
    if (pv === null || pv === undefined) continue; // cae a default
    if (isPlainObject(pv) && isPlainObject(out[key])) {
      out[key] = withDefaults(pv, out[key]);
    } else {
      out[key] = isPlainObject(pv) || Array.isArray(pv) ? clone(pv) : pv;
    }
  }
  return out;
}

function clone(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}
