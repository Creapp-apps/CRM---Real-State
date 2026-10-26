// Prepara una imagen del navegador para subirla a MercadoLibre.
// MELI solo acepta JPG, JPEG, PNG, GIF, WEBP (NO HEIC) y exige fotos
// horizontales (mínimo 4:3). Las fotos de iPhone vienen en HEIC, que el
// browser ni siquiera decodifica en <img>, así que las convertimos primero.

// Código de error que el caller usa para mostrar el toast "Formato no admitido".
export const UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT';

const MELI_VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function hasHeicExt(file) {
  return /\.(heic|heif)$/i.test(file.name || '');
}

function unsupported(message) {
  const err = new Error(message);
  err.code = UNSUPPORTED_FORMAT;
  return err;
}

// Si el archivo es HEIC/HEIF, lo convierte a un File JPEG. Si no, lo devuelve igual.
// Import dinámico: heic-to solo corre en cliente (usa libheif/wasm).
async function toJpegIfHeic(file) {
  const { isHeic, heicTo } = await import('heic-to');

  let heic = hasHeicExt(file);
  if (!heic) {
    try { heic = await isHeic(file); } catch { /* firma ilegible → tratamos por type */ }
  }
  if (!heic) return file;

  let blob;
  try {
    blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });
  } catch {
    throw unsupported('No pudimos convertir esta imagen HEIC.');
  }
  const name = (file.name || 'foto').replace(/\.\w+$/, '.jpg');
  return new File([blob], name, { type: 'image/jpeg' });
}

// Si la foto es vertical, la centra sobre fondo blanco para que quede 4:3.
function padPortraitTo43(file) {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;

      // Landscape o cuadrada → sube tal cual (ya es un tipo válido).
      if (w >= h) { resolve(file); return; }

      // Vertical → canvas 4:3 con la imagen centrada y fondo blanco.
      const canvasW = Math.ceil(h * (4 / 3));
      const canvasH = h;
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, Math.floor((canvasW - w) / 2), 0, w, h);

      canvas.toBlob(
        (blob) => resolve(new File([blob], (file.name || 'foto').replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg', 0.92
      );
    };
    // Si no se puede decodificar, no inventamos: devolvemos el archivo tal cual.
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

// Punto de entrada: HEIC → JPEG, encuadre 4:3 si es vertical, y rechazo tipado
// (UNSUPPORTED_FORMAT) para formatos que MELI no acepta y no podemos convertir.
export async function normalizeImageForMeli(file) {
  const working = await toJpegIfHeic(file);

  const type = (working.type || '').toLowerCase();
  // Si tiene un type conocido y no es válido (tiff, bmp, pdf, etc.) → rechazo claro.
  // Si viene vacío (algunos browsers), lo dejamos pasar y que MELI decida.
  if (type && !MELI_VALID_TYPES.includes(type)) {
    throw unsupported('Formato no admitido.');
  }

  return padPortraitTo43(working);
}
