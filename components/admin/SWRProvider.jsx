'use client';

import { SWRConfig } from 'swr';

// Persiste la caché SWR en localStorage → navegación instantánea incluso tras recarga
function localStorageProvider() {
  if (typeof window === 'undefined') return new Map();
  let map;
  try {
    map = new Map(JSON.parse(localStorage.getItem('cmprop-admin-cache') || '[]'));
  } catch {
    map = new Map();
  }
  window.addEventListener('beforeunload', () => {
    try {
      // Solo guardamos las últimas 30 claves para no saturar localStorage
      const entries = Array.from(map.entries()).slice(-30);
      localStorage.setItem('cmprop-admin-cache', JSON.stringify(entries));
    } catch {}
  });
  return map;
}

export default function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        revalidateOnFocus: false,      // no re-fetch al cambiar de pestaña
        revalidateOnReconnect: true,   // sí re-fetch al volver de offline
        dedupingInterval: 30_000,      // 30s entre requests duplicados
        errorRetryCount: 2,
        errorRetryInterval: 5_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
