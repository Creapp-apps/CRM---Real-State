# Sistema de contenido editable de la Home (Fase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir editar la impronta de la home (textos, colores, media) desde el panel admin, con guardado real + feedback, reflejándose en la web pública, sobre una base multi-cliente.

**Architecture:** Tabla `site_settings` (una fila por tenant) con `content` y `theme` en JSONB. La web lee server-side con deep-merge contra defaults (cero regresión si falta data). El tema se inyecta como CSS vars en `layout.js`. El panel edita un draft controlado con preview en vivo y hace `upsert` centralizado en `lib/siteContent.js`.

**Tech Stack:** Next.js App Router (JS), React, Supabase JS (`@supabase/supabase-js`), CSS Modules, Supabase Storage. Vitest (nuevo) para helpers puros.

**Spec:** `docs/superpowers/specs/2026-10-13-contenido-editable-home-design.md`

## Global Constraints

- Proyecto en **JavaScript** (no TypeScript). Extensiones `.js`/`.jsx`. No introducir TS.
- Sin Tailwind. Estilos vía CSS Modules + variables de `app/globals.css`.
- Tenant actual: `'cardoso'`. Todo lo multi-tenant se parametriza por `tenant_slug`, default `'cardoso'`.
- Cliente Supabase: importar `{ supabase } from '@/lib/supabase'` (anon key). Env ya configuradas.
- Migrations SQL: archivo nuevo en `lib/*.sql`, se ejecuta **manualmente** en Supabase SQL Editor (no hay runner automático).
- **Cero regresión:** con la tabla vacía o con fallos de red, la web se ve idéntica a hoy. Todo campo faltante cae a su default.
- Copy en español rioplatense (es-AR), verbatim de los valores actuales (ver Task 2).
- Escritura abierta en esta fase (RLS permisivo). No implementar auth. Centralizar escritura en `saveSiteContent`.

## Review Focus

- **Tabla vacía / primera carga:** sin fila para el tenant, `getSiteContent` devuelve defaults completos y la home renderiza igual que hoy. (Test en Task 1/helper + verificación manual Task 6.)
- **Campo faltante en el JSON:** un `content` parcial (ej. solo `hero`) no debe dejar `undefined` en otras secciones; deep-merge rellena desde defaults. (Test en Task 1.)
- **Fallo de Supabase en lectura:** error o timeout ⇒ `getSiteContent` cae a defaults sin tirar, la web no rompe. (Verificación Task 4.)
- **Color inválido / vacío en theme:** un valor de color vacío o no-hex no debe emitir una CSS var rota; se omite y queda el valor de `globals.css`. (Test en Task 3.)
- **Media URL ausente:** `heroVideo` null/'' ⇒ `VideoBackground` usa `/videohero.mov`. (Verificación Task 12.)
- **Guardado fallido:** error en el `upsert` ⇒ toast de error, el draft NO se pierde, `saved` no cambia. (Verificación Task 19.)

---

## Estructura de archivos

**Nuevos:**
- `vitest.config.js` — config mínima (environment node).
- `lib/content/defaults.js` — defaults de `content` y `theme` + `withDefaults(partial, defaults)` (deep-merge).
- `lib/content/defaults.test.js` — tests de `withDefaults`.
- `lib/content/theme.js` — `mapThemeToCss(colors)` → string CSS `:root{...}`.
- `lib/content/theme.test.js` — tests de `mapThemeToCss`.
- `lib/siteContent.js` — `getSiteContent(tenant)` y `saveSiteContent(tenant, data)`.
- `lib/migration_site_content.sql` — tabla + RLS + seed.
- `components/ThemeStyle.jsx` — inyección de CSS vars.
- `components/admin/contenido/ContentEditor.jsx` — orquestador del editor (client).
- `components/admin/contenido/ContentCategorySidebar.jsx` — sub-nav de categorías.
- `components/admin/contenido/FieldGroup.jsx` — label + descripción + input/textarea.
- `components/admin/contenido/ColorEditor.jsx` — editor de colores.
- `components/admin/contenido/MediaUploader.jsx` — subida a Storage.
- `components/admin/contenido/LivePreview.jsx` — preview representativo por sección.
- `components/admin/contenido/Toast.jsx` — toast de feedback.
- `components/admin/contenido/fields.js` — definición declarativa de campos por categoría (label, descripción, path, tipo).

**Modificados:**
- `package.json` — devDep vitest + script `test`.
- `app/layout.js` — `await getSiteContent()` + `<ThemeStyle theme=...>`.
- `app/page.js` — `await getSiteContent()` + pasar props a secciones.
- `components/home/HeroSection.jsx`, `StorytellingSection.jsx`, `OperationsSection.jsx`, `CTASection.jsx`, `components/home/VideoBackground.jsx`, `components/layout/Footer.jsx`, `components/layout/Navbar.jsx` — recibir props con fallback.
- `app/admin/contenido/page.js` — reescritura: renderiza `<ContentEditor />`.
- `components/admin/admin.module.css` — clases nuevas del editor.

---

## Task 1: Setup de vitest + helper `withDefaults` (deep-merge)

**Files:**
- Create: `vitest.config.js`
- Create: `lib/content/defaults.test.js`
- Modify: `package.json` (devDependencies + scripts)
- Create: `lib/content/defaults.js` (solo la función `withDefaults` en este task; los defaults van en Task 2)

**Interfaces:**
- Produces: `withDefaults(partial, defaults)` → objeto nuevo; deep-merge donde los valores de `partial` pisan a `defaults`; los arrays se reemplazan completos (no se mergean por índice); `undefined`/ausente cae a default. Null explícito se trata como ausente (cae a default) salvo que se indique.

- [ ] **Step 1: Instalar vitest**

Run: `npm i -D vitest@2.1.9`

- [ ] **Step 2: Agregar script de test en package.json**

En `"scripts"` agregar: `"test": "vitest run"`.

- [ ] **Step 3: Crear vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Escribir el test que falla**

`lib/content/defaults.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { withDefaults } from './defaults.js';

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
```

- [ ] **Step 5: Correr el test y verificar que falla**

Run: `npm test`
Expected: FAIL (`withDefaults is not a function` / módulo sin export).

- [ ] **Step 6: Implementar `withDefaults`**

`lib/content/defaults.js`:
```js
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
```

- [ ] **Step 7: Correr el test y verificar que pasa**

