# Sistema de Tasaciones — Diseño (Fase 1)

Fecha: 2026-10-30 · Proyecto: CRM Cardoso Propiedades

## Intención y porqué
Hoy no hay sistema de tasaciones. El form público `/tasar` no persiste nada
(los datos se descartan), la pantalla admin "Solicitudes de Tasación" lee de
`messages` donde nadie inserta, y la herramienta "Tasador" calcula pero está
desconectada. Objetivo: un flujo único de punta a punta que deje a Cardoso
gestionar tasaciones y **enviarle al cliente una ficha con branding profesional**
para mayor seriedad.

## Flujo objetivo
1. El cliente completa `/tasar` → se guarda una **solicitud** (estado `solicitada`).
2. Entra a la bandeja admin **Solicitudes de Tasación**.
3. El tasador abre el **detalle**, completa/corrige datos, corre el **motor de
   cálculo** (mix profesional) y elige **comparables** del portfolio.
4. Guarda → se genera un **link público** a la **ficha branded** (+ PDF).
5. El tasador manda el link al cliente por WhatsApp o mail (manual) y marca
   la tasación como `enviada`.

## Decisiones (acordadas con el usuario)
- **Número de tasación = mix profesional**: motor por m² de zona × ajustes +
  comparables + ajuste manual del tasador (criterio).
- **Comparables**: sugeridos del portfolio propio (publicaciones MercadoLibre)
  + carga/edición manual. Sin scraping externo.
- **Entrega**: link web branded (tema claro) + PDF descargable (`window.print`).
- **Envío**: manual (el tasador copia el link / botones WhatsApp y mail). Sin
  email automático en Fase 1.

## Arquitectura
- **Fuente de verdad única: tabla `tasaciones`** (ya existe; se amplía). Se deja
  de usar `messages` para tasaciones.
- **Motor** en `lib/tasacion-engine.js` (lógica pura, testeada). Lo comparten el
  detalle de tasación y la herramienta `/admin/tasador`.
- **Ficha pública** en `/tasacion/[token]`, servida por token vía
  `/api/tasacion/public` con `SUPABASE_SERVICE_ROLE_KEY` (mismo patrón que el
  portal de contratos `/api/portal`). Tema claro, imprimible A4.

### Factores del motor
Base = promedio USD/m² de la zona. Multiplicadores: tipo, estado de
conservación, antigüedad (escalonada), cochera (+5%), 3+ baños (+3%), amenities
(suma de bonus por ítem), y **ajuste manual** del tasador (%). Rango de
negociación = estimado ±8%. El motor devuelve el desglose (`factores`) que se
muestra en la ficha.

### Esquema (migración idempotente `lib/migration_tasaciones.sql`)
Amplía `tasaciones` con: `full_name, email, phone, barrio, extras, origen,
estado, public_token (unique), amenities jsonb, ajuste_manual, comparables jsonb,
factores jsonb, valor_min_usd, valor_max_usd, tasador, validez_dias, sent_at,
updated_at`. Estados: `solicitada | en_proceso | tasada | enviada | descartada`.

## Páginas/archivos
- `lib/tasacion-engine.js` (+ `.test.js`) — motor + catálogos.
- `lib/migration_tasaciones.sql` — DDL (correr en Supabase SQL Editor).
- `app/tasar/page.js` — persistir la solicitud.
- `lib/admin-fetchers.js` — `fetchTasaciones`.
- `app/admin/tasaciones/page.js` — lista desde `tasaciones` + link a detalle.
- `app/admin/tasaciones/[id]/page.js` — editor/calculadora + comparables + acciones.
- `app/api/tasacion/public/route.js` — lectura pública por token.
- `app/tasacion/[token]/page.js` — ficha branded + PDF.
- `components/admin/AdminSidebar.jsx` — badge desde `tasaciones`.
- `app/admin/tasador/page.js` — usa el motor compartido.

## No-goals (Fase 1)
- Email automático (Resend) y envío de WhatsApp automatizado.
- Scraping de portales externos.
- Autenticación/firma digital de la ficha.
- Multi-tasador / permisos finos.

## Riesgos / notas
- La migración SQL la corre el usuario en Supabase (convención del repo). El
  código es resiliente, pero la bandeja y el form no persisten hasta correrla.
- RLS de `tasaciones` es abierta (`USING(true)`), igual que el resto del app. La
  ficha pública lee por token con service role; endurecer RLS queda para después.

## Calls del builder (decididas por mí, revisables)
- Rango de negociación fijo en ±8% del estimado (siempre contiene el estimado).
- `tasador` por defecto "Mónica Cardoso"; `validez_dias` 60.
- Token = `crypto.randomUUID()` generado al guardar la primera tasación.
