// admin/translations.js — Panel de Revisión y Aprobación de Traducciones
(function() {
    let currentStatus = 'pendiente';
    let currentCountry = 'todos';
    let queueItems = [];

    const AdminTranslations = {
        async render(container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-slate-600 font-medium">Cargando cola de traducciones...</span>
                </div>
            `;

            try {
                queueItems = await window.AdminAPI.getTranslationQueue('todos');
                this.renderContent(container);
            } catch (err) {
                console.error('[AdminTranslations] Error:', err);
                container.innerHTML = `
                    <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <h3 class="font-bold text-lg mb-2">Error al cargar la cola de traducciones</h3>
                        <p class="text-sm">${err.message || err}</p>
                    </div>
                `;
            }
        },

        renderContent(container) {
            const countries = window.COUNTRIES_LIST || [];

            // Filter items
            const filtered = queueItems.filter(item => {
                const matchStatus = currentStatus === 'todos' || item.estado === currentStatus;
                const matchCountry = currentCountry === 'todos' || item.pais === currentCountry;
                return matchStatus && matchCountry;
            });

            const pendingTotal = queueItems.filter(i => i.estado === 'pendiente').length;

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded">
                                    Control Editorial
                                </span>
                                <span class="text-xs text-slate-400">·</span>
                                <span class="text-xs text-slate-500">${pendingTotal} pendiente${pendingTotal !== 1 ? 's' : ''} de revisión</span>
                            </div>
                            <h1 class="text-xl font-bold text-slate-800 mt-1">Cola de Traducciones y Novedades Normativas</h1>
                            <p class="text-xs text-slate-500 mt-0.5">
                                Revise, ajuste o apruebe las sugerencias de traducción generadas automáticamente por IA antes de su publicación.
                            </p>
                        </div>

                        <div class="flex items-center gap-2">
                            <button id="btn-refresh-queue" class="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                <span>Refrescar</span>
                            </button>
                        </div>
                    </div>

                    <!-- Filtros -->
                    <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                        <div class="flex items-center gap-2 w-full md:w-auto">
                            <label class="text-xs font-semibold text-slate-600">Estado:</label>
                            <div class="flex items-center gap-1">
                                <button data-status="pendiente" class="status-tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg transition ${currentStatus === 'pendiente' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Pendientes (${pendingTotal})
                                </button>
                                <button data-status="aprobado" class="status-tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg transition ${currentStatus === 'aprobado' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Aprobadas
                                </button>
                                <button data-status="descartado" class="status-tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg transition ${currentStatus === 'descartado' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Descartadas
                                </button>
                                <button data-status="todos" class="status-tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg transition ${currentStatus === 'todos' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                    Todas
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 w-full md:w-auto">
                            <label class="text-xs font-semibold text-slate-600">País:</label>
                            <select id="select-queue-country" class="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="todos">Todos los países</option>
                                ${countries.map(c => `
                                    <option value="${c.name}" ${c.name === currentCountry ? 'selected' : ''}>
                                        ${c.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Lista de Sugerencias -->
                    <div class="space-y-4" id="queue-items-container">
                        ${this.renderQueueItems(filtered)}
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();
            this.bindEvents(container);
        },

        renderQueueItems(items) {
            if (items.length === 0) {
                return `
                    <div class="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <i data-lucide="check-check" class="w-6 h-6 text-slate-400"></i>
                        </div>
                        <h3 class="font-bold text-slate-700 text-base mb-1">No hay traducciones en esta vista</h3>
                        <p class="text-xs text-slate-500 max-w-sm mx-auto">
                            ${currentStatus === 'pendiente' ? '¡Excelente! Todas las traducciones generadas han sido aprobadas o descartadas.' : 'No se encontraron registros con los filtros seleccionados.'}
                        </p>
                    </div>
                `;
            }

            return items.map(item => {
                const isPending = item.estado === 'pendiente';
                const isApproved = item.estado === 'aprobado' || item.estado === 'editado';
                const isDiscarded = item.estado === 'descartado';

                const sourceFlag = item.idioma_origen === 'es' ? '🇪🇸' : '🇺🇸';
                const targetFlag = item.idioma_destino === 'en' ? '🇺🇸' : '🇪🇸';

                const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('es-AR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                }) : 'Reciente';

                // Human readable field
                let fieldLabel = item.campo || '';
                let qKey = '';
                let sectionNum = 1;
                if (fieldLabel.startsWith('q_')) {
                    const parts = fieldLabel.replace('q_', '').split('_');
                    qKey = `${parts[0]}.${parts[1]}`;
                    sectionNum = parseInt(parts[0], 10) || 1;
                    const questionTitle = window.QUESTIONS?.[qKey] || '';
                    fieldLabel = questionTitle ? `Pregunta ${qKey}: ${questionTitle}` : `Pregunta ${qKey}`;
                }

                return `
                    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden" id="queue-card-${item.id}">
                        <!-- Item Header -->
                        <div class="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <span class="text-xl">🌐</span>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-slate-800 text-sm">${item.pais}</span>
                                        <span class="text-xs text-slate-400">·</span>
                                        <span class="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">${fieldLabel}</span>
                                    </div>
                                    <span class="text-[11px] text-slate-400">Generado el ${dateStr}</span>
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    isPending ? 'bg-amber-100 text-amber-800' :
                                    isApproved ? 'bg-emerald-100 text-emerald-800' :
                                    'bg-slate-200 text-slate-700'
                                }">
                                    ${item.estado}
                                </span>
                            </div>
                        </div>

                        <!-- Side by Side Content -->
                        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <!-- Source Text -->
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <span>${sourceFlag} Texto Original (${item.idioma_origen?.toUpperCase()})</span>
                                </div>
                                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                                    ${item.texto_origen || '<span class="text-slate-400 italic">(Vacío)</span>'}
                                </div>
                            </div>

                            <!-- Target Suggestion (Editable) -->
                            <div class="space-y-2">
                                <div class="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <span>${targetFlag} Sugerencia de Traducción (${item.idioma_destino?.toUpperCase()})</span>
                                    <span class="text-[11px] text-indigo-600 font-normal">✨ IA Asistida</span>
                                </div>
                                <textarea 
                                    id="queue-text-${item.id}" 
                                    rows="6" 
                                    ${!isPending ? 'readonly' : ''}
                                    placeholder="Ingrese o genere la traducción correspondiente..."
                                    class="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!isPending ? 'bg-slate-50' : 'bg-white'}"
                                >${item.traduccion_sugerida || ''}</textarea>
                            </div>
                        </div>

                        <!-- Actions Bar -->
                        <div class="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-2">
                                <button 
                                    data-action="open-in-editor"
                                    data-country="${item.pais}"
                                    data-section="${sectionNum}"
                                    class="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1.5"
                                    title="Abrir este país y sección en el Editor Bilingüe"
                                >
                                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                                    <span>Abrir en Editor</span>
                                </button>
                                ${isPending ? `
                                    <button 
                                        data-action="discard-queue-item" 
                                        data-id="${item.id}"
                                        class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                    >
                                        Descartar
                                    </button>
                                ` : ''}
                            </div>

                            ${isPending ? `
                                <div class="flex items-center gap-2">
                                    <button 
                                        data-action="translate-queue-ai" 
                                        data-id="${item.id}"
                                        class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
                                    >
                                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                                        <span>Generar con IA</span>
                                    </button>
                                    <button 
                                        data-action="approve-queue-item" 
                                        data-id="${item.id}"
                                        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
                                    >
                                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                                        <span>Aprobar y Publicar en Base</span>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        },

        bindEvents(container) {
            // Status tabs
            container.querySelectorAll('.status-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentStatus = btn.getAttribute('data-status');
                    this.render(container);
                });
            });

            // Country filter
            container.querySelector('#select-queue-country')?.addEventListener('change', (e) => {
                currentCountry = e.target.value;
                this.render(container);
            });

            // Refresh button
            container.querySelector('#btn-refresh-queue')?.addEventListener('click', () => {
                this.render(container);
            });

            // Action: Open in Editor
            container.querySelectorAll('[data-action="open-in-editor"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const country = btn.getAttribute('data-country');
                    const section = parseInt(btn.getAttribute('data-section'), 10) || 1;
                    if (window.AdminApp) {
                        window.AdminApp.navigate('editor', { country, section });
                    }
                });
            });

            // Action: Generate translation with Gemini
            container.querySelectorAll('[data-action="translate-queue-ai"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const item = queueItems.find(q => String(q.id) === String(id));
                    if (!item) return;

                    const originalBtnHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Traduciendo...</span>`;
                    if (window.lucide) window.lucide.createIcons();

                    try {
                        const res = await window.AdminAPI.translateWithGemini({
                            text: item.texto_origen,
                            sourceLang: item.idioma_origen,
                            targetLang: item.idioma_destino,
                            existingTargetText: item.texto_anterior,
                            context: `Traducción regulatoria de ${item.campo} para ${item.pais}`
                        });

                        const textInput = container.querySelector(`#queue-text-${id}`);
                        if (textInput) textInput.value = res.translatedText;
                        item.traduccion_sugerida = res.translatedText;

                        if (window.AdminApp) {
                            window.AdminApp.showToast('✨ Traducción generada con Gemini. Revise y haga clic en Aprobar.', 'success');
                        }
                    } catch (err) {
                        console.error('[AdminTranslations] Gemini error:', err);
                        if (window.AdminApp) {
                            window.AdminApp.showToast(`Error al traducir: ${err.message || err}`, 'error');
                        }
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalBtnHtml;
                        if (window.lucide) window.lucide.createIcons();
                    }
                });
            });

            // Action: Approve
            container.querySelectorAll('[data-action="approve-queue-item"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const textInput = container.querySelector(`#queue-text-${id}`);
                    const newText = textInput ? textInput.value : undefined;

                    btn.disabled = true;
                    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Aprobando...</span>`;

                    try {
                        const user = window.AdminAuth.getCurrentUser();
                        await window.AdminAPI.updateQueueItem({
                            id,
                            estado: 'aprobado',
                            textoAprobado: newText,
                            usuario: user
                        });

                        if (window.AdminApp) {
                            window.AdminApp.showToast('✅ Traducción aprobada y publicada exitosamente', 'success');
                            window.AdminApp.refreshPendingCounter();
                        }
                        this.render(container);
                    } catch (err) {
                        console.error('[AdminTranslations] Approve error:', err);
                        if (window.AdminApp) {
                            window.AdminApp.showToast(`Error al aprobar: ${err.message || err}`, 'error');
                        }
                        btn.disabled = false;
                        btn.innerHTML = `<span>Aprobar y Publicar en Base</span>`;
                    }
                });
            });

            // Action: Discard
            container.querySelectorAll('[data-action="discard-queue-item"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    try {
                        const user = window.AdminAuth.getCurrentUser();
                        await window.AdminAPI.updateQueueItem({
                            id,
                            estado: 'descartado',
                            usuario: user
                        });

                        if (window.AdminApp) {
                            window.AdminApp.showToast('Sugerencia descartada', 'info');
                            window.AdminApp.refreshPendingCounter();
                        }
                        this.render(container);
                    } catch (err) {
                        console.error('[AdminTranslations] Discard error:', err);
                    }
                });
            });
        }
    };

    window.AdminTranslations = AdminTranslations;
})();
