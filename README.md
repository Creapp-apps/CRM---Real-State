# 🏢 Cardoso Propiedades — Plataforma Inmobiliaria Integral & CRM PropTech

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Motion-Fluid_UX-FF0055?style=for-the-badge&logo=framer&logoColor=white)](https://motion.dev/)

**Solución PropTech integral a medida: Portal público de búsqueda de propiedades y desarrollos inmobiliarios, motor de tasaciones online y CRM administrativo con pipeline de ventas y captación de leads.**

[Explorar CreAPP Lab](https://creapp.com.ar) • [Reportar un Issue](https://github.com/Creapp-apps/CRM---Real-State/issues)

</div>

---

## 🌟 Visión del Producto

**Cardoso Propiedades Real State Platform** es una solución digital de punta a punta creada para transformar la comercialización inmobiliaria. Conecta un portal público moderno de alta velocidad y conversión para clientes compradores/inquilinos con un potente sistema de gestión interna (CRM) para corredores y martilleros inmobiliarios.

---

## 🚀 Módulos y Capacidades

### 🌐 1. Portal Público de Propiedades & Emprendimientos
* **Buscador con Filtros Dinámicos:** Búsqueda en tiempo real por operación (*Venta, Alquiler, Temporal*), tipología (*Casas, Departamentos, Terrenos, Locales*), ubicación y rango de precios en USD o ARS.
* **Fichas Técnicas Enriquecidas:** Galerías fotográficas en alta resolución, planos arquitectónicos, tours virtuales, mapa interactivo de cercanía y detalle pormenorizado de servicios y amenities.
* **Sección de Emprendimientos & Pozo:** Presentación de desarrollos inmobiliarios desde pozo, avances de obra, unidades disponibles por piso y cotizaciones en pozo.
* **Motor de Solicitud de Tasaciones:** Formulario estructurado para que propietarios soliciten tasaciones comerciales o residenciales con carga asistida de características.

### 💼 2. CRM Administrativo & Pipeline Comercial (`/admin`)
* **Gestión de Inventario Inmobiliario:** Alta, edición y cambio de estados (*Disponible, Reservado, Vendido, Alquilado*) con subida optimizada de imágenes a Supabase Storage.
* **Pipeline de Leads y Prospectos:** Centralización de consultas recibidas por formularios y WhatsApp, clasificadas por etapa del embudo comercial y asesor asignado.
* **Portal de Clientes Propietarios (`/portal`):** Vista privada para que propietarios sigan el estado de visitas, ofertas y comercialización de su inmueble.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Framework Web** | `Next.js (App Router)` + `React` | Renderizado híbrido (SSR + SSG) optimizado para SEO inmobiliario y carga instantánea. |
| **Estilos & Animaciones** | `TailwindCSS` + `Motion` + `OGL` | Experiencia visual premium, microinteracciones y shaders visuales fluidos. |
| **Base de Datos & Storage**| `Supabase` (PostgreSQL) | Almacenamiento relacional de propiedades, clientes y CDN de imágenes inmobiliarias. |
| **Arquitectura de Rutas** | Next.js App Directory | Rutas segregadas para navegación pública, portal de clientes y panel de administración. |

---

## 💻 Puesta en Marcha Local

### Prerrequisitos
* Node.js 18+ instalado
* Proyecto de Supabase configurado con tablas de `propiedades`, `leads` y buckets de storage

### 1. Clonar el repositorio
```bash
git clone https://github.com/Creapp-apps/CRM---Real-State.git
cd CRM---Real-State
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Iniciar servidor
```bash
npm run dev
```
Disponible en `http://localhost:3000`.

---

<div align="center">
<sub>Desarrollado para el sector inmobiliario de alta gama por <b>CreAPP Software Lab</b> © 2026</sub>
</div>
