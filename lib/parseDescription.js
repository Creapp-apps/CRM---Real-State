// Parseo inteligente de descripciones de MercadoLibre.
// - extractHighlights(): sintetiza datos duros (distancias, capacidad, unidades,
//   lote, plantas, servicios) en "destacados" con ícono para render gráfico.
// - parseDescription(): limpia basura, corta disclaimer/firma, y arma secciones
//   con títulos, párrafos y listas (bullets solo cuando hay runs reales).

function stripJunk(s) {
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

function cap(w) {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function groupThousands(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function normUnit(u) {
  const x = u.toLowerCase().replace(/\./g, '');
  if (/^(m2|m²|mts2|mts²)$/.test(x)) return 'm²';
  if (/^(km|kms)$/.test(x)) return 'km';
  if (/^(m|mt|mts|metros?)$/.test(x)) return 'm';
  if (/^cuadras?$/.test(x)) return 'cuadras';
  if (/^min/.test(x)) return 'min';
  if (/^(hect|hectareas?|hectáreas?|has?|ha)$/.test(x)) return 'ha';
  return x;
}

function cleanPhrase(s) {
  return s.replace(/\s+/g, ' ').replace(/\s+(y|de|del|la|el|los|las)$/i, '').trim();
}

const LEGAL_RE = /(valores de las? expensas|son todos aproximados|datos sobre la arquitectura|martiller[oa] responsable|martiller[oa] y corredor|corredor[a]? p[úu]blica|matr[íi]cula\s|deber[áa] comprobar los datos|no comprometen contractual|no constituye oferta)/i;

/**
 * Extrae datos duros de la descripción como destacados con ícono.
 * @returns {Array<{icon:string, label:string, value:string, wide?:boolean}>}
 */
export function extractHighlights(raw) {
  if (!raw) return [];
  // cortar la firma/legal antes de extraer para no tomar datos del pie.
  // se preservan los saltos de línea (los patrones no deben cruzar renglones).
  const cutAt = raw.search(LEGAL_RE);
  const text = (cutAt > 0 ? raw.slice(0, cutAt) : raw).replace(/[ \t]+/g, ' ').trim();
  const out = [];
  const seen = new Set();
  const add = (icon, label, value, wide = false) => {
    const key = `${label}|${value}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ icon, label, value, wide });
  };

  // Unidades (cabañas, departamentos, casas, lotes, oficinas...)
  let m = text.match(/\b(\d+)\s+(caba[ñn]as|departamentos|monoambientes|d[úu]plex|duplex|unidades|lotes|oficinas|locales|casas|cocheras)\b/i);
  if (m) add('home', 'Unidades', `${m[1]} ${m[2].toLowerCase()}`);

  // Capacidad
  m = text.match(/capacidad\s+(?:m[aá]xima\s+)?(?:de\s+)?(\d+)\s*personas/i);
  if (m) add('users', 'Capacidad', `${m[1]} personas${/cada una/i.test(text) ? ' c/u' : ''}`);

  // Lote / terreno (área)
  m = text.match(/\b(?:lote|terreno|parcela)\s+(?:de\s+)?([\d.,]+)\s*(m2|m²|mts?2?|metros?|hect[aá]reas?|has?|ha)\b/i);
  if (m) {
    const unit = /(hect|ha)/i.test(m[2]) ? 'ha' : 'm²';
    add('ruler', 'Lote', `${groupThousands(m[1].replace(/\D/g, ''))} ${unit}`);
  }

  // Plantas / niveles
  m = text.match(/\b(?:de\s+)?(dos|tres|cuatro|cinco|\d+)\s+plantas\b/i);
  if (m) add('layers', 'Niveles', `${cap(m[1])} plantas`);

  // Distancias (hasta 3) → una tarjeta de ubicación ancha
  const dist = [];
  const re = /\ba\s+([\d.,]+)\s*(kms?|mts?|metros?|cuadras?|min(?:utos)?)\s+(?:del?|de la|de los|de las|de|al?)\s+([a-zñáéíóúA-ZÑÁÉÍÓÚ0-9][^.,;:()\-–\n]{2,36})/gi;
  let d;
  while ((d = re.exec(text)) && dist.length < 3) {
    dist.push(`${groupThousands(d[1].replace(/\D/g, ''))} ${normUnit(d[2])} de ${cleanPhrase(d[3])}`);
  }
  if (dist.length) add('pin', 'Ubicación', dist.join(' · '), true);

  // Servicios puntuales
  if (/calefacci[oó]n\s+central/i.test(text)) add('flame', 'Climatización', 'Calefacción central');
  if (/gas\s+natural/i.test(text)) add('droplet', 'Servicios', 'Gas natural');
  if (/totalmente\s+equipad[oa]s?/i.test(text)) add('check', 'Equipamiento', 'Totalmente equipado');
  if (/construcci[oó]n\s+(?:tradicional\s+)?premium/i.test(text)) add('star', 'Construcción', 'Premium');
  if (/vista\s+al\s+(lago|r[íi]o|mar|golf)/i.test(text)) {
    const v = text.match(/vista\s+al\s+(lago|r[íi]o|mar|golf)/i);
    add('eye', 'Vista', `Al ${v[1].toLowerCase()}`);
  }

  return out.slice(0, 7);
}

/**
 * @returns {{ tagline: string|null, sections: Array<{title:string|null, icon:string|null, blocks:Array}> }}
 */
export function parseDescription(raw) {
  if (!raw || /^sin descripci/i.test(raw)) return { tagline: null, sections: [] };

  const rawLines = [];
  for (const orig of raw.replace(/\r/g, '').split('\n')) {
    const trimmed = orig.trim();
    if (!trimmed) continue;
    const bulletMark = /^[\*\-•·▪►▸◦‣]\s+/.test(trimmed);
    const txt = stripJunk(trimmed);
    if (!txt) continue;
    rawLines.push({ text: txt, bulletMark });
  }
  if (!rawLines.length) return { tagline: null, sections: [] };

  // cortar la cola de disclaimer/firma
  let endIdx = rawLines.length;
  for (let i = 0; i < rawLines.length; i++) {
    if (LEGAL_RE.test(rawLines[i].text)) { endIdx = i; break; }
  }
  const body = rawLines.slice(0, endIdx);
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
  const isCand = (ln) => {
    if (ln.bulletMark) return true;
    const s = ln.text;
    if (isHeader(s)) return false;
    if (/[,:]$/.test(s)) return false;
    return s.length <= 48 && wordCount(s) <= 7 && (!endsSentence(s) || wordCount(s) <= 6);
  };

  // marcar header/candidato y decidir listItem (solo runs >=2 o marcador explícito)
  const flags = body.map((ln) => ({ ...ln, header: isHeader(ln.text), cand: isCand(ln) }));
  const isListItem = (i) => {
    const f = flags[i];
    if (f.header) return false;
    if (f.bulletMark) return true;
    if (!f.cand) return false;
    const prev = flags[i - 1];
    const next = flags[i + 1];
    const prevOk = prev && !prev.header && prev.cand;
    const nextOk = next && !next.header && next.cand;
    return prevOk || nextOk;
  };

  const sections = [];
  let cur = { title: null, icon: null, blocks: [] };
  const pushCur = () => { if (cur.title || cur.blocks.length) sections.push(cur); };

  for (let i = start; i < flags.length; i++) {
    const ln = flags[i];
    if (ln.header) {
      pushCur();
      const title = ln.text.replace(/:$/, '').trim();
      cur = { title, icon: iconFor(title), blocks: [] };
      continue;
    }
    if (isListItem(i)) {
      const item = ln.text.replace(/\s*[.;]$/, '');
      const last = cur.blocks[cur.blocks.length - 1];
      if (last && last.type === 'ul') last.items.push(item);
      else cur.blocks.push({ type: 'ul', items: [item] });
    } else {
      cur.blocks.push({ type: 'p', text: ln.text });
    }
  }
  pushCur();

  return { tagline, sections };
}

function iconFor(title) {
  const t = title.toLowerCase();
  if (/amenit|servicio|edificio|comodidad|equip|instalac/.test(t)) return 'building';
  if (/ubicaci|zona|barrio|acceso|transporte|cercan/.test(t)) return 'pin';
  if (/condicion|ingres|requisito|contrato|document|garant|dep[oó]sito|reserva/.test(t)) return 'clipboard';
  if (/descrip|propiedad|caracter|detalle/.test(t)) return 'home';
  return 'sparkle';
}
