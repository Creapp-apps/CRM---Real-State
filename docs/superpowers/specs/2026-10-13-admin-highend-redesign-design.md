# Rediseño high-end del panel admin (Fases A + B)

**Fecha:** 2026-10-13
**Proyecto:** Cardoso Propiedades (CMPROP) — Next.js App Router, CSS Modules (sin Tailwind)
**Estado:** Diseño aprobado (conversacional), pendiente de review del spec escrito

---

## 1. Propósito y contexto

El usuario quiere adoptar como estándar la estética "high-end" de un panel de referencia
(sidebar con íconos + descripciones, cards, glow, "simulador en vivo"). Decisiones del
brainstorming:

- **Stack:** replicar el nivel con el **design system actual** (navy/dorado + CSS Modules).
  **NO** se agrega Tailwind ni shadcn.
- **Alcance ahora:** **Fase A** (fundamentos que elevan todo el admin) + **Fase B** (el panel
  de Personalización `/admin/contenido` como vitrina). Las páginas pesadas quedan para fases C+.
- **Acento oficial del panel:** **dorado bronce `#C9A96E`**, formalizado como variable.
- **Preview:** representativo mejorado (sin iframe, sin montar componentes reales).

### Estado actual relevante (del inventario)

- 18 páginas admin + ~18 subcomponentes. Las tablas/listados ya usan clases; lo pesado son
  fichas, calculadoras, tasador, pipeline, login (fases C+).
- `admin.module.css` (~1304 líneas) usa el dorado bronce `rgba(201,169,110,…)` **hardcodeado 42
  veces**, mientras `--gold` global fue redefinido a blanco (`#FFFFFF`). El admin está
  desincronizado del brand global.
- Íconos: SVG inline a mano, duplicados entre páginas, con trazos inconsistentes (1.5 vs 2).
- `AdminSidebar` (13 ítems en 5 secciones, íconos SVG inline), `AdminTopbar` (mapa de títulos
  **incompleto**, cubre solo 7 rutas; el resto cae a "Admin").
- Fase 1 (contenido editable) ya entregada: `ContentEditor`, `ContentCategorySidebar`,
  `LivePreview`, `FieldGroup`, `ColorEditor`, `MediaUploader`, `Toast`, `fields.js`. Toda la
  lógica de guardado/draft/dirty funciona y está verificada; este rediseño **no la toca**.

---

## 2. Principios y restricciones

- **Sin Tailwind, sin shadcn.** Solo CSS Modules + variables de `globals.css`.
- **No romper las 18 páginas:** se mantienen los **nombres de clase** existentes; se mejora su
  estilo. Nada que dependa de `styles.card`, `styles.table`, etc. cambia de nombre.
- **Cero dependencias nuevas:** íconos en un módulo propio (no `lucide-react`).
- **La lógica de Fase 1 (contenido) permanece intacta:** guardado, draft, dirty, upsert,
  fallback a defaults, theming. El rediseño es visual/estructural.
- **Acento centralizado:** un solo origen (`--admin-gold`) para el dorado del panel.
- Copy en español rioplatense (es-AR).

---

## 3. Fase A — Fundamentos

### A1. Token de acento

En `app/globals.css` `:root` agregar el acento y sus variantes de opacidad más usadas (del
inventario: .08, .1, .12, .15), como variables rgba directas (100% compatibles, sin depender de
`color-mix`):
```css
--admin-gold: #C9A96E;
--admin-gold-08: rgba(201, 169, 110, 0.08);
--admin-gold-10: rgba(201, 169, 110, 0.10);
--admin-gold-12: rgba(201, 169, 110, 0.12);
--admin-gold-15: rgba(201, 169, 110, 0.15);
--admin-gold-glow: rgba(201, 169, 110, 0.25);
```
En `admin.module.css`, reemplazar los `rgba(201,169,110,α)` hardcodeados por la variable de la
opacidad correspondiente (`var(--admin-gold-12)`, etc.), y el color sólido por `var(--admin-gold)`.
Si aparece una opacidad puntual fuera del set, usar `color-mix(in srgb, var(--admin-gold) N%,
transparent)` (opcional, soporte moderno). Los blancos translúcidos `rgba(255,255,255,α)` y navys
`rgba(15,33,64,α)` se dejan como están; no es obligatorio migrarlos (solo el acento es el objetivo).

### A2. Reescritura visual de `admin.module.css`

Mantener los selectores/nombres; subir el nivel visual. Cambios por familia:

- **Cards (`.card`, `.statCard`, `.tableWrapper`, `.calcCard`):** fondo con gradiente sutil
  navy, borde `1px` dorado suave (`color-mix(... 12%)`), `--radius` mayor, sombra navy; en hover
  elevación + glow dorado (`--admin-gold-glow`). Transición `--transition`.
