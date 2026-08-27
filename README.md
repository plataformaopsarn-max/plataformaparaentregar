# Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas
### Organización Panamericana de la Salud (OPS / OMS) — Programa Regional de Bioética

Bienvenido al repositorio oficial del frontend público de la **Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas**. Este proyecto contiene la interfaz interactiva para la consulta, comparación y filtrado en tiempo real del marco normativo y regulatorio sobre ensayos clínicos en 22 países de América Latina y el Caribe.

---

## 🚀 Vista General y Arquitectura

La plataforma está diseñada bajo una arquitectura moderna de cliente ligero (**Jamstack / Single-Page Application**) con soporte **bilingüe nativo (Español / Inglés)**, optimizada para ofrecer **máxima velocidad de respuesta**, **cero vulnerabilidades de exposición de credenciales** y **alta escalabilidad** mediante caché local inteligente y despliegue continuo (CI/CD).

### 🛠️ Tecnologías Principales:
* **Core Logic**: HTML5 + Vanilla JavaScript (ES6+ Modules)
* **Internacionalización (i18n)**: Versión en español en la raíz (`/`) y espejo completo en inglés en subcarpeta (`/en/`) con selector de idioma en header.
* **Estilos (CSS)**: Tailwind CSS (Utility-First Design System) + Font Inter (Google Fonts)
* **Iconografía & Banderas**: Lucide Icons + Flag Icons (CDN SVG)
* **Conectividad REST/API**: Supabase Client JS v2
* **Gestión de Caché**: `DataCacheManager` en cliente (LocalStorage + Batch Pre-fetching con TTL de 24h)

---

## 📁 Estructura del Repositorio Público

```
plataforma-publica/
├── index.html                  # Versión en Español: estructura responsiva y meta-etiquetas SEO/Analytics
├── main.js                     # Controlador principal en Español (vistas, búsqueda, filtros, comparadores)
├── en/                         # 🇬🇧 Espejo completo en Inglés
│   ├── index.html              # HTML en inglés (título, navegación, footer PAHO/EN, selector ES|EN)
│   └── main.js                 # Controlador en inglés (categorías, 38 preguntas, conexión a tablas _en)
├── config.js                   # Módulo dinámico para abstracción de credenciales y variables de entorno
├── .env.example                # Plantilla de variables de entorno para integración continua (CI/CD)
├── CAMBIOS_FRONTEND_TEXTOS.md  # Registro maestro de cambios y guía de replicación para LLMs
├── TECHNICAL_SPECIFICATION.md  # Especificaciones técnicas completas del modelo de datos y APIs
├── logo-final.png              # Isotipo oficial de la plataforma
├── logos-header.png            # Banner institucional OPS / OMS / Programa Regional de Bioética
└── Logo2.png                   # Isotipo secundario institucional
```

---

## 🔐 Estándar de Seguridad y Abstracción de Credenciales

Este repositorio **NO contiene ninguna clave de API, contraseña ni secreto hardcodeado**.

### Configuración en Producción:
Las credenciales de acceso a la API REST (`ENV_SUPABASE_URL` y `ENV_SUPABASE_ANON_KEY`) se inyectan en tiempo de ejecución desde el servidor o la plataforma de hospedaje (ej. **Cloudflare Pages**, **Netlify**, **Vercel** o **GitHub Actions**).

1. Copie el archivo `.env.example` a `.env`:
   ```env
   ENV_SUPABASE_URL=https://<su-proyecto-supabase>.supabase.co
   ENV_SUPABASE_ANON_KEY=<su-clave-anon-publica>
   APP_VERSION=1.2.0
   ```
2. En el panel de su proveedor de hospedaje (ej. Cloudflare Pages ➔ Settings ➔ Environment Variables), agregue `ENV_SUPABASE_URL` y `ENV_SUPABASE_ANON_KEY`.
3. `config.js` leerá automáticamente las variables del entorno sin exponer nada en la base de código.

---

## ⚡ Rendimiento y Protección del Servidor (`DataCacheManager`)

Para garantizar que la plataforma pueda soportar miles de usuarios simultáneos en el portal de la OPS sin saturar los límites de la API REST o la base de datos:

1. **Carga Inicial Única (Batch Fetch)**: Al ingresar por primera vez, el módulo `DataCacheManager` realiza una consulta comprimida en lote para obtener la matriz regulatoria (~300 KB).
2. **Caché en Cliente (TTL 24hs)**: La información se almacena en `localStorage` bajo la clave `plataforma_regulatoria_cache_v1.2` con un tiempo de expiración de 24 horas.
3. **Navegación Instantánea con 0 Consultas HTTP**:
   - **Búsqueda por país**: 0 peticiones a la API.
   - **Filtros por requisitos**: 0 peticiones a la API.
   - **Comparativa multitabla**: 0 peticiones a la API.
   - **Perfiles de países**: 0 peticiones a la API.
   - **Resultado**: Reducción del **98%+** en la cuota de llamadas API al servidor.

---

## 📖 Especificación Técnica Detallada

Para una explicación exhaustiva sobre la estructura de datos, el modelo de base de datos PostgreSQL, los métodos de renderizado y el comportamiento del observador de redimensionamiento embebido (`postMessage iframe`), consulte el archivo:

👉 **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)**

---

## 📄 Licencia y Derechos

Organización Panamericana de la Salud (OPS / OMS) &copy; Todos los derechos reservados. Programa Regional de Bioética & Acelerador de Ensayos Clínicos.
