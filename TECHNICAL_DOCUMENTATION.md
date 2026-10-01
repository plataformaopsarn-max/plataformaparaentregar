# Documento de Especificación Técnica para Desarrolladores
## REGIA — Regulaciones para la Investigación en las Américas (OPS/OMS)
### Plataforma de Información Regulatoria sobre Ensayos Clínicos

Este documento contiene las especificaciones técnicas internas de la arquitectura del software, patrones de diseño, diccionario del modelo de datos, flujo de control de estados y mecanismos de integración en embebidos (Iframe).

---

## 1. Patrón de Diseño y Controlador Principal (`main.js`)

El archivo `main.js` implementa un patrón **Single Page Application (SPA)** mediante un objeto global controlador `app` que gestiona el estado dinámico en memoria sin recargar la página.

### Estado Global (`app.state`):
```javascript
app.state = {
    view: 'home',                       // Vistas: 'home' | 'search' | 'country' | 'compare' | 'filter' | 'report'
    selectedCountry: 'Argentina',       // País actualmente seleccionado
    searchTerm: '',                     // Término de búsqueda activo
    filteredCountries: null,            // Lista de países filtrados
    filterCriteria: [],                 // Criterios booleanos activos en el filtro
    compareMode: 'requirement',         // Modo del comparador: 'requirement' | 'countries'
    selectedCountriesForCompare: []     // Países seleccionados para comparación lado a lado (máx. 3)
};
```

---

## 2. Modelo de Datos y Tablas en Supabase (PostgreSQL)

El frontend público interactúa con la API REST de PostgreSQL expuesta por PostgREST en Supabase (`mugtfugfabhrqcomynrs`):

### A. Tabla `faq_rows_corregido` (Matriz Regulatoria en Español)
Contiene las respuestas regulatorias de los 22 países para las 38 preguntas divididas en 6 categorías procesales.
* `pais` (text, Primary Key / Index): Nombre oficial del país (ej. "Argentina", "México", "Honduras").
* `q_X_Y_directa` (text): Respuesta corta o resumen directo en español para la pregunta `X.Y` (ej. `q_1_1_directa`).
* `q_X_Y_ampliada` (text): Explicación detallada, excepciones y marco normativo en español.
* `q_X_Y_booleano` (boolean): Valor booleano (`true`/`false`) para preguntas de verificación binaria utilizadas en el **Filtro Avanzado**.
* `q_X_Y_fuente` (text): Cita bibliográfica o enlace oficial de la normativa aplicable.

### B. Tabla `faq_rows_corregido_en` (Matriz Regulatoria en Inglés)
Espejo 1:1 de `faq_rows_corregido` con los textos traducidos al inglés técnico institucional.
* `pais` (text, Primary Key): Mismo valor exacto de país en español (mantiene integridad referencial).
* `q_X_Y_directa` (text): Respuesta directa en inglés.
* `q_X_Y_ampliada` (text): Explicación ampliada en inglés.
* `q_X_Y_fuente` (text): Cita de fuentes con conectores en inglés (*Article*, *Annex*, *Section*, *Recitals*) manteniendo los nombres oficiales de leyes sin traducir.
* `q_X_Y_booleano` (boolean): Idéntico valor lógico que la versión en español.

### C. Tabla `resumen_ejecutivo` (Metadatos Institucionales)
Almacena la información institucional básica de la Autoridad Regulatoria Nacional (ARN) de cada país (utilizada de forma compartida por ambas versiones lingüísticas).
* `pais` (text, Unique): Nombre del país.
* `autoridad_regulatoria` (text): Nombre completo de la ARN (ej. "ANMAT", "COFEPRIS", "ARSA").
* `sitio_web_oficial` (text): URL del portal oficial de la autoridad.
* `correo_contacto` (text): Correo electrónico de contacto institucional.
* `domicilio` (text): Dirección física de la sede central.
* `fecha_compilacion` (text): Fecha de la última revisión normativa.