- **Sidebar (`.sidebar`, `.navLink`, `.navLinkActive`, `.navIcon`, `.navSection*`):** ítem con
  ícono en "chip" redondeado; activo = fondo dorado translúcido + borde izquierdo/indicador +
  glow + color `--admin-gold`; hover sutil. Secciones con título en mayúsculas espaciadas.
- **Topbar (`.topbar*`):** refinar; separador inferior dorado tenue; avatar/usuario prolijos.
- **Botones (`.btnPrimary`, `.btnSecondary`, `.btnIcon`, `.btnGhost`):** primario con fondo/borde
  dorado y glow en hover; estados `:focus-visible` con halo dorado. Inputs/selects/textarea
  (`.formInput`…) con `:focus` borde+halo dorado.
- **Badges:** agregar `.badgeGold` (hoy se parchea inline en `propiedades/page.js`) usando el
  acento. El resto de badges se mantienen.
- **Tipografía:** títulos (`.pageTitle`, `.tableTitle`, etc.) con `--font-heading` y jerarquía
  clara.
- **Tabs (`.filterTab*`, `.sectionTab*`):** activo con acento dorado.

Requisito de no-regresión: como se conservan los nombres de clase y solo cambian propiedades
visuales, todas las páginas que usan clases mejoran sin cambios de estructura. Las páginas con
inline styles (tasador, fichas…) quedan visualmente mezcladas hasta C+; aceptable (fuera de
alcance), pero no deben **romperse**.

### A3. Módulo de íconos

Nuevo `components/admin/Icon.jsx`:
- Exporta un componente `<Icon name="..." size={18} />` que renderiza un `<svg>` con
  `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth={1.5}`, `fill="none"`,
  `strokeLinecap/join="round"`, heredando color por `currentColor`.
- Un diccionario interno `PATHS` con los íconos necesarios (nombres kebab/camel). Set mínimo
  (del sidebar + páginas + panel B): `dashboard`, `building`, `layers` (emprendimientos),
  `edit` (contenido), `image`, `grid` (panel), `users`, `file-text` (contratos), `home`
  (inmuebles), `activity` (pipeline), `dollar` (tasador), `message` (contacto),
  `clipboard` (tasaciones), `bell`, `search`, `eye`, `trash`, `plus`, `chevron-down`,
  `chevron-right`, `upload`, `palette` (colores), `type` (textos), `sliders` (ajustes),
  `sparkle`/`star` (operaciones/valores), `phone`, `mail`, `map-pin`, `external-link`,
  `save`, `x`. (La lista final se fija en el plan; cada path es un SVG propio, trazo 1.5.)
- Reemplaza los SVGs inline de `AdminSidebar` y los que use el panel B. **No** se migran en esta
  fase los SVGs de todas las páginas (eso es C+); solo sidebar + panel B + los triviales.

### A4. `AdminSidebar` + `AdminTopbar`

- **AdminSidebar:** usa `<Icon>` para cada ítem (reemplaza los SVG inline). Mantiene las 5
  secciones y los 13 ítems, labels iguales. **Sin descripciones largas** por ítem (el sidebar
  global de 13 ítems quedaría enorme); el refinamiento es visual (chips de ícono, activo con
  glow dorado, secciones claras). Los badges numéricos se mantienen.
- **AdminTopbar:** completar `PAGE_TITLES` para **todas** las rutas (incluidas
  `administraciones/*`, `pipeline`, `tasador`, `tasaciones`, `media`, detalles). Fallback
  genérico solo para rutas realmente desconocidas. Refinar el estilo (campana, avatar).

---

## 4. Fase B — Panel de Personalización (vitrina)

Toda la lógica actual del editor se mantiene. Cambios visuales/estructurales:

### B1. Encabezado del panel
`app/admin/contenido/page.js` (o dentro de `ContentEditor`): encabezado tipo "SISTEMA DE
DISEÑO / Personalización Web" con un subtítulo descriptivo ("Configuración integral de estética,
copys y llamadas a la acción"), alineado a la estética de la captura. Usa `<Icon>`.

### B2. Sidebar de categorías con ícono + descripción
`ContentCategorySidebar` + `fields.js`: cada categoría de `CATEGORIES` suma `icon` (nombre de
`<Icon>`) y `description` (una línea). El sidebar renderiza, por ítem: chip de ícono + label +
descripción corta, con el estado activo destacado (card dorada translúcida + glow), igual que la
captura. Mantiene el indicador de "cambios sin guardar" (`catDot`).

