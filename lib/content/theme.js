// clave en theme.colors -> nombre de CSS var en :root
export const COLOR_VAR_MAP = {
  navy900: '--navy-900',
  navy800: '--navy-800',
  navy700: '--navy-700',
  navy600: '--navy-600',
  navy500: '--navy-500',
  gold: '--gold',
  goldLight: '--gold-light',
  goldDark: '--gold-dark',
};

// Acepta #RGB, #RRGGBB, #RRGGBBAA
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function mapThemeToCss(colors) {
  if (!colors || typeof colors !== 'object') return '';
  const decls = [];
  for (const [key, cssVar] of Object.entries(COLOR_VAR_MAP)) {
    const val = colors[key];
    if (typeof val === 'string' && HEX.test(val.trim())) {
      decls.push(`${cssVar}:${val.trim()}`);
    }
  }
  return decls.length ? `:root{${decls.join(';')};}` : '';
}
