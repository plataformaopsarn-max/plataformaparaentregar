// admin/backups.js — Módulo de Copias de Seguridad y Puntos de Restauración (Disaster Recovery & Rollback)
(function() {
    let pendingAction = null;
    let uploadedBackupData = null;

    const AdminBackups = {
        async render(container) {
            container.innerHTML = `
                <div class="space-y-6 max-w-6xl mx-auto">
                    <!-- Encabezado Institucional -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                                    Disaster Recovery & Rollback
                                </span>
                                <span class="text-xs text-slate-400">Exclusivo Administrador</span>
                            </div>
                            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Copias de Seguridad y Puntos de Restauración</h1>
                            <p class="text-xs text-slate-500 mt-1">
                                Exporte respaldos de la base de producción o restaure versiones previas oficiales de GitHub de forma global o quirúrgica por país.
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="btn-export-full-db" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs shadow-blue-600/20">
                                <i data-lucide="download" class="w-4 h-4"></i>
                                <span>Descargar Respaldo Completo (JSON)</span>
                            </button>
                        </div>
                    </div>

                    <!-- Alerta de Advertencia Institucional -->
                    <div class="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3">
                        <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5"></i>
                        <div class="text-xs text-amber-900 space-y-1">
                            <p class="font-bold">Protocolo de Integridad y Protección de Datos:</p>
                            <p class="text-amber-800/90 leading-relaxed">
                                Las acciones de restauración sobrescriben los registros correspondientes en la base de datos de producción de Supabase. Antes de aplicar cualquier cambio, el sistema tomará un <strong>snapshot automático de seguridad</strong> en su navegador y le solicitará una confirmación explícita mediante palabra clave (<code class="bg-amber-200/60 px-1 py-0.5 rounded font-mono font-bold">RESTAURAR</code>). Todas las operaciones quedan registradas inmutablemente en el log de auditoría.
                            </p>
                        </div>
                    </div>

                    <!-- Grid Principal: 2 Columnas -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        <!-- COLUMNA 1: Rollback Granular por País (Recomendado) -->
                        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
                            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <h2 class="text-sm font-bold text-slate-800">Restauración Granular por País</h2>
                                    <p class="text-[11px] text-slate-400">Revierta un país específico al baseline de GitHub sin alterar el resto de la base</p>
                                </div>
                            </div>

                            <form id="form-restore-country" class="space-y-4 text-xs">
                                <div>
                                    <label class="block font-semibold text-slate-700 mb-1.5">Seleccionar País a Restaurar</label>
                                    <select id="select-restore-country" required class="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                        <option value="">-- Elija un país --</option>
                                        ${(window.COUNTRIES_LIST || []).map(c => `
                                            <option value="${c.name}">${c.name} ${c.displayName ? `(${c.displayName})` : ''}</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <div>
                                    <label class="block font-semibold text-slate-700 mb-1.5">Alcance Idiomático</label>
                                    <div class="grid grid-cols-3 gap-2">
                                        <label class="p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 flex items-center gap-2">
                                            <input type="radio" name="country-lang-scope" value="both" checked class="text-blue-600 focus:ring-blue-500">
                                            <span class="font-medium">Ambos (ES+EN)</span>
                                        </label>
                                        <label class="p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 flex items-center gap-2">
                                            <input type="radio" name="country-lang-scope" value="faq_rows_corregido" class="text-blue-600 focus:ring-blue-500">
                                            <span class="font-medium">Solo 🇪🇸 ES</span>
                                        </label>
                                        <label class="p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 flex items-center gap-2">
                                            <input type="radio" name="country-lang-scope" value="faq_rows_corregido_en" class="text-blue-600 focus:ring-blue-500">
                                            <span class="font-medium">Solo 🇺🇸 EN</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                                    <div class="flex items-center gap-1.5 font-semibold text-slate-700">
                                        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                                        <span>Garantía de Aislamiento:</span>
                                    </div>
                                    <p>Esta acción solo sobrescribirá las 38 preguntas regulatorias del país seleccionado utilizando la versión oficial del repositorio de GitHub. Los otros 21 países permanecerán inalterados.</p>
                                </div>

                                <button type="submit" id="btn-submit-country-restore" class="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs">
                                    <i data-lucide="rotate-ccw" class="w-4 h-4 text-amber-400"></i>
                                    <span>Restaurar Ficha de País al Baseline</span>
                                </button>
                            </form>
                        </div>

                        <!-- COLUMNA 2: Puntos de Restauración Oficiales de GitHub -->
                        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
                            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <i data-lucide="git-branch" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <h2 class="text-sm font-bold text-slate-800">Snapshots Oficiales (GitHub Baseline)</h2>
                                    <p class="text-[11px] text-slate-400">Archivos maestros sincronizados con el repositorio oficial de entrega</p>
                                </div>
                            </div>

                            <div class="space-y-2.5 text-xs">
                                <!-- Snapshot 1: FAQ Español -->
                                <div class="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition">
                                    <div>
                                        <div class="font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>🇪🇸 faq_rows_corregido.json</span>
                                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">22 Países</span>
                                        </div>
                                        <div class="text-[11px] text-slate-500 mt-0.5">Matriz regulatoria completa en Español (38 preguntas)</div>
                                    </div>
                                    <button data-action="restore-baseline-table" data-file="faq_rows_corregido.json" data-table="faq_rows_corregido" class="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3 text-red-500"></i>
                                        <span>Restaurar</span>
                                    </button>
                                </div>

                                <!-- Snapshot 2: FAQ Inglés -->
                                <div class="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition">
                                    <div>
                                        <div class="font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>🇺🇸 faq_rows_corregido_en.json</span>
                                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">22 Países</span>
                                        </div>
                                        <div class="text-[11px] text-slate-500 mt-0.5">Matriz regulatoria completa en Inglés (38 preguntas)</div>
                                    </div>
                                    <button data-action="restore-baseline-table" data-file="faq_rows_corregido_en.json" data-table="faq_rows_corregido_en" class="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3 text-red-500"></i>
                                        <span>Restaurar</span>
                                    </button>
                                </div>

                                <!-- Snapshot 3: Enlaces y Normativas -->
                                <div class="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition">
                                    <div>
                                        <div class="font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>📚 enlaces.json</span>
                                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">Biblioteca</span>
                                        </div>
                                        <div class="text-[11px] text-slate-500 mt-0.5">Leyes, decretos y fuentes oficiales de los 22 países</div>
                                    </div>
                                    <button data-action="restore-baseline-table" data-file="enlaces.json" data-table="enlaces" class="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3 text-red-500"></i>
                                        <span>Restaurar</span>
                                    </button>
                                </div>

                                <!-- Snapshot 4: Resumen Ejecutivo -->
                                <div class="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition">
                                    <div>
                                        <div class="font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>📑 resumen_ejecutivo.json</span>
                                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">Resúmenes</span>
                                        </div>
                                        <div class="text-[11px] text-slate-500 mt-0.5">Fichas ejecutivas resumidas de cada marco nacional</div>
                                    </div>
                                    <button data-action="restore-baseline-table" data-file="resumen_ejecutivo.json" data-table="resumen_ejecutivo" class="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3 text-red-500"></i>
                                        <span>Restaurar</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- SECCIÓN INFERIOR: Descarga de Tablas Individuales y Subida de Archivo JSON Local -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        <!-- Exportación por Tabla -->
                        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
                            <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <i data-lucide="file-down" class="w-4 h-4 text-blue-600"></i>
                                <h3 class="font-bold text-slate-800">Descarga Individual de Tablas</h3>
                            </div>
                            <p class="text-slate-500 text-[11px]">Exporte tablas puntuales en formato JSON para análisis externo o resguardo local:</p>
                            <div class="grid grid-cols-2 gap-2">
                                <button data-action="download-single" data-table="faq_rows_corregido" class="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-left font-medium transition flex items-center justify-between">
                                    <span>Matriz 🇪🇸 (ES)</span>
                                    <i data-lucide="download" class="w-3 h-3"></i>
                                </button>
                                <button data-action="download-single" data-table="faq_rows_corregido_en" class="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-left font-medium transition flex items-center justify-between">
                                    <span>Matriz 🇺🇸 (EN)</span>
                                    <i data-lucide="download" class="w-3 h-3"></i>
                                </button>
                                <button data-action="download-single" data-table="enlaces" class="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-left font-medium transition flex items-center justify-between">
                                    <span>Normativas y Enlaces</span>
                                    <i data-lucide="download" class="w-3 h-3"></i>
                                </button>
                                <button data-action="download-single" data-table="resumen_ejecutivo" class="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-left font-medium transition flex items-center justify-between">
                                    <span>Resúmenes Ejecutivos</span>
                                    <i data-lucide="download" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Subir Archivo de Respaldo Local -->
                        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
                            <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <i data-lucide="upload-cloud" class="w-4 h-4 text-blue-600"></i>
                                <h3 class="font-bold text-slate-800">Cargar Archivo de Respaldo (.json)</h3>
                            </div>
                            <p class="text-slate-500 text-[11px]">Si descargó previamente un respaldo, arrastre o seleccione el archivo para validarlo y restaurarlo:</p>

                            <div id="drop-zone" class="border-2 border-dashed border-slate-200 hover:border-blue-400 p-5 rounded-2xl text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/30">
                                <input type="file" id="input-backup-file" accept=".json" class="hidden">
                                <i data-lucide="file-json" class="w-8 h-8 text-slate-400 mx-auto mb-2"></i>
                                <div class="font-semibold text-slate-700">Haga clic o arrastre un archivo .json aquí</div>
                                <div class="text-[11px] text-slate-400 mt-0.5">Compatible con backups completos o tablas individuales exportadas</div>
                            </div>

                            <div id="upload-preview" class="hidden p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                                <div class="flex items-center justify-between">
                                    <div class="font-bold text-blue-900" id="upload-file-name">archivo.json</div>
                                    <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-200 text-blue-800" id="upload-file-size">0 KB</span>
                                </div>
                                <div class="text-[11px] text-blue-700" id="upload-file-summary">Contenido detectado...</div>
                                <button id="btn-apply-uploaded-backup" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-2">
                                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                                    <span>Continuar con la Restauración de este Archivo</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- MODAL DE DOBLE CONFIRMACIÓN DE SEGURIDAD -->
                <div id="backup-confirm-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
                    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-5">
                        <div class="text-center space-y-2">
                            <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                                <i data-lucide="alert-octagon" class="w-6 h-6"></i>
                            </div>
                            <h3 class="text-base font-bold text-slate-900">Confirmación de Restauración</h3>
                            <p class="text-xs text-slate-500 leading-relaxed" id="confirm-modal-description">
                                Está a punto de sobrescribir información en la base de producción.
                            </p>
                        </div>

                        <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                            <div class="font-bold flex items-center gap-1.5">
                                <i data-lucide="info" class="w-3.5 h-3.5 text-red-600"></i>
                                <span>Operación a Ejecutar:</span>
                            </div>
                            <div id="confirm-modal-target" class="font-mono text-[11px] text-red-900 font-semibold">...</div>
                        </div>

                        <div class="space-y-1.5 text-xs">
                            <label class="block font-semibold text-slate-700">
                                Para confirmar, escriba la palabra <span class="text-red-600 font-mono font-bold tracking-wider">RESTAURAR</span>:
                            </label>
                            <input 
                                type="text" 
                                id="input-confirm-word" 
                                placeholder="Escriba RESTAURAR" 
                                class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                            >
                        </div>

                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button type="button" id="btn-cancel-restore" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                                Cancelar
                            </button>
                            <button type="button" id="btn-confirm-execute-restore" disabled class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition opacity-50 cursor-not-allowed flex items-center gap-1.5 shadow-sm">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                <span>Ejecutar Restauración</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            this.bindEvents(container);
            if (window.lucide) window.lucide.createIcons();
        },

        bindEvents(container) {
            // 1. Export Full Database
            container.querySelector('#btn-export-full-db')?.addEventListener('click', async () => {
                const btn = container.querySelector('#btn-export-full-db');
                btn.disabled = true;
                btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Generando respaldo consolidado...`;

                try {
                    const dump = await window.AdminAPI.exportFullDatabase();
                    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const dateStr = new Date().toISOString().split('T')[0];
                    a.href = url;
                    a.download = `regia_backup_completo_${dateStr}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    window.AdminApp?.showToast('Respaldo consolidado descargado exitosamente', 'success');
                } catch (err) {
                    console.error(err);
                    window.AdminApp?.showToast('Error al exportar base de datos: ' + (err.message || err), 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i><span>Descargar Respaldo Completo (JSON)</span>`;
                    if (window.lucide) window.lucide.createIcons();
                }
            });

            // 2. Download Single Table
            container.querySelectorAll('button[data-action="download-single"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const table = btn.getAttribute('data-table');
                    btn.disabled = true;
                    try {
                        const data = await window.AdminAPI.fetchTableData(table);
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        const dateStr = new Date().toISOString().split('T')[0];
                        a.href = url;
                        a.download = `${table}_${dateStr}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        window.AdminApp?.showToast(`Tabla ${table} descargada (${data.length} registros)`, 'success');
                    } catch (err) {
                        window.AdminApp?.showToast('Error al descargar tabla: ' + (err.message || err), 'error');
                    } finally {
                        btn.disabled = false;
                    }
                });
            });

            // 3. Restore Country Form
            container.querySelector('#form-restore-country')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const country = container.querySelector('#select-restore-country')?.value;
                const scope = container.querySelector('input[name="country-lang-scope"]:checked')?.value || 'both';

                if (!country) {
                    window.AdminApp?.showToast('Por favor seleccione un país', 'warning');
                    return;
                }

                const scopeLabel = scope === 'both' ? 'Ambos idiomas (ES + EN)' : (scope === 'faq_rows_corregido' ? 'Solo Español (ES)' : 'Solo Inglés (EN)');

                this.openConfirmModal({
                    type: 'country',
                    country,
                    scope,
                    description: `Se revertirán las 38 preguntas del perfil de ${country} al baseline oficial de GitHub en ${scopeLabel}.`,
                    target: `País: ${country} | Alcance: ${scopeLabel}`
                });
            });

            // 4. Restore Baseline Table Button
            container.querySelectorAll('button[data-action="restore-baseline-table"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const file = btn.getAttribute('data-file');
                    const table = btn.getAttribute('data-table');

                    this.openConfirmModal({
                        type: 'baseline_table',
                        file,
                        table,
                        description: `Se sobrescribirá la tabla completa "${table}" con los datos maestros del archivo oficial "${file}".`,
                        target: `Tabla: ${table} | Fuente: GitHub Baseline (${file})`
                    });
                });
            });

            // 5. File Upload & Drop Zone
            const dropZone = container.querySelector('#drop-zone');
            const fileInput = container.querySelector('#input-backup-file');

            dropZone?.addEventListener('click', () => fileInput?.click());
            dropZone?.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
            });
            dropZone?.addEventListener('dragleave', () => {
                dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
            });
            dropZone?.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
                if (e.dataTransfer.files?.length > 0) {
                    this.handleUploadedFile(e.dataTransfer.files[0], container);
                }
            });
            fileInput?.addEventListener('change', () => {
                if (fileInput.files?.length > 0) {
                    this.handleUploadedFile(fileInput.files[0], container);
                }
            });

            // Apply Uploaded Backup Button
            container.querySelector('#btn-apply-uploaded-backup')?.addEventListener('click', () => {
                if (!uploadedBackupData) return;

                if (uploadedBackupData.isFull) {
                    this.openConfirmModal({
                        type: 'uploaded_full',
                        data: uploadedBackupData.data,
                        description: `Se restaurarán todas las tablas contenidas en el respaldo consolidado "${uploadedBackupData.fileName}".`,
                        target: `Respaldo Completo (${Object.keys(uploadedBackupData.data.tables || {}).join(', ')})`
                    });
                } else {
                    this.openConfirmModal({
                        type: 'uploaded_single',
                        data: uploadedBackupData.data,
                        table: uploadedBackupData.detectedTable,
                        description: `Se restaurará la tabla "${uploadedBackupData.detectedTable}" con ${uploadedBackupData.data.length} registros del archivo cargado.`,
                        target: `Tabla: ${uploadedBackupData.detectedTable} (${uploadedBackupData.data.length} registros)`
                    });
                }
            });

            // 6. Confirm Modal Controls
            const modal = container.querySelector('#backup-confirm-modal');
            const inputConfirm = container.querySelector('#input-confirm-word');
            const btnConfirmExecute = container.querySelector('#btn-confirm-execute-restore');

            inputConfirm?.addEventListener('input', () => {
                const val = inputConfirm.value.trim().toUpperCase();
                if (val === 'RESTAURAR') {
                    btnConfirmExecute.disabled = false;
                    btnConfirmExecute.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    btnConfirmExecute.disabled = true;
                    btnConfirmExecute.classList.add('opacity-50', 'cursor-not-allowed');
                }
            });

            container.querySelector('#btn-cancel-restore')?.addEventListener('click', () => {
                modal?.classList.add('hidden');
                pendingAction = null;
            });

            btnConfirmExecute?.addEventListener('click', async () => {
                if (!pendingAction) return;
                await this.executeRestore(pendingAction, container);
            });
        },

        handleUploadedFile(file, container) {
            const preview = container.querySelector('#upload-preview');
            const fileNameEl = container.querySelector('#upload-file-name');
            const fileSizeEl = container.querySelector('#upload-file-size');
            const fileSummaryEl = container.querySelector('#upload-file-summary');

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    let isFull = false;
                    let detectedTable = null;

                    if (json && json.tables && typeof json.tables === 'object') {
                        isFull = true;
                        const tableNames = Object.keys(json.tables);
                        const count = tableNames.reduce((acc, t) => acc + (json.tables[t]?.length || 0), 0);
                        fileSummaryEl.textContent = `Respaldo Consolidado Válido: ${tableNames.length} tablas (${count} registros totales).`;
                    } else if (Array.isArray(json) && json.length > 0) {
                        const first = json[0];
                        if (first.q_1_1_directa && first.pais) {
                            detectedTable = 'faq_rows_corregido';
                        } else if (first.enlace && first.titulo) {
                            detectedTable = 'enlaces';
                        } else if (first.proposito_descripcion_en) {
                            detectedTable = 'enlaces_descripcion_en';
                        } else if (first.resumen_es || first.resumen_en) {
                            detectedTable = 'resumen_ejecutivo';
                        } else {
                            detectedTable = 'faq_rows_corregido';
                        }
                        fileSummaryEl.textContent = `Tabla detectada: "${detectedTable}" con ${json.length} registros.`;
                    } else {
                        throw new Error('El archivo no posee el formato de respaldo estructurado de REGIA.');
                    }

                    uploadedBackupData = {
                        fileName: file.name,
                        isFull,
                        detectedTable,
                        data: json
                    };

                    fileNameEl.textContent = file.name;
                    fileSizeEl.textContent = `${Math.round(file.size / 1024)} KB`;
                    preview.classList.remove('hidden');
                    window.AdminApp?.showToast('Archivo de respaldo verificado correctamente', 'info');
                } catch (err) {
                    console.error(err);
                    window.AdminApp?.showToast('Error al leer archivo JSON: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        },

        openConfirmModal(action) {
            pendingAction = action;
            const modal = document.getElementById('backup-confirm-modal');
            const desc = document.getElementById('confirm-modal-description');
            const target = document.getElementById('confirm-modal-target');
            const input = document.getElementById('input-confirm-word');
            const btn = document.getElementById('btn-confirm-execute-restore');

            if (desc) desc.textContent = action.description;
            if (target) target.textContent = action.target;
            if (input) input.value = '';
            if (btn) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            }

            modal?.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
            input?.focus();
        },

        async executeRestore(action, container) {
            const btn = container.querySelector('#btn-confirm-execute-restore');
            const modal = container.querySelector('#backup-confirm-modal');

            btn.disabled = true;
            btn.innerHTML = `<span class="animate-spin mr-1">⏳</span> Restaurando en producción...`;

            try {
                // 1. Auto-salvaguarda previa al vuelo
                try {
                    const currentDump = await window.AdminAPI.exportFullDatabase();
                    localStorage.setItem('regia_safety_snapshot_' + Date.now(), JSON.stringify(currentDump));
                } catch (_) {}

                // 2. Ejecutar según el tipo de acción
                if (action.type === 'country') {
                    await window.AdminAPI.restoreCountryFromBaseline(action.country, action.scope);
                    window.AdminApp?.showToast(`Ficha de ${action.country} restaurada exitosamente al baseline oficial`, 'success');
                } else if (action.type === 'baseline_table') {
                    const data = await window.AdminAPI.loadBaselineJson(action.file);
                    const res = await window.AdminAPI.restoreTableData(action.table, data);
                    window.AdminApp?.showToast(`Tabla ${action.table} restaurada (${res.count} registros)`, 'success');
                } else if (action.type === 'uploaded_single') {
                    const res = await window.AdminAPI.restoreTableData(action.table, action.data);
                    window.AdminApp?.showToast(`Tabla ${action.table} restaurada desde archivo (${res.count} registros)`, 'success');
                } else if (action.type === 'uploaded_full') {
                    const tables = action.data.tables || {};
                    let totalCount = 0;
                    for (const t of Object.keys(tables)) {
                        if (Array.isArray(tables[t]) && tables[t].length > 0) {
                            const res = await window.AdminAPI.restoreTableData(t, tables[t]);
                            totalCount += res.count;
                        }
                    }
                    window.AdminApp?.showToast(`Respaldo consolidado restaurado (${totalCount} registros en total)`, 'success');
                }

                modal?.classList.add('hidden');
                pendingAction = null;
            } catch (err) {
                console.error(err);
                window.AdminApp?.showToast('Error durante la restauración: ' + (err.message || err), 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i><span>Ejecutar Restauración</span>`;
                if (window.lucide) window.lucide.createIcons();
            }
        }
    };

    window.AdminBackups = AdminBackups;
})();
