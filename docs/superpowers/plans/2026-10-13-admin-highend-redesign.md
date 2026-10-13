# Rediseño high-end del admin (Fases A + B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar el panel admin a una estética high-end (navy + dorado bronce) manteniendo CSS Modules, y llevar el panel de Personalización (`/admin/contenido`) al nivel de la captura de referencia, sin tocar la lógica de guardado ya verificada.

**Architecture:** Un acento dorado centralizado en variables; reescritura visual de `admin.module.css` conservando los nombres de clase (cero rotura estructural en las 18 páginas); un módulo propio de íconos; refinamiento de `AdminSidebar`/`AdminTopbar`; y el panel de contenido con sidebar de categorías (ícono + descripción), header de sección y "simulador en vivo" mejorado.

**Tech Stack:** Next.js App Router (JS), React, CSS Modules. Sin Tailwind, sin shadcn, sin deps nuevas.

**Spec:** `docs/superpowers/specs/2026-10-13-admin-highend-redesign-design.md`

## Global Constraints

- **Sin Tailwind/shadcn. Cero dependencias nuevas.** Íconos en módulo propio.
- **Mantener los nombres de clase** de `admin.module.css`. Solo cambian propiedades visuales y se agregan clases nuevas. Nada que las páginas referencian cambia de nombre.
- **No tocar la lógica de Fase 1** (contenido): `saveSiteContent`, draft, `isDirty`, `dirtyKeys`, `cleanStringArrays`, `beforeunload`, toast, `ColorEditor`, `MediaUploader`, `getSiteContent`, `withDefaults`, `mapThemeToCss`. Este plan es visual/estructural.
- **Acento oficial:** `--admin-gold: #C9A96E`. Dentro de `admin.module.css`, el dorado (hoy `rgba(201,169,110,α)` hardcodeado y algunos `var(--gold*)` que renderizan blanco) se unifica a las variables de acento.
- **La suite existente** (`npm test`, 14/14) debe seguir verde. No se agregan tests nuevos (trabajo visual; la lógica no cambia).
- Copy es-AR.

## Review Focus

- **No-regresión de páginas que usan clases:** tras reescribir el CSS compartido, dashboard/propiedades/emprendimientos/administraciones/contratos siguen con layout correcto y legibles. (Verificación visual en Task 3.)
- **Sidebar activo por ruta:** `/admin` exacto, el resto por `startsWith`; el ítem activo se ve dorado. (Task 4/1.)
- **Títulos de topbar completos:** toda ruta admin muestra su título (no "Admin" genérico salvo desconocidas). (Task 5.)
- **Regresión de Fase 1 (lo más crítico):** el ciclo editar → simulador refleja → Guardar → toast → persiste sigue funcionando tras el rediseño del panel. (Task 9 + cierre.)
- **Íconos:** `<Icon>` renderiza todos los nombres usados; ninguno cae a vacío. (Task 2.)
- **Acento sin residuos:** no quedan `rgba(201,169,110` en `admin.module.css`. (Task 1.)

---

## Estructura de archivos

**Nuevos:**
- `components/admin/Icon.jsx` — componente de íconos + diccionario de paths SVG.

**Modificados:**
- `app/globals.css` — tokens de acento.
- `components/admin/admin.module.css` — acento por variable + reescritura visual + clases nuevas del panel.
- `components/admin/AdminSidebar.jsx` — usar `<Icon>`.
- `components/admin/AdminTopbar.jsx` — `PAGE_TITLES` completo.
- `components/admin/contenido/fields.js` — `icon` + `description` por categoría.
- `components/admin/contenido/ContentCategorySidebar.jsx` — ícono + descripción + estilo card.
- `components/admin/contenido/ContentEditor.jsx` — header de sistema + header de sección.
- `components/admin/contenido/LivePreview.jsx` — simulador mejorado + badges.

---

## Task 1: Token de acento + unificación en admin.module.css

**Files:**
- Modify: `app/globals.css` (:root)
- Modify: `components/admin/admin.module.css`

- [ ] **Step 1: Agregar tokens en `app/globals.css` dentro de `:root`** (junto a las otras variables):

