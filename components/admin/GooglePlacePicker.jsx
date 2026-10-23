'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── Loader único de Google Maps JS (cacheado a nivel módulo) ───────────── */
let mapsPromise = null;
function loadGoogleMaps(key) {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('SSR')); return; }
    if (window.google?.maps?.importLibrary) { resolve(window.google.maps); return; }
    const cb = '__cmpropInitGMaps';
    window[cb] = () => resolve(window.google.maps);
    const s = document.createElement('script');
    s.src =
      'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(key)}` +
      '&v=weekly&libraries=places,marker&loading=async' +
      `&language=es-419&region=AR&callback=${cb}`;
    s.async = true;
    s.onerror = () => reject(new Error('No se pudo cargar Google Maps. Revisá la API key y el billing.'));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

/* Lee los address_components que nos interesan para MELI */
function parseComponents(place) {
  const out = {};
  for (const c of place.addressComponents ?? []) {
    const t = c.types || [];
    if (t.includes('administrative_area_level_1')) out.provincia = c.longText;
    if (t.includes('locality')) out.ciudad = c.longText;
    if (!out.ciudad && t.includes('administrative_area_level_2')) out.ciudad = c.longText;
    if (t.includes('sublocality_level_1') || t.includes('neighborhood')) out.barrio = c.longText;
    if (t.includes('route')) out.calle = c.longText;
    if (t.includes('street_number')) out.altura = c.longText;
    if (t.includes('postal_code')) out.zip = c.longText;
  }
  return out;
}

/* ─── Picker: emite onPick({ addressLine, formatted, lat, lng, provincia, ciudad, barrio, zip }) ─
   En el drag del pin emite sólo { lat, lng } para que el padre actualice coordenadas. */
export default function GooglePlacePicker({ onPick }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const acHostRef = useRef(null);
  const acElRef = useRef(null);
  const mapHostRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState(key ? 'loading' : 'nokey'); // nokey | loading | ready | error
  const [errMsg, setErrMsg] = useState('');
  const [hasPick, setHasPick] = useState(false);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    loadGoogleMaps(key)
      .then(async (gmaps) => {
        if (cancelled) return;
        const { PlaceAutocompleteElement } = await gmaps.importLibrary('places');
        const { Map } = await gmaps.importLibrary('maps');

        // Autocomplete: web component montado a mano en un host SIN hijos de React.
        if (!acElRef.current && acHostRef.current) {
          const ac = new PlaceAutocompleteElement();
          ac.includedRegionCodes = ['ar'];
          ac.style.width = '100%';
          ac.addEventListener('gmp-select', async ({ placePrediction }) => {
            const place = placePrediction.toPlace();
            await place.fetchFields({
              fields: ['formattedAddress', 'location', 'addressComponents', 'displayName'],
            });
            const loc = place.location;
            const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
            const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
            placeMarker(lat, lng);
            const comps = parseComponents(place);
            const addressLine =
              [comps.calle, comps.altura].filter(Boolean).join(' ') ||
              place.formattedAddress || place.displayName || '';
            onPick?.({ addressLine, formatted: place.formattedAddress, lat, lng, ...comps });
          });
          acHostRef.current.appendChild(ac);
          acElRef.current = ac;
        }

        // Mapa (una sola instancia)
        if (!mapRef.current && mapHostRef.current) {
          mapRef.current = new Map(mapHostRef.current, {
            center: { lat: -34.6037, lng: -58.3816 }, zoom: 5,
            mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
          });
        }

        if (!cancelled) setStatus('ready');
      })
      .catch((e) => { if (!cancelled) { setStatus('error'); setErrMsg(e.message || 'Error'); } });

    return () => {
      cancelled = true;
      // El web component lo removemos nosotros: React no lo conoce.
      try { acElRef.current?.remove(); } catch { /* ya removido */ }
      acElRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function placeMarker(lat, lng) {
    const g = window.google;
    if (!mapRef.current || !g) return;
    setHasPick(true);
    mapRef.current.setCenter({ lat, lng });
    mapRef.current.setZoom(16);
    if (!markerRef.current) {
      markerRef.current = new g.maps.Marker({ map: mapRef.current, position: { lat, lng }, draggable: true });
      markerRef.current.addListener('dragend', (e) => {
        onPick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    } else {
      markerRef.current.setPosition({ lat, lng });
    }
  }

  if (status === 'nokey') {
    return (
      <div style={notice}>
        Falta configurar <code style={code}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> en <code style={code}>.env.local</code> para ver el mapa.
      </div>
    );
  }
  if (status === 'error') {
    return <div style={{ ...notice, borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}>{errMsg}</div>;
  }

  return (
    <>
      {status === 'loading' && <div style={{ ...notice, marginBottom: '0.75rem' }}>Cargando mapa…</div>}
      <div ref={acHostRef} style={{ width: '100%' }} />
      <div style={{
        marginTop: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)', position: 'relative', background: 'rgba(255,255,255,0.03)',
      }}>
        <div ref={mapHostRef} style={{ width: '100%', height: 300, display: hasPick ? 'block' : 'none' }} />
        {!hasPick && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--gray-300)', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
              Ingresá la dirección para que se muestre en el mapa
            </p>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>
              Luego podés mover el pin dentro de la zona para asegurarte de que el inmueble quede correctamente ubicado.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

const notice = {
  padding: '0.9rem 1rem', borderRadius: '0.5rem',
  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)',
  color: 'var(--gray-400)', fontSize: '0.82rem', lineHeight: 1.5,
};
const code = { background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.78rem' };
