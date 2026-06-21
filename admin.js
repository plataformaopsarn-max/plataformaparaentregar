// admin.js - Paginación, Filtros por País y Edición Avanzada

const SUPABASE_URL = 'https://rhbudrqpetrzispcacyw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYnVkcnFwZXRyemlzcGNhY3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODI4NTQsImV4cCI6MjA3NDE1ODg1NH0.6uQ2Hg1aLHAQoG3HwxJBeBbrFRGRxUilH-60CRNl3J8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIG Y DICCIONARIOS ---
const ITEMS_PER_PAGE = 50; // Cantidad de filas por página

const COUNTRIES_LIST = [
    "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", 
    "Ecuador", "El Salvador", "Guatemala", "Haití", "Honduras", "Jamaica", 
    "México", "Nicaragua", "Panamá", "Paraguay", "Perú", 
    "República Dominicana", "Trinidad y Tobago", "Uruguay", "Venezuela"
];

const SECTION_CONFIG = {
    'info': { title: 'Información Base', icon: 'info' },
    '1': { title: '1. Marco General', icon: 'scale' },
    '2': { title: '2. Patrocinador', icon: 'briefcase' },
    '3': { title: '3. Autorización', icon: 'file-check' },
    '4': { title: '4. Producto (PI)', icon: 'package' },
    '5': { title: '5. Conducción', icon: 'activity' },
    '6': { title: '6. Específicas', icon: 'scroll' }
};

const QUESTIONS_GENERAL = {
    '1.1': '¿ARN principal?', '1.2': '¿Normativas de investigación?', '1.3': '¿Normativas ensayos clínicos?', '1.4': '¿Aprobación CEI?', '1.5': '¿CEI previo a ARN?', '1.6': '¿Registro CEI?', '1.7': '¿Autorización previa?', '2.1': '¿Definición patrocinador?', '2.2': '¿Representante legal?', '2.3': '¿Requisitos patrocinador?', '2.4': '¿Requisitos CRO?', '2.5': '¿Selección sitios?', '2.6': '¿Seguros?', '3.1': '¿Contenido envío?', '3.2': '¿Proceso envío?', '3.3': '¿Plazos?', '3.4': '¿Tasas?', '3.5': '¿Registro público?', '3.6': '¿Reconocimiento externo?', '3.7': '¿Secuencia pasos?', '4.1': '¿Etiquetado PI?', '4.2': '¿BPM/GMP?', '4.3': '¿Importación PI?', '5.1': '¿Seguridad (EAS)?', '5.2': '¿Informes anuales?', '5.3': '¿Informes periódicos?', '5.4': '¿Enmiendas?', '5.5': '¿Acceso post-estudio?', '6.1': '¿Datos personales?', '6.2': '¿Vacunas?', '6.3': '¿Muestras?', '6.4': '¿Otras situaciones?'
};
const QUESTIONS_PV = {
    '1.1': '¿Definición vulnerable?', '1.2': '¿Riesgo mínimo?', '1.3': '¿Aprobaciones extra?', '1.4': '¿Grupos explícitos?', '2.1': '¿Embarazadas?', '2.2': '¿Lactancia?', '2.3': '¿Beneficio directo?', '2.4': '¿Evidencia previa?', '2.5': '¿Consentimiento riesgos?', '2.6': '¿Consentimiento pareja?', '2.7': '¿Post-parto?', '3.1': '¿Menores?', '3.2': '¿Definición menor?', '3.3': '¿Categorías edad?', '3.4': '¿Necesidad salud?', '3.5': '¿Ambos padres?', '3.6': '¿Asentimiento?', '3.7': '¿Disentimiento?', '4.1': '¿Incapacidad?', '4.2': '¿Definición?', '4.3': '¿Justificación?', '4.4': '¿Representante?', '4.5': '¿Asentimiento?', '4.6': '¿Rechazo?', '5.1': '¿Pueblos originarios?', '5.2': '¿Consentimiento comunidad?', '5.3': '¿Adaptaciones?', '5.4': '¿Beneficios?'
};
const COMMON_LABELS = { 'id': 'ID', 'created_at': 'Creado', 'pais': 'País', 'titulo': 'Título', 'enlace': 'URL', 'descripcion': 'Descripción', 'proposito_descripcion': 'Propósito', 'peso': 'Orden', 'question_code': 'Código', 'autoridad_regulatoria': 'Autoridad', 'sitio_web_oficial': 'Web', 'correo_contacto': 'Email', 'telefonos': 'Tel', 'domicilio': 'Dirección', 'nombre_apellido': 'Usuario', 'correo': 'Email', 'comentarios': 'Reporte', 'documento_adjunto_url': 'Adjunto', 'estado': 'Estado' };
const TABLE_NAMES = { 'faq_rows_corregido': 'Matriz General', 'resumen_ejecutivo': 'Resumen', 'enlaces': 'Enlaces General', 'faq_pv_rows': 'Matriz Vulnerables', 'enlaces_pv': 'Enlaces Vulnerables', 'reportes_usuarios': 'Reportes' };

