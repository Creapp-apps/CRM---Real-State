/**
 * Tokko Broker API Service
 * Centraliza las llamadas a la API de Tokko Broker y normaliza el formato de las propiedades.
 */

const TOKKO_API_KEY = process.env.TOKKO_API_KEY || 'aa5b7012e5e37f19bfdce6117fddab9a2c455d67';
const TOKKO_BASE_URL = 'https://tokkobroker.com/api/v1';

/**
 * Mapea la información de tipo de propiedad de Tokko al español.
 */
function translatePropertyType(typeObj) {
  if (!typeObj) return 'Propiedad';
  const name = typeObj.name || '';
  const code = typeObj.code || '';
  
  if (code === 'HO' || name.toLowerCase().includes('house') || name.toLowerCase().includes('casa')) return 'Casa';
  if (code === 'AP' || name.toLowerCase().includes('apartment') || name.toLowerCase().includes('departamento')) return 'Departamento';
  if (code === 'LA' || name.toLowerCase().includes('land') || name.toLowerCase().includes('terreno')) return 'Terreno';
  if (code === 'PH' || name.toLowerCase().includes('ph')) return 'PH';
  if (code === 'CO' || name.toLowerCase().includes('commercial') || name.toLowerCase().includes('local')) return 'Local';
  if (code === 'OF' || name.toLowerCase().includes('office') || name.toLowerCase().includes('oficina')) return 'Oficina';
  
  return name || 'Propiedad';
}

/**
 * Normaliza un objeto de propiedad de Tokko Broker al formato interno de CMPROP.
 */
export function normalizeTokkoProperty(p) {
  if (!p) return null;

  const mainOp = p.operations && p.operations[0] ? p.operations[0] : null;
  const mainPrice = mainOp && mainOp.prices && mainOp.prices[0] ? mainOp.prices[0] : null;
  const rawOpType = mainOp ? mainOp.operation_type : 'Sale';

  const isSale = rawOpType.toLowerCase().includes('sale') || rawOpType.toLowerCase().includes('venta');
  const operationLabel = isSale ? 'Venta' : 'Alquiler';
  const operationType = isSale ? 'venta' : 'alquiler';

  const typeLabel = translatePropertyType(p.type);
  const locationName = p.location ? (p.location.name || p.location.full_location || '') : '';
  const fullAddress = p.address || p.real_address || locationName;

  // Extraer imágenes
  let photos = [];
  if (Array.isArray(p.photos) && p.photos.length > 0) {
    photos = p.photos
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(ph => ph.original || ph.image || ph.thumb)
      .filter(Boolean);
  }
  if (photos.length === 0) {
    photos = ['/images/hero-bg.jpg'];
  }

  // Extraer amenities/tags
  const amenities = Array.isArray(p.tags) ? p.tags.map(t => t.name).filter(Boolean) : [];

  // Título y Slug
  const title = p.publication_title || `${typeLabel} en ${operationLabel} en ${locationName}`;
  const slug = p.id ? String(p.id) : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id: String(p.id),
    tokkoId: p.id,
    referenceCode: p.reference_code || `TK-${p.id}`,
    title: title,
    slug: slug,
    operation: operationLabel,
    operationType: operationType,
    type: typeLabel,
    price: mainPrice ? Number(mainPrice.price) : 0,
    currency: mainPrice ? (mainPrice.currency === 'USD' ? 'USD' : '$') : 'USD',
    priceLabel: !isSale ? '/mes' : '',
    location: locationName || 'Buenos Aires',
    address: fullAddress,
    neighborhood: locationName,
    bedrooms: Number(p.room_amount || p.suite_amount || 0),
    bathrooms: Number(p.bathroom_amount || 0),
    garages: Number(p.parking_lot_amount || 0),
    totalArea: Number(p.total_surface || 0),
    coveredArea: Number(p.roofed_surface || 0),
    description: p.description || p.rich_description || 'Sin descripción disponible.',
    images: photos,
    featured: Boolean(p.is_front_cover || p.web_price),
    lat: p.geo_lat ? Number(p.geo_lat) : null,
    lng: p.geo_long ? Number(p.geo_long) : null,
    amenities: amenities,
    producer: p.producer || null,
    publicUrl: p.public_url || null,
    createdAt: p.created_at || new Date().toISOString()
  };
}

