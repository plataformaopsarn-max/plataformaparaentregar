# Plataforma de Información Regulatoria para Ensayos Clínicos en ALC

Plataforma web interactiva desarrollada por el **Programa Regional de Bioética de la Organización Panamericana de la Salud (OPS/OMS)** para facilitar el acceso a la información regulatoria sobre investigación clínica en América Latina y el Caribe.

🌐 **Acceso público:** [plataformaenproceso.pages.dev](https://plataformaenproceso.pages.dev)

---

## Descripción

Esta plataforma centraliza los requisitos regulatorios, institucionales y éticos necesarios para llevar a cabo ensayos clínicos en los países de la región. Está diseñada para ser consultada por investigadores, patrocinadores, comités de ética y organismos regulatorios de toda América Latina y el Caribe.

### Funcionalidades principales

- **Vista por país**: Ficha completa de requisitos regulatorios por país, con navegación por secciones temáticas y descarga en PDF.
- **Comparador multi-país**: Comparación lado a lado de hasta 3 países en cualquier categoría regulatoria.
- **Filtro temático**: Búsqueda y filtrado de países por tema o requisito específico.
- **Panel de administración**: Interfaz segura para que el equipo OPS gestione y actualice el contenido de la plataforma.
- **Formulario de sugerencias**: Canal para que los usuarios sugieran actualizaciones o correcciones de datos.

---

## Tecnologías

| Componente | Tecnología |
|------------|-----------|
| Frontend | HTML5, JavaScript (Vanilla), Tailwind CSS (CDN) |
| Base de datos | [Supabase](https://supabase.com) (PostgreSQL) |
| Iconos | [Lucide](https://lucide.dev) |
| Tipografía | [Inter](https://fonts.google.com/specimen/Inter) – Google Fonts |
| Banderas | [Flag Icons](https://flagicons.lipis.dev) |
| Hosting | GitHub Pages / Cloudflare Pages |
| Analítica | Google Analytics (GA4) |

---

## Estructura del proyecto

```
.
├── index.html              # Página principal (mapa, comparador, filtro)
├── main.js                 # Lógica completa del frontend
├── admin-dashboard.html    # Panel de administración de contenido
├── admin-login.html        # Autenticación del panel
├── admin.js                # Lógica del panel de administración
├── reportes.html           # Formulario de sugerencias de actualización
├── backup_tablas.js        # Script de backup automático de la base de datos
├── logos-header.png        # Logotipos OPS/OMS del encabezado
├── logo-final.png          # Logo de la plataforma
├── Logo2.png               # Logo adicional
├── TECHNICAL_DOCUMENTATION.md  # Documentación técnica detallada
└── .github/
    └── workflows/
        └── db-backup.yml   # GitHub Action: backup diario automático de Supabase
```

---

## Configuración y despliegue

### Variables de entorno (Supabase)

La plataforma se conecta a Supabase para leer y escribir datos. Las credenciales están declaradas en `main.js` y `admin.js`:

```js
const SUPABASE_URL = 'https://<proyecto>.supabase.co';
const SUPABASE_KEY = '<anon-key>';
```

> **Nota:** La clave utilizada es la `anon key` pública de Supabase, protegida por Row Level Security (RLS) en todas las tablas.

### Backup automático

El workflow `.github/workflows/db-backup.yml` realiza un respaldo diario de la base de datos. Para activarlo en un fork, configurar los siguientes **Secrets** en el repositorio:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### GitHub Pages

Para publicar en GitHub Pages:
1. Ir a **Settings → Pages**
2. Branch: `main`, carpeta: `/ (root)`
3. Guardar

---

## Países incluidos

Argentina · Bolivia · Brasil · Chile · Colombia · Costa Rica · Cuba · Ecuador · El Salvador · Guatemala · Guyana · Honduras · Jamaica · México · Nicaragua · Panamá · Paraguay · Perú · República Dominicana · Trinidad y Tobago · Uruguay · Venezuela

---

## Equipo y créditos

**Programa Regional de Bioética**  
Organización Panamericana de la Salud / Organización Mundial de la Salud  
[paho.org/es/bioetica](https://www.paho.org/es/bioetica)

---

© Organización Panamericana de la Salud. Todos los derechos reservados.
