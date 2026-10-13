import { describe, it, expect } from 'vitest';
import { withDefaults, CONTENT_DEFAULTS, THEME_DEFAULTS } from './defaults.js';

const DEF = {
  hero: { subtitle: 'sub-def', scrollText: 'scroll-def' },
  stats: [{ value: '1', label: 'a' }],
};

describe('withDefaults', () => {
  it('devuelve los defaults cuando partial es undefined o {}', () => {
    expect(withDefaults(undefined, DEF)).toEqual(DEF);
    expect(withDefaults({}, DEF)).toEqual(DEF);
  });

  it('pisa solo los campos presentes y rellena el resto (deep)', () => {
    const out = withDefaults({ hero: { subtitle: 'nuevo' } }, DEF);
    expect(out.hero.subtitle).toBe('nuevo');
    expect(out.hero.scrollText).toBe('scroll-def'); // relleno
    expect(out.stats).toEqual(DEF.stats);            // sección ausente -> default
  });

  it('reemplaza arrays completos, no por índice', () => {
    const out = withDefaults({ stats: [{ value: '9', label: 'z' }] }, DEF);
    expect(out.stats).toEqual([{ value: '9', label: 'z' }]);
  });

  it('trata null como ausente (cae a default)', () => {
    const out = withDefaults({ hero: { subtitle: null } }, DEF);
    expect(out.hero.subtitle).toBe('sub-def');
  });

  it('no muta los defaults', () => {
    const snapshot = JSON.parse(JSON.stringify(DEF));
    withDefaults({ hero: { subtitle: 'x' } }, DEF);
    expect(DEF).toEqual(snapshot);
  });
});

describe('defaults', () => {
  it('content tiene todas las secciones', () => {
    expect(Object.keys(CONTENT_DEFAULTS)).toEqual(
      expect.arrayContaining(['hero', 'stats', 'values', 'operations', 'cta', 'footer', 'navbar'])
    );
    expect(CONTENT_DEFAULTS.stats).toHaveLength(4);
    expect(CONTENT_DEFAULTS.values.items).toHaveLength(3);
    expect(CONTENT_DEFAULTS.operations.items).toHaveLength(4);
  });
  it('theme tiene colors y media', () => {
    expect(THEME_DEFAULTS.colors.gold).toBe('#FFFFFF');
    expect(THEME_DEFAULTS.media).toHaveProperty('heroVideo', null);
  });
});
