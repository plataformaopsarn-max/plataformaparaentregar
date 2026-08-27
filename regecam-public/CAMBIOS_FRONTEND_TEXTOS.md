# Registro Maestro de Cambios y Guía de Replicación para LLMs (OPS / OMS)

Este documento contiene la especificación completa y detallada de:
1. **Correcciones de estilo y terminología institucional en la versión en Español.**
2. **Arquitectura y desarrollo del espejo completo en Inglés (`/en/`).**
3. **Instrucciones paso a paso listas para proporcionar a un LLM** para replicar este trabajo en repositorios hermanos o derivados sin afectar la base de datos de Supabase.

---

# PARTE 1: Cambios en el Frontend en Español (`/index.html` y `/main.js`)

## 1.1. Unificación de Términos Institucionales en Preguntas (`QUESTIONS`)
Se definieron y aplicaron dos reglas estrictas de redacción:
- **ARN**: Siempre referida como `Autoridad Regulatoria Nacional (ARN)` (no "Reguladora", ni la sigla aislada "ARN").
- **CEI**: Siempre referido como `Comité de Ética de la Investigación (CEI)` (o en plural `Comités de Ética de la Investigación (CEI)`).

| Código | Pregunta Anterior | Pregunta Corregida |
| :--- | :--- | :--- |
| **1.1** | `¿Cuál es la Autoridad Reguladora Nacional (ARN) para ensayos clínicos?` | `¿Cuál es la Autoridad Regulatoria Nacional (ARN) para ensayos clínicos?` |
| **1.4** | `¿Se requiere la aprobación de un Comité de Ética en Investigación (CEI)?` | `¿Se requiere la aprobación de un Comité de Ética de la Investigación (CEI)?` |
| **1.5** | `¿La aprobación de un Comité de Ética en Investigación (CEI) debe ser previa a la presentación frente a la Autoridad Regulatoria?` | `¿La aprobación de un Comité de Ética de la Investigación (CEI) debe ser previa a la presentación frente a la Autoridad Regulatoria Nacional (ARN)?` |
| **1.6** | `¿Existe un sistema de acreditación de los CEI?` | `¿Existe un sistema de acreditación de los Comités de Ética de la Investigación (CEI)?` |
| **1.7** | `¿Existe un registro público de los CEI?` | `¿Existe un registro público de los Comités de Ética de la Investigación (CEI)?` |
| **1.8** | `¿Se establece qué tipo de investigaciones deben ser autorizadas por la ARN antes de su inicio?` | `¿Se establece qué tipo de investigaciones deben ser autorizadas por la Autoridad Regulatoria Nacional (ARN) antes de su inicio?` |
| **5.4** | `¿Se establece qué tipo de enmiendas al protocolo requieren aprobación previa de la ARN y/o del CEI?` | `¿Se establece qué tipo de enmiendas al protocolo requieren aprobación previa de la Autoridad Regulatoria Nacional (ARN) y/o del Comité de Ética de la Investigación (CEI)?` |

## 1.2. Actualización de Bajadas de Sección
- **Búsqueda por país**:
  > `"Seleccione un país en el mapa o use el buscador para acceder a su perfil regulatorio."`
- **Comparador**:
  > `"Vea la normativa por pregunta o requisito en los países que seleccione."`
- **Filtro avanzado**:
  > `"Identifique los países según preguntas o requisitos específicos."`

## 1.3. Sentence Case (Corrección de Mayúsculas en Títulos y Botones)
Se convirtieron todas las palabras intermedias a minúsculas:
- **Navegación / Header**: `Menú principal`, `Volver al menú principal`.
- **Selector de Idioma**: Toggle en el header `ES | EN` (enlace a `en/index.html`).
- **Tarjetas del Home**: `Búsqueda por país`, `Ir a búsqueda por país`, `Comparador`, `Ir al comparador →`, `Filtro avanzado`, `Ir a filtrar →`.
- **Detalle de País**: `Información general`, `Sitio web`, `Ver recursos`, `Acceder al recurso`, `Generar informe PDF`, `Ver fuente` / `Ocultar fuente`, `Informe automatizado - Marco general`.
- **Recursos (7.1 a 7.3)**: `Normativas clave de referencia rápida`, `Formularios oficiales`, `Guías, instructivos oficiales y web`.
- **Comparador**: `Por requisito`, `Por país`, `Requisito comparado`, `Informe comparativo por requisito`, `Informe comparativo por países`, `Comparativa de N países`, `Funcionalidad para tablets y computadoras (PC)`.
- **Formulario de Reportes**: `Nombre y apellido *`, `Correo electrónico *`, `País relacionado *`, `Comentario o sugerencia *`, `Documento adjunto (opcional - PDF máx. 5MB)`, `Enviar reporte`.

