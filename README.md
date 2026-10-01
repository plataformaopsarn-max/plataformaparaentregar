# REGIA — Regulaciones para la Investigación en las Américas
### Plataforma de Información Regulatoria sobre Ensayos Clínicos | Organización Panamericana de la Salud (OPS / OMS) — Programa Regional de Bioética

Bienvenido al repositorio oficial del frontend público de **REGIA (Regulaciones para la Investigación en las Américas)**. Este proyecto contiene la interfaz interactiva para la consulta, comparación y filtrado en tiempo real del marco normativo y regulatorio sobre ensayos clínicos en 22 países de América Latina y el Caribe.

---

## 🚀 Vista General y Arquitectura

La plataforma está diseñada bajo una arquitectura moderna de cliente ligero (**Jamstack / Single-Page Application**) con soporte **bilingüe nativo (Español / Inglés)**, optimizada para ofrecer **máxima velocidad de respuesta**, **cero vulnerabilidades de exposición de credenciales** y **alta escalabilidad** mediante caché local inteligente y despliegue continuo (CI/CD).

### 🛠️ Tecnologías Principales:
* **Core Logic**: HTML5 + Vanilla JavaScript (ES6+ Modules)
* **Internacionalización (i18n)**: Versión en español en la raíz (`/`) y espejo completo en inglés en subcarpeta (`/en/`) con selector de idioma en header.
* **Estilos (CSS)**: Tailwind CSS compilado y minificado para producción (`styles.min.css`, 34 KB) + Font Inter (Google Fonts). Cero dependencias de CDN en tiempo de ejecución.
* **Iconografía & Banderas**: Lucide Icons + Flag Icons (CDN SVG).
* **Conectividad REST/API**: Supabase Client JS v2.
* **Gestión de Caché**: `DataCacheManager` en cliente con claves independientes por idioma (`regia_cache_es_v1.4` y `regia_cache_en_v1.4`) y TTL de 24h.
* **Analítica Web**: Google Analytics 4 (`G-L4BZ8GDMZ5`) adaptado a iframes cross-origin (`SameSite=None;Secure`) y registro de URLs virtuales de navegación SPA.
* **Seguridad de Base de Datos**: PostgreSQL con Row Level Security (RLS) activo y protección de datos sensibles.
* **Automatización CI/CD**: GitHub Actions para respaldo diario automático de datos y mantenimiento activo de la instancia de base de datos (Keep-Alive).

---

## 📁 Estructura del Repositorio Público

```
plataforma-publica/
├── index.html                  # Versión en Español: estructura responsiva y GA4 configurado
├── main.js                     # Controlador principal en Español (SPA, caché bilingüe, telemetría)
├── styles.min.css              # Hoja de estilos compilada y purgada de Tailwind CSS (34 KB)
├── reportes.html               # Formulario de reportes y retroalimentación de usuarios
├── en/                         # 🇺🇸 Espejo completo en Inglés
│   ├── index.html              # HTML en inglés (título, navegación, footer PAHO/EN, selector ES|EN)
│   └── main.js                 # Controlador en inglés (38 preguntas, conexión a tablas _en, SPA routes)
├── config.js                   # Módulo dinámico para abstracción de credenciales y variables de entorno
├── backup_tablas.js            # Script de volcado y respaldo diario de datos JSON
├── .github/workflows/
│   └── db-backup.yml           # Workflow diario de GitHub Actions (respaldo + keep-alive Supabase)
├── .env.example                # Plantilla de variables de entorno para integración continua (CI/CD)
├── CAMBIOS_FRONTEND_TEXTOS.md  # Registro maestro de cambios y guía de replicación para LLMs
├── TECHNICAL_SPECIFICATION.md  # Especificaciones técnicas completas de arquitectura, seguridad y APIs
├── logo-final.png              # Isotipo oficial de la plataforma
├── logos-header.png            # Banner institucional OPS / OMS / Programa Regional de Bioética
└── Logo2.png                   # Isotipo secundario institucional
```

---

## 🔐 Estándar de Seguridad y Abstracción de Credenciales

Este repositorio **NO contiene ninguna clave de API, contraseña ni secreto administrativo**.

### Configuración en Producción:
Las credenciales de acceso a la API REST (`ENV_SUPABASE_URL` y `ENV_SUPABASE_ANON_KEY`) se inyectan en tiempo de ejecución desde el servidor o la plataforma de hospedaje (ej. **Cloudflare Pages**, **Netlify**, **Vercel** o **GitHub Actions**).

1. Copie el archivo `.env.example` a `.env`:
   ```env
   ENV_SUPABASE_URL=https://<su-proyecto-supabase>.supabase.co
   ENV_SUPABASE_ANON_KEY=<su-clave-anon-publica>
   APP_VERSION=1.2.7
   ```
2. En el panel de su proveedor de hospedaje (ej. Cloudflare Pages ➔ Settings ➔ Environment Variables), agregue `ENV_SUPABASE_URL` y `ENV_SUPABASE_ANON_KEY`.
3. `config.js` leerá automáticamente las variables del entorno sin exponer nada en la base de código.

---

## 🛡️ Seguridad de Base de Datos y Políticas de Acceso (RLS)

