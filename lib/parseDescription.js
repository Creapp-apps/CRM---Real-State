// Parseo inteligente de descripciones de MercadoLibre a secciones legibles.
// Limpia basura (emojis rotos convertidos en "?"), corta el disclaimer legal,
// detecta títulos de sección y listas, y devuelve una estructura para render.

function stripJunk(s) {
  // saca marcadores/emojis rotos al inicio (?, ¿, •, *, flechas) y espacios sobrantes
  return s.replace(/^[\s?¿·•*►▸▪◦‣–—>·|]+/, '').replace(/\s+$/, '').trim();
}

function isUpperish(s) {
  const letters = s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  return letters.length > 2 && letters === letters.toUpperCase();
}

function sentenceCase(s) {
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function iconFor(title) {
  const t = title.toLowerCase();
  if (/amenit|servicio|edificio|comodidad|equip|instalac/.test(t)) return 'building';
  if (/ubicaci|zona|barrio|acceso|transporte|cercan/.test(t)) return 'pin';
  if (/condicion|ingres|requisito|contrato|document|garant|dep[oó]sito|reserva/.test(t)) return 'clipboard';
  if (/descrip|propiedad|caracter|detalle/.test(t)) return 'home';
  return 'sparkle';
}

/**
 * @param {string} raw
 * @returns {{ tagline: string|null, sections: Array<{title:string|null, icon:string|null, blocks:Array}> }}
 */
export function parseDescription(raw) {
  if (!raw || /^sin descripci/i.test(raw)) return { tagline: null, sections: [] };

  const lines = [];
  for (const orig of raw.replace(/\r/g, '').split('\n')) {
    const trimmed = orig.trim();
    if (!trimmed) continue;
    const bulletMark = /^[\*\-•·▪►▸◦‣]\s+/.test(trimmed);
    const text = stripJunk(trimmed);
    if (!text) continue;
    lines.push({ text, bulletMark });
  }
  if (!lines.length) return { tagline: null, sections: [] };

  // cortar la cola de disclaimer legal (ya mostramos el nuestro en el footer)
  const legalRe = /(valores de las expensas|son todos aproximados|datos sobre la arquitectura|martillero responsable|deber[áa] comprobar los datos|no comprometen contractual)/i;
  let endIdx = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (legalRe.test(lines[i].text)) { endIdx = i; break; }
  }
  const body = lines.slice(0, endIdx);
  if (!body.length) return { tagline: null, sections: [] };

  // tagline = primera línea si es un título largo en mayúsculas
  let tagline = null;
  let start = 0;
  if (isUpperish(body[0].text) && body[0].text.length > 48) {
    tagline = sentenceCase(body[0].text);
    start = 1;
  }

  const endsColon = (s) => /:$/.test(s);
  const endsSentence = (s) => /[.!?)]$/.test(s);
  const wordCount = (s) => s.trim().split(/\s+/).length;

  const isHeader = (s) => {
    const len = s.length;
    if (isUpperish(s) && len >= 3 && len <= 55) return true;
    if (endsColon(s) && len <= 34 && wordCount(s) <= 4) return true;
    return false;
  };
  const isBullet = (ln) => {
    if (ln.bulletMark) return true;
    const s = ln.text;
    if (isHeader(s)) return false;
    if (/[,:]$/.test(s)) return false;
    return s.length <= 48 && wordCount(s) <= 7 && (!endsSentence(s) || wordCount(s) <= 6);
  };

  const sections = [];
  let cur = { title: null, icon: null, blocks: [] };
  const pushCur = () => { if (cur.title || cur.blocks.length) sections.push(cur); };

  for (let i = start; i < body.length; i++) {
    const ln = body[i];
    if (isHeader(ln.text)) {
      pushCur();
      const title = ln.text.replace(/:$/, '').trim();
      cur = { title, icon: iconFor(title), blocks: [] };
      continue;
    }
    if (isBullet(ln)) {
      const last = cur.blocks[cur.blocks.length - 1];
      const item = ln.text.replace(/\s*[.;]$/, '');
      if (last && last.type === 'ul') last.items.push(item);
      else cur.blocks.push({ type: 'ul', items: [item] });
    } else {
      cur.blocks.push({ type: 'p', text: ln.text });
    }
  }
  pushCur();

  return { tagline, sections };
}