---

# PARTE 2: Espejo en Inglés (`/en/index.html` y `/en/main.js`)

## 2.1. Arquitectura y Conexión con Supabase en Inglés
- La versión en inglés reside en la subcarpeta `/en/`.
- **Estructura de Tablas en Supabase (`mugtfugfabhrqcomynrs`)**:
  - `faq_rows_corregido_en`: Contiene las respuestas narrativas (`_directa`, `_ampliada`, `_fuente`) traducidas al inglés para los países cargados (ej. Argentina piloto).
  - `enlaces_descripcion_en`: Contiene la columna `proposito_descripcion_en` vinculada por `id` a la tabla `enlaces`.
  - `resumen_ejecutivo`: Se consulta directamente de la tabla original ya que contiene datos factuales (autoridad, web, domicilio, etc.).
  - `faq_rows_corregido`: Se usa como respaldo (fallback) para los países que aún están en proceso de traducción.
- **DataCacheManager para EN (`en/main.js`)**:
  - Clave de caché local independiente: `plataforma_regulatoria_cache_en_v1.2` (evita colisiones con la versión en español).
  - En `fetchFreshData()`, se realiza la descarga en paralelo de las tablas en inglés y español, fusionando automáticamente las descripciones de enlaces (`proposito_descripcion_en`) y priorizando las filas de `faq_rows_corregido_en`.
- En `COUNTRIES_LIST` el atributo `name` **permanece con el valor en español** (ej. `"Brasil"`, `"México"`, `"República Dominicana"`), y se incorpora la propiedad `displayName` para la interfaz (ej. `"Brazil"`, `"Mexico"`, `"Dominican Republic"`).

```javascript
// Estructura en en/main.js
const COUNTRIES_LIST = [
    { id: 'AR', name: 'Argentina', displayName: 'Argentina', flagCode: 'ar', region: 'South America' },
    { id: 'BO', name: 'Bolivia', displayName: 'Bolivia', flagCode: 'bo', region: 'South America' },
    { id: 'BR', name: 'Brasil', displayName: 'Brazil', flagCode: 'br', region: 'South America' },
    { id: 'CL', name: 'Chile', displayName: 'Chile', flagCode: 'cl', region: 'South America' },
    { id: 'CO', name: 'Colombia', displayName: 'Colombia', flagCode: 'co', region: 'South America' },
    { id: 'CR', name: 'Costa Rica', displayName: 'Costa Rica', flagCode: 'cr', region: 'Central America' },
    { id: 'CU', name: 'Cuba', displayName: 'Cuba', flagCode: 'cu', region: 'Caribbean' },
    { id: 'EC', name: 'Ecuador', displayName: 'Ecuador', flagCode: 'ec', region: 'South America' },
    { id: 'SV', name: 'El Salvador', displayName: 'El Salvador', flagCode: 'sv', region: 'Central America' },
    { id: 'GT', name: 'Guatemala', displayName: 'Guatemala', flagCode: 'gt', region: 'Central America' },
    { id: 'HT', name: 'Haití', displayName: 'Haiti', flagCode: 'ht', region: 'Caribbean' },
    { id: 'HN', name: 'Honduras', displayName: 'Honduras', flagCode: 'hn', region: 'Central America' },
    { id: 'JM', name: 'Jamaica', displayName: 'Jamaica', flagCode: 'jm', region: 'Caribbean' },
    { id: 'MX', name: 'México', displayName: 'Mexico', flagCode: 'mx', region: 'North America' },
    { id: 'NI', name: 'Nicaragua', displayName: 'Nicaragua', flagCode: 'ni', region: 'Central America' },
    { id: 'PA', name: 'Panamá', displayName: 'Panama', flagCode: 'pa', region: 'Central America' },
    { id: 'PY', name: 'Paraguay', displayName: 'Paraguay', flagCode: 'py', region: 'South America' },
    { id: 'PE', name: 'Perú', displayName: 'Peru', flagCode: 'pe', region: 'South America' },
    { id: 'DO', name: 'República Dominicana', displayName: 'Dominican Republic', flagCode: 'do', region: 'Caribbean' },
    { id: 'TT', name: 'Trinidad y Tobago', displayName: 'Trinidad and Tobago', flagCode: 'tt', region: 'Caribbean' },
    { id: 'UY', name: 'Uruguay', displayName: 'Uruguay', flagCode: 'uy', region: 'South America' },
    { id: 'VE', name: 'Venezuela', displayName: 'Venezuela', flagCode: 've', region: 'South America' }
];
```