Run: `npm test`
Expected: PASS (5 tests).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.js lib/content/defaults.js lib/content/defaults.test.js
git commit -m "feat(contenido): setup vitest + withDefaults deep-merge helper"
```

---

## Task 2: Defaults de `content` y `theme`

**Files:**
- Modify: `lib/content/defaults.js` (agregar `CONTENT_DEFAULTS` y `THEME_DEFAULTS`)
- Modify: `lib/content/defaults.test.js` (test de forma)

**Interfaces:**
- Produces: `CONTENT_DEFAULTS` y `THEME_DEFAULTS` (objetos). Importados por `siteContent.js`, el editor y los componentes.

**Valores verbatim** (fuente de verdad migrada de los componentes actuales).

- [ ] **Step 1: Agregar los defaults a `lib/content/defaults.js`**

```js
export const CONTENT_DEFAULTS = {
  hero: {
    rotatingWords: ['lugar', 'espacio', 'hogar', 'local', 'negocio'],
    titlePrefix: 'Te acompañamos a encontrar tu',
    titleSuffix: 'ideal',
    subtitle: 'Venta, alquiler y tasaciones de propiedades en Argentina',
    scrollText: 'Descubrí más',
  },
  stats: [
    { value: '500', suffix: '+', label: 'Propiedades vendidas' },
    { value: '15', suffix: '+', label: 'Años de experiencia' },
    { value: '1200', suffix: '+', label: 'Clientes satisfechos' },
    { value: '98', suffix: '%', label: 'Satisfacción' },
  ],
  values: {
    subtitle: 'Por qué elegirnos',
    titlePrefix: 'Hacemos de cada operación',
    titleHighlight: 'una experiencia única',
    items: [
      { title: 'Confianza', description: 'Transparencia y honestidad en cada operación. Tu tranquilidad es nuestra prioridad.' },
      { title: 'Alcance', description: 'Amplia red de contactos y presencia en los principales portales inmobiliarios.' },
      { title: 'Dedicación', description: 'Acompañamiento personalizado desde la primera consulta hasta la escritura.' },
    ],
  },
  operations: {
    subtitle: 'Explorá',
    titlePrefix: '¿Qué estás',
    titleHighlight: 'buscando',
    items: [
      { title: 'Venta', description: 'Encontrá tu propiedad ideal para comprar' },
      { title: 'Alquiler', description: 'Las mejores opciones para alquilar' },
      { title: 'Temporario', description: 'Alquileres temporarios y turísticos' },
      { title: 'Emprendimientos', description: 'Proyectos nuevos y en construcción' },
    ],
  },
  cta: {
    subtitle: 'Valorá tu inmueble',
    titlePrefix: '¿Querés',
    titleHighlight: 'tasar',
    titleSuffix: 'tu propiedad?',
    description: 'Obtené una tasación profesional sin cargo. Nuestro equipo de expertos evalúa tu propiedad con los mejores datos del mercado para que tomes las mejores decisiones.',
    btnPrimary: 'Solicitar tasación gratuita',
    btnSecondary: 'Contactanos',
  },
  footer: {
    brandText: 'Tu socio de confianza en el mercado inmobiliario. Experiencia, dedicación y compromiso para encontrar el hogar de tus sueños.',
    phone: '+54 9 11 6609 2461',
    whatsapp: '5491166092461',
    email: 'cardosom.prop@gmail.com',
    location: 'Buenos Aires, Argentina',
  },
  navbar: {
    ctaText: 'Tasá tu propiedad',
  },
};

