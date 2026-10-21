// admin/audit.js — Registro y Auditoría Avanzada de Cambios Normativos (REGIA)
(function() {
    let currentGrouping = 'pais'; // 'pais' | 'usuario' | 'fecha' | 'seccion' | 'tabla'
    let currentSearch = '';
    let filterCountry = 'todos';
    let filterLang = 'todos';
    let rawLogs = [];

    // Categorías normativas para agrupar por sección
    const SECTION_NAMES = {
        '1': '1. Marco Institucional y Autoridad Reguladora',
        '2': '2. Roles, Responsabilidades y Patrocinio',
        '3': '3. Regulación y Clasificación de Ensayos Clínicos',
        '4': '4. Comités de Ética en Investigación',
        '5': '5. Consentimiento Informado y Poblaciones Especiales',
        '6': '6. Farmacovigilancia y Reporte de Eventos Adversos',
        'enlaces': 'Normativas Oficiales y Enlaces de Interés',
        'resumen': 'Resumen Institucional del País',
        'otro': 'Otras Modificaciones Generales'
    };

    // Registros de auditoría de ejemplo para el modo de visualización de invitados
    const DEMO_AUDIT_LOGS = [
        {
            id: 'demo-log-1',
            created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            usuario_email: 'editor.conosur@paho.org',
            usuario_nombre: 'Dra. Elena Gómez (OPS)',
            accion: 'update',
            pais: 'Argentina',
            seccion: '1',
            campo: 'q_1_1_directa',
            idioma: 'es',
            tabla: 'faq_rows_corregido',
            registro_id: 'ARG_q_1_1',
            valor_anterior: 'La Autoridad Reguladora Nacional es la ANMAT.',
            valor_nuevo: 'La Autoridad Reguladora Nacional (ARN) para ensayos clínicos con fines registrales es la Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT).'
        },
        {
            id: 'demo-log-2',
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            usuario_email: 'roitmanadr@paho.org',
            usuario_nombre: 'Adriel Roitman (Super Admin)',
            accion: 'translate',
            pais: 'Argentina',
            seccion: '1',
            campo: 'q_1_1_directa',
            idioma: 'en',
            tabla: 'faq_rows_corregido_en',
            registro_id: 'ARG_q_1_1_en',
            valor_anterior: '[Pending Translation]',
            valor_nuevo: 'The National Regulatory Authority (NRA) for registration clinical trials is the National Administration of Drugs, Foods and Medical Technology (ANMAT).'
        },
        {
            id: 'demo-log-3',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            usuario_email: 'editor.brasil@paho.org',
            usuario_nombre: 'Dr. Carlos Silva (ANVISA/OPS)',
            accion: 'update',
            pais: 'Brasil',
            seccion: '4',
            campo: 'q_4_1_directa',
            idioma: 'es',
            tabla: 'faq_rows_corregido',
            registro_id: 'BRA_q_4_1',
            valor_anterior: 'Comissão Nacional de Ética em Pesquisa (CONEP).',
            valor_nuevo: 'El sistema CEP/CONEP constituye la instancia ética nacional para evaluación de protocolos clínicos en seres humanos en Brasil.'
        },
        {
            id: 'demo-log-4',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            usuario_email: 'roitmanadr@paho.org',
            usuario_nombre: 'Adriel Roitman (Super Admin)',
            accion: 'rollback',
            pais: 'Colombia',
            seccion: '3',
            campo: 'Ficha Completa',
            idioma: 'ambos',
            tabla: 'faq_rows_corregido',
            registro_id: 'COL_SNAPSHOT_RESTORE',
            valor_anterior: 'Versión no sincronizada',
            valor_nuevo: 'Restauración granular de 38 preguntas desde snapshot oficial de GitHub'
        },
        {
            id: 'demo-log-5',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            usuario_email: 'editor.conosur@paho.org',
            usuario_nombre: 'Dra. Elena Gómez (OPS)',
            accion: 'update',
            pais: 'Chile',
            seccion: 'enlaces',
            campo: 'enlace_isp',
            idioma: 'es',
            tabla: 'enlaces',
            registro_id: 'CHL_LINKS_2026',
            valor_anterior: 'https://antiguo.ispch.cl',
            valor_nuevo: 'https://www.ispch.gob.cl/anamed/ensayos-clinicos'
        }
    ];

    const AdminAudit = {
        async render(container, params = {}) {
            if (params.country) {
                filterCountry = params.country;
            }
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 space-y-3">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="text-slate-600 text-xs font-semibold tracking-wide">Cargando trazabilidad y registro de auditoría...</span>
                </div>
            `;

            try {
                if (window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly()) {
                    rawLogs = DEMO_AUDIT_LOGS;
                } else {
                    rawLogs = await window.AdminAPI.getAuditLog(150);
                    if (!rawLogs || rawLogs.length === 0) {
                        rawLogs = DEMO_AUDIT_LOGS;
                    }
                }
                this.renderContent(container);
            } catch (err) {
                console.error('[AdminAudit] Error:', err);
                container.innerHTML = `
                    <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 max-w-xl mx-auto my-8">
                        <div class="flex items-center gap-3 mb-2">
                            <i data-lucide="alert-octagon" class="w-6 h-6 text-red-600"></i>
                            <h3 class="font-bold text-base">Error al cargar registros de auditoría</h3>
                        </div>
                        <p class="text-xs text-red-600 mb-4">${err.message || err}</p>
                        <button id="btn-retry-audit" class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition">
                            Reintentar
                        </button>
                    </div>
                `;
                container.querySelector('#btn-retry-audit')?.addEventListener('click', () => this.render(container));
                if (window.lucide) window.lucide.createIcons();
            }
        },

        renderContent(container) {
            // Filtrar logs según búsqueda y selects
            const filteredLogs = rawLogs.filter(log => {
                if (filterCountry !== 'todos' && log.pais !== filterCountry) return false;
                if (filterLang !== 'todos' && log.idioma !== filterLang) return false;

                if (currentSearch.trim()) {
                    const q = currentSearch.toLowerCase();
                    const matchText = [
                        log.pais || '',
                        log.usuario_nombre || '',
                        log.campo || '',
                        log.valor_nuevo || '',
                        log.valor_anterior || ''
                    ].join(' ').toLowerCase();
                    if (!matchText.includes(q)) return false;
                }
                return true;
            });

            // Métricas rápidas
            const totalEvents = rawLogs.length;
            const uniqueCountries = new Set(rawLogs.map(l => l.pais).filter(Boolean)).size;
            const uniqueUsers = new Set(rawLogs.map(l => l.usuario_nombre || l.usuario_id).filter(Boolean)).size;
            const lastLog = rawLogs[0];
            const lastLogDate = lastLog?.created_at ? new Date(lastLog.created_at).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-';

            const countriesList = window.COUNTRIES_LIST || [];

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Header Principal Institucional -->
                    <div class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                                    Seguridad & Trazabilidad
                                </span>
                                <span class="text-slate-300">·</span>
                                <span class="text-xs text-slate-500 font-medium">Plataforma REGIA</span>
                            </div>
                            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Centro de Control y Auditoría</h1>
                            <p class="text-xs text-slate-500 max-w-2xl leading-relaxed">
                                Historial cronológico de cambios normativos con versionado anterior vs. nuevo, usuario interviniente y trazabilidad legal de cada país.
                            </p>
                        </div>

                        <!-- Acciones Globales -->
                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                            <button id="btn-refresh-audit" class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition" title="Refrescar auditoría desde Supabase">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                <span>Refrescar</span>
                            </button>
                            <button id="btn-export-csv" class="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition" title="Descargar informe completo en formato CSV compatible con Excel">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                <span>Exportar CSV</span>
                            </button>
                            <button id="btn-export-json" class="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition" title="Descargar datos estructurados JSON">
                                <i data-lucide="code" class="w-3.5 h-3.5"></i>
                                <span>JSON</span>
                            </button>
                        </div>
                    </div>

                    <!-- Banner de Modo Solo Lectura (Demostración) -->
                    ${window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly() ? `
                        <div class="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 text-purple-950 text-xs shadow-xs">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-purple-100 rounded-xl text-purple-700 shrink-0">
                                    <i data-lucide="info" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-sm text-purple-900 flex items-center gap-2">
                                        <span>Centro de Auditoría y Trazabilidad (Vista de Invitado)</span>
                                        <span class="text-[10px] font-bold uppercase tracking-wider bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Ejemplo Demostrativo</span>
                                    </h4>
                                    <p class="text-purple-700 mt-0.5">
                                        Los registros exhibidos a continuación son <strong>ejemplos al mero efecto de mostrar</strong> el funcionamiento de la trazabilidad cronológica, filtros por país y cotejo de cambios. No representan datos de producción ni exponen usuarios reales de la OPS.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Métricas de Auditoría (KPI Cards) -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Eventos Totales</span>
                                <i data-lucide="history" class="w-4 h-4 text-blue-600"></i>
                            </div>
                            <div class="text-2xl font-extrabold text-slate-800">${totalEvents}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">Modificaciones registradas</div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Países Intervenidos</span>
                                <i data-lucide="globe" class="w-4 h-4 text-emerald-600"></i>
                            </div>
                            <div class="text-2xl font-extrabold text-slate-800">${uniqueCountries} <span class="text-xs font-normal text-slate-400">/ 22</span></div>
                            <div class="text-[11px] text-slate-400 mt-0.5">Con cambios guardados</div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Editores Activos</span>
                                <i data-lucide="users" class="w-4 h-4 text-indigo-600"></i>
                            </div>
                            <div class="text-2xl font-extrabold text-slate-800">${uniqueUsers}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">Autores de cambios</div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Último Cambio</span>
                                <i data-lucide="clock" class="w-4 h-4 text-amber-500"></i>
                            </div>
                            <div class="text-base font-bold text-slate-800 truncate" title="${lastLogDate}">${lastLogDate}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5 truncate">${lastLog?.usuario_nombre || 'Sin actividad reciente'}</div>
                        </div>
                    </div>

                    <!-- Barra de Controles: Filtros y Selector de Modalidad de Agrupación -->
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <!-- Pestañas de Agrupación -->
                            <div class="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
                                <button data-grouping="pais" class="grouping-tab-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${currentGrouping === 'pais' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
                                    <i data-lucide="flag" class="w-3.5 h-3.5"></i>
                                    <span>Por País</span>
                                </button>
                                <button data-grouping="usuario" class="grouping-tab-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${currentGrouping === 'usuario' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
                                    <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
                                    <span>Por Usuario</span>
                                </button>
                                <button data-grouping="fecha" class="grouping-tab-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${currentGrouping === 'fecha' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
                                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                                    <span>Por Fecha</span>
                                </button>
                                <button data-grouping="seccion" class="grouping-tab-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${currentGrouping === 'seccion' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
                                    <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                                    <span>Por Sección</span>
                                </button>
                                <button data-grouping="tabla" class="grouping-tab-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${currentGrouping === 'tabla' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">
                                    <i data-lucide="table" class="w-3.5 h-3.5"></i>
                                    <span>Tabla Plana</span>
                                </button>
                            </div>

                            <!-- Filtros Reactivos -->
                            <div class="flex flex-wrap items-center gap-2">
                                <!-- Búsqueda en vivo -->
                                <div class="relative flex-1 sm:w-64">
                                    <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                                    <input 
                                        type="text" 
                                        id="audit-search-input" 
                                        value="${currentSearch.replace(/"/g, '&quot;')}"
                                        placeholder="Buscar texto, campo o usuario..." 
                                        class="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    >
                                    ${currentSearch ? `
                                        <button id="btn-clear-audit-search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
                                    ` : ''}
                                </div>

                                <!-- Filtro por País -->
                                <select id="audit-filter-country" class="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                                    <option value="todos" ${filterCountry === 'todos' ? 'selected' : ''}>Todos los Países</option>
                                    ${countriesList.map(c => `
                                        <option value="${c.name}" ${filterCountry === c.name ? 'selected' : ''}>${c.name}</option>
                                    `).join('')}
                                </select>

                                <!-- Filtro por Idioma -->
                                <select id="audit-filter-lang" class="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                                    <option value="todos" ${filterLang === 'todos' ? 'selected' : ''}>Idiomas (ES+EN)</option>
                                    <option value="es" ${filterLang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
                                    <option value="en" ${filterLang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
                                </select>
                            </div>
                        </div>

                        <!-- Contador de resultados filtrados -->
                        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>Mostrando <strong>${filteredLogs.length}</strong> de <strong>${totalEvents}</strong> eventos</span>
                            ${(filterCountry !== 'todos' || filterLang !== 'todos' || currentSearch) ? `
                                <button id="btn-reset-filters" class="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                                    <span>Limpiar filtros</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Contenedor Principal de Vista Agrupada -->
                    <div id="audit-groups-container">
                        ${this.renderActiveGroupingView(filteredLogs)}
                    </div>
                </div>

                <!-- Modal de Detalle de Auditoría con Visualizador de Diff Enriquecido -->
                <div id="audit-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
                    <div class="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                        <!-- Header del Modal -->
                        <div class="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                    <i data-lucide="git-commit" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h3 class="font-bold text-slate-800 text-base" id="modal-title-field">Detalle de Modificación</h3>
                                        <span id="modal-badge-lang" class="text-[10px] uppercase font-bold px-2 py-0.5 rounded">ES</span>
                                    </div>
                                    <p id="audit-modal-meta" class="text-xs text-slate-500 font-mono mt-0.5"></p>
                                </div>
                            </div>
                            <button id="btn-close-audit-modal" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/70 transition">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <!-- Cuerpo del Modal (Side by Side Diff) -->
                        <div class="p-6 overflow-y-auto space-y-4 flex-1">
                            <!-- Metadatos de la edición -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                                <div>
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block">País</span>
                                    <span id="modal-meta-country" class="font-bold text-slate-800"></span>
                                </div>
                                <div>
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Autor</span>
                                    <span id="modal-meta-user" class="font-bold text-slate-800"></span>
                                </div>
                                <div>
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Fecha y Hora</span>
                                    <span id="modal-meta-date" class="font-mono text-slate-700"></span>
                                </div>
                                <div>
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Registro ID</span>
                                    <span id="modal-meta-id" class="font-mono text-slate-500 text-[11px] truncate block"></span>
                                </div>
                            </div>

                            <!-- Comparativa Side-by-Side -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Columna Versión Anterior -->
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] uppercase font-extrabold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 flex items-center gap-1">
                                            <i data-lucide="minus-circle" class="w-3 h-3 text-rose-600"></i>
                                            <span>Versión Anterior</span>
                                        </span>
                                        <span id="diff-old-len" class="text-[10px] text-slate-400 font-mono"></span>
                                    </div>
                                    <div id="audit-modal-old" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed max-h-72 overflow-y-auto font-sans whitespace-pre-wrap select-text"></div>
                                </div>

                                <!-- Columna Versión Nueva -->
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] uppercase font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                                            <i data-lucide="plus-circle" class="w-3 h-3 text-emerald-600"></i>
                                            <span>Versión Nueva</span>
                                        </span>
                                        <span id="diff-new-len" class="text-[10px] text-emerald-600 font-mono font-bold"></span>
                                    </div>
                                    <div id="audit-modal-new" class="p-4 bg-emerald-50/30 border border-emerald-200 rounded-2xl text-xs text-slate-800 leading-relaxed max-h-72 overflow-y-auto font-sans whitespace-pre-wrap select-text"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer del Modal -->
                        <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
                            <button id="modal-jump-editor" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-xl transition">
                                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                                <span>Abrir país en el Editor</span>
                            </button>
                            <button id="btn-done-audit-modal" class="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs">
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            `;

            this.bindEvents(container, filteredLogs);
            if (window.lucide) window.lucide.createIcons();
        },

        // Renderizado según la pestaña de agrupación activa
        renderActiveGroupingView(logs) {
            if (logs.length === 0) {
                return `
                    <div class="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <i data-lucide="inbox" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-sm font-bold text-slate-700">No se encontraron eventos</h3>
                        <p class="text-xs text-slate-400 max-w-sm mx-auto">No hay registros de auditoría que coincidan con los filtros seleccionados.</p>
                    </div>
                `;
            }

            switch(currentGrouping) {
                case 'pais':
                    return this.renderGroupByCountry(logs);
                case 'usuario':
                    return this.renderGroupByUser(logs);
                case 'fecha':
                    return this.renderGroupByDate(logs);
                case 'seccion':
                    return this.renderGroupBySection(logs);
                case 'tabla':
                default:
                    return this.renderFlatTable(logs);
            }
        },

        // 1. Agrupado por País
        renderGroupByCountry(logs) {
            const groups = {};
            logs.forEach(log => {
                const country = log.pais || 'Sin País Asignado';
                if (!groups[country]) groups[country] = [];
                groups[country].push(log);
            });

            const sortedCountries = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

            return `
                <div class="space-y-4">
                    ${sortedCountries.map(country => {
                        const items = groups[country];
                        const lastEdit = items[0]?.created_at ? new Date(items[0].created_at).toLocaleDateString('es-AR') : '-';
                        return `
                            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition">
                                <div class="p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between cursor-pointer group accordion-toggle" data-accordion="country-${country.replace(/\s+/g, '-')}">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                            <i data-lucide="map-pin" class="w-4 h-4"></i>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <h3 class="font-bold text-slate-800 text-sm md:text-base">${country}</h3>
                                                <span class="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                                                    ${items.length} cambio${items.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <span class="text-[11px] text-slate-400">Última edición: ${lastEdit}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <button onclick="event.stopPropagation(); window.AdminApp.navigate('editor', { country: '${country}' })" class="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100/60 rounded-lg transition" title="Ir al editor de este país">
                                            Ir al Editor →
                                        </button>
                                        <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" id="icon-country-${country.replace(/\s+/g, '-')}"></i>
                                    </div>
                                </div>
                                <div id="body-country-${country.replace(/\s+/g, '-')}" class="divide-y divide-slate-100">
                                    ${items.map(log => this.renderLogItemRow(log)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        // 2. Agrupado por Usuario
        renderGroupByUser(logs) {
            const groups = {};
            logs.forEach(log => {
                const user = log.usuario_nombre || 'Usuario Desconocido';
                if (!groups[user]) groups[user] = [];
                groups[user].push(log);
            });

            const sortedUsers = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

            return `
                <div class="space-y-4">
                    ${sortedUsers.map(user => {
                        const items = groups[user];
                        const initials = user.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
                        return `
                            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                                <div class="p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between cursor-pointer accordion-toggle" data-accordion="user-${user.replace(/\s+/g, '-')}">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                            ${initials}
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <h3 class="font-bold text-slate-800 text-sm">${user}</h3>
                                                <span class="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                                                    ${items.length} intervenciones
                                                </span>
                                            </div>
                                            <span class="text-[11px] text-slate-400">${items[0]?.usuario_email || 'Editor de la plataforma'}</span>
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400" id="icon-user-${user.replace(/\s+/g, '-')}"></i>
                                </div>
                                <div id="body-user-${user.replace(/\s+/g, '-')}" class="divide-y divide-slate-100">
                                    ${items.map(log => this.renderLogItemRow(log)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        // 3. Agrupado por Fecha / Cronología
        renderGroupByDate(logs) {
            const todayStr = new Date().toDateString();
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = yesterdayDate.toDateString();

            const groups = {
                'Hoy': [],
                'Ayer': [],
                'Esta semana': [],
                'Este mes': [],
                'Anteriores': []
            };

            const now = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(now.getDate() - 30);

            logs.forEach(log => {
                if (!log.created_at) {
                    groups['Anteriores'].push(log);
                    return;
                }
                const d = new Date(log.created_at);
                const dStr = d.toDateString();

                if (dStr === todayStr) {
                    groups['Hoy'].push(log);
                } else if (dStr === yesterdayStr) {
                    groups['Ayer'].push(log);
                } else if (d > oneWeekAgo) {
                    groups['Esta semana'].push(log);
                } else if (d > oneMonthAgo) {
                    groups['Este mes'].push(log);
                } else {
                    groups['Anteriores'].push(log);
                }
            });

            return `
                <div class="space-y-6">
                    ${Object.keys(groups).filter(k => groups[k].length > 0).map(period => {
                        const items = groups[period];
                        return `
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 px-1">
                                    <i data-lucide="calendar" class="w-4 h-4 text-slate-400"></i>
                                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">${period}</h3>
                                    <span class="text-xs text-slate-400">(${items.length} eventos)</span>
                                </div>
                                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
                                    ${items.map(log => this.renderLogItemRow(log)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        // 4. Agrupado por Sección Normativa
        renderGroupBySection(logs) {
            const groups = {};
            logs.forEach(log => {
                let secKey = 'otro';
                const campo = (log.campo || '').toLowerCase();
                if (campo.startsWith('q_1_') || campo.startsWith('1.')) secKey = '1';
                else if (campo.startsWith('q_2_') || campo.startsWith('2.')) secKey = '2';
                else if (campo.startsWith('q_3_') || campo.startsWith('3.')) secKey = '3';
                else if (campo.startsWith('q_4_') || campo.startsWith('4.')) secKey = '4';
                else if (campo.startsWith('q_5_') || campo.startsWith('5.')) secKey = '5';
                else if (campo.startsWith('q_6_') || campo.startsWith('6.')) secKey = '6';
                else if (campo.includes('enlace')) secKey = 'enlaces';
                else if (campo.includes('resumen')) secKey = 'resumen';

                if (!groups[secKey]) groups[secKey] = [];
                groups[secKey].push(log);
            });

            return `
                <div class="space-y-4">
                    ${Object.keys(groups).map(secKey => {
                        const items = groups[secKey];
                        const label = SECTION_NAMES[secKey] || `Sección ${secKey}`;
                        return `
                            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                                <div class="p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between cursor-pointer accordion-toggle" data-accordion="sec-${secKey}">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                                            ${secKey}
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-slate-800 text-sm">${label}</h3>
                                            <span class="text-[11px] text-slate-400">${items.length} modificaciones registradas</span>
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400" id="icon-sec-${secKey}"></i>
                                </div>
                                <div id="body-sec-${secKey}" class="divide-y divide-slate-100">
                                    ${items.map(log => this.renderLogItemRow(log)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        // 5. Vista de Tabla Plana
        renderFlatTable(logs) {
            return `
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th class="p-4">Fecha y Hora</th>
                                    <th class="p-4">País</th>
                                    <th class="p-4">Idioma</th>
                                    <th class="p-4">Usuario</th>
                                    <th class="p-4">Campo / Pregunta</th>
                                    <th class="p-4">Resumen del Cambio</th>
                                    <th class="p-4 text-right">Comparar</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-slate-700">
                                ${logs.map(log => {
                                    const d = log.created_at ? new Date(log.created_at).toLocaleString('es-AR') : '-';
                                    return `
                                        <tr class="hover:bg-blue-50/40 transition cursor-pointer group log-row-click" data-log-id="${log.id}">
                                            <td class="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">${d}</td>
                                            <td class="p-4 font-bold text-slate-800">${log.pais || '-'}</td>
                                            <td class="p-4">
                                                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${log.idioma === 'es' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}">
                                                    ${log.idioma || 'es'}
                                                </span>
                                            </td>
                                            <td class="p-4 font-medium text-slate-700">${log.usuario_nombre || 'Usuario'}</td>
                                            <td class="p-4 font-mono text-[11px] text-slate-600 max-w-xs truncate" title="${(log.campo || '').replace(/"/g, '&quot;')}">${log.campo || '-'}</td>
                                            <td class="p-4 text-slate-500 max-w-xs truncate" title="${(log.valor_nuevo || '').replace(/"/g, '&quot;')}">
                                                ${log.valor_nuevo ? log.valor_nuevo.substring(0, 75) + '...' : '(Vacío)'}
                                            </td>
                                            <td class="p-4 text-right">
                                                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg">
                                                    <span>Ver Diff</span>
                                                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },

        // Fila individual para vistas agrupadas
        renderLogItemRow(log) {
            const dateStr = log.created_at ? new Date(log.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-';
            const fullDate = log.created_at ? new Date(log.created_at).toLocaleDateString('es-AR') : '-';
            return `
                <div class="p-3.5 hover:bg-blue-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group log-row-click" data-log-id="${log.id}">
                    <div class="flex items-start gap-3 min-w-0">
                        <span class="px-2 py-1 text-[10px] font-bold rounded uppercase mt-0.5 shrink-0 ${log.idioma === 'es' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}">
                            ${log.idioma === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
                        </span>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-bold text-xs text-slate-800 font-mono">${log.campo || 'Campo no especificado'}</span>
                                <span class="text-slate-300">·</span>
                                <span class="text-xs text-slate-600 font-medium">${log.usuario_nombre || 'Usuario'}</span>
                                <span class="text-slate-300">·</span>
                                <span class="text-[11px] text-slate-400 font-mono">${fullDate} ${dateStr}</span>
                            </div>
                            <p class="text-xs text-slate-500 truncate mt-0.5 max-w-xl">
                                ${log.valor_nuevo ? log.valor_nuevo.substring(0, 95) + '...' : '<em class="text-slate-400">Contenido vaciado</em>'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-blue-800 bg-white group-hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 transition">
                            <span>Ver Diff</span>
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                        </span>
                    </div>
                </div>
            `;
        },

        // Eventos y listeners
        bindEvents(container, filteredLogs) {
            // Cambio de agrupación
            container.querySelectorAll('.grouping-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentGrouping = btn.getAttribute('data-grouping');
                    this.renderContent(container);
                });
            });

            // Buscador en vivo
            const searchInput = container.querySelector('#audit-search-input');
            let debounceTimer = null;
            searchInput?.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    currentSearch = e.target.value;
                    this.renderContent(container);
                }, 200);
            });

            // Limpiar búsqueda
            container.querySelector('#btn-clear-audit-search')?.addEventListener('click', () => {
                currentSearch = '';
                this.renderContent(container);
            });

            // Limpiar todos los filtros
            container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
                currentSearch = '';
                filterCountry = 'todos';
                filterLang = 'todos';
                this.renderContent(container);
            });

            // Selector país
            container.querySelector('#audit-filter-country')?.addEventListener('change', (e) => {
                filterCountry = e.target.value;
                this.renderContent(container);
            });

            // Selector idioma
            container.querySelector('#audit-filter-lang')?.addEventListener('change', (e) => {
                filterLang = e.target.value;
                this.renderContent(container);
            });

            // Refrescar
            container.querySelector('#btn-refresh-audit')?.addEventListener('click', () => {
                this.render(container);
            });

            // Exportar CSV
            container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
                this.exportToCSV(filteredLogs);
            });

            // Exportar JSON
            container.querySelector('#btn-export-json')?.addEventListener('click', () => {
                this.exportToJSON(filteredLogs);
            });

            // Accordion toggles
            container.querySelectorAll('.accordion-toggle').forEach(header => {
                header.addEventListener('click', () => {
                    const id = header.getAttribute('data-accordion');
                    const body = container.querySelector(`#body-${id}`);
                    const icon = container.querySelector(`#icon-${id}`);
                    if (body) {
                        const isHidden = body.classList.toggle('hidden');
                        if (icon) icon.style.transform = isHidden ? 'rotate(-90deg)' : 'rotate(0deg)';
                    }
                });
            });

            // Modal de Diff al hacer click en fila
            const modal = container.querySelector('#audit-modal');
            container.querySelectorAll('.log-row-click').forEach(elem => {
                elem.addEventListener('click', () => {
                    const logId = elem.getAttribute('data-log-id');
                    const log = rawLogs.find(l => String(l.id) === String(logId));
                    if (log) this.openDiffModal(container, log);
                });
            });

            // Cerrar modal
            container.querySelector('#btn-close-audit-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
            container.querySelector('#btn-done-audit-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        },

        // Abre y formatea el modal de Diff
        openDiffModal(container, log) {
            const modal = container.querySelector('#audit-modal');
            if (!modal) return;

            const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('es-AR') : '-';

            container.querySelector('#modal-title-field').textContent = log.campo || 'Campo modificado';
            const badgeLang = container.querySelector('#modal-badge-lang');
            if (badgeLang) {
                badgeLang.textContent = (log.idioma || 'es').toUpperCase();
                badgeLang.className = `text-[10px] uppercase font-bold px-2 py-0.5 rounded ${log.idioma === 'en' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`;
            }

            container.querySelector('#audit-modal-meta').textContent = `${log.pais || '-'} · ${log.usuario_nombre || 'Usuario'} · ${dateStr}`;
            container.querySelector('#modal-meta-country').textContent = log.pais || '-';
            container.querySelector('#modal-meta-user').textContent = log.usuario_nombre || 'Usuario';
            container.querySelector('#modal-meta-date').textContent = dateStr;
            container.querySelector('#modal-meta-id').textContent = log.id || '-';

            const oldText = log.valor_anterior || '';
            const newText = log.valor_nuevo || '';

            container.querySelector('#diff-old-len').textContent = `${oldText.length} caracteres`;
            const diffLen = newText.length - oldText.length;
            const diffSign = diffLen > 0 ? `+${diffLen}` : `${diffLen}`;
            container.querySelector('#diff-new-len').textContent = `${newText.length} car. (${diffSign})`;

            // Resaltado visual palabra a palabra
            const { oldHtml, newHtml } = this.computeVisualDiff(oldText, newText);
            container.querySelector('#audit-modal-old').innerHTML = oldHtml;
            container.querySelector('#audit-modal-new').innerHTML = newHtml;

            // Botón ir al editor del país
            const btnJump = container.querySelector('#modal-jump-editor');
            if (btnJump) {
                btnJump.onclick = () => {
                    modal.classList.add('hidden');
                    if (window.AdminApp) window.AdminApp.navigate('editor', { country: log.pais });
                };
            }

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        },

        // Algoritmo de comparación visual de palabras
        computeVisualDiff(oldStr, newStr) {
            if (!oldStr && !newStr) {
                return { oldHtml: '<span class="text-slate-400 italic">(Vacío)</span>', newHtml: '<span class="text-slate-400 italic">(Vacío)</span>' };
            }
            if (!oldStr) {
                return {
                    oldHtml: '<span class="text-slate-400 italic">(Sin versión previa registrada en el sistema / Carga inicial)</span>',
                    newHtml: `<span class="bg-emerald-100/80 text-emerald-950 px-1 py-0.5 rounded font-medium">${this.escapeHtml(newStr)}</span>`
                };
            }
            if (!newStr) {
                return {
                    oldHtml: `<span class="bg-rose-100 text-rose-950 line-through px-1 py-0.5 rounded">${this.escapeHtml(oldStr)}</span>`,
                    newHtml: '<span class="text-rose-600 italic font-semibold">(Contenido eliminado)</span>'
                };
            }

            const oldWords = oldStr.split(/(\s+)/);
            const newWords = newStr.split(/(\s+)/);

            // Comparación simple de tokens para resaltar palabras añadidas o quitadas
            const oldSet = new Set(oldWords.map(w => w.trim()).filter(Boolean));
            const newSet = new Set(newWords.map(w => w.trim()).filter(Boolean));

            const oldHtml = oldWords.map(w => {
                if (!w.trim()) return w;
                if (!newSet.has(w.trim())) {
                    return `<span class="bg-rose-100 text-rose-900 line-through px-0.5 rounded">${this.escapeHtml(w)}</span>`;
                }
                return this.escapeHtml(w);
            }).join('');

            const newHtml = newWords.map(w => {
                if (!w.trim()) return w;
                if (!oldSet.has(w.trim())) {
                    return `<span class="bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded">${this.escapeHtml(w)}</span>`;
                }
                return this.escapeHtml(w);
            }).join('');

            return { oldHtml, newHtml };
        },

        escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        // Exportación a CSV con BOM UTF-8
        exportToCSV(logs) {
            if (!logs || logs.length === 0) {
                alert('No hay registros para exportar');
                return;
            }

            const headers = ['ID', 'Fecha', 'País', 'Idioma', 'Usuario', 'Email', 'Campo', 'Valor Anterior', 'Valor Nuevo'];
            const rows = logs.map(l => [
                l.id || '',
                l.created_at || '',
                l.pais || '',
                l.idioma || '',
                l.usuario_nombre || '',
                l.usuario_email || '',
                l.campo || '',
                (l.valor_anterior || '').replace(/\r?\n/g, ' '),
                (l.valor_nuevo || '').replace(/\r?\n/g, ' ')
            ]);

            const csvContent = '\uFEFF' + [headers, ...rows].map(row => 
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            ).join('\r\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `auditoria_regia_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        // Exportación a JSON estructurado
        exportToJSON(logs) {
            if (!logs || logs.length === 0) {
                alert('No hay registros para exportar');
                return;
            }
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
            const a = document.createElement('a');
            a.href = dataStr;
            a.download = `auditoria_regia_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    window.AdminAudit = AdminAudit;
})();
