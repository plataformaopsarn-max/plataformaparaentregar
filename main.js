// --- CONFIGURACIÓN Y CONSTANTES ---

const SUPABASE_URL = atob('aHR0cHM6Ly9tdWd0ZnVnZmFiaHJxY29teW5ycy5zdXBhYmFzZS5jbw==');
const SUPABASE_KEY = atob('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW0xMVozUm1kV2RtWVdKb2NuRmpiMjE1Ym5Keklpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTnpBMk5UazBPRGNzSW1WNGNDSTZNakE0TmpJek5UUTROMzAuU05KSFRUT0hsSjJlN1RidndpZ2tUU1dOVWszelBGN2NSTlpZUDc0dldBSQ==');

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MAP_PATHS = {
    MX: "M100,50 L160,60 L180,90 L160,120 L130,110 L110,90 Z",
    GT: "M160,120 L175,125 L170,135 L160,130 Z",
    SV: "M170,135 L180,135 L175,140 Z",
    HN: "M175,125 L200,125 L195,135 L175,135 Z",
    NI: "M195,135 L210,140 L205,150 L190,140 Z",
    CR: "M205,150 L220,160 L215,165 L200,155 Z",
    PA: "M220,160 L250,165 L245,170 L215,165 Z",
    CU: "M220,80 Q250,60 280,90 Q250,110 220,80",
    JM: "M230,100 A10,10 0 1,0 250,100 A10,10 0 1,0 230,100",
    HT: "M260,95 L275,95 L275,110 L260,110 Z",
    DO: "M275,95 L295,100 L290,115 L275,110 Z",
    TT: "M320,135 A8,8 0 1,0 336,135 A8,8 0 1,0 320,135",
    CO: "M245,170 L280,170 L280,210 L240,200 Z",
    VE: "M280,170 L330,175 L320,200 L280,210 Z",
    EC: "M230,200 L250,200 L250,220 L230,215 Z",
    PE: "M250,220 L280,220 L290,280 L260,300 L240,250 Z",
    BR: "M330,175 L400,200 L420,300 L350,350 L320,300 L290,280 L280,210 L320,200 Z",
    BO: "M290,280 L320,300 L320,330 L290,320 Z",
    PY: "M320,300 L350,310 L340,350 L320,330 Z",
    CL: "M260,300 L290,320 L280,450 L260,430 Z",
    AR: "M290,320 L320,330 L340,350 L330,380 L300,460 L280,450 Z",
    UY: "M340,350 L360,355 L355,375 L330,365 Z"
};

const MAP_COORDS = {
    MX: { x: 130, y: 80 }, GT: { x: 160, y: 120 }, SV: { x: 170, y: 145 }, HN: { x: 190, y: 120 },
    NI: { x: 200, y: 145 }, CR: { x: 205, y: 165 }, PA: { x: 240, y: 175 }, CU: { x: 250, y: 85 },
    JM: { x: 240, y: 115 }, HT: { x: 265, y: 95 }, DO: { x: 290, y: 90 }, TT: { x: 345, y: 135 },
    CO: { x: 260, y: 190 }, VE: { x: 300, y: 180 }, EC: { x: 220, y: 210 }, PE: { x: 250, y: 260 },
    BR: { x: 360, y: 250 }, BO: { x: 300, y: 300 }, PY: { x: 335, y: 325 }, CL: { x: 255, y: 380 },
    AR: { x: 310, y: 400 }, UY: { x: 365, y: 365 }
};

const COUNTRIES_LIST = [
    { id: 'AR', name: 'Argentina', flagCode: 'ar', region: 'South America' },
    { id: 'BO', name: 'Bolivia', flagCode: 'bo', region: 'South America' },
    { id: 'BR', name: 'Brasil', flagCode: 'br', region: 'South America' },
    { id: 'CL', name: 'Chile', flagCode: 'cl', region: 'South America' },
    { id: 'CO', name: 'Colombia', flagCode: 'co', region: 'South America' },
    { id: 'CR', name: 'Costa Rica', flagCode: 'cr', region: 'Central America' },
    { id: 'CU', name: 'Cuba', flagCode: 'cu', region: 'Caribbean' },
    { id: 'EC', name: 'Ecuador', flagCode: 'ec', region: 'South America' },
    { id: 'SV', name: 'El Salvador', flagCode: 'sv', region: 'Central America' },
    { id: 'GT', name: 'Guatemala', flagCode: 'gt', region: 'Central America' },
    { id: 'HT', name: 'Haití', flagCode: 'ht', region: 'Caribbean' },
    { id: 'HN', name: 'Honduras', flagCode: 'hn', region: 'Central America' },
    { id: 'JM', name: 'Jamaica', flagCode: 'jm', region: 'Caribbean' },
    { id: 'MX', name: 'México', flagCode: 'mx', region: 'North America' },
    { id: 'NI', name: 'Nicaragua', flagCode: 'ni', region: 'Central America' },
    { id: 'PA', name: 'Panamá', flagCode: 'pa', region: 'Central America' },
    { id: 'PY', name: 'Paraguay', flagCode: 'py', region: 'South America' },
    { id: 'PE', name: 'Perú', flagCode: 'pe', region: 'South America' },
    { id: 'DO', name: 'República Dominicana', flagCode: 'do', region: 'Caribbean' },
    { id: 'TT', name: 'Trinidad y Tobago', flagCode: 'tt', region: 'Caribbean' },
    { id: 'UY', name: 'Uruguay', flagCode: 'uy', region: 'South America' },
    { id: 'VE', name: 'Venezuela', flagCode: 've', region: 'South America' },
];

const CATEGORIES = [
    { id: 1, name: 'Autoridades y marco general', icon: 'scale' },
    { id: 2, name: 'Rol y obligaciones del patrocinador', icon: 'briefcase' },
    { id: 3, name: 'Autorización inicial del ensayo clínico', icon: 'file-check' },
    { id: 4, name: 'Gestión del producto en investigación (PI)', icon: 'flask-conical' },
    { id: 5, name: 'Conducción y cierre del ensayo', icon: 'activity' },
    { id: 6, name: 'Regulaciones específicas adicionales', icon: 'scroll' },
    { id: 7, name: 'Recursos prácticos (formularios, guías y normativas)', icon: 'link' }
];

