import { cache } from 'react';
import { getSiteContent } from './siteContent';

// Versión memoizada por request (React cache) para Server Components.
// Deduplica la lectura cuando layout.js y page.js la piden en el mismo render.
// Solo para uso server-side; los componentes client usan getSiteContent directo.
export const getSiteContentCached = cache(getSiteContent);