// --- ESTADO GLOBAL ---
let state = {
    table: '',
    pk: 'id',
    data: [],
    page: 1,
    total: 0,
    filterCountry: '', // Filtro actual
    editingId: null,
    countryLinks: [] // Para autocompletado
};

const admin = {
    init: async function() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.href = 'admin-login.html'; return; }
        lucide.createIcons();
        this.showWelcomeDashboard();
    },
    logout: async function() { await supabase.auth.signOut(); window.location.href = 'admin-login.html'; },

    updateActiveSidebar: function(activeAction) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick') || '';
            if (onclickAttr.includes(activeAction)) {
                btn.className = "nav-btn w-full text-left px-3 py-2.5 rounded-lg font-bold flex items-center gap-3 transition-all bg-blue-50 text-blue-700 shadow-sm";
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.remove('text-slate-400');
                    icon.classList.add('text-blue-600');
                }
            } else {
                btn.className = "nav-btn w-full text-left px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-medium flex items-center gap-3 transition-all group";
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.remove('text-blue-600');
                    icon.classList.add('text-slate-400');
                }
            }
        });
    },

    // --- CARGA DE DATOS CON FILTRO Y PAGINACIÓN ---
    loadTable: function(tableName, primaryKey = 'id') {
        // Reset state al cambiar de tabla
        if (state.table !== tableName) {
            state.page = 1;
            state.filterCountry = '';
        }
        state.table = tableName;
        state.pk = primaryKey;
        
        this.updateActiveSidebar(`loadTable('${tableName}'`);
        
        // UI Updates
        document.getElementById('table-title').textContent = TABLE_NAMES[tableName] || tableName;
        document.getElementById('table-subtitle').textContent = tableName;
        document.getElementById('action-buttons').classList.remove('hidden');
        
        this.fetchData();
    },

    fetchData: async function() {
        const container = document.getElementById('content-area');
        container.innerHTML = '<div class="flex justify-center pt-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>';

        // Construir Query
        let query = supabase.from(state.table).select('*', { count: 'exact' });

        // Aplicar Filtro
        if (state.filterCountry) {
            query = query.eq('pais', state.filterCountry);
        }

        // Aplicar Paginación
        const from = (state.page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.order(state.pk, { ascending: true }).range(from, to);

        const { data, error, count } = await query;

        if (error) {
            container.innerHTML = `<div class="bg-red-50 text-red-600 p-6 m-8 rounded-xl border border-red-200">Error: ${error.message}</div>`;
            return;
        }

        state.data = data;
        state.total = count;
        this.renderGrid();
    },

    // --- CAMBIO DE FILTRO Y PÁGINA ---
    setFilter: function(country) {
        state.filterCountry = country;
        state.page = 1; // Volver a primera página
        this.fetchData();
    },

    changePage: function(delta) {
        const newPage = state.page + delta;
        const maxPage = Math.ceil(state.total / ITEMS_PER_PAGE);
        if (newPage > 0 && newPage <= maxPage) {
            state.page = newPage;
            this.fetchData();
        }
    },

    // --- RENDERIZADO DEL GRID ---
    renderGrid: function() {
        const data = state.data;
        const container = document.getElementById('content-area');
        
        // Construir opciones del filtro
        let filterOptions = `<option value="">Todos los Países</option>`;
        COUNTRIES_LIST.forEach(c => {
            filterOptions += `<option value="${c}" ${state.filterCountry === c ? 'selected' : ''}>${c}</option>`;
        });

        // Header de Filtros
        let headerHtml = `
        <div class="flex items-center justify-between mb-4 px-1">
            <div class="flex items-center gap-3">
                <div class="bg-white border border-slate-300 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                    <i data-lucide="filter" class="w-4 h-4 text-slate-500"></i>
                    <select onchange="admin.setFilter(this.value)" class="bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 cursor-pointer outline-none">
                        ${filterOptions}
                    </select>
                </div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    ${state.total} Registros encontrados
                </span>
            </div>
            
            <!-- Paginación Superior -->
            <div class="flex items-center gap-2">
                <button onclick="admin.changePage(-1)" ${state.page === 1 ? 'disabled' : ''} class="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                <span class="text-sm font-medium text-slate-600 px-2">Pág ${state.page} de ${Math.max(1, Math.ceil(state.total / ITEMS_PER_PAGE))}</span>
                <button onclick="admin.changePage(1)" ${state.page >= Math.ceil(state.total / ITEMS_PER_PAGE) ? 'disabled' : ''} class="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
            </div>
        </div>`;

        if (!data || data.length === 0) {
            container.innerHTML = headerHtml + '<div class="p-12 text-center text-slate-400 bg-white border border-dashed rounded-xl">No se encontraron datos con este filtro.</div>';
            lucide.createIcons();
            return;
        }

        const allKeys = Object.keys(data[0]);
        const visibleKeys = allKeys.filter(k => !k.includes('ampliada') && !k.includes('fuente') && !k.includes('created_at')).slice(0, 6);

        let tableHtml = `
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full mb-8">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 shadow-sm z-10 w-24">Acciones</th>
                            ${visibleKeys.map(k => `<th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[150px] align-top">${this.humanizeColumn(k, state.table)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-slate-200">
        `;

        data.forEach(row => {
            const pkValue = row[state.pk];
            tableHtml += `<tr class="hover:bg-slate-50 transition-colors group">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium sticky left-0 bg-white group-hover:bg-slate-50 shadow-sm z-10 flex gap-2">
                    <button onclick="admin.openEditModal('${pkValue}')" class="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="admin.deleteRow('${pkValue}')" class="text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white p-2 rounded-lg transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
                ${visibleKeys.map(k => {
                    let val = row[k];
                    if (typeof val === 'boolean') val = val ? '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">SÍ</span>' : '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">NO</span>';
                    else if (val === null || val === undefined) val = '-';
                    else if (typeof val === 'string' && val.length > 50) val = `<span title="${val.replace(/"/g, '&quot;')}">${val.substring(0, 50)}...</span>`;
                    return `<td class="px-6 py-4 whitespace-nowrap align-middle text-sm text-slate-600">${val}</td>`;
                }).join('')}
            </tr>`;
        });
        tableHtml += `</tbody></table></div></div>`;

        container.innerHTML = headerHtml + tableHtml;
        lucide.createIcons();
    },

    // --- UTILS ---
    humanizeColumn: function(colName, tableName) {
        if (COMMON_LABELS[colName]) return COMMON_LABELS[colName];
        if (colName.startsWith('q_')) {
            const parts = colName.split('_'); 
            const type = parts.pop();
            let code = '', questionText = '';
            if (tableName === 'faq_pv_rows' || colName.includes('_pv_')) {
                const relevantParts = parts.filter(p => p !== 'q' && p !== 'pv');
                code = relevantParts.join('.');
                questionText = QUESTIONS_PV[code] || `Pregunta ${code}`;
            } else {
                const relevantParts = parts.filter(p => p !== 'q');
                code = relevantParts.join('.');
                questionText = QUESTIONS_GENERAL[code] || `Pregunta ${code}`;
            }
            let typeBadge = '', colorClass = '';
            if (type === 'directa') { typeBadge = 'Corta'; colorClass = 'bg-blue-100 text-blue-700'; }
            else if (type === 'ampliada') { typeBadge = 'Detalle'; colorClass = 'bg-purple-100 text-purple-700'; }
            else if (type === 'booleano') { typeBadge = 'Sí/No'; colorClass = 'bg-emerald-100 text-emerald-700'; }
            else if (type === 'fuente') { typeBadge = 'Fuente'; colorClass = 'bg-amber-100 text-amber-700'; }
            return `<div class="flex flex-col gap-1"><span class="text-sm font-semibold text-slate-800 leading-tight"><span class="text-blue-600 font-bold mr-1">${code}</span>${questionText.substring(0, 40)}${questionText.length>40?'...':''}</span><span class="text-[10px] w-fit px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${colorClass}">${typeBadge}</span></div>`;
        }
        return colName.replace(/_/g, ' ').toUpperCase();
    },

    // --- EDICIÓN CON TABS ---
    openEditModal: async function(pkValue) {
        state.editingId = pkValue;
        const row = state.data.find(r => String(r[state.pk]) === String(pkValue));
        if (!row) return;

        // Cargar Enlaces Autocomplete
        state.countryLinks = [];
        const country = row.pais;
        if (country && (state.table === 'faq_pv_rows' || state.table === 'faq_rows_corregido')) {
            const linksTable = (state.table === 'faq_pv_rows') ? 'enlaces_pv' : 'enlaces';
            const { data: links } = await supabase.from(linksTable).select('titulo').eq('pais', country);
            if (links) state.countryLinks = links.map(l => l.titulo);
        }

        // Agrupar Campos
        const keys = Object.keys(row);
        const sections = { 'info': [] };
        keys.forEach(key => {
            if (key.startsWith('q_')) {
                const parts = key.split('_');
                let sectionNum = 'info';
                for(let part of parts) { if (!isNaN(part) && part.length === 1) { sectionNum = part; break; } }
                if (!sections[sectionNum]) sections[sectionNum] = [];
                sections[sectionNum].push(key);
            } else sections['info'].push(key);
        });

        // Render Tabs
        const tabsContainer = document.getElementById('modal-tabs-sidebar');
        const formContainer = document.getElementById('modal-form-container');
        tabsContainer.innerHTML = ''; formContainer.innerHTML = '';
        const sortedSections = Object.keys(sections).sort();
        if (sortedSections.includes('info')) { sortedSections.splice(sortedSections.indexOf('info'), 1); sortedSections.unshift('info'); }

        // Render selector de pestañas para móviles
        let mobileSelectHtml = `
        <div class="block md:hidden mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <i data-lucide="folder" class="w-3.5 h-3.5"></i> Sección de Edición
            </label>
            <select onchange="admin.switchTab(this.value)" class="w-full border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white h-11 shadow-sm cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none">`;
        sortedSections.forEach(secId => {
            if (sections[secId].length === 0) return;
            const config = SECTION_CONFIG[secId] || { title: `Sección ${secId}` };
            mobileSelectHtml += `<option value="${secId}">${config.title}</option>`;
        });
        mobileSelectHtml += `</select></div>`;
        formContainer.innerHTML = mobileSelectHtml;

        sortedSections.forEach((secId, index) => {
            if (sections[secId].length === 0) return;
            const config = SECTION_CONFIG[secId] || { title: `Sección ${secId}`, icon: 'folder' };
            const isActive = index === 0;

            tabsContainer.innerHTML += `<button onclick="admin.switchTab('${secId}')" id="tab-btn-${secId}" class="${isActive ? 'w-full text-left px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md flex items-center gap-3' : 'w-full text-left px-4 py-3 rounded-xl hover:bg-white text-slate-500 hover:text-blue-600 font-medium flex items-center gap-3 transition-all'}"><i data-lucide="${config.icon}" class="w-4 h-4"></i> ${config.title}</button>`;

            let fieldsHtml = `<div id="tab-content-${secId}" class="${isActive ? '' : 'hidden'} animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div class="mb-6 pb-4 border-b border-slate-100"><h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2"><span class="bg-blue-100 text-blue-600 p-2 rounded-lg"><i data-lucide="${config.icon}" class="w-6 h-6"></i></span> ${config.title}</h2></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">`;
            
            const sortedKeys = sections[secId].sort();
            if (secId !== 'info') {
                 const questionGroups = {};
                 sortedKeys.forEach(k => { const base = k.split('_').slice(0, -1).join('_'); if (!questionGroups[base]) questionGroups[base] = []; questionGroups[base].push(k); });
                 Object.keys(questionGroups).sort().forEach((base, i) => {
                     if (i > 0) fieldsHtml += `<div class="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>`;
                     ['booleano', 'directa', 'ampliada', 'fuente'].forEach(suf => { const key = `${base}_${suf}`; if (row.hasOwnProperty(key)) fieldsHtml += this.renderFieldHTML(key, row[key], country); });
                 });
            } else sortedKeys.forEach(k => fieldsHtml += this.renderFieldHTML(k, row[k], country));
            fieldsHtml += `</div></div>`;
            formContainer.innerHTML += fieldsHtml;
        });

        document.getElementById('edit-modal').classList.remove('hidden');
        lucide.createIcons();
        const sourceInputs = document.querySelectorAll('textarea[id^="input-"][id*="fuente"]');
        sourceInputs.forEach(input => this.updateHighlighting(input.id.replace('input-', '')));
    },

    renderFieldHTML: function(key, val, countryName) {
        const labelHtml = this.humanizeColumn(key, state.table);
        if (key === 'id' || key === 'created_at') return `<div class="col-span-1 opacity-60"><div class="mb-1">${labelHtml}</div><input type="text" value="${val}" disabled class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm font-mono"></div>`;
        if (typeof val === 'boolean') return `<div class="col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors shadow-sm"><div class="pr-2">${labelHtml}</div><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" id="input-${key}" ${val ? 'checked' : ''} class="sr-only peer"><div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label></div>`;
        if (key === 'pais') {
            let optionsHtml = COUNTRIES_LIST.map(c => `<option value="${c}" ${c === val ? 'selected' : ''}>${c}</option>`).join('');
            return `<div class="col-span-1"><div class="mb-1">${labelHtml}</div><select id="input-${key}" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 shadow-sm bg-white cursor-pointer">${optionsHtml}</select></div>`;
        }
        if (key.includes('fuente')) {
            let optionsHtml = `<option value="">-- Seleccionar normativa --</option>`;
            if (state.countryLinks.length > 0) state.countryLinks.forEach(t => optionsHtml += `<option value="${t.replace(/"/g, '&quot;')}">${t}</option>`);
            else optionsHtml = `<option value="" disabled>No hay enlaces para ${countryName}</option>`;
            return `<div class="col-span-1 md:col-span-2 bg-amber-50/40 p-5 rounded-xl border border-amber-100"><div class="mb-2">${labelHtml}</div><div class="mb-3 flex items-center gap-2"><i data-lucide="plus-circle" class="w-4 h-4 text-amber-600"></i><select onchange="admin.appendSource('${key}', this.value); this.value='';" class="w-full text-sm border-amber-200 rounded-lg focus:ring-amber-500 text-slate-700 bg-white shadow-sm h-10 cursor-pointer">${optionsHtml}</select></div><textarea id="input-${key}" rows="2" oninput="admin.updateHighlighting('${key}')" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 shadow-sm" placeholder="Escriba aquí...">${val || ''}</textarea><div class="mt-2 text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200"><div class="flex items-center gap-1 mb-1 font-bold uppercase tracking-wider text-[10px] text-emerald-600"><i data-lucide="eye" class="w-3 h-3"></i> Vista Previa Enlaces:</div><div id="preview-${key}" class="leading-relaxed min-h-[20px]"></div></div></div>`;
        }
        const isLong = (typeof val === 'string' && val.length > 50) || key.includes('descripcion') || key.includes('ampliada') || key.includes('comentarios');
        return `<div class="col-span-1 ${isLong ? 'md:col-span-2' : ''}"><div class="mb-1">${labelHtml}</div>${isLong ? `<textarea id="input-${key}" rows="4" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 shadow-sm">${val || ''}</textarea>` : `<input type="text" id="input-${key}" value="${val !== null ? val.toString().replace(/"/g, '&quot;') : ''}" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 shadow-sm">`}</div>`;
    },

    // --- HELPERS ---
    switchTab: function(tabId) {
        document.querySelectorAll('[id^="tab-content-"]').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-content-${tabId}`).classList.remove('hidden');
        document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => btn.className = 'w-full text-left px-4 py-3 rounded-xl hover:bg-white text-slate-500 hover:text-blue-600 font-medium flex items-center gap-3 transition-all hover:shadow-sm');
        document.getElementById(`tab-btn-${tabId}`).className = 'w-full text-left px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md flex items-center gap-3 transition-all';
        document.getElementById('modal-form-container').scrollTop = 0;
    },
    appendSource: function(key, text) { if(!text) return; const input = document.getElementById(`input-${key}`); input.value = input.value.trim() ? input.value + `\n${text}` : text; this.updateHighlighting(key); },
    updateHighlighting: function(key) {
        const input = document.getElementById(`input-${key}`); const preview = document.getElementById(`preview-${key}`); if(!input || !preview) return;
        let text = (input.value || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        [...state.countryLinks].sort((a,b)=>b.length-a.length).forEach(t => { if(t && text.toLowerCase().includes(t.toLowerCase())) { text = text.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,'gi'), '<span class="bg-emerald-100 text-emerald-800 border border-emerald-200 px-1 rounded font-bold shadow-sm">$1</span>'); }});
        preview.innerHTML = text.replace(/\n/g, '<br>') || '<span class="text-slate-400 italic">Vacío...</span>';
    },

    // --- ACCIONES DE DATOS ---
    createNewRow: function() { 
        if (state.data.length === 0) { alert("Error tabla vacía"); return; }
        state.editingId = 'NEW';
        // Mock de row vacío basado en estructura del primer elemento
        const template = state.data[0];
        const emptyRow = {};
        Object.keys(template).forEach(k => emptyRow[k] = (typeof template[k] === 'boolean' ? false : ''));
        if (emptyRow.pais) emptyRow.pais = state.filterCountry || ''; // Prellenar país si hay filtro
        
        // Usar lógica de openEditModal pero con el row vacío
        // Hack temporal: inyectamos el row en data para que lo encuentre openEditModal
        // pero con un ID fake que coincida
        state.data.push({ ...emptyRow, [state.pk]: 'NEW_TEMP' });
        this.openEditModal('NEW_TEMP');
    },

    saveChanges: async function() {
        const btn = document.getElementById('save-btn'); btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i> Guardando...'; btn.disabled = true;
        const updateData = {};
        document.querySelectorAll('[id^="input-"]').forEach(input => updateData[input.id.replace('input-', '')] = input.type === 'checkbox' ? input.checked : input.value);
        
        let error = null;
        if (state.editingId === 'NEW' || state.editingId === 'NEW_TEMP') {
            // Eliminar ID del objeto update para que la DB lo genere
            delete updateData[state.pk];
            const res = await supabase.from(state.table).insert([updateData]).select();
            error = res.error;
            if(!error && (!res.data || res.data.length===0)) error = { message: "RLS Bloqueó la escritura" };
        } else {
            const res = await supabase.from(state.table).update(updateData).eq(state.pk, state.editingId).select();
            error = res.error;
            if(!error && (!res.data || res.data.length===0)) error = { message: "RLS Bloqueó la escritura" };
        }

        btn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Guardar Todo'; btn.disabled = false;
        if (error) alert('Error: ' + error.message);
        else { this.closeModal(); this.showToast('¡Guardado!'); this.fetchData(); }
    },
    deleteRow: async function(pkValue) { if (!confirm('¿Eliminar?')) return; const { error } = await supabase.from(state.table).delete().eq(state.pk, pkValue); if (error) alert(error.message); else { this.showToast('Eliminado'); this.fetchData(); } },
    closeModal: function() { document.getElementById('edit-modal').classList.add('hidden'); state.editingId = null; },
    showToast: function(msg) { const toast = document.getElementById('toast'); document.getElementById('toast-msg').innerText = msg; toast.classList.remove('translate-y-24', 'opacity-0'); setTimeout(() => toast.classList.add('translate-y-24', 'opacity-0'), 3000); },
    showWelcomeDashboard: async function() {
        this.updateActiveSidebar("showWelcomeDashboard");
        
        state.table = '';
        document.getElementById('table-title').textContent = "Inicio / Resumen";
        document.getElementById('table-subtitle').textContent = "Estadísticas generales y estado de la plataforma";
        document.getElementById('action-buttons').classList.add('hidden');
        
        const container = document.getElementById('content-area');
        container.innerHTML = '<div class="flex justify-center pt-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>';
        
        try {
            const counts = {};
            const tables = ['faq_rows_corregido', 'resumen_ejecutivo', 'enlaces', 'faq_pv_rows', 'enlaces_pv', 'reportes_usuarios'];
            
            await Promise.all(tables.map(async (table) => {
                const { count, error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
                counts[table] = error ? 0 : count;
            }));
            
            container.innerHTML = `
                <div class="space-y-8 animate-in fade-in duration-300">
                    <!-- Tarjeta de Bienvenida -->
                    <div class="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg">
                        <h3 class="text-2xl font-bold mb-2">¡Hola! Bienvenido al Panel de Control de RegLAC</h3>
                        <p class="text-blue-100 text-sm max-w-2xl leading-relaxed">
                            Desde aquí puedes gestionar los requisitos regulatorios, resúmenes institucionales y enlaces de interés de todos los países de la región. Selecciona una tabla en la barra lateral para ver los detalles.
                        </p>
                    </div>
                    
                    <!-- Tarjetas de Estadísticas -->
                    <div>
                        <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Métricas del Sistema</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Card 1 -->
                            <div onclick="admin.loadTable('faq_rows_corregido', 'pais')" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <i data-lucide="database" class="w-6 h-6"></i>
                                    </div>
                                    <span class="text-2xl font-extrabold text-slate-800">${counts['faq_rows_corregido']}</span>
                                </div>
                                <h5 class="font-bold text-slate-700 mb-1">Matriz General (FAQ)</h5>
                                <p class="text-xs text-slate-400">Preguntas y respuestas regulatorias generales.</p>
                            </div>
                            
                            <!-- Card 2 -->
                            <div onclick="admin.loadTable('faq_pv_rows', 'pais')" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="bg-teal-50 p-3 rounded-lg text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                        <i data-lucide="users" class="w-6 h-6"></i>
                                    </div>
                                    <span class="text-2xl font-extrabold text-slate-800">${counts['faq_pv_rows']}</span>
                                </div>
                                <h5 class="font-bold text-slate-700 mb-1">Matriz Poblaciones Vulnerables</h5>
                                <p class="text-xs text-slate-400">Requisitos específicos para menores, embarazadas, etc.</p>
                            </div>
                            
                            <!-- Card 3 -->
                            <div onclick="admin.loadTable('enlaces', 'id')" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="bg-amber-50 p-3 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <i data-lucide="link" class="w-6 h-6"></i>
                                    </div>
                                    <span class="text-2xl font-extrabold text-slate-800">${counts['enlaces'] + counts['enlaces_pv']}</span>
                                </div>
                                <h5 class="font-bold text-slate-700 mb-1">Enlaces y Normativas</h5>
                                <p class="text-xs text-slate-400">Total de enlaces y normativas oficiales cargadas.</p>
                            </div>

                            <!-- Card 4 -->
                            <div onclick="admin.loadTable('resumen_ejecutivo', 'pais')" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <i data-lucide="building" class="w-6 h-6"></i>
                                    </div>
                                    <span class="text-2xl font-extrabold text-slate-800">${counts['resumen_ejecutivo']}</span>
                                </div>
                                <h5 class="font-bold text-slate-700 mb-1">Información General (Resumen)</h5>
                                <p class="text-xs text-slate-400">Información institucional de autoridades regulatorias.</p>
                            </div>

                            <!-- Card 5 -->
                            <div onclick="admin.loadTable('reportes_usuarios', 'id')" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="bg-rose-50 p-3 rounded-lg text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                        <i data-lucide="alert-circle" class="w-6 h-6"></i>
                                    </div>
                                    <span class="text-2xl font-extrabold text-slate-800">${counts['reportes_usuarios']}</span>
                                </div>
                                <h5 class="font-bold text-slate-700 mb-1">Reportes de Enlaces Rotos</h5>
                                <p class="text-xs text-slate-400">Alertas y correcciones reportadas por investigadores.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            lucide.createIcons();
            
        } catch (err) {
            container.innerHTML = `<div class="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">Error al cargar estadísticas: ${err.message}</div>`;
        }
    }
};

window.admin = admin;
admin.init();