const QUESTIONS = {
    '1.1': '¿Cuál es la Autoridad Reguladora Nacional (ARN) para ensayos clínicos?',
    '1.2': '¿Cuáles son las normativas principales que rigen la investigación en salud?',
    '1.3': '¿Cuáles son las normativas principales que rigen la autorización de ensayos clínicos?',
    '1.4': '¿Se requiere la aprobación de un Comité de Ética en Investigación (CEI)?',
    '1.5': '¿La aprobación de un Comité de Ética en Investigación (CEI) debe ser previa a la presentación frente a la Autoridad Regulatoria?',
    '1.6': '¿Existe un sistema de acreditación de los CEI?',
    '1.7': '¿Existe un registro público de los CEI?',
    '1.8': '¿Se establece qué tipo de investigaciones deben ser autorizadas por la ARN antes de su inicio?',
    '2.1': '¿La normativa define al patrocinador de un ensayo clínico?',
    '2.2': '¿Se requiere que el patrocinador tenga un representante legal o una entidad jurídica domiciliada en el país?',
    '2.3': '¿Se establecen los requisitos que debe cumplir el patrocinador para poder actuar como tal?',
    '2.4': '¿Se establecen los requisitos que debe cumplir el patrocinador si se actúa a través de una Organización de Investigación por Contrato (OIC / CRO)?',
    '2.5': '¿Existen requisitos específicos para la selección de centros o unidades de investigación?',
    '2.6': '¿Existen requisitos específicos para la selección de investigadores?',
    '2.7': '¿Se establecen requisitos sobre seguros y compensación para los participantes?',
    '3.1': '¿Se establece cuál es el contenido esencial del envío para la autorización inicial?',
    '3.2': '¿Se establece cómo es el proceso de envío (plataforma, formato)?',
    '3.3': '¿Se definen cuáles son los plazos regulatorios oficiales para la cronología de la revisión?',
    '3.4': '¿Se deben pagar tasas (aranceles) por la evaluación del ensayo?',
    '3.5': '¿Es obligatorio el registro público del ensayo clínico antes de su inicio?',
    '3.6': '¿Existen mecanismos de reconocimiento de evaluaciones realizadas por Autoridades Regulatorias Nacionales de otros países?',
    '3.7': '¿Cuál es el orden secuencial de pasos que deben cumplir el patrocinador, la institución y el investigador principal desde el principio del proceso hasta la autorización para el inicio del estudio?',
    '4.1': '¿Se establecen requisitos de etiquetado para el producto de investigación (PI)?',
    '4.2': '¿Se requiere prueba de Buenas Prácticas de Manufactura (BPM/GMP) para el producto de investigación (PI)?',
    '4.3': '¿La aprobación del ensayo incluye la autorización para importar/usar el producto de investigación (PI)?',
    '5.1': 'Informes de Seguridad: ¿Se establecen cuáles son los requisitos, canales, mecanismos y plazos para notificar EAS y RASI/SUSARs?',
    '5.2': '¿Se requiere la presentación de informes anuales de seguridad?',
    '5.3': '¿Se requiere la presentación de informes de seguimiento periódicos?',
    '5.4': '¿Se establece qué tipo de enmiendas al protocolo requieren aprobación previa de la ARN y/o del CEI?',
    '5.5': '¿Existen obligaciones sobre el acceso post-estudio a la intervención en investigación?',
    '6.1': '¿Existe una ley de protección de datos personales aplicable a los ensayos clínicos?',
    '6.2': '¿Existen normativas o guías específicas para ensayos clínicos con vacunas?',
    '6.3': '¿Existen normativas o guías específicas para la recolección y/o utilización de muestras para investigación?',
    '6.4': 'Ensayos clínicos para situaciones específicas: ¿Existen normativas o guías específicas para otro tipo de ensayos clínicos?'
};

const NO_BOOLEAN_QUESTIONS = ['1.1', '1.2', '1.3', '3.7'];

const RESOURCE_SUBTITLES = {
    '7.1': { title: 'Normativas Clave de Referencia Rápida', icon: 'scroll-text' },
    '7.2': { title: 'Formularios Oficiales', icon: 'file-text' },
    '7.3': { title: 'Guías, Instructivos Oficiales y Web', icon: 'book-open' }
};

// --- ANALYTICS ---

const analytics = {
    // Helper base
    track: function (eventName, params = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    },

    // País consultado
    countryView: function (countryName, source = 'map') {
        this.track('country_view', {
            country_name: countryName,
            source: source // 'map' | 'search' | 'detail_search'
        });
    },

    // Sección del país consultada (sidebar o scroll)
    sectionView: function (countryName, sectionCode, sectionName) {
        this.track('section_view', {
            country_name: countryName,
            section_code: sectionCode,
            section_name: sectionName
        });
    },

    // Comparador ejecutado
    compareExecuted: function (questionId, questionText) {
        this.track('compare_executed', {
            question_id: questionId,
            question_text: questionText.substring(0, 100)
        });
    },

    // Filtro ejecutado
    filterExecuted: function (criteriaList, resultsCount) {
        this.track('filter_executed', {
            criteria_count: criteriaList.length,
            criteria_list: criteriaList.join(' | ').substring(0, 200),
            results_count: resultsCount
        });
    },

    // Enlace de recurso clickeado
    resourceLinkClicked: function (countryName, linkTitle, linkSection, linkUrl) {
        this.track('resource_link_click', {
            country_name: countryName,
            link_title: linkTitle,
            link_section: linkSection, // '7.1' | '7.2' | '7.3'
            link_url: linkUrl.substring(0, 200)
        });
    },

    // PDF generado
    pdfGenerated: function (countryName) {
        this.track('pdf_generated', {
            country_name: countryName
        });
    },

    // Búsqueda usada (al seleccionar resultado)
    searchUsed: function (searchTerm, selectedCountry) {
        this.track('search_used', {
            search_term: searchTerm,
            selected_country: selectedCountry
        });
    },

    // Herramienta abierta (comparar / filtrar)
    toolOpened: function (toolName) {
        this.track('tool_opened', {
            tool_name: toolName // 'compare' | 'filter'
        });
    }
};

window.analytics = analytics;

// --- APLICACIÓN PRINCIPAL (OBJETO GLOBAL) ---