## 2.2. Diccionario de Categorías en Inglés (`CATEGORIES`)
```javascript
const CATEGORIES = [
    { id: 1, name: 'Authorities and general framework', icon: 'scale' },
    { id: 2, name: 'Sponsor roles and obligations', icon: 'briefcase' },
    { id: 3, name: 'Initial authorization of the clinical trial', icon: 'file-check' },
    { id: 4, name: 'Management of the investigational product (IP)', icon: 'flask-conical' },
    { id: 5, name: 'Conduct and closure of the trial', icon: 'activity' },
    { id: 6, name: 'Additional specific regulations', icon: 'scroll' },
    { id: 7, name: 'Practical resources (forms, guidelines and regulations)', icon: 'link' }
];
```

## 2.3. Diccionario de Recursos en Inglés (`RESOURCE_SUBTITLES`)
```javascript
const RESOURCE_SUBTITLES = {
    '7.1': { title: 'Key regulations for quick reference', icon: 'scroll-text' },
    '7.2': { title: 'Official forms', icon: 'file-text' },
    '7.3': { title: 'Guidelines, official instructions and web resources', icon: 'book-open' }
};
```

## 2.4. Diccionario Completo de Preguntas en Inglés (`QUESTIONS`)
```javascript
const QUESTIONS = {
    '1.1': 'What is the National Regulatory Authority (NRA) for clinical trials?',
    '1.2': 'What are the main regulations governing health research?',
    '1.3': 'What are the main regulations governing the authorization of clinical trials?',
    '1.4': 'Is the approval of a Research Ethics Committee (REC) required?',
    '1.5': 'Must the approval of a Research Ethics Committee (REC) be obtained prior to submission to the National Regulatory Authority (NRA)?',
    '1.6': 'Is there an accreditation system for Research Ethics Committees (RECs)?',
    '1.7': 'Is there a public registry of Research Ethics Committees (RECs)?',
    '1.8': 'Is it established which types of research must be authorized by the National Regulatory Authority (NRA) before commencement?',
    '2.1': 'Does the regulation define the sponsor of a clinical trial?',
    '2.2': 'Is the sponsor required to have a legal representative or a legal entity domiciled in the country?',
    '2.3': 'Are the requirements that the sponsor must meet to act as such established?',
    '2.4': 'Are the requirements that the sponsor must meet when acting through a Contract Research Organization (CRO) established?',
    '2.5': 'Are there specific requirements for the selection of research sites or units?',
    '2.6': 'Are there specific requirements for the selection of investigators?',
    '2.7': 'Are requirements regarding insurance and compensation for participants established?',
    '3.1': 'Is the essential content of the submission for initial authorization established?',
    '3.2': 'Is the submission process established (platform, format)?',
    '3.3': 'Are the official regulatory timelines for the review chronology defined?',
    '3.4': 'Must fees be paid for the evaluation of the trial?',
    '3.5': 'Is public registration of the clinical trial mandatory before commencement?',
    '3.6': 'Are there mechanisms for recognition of evaluations conducted by National Regulatory Authorities of other countries?',
    '3.7': 'What is the sequential order of steps that the sponsor, institution, and principal investigator must follow from the beginning of the process to authorization for study initiation?',
    '4.1': 'Are labeling requirements for the investigational product (IP) established?',
    '4.2': 'Is proof of Good Manufacturing Practices (GMP) required for the investigational product (IP)?',
    '4.3': 'Does trial approval include authorization to import/use the investigational product (IP)?',
    '5.1': 'Safety Reports: Are the requirements, channels, mechanisms, and timelines for reporting SAEs and SUSARs established?',
    '5.2': 'Is the submission of annual safety reports required?',
    '5.3': 'Is the submission of periodic follow-up reports required?',
    '5.4': 'Is it established which types of protocol amendments require prior approval from the National Regulatory Authority (NRA) and/or the Research Ethics Committee (REC)?',
    '5.5': 'Are there obligations regarding post-trial access to the research intervention?',
    '6.1': 'Is there a personal data protection law applicable to clinical trials?',
    '6.2': 'Are there specific regulations or guidelines for clinical trials with vaccines?',
    '6.3': 'Are there specific regulations or guidelines for the collection and/or use of samples for research?',
    '6.4': 'Clinical trials for specific situations: Are there specific regulations or guidelines for other types of clinical trials?'
};
```

## 2.5. Textos del Footer Institucional (`en/index.html`)
- **Title**: `Regulatory Information on Clinical Trials in Latin America and the Caribbean`
- **About / Acerca de**:
  - `About PAHO/WHO` -> `https://www.paho.org/en/who-we-are`
  - `Regional Bioethics Program` -> `https://www.paho.org/en/bioethics`
  - `Careers at PAHO` -> `https://www.paho.org/en/careers-paho`
  - `Internships` -> `https://www.paho.org/en/careers-paho/paho-internship-program-fostering-future-leaders-public-health`
