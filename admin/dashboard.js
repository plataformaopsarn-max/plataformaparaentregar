// admin/dashboard.js — Vista Principal y Métricas de Sincronización
(function() {
    let currentFilter = 'todos';
    let searchQuery = '';

    const AdminDashboard = {
        async render(container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-slate-600 font-medium">Cargando estado de la plataforma...</span>
                </div>
            `;

            try {
                const overview = await window.AdminAPI.getCountriesOverview();
                const queue = await window.AdminAPI.getTranslationQueue('pendiente');

                this.renderContent(container, overview, queue);
            } catch (err) {
                console.error('[AdminDashboard] Error:', err);
                container.innerHTML = `
                    <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <h3 class="font-bold text-lg mb-2">Error al cargar el dashboard</h3>
                        <p class="text-sm">${err.message || err}</p>
                    </div>
                `;
            }
        },

        renderContent(container, overview, pendingQueue) {
            const countries = window.COUNTRIES_LIST || [];
            const enPaisSet = new Set(overview.countriesEN || []);
            const pendingCounts = overview.pendingCounts || {};
            const totalPending = pendingQueue.length;

            const syncedCount = countries.filter(c => enPaisSet.has(c.name) && !pendingCounts[c.name]).length;
            const partialCount = countries.filter(c => pendingCounts[c.name] > 0).length;
            const esOnlyCount = countries.filter(c => !enPaisSet.has(c.name)).length;

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Banner de bienvenida y aviso de estado -->
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-sm">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-blue-500/40 rounded-md">REGIA Admin</span>
                                <span class="text-xs text-blue-200">OPS/OMS</span>
                            </div>
                            <h1 class="text-2xl font-bold">Gestión de Contenidos y Traducciones</h1>
                            <p class="text-sm text-blue-100 mt-1">
                                Plataforma de Información Regulatoria sobre Ensayos Clínicos en América Latina y el Caribe
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="btn-refresh-dashboard" class="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition backdrop-blur-sm">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                <span>Actualizar</span>
                            </button>
                            ${window.AdminAuth?.isAdmin() ? `
                            <button id="btn-open-api-settings" class="flex items-center gap-2 px-3 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-lg text-sm font-semibold transition shadow-sm">
                                <i data-lucide="sparkles" class="w-4 h-4 text-blue-600"></i>
                                <span>Configurar IA Gemini</span>
                            </button>` : ''}
                        </div>
                    </div>

                    <!-- KPIs -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                            <div class="flex items-center justify-between text-slate-500 mb-2">
                                <span class="text-xs font-semibold uppercase tracking-wider">Total Países</span>
                                <i data-lucide="globe" class="w-4 h-4 text-slate-400"></i>
                            </div>
                            <div class="text-2xl font-bold text-slate-800">${countries.length}</div>
                            <div class="text-xs text-slate-400 mt-1">22 perfiles normativos</div>
                        </div>

                        <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                            <div class="flex items-center justify-between text-slate-500 mb-2">
                                <span class="text-xs font-semibold uppercase tracking-wider">Sincronizados (ES+EN)</span>
                                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500"></i>
                            </div>
                            <div class="text-2xl font-bold text-emerald-600">${syncedCount}</div>
                            <div class="text-xs text-slate-400 mt-1">Versiones al día</div>
                        </div>

                        <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-amber-400 transition" id="card-pending-queue">
                            <div class="flex items-center justify-between text-slate-500 mb-2">
                                <span class="text-xs font-semibold uppercase tracking-wider">Pendientes de Revisión</span>
                                <i data-lucide="clock" class="w-4 h-4 text-amber-500"></i>
                            </div>
                            <div class="text-2xl font-bold text-amber-600 flex items-center gap-2">
                                <span>${totalPending}</span>
                                ${totalPending > 0 ? '<span class="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>' : ''}
                            </div>
                            <div class="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                                <span>Ver cola de traducción</span>
                                <i data-lucide="arrow-right" class="w-3 h-3"></i>
                            </div>
                        </div>

                        <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                            <div class="flex items-center justify-between text-slate-500 mb-2">
                                <span class="text-xs font-semibold uppercase tracking-wider">Solo en Español</span>
                                <i data-lucide="languages" class="w-4 h-4 text-slate-400"></i>
                            </div>
                            <div class="text-2xl font-bold text-slate-600">${esOnlyCount}</div>
                            <div class="text-xs text-slate-400 mt-1">Pendiente generar EN</div>
                        </div>
                    </div>

                    <!-- Barra de Búsqueda y Filtros de Países -->
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div class="relative w-full sm:w-80">
                                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
                                <input 
                                    type="text" 
                                    id="input-country-search" 
                                    placeholder="Buscar país (ej. Argentina, México)..." 
                                    value="${searchQuery}"
                                    class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                            </div>

                            <div class="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                <button data-filter="todos" class="filter-btn px-3 py-1.5 text-xs font-medium rounded-lg transition ${currentFilter === 'todos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Todos (${countries.length})
                                </button>
                                <button data-filter="pendientes" class="filter-btn px-3 py-1.5 text-xs font-medium rounded-lg transition ${currentFilter === 'pendientes' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Con pendientes (${partialCount})
                                </button>
                                <button data-filter="sincronizados" class="filter-btn px-3 py-1.5 text-xs font-medium rounded-lg transition ${currentFilter === 'sincronizados' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Sincronizados (${syncedCount})
                                </button>
                                <button data-filter="solo-es" class="filter-btn px-3 py-1.5 text-xs font-medium rounded-lg transition ${currentFilter === 'solo-es' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Solo Español (${esOnlyCount})
                                </button>
                            </div>
                        </div>

                        <!-- Grid de Países -->
                        <div id="countries-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            ${this.renderCountryCards(countries, enPaisSet, pendingCounts)}
                        </div>
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();
            this.bindEvents(container);
        },

        renderCountryCards(countries, enPaisSet, pendingCounts) {
            const query = searchQuery.toLowerCase().trim();

            const filtered = countries.filter(c => {
                const matchSearch = !query || c.name.toLowerCase().includes(query) || (c.displayName && c.displayName.toLowerCase().includes(query));
                if (!matchSearch) return false;

                const hasEN = enPaisSet.has(c.name);
                const hasPending = (pendingCounts[c.name] || 0) > 0;

                if (currentFilter === 'pendientes') return hasPending;
                if (currentFilter === 'sincronizados') return hasEN && !hasPending;
                if (currentFilter === 'solo-es') return !hasEN;
                return true;
            });

            if (filtered.length === 0) {
                return `
                    <div class="col-span-full py-12 text-center text-slate-400">
                        <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                        <p class="text-sm">No se encontraron países con los criterios seleccionados.</p>
                    </div>
                `;
            }

            return filtered.map(c => {
                const hasEN = enPaisSet.has(c.name);
                const pending = pendingCounts[c.name] || 0;

                let badgeHtml = '';
                if (pending > 0) {
                    badgeHtml = `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            ${pending} pendiente${pending > 1 ? 's' : ''}
                        </span>
                    `;
                } else if (hasEN) {
                    badgeHtml = `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
                            Sincronizado
                        </span>
                    `;
                } else {
                    badgeHtml = `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Solo Español
                        </span>
                    `;
                }

                return `
                    <div class="bg-slate-50/50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition group">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">${this.getFlagEmoji(c.flagCode)}</span>
                                <div>
                                    <h3 class="font-bold text-slate-800 group-hover:text-blue-600 transition text-base">
                                        ${c.name}
                                    </h3>
                                    <span class="text-xs text-slate-500">${c.displayName || c.name} · ${c.region}</span>
                                </div>
                            </div>
                            ${badgeHtml}
                        </div>

                        <div class="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs gap-2">
                            <button 
                                data-action="edit-country" 
                                data-country="${c.name}"
                                class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                            >
                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                                <span>Editar Ficha</span>
                            </button>

                            <button 
                                data-action="resources-country" 
                                data-country="${c.name}"
                                title="Gestionar normativas y enlaces asociados"
                                class="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium rounded-lg transition"
                            >
                                <i data-lucide="link" class="w-3.5 h-3.5"></i>
                            </button>

                            ${(window.AdminAuth?.canViewAudit() && !window.AdminAuth?.isEditor()) ? `
                            <button 
                                data-action="audit-country" 
                                data-country="${c.name}"
                                title="Ver historial de auditoría de este país"
                                class="px-2.5 py-2 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 font-medium rounded-lg transition"
                            >
                                <i data-lucide="history" class="w-3.5 h-3.5"></i>
                            </button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        },

        getFlagEmoji(countryCode) {
            if (!countryCode) return '🌐';
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        },

        bindEvents(container) {
            // Search input
            const searchInput = container.querySelector('#input-country-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    this.updateGrid(container);
                });
            }

            // Filter buttons
            container.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentFilter = btn.getAttribute('data-filter');
                    container.querySelectorAll('.filter-btn').forEach(b => {
                        b.className = `filter-btn px-3 py-1.5 text-xs font-medium rounded-lg transition ${b.getAttribute('data-filter') === currentFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
                    });
                    this.updateGrid(container);
                });
            });

            // Refresh button
            container.querySelector('#btn-refresh-dashboard')?.addEventListener('click', () => {
                this.render(container);
            });

            // Pending queue card click
            container.querySelector('#card-pending-queue')?.addEventListener('click', () => {
                if (window.AdminApp) window.AdminApp.navigate('translations');
            });

            // Open Gemini API settings
            container.querySelector('#btn-open-api-settings')?.addEventListener('click', () => {
                if (window.AdminApp) window.AdminApp.showSettingsModal();
            });

            // Country actions
            container.addEventListener('click', (e) => {
                const editBtn = e.target.closest('[data-action="edit-country"]');
                if (editBtn) {
                    const country = editBtn.getAttribute('data-country');
                    if (window.AdminApp) window.AdminApp.navigate('editor', { country });
                    return;
                }

                const resBtn = e.target.closest('[data-action="resources-country"]');
                if (resBtn) {
                    const country = resBtn.getAttribute('data-country');
                    if (window.AdminApp) window.AdminApp.navigate('resources', { country });
                    return;
                }

                const auditBtn = e.target.closest('[data-action="audit-country"]');
                if (auditBtn) {
                    const country = auditBtn.getAttribute('data-country');
                    if (window.AdminApp) window.AdminApp.navigate('audit', { country });
                    return;
                }
            });
        },

        async updateGrid(container) {
            const gridContainer = container.querySelector('#countries-grid-container');
            if (!gridContainer) return;

            const overview = await window.AdminAPI.getCountriesOverview();
            const countries = window.COUNTRIES_LIST || [];
            const enPaisSet = new Set(overview.countriesEN || []);
            const pendingCounts = overview.pendingCounts || {};

            gridContainer.innerHTML = this.renderCountryCards(countries, enPaisSet, pendingCounts);
            if (window.lucide) window.lucide.createIcons();
        }
    };

    window.AdminDashboard = AdminDashboard;
})();