```css
  /* Acento del panel admin (dorado bronce) */
  --admin-gold: #C9A96E;
  --admin-gold-08: rgba(201, 169, 110, 0.08);
  --admin-gold-10: rgba(201, 169, 110, 0.10);
  --admin-gold-12: rgba(201, 169, 110, 0.12);
  --admin-gold-15: rgba(201, 169, 110, 0.15);
  --admin-gold-18: rgba(201, 169, 110, 0.18);
  --admin-gold-25: rgba(201, 169, 110, 0.25);
  --admin-gold-glow: rgba(201, 169, 110, 0.25);
```

- [ ] **Step 2: Reemplazar los rgba del acento en `admin.module.css`** por la variable equivalente. Usar replace_all por patrón exacto:
  - `rgba(201, 169, 110, 0.08)` y `rgba(201,169,110,0.08)` → `var(--admin-gold-08)`
  - `0.1)` / `0.10)` variantes de `rgba(201,169,110,…)` → `var(--admin-gold-10)`
  - `0.12)` → `var(--admin-gold-12)`
  - `0.15)` → `var(--admin-gold-15)`
  - `0.18)` → `var(--admin-gold-18)`
  - `0.2)`/`0.25)` → `var(--admin-gold-25)`
  - color sólido `rgb(201,169,110)` o `#C9A96E`/`#c9a96e` si aparece → `var(--admin-gold)`
  Hacerlo buscando `201, 169, 110` y `201,169,110` (ambas grafías) y mapeando por la opacidad. Para cualquier opacidad fuera del set, agregar su token en Step 1 o usar `color-mix(in srgb, var(--admin-gold) N%, transparent)`.

- [ ] **Step 3: Unificar los `var(--gold*)` del acento del admin.** En `admin.module.css`, los usos de `var(--gold)` que representan el **acento** (sidebar activo, badge, hover de links, foco) deben pasar a `var(--admin-gold)` para que se vean dorados (hoy `--gold` global es blanco). Reemplazar en estas clases: `.sidebarLogoText span` (color), `.navLinkActive` (color), `.navLinkActive:hover` (color), `.navBadge` (background), `.sidebarVisitSite:hover` (color), y cualquier `.btn*`/`.formInput:focus`/`.filterTabActive`/`.sectionTabActive` que use `var(--gold)` como acento. Dejar `var(--white)`/`var(--gray-*)` como están. (No tocar `globals.css --gold`; es para la web pública.)

- [ ] **Step 4: Verificar**

Run: `grep -n "201, *169, *110" components/admin/admin.module.css | wc -l`
Expected: `0` (no quedan hardcodes del acento).
Run: `npm run build 2>&1 | grep -iE "compiled successfully|error:"`
Expected: compiled successfully.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/admin/admin.module.css
git commit -m "feat(admin): acento dorado centralizado en variables (--admin-gold)"
```

---

## Task 2: Módulo de íconos `<Icon>`

**Files:**
- Create: `components/admin/Icon.jsx`

**Interfaces:**
- Produces: `<Icon name="..." size={18} className={} />` → `<svg>` 24x24, `stroke="currentColor"`, `strokeWidth=1.5`, `fill="none"`. Si `name` no existe, no renderiza nada (o un cuadro vacío) sin romper. Export default.

- [ ] **Step 1: Crear `components/admin/Icon.jsx`** con el set necesario (paths SVG propios, trazo 1.5). Incluir al menos: `dashboard, building, layers, edit, image, grid, users, file-text, home, activity, dollar, message, clipboard, bell, search, eye, trash, plus, chevron-down, chevron-right, upload, palette, type, sliders, star, phone, mail, map-pin, external-link, save, x, menu`.

```jsx
const PATHS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
  building: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  layers: <><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  grid: <><path d="M9 5H2v7h7V5z"/><path d="M22 5h-7v7h7V5z"/><path d="M9 16H2v5h7v-5z"/><path d="M22 16h-7v5h7v-5z"/></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  "file-text": <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
  bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  "chevron-down": <polyline points="6 9 12 15 18 9"/>,
  "chevron-right": <polyline points="9 18 15 12 9 6"/>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  palette: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></>,
  type: <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
  sliders: <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
  mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  "map-pin": <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
  "external-link": <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
};