- **Policies / Políticas**:
  - `Privacy notice` -> `https://www.paho.org/en/privacy-policy`
  - `Data protection policy` -> `https://www.paho.org/en/node/93183`
  - `Terms and conditions of use` -> `https://www.paho.org/en/terms-conditions-site-use`
  - `Doing business with PAHO` -> `https://www.paho.org/en/doing-business-paho`
  - `Alert — Scam attempts` -> `https://www.paho.org/en/alert-scam-attempts-name-pahowho`
- **Contact Us / Contáctenos**:
  - `General inquiries` -> `https://www.paho.org/en/inquiries`
  - `Report misconduct` -> `https://www.paho.org/en/report-misconduct`
  - `Suggest data update / Report` -> activa formulario interno `app.setView('report')`
- **Copyright**:
  - `Regional Office for the Americas of the World Health Organization`
  - `© Pan American Health Organization. All rights reserved.`

---

# PARTE 3: Prompt Maestro para Replicar este Trabajo con un LLM

Si necesitas replicar toda esta implementación en otro repositorio similar, puedes copiar y pegar el siguiente bloque como instrucción para cualquier LLM:

```text
Actúa como un Desarrollador Web Senior y replica la traducción y optimización de textos para la Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas (OPS/OMS).

Debes realizar dos tareas principales:

TAREA 1: Corregir textos y mayúsculas en Español (index.html y main.js)
1. Modifica QUESTIONS en main.js para asegurar:
   - 1.1: "¿Cuál es la Autoridad Regulatoria Nacional (ARN) para ensayos clínicos?"
   - 1.4: "¿Se requiere la aprobación de un Comité de Ética de la Investigación (CEI)?"
   - 1.5: "¿La aprobación de un Comité de Ética de la Investigación (CEI) debe ser previa a la presentación frente a la Autoridad Regulatoria Nacional (ARN)?"
   - 1.6: "¿Existe un sistema de acreditación de los Comités de Ética de la Investigación (CEI)?"
   - 1.7: "¿Existe un registro público de los Comités de Ética de la Investigación (CEI)?"
   - 1.8: "¿Se establece qué tipo de investigaciones deben ser autorizadas por la Autoridad Regulatoria Nacional (ARN) antes de su inicio?"
   - 5.4: "¿Se establece qué tipo de enmiendas al protocolo requieren aprobación previa de la Autoridad Regulatoria Nacional (ARN) y/o del Comité de Ética de la Investigación (CEI)?"
2. Actualiza las bajadas del Home:
   - Búsqueda por país: "Seleccione un país en el mapa o use el buscador para acceder a su perfil regulatorio."
   - Comparador: "Vea la normativa por pregunta o requisito en los países que seleccione."
   - Filtro avanzado: "Identifique los países según preguntas o requisitos específicos."
3. Aplica formato "Sentence case" a títulos, botones y subtítulos (ej: "Menú principal", "Búsqueda por país", "Filtro avanzado", "Generar informe PDF", "Ver fuente").
4. Añade un selector de idioma en el header de index.html:
   <div class="flex items-center gap-2 text-sm">
       <span class="text-blue-600 font-bold">ES</span>
       <span class="text-slate-300">|</span>
       <a href="en/index.html" class="text-slate-500 hover:text-blue-600 font-medium transition-colors">EN</a>
   </div>

TAREA 2: Crear el espejo completo en Inglés (en/index.html y en/main.js)
1. Crea la carpeta /en/ con index.html y main.js independientes.
2. IMPORTANTE PARA SUPABASE: No modifiques los nombres de tablas, columnas ni los valores 'name' en COUNTRIES_LIST (deben seguir siendo "Brasil", "México", etc. para coincidir con la base de datos). Agrega 'displayName' (ej. "Brazil", "Mexico") y úsalo solo al mostrar nombres en el HTML.
3. Traduce todas las CATEGORIES, QUESTIONS y RESOURCE_SUBTITLES al inglés técnico institucional (NRA, REC, IP, GMP, CRO, SUSAR).
4. Traduce todos los textos de la interfaz (Home, Search, Country Detail, Comparator, Filter, Report form, botones, headers de PDF y tooltips).
5. En en/index.html:
   - Ajusta rutas relativas: ../logos-header.png y ../config.js.
   - Traduce links y secciones del footer apuntando a paho.org/en/.
   - En el selector de idioma, destaca EN activo y link a ../index.html en ES.
6. Valida la sintaxis con 'node -c en/main.js' asegurando cero errores.
```