La base de datos PostgreSQL en Supabase opera con **Row Level Security (RLS)** activado en todas las tablas para garantizar la integridad institucional y la privacidad:

1. **Protección de Reportes de Usuarios (`reportes_usuarios`)**:
   - **INSERT (Público / Anónimo)**: Permitido. Cualquier usuario puede enviar una sugerencia o actualización normativa desde el formulario.
   - **SELECT / UPDATE / DELETE**: **Restringido estrictamente a administradores autenticados**. Nadie con la clave pública anónima puede leer datos personales, nombres, correos o comentarios de otros usuarios.
2. **Matrices de Contenido y Tablas Oficiales**:
   - Tablas: `faq_rows_corregido`, `faq_rows_corregido_en`, `enlaces`, `enlaces_descripcion_en`, `resumen_ejecutivo`.
   - **SELECT (Público)**: Permitido para consultar la información normativa de los 22 países.
   - **INSERT / UPDATE / DELETE**: **Completamente bloqueado** para accesos anónimos. Solo el personal autorizado con credenciales administrativas puede modificar el contenido regulatorio.

---

## ⚡ Rendimiento y Protección del Servidor (`DataCacheManager`)

Para garantizar que la plataforma soporte miles de usuarios simultáneos en el portal de la OPS sin saturar los límites de la API REST o la base de datos:

1. **Carga Inicial Única (Batch Fetch)**: Al ingresar por primera vez, el módulo `DataCacheManager` realiza una consulta comprimida en lote para obtener la matriz regulatoria (~300 KB).
2. **Caché en Cliente Aislada por Idioma (TTL 24hs)**: La información se almacena en `localStorage` bajo claves independientes:
   - Español: `regia_cache_es_v1.4`
   - Inglés: `regia_cache_en_v1.4`
   Esto garantiza aislamiento total y previene que el navegador sirva textos en español al consultar la versión en inglés o viceversa.
3. **Navegación Instantánea con 0 Consultas HTTP**:
   - **Búsqueda por país**: 0 peticiones a la API.
   - **Filtros por requisitos**: 0 peticiones a la API.
   - **Comparativa multitabla**: 0 peticiones a la API.
   - **Perfiles de países**: 0 peticiones a la API.
   - **Resultado**: Reducción del **98%+** en la cuota de llamadas API al servidor.

---

## 📊 Telemetría y Analítica (Google Analytics 4 en Iframes)

La plataforma cuenta con integración para **Google Analytics 4** (`G-L4BZ8GDMZ5`) optimizada específicamente para funcionar dentro del `<iframe>` de la OPS (`paho.org`):

1. **Cookies Cross-Origin Seguras**:
   Se implementó `cookie_flags: 'SameSite=None;Secure'` en el snippet de inicialización de `gtag`, garantizando que navegadores con políticas estrictas de privacidad (Chrome Privacy Sandbox, Safari ITP) no bloqueen la cookie de sesión dentro del iframe.
2. **Virtual Pageviews en Navegación SPA**:
   Dado que REGIA no recarga la página al navegar entre pantallas, el controlador emite eventos virtuales `page_view` automáticos mediante `analytics.pageView(path, title)`. Esto permite visualizar en el panel de GA4 las métricas de:
   - `/` y `/en/` (Inicio / Home)
   - `/country/:pais` y `/en/country/:country` (Vistas por país)
   - `/compare` y `/en/compare` (Comparador normativo)
   - `/filter` y `/en/filter` (Buscador por criterios)
   - `/reportes` y `/en/report` (Formulario de reportes)

---

## 🖨️ Experiencia Móvil e Impresión de PDF en Iframes

Al visualizar la plataforma embebida dentro de un iframe en dispositivos móviles (iOS / Android):
- Ejecutar `window.print()` dentro de un iframe móvil hace que el navegador intente imprimir la página externa completa de la OPS.
- Para resolverlo, la plataforma detecta el entorno móvil embebido (`isMobileDevice && isEmbedded`) y abre una vista limpia de impresión en pestaña independiente (`window.open(..., '_blank')`).
- Esta vista incluye un banner flotante con acciones directas para **[ 🖨️ Imprimir / Guardar PDF ]** y **[ ✕ Volver ]**, manteniendo la sesión del usuario intacta en el portal principal de la OPS.

---

## 🔄 Recompilación de Estilos CSS (Tailwind)

Para mantener la velocidad de carga óptima, los estilos se encuentran precompilados y minificados en `styles.min.css`. Si a futuro se modifican clases de Tailwind en los archivos HTML o JavaScript, ejecute:

```bash
npx tailwindcss -o styles.min.css --minify
```

---

## 📖 Especificación Técnica Detallada

Para una explicación exhaustiva sobre la estructura de datos, el modelo de base de datos PostgreSQL, los métodos de renderizado y el comportamiento del observador de redimensionamiento embebido (`postMessage iframe`), consulte el archivo:

👉 **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)**

---

## 📄 Licencia y Derechos

Organización Panamericana de la Salud (OPS / OMS) &copy; Todos los derechos reservados. Programa Regional de Bioética & Acelerador de Ensayos Clínicos.