export default function Icon({ name, size = 18, className }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      {path}
    </svg>
  );
}
```

- [ ] **Step 2: Verificar** — `npm run build` compila (importado en Task 4 y 7-9).

- [ ] **Step 3: Commit**

```bash
git add components/admin/Icon.jsx
git commit -m "feat(admin): módulo de íconos <Icon> (SVG propios, sin deps)"
```

---

## Task 3: Reescritura visual de admin.module.css

**Files:**
- Modify: `components/admin/admin.module.css`

Objetivo: subir el nivel visual conservando nombres de clase. Reemplazar los bloques indicados por estas versiones (usan las variables de acento de Task 1). No cambiar selectores.

- [ ] **Step 1: Cards** — `.card`:
```css
.card {
  background: linear-gradient(180deg, rgba(20,44,84,0.35), rgba(10,22,40,0.5));
  border: 1px solid var(--admin-gold-12);
  border-radius: 0.9rem;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(10,22,40,0.35);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
.card:hover {
  border-color: var(--admin-gold-25);
  box-shadow: 0 12px 40px rgba(10,22,40,0.45), 0 0 0 1px var(--admin-gold-12), 0 0 24px var(--admin-gold-glow);
}
```

- [ ] **Step 2: Sidebar activo con glow** — `.navLink`, `.navLinkActive`, `.navIcon`:
```css
.navLinkActive {
  background: var(--admin-gold-12);
  color: var(--admin-gold);
  box-shadow: inset 2px 0 0 var(--admin-gold), 0 0 16px var(--admin-gold-glow);
}
.navLinkActive:hover { background: var(--admin-gold-18); color: var(--admin-gold); }
.navLinkActive .navIcon { opacity: 1; color: var(--admin-gold); }
```
(`.navLink` y `.navIcon` base ya existen; solo ajustar si hace falta el color.)

- [ ] **Step 3: Botones** — `.btnPrimary`:
```css
.btnPrimary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: var(--admin-gold-15);
  border: 1px solid var(--admin-gold);
  color: var(--admin-gold);
  padding: 0.6rem 1.1rem; border-radius: 0.6rem;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}
.btnPrimary:hover:not(:disabled) {
  background: var(--admin-gold-25);
  box-shadow: 0 0 20px var(--admin-gold-glow);
}
.btnPrimary:disabled { opacity: 0.5; cursor: not-allowed; }
.btnPrimary:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--admin-gold-25); }
```
(Preservar la estructura existente de `.btnSecondary`/`.btnIcon`/`.btnGhost`; solo alinear acentos a las variables.)

- [ ] **Step 4: Inputs con foco dorado** — `.formInput`, `.formSelect`, `.formTextarea` `:focus`:
```css
.formInput:focus, .formSelect:focus, .formTextarea:focus {
  outline: none;
  border-color: var(--admin-gold);
  box-shadow: 0 0 0 3px var(--admin-gold-15);
}
```

- [ ] **Step 5: Tabs activos + badgeGold** — `.filterTabActive`, `.sectionTabActive` usan `color: var(--admin-gold)` + `border-color: var(--admin-gold)`. Agregar la clase faltante:
```css
.badgeGold {
  background: var(--admin-gold-15);
  color: var(--admin-gold);
  border: 1px solid var(--admin-gold-25);
}
```
(`.badge` base ya existe; `.badgeGold` reutiliza su padding/tipografía.)

- [ ] **Step 6: Verificar no-regresión visual** — `npm run dev`, abrir `/admin` (dashboard), `/admin/propiedades`, `/admin/emprendimientos`, `/admin/administraciones`: el layout NO se rompe, cards/tabla/botones se ven con acento dorado y glow, texto legible. Sin errores de build.

- [ ] **Step 7: Commit**

```bash
git add components/admin/admin.module.css
git commit -m "feat(admin): reescritura visual high-end (cards, sidebar, botones, inputs, tabs)"
```

---

## Task 4: AdminSidebar con `<Icon>`

**Files:**
- Modify: `components/admin/AdminSidebar.jsx`

- [ ] **Step 1: Reemplazar los SVG inline de `NAV_ITEMS`** por nombres de ícono. Cambiar cada `icon: (<svg>…</svg>)` por `icon: '<nombre>'` según: Dashboard→`dashboard`, Propiedades→`building`, Emprendimientos→`layers`, Contenido→`edit`, Media→`image`, Panel→`grid`, Clientes→`users`, Contratos→`file-text`, Inmuebles→`home`, Pipeline→`activity`, Tasador→`dollar`, Contacto→`message`, Tasaciones→`clipboard`.

- [ ] **Step 2: Importar y usar `<Icon>`** en el render: `import Icon from './Icon';` y cambiar `<span className={styles.navIcon}>{item.icon}</span>` por `<span className={styles.navIcon}><Icon name={item.icon} size={20} /></span>`. El footer "Ver sitio web" puede pasar a `<Icon name="external-link" size={14} />`.

- [ ] **Step 3: Verificar** — `npm run dev`, el sidebar muestra todos los íconos, el ítem activo según la ruta se ve dorado con glow. Navegar entre secciones.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminSidebar.jsx
git commit -m "feat(admin): AdminSidebar usa el módulo <Icon>"
```

