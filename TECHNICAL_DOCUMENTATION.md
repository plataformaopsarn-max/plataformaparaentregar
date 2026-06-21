# Proyecto RegLac: Documentación Técnica y Guía para Desarrolladores

## 1. Visión General del Proyecto
**RegLac** es una plataforma web especializada diseñada para centralizar y estandarizar la información regulatoria de ensayos clínicos en **22 países** de América Latina y el Caribe (LAC). Funciona como una herramienta de apoyo a la toma de decisiones para investigadores, bioeticistas y patrocinadores, proporcionando una base de datos de normativas nacionales que permite búsquedas, comparaciones y filtrado avanzado.

### Objetivos Clave
- **Centralización**: Todas las normas regionales de ensayos clínicos en un solo portal.
- **Transparencia**: Acceso claro a fuentes oficiales y requisitos específicos.
- **Escalabilidad**: Diseñado para añadir fácilmente nuevos países o preguntas regulatorias.

---

## 2. Stack Tecnológico
El proyecto utiliza una arquitectura "Lean" para garantizar el máximo rendimiento y un mínimo costo de mantenimiento:

- **Frontend**: 
    - **Lenguaje**: Vanilla JavaScript (ES6+), HTML5, CSS3.
    - **Estilos**: CSS personalizado (Mobile-first, Responsivo).
    - **Iconos**: [FontAwesome 6.4](https://fontawesome.com/).
    - **Banderas**: [Flag-icons](https://github.com/lipis/flag-icons).
- **Backend-as-a-Service**: 
    - **Supabase**: Utilizado para el alojamiento de datos (PostgreSQL) y consultas en tiempo real mediante el SDK de JS.
- **Scripts de Utilidad**: 
    - **Python**: Procesamiento de datos y auditoría (`audit_processor_final.py`).
    - **JavaScript (Node)**: Validación de enlaces y pruebas automatizadas (`check_enlaces.js`).

---

## 3. Arquitectura y Flujo de Datos

### Base de Datos Relacional (Supabase)
La aplicación se apoya en tres tablas principales:
1.  **`faq_rows_corregido`**: 
    - Almacenamiento principal de respuestas regulatorias.
    - Las columnas siguen el patrón `q_[CÓDIGO]_[TIPO]`. 
    - Sufijos comunes: `_directa` (Respuesta corta), `_ampliada` (Información detallada), `_booleano` (Verdadero/Falso para filtros), `_fuente` (Citas/Referencias).
2.  **`resumen_ejecutivo`**: 
    - Metadatos de cada país (Autoridad Oficial, Sitio Web, Contacto, Dirección).
3.  **`enlaces`**: 
    - Repositorio de URLs oficiales vinculadas a regulaciones específicas o códigos de preguntas.

### Lógica de Obtención de Datos (`js/scripts.js`)
- El `supabaseClient` se inicializa mediante una `anonKey` y `supabaseUrl`.
- **Estrategia de Consulta**: Los datos se cargan bajo demanda cuando el usuario selecciona un país o requisito.
- **Vinculación Automática (Linkification)**: La función `linkifyText()` escanea el texto de la fuente regulatoria e inyecta dinámicamente etiquetas `<a>` para cualquier título de documento que coincida con la tabla de `enlaces`.

---

## 4. Estructura de Directorios
```text
├── css/                     # Hojas de estilo personalizadas
├── js/
│   ├── scripts.js           # Lógica central (Búsqueda, Renderizado, UI)
│   └── admin.js             # Lógica para el panel de administración
├── reportes/                # Logs, actualizaciones SQL y resultados de auditoría
├── pruebas-main 2/          # Archivos del entorno de pruebas/staging
├── index.html               # Punto de entrada (Landing Page)
├── admin-dashboard.html     # Interfaz de Administración
├── chatbot.html             # Interfaz experimental de chatbot
└── TECHNICAL_DOCUMENTATION.md # Este documento
```

---

## 5. Desarrollo y Configuración

### Requisitos Previos
- Una cuenta y proyecto en **Supabase**.
- **Claves de Entorno**: El `supabaseUrl` y la `supabaseAnonKey` deben estar correctamente configuradas en `js/scripts.js` (líneas 1-2).

### Ejecución Local
1. Clonar el repositorio.
2. Servir el directorio raíz usando cualquier servidor estático (ej: Live Server en VS Code o `python3 -m http.server`).
3. Asegurarse de tener conexión a Internet para realizar peticiones a la API de Supabase.

### Panel de Administración
Acceda a `admin-dashboard.html` para realizar operaciones CRUD sobre los datos regulatorios. Tenga en cuenta que las modificaciones aquí afectan directamente a la base de datos de producción.

---

## 6. Implementación de Funcionalidades Clave
- **Filtro Avanzado (`searchByFilter`)**: Utiliza consultas multiparamétricas `.eq()` para encontrar la intersección de países que cumplen requisitos específicos.
- **Comparación por Requisito (`searchByRequirement`)**: Obtiene columnas específicas de TODOS los países y genera una cuadrícula comparativa.
- **Navegación Lateral**: Generada automáticamente basándose en las constantes `categories` y `canonicalQuestions` definidas en `js/scripts.js`.

---

## 7. Guía de Contribución
1.  **Añadir una Pregunta**: Actualizar la constante `canonicalQuestions` en `js/scripts.js` y añadir las columnas correspondientes en la tabla de Supabase.
2.  **Estilos**: Todos los estilos se concentran en `css/styles.css`. Evitamos frameworks de utilidad (como Tailwind) para mantener el control estricto sobre el sistema de diseño.
3.  **Auditorías**: Antes de desplegar actualizaciones masivas de datos, ejecute `audit_processor_final.py` para verificar la consistencia y detección de patrones de IA.
