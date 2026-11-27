// Ficha genérica (sin branding) para compartir entre colegas.
// /ficha/[id]/colega — misma data que /ficha/[id], sin logo, agente ni contacto.

import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getMeliPropertyById } from '@/lib/mercadolibre';
import FichaView from '../FichaView';

export const revalidate = 300;

const getProperty = cache((id) => getMeliPropertyById(id));

export async function generateMetadata({ params }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return { title: 'Ficha no encontrada' };

  const desc = `${property.type} en ${property.operation} · ${property.location}`;
  return {
    title: property.title,
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

export default async function FichaColegaPage({ params }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <FichaView property={property} mode="colega" />;
}