---

## Task 5: AdminTopbar — títulos completos

**Files:**
- Modify: `components/admin/AdminTopbar.jsx`

- [ ] **Step 1: Completar `PAGE_TITLES`** con todas las rutas:
```js
const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/propiedades': 'Propiedades',
  '/admin/emprendimientos': 'Emprendimientos',
  '/admin/contenido': 'Personalización Web',
  '/admin/media': 'Galería de Media',
  '/admin/administraciones/clientes': 'Clientes',
  '/admin/administraciones/contratos': 'Contratos',
  '/admin/administraciones/inmuebles': 'Inmuebles',
  '/admin/administraciones': 'Administraciones',
  '/admin/pipeline': 'Pipeline de Operaciones',
  '/admin/tasador': 'Tasador Online',
  '/admin/contacto': 'Mensajes de Contacto',
  '/admin/tasaciones': 'Solicitudes de Tasación',
};
```
Nota: el reduce actual elige por `startsWith`; como `/admin/administraciones/clientes` es más específico que `/admin/administraciones`, el orden importa. Cambiar la resolución para elegir el **match más largo**:
```js
const match = Object.keys(PAGE_TITLES)
  .filter((p) => pathname === p || (p !== '/admin' && pathname.startsWith(p)))
  .sort((a, b) => b.length - a.length)[0];
const title = match ? PAGE_TITLES[match] : 'Admin';
```

- [ ] **Step 2: (Opcional) usar `<Icon name="bell">` / `name="menu">`** en los botones del topbar para consistencia.

