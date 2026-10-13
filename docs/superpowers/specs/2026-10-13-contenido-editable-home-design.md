# Sistema de contenido editable de la Home — Fase 1

**Fecha:** 2026-10-13
**Proyecto:** Cardoso Propiedades (CMPROP) — Next.js App Router, Supabase, CSS Modules
**Estado:** Diseño aprobado (conversacional), pendiente de review del spec escrito

---

## 1. Propósito y contexto

Hoy la sección **Contenido del Sitio** del panel admin (`app/admin/contenido/page.js`) es una
maqueta sin funcionalidad: los inputs usan `defaultValue`, el botón "Guardar Todo" no tiene
`onClick` y todos los textos son constantes hardcodeadas. No persiste nada y no da feedback.
Además, los textos de la home están hardcodeados dentro de cada componente, así que aunque
se guardara algo, la web no lo reflejaría.

**Objetivo:** que cada inmobiliaria (cliente) pueda personalizar la "impronta" de su sitio
—textos, colores de marca y media— desde el panel, con guardado real, feedback claro, una UI
intuitiva (sidebar de categorías + preview en vivo + descripciones de cada campo) y que esos
cambios se reflejen en la web pública.

**Fase 1 (este spec):** la **home** completa (secciones principales) + arquitectura base
multi-cliente + panel rediseñado. Fuera de alcance de Fase 1 (fases siguientes): el resto de
páginas del sitio y el asistente "Mónica" (`AiSearchAssistant.jsx`), que es un subsistema de
copy enorme por sí solo.

### Decisiones tomadas (del brainstorming)

- **Qué se edita:** textos + colores de marca + media (video/imágenes).
- **Multi-cliente:** el modelo de datos soporta múltiples inmobiliarias desde ya; se implementa
  y carga solo `cardoso` ahora.
- **Faseo:** Fase 1 = home + base + panel nuevo.
- **Seguridad/escritura:** se deja la escritura **abierta por ahora** (igual que el resto del
  admin actual), con el riesgo asumido por el usuario para este entorno. El diseño centraliza
  la escritura para poder cerrarla luego en un solo lugar. Ver §8.

---

## 2. Hallazgos del estado actual (base para el diseño)

- **Textos:** 100% hardcodeados en `components/home/*` y `components/layout/*`. No hay tabla de
  contenido. Candidatos editables mapeados por componente en §4.
- **Tema:** estático en `:root` de `app/globals.css` (sin theming dinámico). Nota: `--gold`
  hoy vale `#FFFFFF` (blanco), no dorado — inconsistencia preexistente que el editor permitirá
  corregir, pero no se cambia por defecto (fallback = valores actuales).
- **Media:** 1 video `public/videohero.mov` (ref. `VideoBackground.jsx:31-32`), imágenes en
  `public/images/` (`hero-bg.jpg`, `property-interior.jpg`, etc.).
- **Datos:** patrón admin estándar = CRUD client-side con la anon key (`lib/supabase.js`) + RLS
  permisivo (`USING(true)`). Migrations SQL manuales en `lib/*.sql`. Endpoints sensibles usan
  API route con `service_role` (`app/api/portal/route.js`). Las propiedades vienen de Tokko, no
  de Supabase.
- **Auth admin:** inexistente/fake (login acepta cualquier credencial, sin middleware, sin
  roles). No se resuelve en Fase 1 (decisión del usuario), pero se tiene en cuenta en §8.
- **UI admin:** layout + sidebar globales ya existen (`app/admin/layout.js`, `AdminSidebar.jsx`,
  entry "Contenido" ya en el menú). Clases reutilizables en `components/admin/admin.module.css`
  (`card`, `formInput`, `formTextarea`, `formLabel`, `btnPrimary`, `pageHeader`, `modal*`, etc.).

---

## 3. Arquitectura

```
Supabase: tabla site_settings (1 fila por tenant)
          Storage bucket site-media
                  │
     ┌────────────┴─────────────┐
     │                          │
  LECTURA (web pública)     ESCRITURA (panel admin)
  getSiteContent('cardoso') lib/siteContent.js → upsert
  server-side, 1 fetch      client-side (anon) por ahora
     │                          │
  app/page.js (Server)      app/admin/contenido/page.js (Client)
  pasa props con fallback   draft controlado + preview + guardar
     │
  componentes home (reciben props, fallback a defaults)
  + ThemeStyle (inyecta CSS vars desde theme)
```