### D. Tabla `enlaces` y `enlaces_descripcion_en` (Recursos y Leyes Clave)
* **`enlaces`**: Biblioteca base de normativas, leyes, formularios y guías rápidas.
  * `id` (bigint, PK): Identificador único del recurso.
  * `pais` (text): País asociado.
  * `question_code` (text): Código de agrupación (`7.1` = Normativas Clave, `7.2` = Formularios y Guías, `7.3` = Sitios de Interés).
  * `titulo` (text): Nombre oficial de la norma o ley (sin traducir por estándar legal).
  * `enlace` (text): URL oficial de consulta/descarga.
  * `proposito_descripcion` (text): Descripción breve en español.
  * `peso` (numeric): Prioridad de ordenamiento.
* **`enlaces_descripcion_en`**: Tabla de traducción 1:1 por ID.
  * `id` (bigint, PK / FK a `enlaces.id`): Identificador del enlace.
  * `proposito_descripcion_en` (text): Traducción al inglés del propósito/descripción de la norma.

### E. Tabla `reportes_usuarios` (Formulario In-App)
Almacena los comentarios, sugerencias y actualizaciones enviadas por los usuarios (tanto desde la versión ES como EN).
* `id` (bigint, Auto-increment): Identificador único del reporte.
* `created_at` (timestamp): Estampa de tiempo del envío.
* `nombre_apellido` (text): Nombre del remitente.
* `correo` (text): Correo de contacto del remitente.
* `pais` (text): País relacionado con la observación.
* `comentarios` (text): Descripción del comentario o sugerencia.
* `documento_adjunto_url` (text): URL del PDF adjunto almacenado en Supabase Storage (`bucket: reportes`).
* `procesado` (boolean, default: false): Estado de atención por el equipo de coordinación.

### F. Seguridad y Políticas de Acceso (Row Level Security - RLS)
Todas las tablas de la base de datos cuentan con RLS activado:
1. **`reportes_usuarios`**:
   - `INSERT`: Habilitado para roles `anon` y `authenticated` con verificación `WITH CHECK (true)` (cualquier usuario puede enviar un formulario).
   - `SELECT`: **Exclusivo para el rol `authenticated`**. Los usuarios no autenticados (`anon`) reciben `[]` (cero filas), protegiendo correos y datos personales de los remitentes.
2. **Tablas de Lectura Pública (`faq_rows_corregido`, `faq_rows_corregido_en`, `enlaces`, `enlaces_descripcion_en`, `resumen_ejecutivo`)**:
   - `SELECT`: Habilitado para roles `anon` y `authenticated` con `USING (true)`.
   - `INSERT / UPDATE / DELETE`: Denegado para `anon` (error `42501 - violates row-level security policy`). Las actualizaciones de contenido solo se pueden realizar mediante tokens autenticados del CMS o claves administrativas (`service_role`).

---

## 3. Integración Embebida (Iframe) y Auto-Resizing Protocol

La plataforma está optimizada para ser embebida mediante un `<iframe>` en portales institucionales de la OPS (Drupal, WordPress o páginas estáticas).

### Protocolo `postMessage` (`ops-platform`):

1. **Auto-Ajuste de Altura (`type: resize`)**:
   El controlador mide dinámicamente la altura real ocupada por el contenido (`scrollHeight`) y emite un mensaje al sitio contenedor para ajustar la altura del iframe sin generar barras de desplazamiento internas:
   ```javascript
   window.parent.postMessage({
       sentinel: 'ops-platform',
       type: 'resize',
       height: targetHeight
   }, '*');
   ```
   * **Optimización Anti-Titileo**: El emisor cuenta con *debouncing* de 100 ms y un umbral de cambio mínimo (>5px) para evitar bucles de redimensionamiento en pantallas móviles.

2. **Scroll Suave al Inicio (`type: scroll-top`)**:
   Al cambiar de sección o ingresar al formulario de reporte, se emite una orden para posicionar suavemente la vista en la parte superior del iframe:
   ```javascript
   window.parent.postMessage({
       sentinel: 'ops-platform',
       type: 'scroll-top'
   }, '*');
   ```

3. **Aislamiento de Impresión Móvil (`isMobileDevice && isEmbedded`)**:
   - En navegadores móviles (iOS Safari, Android Chrome), invocar `window.print()` dentro de un iframe embebido provoca que el navegador intente imprimir la ventana contenedora externa completa de la OPS.
   - Para resolver este problema, la función `printReport()` detecta el entorno móvil y abre una ventana emergente limpia e independiente (`window.open(redirectUrl, '_blank')`) cargando el reporte en modo aislado.
   - En modo aislado, se inyecta un encabezado institucional con dos botones de acción directa: **[ 🖨️ Imprimir / Guardar PDF ]** y **[ ✕ Volver ]**.