- [ ] **Step 3: Verificar** — navegar a `/admin/administraciones/clientes` muestra "Clientes" (no "Administraciones"), `/admin/tasador` muestra "Tasador Online", etc.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminTopbar.jsx
git commit -m "feat(admin): AdminTopbar con títulos completos (match más largo)"
```

---

## Task 6: fields.js — ícono + descripción por categoría

**Files:**
- Modify: `components/admin/contenido/fields.js`

- [ ] **Step 1: Agregar `icon` y `description` a cada entrada de `CATEGORIES`**:
```js
export const CATEGORIES = [
  { key: 'hero', label: 'Hero', scope: 'content', icon: 'home', description: 'Título, subtítulo y palabras rotativas de la portada' },
  { key: 'stats', label: 'Estadísticas', scope: 'content', icon: 'activity', description: 'Los contadores de la franja de métricas' },
  { key: 'values', label: 'Valores', scope: 'content', icon: 'star', description: "Las tarjetas de 'por qué elegirnos'" },
  { key: 'operations', label: 'Operaciones', scope: 'content', icon: 'grid', description: 'Las tarjetas de tipos de operación' },
  { key: 'cta', label: 'CTA', scope: 'content', icon: 'dollar', description: 'El bloque de llamada a tasación' },
  { key: 'footer', label: 'Footer', scope: 'content', icon: 'file-text', description: 'Texto de marca y datos de contacto del pie' },
  { key: 'navbar', label: 'Navbar', scope: 'content', icon: 'sliders', description: 'El botón destacado de la barra superior' },
  { key: 'colors', label: 'Colores', scope: 'theme', icon: 'palette', description: 'Paleta de marca del sitio' },
  { key: 'media', label: 'Media', scope: 'theme', icon: 'image', description: 'Video de fondo de la portada' },
];
```
(No tocar `FIELDS`.)

- [ ] **Step 2: Commit**

```bash
git add components/admin/contenido/fields.js
git commit -m "feat(admin): íconos y descripciones por categoría del editor"
```

---

## Task 7: ContentCategorySidebar — ícono + descripción + card

**Files:**
- Modify: `components/admin/contenido/ContentCategorySidebar.jsx`
- Modify: `components/admin/admin.module.css` (clases del ítem con descripción)

- [ ] **Step 1: CSS** — agregar al final de `admin.module.css`:
```css
.catItemFull { display: flex; align-items: flex-start; gap: 0.6rem; text-align: left; padding: 0.7rem 0.75rem; }
.catItemIcon { width: 34px; height: 34px; flex-shrink: 0; display: grid; place-items: center; border-radius: 0.5rem; background: var(--admin-gold-10); color: var(--admin-gold); }
.catItemBody { min-width: 0; flex: 1; }
.catItemLabel { font-size: 0.85rem; font-weight: 600; color: var(--gray-200); display: flex; align-items: center; gap: 0.4rem; }
.catItemDesc { font-size: 0.68rem; color: var(--gray-500); line-height: 1.35; margin-top: 0.1rem; }
.catItemActive .catItemLabel { color: var(--admin-gold); }
.catItemActive .catItemIcon { background: var(--admin-gold-25); box-shadow: 0 0 14px var(--admin-gold-glow); }
```

- [ ] **Step 2: Reescribir `ContentCategorySidebar.jsx`**:
```jsx
'use client';
import { CATEGORIES } from './fields';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

