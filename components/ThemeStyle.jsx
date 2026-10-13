import { mapThemeToCss } from '@/lib/content/theme';

export default function ThemeStyle({ theme }) {
  const css = mapThemeToCss(theme?.colors);
  if (!css) return null;
  return <style id="site-theme" dangerouslySetInnerHTML={{ __html: css }} />;
}