Principios:
- **Fuente de verdad única:** el documento JSON en `site_settings`. Los valores hardcodeados
  actuales pasan a ser **defaults/fallback** en un solo módulo (`lib/content/defaults.js`), no
  duplicados en cada componente ni en el admin.
- **Resiliencia:** si la DB está vacía, falla o faltan campos, la web renderiza con los defaults
  (idénticos a hoy). Cero regresión visual.
- **Escritura centralizada:** toda escritura pasa por `lib/siteContent.js` (`saveSiteContent`),
  para poder añadir auth después tocando un solo lugar.

---

## 4. Modelo de datos

### 4.1 Tabla `site_settings`

```sql
CREATE TABLE IF NOT EXISTS site_settings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_slug TEXT UNIQUE NOT NULL,
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
-- Fase 1: política permisiva (coherente con el resto del admin actual). Ver §8.
CREATE POLICY "site_settings read"  ON site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings write" ON site_settings FOR ALL    USING (true) WITH CHECK (true);
-- trigger updated_at reutilizando trigger_set_timestamp() ya presente en el proyecto
```

Nueva migration: `lib/migration_site_content.sql` (se ejecuta manualmente en Supabase SQL Editor,
como el resto). Incluye un `INSERT ... ON CONFLICT DO NOTHING` sembrando la fila `cardoso` vacía.

### 4.2 Forma del JSON `content`

Un objeto por sección. Solo campos de **marca** (editables). Lo técnico/funcional (filtros,
enums Venta/Alquiler, labels de sistema) **no** entra.

```jsonc
{
  "hero": {
    "rotatingWords": ["lugar", "espacio", "hogar", "local", "negocio"],
    "titlePrefix": "Te acompañamos a encontrar tu",
    "titleSuffix": "ideal",
    "subtitle": "Venta, alquiler y tasaciones de propiedades en Argentina",
    "scrollText": "Descubrí más"
  },
  "stats": [
    { "value": "500", "suffix": "+", "label": "Propiedades vendidas" },
    { "value": "15",  "suffix": "+", "label": "Años de experiencia" },
    { "value": "1200","suffix": "+", "label": "Clientes satisfechos" },
    { "value": "98",  "suffix": "%", "label": "Satisfacción" }
  ],
  "values": {
    "subtitle": "Por qué elegirnos",
    "titlePrefix": "Hacemos de cada operación",
    "titleHighlight": "una experiencia única",
    "items": [
      { "title": "Confianza",  "description": "..." },
      { "title": "Alcance",    "description": "..." },
      { "title": "Dedicación", "description": "..." }
    ]
  },
  "operations": {
    "subtitle": "Explorá",
    "titlePrefix": "¿Qué estás",
    "titleHighlight": "buscando",
    "items": [
      { "title": "Venta",          "description": "Encontrá tu propiedad ideal para comprar" },
      { "title": "Alquiler",       "description": "Las mejores opciones para alquilar" },
      { "title": "Temporario",     "description": "Alquileres temporarios y turísticos" },
      { "title": "Emprendimientos","description": "Proyectos nuevos y en construcción" }
    ]
  },
  "cta": {
    "subtitle": "Valorá tu inmueble",
    "titlePrefix": "¿Querés",
    "titleHighlight": "tasar",
    "titleSuffix": "tu propiedad?",
    "description": "Obtené una tasación profesional sin cargo. ...",
    "btnPrimary": "Solicitar tasación gratuita",
    "btnSecondary": "Contactanos"
  },
  "footer": {
    "brandText": "Tu socio de confianza en el mercado inmobiliario. ...",
    "phone": "+54 9 11 6609 2461",
    "whatsapp": "5491166092461",
    "email": "cardosom.prop@gmail.com",
    "location": "Buenos Aires, Argentina"
  },
  "navbar": {
    "ctaText": "Tasá tu propiedad"
  }
}
```

Nota: los href de operaciones y los enlaces de navegación son **estructurales** (no editables en
Fase 1). Solo se editan los textos/labels de marca.

### 4.3 Forma del JSON `theme`