Descripciones (es-AR), una por categoría:
- Hero — "Título, subtítulo y palabras rotativas de la portada"
- Estadísticas — "Los contadores de la franja de métricas"
- Valores — "Las tarjetas de 'por qué elegirnos'"
- Operaciones — "Las tarjetas de tipos de operación"
- CTA — "El bloque de llamada a tasación"
- Footer — "Texto de marca y datos de contacto del pie"
- Navbar — "El botón destacado de la barra superior"
- Colores — "Paleta de marca del sitio"
- Media — "Video de fondo de la portada"

### B3. Header de la sección activa
En `editorForm`, arriba de los campos: ícono + título de la categoría + su descripción (misma
fuente que B2). Da contexto claro de "qué estás editando".

### B4. "Simulador en Vivo" mejorado (`LivePreview`)
Mejorar el preview representativo (sigue sin iframe, alimentado por el draft):
- Marco con etiqueta "SIMULADOR EN VIVO" + badge "● En Vivo" y chip
  "Predeterminado/Personalizado" (según si la categoría tiene cambios vs defaults).
- Para `hero`/`navbar`/`colors`/`media`: render de una **cabecera + hero representativos** más
  fieles (navbar con logo textual + links + botón CTA; hero con badge, título con palabra
  resaltada, subtítulo, dos botones y un recuadro de imagen/video), aplicando `theme.colors` como
  CSS vars inline (como hoy). Para las demás categorías, se mantiene/mejora el mini-render
  actual.
- La lógica de datos del preview no cambia; es presentación.

### B5. Sin cambios de lógica
Guardado (`saveSiteContent`), draft/`isDirty`/`dirtyKeys`, `cleanStringArrays`, `beforeunload`,
toast, descartar, `ColorEditor`, `MediaUploader` quedan **igual**. Solo se reestiliza y se suma
ícono/descr.

---

## 5. Componentes y archivos (unidades)

**Nuevos:**
- `components/admin/Icon.jsx` — componente de íconos + diccionario de paths.

**Modificados:**
- `app/globals.css` — tokens `--admin-gold`, `--admin-gold-glow`.
- `components/admin/admin.module.css` — reescritura visual (acento por variable, cards, sidebar,
  botones, inputs, tabs, badges) + clases nuevas del panel B (header de sistema, categoría con
  descripción, simulador).
- `components/admin/AdminSidebar.jsx` — usar `<Icon>`, refinar activo.
- `components/admin/AdminTopbar.jsx` — `PAGE_TITLES` completo + refinar.
- `components/admin/contenido/fields.js` — `icon` + `description` por categoría.
- `components/admin/contenido/ContentCategorySidebar.jsx` — ícono + descripción + estilo card.
- `components/admin/contenido/ContentEditor.jsx` — encabezado de sistema + header de sección.
- `components/admin/contenido/LivePreview.jsx` — simulador mejorado + badges.
- `app/admin/contenido/page.js` — encabezado (si no se mueve a ContentEditor).

Cada unidad tiene una responsabilidad acotada; el grueso del lift está en `admin.module.css`
(compartido) y en los 4 archivos del panel B.

---

## 6. Testing / verificación

- **No-regresión del admin:** recorrer visualmente varias páginas que usan clases (dashboard,
  propiedades, emprendimientos, administraciones, contratos) tras la reescritura del CSS y
  confirmar que **no se rompe el layout** (siguen legibles y coherentes). Build + lint sin
  errores nuevos.
- **Acento centralizado:** confirmar que no quedan `rgba(201,169,110` en `admin.module.css`
  (grep) y que el panel se ve dorado bronce.
- **Sidebar/Topbar:** íconos renderizan, estado activo correcto por ruta, títulos de topbar
  correctos en todas las rutas.
- **Panel B:** cada categoría muestra ícono + descripción; el simulador refleja el draft al
  tipear; el ciclo guardar/descartar/dirty **sigue funcionando** (regresión de Fase 1).
- **E2E liviano:** editar un campo en `/admin/contenido` → el simulador cambia → Guardar → toast
  (la persistencia ya está probada en Fase 1; acá se verifica que el rediseño no la rompió).

No se agregan tests unitarios nuevos (es trabajo visual/CSS; la lógica con tests no cambia). La
suite existente (`npm test`, 14/14) debe seguir verde.

---

## 7. Fuera de alcance (C+)

- Páginas pesadas: tasador, pipeline, tasaciones, inmuebles, clientes (ficha), contratos/detalle.
- `/admin/login` (objeto de estilos inline aparte; rediseño propio).
- Subcomponentes de `administraciones/*` (calculadoras, modales).
- Migrar todos los SVGs inline de todas las páginas al módulo `<Icon>`.
- Migrar los `rgba(255,255,255,…)` y navys a variables (solo el acento es obligatorio ahora).
- Tailwind / shadcn (descartado).
