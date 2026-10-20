// admin/audit.js — Registro y Auditoría de Cambios Normativos
(function() {
    const AdminAudit = {
        async render(container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-slate-600 font-medium">Cargando registro de auditoría...</span>
                </div>
            `;

            try {
                const logs = await window.AdminAPI.getAuditLog(100);
                this.renderContent(container, logs);
            } catch (err) {
                console.error('[AdminAudit] Error:', err);
                container.innerHTML = `
                    <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <h3 class="font-bold text-lg mb-2">Error al cargar registros</h3>
                        <p class="text-sm">${err.message || err}</p>
                    </div>
                `;
            }
        },

        renderContent(container, logs) {
            container.innerHTML = `
                <div class="space-y-6">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded">
                                    Seguridad & Trazabilidad
                                </span>
                                <span class="text-xs text-slate-400">·</span>
                                <span class="text-xs text-slate-500">${logs.length} eventos registrados</span>
                            </div>
                            <h1 class="text-xl font-bold text-slate-800 mt-1">Historial de Auditoría de Ediciones</h1>
                            <p class="text-xs text-slate-500 mt-0.5">
                                Registro inmutable de modificaciones normativas, usuarios intervinientes y cambios de versión.
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="btn-refresh-audit" class="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                <span>Refrescar</span>
                            </button>
                        </div>
                    </div>

                    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        ${logs.length === 0 ? `
                            <div class="p-12 text-center text-slate-400 text-xs">
                                Aún no se han registrado eventos de edición en la base.
                            </div>
                        ` : `
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th class="p-4">Fecha y Hora</th>
                                            <th class="p-4">Usuario</th>
                                            <th class="p-4">País</th>
                                            <th class="p-4">Idioma</th>
                                            <th class="p-4">Campo / Pregunta</th>
                                            <th class="p-4">Resumen del Cambio</th>
                                            <th class="p-4 text-right">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100 text-slate-700">
                                        ${logs.map((log, idx) => {
                                            const d = log.created_at ? new Date(log.created_at).toLocaleString('es-AR') : '-';
                                            return `
                                                <tr class="hover:bg-blue-50/40 transition cursor-pointer group" data-log-idx="${idx}">
                                                    <td class="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">${d}</td>
                                                    <td class="p-4 font-medium text-slate-800">${log.usuario_nombre || 'Usuario'}</td>
                                                    <td class="p-4 font-semibold text-blue-600">${log.pais || '-'}</td>
                                                    <td class="p-4 uppercase font-bold text-[10px]">
                                                        <span class="px-2 py-0.5 rounded ${log.idioma === 'es' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}">
                                                            ${log.idioma || 'es'}
                                                        </span>
                                                    </td>
                                                    <td class="p-4 font-medium text-[11px] text-slate-700 max-w-xs truncate" title="${(log.campo || '').replace(/"/g, '&quot;')}">${log.campo || '-'}</td>
                                                    <td class="p-4 text-slate-500 max-w-xs truncate" title="${(log.valor_nuevo || '').replace(/"/g, '&quot;')}">
                                                        ${log.valor_nuevo ? log.valor_nuevo.substring(0, 80) + '...' : '(Vacío)'}
                                                    </td>
                                                    <td class="p-4 text-right">
                                                        <span class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-blue-800">
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
                        `}
                    </div>
                </div>

                <!-- Modal de Detalle de Auditoría (Diff) -->
                <div id="audit-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
                    <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                    <i data-lucide="history" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-800 text-sm">Detalle de Modificación Normativa</h3>
                                    <p id="audit-modal-meta" class="text-[11px] text-slate-400 font-mono"></p>
                                </div>
                            </div>
                            <button id="btn-close-audit-modal" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div class="space-y-1">
                                <span class="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    Valor Anterior
                                </span>
                                <div id="audit-modal-old" class="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto"></div>
                            </div>

                            <div class="space-y-1">
                                <span class="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Valor Nuevo
                                </span>
                                <div id="audit-modal-new" class="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto"></div>
                            </div>
                        </div>

                        <div class="flex justify-end pt-3 border-t border-slate-100">
                            <button id="btn-done-audit-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Setup row click listeners
            const modal = container.querySelector('#audit-modal');
            const metaElem = container.querySelector('#audit-modal-meta');
            const oldElem = container.querySelector('#audit-modal-old');
            const newElem = container.querySelector('#audit-modal-new');

            container.querySelectorAll('[data-log-idx]').forEach(row => {
                row.addEventListener('click', () => {
                    const idx = parseInt(row.getAttribute('data-log-idx'), 10);
                    const item = logs[idx];
                    if (!item) return;

                    const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('es-AR') : '';
                    if (metaElem) metaElem.textContent = `${item.usuario_nombre || 'Usuario'} · ${item.pais || '-'} · ${item.campo || '-'} · ${dateStr}`;
                    if (oldElem) oldElem.textContent = item.valor_anterior || '(Sin versión anterior registrada / primera carga)';
                    if (newElem) newElem.textContent = item.valor_nuevo || '(Vacío)';

                    modal?.classList.remove('hidden');
                });
            });

            container.querySelector('#btn-refresh-audit')?.addEventListener('click', () => {
                this.render(container);
            });

            container.querySelector('#btn-close-audit-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
            container.querySelector('#btn-done-audit-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));

            if (window.lucide) window.lucide.createIcons();
        }
    };

    window.AdminAudit = AdminAudit;
})();
