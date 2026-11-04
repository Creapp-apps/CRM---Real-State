# Spec: CRM óptimo de Administraciones para Mónica ("Panel del mes")

**Creada:** 2026-11-03
**Estado:** Borrador para revisión
**Módulo:** `/admin/administraciones` (ya en prod)
**Origen:** análisis del excel `ADMINISTRACIONES.xlsx` con el que Mónica lleva hoy sus administraciones mensuales.

---

## Por qué (contexto y problema)

Mónica gestiona ~14 administraciones de alquiler en una **única planilla de Excel plana**: una fila por contrato, todo a la vista en una pantalla. Su modelo mental es esa grilla. La plataforma actual es **más completa por contrato** (9 tabs de detalle, liquidaciones, índices reales, generador de contrato), pero **parte la información** en pantallas separadas (dashboard, contratos, clientes, inmuebles) y **no reproduce lo que el Excel le da gratis**:

1. **Grilla de un vistazo** — ver todos los contratos activos con sus números en una sola pantalla.
2. **Total de honorarios del mes** — su pregunta #1 de negocio: *"¿cuánto gano yo este mes?"* (celdas `F24`/`G24` del Excel).
3. **Contratos en dólares** tratados como tales, sin mezclarse con los pesos.
4. **Saldos sueltos entre partes** — notas tipo *"quedan U$S 28 a favor de Havrán"*, *"debo a Lorena U$S…"*.

Objetivo: que Mónica abra `/admin/administraciones` y tenga su Excel —pero vivo, calculado y sin carga manual— como primera pantalla.

### Mapeo Excel → plataforma (estado actual)

| Columna Excel | Significado | Hoy en la plataforma |
|---|---|---|
| Locador / Locatario | dueño / inquilino | ✅ `clientes` |
| Domicilio | inmueble | ✅ `inmuebles_administrados` |
| Alquiler | monto vigente | ⚠️ existe, pero la lista muestra `monto_inicial`, no el vigente |
| Hon. $ / Hon. U$S | honorarios (≈7 % del alquiler) | ✅ `contratos.honorarios_porcentaje` (no se muestra en lista ni se suma) |
| NETO Prop. | alquiler − honorarios | ✅ se calcula en liquidación (no en la grilla) |
| CUIT locador + locatario | para facturar | ✅ `clientes.dni_cuit` (no visible en la grilla) |
| ACTUALIZACION ("Dec/Mar/Jun") | meses de ajuste | ⚠️ se deriva por periodicidad; no se muestran los meses-label |
| Vto. contrato / Ajuste | ✅ `fecha_fin`, `periodicidad_ajuste` |
| Moneda (ARS/USD) | ✅ `contratos.moneda` ('ARS'/'USD') |
| TOTAL honorarios | ganancia agregada del mes | ❌ no existe |
| Notas de saldos | cuentas corrientes informales | ❌ no existe |

---

## Alcance

**Incluye:**
- Panel del mes (grilla plana) como nueva landing de `/admin/administraciones`, por encima del dashboard actual.
- KPI + footer de total de honorarios del mes, separado por moneda.
- Respeto estricto de moneda (ARS vs USD) en grilla y totales.
- Mini-ledger de saldos/cuentas corrientes por contraparte.
- Export CSV de la grilla.

**No incluye (fuera de alcance):**
- Rediseñar el detalle de contrato (9 tabs) ni las liquidaciones existentes.
- Conversión de divisas / cotización USD→ARS (los totales se muestran por separado, nunca convertidos).
- Facturación electrónica / AFIP.
- Cambios en el portal del inquilino.

---

## Usuarios y roles

- **Mónica (administradora)** — único rol operativo. Ve y edita todo dentro del admin.
- (Futuro multi-cliente: la grilla debe respetar el mismo aislamiento por cliente que el resto del admin; no se agrega lógica nueva de permisos en esta feature.)

---

## Escenarios de usuario (aceptación)

### E1 — Ver el mes de un vistazo
**Dado** que Mónica entra a `/admin/administraciones`,
**cuando** carga la página,
**entonces** ve una grilla con una fila por cada contrato **activo**, mostrando: Inmueble · Locador · Locatario · Alquiler vigente · Hon. % · Hon. $ · NETO Prop. · Inicio · Vto · Próx. actualización · Estado;
**y** cada monto se muestra en la moneda del contrato (ARS o USD).

