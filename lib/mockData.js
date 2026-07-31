/**
 * Mock property data — will be replaced with Tokko API calls.
 * This provides realistic placeholder data for development.
 */

export const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Departamento Premium en Puerto Madero',
    slug: 'departamento-premium-puerto-madero',
    operation: 'Venta',
    operationType: 'venta',
    type: 'Departamento',
    price: 320000,
    currency: 'USD',
    location: 'Puerto Madero, CABA',
    address: 'Av. Juana Manso 1200, Puerto Madero',
    neighborhood: 'Puerto Madero',
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    totalArea: 150,
    coveredArea: 120,
    age: 5,
    floor: '18°',
    orientation: 'Norte',
    disposition: 'Frente',
    amenities: ['Pileta', 'Gimnasio', 'SUM', 'Seguridad 24hs', 'Laundry', 'Parrilla'],
    description: 'Espectacular departamento de 3 ambientes en torre premium de Puerto Madero. Vista panorámica al río y a la ciudad. Cocina integrada con mesada de granito, pisos de porcelanato, aire acondicionado central. Amenities completos: pileta climatizada, gimnasio equipado, SUM con cocina, seguridad 24hs. Cochera cubierta incluida.',
    images: ['/images/hero-bg.jpg', '/images/property-interior.jpg', '/images/property-house.jpg', '/images/property-penthouse.jpg'],
    featured: true,
    lat: -34.6158,
    lng: -58.3634,
    createdAt: '2026-02-15',
  },
  {
    id: '2',
    title: 'Casa con Jardín en Nordelta',
    slug: 'casa-jardin-nordelta',
    operation: 'Venta',
    operationType: 'venta',
    type: 'Casa',
    price: 450000,
    currency: 'USD',
    location: 'Nordelta, Tigre',
    address: 'Los Castores 450, Nordelta',
    neighborhood: 'Nordelta',
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    totalArea: 350,
    coveredArea: 250,
    age: 3,
    floor: null,
    orientation: 'Noreste',
    disposition: 'Frente',
    amenities: ['Pileta', 'Jardín', 'Parrilla', 'Playroom', 'Seguridad 24hs'],
    description: 'Hermosa casa en barrio cerrado de Nordelta. 4 dormitorios, suite principal con vestidor y baño en suite. Living comedor con doble altura y hogar a leña. Cocina con isla central. Amplio jardín con pileta y quincho con parrilla. Barrio con seguridad 24hs, canchas de tenis y club house.',
    images: ['/images/property-house.jpg', '/images/property-interior.jpg', '/images/hero-bg.jpg', '/images/property-penthouse.jpg'],
    featured: true,
    lat: -34.4024,
    lng: -58.6618,
    createdAt: '2026-02-20',
  },
  {
    id: '3',
    title: 'Loft Moderno en Palermo Soho',
    slug: 'loft-moderno-palermo-soho',
    operation: 'Alquiler',
    operationType: 'alquiler',
    type: 'Departamento',
    price: 1200,
    currency: 'USD',
    priceLabel: '/mes',
    location: 'Palermo Soho, CABA',
    address: 'Honduras 4800, Palermo',
    neighborhood: 'Palermo',
    bedrooms: 1,
    bathrooms: 1,
    garages: 0,
    totalArea: 75,
    coveredArea: 65,
    age: 8,
    floor: '3°',
    orientation: 'Oeste',
    disposition: 'Contrafrente',
    amenities: ['Balcón', 'Laundry', 'Bicicletero'],
    description: 'Loft de diseño en el corazón de Palermo Soho. Amplios espacios con doble altura parcial, ventanales de piso a techo. Cocina americana con electrodomésticos. Ideal para profesionales o pareja joven. A pasos de las mejores tiendas, restaurantes y vida nocturna de Buenos Aires.',
    images: ['/images/property-interior.jpg', '/images/hero-bg.jpg', '/images/property-penthouse.jpg'],
    featured: true,
    lat: -34.5875,
    lng: -58.4311,
    createdAt: '2026-03-01',
  },
  {
    id: '4',
    title: 'PH Reciclado en Belgrano',
    slug: 'ph-reciclado-belgrano',
    operation: 'Venta',
    operationType: 'venta',
    type: 'PH',
    price: 280000,
    currency: 'USD',
    location: 'Belgrano, CABA',
    address: 'Echeverría 2200, Belgrano',
    neighborhood: 'Belgrano',
    bedrooms: 3,
    bathrooms: 2,
    garages: 0,
    totalArea: 160,
    coveredArea: 140,
    age: 0,
    floor: null,
    orientation: 'Norte',
    disposition: 'Frente',
    amenities: ['Terraza', 'Parrilla', 'Lavadero'],
    description: 'PH reciclado a nuevo con terraza propia y parrilla. 3 ambientes luminosos, 2 baños completos. Cocina totalmente equipada. Ubicación privilegiada en Belgrano, a metros de Av. Cabildo. Ideal para familia. Pisos de madera, carpinterías nuevas, instalación eléctrica renovada.',
    images: ['/images/property-penthouse.jpg', '/images/property-interior.jpg', '/images/hero-bg.jpg', '/images/property-house.jpg'],
    featured: true,
    lat: -34.5614,
    lng: -58.4565,
    createdAt: '2026-03-05',
  },
  {
    id: '5',
    title: 'Oficina en Microcentro',
    slug: 'oficina-microcentro',
    operation: 'Alquiler',
    operationType: 'alquiler',
    type: 'Oficina',
    price: 2500,
    currency: 'USD',
    priceLabel: '/mes',
    location: 'Microcentro, CABA',
    address: 'Av. Corrientes 500, Microcentro',
    neighborhood: 'Microcentro',
    bedrooms: 0,
    bathrooms: 2,
    garages: 0,
    totalArea: 200,
    coveredArea: 200,
    age: 15,
    floor: '8°',
    orientation: 'Norte',
    disposition: 'Frente',
    amenities: ['Recepción', 'Aire Central', 'Seguridad'],
    description: 'Oficina premium en torre corporativa de Microcentro. 200m² diáfanos con posibilidad de dividir. Aire acondicionado central, piso técnico, cableado estructurado. Edificio con recepción, seguridad 24hs y cocheras opcionales. Excelente estado y ubicación estratégica.',
    images: ['/images/property-interior.jpg', '/images/hero-bg.jpg'],
    featured: false,
    lat: -34.6037,
    lng: -58.3816,
    createdAt: '2026-02-28',
  },
  {
    id: '6',
    title: 'Terreno en Pilar',
    slug: 'terreno-pilar',
    operation: 'Venta',
    operationType: 'venta',
    type: 'Terreno',
    price: 95000,
    currency: 'USD',
    location: 'Pilar, Buenos Aires',
    address: 'Barrio Los Álamos, Pilar',
    neighborhood: 'Pilar',
    bedrooms: 0,
    bathrooms: 0,
    garages: 0,
    totalArea: 800,
    coveredArea: 0,
    age: 0,
    floor: null,
    orientation: null,
    disposition: null,
    amenities: ['Barrio cerrado', 'Seguridad', 'Club house'],
    description: 'Terreno de 800m² en barrio cerrado de Pilar. Lote perimetral con excelente orientación. Barrio con seguridad 24hs, club house, canchas deportivas y acceso directo a Panamericana. Ideal para construcción de vivienda familiar.',
    images: ['/images/property-house.jpg', '/images/hero-bg.jpg'],
    featured: false,
    lat: -34.4588,
    lng: -58.9141,
    createdAt: '2026-03-10',
  },
  {
    id: '7',
    title: 'Departamento Temporario en Recoleta',
    slug: 'departamento-temporario-recoleta',
    operation: 'Temporario',
    operationType: 'temporario',
    type: 'Departamento',
    price: 80,
    currency: 'USD',
    priceLabel: '/día',
    location: 'Recoleta, CABA',
    address: 'Av. Alvear 1500, Recoleta',
    neighborhood: 'Recoleta',
    bedrooms: 2,
    bathrooms: 1,
    garages: 0,
    totalArea: 70,
    coveredArea: 65,
    age: 10,
    floor: '5°',
    orientation: 'Este',
    disposition: 'Frente',
    amenities: ['WiFi', 'TV Cable', 'Cocina equipada', 'Ropa de cama'],
    description: 'Departamento amueblado para alquiler temporario en la zona más elegante de Recoleta. 2 ambientes completamente equipados, cocina con electrodomésticos, WiFi de alta velocidad. A pasos del Cementerio de Recoleta, centros culturales y la mejor gastronomía porteña.',
    images: ['/images/property-interior.jpg', '/images/property-penthouse.jpg', '/images/hero-bg.jpg'],
    featured: false,
    lat: -34.5885,
    lng: -58.3932,
    createdAt: '2026-03-08',
  },
  {
    id: '8',
    title: 'Penthouse con Vista al Río',
    slug: 'penthouse-vista-rio',
    operation: 'Venta',
    operationType: 'venta',
    type: 'Departamento',
    price: 750000,
    currency: 'USD',
    location: 'Puerto Madero, CABA',
    address: 'Olga Cossettini 800, Puerto Madero',
    neighborhood: 'Puerto Madero',
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    totalArea: 280,
    coveredArea: 220,
    age: 2,
    floor: '25°',
    orientation: 'Norte',
    disposition: 'Frente',
    amenities: ['Pileta', 'Gimnasio', 'SUM', 'Seguridad 24hs', 'Spa', 'Terraza propia', 'Jacuzzi'],
    description: 'Espectacular penthouse en la torre más exclusiva de Puerto Madero. Vista 360° al río y la ciudad. 4 suites, living comedor con triple altura, terraza propia de 60m² con jacuzzi. Cocina gourmet con isla. Amenities de primer nivel: spa, pileta infinita, gimnasio premium. 2 cocheras cubiertas.',
    images: ['/images/property-penthouse.jpg', '/images/property-interior.jpg', '/images/hero-bg.jpg', '/images/property-house.jpg'],
    featured: true,
    lat: -34.6128,
    lng: -58.3612,
    createdAt: '2026-01-20',
  },
];

/**
 * Helper to format price
 */
export function formatPrice(price, currency = 'USD', label = '') {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price);
  return `${currency} ${formatted}${label || ''}`;
}

/**
 * Get unique values for filter options
 */
export function getFilterOptions() {
  const operations = [...new Set(MOCK_PROPERTIES.map(p => p.operation))];
  const types = [...new Set(MOCK_PROPERTIES.map(p => p.type))];
  const neighborhoods = [...new Set(MOCK_PROPERTIES.map(p => p.neighborhood))];

  return { operations, types, neighborhoods };
}

/**
 * Filter properties
 */
export function filterProperties(props, filters = {}) {
  return props.filter(p => {
    if (filters.operation && p.operationType !== filters.operation) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.neighborhood && p.neighborhood !== filters.neighborhood) return false;
    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    if (filters.bedrooms && p.bedrooms < parseInt(filters.bedrooms)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

/**
 * Sort properties
 */
export function sortProperties(props, sortBy = 'recent') {
  const sorted = [...props];
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'area':
      return sorted.sort((a, b) => b.totalArea - a.totalArea);
    case 'recent':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}
