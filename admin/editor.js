// admin/editor.js — Editor Bilingüe Side-by-Side con Sincronización Bidireccional (ES ⇄ EN)
(function() {
    let currentCountry = 'Argentina';
    let currentSection = 1;
    let countryData = { es: {}, en: {}, resumen: {} };
    let dirtyFields = new Set();

    const AdminEditor = {
        async render(container, params = {}) {
            if (params.country) currentCountry = params.country;
            if (params.section) currentSection = parseInt(params.section, 10);

            container.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-slate-600 font-medium">Cargando ficha de ${currentCountry}...</span>
                </div>
            `;

            try {
                countryData = await window.AdminAPI.getCountryDetail(currentCountry);
                dirtyFields.clear();
                this.renderContent(container);
            } catch (err) {
                console.error('[AdminEditor] Error:', err);
                container.innerHTML = `
                    <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <h3 class="font-bold text-lg mb-2">Error al cargar la ficha de ${currentCountry}</h3>
                        <p class="text-sm">${err.message || err}</p>
                        <button onclick="window.AdminApp.navigate('dashboard')" class="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
                            Volver al Dashboard
                        </button>
                    </div>
                `;
            }
        },

        renderContent(container) {
            const categories = window.CATEGORIES || [];
            const questions = window.QUESTIONS || {};
            const noBoolean = window.NO_BOOLEAN_QUESTIONS || ['1.1', '1.2', '1.3', '3.7'];
            const countries = window.COUNTRIES_LIST || [];

            // Filter questions for the active category
            const categoryQuestions = Object.keys(questions).filter(qKey => {
                const secNum = parseInt(qKey.split('.')[0], 10);
                return secNum === currentSection;
            });

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Top Bar: Selector de país y navegación rápida -->
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                        <div class="flex items-center gap-3">
                            <button id="btn-back-dashboard" class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition" title="Volver al Dashboard">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Editor de Ficha Regulatoria</span>
                                    <span class="text-xs text-slate-400">·</span>
                                    <span class="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
                                        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                                        Sincronización Bidireccional Activa (ES ⇄ EN)
                                    </span>
                                </div>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <select id="select-country-switch" class="text-lg font-bold text-slate-800 bg-transparent border-0 border-b-2 border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none cursor-pointer py-0.5">
                                        ${countries.map(c => `
                                            <option value="${c.name}" ${c.name === currentCountry ? 'selected' : ''}>
                                                ${c.name} (${c.displayName || c.name})
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <button id="btn-go-resources" class="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition">
                                <i data-lucide="link" class="w-3.5 h-3.5"></i>
                                <span>Normativas y Enlaces</span>
                            </button>
                            <span id="editor-save-indicator" class="text-xs text-slate-400 font-medium px-2 py-1">
                                ● Cambios sincronizados
                            </span>
                        </div>
                    </div>

                    <!-- Category Tabs -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                        ${categories.filter(c => c.id <= 6).map(cat => `
                            <button 
                                data-cat-id="${cat.id}"
                                class="category-tab px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition flex items-center gap-2 ${cat.id === currentSection ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'}"
                            >
                                <span>${cat.id}. ${cat.name}</span>
                            </button>
                        `).join('')}
                    </div>

                    <!-- Side-by-Side Questions Area -->
                    <div class="space-y-8">
                        ${categoryQuestions.map(qKey => this.renderQuestionCard(qKey, questions[qKey], noBoolean)).join('')}
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();
            this.bindEvents(container);
        },

        renderQuestionCard(qKey, questionTitle, noBoolean) {
            const colPrefix = `q_${qKey.replace('.', '_')}`;
            const isNoBool = noBoolean.includes(qKey);

            const esDirecta = countryData.es[`${colPrefix}_directa`] || '';
            const esAmpliada = countryData.es[`${colPrefix}_ampliada`] || '';
            const esFuente = countryData.es[`${colPrefix}_fuente`] || '';
            const esBool = countryData.es[`${colPrefix}_booleano`];

            const enDirecta = countryData.en[`${colPrefix}_directa`] || '';
            const enAmpliada = countryData.en[`${colPrefix}_ampliada`] || '';
            const enFuente = countryData.en[`${colPrefix}_fuente`] || '';
            const enBool = countryData.en[`${colPrefix}_booleano`];

            return `
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden" id="card-${colPrefix}">
                    <!-- Question Header con Acciones Bidireccionales -->
                    <div class="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="flex items-start gap-2.5">
                            <span class="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md font-mono mt-0.5">
                                ${qKey}
                            </span>
                            <div>
                                <h3 class="font-bold text-slate-800 text-sm md:text-base leading-snug">
                                    ${questionTitle}
                                </h3>
                            </div>
                        </div>

                        <!-- Botones de Traducción Bidireccional con IA -->
                        <div class="flex items-center gap-2">
                            <!-- ES -> EN -->
                            <button 
                                data-action="ai-translate" 
                                data-qkey="${qKey}" 
                                data-prefix="${colPrefix}"
                                data-direction="es-to-en"
                                title="Traducir de Español a Inglés (detecta cambios en español)"
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                            >
                                <span>🇪🇸 ➔ 🇺🇸</span>
                                <span>Traducir a Inglés</span>
                            </button>

                            <!-- EN -> ES -->
                            <button 
                                data-action="ai-translate" 
                                data-qkey="${qKey}" 
                                data-prefix="${colPrefix}"
                                data-direction="en-to-es"
                                title="Traducir de Inglés a Español (detecta cambios en inglés)"
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                            >
                                <span>🇺🇸 ➔ 🇪🇸</span>
                                <span>Traducir a Español</span>
                            </button>
                        </div>
                    </div>

                    <!-- Side-by-Side Editor Columns -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                        <!-- Columna Español -->
                        <div class="p-5 space-y-4 bg-white" id="col-es-${colPrefix}">
                            <!-- Alerta de novedad detectada desde Inglés (oculta por defecto) -->
                            <div id="alert-es-${colPrefix}" class="hidden p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="bell" class="w-4 h-4 text-indigo-600 shrink-0"></i>
                                    <span>Se detectó un cambio en la <strong>versión en inglés</strong>.</span>
                                </div>
                                <button data-action="ai-translate" data-qkey="${qKey}" data-prefix="${colPrefix}" data-direction="en-to-es" class="px-2 py-1 bg-indigo-600 text-white rounded text-[11px] font-bold hover:bg-indigo-700 transition">
                                    Actualizar Español con IA
                                </button>
                            </div>

                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="text-base">🇪🇸</span>
                                    <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Versión en Español</span>
                                </div>
                                ${!isNoBool ? `
                                    <div class="flex items-center gap-2 text-xs">
                                        <span class="text-slate-500 font-medium">Cumplimiento:</span>
                                        <select data-field="${colPrefix}_booleano" data-lang="es" data-qkey="${qKey}" class="input-editor-field text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 font-semibold text-slate-700">
                                            <option value="true" ${esBool === true ? 'selected' : ''}>Sí (Aplica)</option>
                                            <option value="false" ${esBool === false ? 'selected' : ''}>No (No aplica)</option>
                                            <option value="" ${esBool === null || esBool === undefined ? 'selected' : ''}>Sin definir</option>
                                        </select>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Directa ES -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">
                                    Respuesta directa (resumen ejecutivo)
                                </label>
                                <textarea 
                                    data-field="${colPrefix}_directa" 
                                    data-lang="es" 
                                    data-qkey="${qKey}"
                                    rows="2" 
                                    placeholder="Ingrese la respuesta directa en español..."
                                    class="input-editor-field w-full text-xs md:text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >${esDirecta}</textarea>
                            </div>

                            <!-- Ampliada ES -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">
                                    Respuesta ampliada y fundamentación jurídica
                                </label>
                                <textarea 
                                    data-field="${colPrefix}_ampliada" 
                                    data-lang="es" 
                                    data-qkey="${qKey}"
                                    rows="5" 
                                    placeholder="Detalle los artículos, procedimientos y condiciones específicas..."
                                    class="input-editor-field w-full text-xs md:text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >${esAmpliada}</textarea>
                            </div>

                            <!-- Fuente ES -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="block text-xs font-semibold text-slate-600">
                                        Fuente normativa oficial
                                    </label>
                                    <span class="text-[11px] text-slate-400">Citas exactas de leyes o decretos</span>
                                </div>
                                <input 
                                    type="text" 
                                    data-field="${colPrefix}_fuente" 
                                    data-lang="es" 
                                    data-qkey="${qKey}"
                                    value="${esFuente.replace(/"/g, '&quot;')}"
                                    placeholder="ej. Disposición ANMAT 7516/2025, Art. 5; Decreto 1490/1992"
                                    class="input-editor-field w-full text-xs md:text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-700"
                                >
                            </div>

                            <div class="pt-2 flex justify-end">
                                <button 
                                    data-action="save-field-group" 
                                    data-lang="es" 
                                    data-prefix="${colPrefix}"
                                    class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                                >
                                    <i data-lucide="save" class="w-3.5 h-3.5"></i>
                                    <span>Guardar Español</span>
                                </button>
                            </div>
                        </div>

                        <!-- Columna Inglés -->
                        <div class="p-5 space-y-4 bg-slate-50/40" id="col-en-${colPrefix}">
                            <!-- Alerta de novedad detectada desde Español (oculta por defecto) -->
                            <div id="alert-en-${colPrefix}" class="hidden p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="bell" class="w-4 h-4 text-blue-600 shrink-0"></i>
                                    <span>Se detectó un cambio en la <strong>versión en español</strong>.</span>
                                </div>
                                <button data-action="ai-translate" data-qkey="${qKey}" data-prefix="${colPrefix}" data-direction="es-to-en" class="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700 transition">
                                    Actualizar Inglés con IA
                                </button>
                            </div>

                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="text-base">🇺🇸</span>
                                    <span class="text-xs font-bold uppercase tracking-wider text-slate-700">English Version</span>
                                    ${!enDirecta ? `
                                        <span class="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">
                                            Sin traducción
                                        </span>
                                    ` : ''}
                                </div>
                                ${!isNoBool ? `
                                    <div class="flex items-center gap-2 text-xs">
                                        <span class="text-slate-500 font-medium">Applies:</span>
                                        <select data-field="${colPrefix}_booleano" data-lang="en" data-qkey="${qKey}" class="input-editor-field text-xs border border-slate-200 rounded px-2 py-1 bg-white font-semibold text-slate-700">
                                            <option value="true" ${enBool === true ? 'selected' : ''}>Yes</option>
                                            <option value="false" ${enBool === false ? 'selected' : ''}>No</option>
                                            <option value="" ${enBool === null || enBool === undefined ? 'selected' : ''}>Not defined</option>
                                        </select>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Directa EN -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">
                                    Direct answer (executive summary in English)
                                </label>
                                <textarea 
                                    data-field="${colPrefix}_directa" 
                                    data-lang="en" 
                                    data-qkey="${qKey}"
                                    rows="2" 
                                    placeholder="Direct answer in English..."
                                    class="input-editor-field w-full text-xs md:text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >${enDirecta}</textarea>
                            </div>

                            <!-- Ampliada EN -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">
                                    Extended explanation and legal grounds
                                </label>
                                <textarea 
                                    data-field="${colPrefix}_ampliada" 
                                    data-lang="en" 
                                    data-qkey="${qKey}"
                                    rows="5" 
                                    placeholder="Detailed regulatory analysis in English..."
                                    class="input-editor-field w-full text-xs md:text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >${enAmpliada}</textarea>
                            </div>

                            <!-- Fuente EN -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="block text-xs font-semibold text-slate-600">
                                        Source reference
                                    </label>
                                    <span class="text-[11px] text-amber-600" title="Por convención regulatoria, mantenga los nombres oficiales de leyes en español">
                                        ⚠️ Nombres de normas no se traducen
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    data-field="${colPrefix}_fuente" 
                                    data-lang="en" 
                                    data-qkey="${qKey}"
                                    value="${enFuente.replace(/"/g, '&quot;')}"
                                    placeholder="e.g., ANMAT Regulation 7516/2025, Art. 5; Decree 1490/1992"
                                    class="input-editor-field w-full text-xs md:text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono text-slate-700"
                                >
                            </div>

                            <div class="pt-2 flex justify-end">
                                <button 
                                    data-action="save-field-group" 
                                    data-lang="en" 
                                    data-prefix="${colPrefix}"
                                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                                >
                                    <i data-lucide="save" class="w-3.5 h-3.5"></i>
                                    <span>Guardar Inglés</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- AI Translation Suggestion Drawer (hidden by default) -->
                    <div id="ai-drawer-${colPrefix}" class="hidden border-t border-indigo-100 bg-indigo-50/50 p-4 transition-all">
                        <!-- Injected dynamically on AI Translate -->
                    </div>
                </div>
            `;
        },

        bindEvents(container) {
            // Country switch dropdown
            container.querySelector('#select-country-switch')?.addEventListener('change', (e) => {
                currentCountry = e.target.value;
                this.render(container, { country: currentCountry, section: currentSection });
            });

            // Back button
            container.querySelector('#btn-back-dashboard')?.addEventListener('click', () => {
                if (window.AdminApp) window.AdminApp.navigate('dashboard');
            });

            // Go to resources button
            container.querySelector('#btn-go-resources')?.addEventListener('click', () => {
                if (window.AdminApp) window.AdminApp.navigate('resources', { country: currentCountry });
            });

            // Category tabs
            container.querySelectorAll('.category-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    currentSection = parseInt(tab.getAttribute('data-cat-id'), 10);
                    this.render(container, { country: currentCountry, section: currentSection });
                });
            });

            // Track dirty changes in fields & trigger cross-language alert
            container.querySelectorAll('.input-editor-field').forEach(input => {
                input.addEventListener('input', () => {
                    const field = input.getAttribute('data-field');
                    const lang = input.getAttribute('data-lang');
                    const qKey = input.getAttribute('data-qkey');
                    const colPrefix = `q_${qKey.replace('.', '_')}`;

                    dirtyFields.add(`${lang}:${field}`);

                    // Display alert on opposite language column
                    const oppositeAlertId = lang === 'es' ? `#alert-en-${colPrefix}` : `#alert-es-${colPrefix}`;
                    const oppositeAlert = container.querySelector(oppositeAlertId);
                    if (oppositeAlert) {
                        oppositeAlert.classList.remove('hidden');
                    }

                    const ind = container.querySelector('#editor-save-indicator');
                    if (ind) {
                        ind.innerHTML = `<span class="text-amber-500 font-bold">● Cambios pendientes de guardar</span>`;
                    }
                });
            });

            // Save Field Group Button (ES or EN)
            container.querySelectorAll('[data-action="save-field-group"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const lang = btn.getAttribute('data-lang');
                    const colPrefix = btn.getAttribute('data-prefix');
                    await this.saveGroup(container, lang, colPrefix, btn);
                });
            });

            // AI Translate button (ES -> EN or EN -> ES)
            container.querySelectorAll('[data-action="ai-translate"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const qKey = btn.getAttribute('data-qkey');
                    const colPrefix = btn.getAttribute('data-prefix');
                    const direction = btn.getAttribute('data-direction') || 'es-to-en';
                    await this.handleAiTranslate(container, qKey, colPrefix, direction);
                });
            });
        },

        async saveGroup(container, lang, colPrefix, btn) {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Guardando...</span>`;
            btn.disabled = true;

            try {
                const user = window.AdminAuth.getCurrentUser();
                const card = container.querySelector(`#card-${colPrefix}`);
                if (!card) return;

                const directaInput = card.querySelector(`[data-field="${colPrefix}_directa"][data-lang="${lang}"]`);
                const ampliadaInput = card.querySelector(`[data-field="${colPrefix}_ampliada"][data-lang="${lang}"]`);
                const fuenteInput = card.querySelector(`[data-field="${colPrefix}_fuente"][data-lang="${lang}"]`);
                const boolInput = card.querySelector(`[data-field="${colPrefix}_booleano"][data-lang="${lang}"]`);

                const directaVal = directaInput ? directaInput.value : '';
                const ampliadaVal = ampliadaInput ? ampliadaInput.value : '';
                const fuenteVal = fuenteInput ? fuenteInput.value : '';
                const boolVal = boolInput && boolInput.value !== '' ? (boolInput.value === 'true') : null;

                // Save each field
                await Promise.all([
                    window.AdminAPI.saveFaqField({
                        pais: currentCountry,
                        lang,
                        field: `${colPrefix}_directa`,
                        value: directaVal,
                        user
                    }),
                    window.AdminAPI.saveFaqField({
                        pais: currentCountry,
                        lang,
                        field: `${colPrefix}_ampliada`,
                        value: ampliadaVal,
                        user
                    }),
                    window.AdminAPI.saveFaqField({
                        pais: currentCountry,
                        lang,
                        field: `${colPrefix}_fuente`,
                        value: fuenteVal,
                        user
                    }),
                    boolInput ? window.AdminAPI.saveFaqField({
                        pais: currentCountry,
                        lang,
                        field: `${colPrefix}_booleano`,
                        value: boolVal,
                        user
                    }) : Promise.resolve()
                ]);

                // Update local model
                const targetObj = lang === 'en' ? countryData.en : countryData.es;
                targetObj[`${colPrefix}_directa`] = directaVal;
                targetObj[`${colPrefix}_ampliada`] = ampliadaVal;
                targetObj[`${colPrefix}_fuente`] = fuenteVal;
                if (boolInput) targetObj[`${colPrefix}_booleano`] = boolVal;

                // Toast notification
                if (window.AdminApp) {
                    window.AdminApp.showToast(`✅ Cambios guardados para ${lang.toUpperCase()} en ${currentCountry}`, 'success');
                }

                const ind = container.querySelector('#editor-save-indicator');
                if (ind) {
                    ind.innerHTML = `<span class="text-emerald-600 font-medium">● Cambios sincronizados</span>`;
                }

            } catch (err) {
                console.error('[AdminEditor] Save error:', err);
                if (window.AdminApp) {
                    window.AdminApp.showToast(`Error al guardar: ${err.message || err}`, 'error');
                }
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                if (window.lucide) window.lucide.createIcons();
            }
        },

        async handleAiTranslate(container, qKey, colPrefix, direction = 'es-to-en') {
            const card = container.querySelector(`#card-${colPrefix}`);
            const drawer = container.querySelector(`#ai-drawer-${colPrefix}`);
            if (!card || !drawer) return;

            const isEsToEn = direction === 'es-to-en';
            const sourceLang = isEsToEn ? 'es' : 'en';
            const targetLang = isEsToEn ? 'en' : 'es';

            const sourceDirecta = card.querySelector(`[data-field="${colPrefix}_directa"][data-lang="${sourceLang}"]`)?.value || '';
            const sourceAmpliada = card.querySelector(`[data-field="${colPrefix}_ampliada"][data-lang="${sourceLang}"]`)?.value || '';
            const sourceFuente = card.querySelector(`[data-field="${colPrefix}_fuente"][data-lang="${sourceLang}"]`)?.value || '';

            const targetDirecta = card.querySelector(`[data-field="${colPrefix}_directa"][data-lang="${targetLang}"]`)?.value || '';
            const targetAmpliada = card.querySelector(`[data-field="${colPrefix}_ampliada"][data-lang="${targetLang}"]`)?.value || '';

            if (!sourceDirecta && !sourceAmpliada) {
                if (window.AdminApp) {
                    window.AdminApp.showToast(`Primero ingrese contenido en ${sourceLang === 'es' ? 'español' : 'inglés'} para traducir.`, 'warning');
                }
                return;
            }

            drawer.classList.remove('hidden');
            drawer.innerHTML = `
                <div class="flex items-center gap-3 py-4 text-indigo-700">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span class="text-xs font-semibold">
                        Gemini está analizando la versión en ${sourceLang === 'es' ? 'español' : 'inglés'} y generando la traducción técnica hacia ${targetLang === 'es' ? 'español' : 'inglés'}...
                    </span>
                </div>
            `;

            try {
                // Translate Directa
                const resDirecta = await window.AdminAPI.translateWithGemini({
                    text: sourceDirecta,
                    sourceLang,
                    targetLang,
                    existingTargetText: targetDirecta,
                    context: `Pregunta regulatoria ${qKey}: respuesta directa de ${currentCountry}`
                });

                // Translate Ampliada
                const resAmpliada = await window.AdminAPI.translateWithGemini({
                    text: sourceAmpliada,
                    sourceLang,
                    targetLang,
                    existingTargetText: targetAmpliada,
                    context: `Pregunta regulatoria ${qKey}: respuesta ampliada y fundamentación legal de ${currentCountry}`
                });

                const sourceFlag = isEsToEn ? '🇪🇸' : '🇺🇸';
                const targetFlag = isEsToEn ? '🇺🇸' : '🇪🇸';

                // Render Suggestion Drawer
                drawer.innerHTML = `
                    <div class="space-y-3 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded">
                                    ✨ Sugerencia Asistida por IA (${sourceFlag} ${sourceLang.toUpperCase()} ➔ ${targetFlag} ${targetLang.toUpperCase()})
                                </span>
                                <span class="text-xs text-slate-500">${resDirecta.engine || 'Gemini 3.6 Flash'}</span>
                            </div>
                            <button data-action="close-drawer" class="text-slate-400 hover:text-slate-600">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>

                        <!-- Novedad detectada -->
                        <div class="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                            <strong>Análisis de novedades:</strong> ${resDirecta.detectedNovelty || 'Actualización de contenido detectada'}
                        </div>

                        <!-- Previsualización editable -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                                <span class="font-bold text-slate-700 block mb-1">Respuesta Directa (${targetLang.toUpperCase()} sugerida):</span>
                                <textarea id="sug-directa-${colPrefix}" rows="2" class="w-full p-2 border border-slate-200 rounded bg-slate-50 text-slate-800">${resDirecta.translatedText}</textarea>
                            </div>
                            <div>
                                <span class="font-bold text-slate-700 block mb-1">Respuesta Ampliada (${targetLang.toUpperCase()} sugerida):</span>
                                <textarea id="sug-ampliada-${colPrefix}" rows="4" class="w-full p-2 border border-slate-200 rounded bg-slate-50 text-slate-800">${resAmpliada.translatedText}</textarea>
                            </div>
                        </div>

                        <!-- Botones de Acción -->
                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button data-action="discard-ai" class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                Descartar
                            </button>
                            <button data-action="queue-ai" class="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition shadow-xs">
                                Enviar a Cola de Revisión
                            </button>
                            <button data-action="apply-ai-direct" class="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs flex items-center gap-1.5">
                                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                                <span>Aprobar y Aplicar a ${targetLang === 'es' ? 'Español' : 'Inglés'}</span>
                            </button>
                        </div>
                    </div>
                `;

                if (window.lucide) window.lucide.createIcons();

                // Explicitly set values in case of special characters
                const sugDirectaEl = drawer.querySelector(`#sug-directa-${colPrefix}`);
                const sugAmpliadaEl = drawer.querySelector(`#sug-ampliada-${colPrefix}`);
                if (sugDirectaEl) sugDirectaEl.value = resDirecta.translatedText || '';
                if (sugAmpliadaEl) sugAmpliadaEl.value = resAmpliada.translatedText || '';

                // Drawer Actions
                drawer.querySelector('[data-action="close-drawer"]')?.addEventListener('click', () => {
                    drawer.classList.add('hidden');
                });

                drawer.querySelector('[data-action="discard-ai"]')?.addEventListener('click', () => {
                    drawer.classList.add('hidden');
                });

                // Send to Translation Queue
                drawer.querySelector('[data-action="queue-ai"]')?.addEventListener('click', async () => {
                    const finalDirecta = drawer.querySelector(`#sug-directa-${colPrefix}`)?.value;
                    const finalAmpliada = drawer.querySelector(`#sug-ampliada-${colPrefix}`)?.value;
                    const targetTable = targetLang === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';

                    await window.AdminAPI.addToTranslationQueue({
                        pais: currentCountry,
                        tabla: targetTable,
                        campo: `${colPrefix}_directa`,
                        idioma_origen: sourceLang,
                        idioma_destino: targetLang,
                        texto_origen: sourceDirecta,
                        traduccion_sugerida: finalDirecta
                    });

                    await window.AdminAPI.addToTranslationQueue({
                        pais: currentCountry,
                        tabla: targetTable,
                        campo: `${colPrefix}_ampliada`,
                        idioma_origen: sourceLang,
                        idioma_destino: targetLang,
                        texto_origen: sourceAmpliada,
                        traduccion_sugerida: finalAmpliada
                    });

                    drawer.classList.add('hidden');
                    if (window.AdminApp) {
                        window.AdminApp.showToast(`Sugerencia enviada a la Cola de Revisión de ${currentCountry}`, 'info');
                    }
                });

                // Apply Directly to Target Language Inputs & Save
                drawer.querySelector('[data-action="apply-ai-direct"]')?.addEventListener('click', async () => {
                    const finalDirecta = drawer.querySelector(`#sug-directa-${colPrefix}`)?.value;
                    const finalAmpliada = drawer.querySelector(`#sug-ampliada-${colPrefix}`)?.value;

                    const targetDirectaInput = card.querySelector(`[data-field="${colPrefix}_directa"][data-lang="${targetLang}"]`);
                    const targetAmpliadaInput = card.querySelector(`[data-field="${colPrefix}_ampliada"][data-lang="${targetLang}"]`);
                    const targetFuenteInput = card.querySelector(`[data-field="${colPrefix}_fuente"][data-lang="${targetLang}"]`);

                    if (targetDirectaInput) targetDirectaInput.value = finalDirecta;
                    if (targetAmpliadaInput) targetAmpliadaInput.value = finalAmpliada;
                    if (targetFuenteInput && !targetFuenteInput.value) targetFuenteInput.value = sourceFuente;

                    drawer.classList.add('hidden');

                    // Hide any cross-language alert that was showing
                    const alertEl = container.querySelector(targetLang === 'es' ? `#alert-es-${colPrefix}` : `#alert-en-${colPrefix}`);
                    if (alertEl) alertEl.classList.add('hidden');

                    // Trigger save of target language group
                    const saveBtn = card.querySelector(`[data-action="save-field-group"][data-lang="${targetLang}"]`);
                    if (saveBtn) await this.saveGroup(container, targetLang, colPrefix, saveBtn);
                });

            } catch (err) {
                console.error('[AdminEditor] AI Translate error:', err);
                if (err.message === 'MISSING_API_KEY') {
                    drawer.innerHTML = `
                        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                            <span>Se requiere configurar una clave de Google Gemini API para traducciones automáticas.</span>
                            <button onclick="window.AdminApp.showSettingsModal()" class="px-3 py-1 bg-amber-700 text-white rounded font-semibold text-xs">Configurar Clave</button>
                        </div>
                    `;
                } else {
                    drawer.innerHTML = `
                        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                            Error en traducción con IA: ${err.message || err}
                        </div>
                    `;
                }
            }
        }
    };

    window.AdminEditor = AdminEditor;
})();
