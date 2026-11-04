# Plan de implementación: Panel del mes (CRM Administraciones)

**Spec:** [spec.md](./spec.md) · **Creado:** 2026-11-03 · **Estado:** listo para tasks/build
**Nota:** repo sin scaffolding speckit; plan escrito a mano con estructura speckit. Sin branch ni scripts.

---

## Contexto técnico

| Ítem | Valor |
|---|---|
| Framework | Next.js App Router (componentes client `'use client'`) |
| Datos | Supabase JS (`@/lib/supabase`), fetching con SWR |
| Estilos | CSS Modules `@/components/admin/admin.module.css`, módulo `Icon`, tema navy + dorado (ver `admin-design-system`) |
| Fetchers | `lib/admin-fetchers.js` (`fetchContratos`, `fetchAdminStats`) |
| Nav | `components/admin/AdminSidebar.jsx`, sección "Operaciones" |
| Landing a tocar | `app/admin/administraciones/page.js` (dashboard actual) |
| Migraciones | `lib/migration_administraciones.sql` (patrón existente); nueva tabla `saldos_cuenta` |

**Sin unknowns abiertos** — Q1/Q2/Q3 resueltas en spec (D1/D2/D3). No se requiere `research.md`.

### Principios (constitución de facto del proyecto)
- No romper lo existente: el dashboard, detalle de contrato, liquidaciones, índices y generador **se conservan**.
- Reutilizar lógica ya probada (`estadoVigente`, cálculo de próx. actualización del dashboard, `honorarios_porcentaje`).
- Nada de conversión de divisas: ARS y USD siempre separados.
- Seguir el design system admin (CSS Modules + `Icon`, sin Tailwind).

---

## Arquitectura de la solución

```
/admin/administraciones  (page.js)
├── <PanelDelMes>           ← NUEVO, primera sección (grilla + totales)
│     ├── KPI "Tu ganancia este mes" (ARS / USD)
│     ├── buscador + toggle "ver más" + export CSV
│     └── tabla plana (1 fila/contrato activo) + footer totales
└── (dashboard actual: stat-cards, mora, actualizaciones, vencimientos)  ← intacto, debajo

/admin/administraciones/saldos  (page.js)   ← NUEVO (pestaña "Saldos")
└── <SaldosPanel> : alta/edición/borrado de movimientos + saldo acumulado por contraparte+moneda
```

### Lógica compartida nueva → `lib/administraciones-calc.js`
Helpers puros, testeables, sin React:
- `montoVigente(contrato)` → último `acts.monto_nuevo` o `monto_inicial`.
- `honorarios(montoVigente, porcentaje, iva)` → `{ neto, iva, total }`.
- `netoPropietario(montoVigente, honorariosTotal)`.
- `proximaActualizacion(contrato)` → fecha derivada (extraer de la lógica hoy inline en el dashboard para reutilizar).
- `totalesPorMoneda(contratos)` → `{ ARS: {honorarios, neto}, USD: {...} }`.
- `estadoVigente(contrato)` → mover el que hoy vive en `contratos/page.js` acá para reutilizar.

---

## Fases de implementación

### Fase 1 — Grilla + Totales (dolores 1, 2, 3)
**Objetivo:** la landing muestra la grilla plana con alquiler vigente, honorarios, neto y totales por moneda.

1. `lib/administraciones-calc.js` — helpers puros (arriba). **Tests unitarios** de cada helper (casos: sin actualizaciones, con actualizaciones, USD, IVA on/off, 0 %).
2. `lib/admin-fetchers.js` — extender `fetchContratos` (o nuevo `fetchContratosGrilla`) para traer en el `select`: `monto_inicial, moneda, honorarios_porcentaje, honorarios_iva, fecha_inicio, fecha_fin, estado, periodicidad_ajuste, indice_ajuste`, `acts:actualizaciones_contrato(fecha, monto_nuevo)`, locador/locatario con `nombre, dni_cuit`, inmueble con `direccion`.
3. `components/admin/administraciones/PanelDelMes.jsx` — grilla + KPI + footer. Usa SWR + helpers. Filtra a activos (`estadoVigente`). Montos con moneda. Totales por moneda (D3: sobre filas filtradas + total del mes como referencia).
4. `app/admin/administraciones/page.js` — montar `<PanelDelMes>` como primera sección, dashboard intacto debajo.

**Criterios:** E1, E2, E3, E4 · RF-01..RF-13, RF-09..RF-11.