### Script Escuchador Estándar para el Sitio Contenedor (Padre):
```html
<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.sentinel === 'ops-platform') {
      var iframe = document.getElementById('ops-platform-iframe');
      if (e.data.type === 'resize' && iframe && e.data.height) {
        iframe.style.height = e.data.height + 'px';
      } else if (e.data.type === 'scroll-top' && iframe) {
        iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
</script>
```

---

## 4. Telemetría y Analítica (Google Analytics 4 en Iframes)

Medición configurada bajo la propiedad **`G-L4BZ8GDMZ5`**:

1. **Gestión de Cookies Cross-Origin (`SameSite=None;Secure`)**:
   Al residir la aplicación en un dominio diferente al portal oficial de la OPS (`plataforma.regia.ar` embebida en `paho.org`), las cookies de analítica requieren la directiva `SameSite=None;Secure` para evitar su bloqueo por navegadores con ITP o Privacy Sandbox:
   ```javascript
   gtag('config', 'G-L4BZ8GDMZ5', {
       cookie_flags: 'SameSite=None;Secure'
   });
   ```
2. **Mapeo de Rutas Virtuales en SPA (`analytics.pageView`)**:
   Dado que las transiciones de vista son manejadas dinámicamente en el cliente, el controlador despacha eventos virtuales `page_view` para registrar analíticas detalladas en GA4:
   - `analytics.pageView('/', 'REGIA - Inicio')` / `analytics.pageView('/en/', 'REGIA - Home')`
   - `analytics.pageView('/country/' + country, 'REGIA - ' + country)`
   - `analytics.pageView('/compare', 'REGIA - Comparador Normativo')`
   - `analytics.pageView('/filter', 'REGIA - Buscador de Criterios')`
   - `analytics.pageView('/reportes', 'REGIA - Reporte Normativo')`

---

## 5. Automatización de Backups y Mantenimiento de BD (`db-backup.yml`)

El repositorio incluye un flujo automatizado de integración continua en `.github/workflows/db-backup.yml`:

1. **Ejecución Programada (Cron)**: Se dispara diariamente a las 03:00 UTC (`cron: '0 3 * * *'`) y también bajo demanda (`workflow_dispatch`).
2. **Volcado JSON Seguro**: Ejecuta `node backup_tablas.js`, el cual consulta todas las tablas de Supabase y genera archivos JSON versionados dentro del directorio `backups/`.
3. **Keep-Alive de Instancia Supabase**: Las consultas periódicas realizadas por este workflow interactúan con la API REST de Supabase, evitando que la base de datos sea pausada automáticamente por inactividad.
4. **Compatibilidad Institucional con Políticas de GitHub**: El workflow utiliza comandos nativos del runner sin depender de dependencias externas no autorizadas en organizaciones corporativas con restricciones de Marketplace.

---

## 6. Compilación de Estilos (Tailwind CSS)

Para maximizar la puntuación en Google Lighthouse y eliminar peticiones bloqueantes:
- Se prescindió del script CDN de desarrollo en favor de un paquete estático minificado (`styles.min.css`, 34 KB).
- Comando para regenerar el paquete CSS tras modificaciones en el marcado:
  ```bash
  npx tailwindcss -o styles.min.css --minify
  ```

---

## 7. Guía de Despliegue en Cloudflare Pages / Hosting Estático

1. **Crear Proyecto en Cloudflare Pages**:
   - Conectar la cuenta de GitHub de la OPS.
   - Seleccionar la raíz del repositorio (`/`).
   - Comando de Build: Ninguno (sitio estático HTML/JS puro).
   - Directorio de Salida: `/`
2. **Configurar Variables de Entorno**:
   - En Cloudflare Pages ➔ **Settings** ➔ **Environment Variables**:
     - `ENV_SUPABASE_URL` = `https://<su-instancia>.supabase.co`
     - `ENV_SUPABASE_ANON_KEY` = `<su-anon-key>`
3. **Publicación Automática**:
   - Cada `git push` a la rama `main` compilará y desplegará la última versión en la CDN global de Cloudflare en menos de 5 segundos.
