import { describe, it, expect } from 'vitest';
import { mapThemeToCss } from './theme.js';

describe('mapThemeToCss', () => {
  it('genera CSS vars para colores hex válidos', () => {
    const css = mapThemeToCss({ gold: '#C9A96E', navy900: '#000000' });
    expect(css).toContain('--gold:#C9A96E');
    expect(css).toContain('--navy-900:#000000');
    expect(css.startsWith(':root{')).toBe(true);
    expect(css.endsWith('}')).toBe(true);
  });

  it('omite valores vacíos o no-hex (no emite var rota)', () => {
    const css = mapThemeToCss({ gold: '', navy900: 'rojo', goldLight: '#FFF' });
    expect(css).not.toContain('--gold:');
    expect(css).not.toContain('--navy-900:');
    expect(css).toContain('--gold-light:#FFF');
  });

  it('devuelve string vacío sin colores', () => {
    expect(mapThemeToCss({})).toBe('');
    expect(mapThemeToCss(undefined)).toBe('');
  });

  it('ignora claves desconocidas', () => {
    expect(mapThemeToCss({ inventado: '#fff' })).toBe('');
  });
});
