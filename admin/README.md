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
9. [Módulo de Copias de Seguridad y Puntos de Restauración (`#backups`)](#-módulo-de-copias-de-seguridad-y-puntos-de-restauración-backups)
10. [Despliegue y Configuración de Subdominio (`admin.regia.ar`)](#-despliegue-y-configuración-de-subdominio-adminregiaar)

---

## 🚀 Arquitectura y Tecnologías

El panel opera como una **Single-Page Application (SPA)** de arquitectura desacoplada y cliente ligero, conectada directamente a PostgreSQL en la nube vía Supabase:

* **Frontend**: HTML5 semántico + Vanilla JavaScript modular (ES6+ sin dependencias de compiladores pesados).
* **Enrutamiento**: Hash routing reactivo (`#dashboard`, `#editor`, `#translations`, `#resources`, `#audit`, `#users`, `#backups`).
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
├── api.js              # Capa de servicios REST: Supabase queries, auditoría, motor Gemini y backups
├── dashboard.js        # Vista principal: KPIs de sincronización, buscador y tarjetas interactivas de países
├── editor.js           # Editor bilingüe Side-by-Side con buscador predictivo y guardado flotante sticky
├── translations.js     # Cola editorial de sugerencias de traducción (aprobación, edición y descarte)
├── resources.js        # Gestor de enlaces normativos oficiales, decretos y fuentes por país
├── audit.js            # Centro de auditoría multi-criterio (5 agrupaciones), diff visual y exportador CSV
├── users.js            # Gestión integral de usuarios (RBAC): altas, bajas, roles y contraseñas
├── backups.js          # Módulo de Copias de Seguridad, Exportación y Puntos de Restauración (Disaster Recovery)
├── migration.sql       # Script SQL DDL para aprovisionar tablas, políticas RLS y funciones RPC en Supabase
└── regia-logo.png      # Isotipo y banner oficial institucional de REGIA
```

---

## 🔐 Autenticación y Control de Acceso (RBAC)

El acceso al panel administrativo está estructurado mediante tres perfiles con permisos claramente delimitados:

* **Mecanismo de Autenticación**: Validación con Supabase Auth (`client.auth.signInWithPassword({ email, password })`), con tokens JWT y resolución en la tabla `public.admin_profiles`.
* **Cierre de Sesión Seguro**: `client.auth.signOut()`, purgando credenciales y tokens de `localStorage`.
* **Perfiles y Matriz de Permisos**:
  1. **`administrador` (Administrador Total)**:
     - Control editorial absoluto: edición y guardado de respuestas directas, ampliadas y fuentes en Español e Inglés.
     - Aprobación, ajuste y descarte de sugerencias en la Cola de Traducción con IA.
     - Gestión completa de la biblioteca normativa y enlaces oficiales (Sección 7).
     - Acceso pleno al Centro de Control y Auditoría (las 5 agrupaciones, comparador de diffs palabra por palabra y exportación CSV/JSON).
     - Gestión y configuración de la API Key de Google Gemini.
  2. **`editor` (Editor de Contenido)**:
     - Edición bilingüe y guardado de fichas regulatorias de los 22 países.
     - Generación y revisión de traducciones asistidas por IA.
     - Gestión de enlaces y normativas oficiales.
     - **Restricción de Auditoría**: Por política de seguridad, **no puede ver el módulo de Auditoría** (el enlace se oculta del menú de navegación y cualquier intento de acceso directo a la ruta `#audit` es interceptado y bloqueado).
  3. **`lector` (Solo Lectura / Demostración)**:
     - Diseñado específicamente para exhibir y evaluar la plataforma por dentro ante evaluadores y autoridades.
     - Permite navegar y consultar el **Dashboard**, el **Editor Bilingüe Side-by-Side** (con las 38 preguntas y respuestas de cada país), la **Cola de Traducciones**, la **Biblioteca Normativa** y el **Centro de Auditoría con diff visual y exportación**.
     - **Garantía de Inmutabilidad**: Todas las áreas de texto e inputs están bloqueadas (`readonly`/`disabled`), y los botones de guardado, traducción y eliminación se encuentran deshabilitados u ocultos, impidiendo cualquier alteración accidental de la base de producción.
     - Cuenta con un botón de acceso directo en el login: *"Explorar en Modo Solo Lectura"*.

---

## 👥 Módulo de Gestión de Usuarios (`#users`)

Exclusivo para el rol `administrador`, este panel permite la administración completa del ciclo de vida de usuarios y credenciales directamente desde el navegador, sin necesidad de ingresar a la consola técnica de Supabase:

* **Métricas en Tiempo Real**: Tarjetas con conteo total de cuentas, administradores, editores y lectores.
* **Alta Inmediata de Usuarios**:
  - Creación de cuenta con Nombre Completo, Correo y Contraseña inicial.
  - Asignación de rol (`administrador`, `editor` o `lector`).
  - **Activación instantánea**: El usuario se registra con `email_confirmed_at = NOW()` a través de funciones PostgreSQL con privilegios `SECURITY DEFINER`, permitiéndole iniciar sesión de inmediato sin depender de correos de confirmación.
* **Modificación de Perfil y Permisos**:
  - Cambio dinámico de rol en cualquier momento.
  - Modificación de nombre descriptivo.
  - Suspensión temporal de accesos (conmutador *Activo / Desactivado*).
  - Restablecimiento directo de contraseña para soporte a usuarios del equipo.
* **Baja de Usuarios**: Eliminación sincronizada tanto del perfil administrativo (`public.admin_profiles`) como de la cuenta de autenticación (`auth.users`).
* **Filtros y Búsqueda Predictiva**: Búsqueda por texto (nombre/email) y segmentación por rol o estado de actividad.

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

El script `admin/migration.sql` aprovisiona las tablas administrativas, políticas RLS y funciones de gestión en Supabase:

* `admin_profiles`: Registro de usuarios autorizados y roles (`administrador`, `editor`, `lector`).
* `translation_queue`: Cola de tareas de traducción con estados (`pendiente`, `aprobado`, `descartado`, `editado`).
* `content_sync_status`: Estado de sincronización bilingüe por país y campo.
* `audit_log`: Registro inmutable de eventos de modificación con valor anterior, nuevo, fecha y autor.

### Funciones Almacenadas (RPC con `SECURITY DEFINER`)
Para posibilitar la gestión completa de usuarios desde el frontend sin requerir Service Role Keys expuestas en el cliente, la sección 6 de `migration.sql` instala 4 funciones RPC seguras:
* `admin_list_users()`: Retorna la lista consolidada de cuentas de `auth.users` combinada con sus roles en `admin_profiles`.
* `admin_create_user(new_email, new_password, new_nombre, new_rol)`: Crea el usuario en Supabase Auth con confirmación automática de correo (`email_confirmed_at = NOW()`) usando `pgcrypto` y crea su registro en `admin_profiles`.
* `admin_update_user(target_user_id, new_nombre, new_rol, new_activo, new_password)`: Modifica nombre, rol, activa/desactiva la cuenta o actualiza la contraseña de forma inmediata.
* `admin_delete_user(target_user_id)`: Elimina de forma atómica y segura el usuario en `admin_profiles` y en `auth.users`.

---

## 💾 Módulo de Copias de Seguridad y Puntos de Restauración (`#backups`)

Exclusivo para el rol `administrador`, este módulo provee una solución integral de **recuperación ante desastres (Disaster Recovery)** y reversión de contenidos directamente desde el navegador, salvaguardando la continuidad operativa del observatorio:

### 1. Respaldo Caliente Completo (Hot Full Export)
* Descarga inmediata de un paquete JSON consolidado con el estado en vivo de todas las tablas de Supabase:
  - `faq_rows_corregido` (38 preguntas regulatorias x 22 países en Español).
  - `faq_rows_corregido_en` (38 preguntas regulatorias x 22 países en Inglés).
  - `enlaces` y `enlaces_descripcion_en` (biblioteca normativa y decretos).
  - `resumen_ejecutivo` (fichas sinópticas por país).
* Genera archivos con nombre institucional estampado con fecha y hora (`regia-backup-YYYY-MM-DD-HHmm.json`).
* Permite también la exportación individual de cualquier tabla seleccionada.

### 2. Reversión Granular por País (Country Rollback)
* Si un editor introduce un error involuntario o una modificación no deseada en un país específico, el administrador puede revertir **únicamente ese país** a su versión base original de GitHub (`/backups/faq_rows_corregido.json` o `_en.json`).
* **Aislamiento total**: No sobreescribe ni altera a ninguno de los otros 21 países en producción.
* Permite seleccionar el idioma de destino (Español o Inglés).

### 3. Restauración de Tablas Base desde Repositorio GitHub
* Permite restaurar de forma completa cualquiera de las tablas oficiales a la versión base limpia almacenada en el repositorio (`/backups/`).
* Ideal para sincronizaciones maestras o restitución de entornos de prueba.

### 4. Restauración desde Archivo Local (`.json`)
* Zona de arrastrar y soltar (Drag & Drop) para cargar respaldos externos o históricos generados previamente.
* El sistema valida la integridad de la estructura antes de permitir cualquier operación.

### 5. Medidas de Seguridad Institucional y Prevención de Errores
* **Acceso Restringido**: Oculto y bloqueado para perfiles `editor` y `lector`.
* **Copia de Respaldo Automática Preventiva (Auto-Snapshot)**: Antes de aplicar cualquier restauración o rollback, el sistema genera automáticamente un respaldo en vivo del contenido que está a punto de ser reemplazado y lo descarga en el navegador del administrador.
* **Modal de Doble Confirmación con Palabra Clave**: Ninguna acción destructiva se ejecuta sin que el administrador escriba explícitamente la palabra `RESTAURAR` en el modal de advertencia.
* **Registro de Auditoría**: Toda operación de restauración o rollback queda registrada de forma inmutable en el historial con fecha, autor y detalle de registros impactados.

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
