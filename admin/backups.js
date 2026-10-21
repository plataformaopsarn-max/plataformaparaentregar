// admin/backups.js — Módulo de Copias de Seguridad y Puntos de Restauración (Disaster Recovery & Rollback)
(function() {
    let pendingAction = null;
    let uploadedBackupData = null;
    let availableSnapshots = [];
    let currentPreviewData = null;
    let previewFilter = 'all'; // 'all' | 'diff'
    let previewSearchQuery = '';

    const AdminBackups = {
        async render(container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-24 space-y-3">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="text-slate-600 text-xs font-semibold tracking-wide">Cargando puntos de restauración y copias de seguridad...</span>
                </div>
            `;

            try {
                availableSnapshots = await window.AdminAPI.getAvailableSnapshots();
            } catch (err) {
                console.warn('[AdminBackups] Error cargando snapshots:', err);
                availableSnapshots = [
                    { sha: 'main', shortSha: 'main', date: 'Actual', formattedDate: '📌 Versión más reciente (Main - Actual)', message: 'Última versión disponible en repositorio' }
                ];
            }

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
                                Exporte respaldos en caliente o revierta fichas normativas a fechas históricas oficiales de GitHub con previsualización previa.
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
                                Las acciones de restauración sobrescriben los registros correspondientes en Supabase. Cuenta con un <strong>motor de previsualización previa</strong> para cotejar las respuestas antes de restaurar, un <strong>snapshot preventivo automático</strong> que se descargará en su equipo y confirmación obligatoria mediante palabra clave (<code class="bg-amber-200/60 px-1 py-0.5 rounded font-mono font-bold">RESTAURAR</code>).
                            </p>
                        </div>
                    </div>

                    <!-- Grid Principal: 2 Columnas -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        <!-- COLUMNA 1: Rollback Granular por País (Con Selección de Fecha y Previsualización) -->
                        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
                            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <h2 class="text-sm font-bold text-slate-800">Restauración Granular por País</h2>
                                    <p class="text-[11px] text-slate-400">Revierta un país a una fecha de respaldo específica sin alterar los otros 21 países</p>
                                </div>
                            </div>

                            <form id="form-restore-country" class="space-y-4 text-xs">
                                <div>
                                    <label class="block font-semibold text-slate-700 mb-1.5">1. Seleccionar País a Restaurar</label>
                                    <select id="select-restore-country" required class="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                        <option value="">-- Elija un país --</option>
                                        ${(window.COUNTRIES_LIST || []).map(c => `
                                            <option value="${c.name}">${c.name} ${c.displayName ? '(' + c.displayName + ')' : ''}</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <div>
                                    <label class="block font-semibold text-slate-700 mb-1.5">2. Seleccionar Fecha del Respaldo (GitHub Snapshot)</label>
                                    <select id="select-country-snapshot" class="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                        ${availableSnapshots.map((s, idx) => `
                                            <option value="${s.sha}" ${idx === 0 ? 'selected' : ''}>${s.formattedDate} — ${s.message}</option>
                                        `).join('')}
                                    </select>
                                    <p class="text-[10px] text-slate-400 mt-1">Puede elegir entre la versión actual de GitHub o cualquier copia automática previa con su fecha exacta.</p>
                                </div>

                                <div>
                                    <label class="block font-semibold text-slate-700 mb-1.5">3. Alcance Idiomático</label>
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
                                    <p>Esta acción solo sobrescribirá las 38 preguntas del país seleccionado. Los otros 21 países en producción permanecerán 100% inalterados.</p>
                                </div>

                                <!-- Botones de Acción: Previsualizar vs Restaurar -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    <button type="button" id="btn-preview-country-diff" class="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold transition flex items-center justify-center gap-2">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                        <span>Previsualizar y Comparar</span>
                                    </button>
                                    <button type="submit" id="btn-submit-country-restore" class="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs">
                                        <i data-lucide="rotate-ccw" class="w-4 h-4 text-amber-400"></i>
                                        <span>Restaurar Ficha</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- COLUMNA 2: Puntos de Restauración por Tabla Completa -->
                        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
                            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <i data-lucide="git-branch" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <h2 class="text-sm font-bold text-slate-800">Restauración de Tablas Maestras</h2>
                                    <p class="text-[11px] text-slate-400">Restituya tablas completas al baseline oficial del repositorio</p>
                                </div>
                            </div>

                            <div class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-semibold text-slate-700 mb-1.5">Fecha del Respaldo para Tablas</label>
                                    <select id="select-table-snapshot" class="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none">
                                        ${availableSnapshots.map((s, idx) => `
                                            <option value="${s.sha}" ${idx === 0 ? 'selected' : ''}>${s.formattedDate} — ${s.message}</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <div class="space-y-2.5 pt-1">
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

                        <!-- Carga de Respaldo Local (JSON) -->
                        <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
                            <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <i data-lucide="upload-cloud" class="w-4 h-4 text-indigo-600"></i>
                                <h3 class="font-bold text-slate-800">Restauración desde Archivo Local (.json)</h3>
                            </div>
                            <p class="text-slate-500 text-[11px]">Cargue un respaldo JSON exportado previamente para restaurar datos en el servidor:</p>

                            <div id="dropzone-backup-file" class="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2">
                                <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                                    <i data-lucide="file-up" class="w-5 h-5"></i>
                                </div>
                                <div class="space-y-0.5">
                                    <p class="font-semibold text-slate-700">Arrastre aquí su archivo .json o haga clic</p>
                                    <p class="text-[10px] text-slate-400">Admite backups de tabla única o paquetes completos generados por este panel</p>
                                </div>
                                <input type="file" id="input-backup-file" accept=".json,application/json" class="hidden">
                            </div>

                            <!-- Preview del archivo cargado -->
                            <div id="container-uploaded-preview" class="hidden p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                                        <span id="uploaded-filename" class="font-bold text-slate-800">archivo.json</span>
                                    </div>
                                    <span id="uploaded-file-stats" class="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-md">Validado</span>
                                </div>
                                <div id="uploaded-file-details" class="text-[11px] text-slate-500"></div>
                                <div class="pt-1 flex justify-end gap-2">
                                    <button id="btn-cancel-uploaded" class="px-3 py-1.5 text-slate-500 hover:text-slate-700 font-medium">Descartar</button>
                                    <button id="btn-apply-uploaded" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-xs">
                                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                        <span>Restaurar desde este Archivo</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- MODAL 1: Previsualización e Inspección Previa de Contenido (Preview & Diff) -->
                <div id="modal-preview-country-backup" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-3 sm:p-4">
                    <div class="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <!-- Header del Modal -->
                        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                    <i data-lucide="eye" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h3 id="preview-modal-title" class="text-base font-bold text-slate-900">Inspección Previa del Respaldo</h3>
                                    <p id="preview-modal-subtitle" class="text-xs text-slate-500">Coteje el contenido del backup con la versión actual en producción antes de restaurar</p>
                                </div>
                            </div>
                            <button type="button" id="btn-close-preview-modal" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <!-- Barra de Métricas y Filtros -->
                        <div class="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                            <!-- Métricas de Diff -->
                            <div class="flex items-center gap-2 text-xs">
                                <span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold flex items-center gap-1.5">
                                    <span>Total:</span>
                                    <span id="preview-stat-total">38 Preguntas</span>
                                </span>
                                <span id="preview-stat-diff-badge" class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center gap-1.5">
                                    <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-amber-600"></i>
                                    <span id="preview-stat-diff">0 con diferencias</span>
                                </span>
                                <span id="preview-stat-identical-badge" class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold flex items-center gap-1.5">
                                    <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i>
                                    <span id="preview-stat-identical">38 idénticas</span>
                                </span>
                            </div>

                            <!-- Filtros y Buscador -->
                            <div class="flex items-center gap-2 text-xs">
                                <div class="relative">
                                    <input type="text" id="input-preview-search" placeholder="Buscar pregunta..." class="pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56">
                                    <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"></i>
                                </div>
                                <div class="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                                    <button type="button" id="btn-filter-preview-diff" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white text-slate-800 shadow-xs transition">Con Cambios</button>
                                    <button type="button" id="btn-filter-preview-all" class="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded-lg transition">Todas</button>
                                </div>
                            </div>
                        </div>

                        <!-- Contenedor Scrolleable de Preguntas y Comparativa -->
                        <div id="preview-questions-list" class="flex-1 overflow-y-auto p-6 space-y-4 text-xs divide-y divide-slate-100">
                            <!-- Renderizado dinámicamente -->
                        </div>

                        <!-- Footer del Modal -->
                        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                            <div class="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <i data-lucide="info" class="w-4 h-4 text-blue-600 shrink-0"></i>
                                <span>Los datos a restaurar provienen directamente del histórico de GitHub. Al proceder se creará un snapshot preventivo.</span>
                            </div>
                            <div class="flex items-center justify-end gap-2">
                                <button type="button" id="btn-dismiss-preview" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition">
                                    Cerrar Previsualización
                                </button>
                                <button type="button" id="btn-proceed-restore-from-preview" class="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm">
                                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-amber-400"></i>
                                    <span>Proceder a Restaurar esta Versión</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL 2: Doble Confirmación de Restauración y Palabra Clave -->
                <div id="modal-confirm-restore" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <i data-lucide="alert-octagon" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-slate-900">Confirmación de Restauración Crítica</h3>
                                <p class="text-xs text-red-600 font-medium">Esta acción sobrescribirá datos en producción</p>
                            </div>
                        </div>

                        <div class="p-3.5 bg-red-50/80 border border-red-200/80 rounded-2xl text-xs text-red-900 space-y-2">
                            <p id="confirm-restore-summary" class="font-semibold leading-relaxed">
                                Resumen de la acción a ejecutar...
                            </p>
                            <p class="text-[11px] text-red-700 leading-normal">
                                ✅ <strong>Snapshot Preventivo:</strong> Antes de aplicar la reversión, el sistema descargará automáticamente en su navegador un respaldo con el estado actual que está a punto de ser reemplazado.
                            </p>
                        </div>

                        <div class="space-y-2 text-xs">
                            <label class="block font-bold text-slate-700">
                                Para confirmar la operación, escriba exactamente <code class="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-red-600">RESTAURAR</code>:
                            </label>
                            <input 
                                type="text" 
                                id="input-confirm-keyword" 
                                placeholder="Escriba RESTAURAR en mayúsculas" 
                                class="w-full p-2.5 border-2 border-slate-200 focus:border-red-500 focus:ring-0 rounded-xl text-center font-mono font-bold uppercase tracking-widest text-slate-800"
                                autocomplete="off"
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
                        a.download = `regia_tabla_${table}_${dateStr}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        window.AdminApp?.showToast(`Tabla ${table} descargada exitosamente`, 'success');
                    } catch (err) {
                        console.error(err);
                        window.AdminApp?.showToast('Error al descargar tabla: ' + (err.message || err), 'error');
                    } finally {
                        btn.disabled = false;
                    }
                });
            });

            // 3. Previsualizar y Comparar Contenido del País antes de Restaurar
            container.querySelector('#btn-preview-country-diff')?.addEventListener('click', async () => {
                const country = container.querySelector('#select-restore-country')?.value;
                const commitSha = container.querySelector('#select-country-snapshot')?.value || 'main';
                const scopeEl = container.querySelector('input[name="country-lang-scope"]:checked');
                const scope = scopeEl ? scopeEl.value : 'both';
                const lang = scope === 'faq_rows_corregido_en' ? 'en' : 'es';

                if (!country) {
                    window.AdminApp?.showToast('Por favor, seleccione un país para previsualizar', 'warning');
                    return;
                }

                const btn = container.querySelector('#btn-preview-country-diff');
                btn.disabled = true;
                btn.innerHTML = `<span class="animate-spin mr-1.5">⏳</span> Analizando...`;

                try {
                    const preview = await window.AdminAPI.previewCountryBaseline(country, commitSha, lang);
                    currentPreviewData = preview;
                    currentPreviewData.scope = scope;
                    this.renderPreviewModal(preview);
                } catch (err) {
                    console.error(err);
                    window.AdminApp?.showToast('Error al previsualizar respaldo: ' + (err.message || err), 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = `<i data-lucide="eye" class="w-4 h-4"></i><span>Previsualizar y Comparar</span>`;
                    if (window.lucide) window.lucide.createIcons();
                }
            });

            // 4. Submit Restauración Granular por País
            container.querySelector('#form-restore-country')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const country = container.querySelector('#select-restore-country')?.value;
                const commitSha = container.querySelector('#select-country-snapshot')?.value || 'main';
                const scope = container.querySelector('input[name="country-lang-scope"]:checked')?.value || 'both';

                const snapshotObj = availableSnapshots.find(s => s.sha === commitSha);
                const snapshotLabel = snapshotObj ? snapshotObj.formattedDate : commitSha.slice(0, 7);

                if (!country) {
                    window.AdminApp?.showToast('Por favor, seleccione un país', 'warning');
                    return;
                }

                const scopeText = scope === 'both' ? 'en Español e Inglés' : (scope === 'faq_rows_corregido' ? 'solo en Español' : 'solo en Inglés');
                this.requestConfirmation({
                    type: 'country_rollback',
                    country,
                    scope,
                    commitSha,
                    snapshotLabel,
                    summary: `Se revertirán las 38 preguntas regulatorias de <strong>${country}</strong> (${scopeText}) al respaldo oficial del repositorio: <br><span class="text-blue-700 font-bold">${snapshotLabel}</span>.`
                });
            });

            // 5. Proceder a Restaurar desde el modal de Previsualización
            container.querySelector('#btn-proceed-restore-from-preview')?.addEventListener('click', () => {
                if (!currentPreviewData) return;
                const modal = document.getElementById('modal-preview-country-backup');
                modal?.classList.add('hidden');

                const snapshotObj = availableSnapshots.find(s => s.sha === currentPreviewData.commitSha);
                const snapshotLabel = snapshotObj ? snapshotObj.formattedDate : currentPreviewData.commitSha.slice(0, 7);
                const scopeText = currentPreviewData.scope === 'both' ? 'en Español e Inglés' : (currentPreviewData.scope === 'faq_rows_corregido' ? 'solo en Español' : 'solo en Inglés');

                this.requestConfirmation({
                    type: 'country_rollback',
                    country: currentPreviewData.pais,
                    scope: currentPreviewData.scope || 'both',
                    commitSha: currentPreviewData.commitSha,
                    snapshotLabel,
                    summary: `Se revertirán las 38 preguntas regulatorias de <strong>${currentPreviewData.pais}</strong> (${scopeText}) al respaldo inspeccionado: <br><span class="text-blue-700 font-bold">${snapshotLabel}</span>.`
                });
            });

            // 6. Restauración de Tablas Maestras
            container.querySelectorAll('button[data-action="restore-baseline-table"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const file = btn.getAttribute('data-file');
                    const table = btn.getAttribute('data-table');
                    const commitSha = container.querySelector('#select-table-snapshot')?.value || 'main';

                    const snapshotObj = availableSnapshots.find(s => s.sha === commitSha);
                    const snapshotLabel = snapshotObj ? snapshotObj.formattedDate : commitSha.slice(0, 7);

                    this.requestConfirmation({
                        type: 'baseline_table',
                        file,
                        table,
                        commitSha,
                        snapshotLabel,
                        summary: `Se restaurará la tabla completa <strong>${table}</strong> utilizando el archivo maestro <strong>${file}</strong> de GitHub: <br><span class="text-blue-700 font-bold">${snapshotLabel}</span>.`
                    });
                });
            });

            // 7. Drag & Drop y Carga de Archivo Local
            const dropzone = container.querySelector('#dropzone-backup-file');
            const fileInput = container.querySelector('#input-backup-file');

            dropzone?.addEventListener('click', () => fileInput?.click());
            dropzone?.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-blue-500', 'bg-blue-50/50');
            });
            dropzone?.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-blue-500', 'bg-blue-50/50');
            });
            dropzone?.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-blue-500', 'bg-blue-50/50');
                if (e.dataTransfer.files?.length > 0) {
                    this.processUploadedFile(e.dataTransfer.files[0], container);
                }
            });
            fileInput?.addEventListener('change', (e) => {
                if (e.target.files?.length > 0) {
                    this.processUploadedFile(e.target.files[0], container);
                }
            });

            // 8. Descartar archivo subido
            container.querySelector('#btn-cancel-uploaded')?.addEventListener('click', () => {
                uploadedBackupData = null;
                container.querySelector('#container-uploaded-preview')?.classList.add('hidden');
                container.querySelector('#dropzone-backup-file')?.classList.remove('hidden');
                if (fileInput) fileInput.value = '';
            });

            // 9. Aplicar archivo subido
            container.querySelector('#btn-apply-uploaded')?.addEventListener('click', () => {
                if (!uploadedBackupData) return;
                if (uploadedBackupData.isFullDump) {
                    this.requestConfirmation({
                        type: 'uploaded_full',
                        data: uploadedBackupData.data,
                        summary: `Se restaurará la base completa a partir del archivo local cargado. Esto impactará las tablas: <strong>${Object.keys(uploadedBackupData.data.tables || {}).join(', ')}</strong>.`
                    });
                } else {
                    this.requestConfirmation({
                        type: 'uploaded_single',
                        table: uploadedBackupData.table,
                        data: uploadedBackupData.data,
                        summary: `Se restaurará la tabla <strong>${uploadedBackupData.table}</strong> con ${uploadedBackupData.data.length} registros desde el archivo cargado.`
                    });
                }
            });

            // 10. Modal de Confirmación Events
            const modalConfirm = container.querySelector('#modal-confirm-restore');
            const inputKeyword = container.querySelector('#input-confirm-keyword');
            const btnExecute = container.querySelector('#btn-confirm-execute-restore');
            const btnCancel = container.querySelector('#btn-cancel-restore');

            btnCancel?.addEventListener('click', () => {
                modalConfirm?.classList.add('hidden');
                pendingAction = null;
                if (inputKeyword) inputKeyword.value = '';
            });

            inputKeyword?.addEventListener('input', () => {
                const val = inputKeyword.value.trim().toUpperCase();
                if (val === 'RESTAURAR') {
                    btnExecute.disabled = false;
                    btnExecute.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    btnExecute.disabled = true;
                    btnExecute.classList.add('opacity-50', 'cursor-not-allowed');
                }
            });

            btnExecute?.addEventListener('click', async () => {
                if (!pendingAction) return;
                await this.executeRestore(pendingAction, container);
            });

            // 11. Modal de Previsualización Events
            const modalPreview = container.querySelector('#modal-preview-country-backup');
            container.querySelector('#btn-close-preview-modal')?.addEventListener('click', () => {
                modalPreview?.classList.add('hidden');
            });
            container.querySelector('#btn-dismiss-preview')?.addEventListener('click', () => {
                modalPreview?.classList.add('hidden');
            });

            // Filtros del Preview
            container.querySelector('#btn-filter-preview-diff')?.addEventListener('click', () => {
                previewFilter = 'diff';
                container.querySelector('#btn-filter-preview-diff')?.classList.add('bg-white', 'text-slate-800', 'shadow-xs');
                container.querySelector('#btn-filter-preview-diff')?.classList.remove('text-slate-600');
                container.querySelector('#btn-filter-preview-all')?.classList.remove('bg-white', 'text-slate-800', 'shadow-xs');
                container.querySelector('#btn-filter-preview-all')?.classList.add('text-slate-600');
                this.renderPreviewQuestionsList();
            });

            container.querySelector('#btn-filter-preview-all')?.addEventListener('click', () => {
                previewFilter = 'all';
                container.querySelector('#btn-filter-preview-all')?.classList.add('bg-white', 'text-slate-800', 'shadow-xs');
                container.querySelector('#btn-filter-preview-all')?.classList.remove('text-slate-600');
                container.querySelector('#btn-filter-preview-diff')?.classList.remove('bg-white', 'text-slate-800', 'shadow-xs');
                container.querySelector('#btn-filter-preview-diff')?.classList.add('text-slate-600');
                this.renderPreviewQuestionsList();
            });

            container.querySelector('#input-preview-search')?.addEventListener('input', (e) => {
                previewSearchQuery = (e.target.value || '').toLowerCase().trim();
                this.renderPreviewQuestionsList();
            });
        },

        // Renderizado del Modal de Previsualización
        renderPreviewModal(preview) {
            const modal = document.getElementById('modal-preview-country-backup');
            if (!modal) return;

            const snapshotObj = availableSnapshots.find(s => s.sha === preview.commitSha);
            const snapshotLabel = snapshotObj ? snapshotObj.formattedDate : preview.commitSha.slice(0, 7);

            const titleEl = modal.querySelector('#preview-modal-title');
            const subtitleEl = modal.querySelector('#preview-modal-subtitle');
            const totalEl = modal.querySelector('#preview-stat-total');
            const diffEl = modal.querySelector('#preview-stat-diff');
            const identicalEl = modal.querySelector('#preview-stat-identical');

            if (titleEl) titleEl.textContent = `Previsualización: ${preview.pais} (${preview.lang.toUpperCase()})`;
            if (subtitleEl) subtitleEl.textContent = `Copia de seguridad: ${snapshotLabel} · Comparando con base en vivo`;

            if (totalEl) totalEl.textContent = `${preview.totalQuestions} Preguntas`;
            if (diffEl) diffEl.textContent = `${preview.modifiedCount} con diferencias`;
            if (identicalEl) identicalEl.textContent = `${preview.identicalCount} idénticas`;

            // Reset filters
            previewFilter = preview.modifiedCount > 0 ? 'diff' : 'all';
            previewSearchQuery = '';
            const searchInput = modal.querySelector('#input-preview-search');
            if (searchInput) searchInput.value = '';

            const btnDiff = modal.querySelector('#btn-filter-preview-diff');
            const btnAll = modal.querySelector('#btn-filter-preview-all');
            if (previewFilter === 'diff') {
                btnDiff?.classList.add('bg-white', 'text-slate-800', 'shadow-xs');
                btnDiff?.classList.remove('text-slate-600');
                btnAll?.classList.remove('bg-white', 'text-slate-800', 'shadow-xs');
                btnAll?.classList.add('text-slate-600');
            } else {
                btnAll?.classList.add('bg-white', 'text-slate-800', 'shadow-xs');
                btnAll?.classList.remove('text-slate-600');
                btnDiff?.classList.remove('bg-white', 'text-slate-800', 'shadow-xs');
                btnDiff?.classList.add('text-slate-600');
            }

            this.renderPreviewQuestionsList();
            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        },

        renderPreviewQuestionsList() {
            const listContainer = document.getElementById('preview-questions-list');
            if (!listContainer || !currentPreviewData) return;

            const questions = currentPreviewData.comparisons || [];
            const filtered = questions.filter(q => {
                if (previewFilter === 'diff' && q.isIdentical) return false;
                if (previewSearchQuery) {
                    const matchCode = q.code.toLowerCase().includes(previewSearchQuery);
                    const matchLabel = (q.label || '').toLowerCase().includes(previewSearchQuery);
                    const matchText = (q.backup.directa + q.backup.ampliada + q.live.directa).toLowerCase().includes(previewSearchQuery);
                    if (!matchCode && !matchLabel && !matchText) return false;
                }
                return true;
            });

            if (filtered.length === 0) {
                listContainer.innerHTML = `
                    <div class="py-12 text-center text-slate-400 space-y-2">
                        <i data-lucide="check-circle" class="w-8 h-8 text-emerald-500 mx-auto"></i>
                        <p class="font-semibold text-slate-700">No hay preguntas que coincidan con el filtro</p>
                        <p class="text-[11px]">Todas las preguntas se encuentran idénticas a la versión de producción o no coinciden con la búsqueda.</p>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            listContainer.innerHTML = filtered.map(q => `
                <div class="pt-4 first:pt-0 space-y-3">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold rounded text-[11px]">
                                    ${q.code}
                                </span>
                                <h4 class="font-bold text-slate-900 text-xs">${q.label || ''}</h4>
                            </div>
                        </div>
                        <div>
                            ${q.isIdentical ? `
                                <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 shrink-0">
                                    <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
                                    <span>Idéntica</span>
                                </span>
                            ` : `
                                <span class="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px] inline-flex items-center gap-1 shrink-0">
                                    <i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i>
                                    <span>Modificada</span>
                                </span>
                            `}
                        </div>
                    </div>

                    <!-- Comparativa Side-by-Side: En Vivo vs Respaldo -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <!-- Columna Izquierda: Producción Actual -->
                        <div class="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                            <div class="font-bold text-slate-600 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200 flex items-center justify-between">
                                <span>Base Actual en Vivo (Supabase)</span>
                                <span class="text-[9px] text-slate-400">Producción</span>
                            </div>
                            <div>
                                <span class="font-semibold text-slate-500 text-[10px] block">Respuesta Directa:</span>
                                <p class="text-slate-800 mt-0.5">${q.live.directa || '<em class="text-slate-400">Sin contenido</em>'}</p>
                            </div>
                            <div>
                                <span class="font-semibold text-slate-500 text-[10px] block">Respuesta Ampliada:</span>
                                <p class="text-slate-700 mt-0.5 line-clamp-4 hover:line-clamp-none transition-all">${q.live.ampliada || '<em class="text-slate-400">Sin contenido</em>'}</p>
                            </div>
                            <div>
                                <span class="font-semibold text-slate-500 text-[10px] block">Fuente:</span>
                                <p class="text-slate-600 mt-0.5 text-[10px]">${q.live.fuente || '<em class="text-slate-400">Sin fuente</em>'}</p>
                            </div>
                        </div>

                        <!-- Columna Derecha: Copia Histórica en GitHub -->
                        <div class="p-3 ${q.isIdentical ? 'bg-slate-50 border-slate-200/90' : 'bg-blue-50/60 border-blue-200'} border rounded-xl space-y-2">
                            <div class="font-bold ${q.isIdentical ? 'text-slate-600' : 'text-blue-800'} uppercase tracking-wider text-[10px] pb-1 border-b ${q.isIdentical ? 'border-slate-200' : 'border-blue-200'} flex items-center justify-between">
                                <span>Copia de Seguridad Seleccionada</span>
                                <span class="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 font-bold rounded">GitHub Snapshot</span>
                            </div>
                            <div>
                                <span class="font-semibold text-slate-500 text-[10px] block">Respuesta Directa:</span>
                                <p class="text-slate-900 font-medium mt-0.5 ${q.hasDirectaDiff ? 'bg-amber-100/70 p-1 rounded border border-amber-200' : ''}">
                                    ${q.backup.directa || '<em class="text-slate-400">Sin contenido</em>'}
                                </p>
                            </div>
                            <div>
                                <span class="font-semibold text-slate-500 text-[10px] block">Respuesta Ampliada:</span>
                                <p class="text-slate-800 mt-0.5 line-clamp-4 hover:line-clamp-none transition-all ${q.hasAmpliadaDiff ? 'bg-amber-100/70 p-1 rounded border border-amber-200' : ''}">
                                    ${q.backup.ampliada || '<em class="text-slate-400">Sin contenido</em>'}
                                </p>
                            </div>
                            <div>
                                <span class="font-semibold text-slate-500 text-[10px] block">Fuente:</span>
                                <p class="text-slate-700 mt-0.5 text-[10px] ${q.hasFuenteDiff ? 'bg-amber-100/70 p-1 rounded border border-amber-200' : ''}">
                                    ${q.backup.fuente || '<em class="text-slate-400">Sin fuente</em>'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        },

        processUploadedFile(file, container) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    let info = { isFullDump: false, data: parsed, table: null };

                    if (parsed && parsed._metadata && parsed.tables) {
                        info.isFullDump = true;
                        const tablesList = Object.keys(parsed.tables).join(', ');
                        container.querySelector('#uploaded-filename').textContent = file.name;
                        container.querySelector('#uploaded-file-stats').textContent = 'Respaldo Consolidado';
                        container.querySelector('#uploaded-file-details').innerHTML = `
                            <strong>Tablas detectadas:</strong> ${tablesList}<br>
                            <strong>Fecha original de exportación:</strong> ${parsed._metadata.exported_at || 'N/A'}
                        `;
                    } else if (Array.isArray(parsed)) {
                        // Detect table by properties
                        let detectedTable = 'faq_rows_corregido';
                        if (parsed.length > 0) {
                            if (parsed[0].titulo && parsed[0].enlace) detectedTable = 'enlaces';
                            else if (parsed[0].resumen_es || parsed[0].resumen_en) detectedTable = 'resumen_ejecutivo';
                        }
                        info.table = detectedTable;
                        container.querySelector('#uploaded-filename').textContent = file.name;
                        container.querySelector('#uploaded-file-stats').textContent = `${parsed.length} Registros`;
                        container.querySelector('#uploaded-file-details').innerHTML = `
                            <strong>Tabla detectada:</strong> ${detectedTable}<br>
                            <strong>Cantidad de filas:</strong> ${parsed.length}
                        `;
                    } else {
                        throw new Error('Formato JSON no compatible. Debe ser un arreglo de registros o un volcado institucional REGIA.');
                    }

                    uploadedBackupData = info;
                    container.querySelector('#container-uploaded-preview')?.classList.remove('hidden');
                    container.querySelector('#dropzone-backup-file')?.classList.add('hidden');
                    if (window.lucide) window.lucide.createIcons();
                } catch (err) {
                    console.error(err);
                    window.AdminApp?.showToast('Error al procesar archivo: ' + (err.message || err), 'error');
                }
            };
            reader.readAsText(file);
        },

        requestConfirmation(action) {
            pendingAction = action;
            const modal = document.getElementById('modal-confirm-restore');
            const summaryEl = document.getElementById('confirm-restore-summary');
            const inputKeyword = document.getElementById('input-confirm-keyword');
            const btnExecute = document.getElementById('btn-confirm-execute-restore');

            if (summaryEl) summaryEl.innerHTML = action.summary;
            if (inputKeyword) inputKeyword.value = '';
            if (btnExecute) {
                btnExecute.disabled = true;
                btnExecute.classList.add('opacity-50', 'cursor-not-allowed');
            }

            modal?.classList.remove('hidden');
            inputKeyword?.focus();
            if (window.lucide) window.lucide.createIcons();
        },

        async executeRestore(action, container) {
            const modal = document.getElementById('modal-confirm-restore');
            const btn = document.getElementById('btn-confirm-execute-restore');

            btn.disabled = true;
            btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Restaurando datos...`;

            try {
                // Auto-Snapshot Preventivo
                window.AdminApp?.showToast('Tomando snapshot de seguridad preventivo...', 'info');
                try {
                    let snapshotData = null;
                    let snapshotName = '';
                    if (action.type === 'country_rollback') {
                        const table = action.scope === 'both' ? 'faq_rows_corregido' : action.scope;
                        const client = window.AdminAPI.getClient();
                        const { data } = await client.from(table).select('*').ilike('pais', action.country);
                        snapshotData = data;
                        snapshotName = `snapshot_seguridad_${action.country}_${Date.now()}.json`;
                    } else if (action.type === 'baseline_table' || action.type === 'uploaded_single') {
                        const data = await window.AdminAPI.fetchTableData(action.table);
                        snapshotData = data;
                        snapshotName = `snapshot_seguridad_${action.table}_${Date.now()}.json`;
                    } else if (action.type === 'uploaded_full') {
                        snapshotData = await window.AdminAPI.exportFullDatabase();
                        snapshotName = `snapshot_seguridad_full_db_${Date.now()}.json`;
                    }

                    if (snapshotData) {
                        const blob = new Blob([JSON.stringify(snapshotData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = snapshotName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }
                } catch (e) {
                    console.warn('[AdminBackups] No se pudo descargar el auto-snapshot preventivo:', e);
                }

                // Ejecutar la restauración según el tipo
                if (action.type === 'country_rollback') {
                    await window.AdminAPI.restoreCountryFromBaseline(action.country, action.scope, action.commitSha, action.snapshotLabel);
                    window.AdminApp?.showToast(`Ficha de ${action.country} restaurada exitosamente a la versión: ${action.snapshotLabel}`, 'success');
                } else if (action.type === 'baseline_table') {
                    const data = await window.AdminAPI.loadBaselineJson(action.file, action.commitSha);
                    const res = await window.AdminAPI.restoreTableData(action.table, data, action.commitSha);
                    window.AdminApp?.showToast(`Tabla ${action.table} restaurada (${res.count} registros) a versión: ${action.snapshotLabel}`, 'success');
                } else if (action.type === 'uploaded_single') {
                    const res = await window.AdminAPI.restoreTableData(action.table, action.data, 'archivo_local');
                    window.AdminApp?.showToast(`Tabla ${action.table} restaurada desde archivo (${res.count} registros)`, 'success');
                } else if (action.type === 'uploaded_full') {
                    const tables = action.data.tables || {};
                    let totalCount = 0;
                    for (const t of Object.keys(tables)) {
                        if (Array.isArray(tables[t]) && tables[t].length > 0) {
                            const res = await window.AdminAPI.restoreTableData(t, tables[t], 'archivo_local_full');
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
