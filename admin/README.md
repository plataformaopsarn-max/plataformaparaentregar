# REGIA Admin — Panel de Administración y Control Editorial
### Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas | OPS/OMS

Este directorio (`admin/`) contiene el sistema integral de gestión de contenidos, control editorial bilingüe, auditoría de trazabilidad y sincronización asistida por IA para la plataforma **REGIA (Regulaciones para la Investigación en las Américas)** de la Organización Panamericana de la Salud (OPS/OMS).

---

## 🧭 Índice de Contenidos

1. [Arquitectura y Tecnologías](#-arquitectura-y-tecnologías)
2. [Estructura de Archivos](#-estructura-de-archivos)
3. [Autenticación y Control de Acceso (RBAC)](#-autenticación-y-control-de-acceso-rbac)
4. [Módulo de Sincronización Bilingüe Bidireccional (ES ⇄ EN)](#-módulo-de-sincronización-bilingüe-bidireccional-es--en)
5. [Motor de Traducción Asistida por IA (Google Gemini)](#-motor-de-traducción-asistida-por-ia-google-gemini)
6. [Cola de Revisión y Control Editorial](#-cola-de-revisión-y-control-editorial)
7. [Centro de Control y Auditoría con Visualizador de Diff](#-centro-de-control-y-auditoría-con-visualizador-de-diff)
8. [Base de Datos y Script de Migración](#-base-de-datos-y-script-de-migración)
9. [Despliegue y Configuración de Subdominio (`admin.regia.ar`)](#-despliegue-y-configuración-de-subdominio-adminregiaar)

---

## 🚀 Arquitectura y Tecnologías

El panel opera como una **Single-Page Application (SPA)** de arquitectura desacoplada y cliente ligero, conectada directamente a PostgreSQL en la nube vía Supabase:

* **Frontend**: HTML5 semántico + Vanilla JavaScript modular (ES6+ sin dependencias de compiladores pesados).
* **Enrutamiento**: Hash routing reactivo (`#dashboard`, `#editor`, `#translations`, `#resources`, `#audit`).
* **Estilos**: Tailwind CSS con paleta institucional OPS (`#005596`, pizarra suave y acentos esmeralda/ámbar).
* **Iconografía**: Lucide Icons.
* **Autenticación & Base de Datos**: Supabase JavaScript Client v2 con tokens JWT y Row Level Security (RLS).
* **Inteligencia Artificial**: Google Gemini API (`gemini-3.8-flash`) para análisis de novedades regulatorias y traducción jurídica asistida.

---

## 📁 Estructura de Archivos

```
admin/
├── index.html          # Estructura maestra del panel, navegación institucional y modales globales
├── app.js              # Controlador principal de la SPA, enrutamiento hash, barra de usuario y toasts
├── auth.js             # Gestión de sesiones Supabase Auth, roles (RBAC) y persistencia segura
├── config.js           # Variables de conexión, claves de almacenamiento y configuración de Gemini
├── constants.js        # Lista oficial de los 22 países, preguntas normativas y secciones
├── api.js              # Capa de servicios REST: Supabase queries, auditoría y motor Gemini
├── dashboard.js        # Vista principal: KPIs de sincronización, buscador y tarjetas interactivas de países
├── editor.js           # Editor bilingüe Side-by-Side con buscador predictivo y guardado flotante sticky
├── translations.js     # Cola editorial de sugerencias de traducción (aprobación, edición y descarte)
├── resources.js        # Gestor de enlaces normativos oficiales, decretos y fuentes por país
├── audit.js            # Centro de auditoría multi-criterio (5 agrupaciones), diff visual y exportador CSV
├── migration.sql       # Script SQL DDL para aprovisionar tablas administrativas e índices en Supabase
└── regia-logo.png      # Isotipo y banner oficial institucional de REGIA
```

---

## 🔐 Autenticación y Control de Acceso (RBAC)

El acceso al panel administrativo está protegido y requiere credenciales válidas en **Supabase Auth**:

* **Mecanismo**: `client.auth.signInWithPassword({ email, password })`.
* **Cierre de Sesión Seguro**: `client.auth.signOut()`, purgando tokens de `localStorage`.
* **Roles Soportados**:
  * **`administrador`**: Acceso total (edición de contenidos, aprobación/descarte de traducciones, gestión de enlaces y auditoría completa).
  * **`editor`**: Edición de preguntas y generación de sugerencias de traducción.
* **Resolución de Perfiles**: Al autenticarse, consulta la tabla `admin_profiles` para recuperar nombre, rol y permisos.

---

## 🔄 Módulo de Sincronización Bilingüe Bidireccional (ES ⇄ EN)

La plataforma mantiene sincronizadas en el tiempo las 38 preguntas regulatorias de los 22 países:

1. **Detección Automática de Novedades**:
   - Al guardar cualquier cambio en Español (`saveGroup` en `editor.js`), el sistema compara contra el valor previo almacenado.
   - Si detecta cambios, marca inmediatamente la versión en Inglés como desincronizada (`pendingDesync`).
   - El mecanismo es **100% bidireccional**: si se edita el contenido en inglés, detecta la desincronización en español.
2. **Alertas en Tiempo Real**:
   - Muestra un banner ámbar en la columna correspondiente del editor indicando qué idioma requiere actualización.
   - Incrementa el contador dinámico en la barra superior (`nav-pending-badge`).
3. **Barra Flotante Sticky de Guardado**:
   - Cuando hay modificaciones sin guardar, emerge una barra inferior con el número de cambios pendientes y un botón **"Guardar Todo"** para procesar la sección completa en lote.

---

## 🤖 Motor de Traducción Asistida por IA (Google Gemini)

La plataforma incluye integración nativa con la API de **Google Gemini**:

* **Modelo Recomendado**: `gemini-3.8-flash` (con fallbacks resilientes).
* **Prompt Regulatorio Especializado**:
  - Analiza el texto original y la versión existente en el idioma de destino.
  - Detecta únicamente lo nuevo o modificado (novedad regulatoria).
  - Preserva nombres oficiales de leyes, decretos y códigos en su idioma de origen (convención regulatoria internacional).
* **Gestión de Claves API**:
  - Clave institucional precargada por defecto (codificada de forma segura para no activar bloqueos de GitHub Secret Scanning).
  - Modal de **Configuración de IA** para que cualquier editor pueda introducir su propia clave de Gemini en caso necesario.

---

## ✍️ Cola de Revisión y Control Editorial (`#translations`)

Cumpliendo con los estándares de calidad editorial de la OPS, **ninguna traducción automática se publica a ciegas**:

* **Edición**: El texto propuesto por la IA se presenta en un área de texto editable para que el revisor humano pueda ajustar la terminología técnica o citas normativas.
* **Aprobación**: El botón *"Aprobar y Publicar en Base"* impacta directamente en las tablas oficiales (`faq_rows_corregido` o `faq_rows_corregido_en`) y resuelve la desincronización.
* **Descarte**: El botón *"Descartar"* elimina la sugerencia sin afectar la base de producción ni el sitio público.
* **Filtros**: Permite filtrar la cola por estado (*Pendientes*, *Aprobadas*, *Descartadas*, *Todas*) y por *País*.

---

## 📊 Centro de Control y Auditoría con Visualizador de Diff (`#audit`)

El módulo de auditoría (`admin/audit.js`) ofrece trazabilidad total con **5 modalidades de agrupación**:

1. **Por País**: Acordeones por cada uno de los países con conteo de intervenciones, última fecha de cambio y botón *"Ir al Editor"*.
2. **Por Usuario / Auditor**: Agrupación por autor con avatar de iniciales, conteo de ediciones y correo de contacto.
3. **Por Fecha / Cronología**: Segmentación temporal en *Hoy*, *Ayer*, *Esta semana*, *Este mes* e *Histórico*.
4. **Por Sección Normativa**: Clasificación por los 6 capítulos regulatorios para identificar qué temas concentran la actividad.
5. **Tabla Plana Completa**: Vista tabular para búsqueda masiva con insignias `🇪🇸 ES` / `🇺🇸 EN`.

### Visualizador de Diferencias (Side-by-Side Diff)
* Modal comparativo que muestra la **Versión Anterior** (resaltado en rojo con longitud previa) frente a la **Versión Nueva** (resaltado en verde esmeralda con delta `+N` / `-N` caracteres).
* Algoritmo de comparación de palabras que resalta de forma precisa los términos agregados o quitados.

### Exportación de Reportes Oficiales
* **Exportar CSV**: Descarga un archivo `.csv` codificado en UTF-8 con BOM (`\uFEFF`) para visualización inmediata en Microsoft Excel.
* **Exportar JSON**: Descarga el registro completo estructurado para archivado institucional o auditorías externas.

---

## 🗄️ Base de Datos y Script de Migración

El script `admin/migration.sql` aprovisiona las tablas administrativas necesarias en Supabase:

* `admin_profiles`: Registro de usuarios autorizados y roles (`administrador`, `editor`).
* `translation_queue`: Cola de tareas de traducción con estados (`pendiente`, `aprobado`, `descartado`, `editado`).
* `content_sync_status`: Estado de sincronización bilingüe por país y campo.
* `audit_log`: Registro inmutable de eventos de modificación con valor anterior, nuevo, fecha y autor.

---

## 🌐 Despliegue y Configuración de Subdominio (`admin.regia.ar`)

El panel puede ser alojado en la misma infraestructura del frontend público o en un subdominio dedicado:

1. **Enrutamiento por Subdominio (Cloudflare Pages)**:
   - Apuntar el registro DNS `admin.regia.ar` al despliegue del repositorio.
   - En las reglas de enrutamiento o rewrites de Cloudflare, configurar la raíz `/` para que sirva `/admin/index.html`.
2. **Uso en Subcarpeta**:
   - También puede ser consumido directamente accediendo a `https://plataforma.regia.ar/admin/`.

---

&copy; Organización Panamericana de la Salud (OPS / OMS) — Programa Regional de Bioética & Acelerador de Ensayos Clínicos.