```jsonc
{
  "colors": {
    "navy900": "#0A1628", "navy800": "#0F2140", "navy700": "#142C54",
    "navy600": "#1A3A6B", "navy500": "#1E4D8F",
    "gold": "#FFFFFF", "goldLight": "#F8F9FA", "goldDark": "#E9ECEF"
  },
  "media": {
    "heroVideo": null,       // URL en Storage; null => /videohero.mov (default)
    "heroPoster": null       // imagen opcional de respaldo/poster
  }
}
```

Mapeo color→CSS var en un único lugar (`lib/content/theme.js`): `navy900 → --navy-900`,
`gold → --gold`, etc. Solo se inyectan las vars presentes; el resto queda en los valores de
`globals.css`.

---

## 5. Lectura en la web pública

- **`lib/siteContent.js`**
  - `getSiteContent(tenant = 'cardoso')`: lee `site_settings` server-side (anon key sirve;
    `SELECT` permitido por RLS). Hace **deep-merge** con los defaults de `lib/content/defaults.js`
    para que cualquier campo faltante caiga al default. Devuelve `{ content, theme }`.
    Si hay error o no hay fila → devuelve los defaults. Nunca tira.
- **`app/page.js`** (Server Component): llama `getSiteContent()` y pasa `content.<seccion>` como
  props a cada componente. Se mantiene como Server Component; los componentes hijos siguen siendo
  Client donde ya lo eran (reciben props serializables).
- **Refactor de componentes** (`HeroSection`, `StorytellingSection` [stats+values],
  `OperationsSection`, `CTASection`, `Footer`, `Navbar`): reciben props con **fallback** al valor
  actual. Patrón: `const subtitle = props.subtitle ?? DEFAULTS.hero.subtitle`. No se cambia
  markup ni estilos; solo se externaliza el texto.
- **Theming:** componente `ThemeStyle` (server) que renderiza
  `<style>:root{ --navy-900: ...; --gold: ...; }</style>` a partir de `theme.colors`. Como los
  colores aplican a **todo el sitio**, se incluye en `app/layout.js` (ya es Server Component;
  pasa a hacer `await getSiteContent()` para leer `theme`). Sin theme → no emite overrides.
- **Media:** `VideoBackground` recibe `heroVideo` prop; usa la URL de Storage si existe, si no
  `/videohero.mov`.
- **Caché/revalidación:** la home usa lectura dinámica o `revalidate` corto para reflejar cambios
  pronto tras guardar. Decisión concreta (dynamic vs `revalidatePath` desde la escritura) se fija
  en el plan; requisito funcional: tras "Guardar", un refresh de la home muestra el cambio.

---

## 6. Panel de Contenido rediseñado (`app/admin/contenido/page.js`)

### 6.1 Layout

- **Sidebar secundario de categorías** dentro de la página (no reemplaza el `AdminSidebar`
  global): `Hero · Estadísticas · Valores · Operaciones · CTA · Footer · Navbar · Colores · Media`.
  Cada ítem muestra si tiene cambios sin guardar.
- **Panel central:** formulario de la categoría activa. Cada campo con **label + descripción
  breve** que explica qué ve el visitante ("Subtítulo bajo el título principal del inicio").
- **Panel de preview en vivo** (derecha, o debajo en mobile): render **representativo** de la
  sección con estilos de marca, alimentado por el draft. Se actualiza al tipear. Sin iframe.
  Reutiliza tokens/clases para parecerse a la home sin montar la home real.

### 6.2 Estado y datos

- `'use client'`. Al montar: `getSiteContent('cardoso')` (vía el mismo `lib/siteContent.js` o
  lectura directa) → inicializa `draft` (content + theme) y `saved` (copia para comparar/descartar).
- Edición = `setDraft(...)` por campo (controlado). `isDirty = !deepEqual(draft, saved)`.
- **Colores:** inputs tipo color + hex por variable, con swatch. Preview aplica las vars al vuelo
  en el contenedor de preview.
- **Media:** uploader real a Storage (`site-media`), muestra progreso; al terminar guarda la URL
  en `draft.theme.media`. Fallback visible al asset actual.

### 6.3 Guardado + feedback (resuelve el bug original)

- Botón **Guardar Todo** con `onClick` → `saveSiteContent('cardoso', draft)` (`upsert`).
- Estados visibles:
  - **Guardando…** (botón en loading, deshabilitado).
  - **Guardado ✓** → toast de éxito; `saved = draft`; `isDirty = false`.
  - **Error ✗** → toast con el mensaje del error; el draft se conserva.
