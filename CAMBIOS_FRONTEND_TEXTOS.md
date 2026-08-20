# Registro de Cambios en Textos del Frontend (OPS / OMS)

Este documento detalla todas las modificaciones de redacción, corrección de mayúsculas (sentence case), ajuste de preguntas normativas y actualización de bajadas/descripciones aplicadas en la plataforma.

---

## 1. Ajuste de Preguntas Normativas (Diccionario `QUESTIONS` en `main.js`)

Se expandieron y unificaron los términos institucionales oficiales:
- **ARN**: Siempre referida como `Autoridad Regulatoria Nacional (ARN)`.
- **CEI**: Siempre referido como `Comité de Ética de la Investigación (CEI)` (o `Comités de Ética de la Investigación (CEI)` en plural).

| Código | Texto Anterior | Texto Nuevo Corregido |
| :--- | :--- | :--- |
| **1.1** | `¿Cuál es la Autoridad Reguladora Nacional (ARN) para ensayos clínicos?` | `¿Cuál es la Autoridad Regulatoria Nacional (ARN) para ensayos clínicos?` |
| **1.4** | `¿Se requiere la aprobación de un Comité de Ética en Investigación (CEI)?` | `¿Se requiere la aprobación de un Comité de Ética de la Investigación (CEI)?` |
| **1.5** | `¿La aprobación de un Comité de Ética en Investigación (CEI) debe ser previa a la presentación frente a la Autoridad Regulatoria?` | `¿La aprobación de un Comité de Ética de la Investigación (CEI) debe ser previa a la presentación frente a la Autoridad Regulatoria Nacional (ARN)?` |
| **1.6** | `¿Existe un sistema de acreditación de los CEI?` | `¿Existe un sistema de acreditación de los Comités de Ética de la Investigación (CEI)?` |
| **1.7** | `¿Existe un registro público de los CEI?` | `¿Existe un registro público de los Comités de Ética de la Investigación (CEI)?` |
| **1.8** | `¿Se establece qué tipo de investigaciones deben ser autorizadas por la ARN antes de su inicio?` | `¿Se establece qué tipo de investigaciones deben ser autorizadas por la Autoridad Regulatoria Nacional (ARN) antes de su inicio?` |
| **5.4** | `¿Se establece qué tipo de enmiendas al protocolo requieren aprobación previa de la ARN y/o del CEI?` | `¿Se establece qué tipo de enmiendas al protocolo requieren aprobación previa de la Autoridad Regulatoria Nacional (ARN) y/o del Comité de Ética de la Investigación (CEI)?` |

---

## 2. Actualización de Bajadas y Descripciones de Secciones

### A. Búsqueda por país
- **Anterior**: *"Consulte el perfil regulatorio completo de cada país. Seleccione un país en el mapa o use el buscador para acceder a toda su normativa de ensayos clínicos."*
- **Nuevo**: 
  > `"Seleccione un país en el mapa o use el buscador para acceder a su perfil regulatorio."`

### B. Comparador
- **Anterior**: *"Compare la normativa por requisito en los 22 países, o seleccione 2 a 3 países y vea todos sus requisitos lado a lado."* / *"Dos modos de comparación para analizar la normativa de la región."*
- **Nuevo**: 
  > `"Vea la normativa por pregunta o requisito en los países que seleccione."`

### C. Filtro avanzado
- **Anterior**: *"Identifique países que cumplen con todos los criterios seleccionados simultáneamente."*
- **Nuevo**: 
  > `"Identifique los países según preguntas o requisitos específicos."`

---

## 3. Corrección de Mayúsculas / Sentence Case (Títulos, Subtítulos y Botones)

Se unificó el estilo a minúsculas para palabras secundarias en títulos, botones y etiquetas:

### En `index.html`:
- `Menú Principal` ➔ `Menú principal`
- `title="Volver al Menú Principal"` ➔ `title="Volver al menú principal"`

### En `main.js`:
- **Tarjetas del Home**:
  - `Búsqueda por País` ➔ `Búsqueda por país`
  - `Ir a Búsqueda por País` ➔ `Ir a búsqueda por país`
  - `Ir al Comparador →` ➔ `Ir al comparador →`
  - `Filtro Avanzado` ➔ `Filtro avanzado`
  - `Ir a Filtrar →` ➔ `Ir a filtrar →`
- **Subtítulos de Recursos (`RESOURCE_SUBTITLES`)**:
  - `Normativas Clave de Referencia Rápida` ➔ `Normativas clave de referencia rápida`
  - `Formularios Oficiales` ➔ `Formularios oficiales`
  - `Guías, Instructivos Oficiales y Web` ➔ `Guías, instructivos oficiales y web`
- **Detalle de País**:
  - `Información General` ➔ `Información general`
  - `Sitio Web` ➔ `Sitio web`
  - `Ver Recursos` ➔ `Ver recursos`
  - `Acceder al Recurso` ➔ `Acceder al recurso`
  - `Generar Informe PDF` ➔ `Generar informe PDF`
  - `Ver Fuente` / `Ocultar Fuente` ➔ `Ver fuente` / `Ocultar fuente`
  - `Informe automatizado - Marco General` ➔ `Informe automatizado - Marco general`
- **Comparador**:
  - `Por Requisito` ➔ `Por requisito`
  - `Por País` ➔ `Por país`
  - `Requisito Comparado` ➔ `Requisito comparado`
  - `Informe Comparativo por Requisito` ➔ `Informe comparativo por requisito`
  - `Informe Comparativo por Países` ➔ `Informe comparativo por países`
  - `Comparativa de N Países` ➔ `Comparativa de N países`
  - `Funcionalidad para Tablets y Computadoras (PC)` ➔ `Funcionalidad para tablets y computadoras (PC)`
- **Filtro Avanzado**:
  - `Filtro Avanzado` ➔ `Filtro avanzado`
- **Formulario de Reportes**:
  - `Nombre y Apellido *` ➔ `Nombre y apellido *`
  - `Correo Electrónico *` ➔ `Correo electrónico *`
  - `País Relacionado *` ➔ `País relacionado *`
  - `Comentario o Sugerencia *` ➔ `Comentario o sugerencia *`
  - `Documento Adjunto (Opcional - PDF Máx. 5MB)` ➔ `Documento adjunto (opcional - PDF máx. 5MB)`
  - `Enviar Reporte` ➔ `Enviar reporte`

---

## 4. Archivos Modificados
1. `index.html`
2. `main.js`
3. `regecam-public/index.html`
4. `regecam-public/main.js`
