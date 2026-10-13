function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Deep-merge: partial pisa defaults. Arrays se reemplazan completos.
// null/undefined en partial => cae al default.
export function withDefaults(partial, defaults) {
  if (!isPlainObject(partial)) return clone(defaults);
  const out = clone(defaults);
  for (const key of Object.keys(partial)) {
    const pv = partial[key];
    if (pv === null || pv === undefined) continue; // cae a default
    if (isPlainObject(pv) && isPlainObject(out[key])) {
      out[key] = withDefaults(pv, out[key]);
    } else {
      out[key] = isPlainObject(pv) || Array.isArray(pv) ? clone(pv) : pv;
    }
  }
  return out;
}

function clone(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}