- Botón **Descartar cambios** (visible si `isDirty`) → `draft = saved`.
- Aviso de **cambios sin guardar** al intentar salir/cambiar de categoría con `isDirty`.
- Toast: componente simple reutilizable (o patrón ya existente en admin si lo hubiera).

### 6.4 Escritura centralizada

- **`lib/siteContent.js` → `saveSiteContent(tenant, { content, theme })`**: hace el `upsert` a
  `site_settings` por `tenant_slug`. Único punto de escritura. Añadir auth en el futuro = guardar
  aquí (o moverlo a una API route) sin tocar la UI.

---

## 7. Componentes y archivos (unidades)

Nuevos:
- `lib/migration_site_content.sql` — tabla + RLS + seed.
- `lib/content/defaults.js` — defaults de `content` y `theme` (migrados desde los hardcodes).
- `lib/content/theme.js` — mapeo color→CSS var + helper para generar el CSS.
- `lib/siteContent.js` — `getSiteContent()` (lectura+merge) y `saveSiteContent()` (escritura).
- `components/ThemeStyle.jsx` — inyección de CSS vars desde `theme`.
- `components/admin/contenido/*` — subcomponentes del editor: `ContentSidebar`, `FieldGroup`
  (label+descripción+input), `LivePreview`, `ColorEditor`, `MediaUploader`, `Toast`.

Modificados:
- `app/page.js` — fetch + props + `ThemeStyle`.
- `components/home/HeroSection.jsx`, `StorytellingSection.jsx`, `OperationsSection.jsx`,
  `CTASection.jsx`, `components/layout/Footer.jsx`, `Navbar.jsx`, `components/home/VideoBackground.jsx`
  — recibir props con fallback.
- `app/admin/contenido/page.js` — reescritura completa del editor.
- `components/admin/admin.module.css` — clases nuevas para el editor (sidebar secundario, preview,
  color editor, toast) siguiendo el estilo existente.

Cada unidad tiene una responsabilidad única y se puede entender/probar por separado (lectura,
escritura, defaults, theming, editor UI).

---

## 8. Seguridad (Fase 1 y futuro)

- **Fase 1:** escritura abierta (RLS permisivo, anon key), decisión explícita del usuario para
  este entorno. Riesgo conocido: cualquiera con la URL del admin podría editar el contenido.
- **Mitigación de diseño:** toda escritura pasa por `saveSiteContent`. Cerrar la escritura luego
  implica: (a) implementar auth real (Supabase Auth + middleware que proteja `/admin`), y
  (b) endurecer la RLS de `site_settings` (`write` solo para rol admin) o mover `saveSiteContent`
  a una API route con `service_role`. Localizado, sin tocar la UI ni la lectura pública.
- **Lectura** siempre pública (es contenido del sitio), sin cambios futuros necesarios.

---

## 9. Testing / verificación

- **Resiliencia:** con la tabla vacía, la home renderiza idéntica a hoy (defaults). Prueba manual
  + comparación visual.
- **Ida y vuelta:** editar un campo → Guardar → toast de éxito → refrescar la home → el cambio
  aparece. (El caso que hoy falla.)
- **Fallback por campo:** borrar un campo del JSON → ese campo cae al default, el resto se respeta.
- **Colores:** cambiar `--gold` → se refleja en `.text-gold` de la home.
- **Media:** subir un video → la home usa la URL de Storage; sin subir → usa `/videohero.mov`.
- **Error de guardado:** simular fallo de Supabase → toast de error, el draft no se pierde.
- **Multi-tenant (estructura):** `getSiteContent('otro')` sin fila → defaults, sin romper.

Se seguirá TDD donde aplique (helpers de merge/fallback y mapeo de theme son unidades testeables
puras); la UI y la integración con Supabase se verifican manualmente contra el entorno real.

---

## 10. Fuera de alcance (Fase 1)

- Resto de páginas del sitio (Propiedades, Emprendimientos, Servicios, Nosotros, Contacto, etc.).
- Asistente "Mónica" (`AiSearchAssistant.jsx`).
- Auth real de admin (se diseña el gancho, no se implementa).
- Editor de tipografía/fuentes (solo colores + media en esta fase).
- Versionado/historial de cambios de contenido.