### E2 — Saber cuánto ganó este mes
**Dado** que la grilla está cargada,
**cuando** Mónica mira la cabecera,
**entonces** ve un KPI "Tu ganancia este mes" con el **total de honorarios en ARS** y el **total en USD** por separado;
**y** el footer de la grilla repite esos subtotales por moneda;
**y** los totales **solo** suman contratos activos.

### E3 — Alquiler vigente, no el inicial
**Dado** un contrato que ya tuvo actualizaciones registradas,
**cuando** aparece en la grilla,
**entonces** la columna "Alquiler vigente" muestra el **último `monto_nuevo`** registrado (o el `monto_inicial` si no hubo ninguna);
**y** Hon. $ y NETO Prop. se calculan sobre ese monto vigente.

### E4 — Dólares sin mezclar
**Dado** un contrato en USD (p. ej. Roust/Havrán),
**cuando** se muestran grilla y totales,
**entonces** sus montos se etiquetan en USD;
**y** nunca se suman junto a los montos en ARS.

### E5 — Buscar
**Dado** que Mónica busca por texto (inmueble, locador o locatario),
**cuando** escribe en el buscador,
**entonces** la grilla filtra en vivo las filas coincidentes;
**y** los subtotales por moneda se recalculan sobre las filas visibles;
**y** se sigue mostrando, como referencia fija, el total del mes completo (sin filtro).

### E6 — Exportar a CSV
**Dado** que Mónica quiere su "Excel de siempre",
**cuando** hace clic en "Exportar CSV",
**entonces** descarga un archivo con las columnas de la grilla y una fila de totales por moneda.

### E7 — Registrar un saldo entre partes
**Dado** que Mónica necesita anotar "quedan U$S 28 a favor de Havrán",
**cuando** abre el mini-ledger de saldos y carga un movimiento (fecha, concepto, monto, moneda, a favor / en contra, contraparte),
**entonces** el movimiento queda guardado y persiste entre sesiones;
**y** puede ver el saldo acumulado por contraparte y moneda.

### E8 — Próxima actualización visible
**Dado** un contrato activo con periodicidad de ajuste,
**cuando** aparece en la grilla,
**entonces** la columna "Próx. actualización" muestra la próxima fecha de ajuste programada (derivada de inicio + periodicidad, la que ya usa el dashboard);
**y** se resalta si cae dentro del mes en curso o está vencida.

---

## Requisitos funcionales

### Grilla (Panel del mes)
- **RF-01** El sistema DEBE mostrar, como primera sección de `/admin/administraciones`, una grilla con una fila por contrato activo.
- **RF-02** La grilla DEBE incluir las columnas: Inmueble, Locador, Locatario, Alquiler vigente, Hon. %, Hon. $, NETO Prop., Inicio, Vto, Próx. actualización, Estado.
- **RF-03** "Alquiler vigente" DEBE ser el último `monto_nuevo` de `actualizaciones_contrato` o, si no hay, `monto_inicial`.
- **RF-04** "Hon. $" DEBE calcularse como `alquiler vigente × honorarios_porcentaje / 100` (con IVA si `honorarios_iva`), en la moneda del contrato.
- **RF-05** "NETO Prop." DEBE ser `alquiler vigente − Hon. $` en la moneda del contrato.
- **RF-06** Todos los montos DEBEN mostrarse con su moneda (ARS/USD) visible.
- **RF-07** "Próx. actualización" DEBE reutilizar la lógica de ajuste programado ya existente en el dashboard (`inicio + k·periodicidad`), y resaltar los que caen este mes o están vencidos.
- **RF-08** El dashboard actual (stat-cards, mora, actualizaciones, vencimientos) DEBE seguir disponible por debajo de la grilla, sin perder funcionalidad.

### Totales de honorarios
- **RF-09** El sistema DEBE mostrar un KPI "Tu ganancia este mes" con el total de honorarios **separado por moneda** (un total ARS y un total USD).
- **RF-10** El footer de la grilla DEBE repetir esos subtotales por moneda.
- **RF-11** Los totales DEBEN sumar únicamente contratos activos y NUNCA convertir ni mezclar monedas.

### Moneda
- **RF-12** El sistema DEBE respetar `contratos.moneda` en cada fila, cálculo y total.
- **RF-13** El sistema NO DEBE convertir USD a ARS ni viceversa en ningún cálculo de esta feature.

### Buscador y export
- **RF-14** El sistema DEBE permitir filtrar la grilla por texto sobre inmueble, locador y locatario.
- **RF-14b** Al filtrar, los subtotales por moneda DEBEN recalcularse sobre las filas visibles, y DEBE mostrarse además el total del mes completo como referencia fija.
- **RF-15** El sistema DEBE permitir exportar la grilla visible a CSV, incluyendo una fila de totales por moneda.
- **RF-15b** La grilla DEBE ofrecer un toggle "ver más" que agregue columnas opcionales (CUIT locador, CUIT locatario y meses-label de actualización), ocultas por defecto.