export const THEME_DEFAULTS = {
  colors: {
    navy900: '#0A1628',
    navy800: '#0F2140',
    navy700: '#142C54',
    navy600: '#1A3A6B',
    navy500: '#1E4D8F',
    gold: '#FFFFFF',
    goldLight: '#F8F9FA',
    goldDark: '#E9ECEF',
  },
  media: {
    heroVideo: null,
    heroPoster: null,
  },
};
```

- [ ] **Step 2: Agregar test de forma en `lib/content/defaults.test.js`**

```js
import { CONTENT_DEFAULTS, THEME_DEFAULTS } from './defaults.js';

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
```

- [ ] **Step 3: Correr tests**

Run: `npm test`
Expected: PASS (tests previos + 2 nuevos).

- [ ] **Step 4: Commit**

```bash
git add lib/content/defaults.js lib/content/defaults.test.js
git commit -m "feat(contenido): defaults de content y theme (migrados de los hardcodes)"
```

---

## Task 3: `mapThemeToCss` (theme → CSS vars)

**Files:**
- Create: `lib/content/theme.js`
- Create: `lib/content/theme.test.js`

**Interfaces:**
- Consumes: forma de `THEME_DEFAULTS.colors` (Task 2).
- Produces: `mapThemeToCss(colors)` → string tipo `:root{--navy-900:#..;--gold:#..;}` o `''` si no hay colores válidos. `COLOR_VAR_MAP` (objeto clave→CSS var) exportado para reutilizar en el editor.

- [ ] **Step 1: Escribir el test que falla**

`lib/content/theme.test.js`:
```js
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
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test`
Expected: FAIL (`mapThemeToCss is not a function`).

- [ ] **Step 3: Implementar `lib/content/theme.js`**

```js
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
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/theme.js lib/content/theme.test.js
git commit -m "feat(contenido): mapThemeToCss + COLOR_VAR_MAP"
```

---

## Task 4: `lib/siteContent.js` — lectura y escritura

**Files:**
- Create: `lib/siteContent.js`

**Interfaces:**
- Consumes: `supabase` (`@/lib/supabase`), `CONTENT_DEFAULTS`, `THEME_DEFAULTS`, `withDefaults`.
- Produces:
  - `getSiteContent(tenant = 'cardoso')` → `Promise<{ content, theme }>`. Lee `site_settings`; hace `withDefaults` por separado para `content` y `theme`. Ante error/no-fila → defaults. Nunca lanza.
  - `saveSiteContent(tenant, { content, theme })` → `Promise<{ ok: boolean, error?: string }>`. `upsert` por `tenant_slug`. Único punto de escritura.

- [ ] **Step 1: Implementar `lib/siteContent.js`**

```js
import { supabase } from '@/lib/supabase';
import { CONTENT_DEFAULTS, THEME_DEFAULTS, withDefaults } from '@/lib/content/defaults';

const DEFAULT_TENANT = 'cardoso';

export async function getSiteContent(tenant = DEFAULT_TENANT) {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('content, theme')
      .eq('tenant_slug', tenant)
      .maybeSingle();
    if (error) throw error;
    return {
      content: withDefaults(data?.content, CONTENT_DEFAULTS),
      theme: withDefaults(data?.theme, THEME_DEFAULTS),
    };
  } catch (e) {
    // Resiliencia: la web nunca rompe por contenido. Cae a defaults.
    console.error('[siteContent] getSiteContent fallo, usando defaults:', e?.message || e);
    return { content: withDefaults(undefined, CONTENT_DEFAULTS), theme: withDefaults(undefined, THEME_DEFAULTS) };
  }
}

export async function saveSiteContent(tenant, { content, theme }) {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ tenant_slug: tenant, content, theme, updated_at: new Date().toISOString() }, { onConflict: 'tenant_slug' });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || 'Error desconocido al guardar' };
  }
}
```

- [ ] **Step 2: Verificación manual (lectura resiliente)**

Con la tabla todavía inexistente (Task 5 la crea), agregar temporalmente en cualquier Server Component un `await getSiteContent()` o correr un script node. Confirmar que **no tira** y devuelve defaults (el `console.error` puede aparecer; es esperado). Alternativa rápida:
Run: `node --input-type=module -e "import('./lib/siteContent.js').then(m=>m.getSiteContent()).then(r=>console.log(Object.keys(r.content), r.theme.colors.gold))"`
Expected: imprime las secciones y `#FFFFFF` sin crash. (Si node no resuelve el alias `@/`, validar en la verificación de Task 6 dentro de Next; no bloquear por el alias.)

- [ ] **Step 3: Commit**

```bash
git add lib/siteContent.js
git commit -m "feat(contenido): getSiteContent (resiliente) y saveSiteContent (upsert centralizado)"
```

---

## Task 5: Migration SQL + seed de la tabla

**Files:**
- Create: `lib/migration_site_content.sql`

**Interfaces:**
- Produces: tabla `site_settings` en Supabase con la fila `cardoso`.

- [ ] **Step 1: Crear `lib/migration_site_content.sql`**

```sql
-- Sistema de contenido editable del sitio (Fase 1)
CREATE TABLE IF NOT EXISTS site_settings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_slug TEXT UNIQUE NOT NULL,
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Fase 1: políticas permisivas (coherentes con el resto del admin actual).
-- TODO futuro: restringir "write" a rol admin cuando exista auth real.
DROP POLICY IF EXISTS "site_settings read" ON site_settings;
CREATE POLICY "site_settings read" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "site_settings write" ON site_settings;
CREATE POLICY "site_settings write" ON site_settings FOR ALL USING (true) WITH CHECK (true);

-- trigger_set_timestamp() ya existe en el proyecto (migration_fase1). Si no, crearlo:
-- CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS trigger AS $$
-- BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_timestamp_site_settings ON site_settings;
CREATE TRIGGER set_timestamp_site_settings
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Seed del tenant cardoso (vacío => la web usa defaults hasta que se edite).
INSERT INTO site_settings (tenant_slug, content, theme)
VALUES ('cardoso', '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (tenant_slug) DO NOTHING;
```

- [ ] **Step 2: Ejecutar la migration (manual)**

Abrir Supabase → SQL Editor → pegar y ejecutar `lib/migration_site_content.sql`.
Expected: tabla `site_settings` creada con 1 fila (`tenant_slug='cardoso'`).
Verificar: `SELECT tenant_slug FROM site_settings;` devuelve `cardoso`.

- [ ] **Step 3: Commit**

```bash
git add lib/migration_site_content.sql
git commit -m "feat(contenido): migration site_settings (tabla + RLS + seed cardoso)"
```

---

## Task 6: `ThemeStyle` + integración en `layout.js` + fetch en `page.js`

**Files:**
- Create: `components/ThemeStyle.jsx`
- Modify: `app/layout.js`
- Modify: `app/page.js`

**Interfaces:**
- Consumes: `getSiteContent`, `mapThemeToCss`.
- Produces: `app/page.js` pasa a cada sección su objeto de content (`hero={content.hero}`, etc.). Las props concretas de cada componente se consumen en Tasks 7-12.

- [ ] **Step 1: Crear `components/ThemeStyle.jsx`**

```jsx
import { mapThemeToCss } from '@/lib/content/theme';

export default function ThemeStyle({ theme }) {
  const css = mapThemeToCss(theme?.colors);
  if (!css) return null;
  return <style id="site-theme" dangerouslySetInnerHTML={{ __html: css }} />;
}
```

- [ ] **Step 2: Integrar en `app/layout.js`**

Convertir `RootLayout` en `async`. Leer el theme e inyectar `<ThemeStyle>` dentro de `<head>` (o al inicio de `<body>`). Importar al tope:
```js
import { getSiteContent } from '@/lib/siteContent';
import ThemeStyle from '@/components/ThemeStyle';
```
Cambiar la firma y el render:
```jsx
export default async function RootLayout({ children }) {
  const { theme } = await getSiteContent();
  return (
    <html lang="es">
      <head>
        <ThemeStyle theme={theme} />
      </head>
      <body className={`${outfit.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
```
(Mantener los `metadata` y fuentes ya existentes.)

- [ ] **Step 3: Fetch + props en `app/page.js`**

Convertir `Home` en `async`, leer content y pasar props:
```jsx
import { getSiteContent } from '@/lib/siteContent';
// ...
export default async function Home() {
  const { content } = await getSiteContent();
  return (
    <>
      <VideoBackground media={content /* usará content/theme media en Task 12 */} />
      <Navbar navbar={content.navbar} />
      <main>
        <HeroSection hero={content.hero} />
        <FeaturedProperties />
        <StorytellingSection stats={content.stats} values={content.values} />
        <OperationsSection operations={content.operations} />
        <CTASection cta={content.cta} />
      </main>
      <Footer footer={content.footer} />
    </>
  );
}
```
(En este task los componentes todavía ignoran las props; se cablean en Tasks 7-12. El sitio debe seguir viéndose igual.)

- [ ] **Step 4: Forzar render dinámico (para que los cambios se reflejen tras guardar)**

Como `layout.js` y `page.js` leen Supabase con el SDK (no `fetch`), en build de producción podrían quedar estáticos y no reflejar ediciones. Agregar en **ambos** archivos (`app/layout.js` y `app/page.js`), al nivel de módulo:
```js
export const dynamic = 'force-dynamic';
```
Requisito que esto garantiza: tras "Guardar", un refresh de la home muestra el cambio (Review Focus / spec §5). (Optimización futura opcional: volver a estático + `revalidatePath('/')` disparado desde la escritura; fuera de alcance de Fase 1.)

- [ ] **Step 5: Verificación manual**

Run: `npm run dev` y abrir la home.
Expected: la home se ve **idéntica** a hoy. En el HTML (view-source) no debe aparecer `<style id="site-theme">` (porque el theme guardado está vacío ⇒ defaults ⇒ `mapThemeToCss` devuelve `''`). Sin errores en consola del server.

- [ ] **Step 6: Commit**

```bash
git add components/ThemeStyle.jsx app/layout.js app/page.js
git commit -m "feat(contenido): ThemeStyle en layout + fetch de content en la home (dynamic)"
```

---

## Task 7: Cablear `HeroSection` a props (con fallback)

**Files:**
- Modify: `components/home/HeroSection.jsx`

**Interfaces:**
- Consumes: prop `hero` = `CONTENT_DEFAULTS.hero`.
- Import de fallback: `import { CONTENT_DEFAULTS } from '@/lib/content/defaults';`

Mapeo campo → ubicación actual → cómo queda:

| Campo prop | Línea actual (aprox) | Valor hardcode a reemplazar |
|---|---|---|
| `hero.rotatingWords` | L10 `ROTATING_WORDS` | usar `hero?.rotatingWords ?? CONTENT_DEFAULTS.hero.rotatingWords` |
| `hero.titlePrefix` | L165-169 (prefijo del H1) | `Te acompañamos a encontrar tu` |
| `hero.titleSuffix` | L165-169 (sufijo del H1) | `ideal` |
| `hero.subtitle` | L172-174 | `Venta, alquiler y tasaciones de propiedades en Argentina` |
| `hero.scrollText` | L248 | `Descubrí más` |

- [ ] **Step 1: Firma + fallback**

Al inicio del componente:
```js
export default function HeroSection({ hero } = {}) {
  const h = { ...CONTENT_DEFAULTS.hero, ...(hero || {}) };
  // usar h.rotatingWords, h.titlePrefix, h.titleSuffix, h.subtitle, h.scrollText
```
Si `ROTATING_WORDS` se usa en hooks/animaciones (L10), reemplazar la constante por `h.rotatingWords` dentro del componente (si se referencia fuera del componente, moverla adentro o derivarla con `useMemo`).

- [ ] **Step 2: Reemplazar los literales** por `h.titlePrefix`, `h.titleSuffix`, `h.subtitle`, `h.scrollText` en las líneas indicadas, conservando el markup/clases/animaciones existentes.

- [ ] **Step 3: Verificación manual**

Run: `npm run dev`. Hero se ve igual que hoy (defaults). Luego, en Supabase, editar la fila cardoso: `UPDATE site_settings SET content = '{"hero":{"subtitle":"PRUEBA HERO"}}' WHERE tenant_slug='cardoso';` → refrescar la home → el subtítulo cambia a "PRUEBA HERO" y el resto del hero queda intacto. Revertir: `UPDATE site_settings SET content='{}' WHERE tenant_slug='cardoso';`.

- [ ] **Step 4: Commit**

```bash
git add components/home/HeroSection.jsx
git commit -m "feat(contenido): HeroSection lee de props con fallback a defaults"
```

---

## Task 8: Cablear `StorytellingSection` (stats + values)

**Files:**
- Modify: `components/home/StorytellingSection.jsx`

**Interfaces:**
- Consumes: props `stats` (= `CONTENT_DEFAULTS.stats`) y `values` (= `CONTENT_DEFAULTS.values`).
- Import: `import { CONTENT_DEFAULTS } from '@/lib/content/defaults';`

Mapeo:

| Campo | Línea actual | Hardcode |
|---|---|---|
| `stats` (array 4) | L9-14 `STATS` | contadores |
| `values.items` (3) | L31-61 `VALUES` | tarjetas |
| `values.subtitle` | L80 | `Por qué elegirnos` |
| `values.titlePrefix` | L82-84 | `Hacemos de cada operación` |
| `values.titleHighlight` | L82-84 (`<span class="text-gold">`) | `una experiencia única` |

- [ ] **Step 1: Firma + fallback**

```js
export default function StorytellingSection({ stats, values } = {}) {
  const statsData = Array.isArray(stats) && stats.length ? stats : CONTENT_DEFAULTS.stats;
  const v = { ...CONTENT_DEFAULTS.values, ...(values || {}) };
  const valueItems = Array.isArray(v.items) && v.items.length ? v.items : CONTENT_DEFAULTS.values.items;
```
Reemplazar usos de `STATS` por `statsData`, de `VALUES` por `valueItems`, y los literales del subtítulo/título por `v.subtitle`, `v.titlePrefix`, `v.titleHighlight`. Si los contadores animados dependen de parsear `value` (ej. `parseInt`), mantener esa lógica operando sobre `statsData`.

- [ ] **Step 2: Verificación manual**

Home igual que hoy. Probar `UPDATE ... SET content='{"stats":[{"value":"999","suffix":"+","label":"Test"}]}'` → aparece 1 contador "999+ Test"; revertir a `'{}'`.

- [ ] **Step 3: Commit**

```bash
git add components/home/StorytellingSection.jsx
git commit -m "feat(contenido): StorytellingSection (stats+values) desde props"
```

---

## Task 9: Cablear `OperationsSection`

**Files:**
- Modify: `components/home/OperationsSection.jsx`

**Interfaces:**
- Consumes: prop `operations` (= `CONTENT_DEFAULTS.operations`).
- Import: `import { CONTENT_DEFAULTS } from '@/lib/content/defaults';`

Mapeo: `OPERATIONS` (L9-38) → **solo** `title` y `description` de cada ítem salen de props; los `href`/`image`/estructura quedan fijos. `subtitle` (L82), `titlePrefix`/`titleHighlight` (L83-85).

- [ ] **Step 1: Firma + merge por índice (manteniendo href/imagen fijos)**

```js
import { CONTENT_DEFAULTS } from '@/lib/content/defaults';
const OPERATIONS = [ /* ...estructura actual con href/image... */ ];

export default function OperationsSection({ operations } = {}) {
  const o = { ...CONTENT_DEFAULTS.operations, ...(operations || {}) };
  const items = OPERATIONS.map((op, i) => ({
    ...op,
    title: o.items?.[i]?.title ?? op.title,
    description: o.items?.[i]?.description ?? op.description,
  }));
```
Usar `items` en el render; `o.subtitle`, `o.titlePrefix`, `o.titleHighlight` en el encabezado.

- [ ] **Step 2: Verificación manual** — home igual; probar override de `operations.subtitle`; revertir.

- [ ] **Step 3: Commit**

```bash
git add components/home/OperationsSection.jsx
git commit -m "feat(contenido): OperationsSection textos desde props (href fijos)"
```

---

## Task 10: Cablear `CTASection`

**Files:**
- Modify: `components/home/CTASection.jsx`

**Interfaces:**
- Consumes: prop `cta` (= `CONTENT_DEFAULTS.cta`).

Mapeo: `subtitle` L12, título `titlePrefix`+`titleHighlight`+`titleSuffix` L13-15, `description` L16-20, `btnPrimary` L23, `btnSecondary` L26. Los `href` (`/tasar`, `/contacto`) quedan fijos.

- [ ] **Step 1: Firma + fallback**

```js
import { CONTENT_DEFAULTS } from '@/lib/content/defaults';
export default function CTASection({ cta } = {}) {
  const c = { ...CONTENT_DEFAULTS.cta, ...(cta || {}) };
```
Reemplazar literales por `c.subtitle`, `c.titlePrefix`, `c.titleHighlight`, `c.titleSuffix`, `c.description`, `c.btnPrimary`, `c.btnSecondary`.

- [ ] **Step 2: Verificación manual** — igual; override `cta.btnPrimary`; revertir.

- [ ] **Step 3: Commit**

```bash
git add components/home/CTASection.jsx
git commit -m "feat(contenido): CTASection desde props con fallback"
```

---

## Task 11: Cablear `Footer` y `Navbar`

**Files:**
- Modify: `components/layout/Footer.jsx`
- Modify: `components/layout/Navbar.jsx`

**Interfaces:**
- Consumes: `Footer` prop `footer` (= `CONTENT_DEFAULTS.footer`); `Navbar` prop `navbar` (= `CONTENT_DEFAULTS.navbar`).

Footer mapeo: `brandText` L34-37; contacto `phone` L62 (texto) + `whatsapp` (href `wa.me/<whatsapp>`), `email` L69, `location` L76. Links/columnas quedan fijos. Navbar: `ctaText` L67 y L102 (`Tasá tu propiedad`).

- [ ] **Step 1: Footer** — firma `export default function Footer({ footer } = {})`, `const f = { ...CONTENT_DEFAULTS.footer, ...(footer||{}) }`, reemplazar `brandText`, teléfono (texto `f.phone`, href `https://wa.me/${f.whatsapp}`), `f.email` (y su `mailto:`), `f.location`.

- [ ] **Step 2: Navbar** — firma `export default function Navbar({ navbar } = {})`, `const n = { ...CONTENT_DEFAULTS.navbar, ...(navbar||{}) }`, reemplazar ambos literales del CTA por `n.ctaText`.

- [ ] **Step 3: Verificación manual** — footer y navbar iguales; override `footer.email`; revertir.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Footer.jsx components/layout/Navbar.jsx
git commit -m "feat(contenido): Footer y Navbar CTA desde props"
```

---

## Task 12: Media del hero (`VideoBackground`)

**Files:**
- Modify: `components/home/VideoBackground.jsx`
- Modify: `app/page.js` (pasar la media real)

**Interfaces:**
- Consumes: prop `video` (string URL o null) — `theme.media.heroVideo`.

- [ ] **Step 1: Pasar la media desde page.js**

En `app/page.js` ya se lee `content`; agregar también `theme` del mismo `getSiteContent`:
```jsx
const { content, theme } = await getSiteContent();
// ...
<VideoBackground video={theme?.media?.heroVideo} />
```

- [ ] **Step 2: `VideoBackground` usa la URL o el default**

```jsx
export default function VideoBackground({ video } = {}) {
  const src = video || '/videohero.mov';
```
Reemplazar los dos `<source>` (L31-32) para que usen `src`. Mantener types; si la URL es de Storage (mp4), un único `<source src={src} />` sin forzar type es aceptable.

- [ ] **Step 3: Verificación manual** — sin `heroVideo` guardado, usa `/videohero.mov` (igual que hoy). Con una URL de prueba en `theme.media.heroVideo`, usa esa.

- [ ] **Step 4: Commit**

```bash
git add components/home/VideoBackground.jsx app/page.js
git commit -m "feat(contenido): VideoBackground usa heroVideo del theme con fallback"
```

---

## Task 13: Clases CSS del editor

**Files:**
- Modify: `components/admin/admin.module.css`

**Interfaces:**
- Produces: clases usadas por los componentes del editor (Tasks 14-19).

- [ ] **Step 1: Agregar al final de `admin.module.css`** (siguiendo el estilo existente: fondos navy, borde dorado suave, radios). Incluir:
  - `.editorLayout` (grid 3 columnas: categorías | formulario | preview; colapsa a 1 col en mobile `@media (max-width: 1100px)`).
  - `.catSidebar`, `.catItem`, `.catItemActive`, `.catDot` (punto de "cambios sin guardar").
  - `.editorForm`, `.editorPreview`, `.previewFrame` (contenedor del preview con su propio fondo navy).
  - `.fieldDesc` (texto gris chico de descripción).
  - `.colorRow`, `.colorSwatch`, `.colorHex` (editor de color).
  - `.uploader`, `.uploaderActive`, `.uploadProgress`.
  - `.toast`, `.toastSuccess`, `.toastError`, `.toastShow` (animación de entrada/salida, posición fixed bottom-right).
  - `.dirtyBadge`, `.btnGhost` (descartar).

Usar valores coherentes con el admin (`rgba(201,169,110,...)` para acentos, `rgba(15,33,64,...)` para fondos). (El contenido CSS exacto lo define el implementador siguiendo las clases existentes; cada clase arriba tiene un propósito único y acotado.)

- [ ] **Step 2: Verificación** — `npm run dev`, sin errores de build. (Las clases se usan en los próximos tasks.)

- [ ] **Step 3: Commit**

```bash
git add components/admin/admin.module.css
git commit -m "feat(contenido): clases CSS del editor de contenido"
```

---

## Task 14: Definición declarativa de campos (`fields.js`)

**Files:**
- Create: `components/admin/contenido/fields.js`

**Interfaces:**
- Produces: `CATEGORIES` — array de `{ key, label, section }` para el sidebar; `FIELDS` — por categoría, lista de `{ path, label, desc, type }` donde `type ∈ {'text','textarea','list'}` y `path` es la ruta dentro de `content`/`theme` (ej. `'hero.subtitle'`). Consumido por `ContentEditor`, `FieldGroup`, `LivePreview`.

- [ ] **Step 1: Crear `fields.js`** con las categorías y campos (texto real, sin placeholders). Ejemplo del shape (completar todas las secciones del spec §4.2 + Colores + Media):

```js
export const CATEGORIES = [
  { key: 'hero', label: 'Hero', scope: 'content' },
  { key: 'stats', label: 'Estadísticas', scope: 'content' },
  { key: 'values', label: 'Valores', scope: 'content' },
  { key: 'operations', label: 'Operaciones', scope: 'content' },
  { key: 'cta', label: 'CTA', scope: 'content' },
  { key: 'footer', label: 'Footer', scope: 'content' },
  { key: 'navbar', label: 'Navbar', scope: 'content' },
  { key: 'colors', label: 'Colores', scope: 'theme' },
  { key: 'media', label: 'Media', scope: 'theme' },
];

// Campos simples por categoría (los de tipo lista se renderizan aparte).
export const FIELDS = {
  hero: [
    { path: 'hero.titlePrefix', label: 'Título — parte 1', desc: 'Primera parte del título principal, antes de la palabra que rota.', type: 'text' },
    { path: 'hero.titleSuffix', label: 'Título — parte 2', desc: 'Parte final del título principal, después de la palabra que rota.', type: 'text' },
    { path: 'hero.rotatingWords', label: 'Palabras que rotan', desc: 'Palabras que se alternan en el título (una por línea).', type: 'list' },
    { path: 'hero.subtitle', label: 'Subtítulo', desc: 'Texto bajo el título principal de la portada.', type: 'text' },
    { path: 'hero.scrollText', label: 'Texto del indicador de scroll', desc: 'Micro-texto que invita a bajar (ej. "Descubrí más").', type: 'text' },
  ],
  // ... stats, values, operations, cta, footer, navbar con sus label/desc en es-AR ...
  // colors: lista de { path: 'colors.gold', label: 'Dorado / acento', desc: '...', type: 'color' } etc.
  // media: [{ path: 'media.heroVideo', label: 'Video del hero', desc: 'Video de fondo de la portada.', type: 'media' }]
};
```
Completar TODAS las categorías con sus campos y descripciones claras (una frase por campo, explicando qué ve el visitante). Para `stats`, `values.items`, `operations.items` usar `type: 'list'` (editor de ítems repetidos).

- [ ] **Step 2: Commit**

```bash
git add components/admin/contenido/fields.js
git commit -m "feat(contenido): definición declarativa de campos del editor"
```

---

## Task 15: `Toast` y `FieldGroup`

**Files:**
- Create: `components/admin/contenido/Toast.jsx`
- Create: `components/admin/contenido/FieldGroup.jsx`

**Interfaces:**
- Produces:
  - `<Toast toast={{ type, message }} onClose />` — type `'success'|'error'`, auto-oculta a los ~3.5s.
  - `<FieldGroup field={{label,desc,type}} value onChange />` — renderiza label + descripción + input/textarea según `type` (`text`/`textarea`). `onChange(newValue)`.

- [ ] **Step 1: `Toast.jsx`**

```jsx
'use client';
import { useEffect } from 'react';
import styles from '@/components/admin/admin.module.css';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const cls = toast.type === 'error' ? styles.toastError : styles.toastSuccess;
  return (
    <div className={`${styles.toast} ${cls} ${styles.toastShow}`} role="status">
      {toast.message}
    </div>
  );
}
```

- [ ] **Step 2: `FieldGroup.jsx`**

```jsx
'use client';
import styles from '@/components/admin/admin.module.css';

export default function FieldGroup({ field, value, onChange }) {
  const { label, desc, type } = field;
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      {desc && <div className={styles.fieldDesc}>{desc}</div>}
      {type === 'textarea' ? (
        <textarea className={styles.formTextarea} rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={styles.formInput} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/contenido/Toast.jsx components/admin/contenido/FieldGroup.jsx
git commit -m "feat(contenido): componentes Toast y FieldGroup"
```

---

## Task 16: `ColorEditor` y `MediaUploader`

**Files:**
- Create: `components/admin/contenido/ColorEditor.jsx`
- Create: `components/admin/contenido/MediaUploader.jsx`

**Interfaces:**
- Produces:
  - `<ColorEditor colors onChange />` — por cada clave de `COLOR_VAR_MAP`, un `<input type="color">` + campo hex sincronizados; `onChange(key, hex)`.
  - `<MediaUploader value onChange bucket="site-media" />` — sube archivo a Storage, muestra progreso y actual; `onChange(publicUrl)`.

- [ ] **Step 1: Crear bucket de Storage (manual)**

En Supabase → Storage → crear bucket **`site-media`** público (public read). (La subida usa anon key; en Fase 1 las policies de Storage pueden ser permisivas, coherente con el resto.)

- [ ] **Step 2: `ColorEditor.jsx`**

```jsx
'use client';
import { COLOR_VAR_MAP } from '@/lib/content/theme';
import styles from '@/components/admin/admin.module.css';

const LABELS = {
  navy900: 'Navy 900 (fondo)', navy800: 'Navy 800', navy700: 'Navy 700',
  navy600: 'Navy 600', navy500: 'Navy 500',
  gold: 'Acento principal', goldLight: 'Acento claro', goldDark: 'Acento oscuro',
};

export default function ColorEditor({ colors = {}, onChange }) {
  return (
    <div>
      {Object.keys(COLOR_VAR_MAP).map((key) => (
        <div className={styles.colorRow} key={key}>
          <span className={styles.formLabel}>{LABELS[key] || key}</span>
          <input type="color" className={styles.colorSwatch}
            value={/^#[0-9a-fA-F]{6}$/.test(colors[key] || '') ? colors[key] : '#000000'}
            onChange={(e) => onChange(key, e.target.value)} />
          <input className={styles.colorHex} value={colors[key] ?? ''}
            placeholder="#RRGGBB" onChange={(e) => onChange(key, e.target.value)} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `MediaUploader.jsx`**

```jsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '@/components/admin/admin.module.css';

export default function MediaUploader({ value, onChange, bucket = 'site-media' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    const path = `cardoso/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { setErr(error.message); setBusy(false); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className={styles.uploader}>
      <input type="file" accept="video/*,image/*" onChange={handleFile} disabled={busy} />
      {busy && <div className={styles.uploadProgress}>Subiendo…</div>}
      {err && <div className={styles.fieldDesc} style={{ color: 'var(--error)' }}>{err}</div>}
      <div className={styles.fieldDesc}>Actual: {value || 'archivo por defecto'}</div>
    </div>
  );
}
```

- [ ] **Step 4: Verificación manual** — se prueba integrado en Task 18/19. Build sin errores.

- [ ] **Step 5: Commit**

```bash
git add components/admin/contenido/ColorEditor.jsx components/admin/contenido/MediaUploader.jsx
git commit -m "feat(contenido): ColorEditor y MediaUploader (Storage)"
```

---

## Task 17: `LivePreview` (preview representativo por sección)

**Files:**
- Create: `components/admin/contenido/LivePreview.jsx`

**Interfaces:**
- Consumes: `category` (key activa), `content`, `theme` (draft actual).
- Produces: `<LivePreview category content theme />` — renderiza una representación de la sección activa aplicando `theme.colors` como estilos inline en su contenedor (`previewFrame`).

- [ ] **Step 1: Crear `LivePreview.jsx`** con un render por categoría (switch). Representación fiel pero liviana (no monta los componentes reales de la home): para `hero` muestra título+subtítulo+scrollText; `stats` una grilla de contadores; `values`/`operations` tarjetas; `cta` el bloque; `footer` marca+contacto; `navbar` la barra con CTA; `colors` swatches en vivo; `media` un `<video>`/preview. Aplicar colores:

```jsx
'use client';
import { COLOR_VAR_MAP } from '@/lib/content/theme';
import styles from '@/components/admin/admin.module.css';

function cssVars(colors = {}) {
  const s = {};
  for (const [k, v] of Object.entries(COLOR_VAR_MAP)) {
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(colors[k] || '')) s[v] = colors[k];
  }
  return s;
}

export default function LivePreview({ category, content, theme }) {
  const style = cssVars(theme?.colors);
  return (
    <div className={styles.previewFrame} style={style}>
      {category === 'hero' && (
        <div>
          <h2 style={{ color: 'var(--white)' }}>
            {content.hero.titlePrefix} <em style={{ color: 'var(--gold)' }}>{content.hero.rotatingWords?.[0]}</em> {content.hero.titleSuffix}
          </h2>
          <p style={{ color: 'var(--gray-300)' }}>{content.hero.subtitle}</p>
          <small style={{ color: 'var(--gold)' }}>{content.hero.scrollText}</small>
        </div>
      )}
      {/* stats, values, operations, cta, footer, navbar, colors, media: cada uno su mini-render */}
    </div>
  );
}
```
Completar los `category === ...` restantes con su mini-render (texto real tomado de `content`/`theme`).

- [ ] **Step 2: Commit**

```bash
git add components/admin/contenido/LivePreview.jsx
git commit -m "feat(contenido): LivePreview representativo por sección"
```

---

## Task 18: `ContentCategorySidebar` + `ContentEditor` (estructura, carga, draft, dirty)

**Files:**
- Create: `components/admin/contenido/ContentCategorySidebar.jsx`
- Create: `components/admin/contenido/ContentEditor.jsx`
- Modify: `app/admin/contenido/page.js` (renderiza `<ContentEditor />`)

**Interfaces:**
- Consumes: `getSiteContent`, `CATEGORIES`, `FIELDS`, `FieldGroup`, `ColorEditor`, `MediaUploader`, `LivePreview`, `CONTENT_DEFAULTS`, `THEME_DEFAULTS`.
- Produces: editor funcional salvo el guardado (Task 19 agrega save/toast). Helpers internos `getPath(obj, 'a.b')` y `setPath(obj, 'a.b', val)` para editar por `path`.

- [ ] **Step 1: `ContentCategorySidebar.jsx`**

```jsx
'use client';
import { CATEGORIES } from './fields';
import styles from '@/components/admin/admin.module.css';

export default function ContentCategorySidebar({ active, onSelect, dirtyKeys }) {
  return (
    <div className={styles.catSidebar}>
      {CATEGORIES.map((c) => (
        <button key={c.key}
          className={`${styles.catItem} ${active === c.key ? styles.catItemActive : ''}`}
          onClick={() => onSelect(c.key)}>
          {c.label}
          {dirtyKeys?.has(c.key) && <span className={styles.catDot} />}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `ContentEditor.jsx`** — estado, carga, edición por path, render de la categoría activa + preview. (Sin guardar todavía: el botón se agrega en Task 19, aquí dejar el layout y el estado listos.)

```jsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import styles from '@/components/admin/admin.module.css';
import { getSiteContent } from '@/lib/siteContent';
import { CONTENT_DEFAULTS, THEME_DEFAULTS } from '@/lib/content/defaults';
import { CATEGORIES, FIELDS } from './fields';
import ContentCategorySidebar from './ContentCategorySidebar';
import FieldGroup from './FieldGroup';
import ColorEditor from './ColorEditor';
import MediaUploader from './MediaUploader';
import LivePreview from './LivePreview';

function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function setPath(obj, path, val) {
  const keys = path.split('.'); const copy = structuredClone(obj); let cur = copy;
  for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = cur[keys[i]] ?? {}; cur = cur[keys[i]]; }
  cur[keys[keys.length - 1]] = val; return copy;
}

export default function ContentEditor() {
  const [draft, setDraft] = useState(null);   // { content, theme }
  const [saved, setSaved] = useState(null);
  const [active, setActive] = useState('hero');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteContent('cardoso').then((d) => { setDraft(d); setSaved(d); setLoading(false); });
  }, []);

  const isDirty = useMemo(() => draft && saved && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const dirtyKeys = useMemo(() => {
    const s = new Set(); if (!draft || !saved) return s;
    for (const c of CATEGORIES) {
      const scope = c.scope; const key = c.key === 'colors' || c.key === 'media' ? c.key : c.key;
      const a = JSON.stringify(getPath(draft[scope], c.key === 'colors' ? 'colors' : c.key === 'media' ? 'media' : c.key));
      const b = JSON.stringify(getPath(saved[scope], c.key === 'colors' ? 'colors' : c.key === 'media' ? 'media' : c.key));
      if (a !== b) s.add(c.key);
    }
    return s;
  }, [draft, saved]);

  if (loading || !draft) return <div className={styles.card}>Cargando contenido…</div>;

  const cat = CATEGORIES.find((c) => c.key === active);
  const update = (scope, path, val) => setDraft((d) => ({ ...d, [scope]: setPath(d[scope], path, val) }));

  return (
    <div className={styles.editorLayout}>
      <ContentCategorySidebar active={active} onSelect={setActive} dirtyKeys={dirtyKeys} />
      <div className={styles.editorForm}>
        {/* Render según categoría: campos simples via FIELDS[active]; colors -> ColorEditor; media -> MediaUploader; listas (stats/values/operations) -> editor de ítems */}
        {/* Ejemplo campos simples: */}
        {(FIELDS[active] || []).filter(f => ['text','textarea'].includes(f.type)).map((f) => (
          <FieldGroup key={f.path} field={f}
            value={getPath(draft[cat.scope], f.path)}
            onChange={(v) => update(cat.scope, f.path, v)} />
        ))}
        {active === 'colors' && (
          <ColorEditor colors={draft.theme.colors}
            onChange={(k, hex) => update('theme', `colors.${k}`, hex)} />
        )}
        {active === 'media' && (
          <MediaUploader value={draft.theme.media.heroVideo}
            onChange={(url) => update('theme', 'media.heroVideo', url)} />
        )}
        {/* stats/values/operations: mapear sus items con FieldGroup por campo (title/description/value/label) */}
      </div>
      <div className={styles.editorPreview}>
        <LivePreview category={active} content={draft.content} theme={draft.theme} />
      </div>
    </div>
  );
}
```
Completar el render de las listas (`stats`, `values.items`, `operations.items`) iterando y usando `FieldGroup` por cada campo del ítem (con `path` tipo `stats.0.label`).

- [ ] **Step 3: `app/admin/contenido/page.js`** — reescribir:

```jsx
'use client';
import styles from '@/components/admin/admin.module.css';
import ContentEditor from '@/components/admin/contenido/ContentEditor';

export default function AdminContenido() {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Contenido del Sitio</h2>
          <p className={styles.pageSubtitle}>Editá los textos, colores y media de la página principal</p>
        </div>
      </div>
      <ContentEditor />
    </>
  );
}
```
(El botón "Guardar Todo" se agrega dentro de `ContentEditor` en Task 19, junto al header de acciones, para tener acceso al estado.)

- [ ] **Step 4: Verificación manual** — `/admin/contenido`: se ve el sidebar de categorías, el formulario carga los valores actuales (defaults), el preview refleja lo que se tipea, y los puntos de "cambios sin guardar" aparecen al editar. (Todavía no persiste.)

- [ ] **Step 5: Commit**

```bash
git add components/admin/contenido/ContentCategorySidebar.jsx components/admin/contenido/ContentEditor.jsx app/admin/contenido/page.js
git commit -m "feat(contenido): editor con categorías, draft controlado, dirty y preview en vivo"
```

---

## Task 19: Guardado real + feedback (resuelve el bug original)

**Files:**
- Modify: `components/admin/contenido/ContentEditor.jsx`

**Interfaces:**
- Consumes: `saveSiteContent` (Task 4), `Toast` (Task 15).

- [ ] **Step 1: Agregar estado de guardado y handler** en `ContentEditor`:

```jsx
import { saveSiteContent } from '@/lib/siteContent';
import Toast from './Toast';
// dentro del componente:
const [saving, setSaving] = useState(false);
const [toast, setToast] = useState(null);

async function handleSave() {
  setSaving(true);
  const res = await saveSiteContent('cardoso', { content: draft.content, theme: draft.theme });
  setSaving(false);
  if (res.ok) { setSaved(draft); setToast({ type: 'success', message: 'Cambios guardados ✓' }); }
  else { setToast({ type: 'error', message: `No se pudo guardar: ${res.error}` }); }
}
function handleDiscard() { setDraft(saved); }
```

- [ ] **Step 2: Barra de acciones** (arriba del `editorLayout`), con botón Guardar (loading + disabled cuando `saving` o `!isDirty`), Descartar (visible si `isDirty`) y badge de cambios:

```jsx
<div className={styles.pageHeader}>
  <div>{isDirty ? <span className={styles.dirtyBadge}>Cambios sin guardar</span> : <span className={styles.fieldDesc}>Todo guardado</span>}</div>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    {isDirty && <button className={styles.btnGhost} onClick={handleDiscard} disabled={saving}>Descartar</button>}
    <button className={styles.btnPrimary} onClick={handleSave} disabled={saving || !isDirty}>
      {saving ? 'Guardando…' : 'Guardar Todo'}
    </button>
  </div>
</div>
<Toast toast={toast} onClose={() => setToast(null)} />
```

- [ ] **Step 3: Verificación manual (el caso que hoy falla)**

1. `/admin/contenido` → editar el subtítulo del Hero → aparece "Cambios sin guardar" + punto en la categoría.
2. Click **Guardar Todo** → botón muestra "Guardando…" → toast verde "Cambios guardados ✓" → "Todo guardado".
3. Refrescar `/admin/contenido` → el cambio persiste (viene de Supabase).
4. Abrir la **home** y refrescar → el subtítulo nuevo aparece en el sitio público.
5. Probar **error**: con la red de Supabase cortada (o apuntando a una tabla inexistente temporalmente) → Guardar → toast rojo con el motivo, el draft no se pierde.
6. **Descartar**: editar algo → Descartar → vuelve al último guardado.
7. Revertir los cambios de prueba desde el editor para dejar el contenido como estaba.

- [ ] **Step 4: Commit**

```bash
git add components/admin/contenido/ContentEditor.jsx
git commit -m "feat(contenido): guardar real con feedback (toast), descartar y estado dirty"
```

---

## Cierre

- [ ] **Verificación integral:** recorrer el Review Focus completo (tabla vacía, campo faltante, fallo de lectura, color inválido, media ausente, guardado fallido) contra el sitio corriendo.
- [ ] **Lint:** `npm run lint` sin errores nuevos.
- [ ] **Tests:** `npm test` en verde.
- [ ] Revisión de rama completa antes de mergear a `main`.

**Nota de seguridad (recordatorio del spec §8):** la escritura queda abierta en esta fase. Antes de un uso real con datos sensibles, cerrar con auth (Supabase Auth + middleware) y endurecer la RLS de `site_settings` y las policies del bucket `site-media`.
