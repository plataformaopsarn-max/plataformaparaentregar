# Documento de Especificación Técnica para Desarrolladores
## Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas (ReGeCAM - OPS/OMS)

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

El frontend público interactúa con la API REST de PostgreSQL expuesta por PostgREST en Supabase:

### A. Tabla `faq_rows_corregido` (Matriz Regulatoria Principal)
Contiene las respuestas regulatorias de los 22 países para las 38 preguntas divididas en 6 categorías procesales.
* `pais` (text, Primary Key / Index): Nombre oficial del país (ej. "Argentina", "México", "Honduras").
* `q_X_Y_directa` (text): Respuesta corta o resumen directo para la pregunta `X.Y` (ej. `q_1_1_directa`).
* `q_X_Y_ampliada` (text): Explicación detallada, excepciones y marco normativo para la pregunta `X.Y`.
* `q_X_Y_booleano` (boolean): Valor booleano (`true`/`false`) para preguntas de verificación binaria utilizadas en el **Filtro Avanzado**.
* `q_X_Y_fuente` (text): Cita bibliográfica o enlace oficial de la normativa aplicable.

### B. Tabla `resumen_ejecutivo` (Metadatos Institucionales)
Almacena la información institucional básica de la Autoridad Regulatoria Nacional (ARN) de cada país.
* `pais` (text, Unique): Nombre del país.
* `autoridad_regulatoria` (text): Nombre completo de la ARN (ej. "ANMAT", "COFEPRIS", "ARSA").
* `sitio_web_oficial` (text): URL del portal oficial de la autoridad.
* `correo_contacto` (text): Correo electrónico de contacto institucional.
* `domicilio` (text): Dirección física de la sede central.
* `fecha_compilacion` (text): Fecha de la última revisión normativa.

### C. Tabla `enlaces` (Recursos y Leyes Clave)
Almacena la biblioteca de normativas, leyes, formularios y guías rápidas.
* `pais` (text): País asociado.
* `question_code` (text): Código de agrupación (`7.1` = Normativas Clave, `7.2` = Formularios y Guías, `7.3` = Sitios de Interés).
* `titulo` (text): Nombre oficial de la norma o ley (ej. "Disposición ANMAT 7516/25").
* `enlace` (text): URL de descarga o consulta directa del documento PDF o portal.
* `proposito_descripcion` (text): Descripción breve del alcance de la norma.
* `peso` (numeric): Prioridad de ordenamiento visual.

### D. Tabla `reportes_usuarios` (Formulario In-App)
Almacena los comentarios, sugerencias y actualizaciones enviadas por los usuarios.
* `id` (bigint, Auto-increment): Identificador único del reporte.
* `created_at` (timestamp): Estampa de tiempo del envío.
* `nombre_apellido` (text): Nombre del remitente.
* `correo` (text): Correo de contacto del remitente.
* `pais` (text): País relacionado con la observación.
* `comentarios` (text): Descripción del comentario o sugerencia.
* `documento_adjunto_url` (text): URL del PDF adjunto almacenado en Supabase Storage (`bucket: reportes`).
* `procesado` (boolean, default: false): Estado de atención por el equipo de coordinación.

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

## 4. Guía de Despliegue en Cloudflare Pages / Workers

1. **Crear Proyecto en Cloudflare Pages**:
   - Conectar la cuenta de GitHub de la OPS.
   - Seleccionar la carpeta `/regecam-public` (o la raíz del repositorio transferido).
   - Comando de Build: Ninguno (sitio estático HTML/JS puro).
   - Directorio de Salida: `/`
2. **Configurar Variables de Entorno**:
   - En Cloudflare Pages ➔ **Settings** ➔ **Environment Variables**:
     - `ENV_SUPABASE_URL` = `https://<su-instancia>.supabase.co`
     - `ENV_SUPABASE_ANON_KEY` = `<su-anon-key>`
3. **Publicación Automática**:
   - Cada `git push` a la rama `main` compilará y desplegará la última versión en la CDN global de Cloudflare en menos de 5 segundos.
