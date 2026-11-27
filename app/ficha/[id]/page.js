// Ficha premium de una propiedad de MercadoLibre.
// /ficha/[id] — link compartible + export PDF (desde FichaView).

import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getMeliPropertyById } from '@/lib/mercadolibre';
import FichaView from './FichaView';

export const revalidate = 300;

// Deduplica el fetch entre generateMetadata y el render.
const getProperty = cache((id) => getMeliPropertyById(id));

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
  return <FichaView property={property} />;
}