const app = {
    state: {
        view: 'home',
        selectedCountry: null,
        searchTerm: '',
        comparisonResults: null,
        filteredCountries: null,
        filterCriteria: [],
        compareMode: 'requirement',
        selectedCountriesForCompare: []
    },

    init: function () {
        window.app = this; // Asegurar referencia global inmediata
        
        // Detectar si está embebido en un iframe
        const isEmbed = window.self !== window.top || new URLSearchParams(window.location.search).has('embed');
        if (isEmbed) {
            document.body.classList.add('is-embedded');
            const style = document.createElement('style');
            style.textContent = `
                header, footer { display: none !important; }
                body { background-color: transparent !important; }
                main { padding-top: 1rem !important; padding-bottom: 1rem !important; max-width: 100% !important; }
            `;
            document.head.appendChild(style);
        }

        // Cargar país y auto-imprimir si viene por parámetros de URL (workaround para sandbox)
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const countryParam = params.get('country');
        const compareModeParam = params.get('compareMode');
        const qParam = params.get('q');
        const cParam = params.get('c');
        const isPrintMode = params.get('print') === 'true';
        const referrerParam = params.get('referrer') || 'https://www.paho.org/es/regecam';

        if (viewParam) {
            this.state.view = viewParam;
        } else if (countryParam) {
            this.state.selectedCountry = countryParam;
            this.state.view = 'country';
        }

        if (compareModeParam) {
            this.state.compareMode = compareModeParam;
        }

        if (cParam && compareModeParam === 'countries') {
            this.state.selectedCountriesForCompare = cParam.split(',');
        }

        try {
            this.render();
            this.setupGlobalEvents();

            // Si viene en modo impresión, inyectar el banner y disparar la impresión
            if (isPrintMode) {
                if (this.state.view === 'country' && countryParam) {
                    this.handleAutoPrint(countryParam, referrerParam);
                } else if (this.state.view === 'compare') {
                    if (compareModeParam === 'requirement' && qParam) {
                        const select = document.getElementById('compare-select');
                        if (select) {
                            select.value = qParam;
                            this.executeCompare().then(() => {
                                lucide.createIcons();
                                this.handleAutoPrint(`Comparativa por Requisito (${qParam})`, referrerParam);
                            });
                        }
                    } else if (compareModeParam === 'countries' && cParam) {
                        this.executeCompareByCountries().then(() => {
                            lucide.createIcons();
                            this.handleAutoPrint(`Comparativa de Países (${cParam.replace(/,/g, ', ')})`, referrerParam);
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Critical Init Error:", error);
            const container = document.getElementById('app-container');
            if (container) {
                container.innerHTML = `<div class="p-10 bg-red-50 text-red-600 rounded-xl border border-red-200 text-center">
                    <h2 class="font-bold text-xl mb-2">Error de Inicialización</h2>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Cargar de nuevo</button>
                </div>`;
            }
        }
    },

    // Navegación
    setView: function (viewName) {
        this.state.view = viewName;
        if (viewName !== 'country') this.state.selectedCountry = null;
        
        // Limpiar impacto si no es home
        const impactContainer = document.getElementById('impact-section');
        if (impactContainer && viewName !== 'home') {
            impactContainer.innerHTML = '';
        }

        if (viewName === 'home') {
            this.state.searchTerm = '';
            this.state.filteredCountries = null;
        }
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    goHome: function () {
        this.setView('home');
    },

    focusSearch: function () {
        this.setView('home');
        const input = document.getElementById('home-search-input');
        if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    selectCountry: function (countryName, source = 'map') {
        this.state.selectedCountry = countryName;
        analytics.countryView(countryName, source);
        this.setView('country');
    },

    // UTILIDAD: Linkificación inteligente (Solo para el campo Fuente)
    linkifyText: function (text, links) {
        if (!text || !links || links.length === 0) return text;

        const sortedLinks = [...links].sort((a, b) => {
            const titleA = a.titulo || '';
            const titleB = b.titulo || '';
            return titleB.length - titleA.length;
        });

        let linkedText = text;

        sortedLinks.forEach(link => {
            if (link.titulo && link.enlace) {
                const escapedTitle = link.titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedTitle, 'gi');

                linkedText = linkedText.replace(regex, (match) => {
                    return `<a href="${link.enlace}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800" title="Ver normativa oficial">${match}</a>`;
                });
            }
        });

        return linkedText;
    },

    // --- RENDERIZADORES ---

    render: function () {
        const container = document.getElementById('app-container');


        switch (this.state.view) {
            case 'home':
                this.renderHome(container);
                break;
            case 'search':
                this.renderSearch(container);
                break;
            case 'country':
                this.renderCountryDetail(container);
                break;
            case 'compare':
                analytics.toolOpened('compare');
                this.renderComparisonTool(container);
                break;
            case 'filter':
                analytics.toolOpened('filter');
                this.renderFilterTool(container);
                break;
        }

        lucide.createIcons();

        // Si está embebido, notificar la altura al sitio padre para permitir auto-resizing opcional
        if (window.self !== window.top || new URLSearchParams(window.location.search).has('embed')) {
            setTimeout(() => {
                const height = document.documentElement.scrollHeight || document.body.scrollHeight;
                window.parent.postMessage({
                    sentinel: 'ops-platform',
                    type: 'resize',
                    height: height
                }, '*');
            }, 150); // Delay para asegurar renderizado de imágenes y DOM
        }
    },

    // VISTA: HOME
    // VISTA: HOME
    renderHome: function (container) {
        // Limpiar sección de impacto si existía
        const impactContainer = document.getElementById('impact-section');
        if (impactContainer) {
            impactContainer.innerHTML = '';
        }

        container.innerHTML = `
        <div class="max-w-5xl mx-auto py-12 animate-in fade-in duration-500">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card: Búsqueda por País -->
                <button onclick="app.setView('search')" class="group text-left bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-350 transition-all duration-300 cursor-pointer flex flex-col h-full">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform">
                        <i data-lucide="map" class="w-7 h-7 text-white"></i>
                    </div>
                    <h3 class="font-extrabold text-slate-800 text-xl tracking-tight mb-3">Búsqueda por País</h3>
                    <p class="text-sm text-slate-500 leading-relaxed">Consulte el perfil regulatorio completo de cada país. Seleccione un país en el mapa o use el buscador para acceder a toda su normativa de ensayos clínicos.</p>
                </button>
                <!-- Card: Comparar -->
                <button onclick="app.setView('compare')" class="group text-left bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-teal-350 transition-all duration-300 cursor-pointer flex flex-col h-full">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mb-6 shadow-lg shadow-teal-200/50 group-hover:scale-110 transition-transform">
                        <i data-lucide="scale" class="w-7 h-7 text-white"></i>
                    </div>
                    <h3 class="font-extrabold text-slate-800 text-xl tracking-tight mb-3">Comparador</h3>
                    <p class="text-sm text-slate-500 leading-relaxed">Compare la normativa por requisito en los 22 países, o seleccione 2 a 3 países y vea todos sus requisitos lado a lado.</p>
                </button>
                <!-- Card: Filtrar -->
                <button onclick="app.setView('filter')" class="group text-left bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-violet-350 transition-all duration-300 cursor-pointer flex flex-col h-full">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mb-6 shadow-lg shadow-violet-200/50 group-hover:scale-110 transition-transform">
                        <i data-lucide="filter" class="w-7 h-7 text-white"></i>
                    </div>
                    <h3 class="font-extrabold text-slate-800 text-xl tracking-tight mb-3">Filtro Avanzado</h3>
                    <p class="text-sm text-slate-500 leading-relaxed">Identifique países que cumplen con <strong>todos</strong> los criterios seleccionados simultáneamente.</p>
                </button>
            </div>
        </div>`;
    },

    // VISTA: BÚSQUEDA POR PAÍS (MAPA + BUSCADOR)
    renderSearch: function (container) {
        // Limpiar sección de impacto
        const impactContainer = document.getElementById('impact-section');
        if (impactContainer) {
            impactContainer.innerHTML = '';
        }

        let mapPathsHtml = '';
        for (const [id, pathData] of Object.entries(MAP_PATHS)) {
            const country = COUNTRIES_LIST.find(c => c.id === id);
            const coords = MAP_COORDS[id];
            if (country && coords) {
                mapPathsHtml += `
                <g class="group cursor-pointer" onclick="app.selectCountry('${country.name}')">
                    <path d="${pathData}" fill="#f8fafc" stroke="#94a3b8" stroke-width="1" class="map-path hover:fill-blue-500 hover:stroke-blue-700"></path>
                    <g class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <rect x="${coords.x - (country.name.length * 3.5)}" y="${coords.y - 20}" width="${country.name.length * 7 + 10}" height="20" rx="4" fill="rgba(15, 23, 42, 0.9)"></rect>
                        <text x="${coords.x}" y="${coords.y - 6}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${country.name}</text>
                    </g>
                </g>`;
            }
        }

        container.innerHTML = `
        <div class="animate-in fade-in duration-500">
            <button onclick="app.setView('home')" class="mb-6 text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
                <span>&larr;</span> Volver al inicio
            </button>
            <h2 class="text-3xl font-bold text-slate-800 mb-2 text-center">Búsqueda por País</h2>
            <p class="text-slate-700 mb-8 text-center text-base font-semibold max-w-2xl mx-auto leading-relaxed">Seleccione un país en el mapa o use el buscador para acceder a su perfil regulatorio.</p>
            
            <div class="text-center mb-10 max-w-3xl mx-auto">
                <div class="max-w-md mx-auto relative group z-20">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
                    </div>
                    <input 
                        type="text" 
                        id="home-search-input"
                        class="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-full bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                        placeholder="Buscar país (ej. Argentina, México)..."
                        value="${this.state.searchTerm}"
                        autocomplete="off"
                    >
                    <div id="search-results-dropdown" class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 hidden">
                    </div>
                </div>
            </div>

            <div class="mb-12">
                <div class="relative w-full max-w-2xl mx-auto h-[500px] md:h-[600px] bg-blue-50/50 rounded-3xl border border-blue-100 shadow-inner overflow-hidden flex items-center justify-center p-4">
                    <svg viewBox="0 0 500 500" class="w-full h-full drop-shadow-xl">
                        ${mapPathsHtml}
                    </svg>
                </div>
                <p class="text-[10px] text-slate-400 text-center mt-3 max-w-lg mx-auto leading-tight italic">
                    * El mapa tiene fines únicamente ilustrativos y no representa una escala geográfica exacta de los países y territorios.
                </p>
            </div>
        </div>`;

        const input = document.getElementById('home-search-input');
        if (input) {
            input.addEventListener('input', (e) => {
                this.state.searchTerm = e.target.value;
                this.updateSearchResults();
            });
        }
        
        this.updateSearchResults();
    },

    updateSearchResults: function () {
        let dropdown = document.getElementById('search-results-dropdown');
        if (!dropdown) {
            dropdown = document.getElementById('detail-search-results-dropdown');
        }
        if (!dropdown) return;

        const term = this.state.searchTerm.toLowerCase();

        if (!term) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }

        const results = COUNTRIES_LIST.filter(c => c.name.toLowerCase().includes(term));
        dropdown.classList.remove('hidden');

        if (results.length > 0) {
            const searchSource = document.getElementById('detail-search-input') ? 'detail_search' : 'search';
            dropdown.innerHTML = results.map(c => `
                <button onclick="analytics.searchUsed(app.state.searchTerm, '${c.name}'); app.selectCountry('${c.name}', '${searchSource}')" class="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0">
                    <span class="fi fi-${c.flagCode} shadow-sm rounded-sm"></span>
                    <span class="font-medium text-slate-700">${c.name}</span>
                </button>
            `).join('');
        } else {
            dropdown.innerHTML = '<div class="p-4 text-slate-400 text-sm text-center">No se encontraron resultados</div>';
        }
    },

    // VISTA: DETALLE PAÍS
    renderCountryDetail: async function (container) {
        const countryName = this.state.selectedCountry;

        container.innerHTML = `
            <div class="flex justify-center items-center h-96">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>`;

        try {
            // USAR TABLA faq_rows_corregido
            const [faqRes, summaryRes, linksRes] = await Promise.all([
                supabase.from('faq_rows_corregido').select('*').eq('pais', countryName).limit(1).single(),
                supabase.from('resumen_ejecutivo').select('*').eq('pais', countryName).single(),
                supabase.from('enlaces').select('*').eq('pais', countryName).order('question_code')
            ]);

            const faq = faqRes.data;
            const summary = summaryRes.data;
            const links = linksRes.data || [];

            if (!faq || !summary) {
                container.innerHTML = '<div class="text-center p-10 text-red-500">Datos no disponibles para este país.</div>';
                return;
            }

            const countryData = COUNTRIES_LIST.find(c => c.name === countryName);
            const flagCode = countryData ? countryData.flagCode : 'xx';

            // Generar HTML de Preguntas
            let questionsHtml = '';
            CATEGORIES.forEach(cat => {
                questionsHtml += `
                <div id="cat-${cat.id}" class="scroll-mt-24 mb-12">
                    <h3 class="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3 pb-2 border-b border-slate-200">
                        <i data-lucide="${cat.id === 7 ? 'link' : 'file-check'}" class="w-6 h-6 text-blue-600"></i>
                        ${cat.name}
                    </h3>`;

                if (cat.id === 7) {
                    // SECCIÓN 7: RECURSOS
                    if (links.length === 0) {
                        questionsHtml += `<div class="text-slate-500 italic p-4 bg-slate-50 rounded-lg">No hay recursos disponibles.</div>`;
                    } else {
                        questionsHtml += `<div class="space-y-8">`;
                        let addedAny = false;
                        ['7.1', '7.2', '7.3'].forEach(subCode => {
                            const subLinks = links.filter(l => {
                                const codeStr = String(l.question_code).trim();
                                return codeStr === subCode || codeStr === subCode.replace('.0', '');
                            });
                            
                            if (subCode === '7.1') {
                                subLinks.sort((a, b) => (Number(b.peso) || 0) - (Number(a.peso) || 0));
                            }

                            const htmlId = `question-${subCode.replace(/\./g, '-')}`;

                            if (subLinks.length > 0) {
                                addedAny = true;
                                const info = RESOURCE_SUBTITLES[subCode];
                                questionsHtml += `
                                <div id="${htmlId}" class="scroll-mt-28">
                                    <h4 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <i data-lucide="${info.icon}" class="w-5 h-5 text-teal-600"></i>
                                        ${info.title}
                                    </h4>
                                    <div class="grid grid-cols-1 gap-4">
                                        ${subLinks.map(link => `
                                            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                                <h5 class="font-bold text-blue-700 mb-2">${link.titulo}</h5>
                                                <p class="text-sm text-slate-600 mb-4">${link.proposito_descripcion || link.descripcion || ''}</p>
                                                <a href="${link.enlace}" target="_blank" rel="noopener noreferrer" onclick="analytics.resourceLinkClicked('${countryName}', '${link.titulo.replace(/'/g, '\\&apos;')}', '${subCode}', '${link.enlace}')" class="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                                                    Acceder al Recurso <i data-lucide="external-link" class="w-3 h-3"></i>
                                                </a>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>`;
                            }
                        });

                        if (!addedAny) {
                            questionsHtml += `
                            <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                                <p class="text-slate-500 italic mb-4">No se encontraron recursos categorizados como 7.1, 7.2 o 7.3 para este país.</p>
                                <div class="grid grid-cols-1 gap-3 text-left">
                                    ${links.map(link => `
                                        <div class="p-3 bg-white rounded border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <span class="text-[10px] font-mono bg-slate-100 px-1 rounded mr-2">${link.question_code}</span>
                                                <span class="text-sm font-medium">${link.titulo}</span>
                                            </div>
                                            <a href="${link.enlace}" target="_blank" class="text-blue-600"><i data-lucide="external-link" class="w-4 h-4"></i></a>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>`;
                        }
                        questionsHtml += `</div>`;
                    }
                } else {
                    // SECCIONES PREGUNTAS
                    questionsHtml += `<div class="space-y-6">`;
                    Object.entries(QUESTIONS)
                        .filter(([key]) => key.startsWith(`${cat.id}.`))
                        .map(([qId, qText]) => {
                            const dbKey = `q_${qId.replace(/\./g, '_')}`;
                            const htmlId = `question-${qId.replace(/\./g, '-')}`;

                            // TEXTOS ORIGINALES (Sin procesar para Directa y Ampliada)
                            const directAnswer = faq[`${dbKey}_directa`];
                            const extendedAnswer = faq[`${dbKey}_ampliada`];

                            // PROCESAMIENTO SOLO PARA LA FUENTE
                            const rawSource = faq[`${dbKey}_fuente`];
                            const cleanSource = rawSource ? this.linkifyText(rawSource, links) : '';

                            questionsHtml += `
                            <div id="${htmlId}" class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 scroll-mt-28">
                                <h4 class="font-bold text-slate-800 text-lg mb-4">${qId} - ${qText}</h4>
                                <div class="mb-4 text-sm text-slate-800 font-medium bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-500">
                                    ${directAnswer || "Información no disponible"}
                                </div>
                                ${extendedAnswer ? `<div class="mb-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">${extendedAnswer}</div>` : ''}
                                ${cleanSource ? `
                                    <div class="mt-4 pt-4 border-t border-slate-100">
                                        <button onclick="app.toggleSource('source-${qId.replace(/\./g, '-')}')" class="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors no-print">
                                            <i data-lucide="book-open" class="w-3 h-3"></i> Ver Fuente
                                        </button>
                                        <div id="source-${qId.replace(/\./g, '-')}" class="hidden print-visible mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500 font-mono whitespace-pre-wrap animate-in fade-in duration-200"><span class="font-bold mb-1 text-slate-700 hidden print:inline">Fuente:</span> ${cleanSource}</div>
                                    </div>` : ''}
                            </div>`;
                        });
                    questionsHtml += `</div>`;
                }
                questionsHtml += `</div>`;
            });

            // Layout
            container.innerHTML = `
            <div class="animate-in slide-in-from-bottom-4 duration-500 pb-20 relative">
                <!-- CABECERA EXCLUSIVA PARA IMPRESIÓN -->
                <div class="hidden print:block mb-10 text-center border-b-2 border-slate-300 pb-8">
                    <div class="flex justify-center mb-6">
                        <img src="logos-header.png" alt="OPS | OMS | Programa Regional de Bioética" class="h-14 sm:h-16 w-auto object-contain">
                    </div>
                    <div class="flex justify-center items-center gap-6 mb-4">
                        <span class="fi fi-${flagCode} text-5xl shadow-md rounded-sm" style="width: 1.5em; height: 1.125em;"></span>
                        <h1 class="text-4xl font-black text-slate-900 uppercase tracking-tight">${countryName}</h1>
                    </div>
                    <p class="text-slate-600 font-bold text-lg">Informe automatizado - Marco General</p>
                    <p class="text-sm text-slate-400 mt-2 italic">Información Regulatoria para Ensayos Clínicos en América Latina y el Caribe</p>
                    <div class="mt-4 text-xs text-slate-400">Fecha de generación: ${new Date().toLocaleDateString()}</div>
                </div>

                <div class="mb-8 no-print">
                    <!-- Buscador en el tope -->
                    <div class="mb-6 max-w-md mx-auto relative group z-20">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
                        </div>
                        <input 
                            type="text" 
                            id="detail-search-input"
                            class="block w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-full bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-sm"
                            placeholder="Buscar otro país..."
                            value=""
                            autocomplete="off"
                        >
                        <div id="detail-search-results-dropdown" class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 hidden">
                        </div>
                    </div>


                    
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
                        <div class="flex items-center gap-4">
                            <span class="fi fi-${flagCode} text-5xl rounded shadow-sm"></span>
                            <h2 class="text-4xl font-bold text-slate-900">${summary.pais}</h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="app.scrollToSection(7)" class="bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-100 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                Ver Recursos
                            </button>
                            <button onclick="app.printReport('${summary.pais}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all">
                                <i data-lucide="printer" class="w-4 h-4"></i> Generar Informe PDF
                            </button>
                        </div>
                    </div>

                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <!-- Sidebar Navigation -->
                    <div class="lg:col-span-1 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar pr-2">
                         <div class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                            <h3 class="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <i data-lucide="info" class="w-5 h-5"></i> Información General
                            </h3>
                            <div class="space-y-4 text-sm">
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide">Autoridad</strong><span class="text-slate-800 font-medium">${summary.autoridad_regulatoria}</span></div>
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide">Sitio Web</strong><a href="${summary.sitio_web_oficial}" target="_blank" class="text-blue-600 hover:underline break-words">${summary.sitio_web_oficial}</a></div>
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Contacto</strong><div class="flex items-start gap-2 text-slate-700 mb-1"><i data-lucide="mail" class="w-3 h-3 mt-1 text-slate-400"></i><span class="break-all">${summary.correo_contacto}</span></div></div>
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide">Domicilio</strong><div class="flex items-start gap-2 text-slate-700"><i data-lucide="map-pin" class="w-3 h-3 mt-1 text-slate-400"></i><span>${summary.domicilio}</span></div></div>
                                ${summary.fecha_compilacion ? `
                                <div class="pt-3 mt-1 border-t border-blue-100">
                                    <strong class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Última actualización</strong>
                                    <div class="flex items-center gap-2 text-slate-700">
                                        <i data-lucide="calendar-check" class="w-3 h-3 text-teal-500"></i>
                                        <span class="font-semibold text-teal-700">${summary.fecha_compilacion}</span>
                                    </div>
                                </div>` : ''}
                            </div>
                        </div>

                        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-2 no-print">
                            <h3 class="font-bold text-slate-800 px-4 py-3 text-sm border-b border-slate-50 mb-2">Navegación</h3>
                            ${CATEGORIES.map(cat => {
                let catQuestions = (cat.id === 7) ? Object.entries(RESOURCE_SUBTITLES).map(([k, v]) => [k, v.title]) : Object.entries(QUESTIONS).filter(([k]) => k.startsWith(`${cat.id}.`));
                const navId = `nav-cat-${cat.id}`;
                return `
                                <div class="nav-section bg-white rounded-lg border border-slate-100 overflow-hidden mb-2" id="${navId}-wrapper">
                                    <button
                                        onclick="app.toggleNavSection('${navId}', ${cat.id})"
                                        class="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700 select-none"
                                        aria-expanded="false"
                                        id="${navId}-btn"
                                    >
                                        <span class="flex items-center gap-2">
                                            <i data-lucide="${cat.id === 7 ? 'link' : (cat.icon || 'file-check')}" class="w-4 h-4 text-blue-500"></i>
                                            ${cat.name}
                                        </span>
                                        <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-200" id="${navId}-chevron"></i>
                                    </button>
                                    <div class="bg-slate-50 border-t border-slate-100 hidden" id="${navId}-panel">
                                        <button onclick="app.scrollToSection(${cat.id})" class="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:underline border-b border-slate-100">Ir al inicio de sección</button>
                                        ${catQuestions.map(([qId, qText]) => `
                                            <button onclick="app.handleQuestionClick('${countryName}', '${qId}', this)" class="w-full text-left px-6 py-3 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0 leading-normal pl-8">
                                                <span class="font-bold mr-1 text-blue-500">${qId}</span> ${qText}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>`;
            }).join('')}
                        </div>
                    </div>

                    <div class="lg:col-span-3 space-y-12">
                        ${questionsHtml}
                    </div>
                </div>
                <button id="scroll-top-btn" onclick="app.scrollToTop()" title="Volver al inicio" class="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 hover:scale-110 opacity-0 translate-y-10 pointer-events-none" style="transition: opacity 0.3s ease, transform 0.3s ease;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>
                    </svg>
                </button>
                <style>#scroll-top-btn{touch-action:manipulation;}</style>
            </div>`;

            const input = document.getElementById('detail-search-input');
            if (input) {
                input.addEventListener('input', (e) => {
                    this.state.searchTerm = e.target.value;
                    this.updateSearchResults();
                });
            }
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="text-red-500 text-center">Error cargando datos: ${error.message}</div>`;
        }
    },

    // VISTA: COMPARADOR
    renderComparisonTool: function (container) {
        const mode = this.state.compareMode;
        const selected = this.state.selectedCountriesForCompare;

        const countryPickerHtml = COUNTRIES_LIST.map(c => {
            const isSelected = selected.includes(c.name);
            return `<button onclick="app.selectCompareCountry('${c.name}')" class="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-md scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700'
            }">
                <span class="fi fi-${c.flagCode} rounded-sm shadow-sm"></span>
                ${c.name}
                ${isSelected ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            </button>`;
        }).join('');

        container.innerHTML = `
        <div class="animate-in fade-in pb-20">
            <button onclick="app.setView('home')" class="mb-6 text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 no-print">
                <span>&larr;</span> Volver al inicio
            </button>
            <h2 class="text-3xl font-bold text-slate-800 mb-2 no-print">Comparador Normativo</h2>
            <p class="text-slate-500 mb-6 no-print">Dos modos de comparación para analizar la normativa de la región.</p>

            <!-- TABS -->
            <div class="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-8 no-print">
                <button onclick="app.setCompareMode('requirement')" class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    mode === 'requirement' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }">
                    Por Requisito
                </button>
                <button onclick="app.setCompareMode('countries')" class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    mode === 'countries' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }">
                    Por País
                </button>
            </div>

            <!-- PANEL: POR REQUISITO -->
            <div id="panel-requirement" class="${mode === 'requirement' ? '' : 'hidden'}">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 max-w-3xl no-print">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Requisito a comparar</label>
                    <div class="flex gap-4 flex-col sm:flex-row">
                        <div class="relative flex-1">
                            <select id="compare-select" class="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 pr-8">
                                <option value="">Selecciona una pregunta...</option>
                                ${CATEGORIES.filter(c => c.id !== 7).map(cat => `
                                    <optgroup label="${cat.name}">
                                        ${Object.entries(QUESTIONS)
                                            .filter(([k]) => k.startsWith(`${cat.id}.`))
                                            .map(([k, v]) => `<option value="${k}">${k} - ${v}</option>`)
                                            .join('')}
                                    </optgroup>
                                `).join('')}
                            </select>
                            <div class="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                        </div>
                        <button onclick="app.executeCompare()" id="compare-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            Comparar
                        </button>
                    </div>
                </div>
                <div id="compare-requirement-print-header" class="print-only mb-6 border-b-2 border-slate-900 pb-4 hidden">
                    <h1 class="text-2xl font-black text-slate-900 uppercase">Informe Comparativo por Requisito</h1>
                    <p id="compare-requirement-print-title" class="text-base font-bold text-blue-800 mt-1"></p>
                    <div class="text-xs text-slate-500 mt-2">Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas | Fecha de generación: ${new Date().toLocaleDateString()}</div>
                </div>
                <div id="compare-selected-question" class="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl hidden animate-in fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Requisito Comparado</span>
                        <h3 id="compare-question-title" class="text-xl font-bold text-slate-800 mt-1"></h3>
                    </div>
                    <button onclick="app.printComparison('requirement')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all no-print shrink-0 cursor-pointer">
                        <i data-lucide="printer" class="w-4 h-4"></i> Generar Informe PDF
                    </button>
                </div>
                <div id="compare-results" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </div>

            <!-- PANEL: POR PAÍS -->
            <div id="panel-countries" class="${mode === 'countries' ? '' : 'hidden'}">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 no-print">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700">Seleccionar países a comparar</label>
                            <p class="text-xs text-slate-400 mt-0.5">Mínimo 2, máximo 3 países</p>
                        </div>
                        ${selected.length > 0 ? `<span class="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">${selected.length} seleccionado${selected.length > 1 ? 's' : ''}</span>` : ''}
                    </div>
                    <div class="flex flex-wrap gap-2 mb-6">${countryPickerHtml}</div>
                    <button onclick="app.executeCompareByCountries()" id="compare-countries-btn"
                        class="bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        ${selected.length < 2 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Comparar países
                    </button>
                </div>
                <div id="compare-countries-results"></div>
            </div>
        </div>`;
    },

    setCompareMode: function (mode) {
        this.state.compareMode = mode;
        this.state.selectedCountriesForCompare = [];
        const container = document.getElementById('app-container');
        this.renderComparisonTool(container);
        lucide.createIcons();
    },

    selectCompareCountry: function (name) {
        const idx = this.state.selectedCountriesForCompare.indexOf(name);
        if (idx > -1) {
            this.state.selectedCountriesForCompare.splice(idx, 1);
        } else {
            if (this.state.selectedCountriesForCompare.length >= 3) return;
            this.state.selectedCountriesForCompare.push(name);
        }
        const container = document.getElementById('app-container');
        this.renderComparisonTool(container);
        lucide.createIcons();
    },

    executeCompareByCountries: async function () {
        const selected = this.state.selectedCountriesForCompare;
        if (selected.length < 2) return;

        const btn = document.getElementById('compare-countries-btn');
        const resultsContainer = document.getElementById('compare-countries-results');
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Cargando...`;
        btn.disabled = true;
        resultsContainer.innerHTML = `<div class="flex justify-center py-16"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div></div>`;

        const { data, error } = await supabase
            .from('faq_rows_corregido')
            .select('*')
            .in('pais', selected);

        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Comparar países`;
        btn.disabled = selected.length < 2;

        if (!data || data.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center text-red-500 p-8">Error al cargar datos.</div>`;
            return;
        }

        // Ordenar data según el orden de selección
        const ordered = selected.map(name => data.find(r => r.pais === name)).filter(Boolean);
        const colCount = ordered.length;

        analytics.track('compare_by_countries', {
            countries: selected.join(' | '),
            count: colCount
        });

        // Construir tabla
        const flagsHeader = ordered.map(row => {
            const cd = COUNTRIES_LIST.find(c => c.name === row.pais);
            return `<th class="text-center p-4 bg-slate-50 border-b border-slate-200 min-w-[180px]">
                <div class="flex flex-col items-center gap-2">
                    <span class="fi fi-${cd?.flagCode} rounded shadow-sm" style="font-size:1.8em;"></span>
                    <span class="font-bold text-slate-800 text-sm">${row.pais}</span>
                </div>
            </th>`;
        }).join('');

        let tableBody = '';
        CATEGORIES.filter(cat => cat.id !== 7).forEach(cat => {
            const questions = Object.entries(QUESTIONS).filter(([k]) => k.startsWith(`${cat.id}.`));
            // Fila de categoría
            tableBody += `<tr>
                <td colspan="${colCount + 1}" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm px-5 py-3">
                    ${cat.name}
                </td>
            </tr>`;

            questions.forEach(([qId, qText]) => {
                const dbKey = `q_${qId.replace(/\./g, '_')}`;
                const hasBoolean = !NO_BOOLEAN_QUESTIONS.includes(qId);

                const cells = ordered.map(row => {
                    const direct = row[`${dbKey}_directa`] || '<span class="text-slate-400 italic">Sin información</span>';
                    const boolVal = row[`${dbKey}_booleano`];
                    const badge = hasBoolean && boolVal !== null && boolVal !== undefined
                        ? `<span class="inline-block mb-2 px-2 py-0.5 rounded text-xs font-bold ${boolVal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${boolVal ? 'SÍ' : 'NO'}</span>`
                        : '';
                    return `<td class="p-4 border-b border-slate-100 align-top text-xs text-slate-700 leading-relaxed">${badge}<div>${direct}</div></td>`;
                }).join('');

                tableBody += `<tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="p-4 border-b border-slate-100 align-top w-56 bg-white sticky left-0 shadow-[1px_0_0_0_#f1f5f9]">
                        <span class="inline-block font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mb-1">${qId}</span>
                        <p class="text-xs text-slate-600 leading-snug">${qText}</p>
                    </td>
                    ${cells}
                </tr>`;
            });
        });

        resultsContainer.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
                <div>
                    <h3 class="font-bold text-slate-800 text-base">Comparativa de ${colCount} Países</h3>
                    <p class="text-xs text-slate-500">${selected.join(' vs ')}</p>
                </div>
                <button onclick="app.printComparison('countries')" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-700 shadow-sm transition-all cursor-pointer">
                    <i data-lucide="printer" class="w-4 h-4"></i> Generar Informe PDF
                </button>
            </div>

            <div class="print-only mb-6 border-b-2 border-slate-900 pb-4">
                <h1 class="text-2xl font-black text-slate-900 uppercase">Informe Comparativo por Países</h1>
                <p class="text-base font-bold text-teal-800 mt-1">Países comparados: ${selected.join(', ')}</p>
                <div class="text-xs text-slate-500 mt-2">Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas | Fecha de generación: ${new Date().toLocaleDateString()}</div>
            </div>

            <div class="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th class="text-left p-4 bg-slate-50 border-b border-slate-200 sticky left-0 z-10 w-56">
                                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wide">Requisito</span>
                                </th>
                                ${flagsHeader}
                            </tr>
                        </thead>
                        <tbody>${tableBody}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
        lucide.createIcons();
    },

    executeCompare: async function () {
        const select = document.getElementById('compare-select');
        const resultsContainer = document.getElementById('compare-results');
        const btn = document.getElementById('compare-btn');
        const questionId = select.value;

        if (!questionId) return;

        btn.innerText = 'Cargando...';
        btn.disabled = true;

        const questionText = QUESTIONS[questionId];
        const titleContainer = document.getElementById('compare-selected-question');
        const titleElement = document.getElementById('compare-question-title');
        
        if (titleContainer && titleElement && questionText) {
            titleElement.textContent = `${questionId} - ${questionText}`;
            titleContainer.classList.remove('hidden');

            const printHeader = document.getElementById('compare-requirement-print-header');
            const printTitle = document.getElementById('compare-requirement-print-title');
            if (printHeader && printTitle) {
                printTitle.textContent = `${questionId} - ${questionText}`;
                printHeader.classList.remove('hidden');
            }
        }

        analytics.compareExecuted(questionId, questionText || '');

        const dbKey = `q_${questionId.replace(/\./g, '_')}`;
        const hasBoolean = !NO_BOOLEAN_QUESTIONS.includes(questionId);

        let selectQuery = `pais, ${dbKey}_directa, ${dbKey}_ampliada`;
        if (hasBoolean) selectQuery += `, ${dbKey}_booleano`;

        const { data, error } = await supabase.from('faq_rows_corregido').select(selectQuery).order('pais');

        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Comparar`;
        btn.disabled = false;

        if (data) {
            resultsContainer.innerHTML = data.map(item => {
                const direct = item[`${dbKey}_directa`];
                const extended = item[`${dbKey}_ampliada`];
                const booleanVal = item[`${dbKey}_booleano`];

                const countryData = COUNTRIES_LIST.find(c => c.name === item.pais);
                const flagCode = countryData ? countryData.flagCode : 'xx';

                return `
                <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col page-break break-inside-avoid">
                    <div class="flex justify-between items-start mb-4 border-b pb-3">
                        <h3 class="font-bold text-lg text-blue-800 flex items-center gap-2">
                            <span class="fi fi-${flagCode} rounded shadow-sm"></span>
                            ${item.pais}
                        </h3>
                        ${booleanVal !== undefined ? `
                            <span class="px-2 py-1 rounded text-xs font-bold ${booleanVal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                ${booleanVal ? 'SÍ' : 'NO'}
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-slate-800 font-medium text-sm mb-3 flex-grow">
                        ${direct || 'Sin información'}
                    </p>
                    ${extended ? `
                        <details class="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded cursor-pointer">
                            <summary class="font-bold text-blue-600 hover:text-blue-800 select-none">Ver detalle</summary>
                            <div class="mt-2 pt-2 border-t border-slate-200">${extended}</div>
                        </details>
                    ` : ''}
                </div>`;
            }).join('');
            lucide.createIcons();
        }
    },

    // VISTA: FILTRO
    renderFilterTool: function (container) {
        this.state.filterCriteria = [];
        let filtersHtml = '';
        CATEGORIES.filter(c => c.id !== 7).forEach(cat => {
            const boolQuestions = Object.entries(QUESTIONS).filter(([k]) => k.startsWith(`${cat.id}.`) && !NO_BOOLEAN_QUESTIONS.includes(k));
            if (boolQuestions.length > 0) {
                filtersHtml += `
                <details class="group">
                    <summary class="list-none flex justify-between items-center font-medium text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded">
                        <span class="text-sm">${cat.name}</span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform"></i>
                    </summary>
                    <div class="pl-2 mt-2 space-y-2 border-l-2 ml-2">
                        ${boolQuestions.map(([k, v]) => `
                            <label class="flex items-start gap-3 cursor-pointer p-1 hover:bg-blue-50 rounded">
                                <input type="checkbox" onchange="app.toggleFilter('${k}')" class="mt-1 rounded border-slate-300 text-blue-600">
                                <span class="text-xs text-slate-600 leading-tight">${k} - ${v}</span>
                            </label>
                        `).join('')}
                    </div>
                </details>`;
            }
        });

        container.innerHTML = `
        <div class="animate-in fade-in pb-20">
             <button onclick="app.setView('home')" class="mb-6 text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
                <span>&larr;</span> Volver al inicio
            </button>
            <h2 class="text-3xl font-bold text-slate-800 mb-2">Filtro Avanzado</h2>
            <p class="text-slate-500 mb-8 text-sm">Identifique países que cumplen con <strong>todos</strong> los criterios seleccionados simultáneamente.</p>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-1 bg-white rounded-2xl border p-6 h-fit max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4"><h3 class="font-bold">Criterios</h3></div>
                    <div class="space-y-4">${filtersHtml}</div>
                    <button onclick="app.executeFilter()" id="filter-btn" class="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50" disabled>Buscar Países (0)</button>
                </div>
                <div id="filter-results" class="lg:col-span-2">
                    <div class="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed text-slate-400">
                        <i data-lucide="filter" class="w-12 h-12 mb-4"></i>
                        <p>Selecciona criterios a la izquierda.</p>
                    </div>
                </div>
            </div>
        </div>`;
    },

    toggleFilter: function (qId) {
        const idx = this.state.filterCriteria.indexOf(qId);
        if (idx > -1) this.state.filterCriteria.splice(idx, 1);
        else this.state.filterCriteria.push(qId);
        const btn = document.getElementById('filter-btn');
        btn.innerText = `Buscar Países (${this.state.filterCriteria.length})`;
        btn.disabled = this.state.filterCriteria.length === 0;
    },

    executeFilter: async function () {
        const btn = document.getElementById('filter-btn');
        const container = document.getElementById('filter-results');
        btn.innerText = 'Cargando...';
        btn.disabled = true;

        // USAR faq_rows_corregido
        let query = supabase.from('faq_rows_corregido').select('pais');
        this.state.filterCriteria.forEach(criteria => {
            const dbKey = `q_${criteria.replace(/\./g, '_')}_booleano`;
            query = query.eq(dbKey, true);
        });

        const { data, error } = await query;
        btn.innerText = `Buscar Países (${this.state.filterCriteria.length})`;
        btn.disabled = false;

        if (data) {
            const countries = data.map(d => d.pais);
            analytics.filterExecuted(this.state.filterCriteria, countries.length);
            if (countries.length === 0) {
                container.innerHTML = `<div class="p-8 bg-amber-50 text-amber-700 rounded-xl border">No hay resultados que cumplan todos los requisitos.</div>`;
            } else {
                container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${countries.map(name => {
                    const cData = COUNTRIES_LIST.find(c => c.name === name);
                    return `<div onclick="app.selectCountry('${name}', 'filter')" class="bg-white p-6 rounded-xl border hover:shadow-lg cursor-pointer transition-all"><div class="flex items-center gap-4"><span class="fi fi-${cData?.flagCode}"></span><h4 class="font-bold">${name}</h4></div></div>`;
                }).join('')}</div>`;
                lucide.createIcons();
            }
        }
    },

    toggleSource: function (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.classList.toggle('hidden');
            const btn = el.previousElementSibling;
            if (btn) {
                const isHidden = el.classList.contains('hidden');
                btn.innerHTML = `<i data-lucide="book-open" class="w-3 h-3"></i> ${isHidden ? 'Ver Fuente' : 'Ocultar Fuente'}`;
                lucide.createIcons();
            }
        }
    },

    scrollToSection: function (catId) {
        const element = document.getElementById(`cat-${catId}`);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    },

    handleQuestionClick: function (countryName, qId, btnElement) {
        const qText = btnElement.textContent.trim().replace(/^\d+\.\d+\s+/, '');
        analytics.sectionView(countryName, qId, qText.substring(0, 80));
        this.scrollToQuestion(qId);
    },

    scrollToQuestion: function (qId) {
        const elementId = `question-${qId.replace(/\./g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) {
            const headerOffset = 90;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    },

    scrollToTop: function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    printReport: function (countryName) {
        console.log("printReport called for country:", countryName);
        const originalTitle = document.title;
        try {
            if (countryName) {
                document.title = `Informe_${countryName.replace(/\s+/g, '_')}`;
                console.log("Temporarily changed document title to:", document.title);
                try {
                    analytics.pdfGenerated(countryName);
                } catch (ae) {
                    console.error("Analytics tracking failed:", ae);
                }
            }
        } catch (titleError) {
            console.error("Failed to set title:", titleError);
        }

        // Medir el tiempo de ejecución de window.print()
        // Si el sandbox bloquea la impresión por falta de 'allow-modals',
        // la llamada retorna de inmediato (generalmente < 10ms).
        // Si funciona, bloquea la ejecución hasta que se cierre el diálogo (normalmente > 100ms).
        const start = Date.now();
        try {
            console.log("Invoking window.print()...");
            window.print();
        } catch (printError) {
            console.error("Failed to invoke window.print():", printError);
        }
        const delta = Date.now() - start;
        console.log(`window.print() execution took ${delta}ms`);

        const isEmbedded = window.self !== window.top || new URLSearchParams(window.location.search).has('embed');
        
        // Si se ejecutó en menos de 50ms y estamos embebidos, probablemente el sandbox lo bloqueó.
        // Aplicamos el fallback de redirección.
        if (delta < 50 && isEmbedded) {
            console.warn("Print was likely blocked by sandbox. Triggering redirection fallback...");
            const currentUrl = window.location.href.split('?')[0]; // URL limpia sin parámetros anteriores
            const redirectUrl = `${currentUrl}?country=${encodeURIComponent(countryName)}&print=true`;
            
            try {
                // Redirigir la ventana padre completa
                window.top.location.href = redirectUrl;
            } catch (err) {
                console.error("Failed to redirect window.top:", err);
                // Si la redirección falla (por ejemplo por políticas de seguridad estrictas), intentamos abrir en pestaña nueva
                window.open(redirectUrl, '_blank');
            }
        }

        setTimeout(() => {
            try {
                document.title = originalTitle;
                console.log("Restored document title to:", originalTitle);
            } catch (restoreError) {
                console.error("Failed to restore title:", restoreError);
            }
        }, 1000);
    },

    // Manejador del modo auto-impresión (workaround para sandbox)
    printComparison: function (mode) {
        console.log("printComparison called for mode:", mode);

        let paramStr = '';
        if (mode === 'requirement') {
            const select = document.getElementById('compare-select');
            const qId = select ? select.value : '';
            if (!qId) return;
            paramStr = `compareMode=requirement&q=${encodeURIComponent(qId)}`;
        } else if (mode === 'countries') {
            const selected = this.state.selectedCountriesForCompare;
            if (!selected || selected.length < 2) return;
            paramStr = `compareMode=countries&c=${encodeURIComponent(selected.join(','))}`;
        }

        // Si es comparación por países, forzar orientación horizontal (landscape) para evitar recortes
        if (mode === 'countries') {
            let landscapeStyle = document.getElementById('dynamic-print-orientation');
            if (!landscapeStyle) {
                landscapeStyle = document.createElement('style');
                landscapeStyle.id = 'dynamic-print-orientation';
                landscapeStyle.textContent = `@page { size: landscape; margin: 1cm; }`;
                document.head.appendChild(landscapeStyle);
            }
        }

        const originalTitle = document.title;
        try {
            const modeLabel = mode === 'requirement' ? 'Requisito' : 'Paises';
            document.title = `Informe_Comparativo_${modeLabel}`;
        } catch (e) {}

        const start = Date.now();
        try {
            console.log("Invoking window.print()...");
            window.print();
        } catch (printError) {
            console.error("Failed to invoke window.print():", printError);
        }
        const delta = Date.now() - start;

        const isEmbedded = window.self !== window.top || new URLSearchParams(window.location.search).has('embed');
        
        if (delta < 50 && isEmbedded) {
            console.warn("Print was likely blocked by sandbox. Triggering redirection fallback...");
            const currentUrl = window.location.href.split('?')[0];
            const redirectUrl = `${currentUrl}?view=compare&${paramStr}&print=true`;
            
            try {
                window.top.location.href = redirectUrl;
            } catch (err) {
                console.error("Failed to redirect window.top:", err);
                window.open(redirectUrl, '_blank');
            }
        }

        setTimeout(() => {
            try {
                document.title = originalTitle;
                const landscapeStyle = document.getElementById('dynamic-print-orientation');
                if (landscapeStyle) landscapeStyle.remove();
            } catch (e) {}
        }, 1500);
    },

    handleAutoPrint: function (countryName, referrerUrl, isLandscape = false) {
        console.log("Auto-print mode triggered for:", countryName);
        
        const forceLandscape = isLandscape || (countryName && countryName.includes('Comparativa de Países'));

        // 1. Ocultar el header, nav y footer propios de la plataforma en pantalla para dejar la vista limpia
        const style = document.createElement('style');
        style.id = 'print-mode-styles';
        style.textContent = `
            header, footer, nav { display: none !important; }
            main { padding-top: 2rem !important; }
            ${forceLandscape ? '@page { size: landscape; margin: 1cm; }' : ''}
        `;
        document.head.appendChild(style);
        
        // 2. Inyectar banner de retorno al tope del body (oculto al imprimir)
        if (!document.getElementById('print-mode-banner')) {
            const banner = document.createElement('div');
            banner.id = 'print-mode-banner';
            banner.className = 'no-print bg-slate-900 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md';
            banner.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="relative flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <span class="text-sm font-semibold">Modo de Impresión: Generando PDF para ${countryName}...</span>
                </div>
                <button onclick="window.location.href='https://www.paho.org/es/regecam'" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow pointer-events-auto"
                        style="cursor: pointer;">
                    &larr; volver a Regecam
                </button>
            `;
            document.body.insertBefore(banner, document.body.firstChild);
        }

        // 3. Cambiar temporalmente el título del documento para el nombre del PDF
        const originalTitle = document.title;
        try {
            document.title = `Informe_${countryName.replace(/\s+/g, '_')}`;
        } catch (e) {
            console.error("Failed to set print title:", e);
        }

        // 4. Disparar impresión nativa después de que se cargue el DOM y Lucide icons
        setTimeout(() => {
            try {
                window.print();
            } catch (err) {
                console.error("Auto print failed:", err);
            }
            
            // Restaurar título del documento después de abrir el diálogo
            setTimeout(() => {
                try {
                    document.title = originalTitle;
                } catch (e) {}
            }, 1000);
        }, 1000);
    },

    setupGlobalEvents: function () {
        // Eventos que no dependan del renderizado inicial
        let scrollTopVisible = false;
        window.addEventListener('scroll', () => {
            const btn = document.getElementById('scroll-top-btn');
            if (!btn) return;
            const shouldShow = window.scrollY > 500;
            if (shouldShow && !scrollTopVisible) {
                scrollTopVisible = true;
                btn.classList.remove('opacity-0', 'translate-y-10');
                // Separar pointer-events del fade para que el primer tap siempre funcione
                setTimeout(() => btn.classList.remove('pointer-events-none'), 350);
            } else if (!shouldShow && scrollTopVisible) {
                scrollTopVisible = false;
                btn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
            }
        });
    },

    toggleNavSection: function (navId, catId) {
        const panel  = document.getElementById(`${navId}-panel`);
        const btn    = document.getElementById(`${navId}-btn`);
        const chevron = document.getElementById(`${navId}-chevron`);
        if (!panel) return;
        const isOpen = !panel.classList.contains('hidden');
        if (isOpen) {
            panel.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
            chevron.style.transform = '';
        } else {
            panel.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
            chevron.style.transform = 'rotate(180deg)';
            // Scroll a la sección automáticamente al abrir (en mobile)
            if (window.innerWidth < 1024) {
                setTimeout(() => this.scrollToSection(catId), 50);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