### Fase 2 — Buscador, columnas extra, export, próx. actualización (D2, D3)
1. Buscador en `PanelDelMes` (filtra inmueble/locador/locatario); recálculo de subtotales (RF-14, RF-14b).
2. Toggle "ver más" → columnas CUIT locador, CUIT locatario, meses-label actualización (RF-15b, D2).
3. Columna "Próx. actualización" con resaltado de este-mes/vencido (RF-07, E8).
4. Export CSV con fila de totales por moneda, formato es-AR (RF-15, E6).

**Criterios:** E5, E6, E8 · RF-07, RF-14/14b, RF-15/15b.

### Fase 3 — Saldos / cuentas corrientes (dolor 4)
1. **Migración** `lib/migration_saldos_cuenta.sql` → tabla `saldos_cuenta` (ver data-model). Correr en Supabase.
2. `lib/admin-fetchers.js` — `fetchSaldos()` + helpers de agregado por contraparte+moneda.
3. `components/admin/administraciones/SaldoModal.jsx` — alta/edición (fecha, concepto, monto, moneda, sentido, contraparte: cliente existente o texto libre).
4. `app/admin/administraciones/saldos/page.js` — lista + saldo acumulado por contraparte+moneda + CRUD.
5. `components/admin/AdminSidebar.jsx` — item "Saldos" en sección "Operaciones" (`/admin/administraciones/saldos`, icon `dollar` o `scale`).

**Criterios:** E7 · RF-16..RF-20, D1.

---

## Contratos de datos (interfaces)

### fetchContratosGrilla() → Contrato[]
```
{
  id, moneda: 'ARS'|'USD',
  monto_inicial, honorarios_porcentaje, honorarios_iva,
  fecha_inicio, fecha_fin, estado, periodicidad_ajuste, indice_ajuste,
  acts: [{ fecha, monto_nuevo }],
  locador:   { nombre, dni_cuit },
  locatario: { nombre, dni_cuit },
  inmueble:  { direccion }
}
```
Derivados en cliente (no en DB): `montoVigente`, `honorariosTotal`, `netoPropietario`, `proximaActualizacion`, `estadoVigente`.

### fetchSaldos() → Saldo[]
```
{
  id, fecha, concepto, monto, moneda: 'ARS'|'USD',
  sentido: 'a_favor'|'en_contra',
  contraparte_cliente_id | null, contraparte_texto | null,
  contrato_id | null, created_at
}
```
Agregado: `saldoPorContraparte(saldos)` → `[{ contraparte, moneda, saldo }]` (a_favor suma, en_contra resta).

---

## Modelo de datos nuevo

Ver [data-model.md](./data-model.md). Resumen: tabla `saldos_cuenta` (única migración). Todo lo demás usa tablas existentes.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Duplicar lógica de `estadoVigente`/próx. actualización | Centralizar en `administraciones-calc.js` y reemplazar los usos inline del dashboard y `contratos/page.js` |
| Grilla ancha en mobile con "ver más" | Columnas extra ocultas por defecto; scroll horizontal del `tableWrapper` existente |
| Contratos sin honorarios_porcentaje (ej. 0) | S-01: honorario = 0, no asumir 7 % |
| Mezcla de monedas en totales | Helpers agrupan por `moneda`; test que lo verifica |
| Migración `saldos_cuenta` olvidada en prod | Documentar en el plan y en memoria (igual que tasaciones pendiente de migración) |

---

## Verificación (quickstart)

1. `npm run dev` → abrir `/admin/administraciones`.
2. Ver grilla con ≥1 contrato activo, alquiler vigente correcto (coincide con última actualización registrada).
3. KPI "Tu ganancia este mes": total ARS y total USD separados; cruzar contra suma manual del excel.
4. Buscar "Lestani" → filas y subtotales se ajustan; total del mes sigue visible.
5. "Ver más" → aparecen CUITs y meses-label.
6. Export CSV → abre en planilla con fila de totales.
7. `/admin/administraciones/saldos` → cargar "U$S 28 a favor de Havrán", recargar, persiste; saldo acumulado por contraparte correcto.
8. Confirmar que dashboard, detalle de contrato, liquidaciones e índices siguen funcionando (no regresión).

---

## Orden de ejecución sugerido
Fase 1 (helpers+tests → fetcher → PanelDelMes → montar) → Fase 2 (buscador→columnas→export) → Fase 3 (migración→fetcher→modal→page→nav).
Cada fase es desplegable por separado; Fase 1 ya entrega el 80 % del valor.