### Cuentas corrientes / saldos
- **RF-16** El sistema DEBE permitir registrar movimientos de saldo con: fecha, concepto, monto, moneda, sentido (a favor / en contra) y contraparte, desde una **pestaña propia "Saldos"** en el menú de administraciones.
- **RF-17** La contraparte DEBE poder vincularse a un cliente existente o escribirse como texto libre (p. ej. "Lorena").
- **RF-18** El sistema DEBE mostrar el saldo acumulado por contraparte y moneda.
- **RF-19** Los movimientos DEBEN persistir en una tabla nueva (`saldos_cuenta`) con su migración correspondiente.
- **RF-20** El sistema DEBE permitir editar y eliminar un movimiento de saldo.

---

## Entidades clave

- **Contrato** (existe) — relación locador/locatario/inmueble, `monto_inicial`, `moneda`, `honorarios_porcentaje`, `honorarios_iva`, `periodicidad_ajuste`, `estado`, fechas. Fuente de las columnas de la grilla.
- **Actualización de contrato** (existe) — `fecha`, `monto_nuevo`. Define el alquiler vigente.
- **Cliente** (existe) — `nombre`, `dni_cuit`. Locador, locatario y contraparte opcional de un saldo.
- **Saldo de cuenta** (nuevo — `saldos_cuenta`) — `id`, `fecha`, `concepto`, `monto`, `moneda` (ARS/USD), `sentido` (a_favor/en_contra), `contraparte_cliente_id` (opcional), `contraparte_texto` (opcional), `contrato_id` (opcional), timestamps.

---

## Criterios de éxito (medibles)

- **CE-01** Mónica puede ver el alquiler vigente, honorarios y neto de **todos** sus contratos activos en **una sola pantalla**, sin navegar a otra página.
- **CE-02** Mónica puede responder *"¿cuánto gano este mes?"* en **menos de 5 segundos** desde que abre la sección, leyendo un único indicador por moneda.
- **CE-03** Ningún total mezcla pesos con dólares: los contratos en USD aparecen con su subtotal propio, verificable contra el Excel (`F24`).
- **CE-04** Mónica puede descargar la grilla como archivo abrible en Excel/planilla, replicando su flujo actual.
- **CE-05** Mónica puede registrar y consultar un saldo entre partes (p. ej. "U$S 28 a favor de Havrán") y verlo al volver en otra sesión.
- **CE-06** La feature no rompe ni oculta ninguna capacidad ya existente del módulo (detalle, liquidaciones, índices, generador).

---

## Supuestos

- **S-01** Honorarios = porcentaje ya cargado por contrato (`honorarios_porcentaje`); si un contrato tiene 0 %, su honorario es 0 (no se asume 7 % por defecto).
- **S-02** "Este mes" = mes calendario en curso en zona horaria Argentina.
- **S-03** La grilla usa el mismo criterio de "activo" por fecha que ya aplica el módulo (`estadoVigente`), no solo el flag manual `estado`.
- **S-04** El CSV usa separador y formato numérico compatibles con Excel es-AR.
- **S-05** El mini-ledger de saldos es contable-informal (no genera asientos ni afecta liquidaciones existentes en esta fase).
- **S-06** El diseño sigue el design system del admin (navy + dorado bronce, CSS Modules, módulo `Icon`), ver `admin-design-system`.

---

## Decisiones (resueltas 2026-11-03)

- **D1 — Ubicación del ledger de saldos:** pestaña nueva **"Saldos"** en el menú de administraciones (vista global de a quién le debe / le deben). → RF-16.
- **D2 — Columnas CUIT y meses-label:** se incluyen como **columnas extra con toggle "ver más"**, ocultas por defecto, para calcar el Excel sin saturar la grilla. → RF-15b.
- **D3 — Totales al filtrar:** los subtotales por moneda **reflejan las filas filtradas**, mostrando además el **total del mes completo** como referencia fija. → E5, RF-14b.

---

## Dependencias

- Tablas existentes: `contratos`, `actualizaciones_contrato`, `clientes`, `inmuebles_administrados`.
- Nueva migración: `saldos_cuenta`.
- Design system admin (`admin-design-system`).
- Lógica de ajuste programado ya presente en `fetchAdminStats` / dashboard.
