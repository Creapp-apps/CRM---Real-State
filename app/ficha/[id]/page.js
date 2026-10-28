// Ficha premium de una propiedad de MercadoLibre.
// /ficha/[id] — link compartible + export PDF (desde FichaView).

import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getMeliPropertyById } from '@/lib/mercadolibre';
import { ESTADO_DEFAULT } from '@/lib/estados';
import FichaView from './FichaView';

export const revalidate = 300;

// Deduplica el fetch entre generateMetadata y el render.
const getProperty = cache((id) => getMeliPropertyById(id));

const supaAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function getEstadoComercial(id) {
  try {
    const { data } = await supaAdmin
      .from('publicacion_estados')
      .select('estado_comercial')
      .eq('meli_item_id', id)
      .maybeSingle();
    return data?.estado_comercial || ESTADO_DEFAULT;
  } catch {
    return ESTADO_DEFAULT;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return { title: 'Ficha no encontrada | Cardoso Propiedades' };

  const desc = `${property.type} en ${property.operation} · ${property.location}`;
  return {
    title: `${property.title} | Cardoso Propiedades`,
    description: desc,
    robots: { index: false, follow: false },
    openGraph: {
      title: property.title,
      description: desc,
      images: property.images?.[0] ? [{ url: property.images[0] }] : [],
      type: 'website',
    },
  };
}

export default async function FichaPage({ params }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  property.estadoComercial = await getEstadoComercial(id);
  return <FichaView property={property} />;
}