/**
 * Obtiene el listado de propiedades de Tokko Broker con soporte para filtros y paginación.
 */
export async function getTokkoProperties({ limit = 100, offset = 0, operationType = null, propertyType = null } = {}) {
  try {
    let url = `${TOKKO_BASE_URL}/property/?format=json&key=${TOKKO_API_KEY}&limit=${limit}&offset=${offset}&lang=es_ar`;

    const res = await fetch(url, {
      next: { revalidate: 300 } // Cache por 5 minutos
    });

    if (!res.ok) {
      console.error(`[Tokko API Error] HTTP ${res.status}: ${res.statusText}`);
      return { properties: [], total: 0 };
    }

    const data = await res.json();
    const rawProperties = data.objects || [];
    let properties = rawProperties.map(normalizeTokkoProperty).filter(Boolean);

    if (operationType && operationType !== 'todas') {
      properties = properties.filter(p => p.operationType === operationType.toLowerCase());
    }
    if (propertyType && propertyType !== 'todos') {
      properties = properties.filter(p => p.type.toLowerCase() === propertyType.toLowerCase());
    }

    return {
      properties: properties,
      total: data.meta ? data.meta.total_count : properties.length
    };
  } catch (error) {
    console.error('[Tokko API Fetch Exception]:', error);
    return { properties: [], total: 0 };
  }
}

/**
 * Obtiene una propiedad específica de Tokko Broker por su ID.
 */
export async function getTokkoPropertyById(id) {
  try {
    const url = `${TOKKO_BASE_URL}/property/${id}/?format=json&key=${TOKKO_API_KEY}&lang=es_ar`;

    const res = await fetch(url, {
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      console.error(`[Tokko API Property Error] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return normalizeTokkoProperty(data);
  } catch (error) {
    console.error('[Tokko API Property Fetch Exception]:', error);
    return null;
  }
}

/**
 * Obtiene los desarrollos / emprendimientos de Tokko Broker.
 */
export async function getTokkoDevelopments() {
  try {
    const url = `${TOKKO_BASE_URL}/development/?format=json&key=${TOKKO_API_KEY}&lang=es_ar`;

    const res = await fetch(url, {
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      return { developments: [], total: 0 };
    }

    const data = await res.json();
    const rawDevs = data.objects || [];
    const developments = rawDevs.map(d => ({
      id: String(d.id),
      title: d.name || 'Emprendimiento',
      location: d.location ? d.location.full_location : '',
      description: d.description || '',
      image: d.photos && d.photos[0] ? (d.photos[0].original || d.photos[0].image) : '/images/hero-bg.jpg',
      status: d.construction_date ? `Entrega: ${d.construction_date}` : 'En desarrollo',
      units: d.total_of_units ? `${d.total_of_units} unidades` : ''
    }));

    return {
      developments: developments,
      total: data.meta ? data.meta.total_count : developments.length
    };
  } catch (error) {
    console.error('[Tokko API Developments Exception]:', error);
    return { developments: [], total: 0 };
  }
}

/**
 * Envía un nuevo contacto (Lead) a Tokko Broker CRM.
 */
export async function sendTokkoLead({ name, email, phone, text, propertyId }) {
  try {
    const url = `${TOKKO_BASE_URL}/webcontact/?key=${TOKKO_API_KEY}`;
    
    const payload = {
      name: name,
      email: email,
      phone: phone || '',
      text: text || 'Consulta desde la web CMPROP',
      properties: propertyId ? [Number(propertyId)] : []
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 201 || res.ok) {
      return { success: true };
    }

    const errText = await res.text();
    console.error(`[Tokko Lead Error] HTTP ${res.status}:`, errText);
    return { success: false, error: errText };
  } catch (error) {
    console.error('[Tokko Lead Exception]:', error);
    return { success: false, error: error.message };
  }
}