export default function ContentCategorySidebar({ active, onSelect, dirtyKeys }) {
  return (
    <div className={styles.catSidebar}>
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          className={`${styles.catItem} ${styles.catItemFull} ${active === c.key ? styles.catItemActive : ''}`}
          onClick={() => onSelect(c.key)}
        >
          <span className={styles.catItemIcon}><Icon name={c.icon} size={18} /></span>
          <span className={styles.catItemBody}>
            <span className={styles.catItemLabel}>
              {c.label}
              {dirtyKeys?.has(c.key) && <span className={styles.catDot} />}
            </span>
            <span className={styles.catItemDesc}>{c.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verificar** — `/admin/contenido`: cada categoría muestra chip de ícono + label + descripción; la activa se ve dorada con glow; el punto de cambios sin guardar sigue apareciendo al editar.

- [ ] **Step 4: Commit**

```bash
git add components/admin/contenido/ContentCategorySidebar.jsx components/admin/admin.module.css
git commit -m "feat(admin): sidebar de categorías con ícono + descripción"
```

---

## Task 8: ContentEditor — header de sistema + header de sección

**Files:**
- Modify: `components/admin/contenido/ContentEditor.jsx`
- Modify: `app/admin/contenido/page.js`
- Modify: `components/admin/admin.module.css` (clases de header)

- [ ] **Step 1: CSS** — agregar al final de `admin.module.css`:
```css
.systemHeader { margin-bottom: 1.25rem; }
.systemHeaderTag { display: inline-block; font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--admin-gold); background: var(--admin-gold-10); padding: 0.25rem 0.6rem; border-radius: 999px; margin-bottom: 0.5rem; }
.sectionHeader { display: flex; align-items: flex-start; gap: 0.75rem; padding-bottom: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--admin-gold-12); }
.sectionHeaderIcon { width: 40px; height: 40px; flex-shrink: 0; display: grid; place-items: center; border-radius: 0.6rem; background: var(--admin-gold-12); color: var(--admin-gold); }
.sectionHeaderTitle { font-family: var(--font-heading); font-size: 1.05rem; color: var(--white); font-weight: 700; }
.sectionHeaderDesc { font-size: 0.78rem; color: var(--gray-400); margin-top: 0.15rem; }
```

- [ ] **Step 2: `app/admin/contenido/page.js`** — reemplazar el `pageHeader` por el header de sistema:
```jsx
'use client';
import styles from '@/components/admin/admin.module.css';
import ContentEditor from '@/components/admin/contenido/ContentEditor';

export default function AdminContenido() {
  return (
    <div className={styles.systemHeader}>
      <span className={styles.systemHeaderTag}>Sistema de Diseño</span>
      <h2 className={styles.pageTitle}>Personalización Web</h2>
      <p className={styles.pageSubtitle}>Configuración integral de estética, copys y llamadas a la acción del sitio</p>
      <ContentEditor />
    </div>
  );
}
```

- [ ] **Step 3: `ContentEditor.jsx`** — en `editorForm`, antes de `def.intro`, renderizar el header de la sección activa usando `CATEGORIES`. Agregar import `import Icon from '@/components/admin/Icon';` y, dentro del componente, resolver `const catMeta = CATEGORIES.find((c) => c.key === active);` (ya existe `cat`; reutilizarlo). Insertar al inicio de `editorForm`:
```jsx
<div className={styles.sectionHeader}>
  <span className={styles.sectionHeaderIcon}><Icon name={cat.icon} size={20} /></span>
  <div>
    <div className={styles.sectionHeaderTitle}>{cat.label}</div>
    <div className={styles.sectionHeaderDesc}>{cat.description}</div>
  </div>
</div>
```
(`cat` ya está definido en el componente: `const cat = CATEGORIES.find((c) => c.key === active);`. Como `CATEGORIES` ahora trae `icon`/`description`, no requiere cambios de import extra salvo `Icon`.)

- [ ] **Step 4: Verificar** — `/admin/contenido` muestra el encabezado "SISTEMA DE DISEÑO / Personalización Web" y, al elegir una categoría, el header de sección con ícono + título + descripción. El guardado sigue funcionando.

- [ ] **Step 5: Commit**

```bash
git add components/admin/contenido/ContentEditor.jsx app/admin/contenido/page.js components/admin/admin.module.css
git commit -m "feat(admin): header de sistema + header de sección en el editor"
```

---

## Task 9: LivePreview — simulador en vivo mejorado

**Files:**
- Modify: `components/admin/contenido/LivePreview.jsx`
- Modify: `components/admin/admin.module.css` (marco del simulador)

- [ ] **Step 1: CSS** — agregar al final de `admin.module.css`:
```css
.simHeader { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.simTag { font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--admin-gold); }
.simBadges { display: flex; gap: 0.4rem; }
.simBadge { font-size: 0.6rem; padding: 0.2rem 0.55rem; border-radius: 999px; border: 1px solid var(--admin-gold-25); color: var(--admin-gold); }
.simBadgeLive { color: var(--success); border-color: color-mix(in srgb, var(--success) 40%, transparent); display: inline-flex; align-items: center; gap: 0.3rem; }
.simBadgeLive::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--success); }
.simNavbar { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
.simNavLinks { display: flex; gap: 0.9rem; font-size: 0.68rem; color: var(--gray-300); }
.simHero { display: grid; grid-template-columns: 1.3fr 1fr; gap: 1rem; padding: 1rem 0.9rem; align-items: center; }
.simHeroImg { aspect-ratio: 16/10; border-radius: 0.5rem; background: linear-gradient(135deg, var(--navy-700), var(--navy-900)); border: 1px dashed rgba(255,255,255,0.12); }
```

- [ ] **Step 2: Mejorar `LivePreview.jsx`** — agregar el header del simulador (tag + badges "En Vivo" / "Personalizado|Predeterminado") arriba del `previewFrame`, y para `hero`/`navbar` renderizar una cabecera + hero representativos. El badge Personalizado/Predeterminado se decide con una prop nueva `isCustom` (si la categoría activa difiere de defaults). Firma: `LivePreview({ category, content, theme, isCustom })`. Mantener los demás mini-renders.

Reemplazar el `return (...)` por:
```jsx
  return (
    <div>
      <div className={styles.simHeader}>
        <span className={styles.simTag}>Simulador en Vivo</span>
        <span className={styles.simBadges}>
          <span className={styles.simBadge}>{isCustom ? 'Personalizado' : 'Predeterminado'}</span>
          <span className={styles.simBadgeLive}>En Vivo</span>
        </span>
      </div>
      <div className={styles.previewFrame} style={style}>
        {(category === 'hero' || category === 'navbar' || category === 'colors' || category === 'media') && (
          <div>
            <div className={styles.simNavbar}>
              <strong style={{ color: 'var(--gold)' }}>Cardoso</strong>
              <span className={styles.simNavLinks}>
                <span>Inicio</span><span>Propiedades</span><span>Contacto</span>
              </span>
              <span style={{ background: 'var(--gold)', color: 'var(--navy-900)', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 600 }}>{c.navbar.ctaText}</span>
            </div>
            <div className={styles.simHero}>
              <div>
                <h2 style={white}>
                  {c.hero.titlePrefix} <em style={gold}>{c.hero.rotatingWords?.[0]}</em> {c.hero.titleSuffix}
                </h2>
                <p style={{ ...muted, fontSize: '0.8rem' }}>{c.hero.subtitle}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <span style={{ background: 'var(--gold)', color: 'var(--navy-900)', padding: '0.35rem 0.7rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 600 }}>{c.cta.btnPrimary}</span>
                </div>
                <small style={{ ...gold, display: 'block', marginTop: '0.5rem' }}>{c.hero.scrollText} ↓</small>
              </div>
              <div className={styles.simHeroImg} />
            </div>
          </div>
        )}
        {category === 'stats' && (/* …mini-render actual de stats… */)}
        {/* resto de categorías: dejar los mini-renders existentes (values, operations, cta, footer, colors extra, media) */}
      </div>
    </div>
  );
```
Conservar los mini-renders existentes de `stats`, `values`, `operations`, `cta`, `footer`, y el de `colors` (swatches) y `media` (video) como estaban, dentro del mismo `previewFrame`. Para `colors`/`media` se puede mostrar la cabecera+hero (arriba) y además su bloque específico.

- [ ] **Step 3: Pasar `isCustom` desde `ContentEditor`** — donde se renderiza `<LivePreview .../>`, agregar `isCustom={dirtyKeys.has(active) || /* o comparar vs defaults */ false}`. Simple: `isCustom={dirtyKeys.has(active)}` (marca Personalizado si la categoría tiene cambios sin guardar respecto de lo guardado). Nota en el commit que es una aproximación (dirty vs saved, no vs defaults).

- [ ] **Step 4: Verificar** — `/admin/contenido`, categoría Hero: el simulador muestra navbar + hero representativos; al tipear, cambia en vivo; el badge pasa a "Personalizado" al editar. Colores: cambiar el dorado se refleja en el simulador. Guardado sigue OK.

- [ ] **Step 5: Commit**

```bash
git add components/admin/contenido/LivePreview.jsx components/admin/admin.module.css
git commit -m "feat(admin): simulador en vivo mejorado (cabecera + hero + badges)"
```

---

## Cierre

- [ ] **No-regresión Fase 1:** en `/admin/contenido`, editar un campo → simulador refleja → Guardar → toast verde → (persistencia ya probada). Descartar y dirty siguen.
- [ ] **No-regresión admin:** recorrer dashboard, propiedades, emprendimientos, administraciones, contratos, pipeline — layout intacto, acento dorado consistente.
- [ ] **Build:** `npm run build` compila sin errores.
- [ ] **Lint:** `npm run lint` sin errores nuevos (los 14 preexistentes de setState-in-effect siguen, no se agregan).
- [ ] **Tests:** `npm test` → 14/14 (la lógica no cambió).
- [ ] Revisión de rama completa antes de integrar.
