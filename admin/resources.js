// admin/resources.js — Gestión de Normativas, Formularios y Enlaces Oficiales (Sección 7)
(function() {
    let currentCountry = 'Argentina';
    let countryResources = [];

    const AdminResources = {
        async render(container, params = {}) {
            if (params.country) currentCountry = params.country;

            container.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-slate-600 font-medium">Cargando recursos y enlaces de ${currentCountry}...</span>
                </div>
            `;

            try {
                countryResources = await window.AdminAPI.getCountryEnlaces(currentCountry);
                this.renderContent(container);
            } catch (err) {
                console.error('[AdminResources] Error:', err);
                container.innerHTML = `
                    <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <h3 class="font-bold text-lg mb-2">Error al cargar recursos</h3>
                        <p class="text-sm">${err.message || err}</p>
                    </div>
                `;
            }
        },

        renderContent(container) {
            const countries = window.COUNTRIES_LIST || [];
            const subcategories = [
                { code: '7.1', title: 'Normativas clave de referencia rápida', enTitle: 'Key regulations' },
                { code: '7.2', title: 'Formularios oficiales', enTitle: 'Official forms' },
                { code: '7.3', title: 'Guías, instructivos oficiales y web', enTitle: 'Guidelines and instructions' }
            ];

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Top Bar -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div class="flex items-center gap-3">
                            <button id="btn-back-dashboard-res" class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition" title="Volver al Dashboard">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Biblioteca Normativa (Sección 7)</span>
                                    <span class="text-xs text-slate-400">·</span>
                                    <span class="text-xs text-slate-500">${countryResources.length} recursos cargados</span>
                                </div>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <select id="select-res-country" class="text-lg font-bold text-slate-800 bg-transparent border-0 border-b-2 border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none cursor-pointer py-0.5">
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
                            <button id="btn-add-resource" class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition shadow-xs">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                                <span>Agregar Nuevo Recurso</span>
                            </button>
                        </div>
                    </div>

                    <!-- Groups by 7.1, 7.2, 7.3 -->
                    <div class="space-y-6">
                        ${subcategories.map(sub => {
                            const items = countryResources.filter(r => String(r.question_code).trim() === sub.code);
                            return `
                                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                                    <div class="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="px-2.5 py-1 bg-blue-100 text-blue-800 font-mono text-xs font-bold rounded">
                                                ${sub.code}
                                            </span>
                                            <div>
                                                <h3 class="font-bold text-slate-800 text-sm">${sub.title}</h3>
                                                <span class="text-[11px] text-slate-400">${sub.enTitle}</span>
                                            </div>
                                        </div>
                                        <span class="text-xs text-slate-500 font-medium">
                                            ${items.length} documento${items.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <div class="divide-y divide-slate-100">
                                        ${items.length > 0 ? items.map(item => this.renderResourceRow(item)).join('') : `
                                            <div class="p-6 text-center text-xs text-slate-400">
                                                No hay recursos registrados en esta categoría para ${currentCountry}.
                                            </div>
                                        `}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Modal para Crear / Editar Recurso -->
                <div id="resource-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
                    <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 id="modal-title" class="font-bold text-slate-800 text-base">Nuevo Recurso</h3>
                            <button id="btn-close-modal" class="text-slate-400 hover:text-slate-600">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <form id="resource-form" class="space-y-4 text-xs">
                            <input type="hidden" id="form-res-id" value="">

                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">Categoría</label>
                                <select id="form-res-category" class="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium">
                                    <option value="7.1">7.1 — Normativas clave de referencia rápida</option>
                                    <option value="7.2">7.2 — Formularios oficiales</option>
                                    <option value="7.3">7.3 — Guías, instructivos oficiales y web</option>
                                </select>
                            </div>

                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">
                                    Título Oficial de la Norma (Español)
                                </label>
                                <input type="text" id="form-res-title" required placeholder="ej. Disposición ANMAT 7516/2025" class="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-mono">
                                <p class="text-[11px] text-slate-400 mt-1">El título oficial no se traduce para mantener concordancia con las fuentes.</p>
                            </div>

                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">Enlace Oficial (URL)</label>
                                <input type="url" id="form-res-url" required placeholder="https://..." class="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800">
                            </div>

                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="block font-semibold text-slate-700">Propósito / Descripción (Español)</label>
                                    <button type="button" id="btn-translate-purpose" class="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 text-[11px]">
                                        <i data-lucide="sparkles" class="w-3 h-3"></i>
                                        <span>Traducir al inglés con IA (ES ➔ EN)</span>
                                    </button>
                                </div>
                                <textarea id="form-res-desc-es" rows="3" placeholder="Describe brevemente el alcance de esta normativa o formulario..." class="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800"></textarea>
                            </div>

                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="block font-semibold text-slate-700">Purpose / Description (English)</label>
                                    <button type="button" id="btn-translate-purpose-to-es" class="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 text-[11px]">
                                        <i data-lucide="sparkles" class="w-3 h-3"></i>
                                        <span>Traducir al español con IA (EN ➔ ES)</span>
                                    </button>
                                </div>
                                <textarea id="form-res-desc-en" rows="3" placeholder="English description for international researchers..." class="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800"></textarea>
                            </div>

                            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button type="button" id="btn-cancel-modal" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs">Guardar Recurso</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();
            this.bindEvents(container);
        },

        renderResourceRow(item) {
            return `
                <div class="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="space-y-1.5 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-800 text-sm font-mono">${item.titulo || '(Sin título)'}</span>
                            ${item.enlace ? `
                                <a href="${item.enlace}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 inline-flex items-center" title="Abrir enlace externo">
                                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                                </a>
                            ` : ''}
                        </div>

                        <!-- Descripciones ES / EN -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div class="text-slate-600">
                                <span class="font-semibold text-slate-500">🇪🇸 ES:</span> ${item.proposito_descripcion || '<span class="text-slate-400 italic">Sin descripción</span>'}
                            </div>
                            <div class="text-slate-600">
                                <span class="font-semibold text-slate-500">🇺🇸 EN:</span> ${item.proposito_descripcion_en || '<span class="text-amber-600 italic">Falta traducción</span>'}
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <button 
                            data-action="edit-res" 
                            data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}'
                            class="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar recurso"
                        >
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button 
                            data-action="delete-res" 
                            data-id="${item.id}"
                            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar recurso"
                        >
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        },

        bindEvents(container) {
            // Country switcher
            container.querySelector('#select-res-country')?.addEventListener('change', (e) => {
                currentCountry = e.target.value;
                this.render(container, { country: currentCountry });
            });

            // Back button
            container.querySelector('#btn-back-dashboard-res')?.addEventListener('click', () => {
                if (window.AdminApp) window.AdminApp.navigate('dashboard');
            });

            // Add Resource Button
            const modal = container.querySelector('#resource-modal');
            container.querySelector('#btn-add-resource')?.addEventListener('click', () => {
                this.openModal(container, null);
            });

            // Close Modal
            container.querySelector('#btn-close-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
            container.querySelector('#btn-cancel-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));

            // Edit Resource Action
            container.querySelectorAll('[data-action="edit-res"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const itemData = JSON.parse(btn.getAttribute('data-item'));
                    this.openModal(container, itemData);
                });
            });

            // Delete Resource Action
            container.querySelectorAll('[data-action="delete-res"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (!confirm('¿Está seguro de eliminar este recurso normativo?')) return;

                    try {
                        await window.AdminAPI.deleteEnlace(id);
                        if (window.AdminApp) window.AdminApp.showToast('Recurso eliminado', 'info');
                        this.render(container);
                    } catch (err) {
                        alert('Error al eliminar: ' + err.message);
                    }
                });
            });

            // Translate Purpose Button in Modal (ES -> EN)
            container.querySelector('#btn-translate-purpose')?.addEventListener('click', async () => {
                const descEs = container.querySelector('#form-res-desc-es')?.value;
                if (!descEs) {
                    alert('Escriba una descripción en español primero');
                    return;
                }

                const descEnInput = container.querySelector('#form-res-desc-en');
                const btn = container.querySelector('#btn-translate-purpose');
                btn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i><span>Traduciendo...</span>`;

                try {
                    const res = await window.AdminAPI.translateWithGemini({
                        text: descEs,
                        sourceLang: 'es',
                        targetLang: 'en',
                        context: `Descripción del propósito de una normativa de ensayos clínicos en ${currentCountry}`
                    });
                    if (descEnInput) descEnInput.value = res.translatedText;
                } catch (err) {
                    alert('Error en traducción: ' + err.message);
                } finally {
                    btn.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3"></i><span>Traducir al inglés con IA (ES ➔ EN)</span>`;
                    if (window.lucide) window.lucide.createIcons();
                }
            });

            // Translate Purpose Button in Modal (EN -> ES)
            container.querySelector('#btn-translate-purpose-to-es')?.addEventListener('click', async () => {
                const descEn = container.querySelector('#form-res-desc-en')?.value;
                if (!descEn) {
                    alert('Escriba una descripción en inglés primero');
                    return;
                }

                const descEsInput = container.querySelector('#form-res-desc-es');
                const btn = container.querySelector('#btn-translate-purpose-to-es');
                btn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i><span>Traduciendo...</span>`;

                try {
                    const res = await window.AdminAPI.translateWithGemini({
                        text: descEn,
                        sourceLang: 'en',
                        targetLang: 'es',
                        context: `Regulatory purpose description for clinical trials in ${currentCountry}`
                    });
                    if (descEsInput) descEsInput.value = res.translatedText;
                } catch (err) {
                    alert('Error en traducción: ' + err.message);
                } finally {
                    btn.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3"></i><span>Traducir al español con IA (EN ➔ ES)</span>`;
                    if (window.lucide) window.lucide.createIcons();
                }
            });

            // Form Submit
            container.querySelector('#resource-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();

                const id = container.querySelector('#form-res-id')?.value;
                const question_code = container.querySelector('#form-res-category')?.value;
                const titulo = container.querySelector('#form-res-title')?.value;
                const enlace = container.querySelector('#form-res-url')?.value;
                const proposito_descripcion = container.querySelector('#form-res-desc-es')?.value;
                const proposito_descripcion_en = container.querySelector('#form-res-desc-en')?.value;

                try {
                    await window.AdminAPI.saveEnlace({
                        id: id ? parseInt(id, 10) : null,
                        pais: currentCountry,
                        question_code,
                        titulo,
                        enlace,
                        proposito_descripcion,
                        proposito_descripcion_en
                    });

                    modal?.classList.add('hidden');
                    if (window.AdminApp) window.AdminApp.showToast('Recurso guardado exitosamente', 'success');
                    this.render(container);
                } catch (err) {
                    alert('Error al guardar recurso: ' + err.message);
                }
            });
        },

        openModal(container, item) {
            const modal = container.querySelector('#resource-modal');
            const title = container.querySelector('#modal-title');

            if (item) {
                title.textContent = 'Editar Recurso Normativo';
                container.querySelector('#form-res-id').value = item.id || '';
                container.querySelector('#form-res-category').value = item.question_code || '7.1';
                container.querySelector('#form-res-title').value = item.titulo || '';
                container.querySelector('#form-res-url').value = item.enlace || '';
                container.querySelector('#form-res-desc-es').value = item.proposito_descripcion || '';
                container.querySelector('#form-res-desc-en').value = item.proposito_descripcion_en || '';
            } else {
                title.textContent = 'Nuevo Recurso Normativo';
                container.querySelector('#form-res-id').value = '';
                container.querySelector('#form-res-category').value = '7.1';
                container.querySelector('#form-res-title').value = '';
                container.querySelector('#form-res-url').value = '';
                container.querySelector('#form-res-desc-es').value = '';
                container.querySelector('#form-res-desc-en').value = '';
            }

            modal?.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        }
    };

    window.AdminResources = AdminResources;
})();
