// admin/users.js — Gestión de Usuarios y Control de Acceso (RBAC) para REGIA Admin
(function() {
    let usersList = [];
    let rpcActive = true;
    let searchQuery = '';
    let filterRole = 'todos';
    let filterStatus = 'todos';

    // Lista de usuarios de ejemplo para el modo de visualización de invitados
    const DEMO_USERS_LIST = [
        {
            id: 'demo-user-1',
            email: 'admin.coordinacion@paho.org',
            nombre: 'Dra. María Fernández',
            rol: 'administrador',
            activo: true,
            created_at: '2026-08-01T12:00:00Z',
            last_sign_in_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
        },
        {
            id: 'demo-user-2',
            email: 'editor.conosur@paho.org',
            nombre: 'Dr. Alejandro Morales',
            rol: 'editor',
            activo: true,
            created_at: '2026-08-15T10:30:00Z',
            last_sign_in_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
        },
        {
            id: 'demo-user-3',
            email: 'editor.caribe@paho.org',
            nombre: 'Lic. Sarah Jenkins',
            rol: 'editor',
            activo: true,
            created_at: '2026-09-01T14:20:00Z',
            last_sign_in_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
            id: 'demo-user-4',
            email: 'evaluador.externo@paho.org',
            nombre: 'Invitado Evaluador (Comité Revisor)',
            rol: 'lector',
            activo: true,
            created_at: '2026-10-01T09:00:00Z',
            last_sign_in_at: new Date().toISOString()
        }
    ];

    const AdminUsers = {
        async render(container, params = {}) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 space-y-3">
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span class="text-slate-600 text-xs font-semibold tracking-wide">Cargando directorio de usuarios y permisos...</span>
                </div>
            `;

            try {
                if (window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly()) {
                    usersList = DEMO_USERS_LIST;
                    rpcActive = true;
                } else {
                    const res = await window.AdminAPI.getAdminUsers();
                    usersList = res.users || [];
                    rpcActive = res.rpcActive !== false;
                    if (usersList.length === 0) {
                        usersList = DEMO_USERS_LIST;
                    }
                }
                this.renderContent(container);
            } catch (err) {
                console.error('[AdminUsers] Error loading users:', err);
                container.innerHTML = `
                    <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 max-w-xl mx-auto my-8">
                        <div class="flex items-center gap-3 mb-2">
                            <i data-lucide="alert-octagon" class="w-6 h-6 text-red-600"></i>
                            <h3 class="font-bold text-base">Error al cargar usuarios</h3>
                        </div>
                        <p class="text-xs text-red-600 mb-4">${err.message || err}</p>
                        <button id="btn-retry-users" class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition">
                            Reintentar
                        </button>
                    </div>
                `;
                container.querySelector('#btn-retry-users')?.addEventListener('click', () => this.render(container));
                if (window.lucide) window.lucide.createIcons();
            }
        },

        renderContent(container) {
            const currentAuthUser = window.AdminAuth?.getCurrentUser();
            const totalUsers = usersList.length;
            const adminCount = usersList.filter(u => u.rol === 'administrador').length;
            const editorCount = usersList.filter(u => u.rol === 'editor').length;
            const lectorCount = usersList.filter(u => u.rol === 'lector' || u.rol === 'solo_lectura').length;

            // Filter users
            const filtered = usersList.filter(u => {
                if (filterRole !== 'todos' && u.rol !== filterRole) return false;
                if (filterStatus === 'activo' && u.activo === false) return false;
                if (filterStatus === 'inactivo' && u.activo !== false) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const name = (u.nombre || '').toLowerCase();
                    const email = (u.email || '').toLowerCase();
                    if (!name.includes(q) && !email.includes(q)) return false;
                }
                return true;
            });

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Header Principal -->
                    <div class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                                    Seguridad & Roles (RBAC)
                                </span>
                                <span class="text-slate-300">·</span>
                                <span class="text-xs text-slate-500 font-medium">Control Institucional</span>
                            </div>
                            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Usuarios y Permisos</h1>
                            <p class="text-xs text-slate-500 max-w-2xl leading-relaxed">
                                Administre las altas, bajas, roles y credenciales del equipo editorial y evaluadores de la plataforma REGIA.
                            </p>
                        </div>

                        <!-- Acciones -->
                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                            <button id="btn-refresh-users" class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition" title="Refrescar lista desde Supabase">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                <span>Refrescar</span>
                            </button>
                            <button id="btn-modal-create-user" class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20">
                                <i data-lucide="user-plus" class="w-4 h-4"></i>
                                <span>Nuevo Usuario</span>
                            </button>
                        </div>
                    </div>

                    ${window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly() ? `
                    <!-- Banner de Modo Solo Lectura (Demostración) -->
                    <div class="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 text-purple-950 text-xs shadow-xs">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-purple-100 rounded-xl text-purple-700 shrink-0">
                                <i data-lucide="info" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-sm text-purple-900 flex items-center gap-2">
                                    <span>Directorio de Usuarios y Permisos (Vista de Invitado)</span>
                                    <span class="text-[10px] font-bold uppercase tracking-wider bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Ejemplo Demostrativo</span>
                                </h4>
                                <p class="text-purple-700 mt-0.5">
                                    Los perfiles exhibidos a continuación son <strong>ejemplos al mero efecto de mostrar</strong> la interfaz de administración, roles (Administrador, Editor, Lector) y asignación de accesos institucionales. Las funciones de creación, edición o eliminación de cuentas reales están deshabilitadas en este modo de lectura.
                                </p>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    ${!rpcActive ? `
                    <!-- Aviso de instalación de funciones RPC -->
                    <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-amber-900 shadow-xs">
                        <div class="flex items-center gap-3">
                            <i data-lucide="database" class="w-5 h-5 text-amber-600 shrink-0"></i>
                            <div>
                                <span class="font-bold">Funciones RPC de Base de Datos Pendientes:</span>
                                <p class="text-amber-700 mt-0.5">Para permitir la creación directa de usuarios en Supabase Auth sin confirmación por correo, ejecute la Sección 6 del script de migración SQL.</p>
                            </div>
                        </div>
                        <button id="btn-copy-user-sql" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copiar Script SQL</span>
                        </button>
                    </div>
                    ` : ''}

                    <!-- KPI Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Usuarios</span>
                                <i data-lucide="users" class="w-4 h-4 text-slate-600"></i>
                            </div>
                            <div class="text-2xl font-extrabold text-slate-800">${totalUsers}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">Cuentas registradas</div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600">Administradores</span>
                                <i data-lucide="shield-check" class="w-4 h-4 text-blue-600"></i>
                            </div>
                            <div class="text-2xl font-extrabold text-blue-700">${adminCount}</div>
                            <div class="text-[11px] text-blue-500 mt-0.5">Control y auditoría plena</div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-amber-600">Editores</span>
                                <i data-lucide="edit-3" class="w-4 h-4 text-amber-600"></i>
                            </div>
                            <div class="text-2xl font-extrabold text-amber-700">${editorCount}</div>
                            <div class="text-[11px] text-amber-500 mt-0.5">Sin acceso a auditoría</div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div class="flex items-center justify-between text-slate-400 mb-1">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-purple-600">Solo Lectura</span>
                                <i data-lucide="eye" class="w-4 h-4 text-purple-600"></i>
                            </div>
                            <div class="text-2xl font-extrabold text-purple-700">${lectorCount}</div>
                            <div class="text-[11px] text-purple-500 mt-0.5">Modo demostración / inmutable</div>
                        </div>
                    </div>

                    <!-- Filtros y Búsqueda -->
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                        <div class="relative w-full md:w-80">
                            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                            <input 
                                type="text" 
                                id="users-search-input" 
                                value="${searchQuery}"
                                placeholder="Buscar por nombre o correo..."
                                class="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                            >
                        </div>

                        <div class="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div class="flex items-center gap-1.5">
                                <label class="text-xs font-semibold text-slate-500">Rol:</label>
                                <select id="filter-user-role" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                    <option value="todos" ${filterRole === 'todos' ? 'selected' : ''}>Todos los roles</option>
                                    <option value="administrador" ${filterRole === 'administrador' ? 'selected' : ''}>Administradores</option>
                                    <option value="editor" ${filterRole === 'editor' ? 'selected' : ''}>Editores</option>
                                    <option value="lector" ${filterRole === 'lector' ? 'selected' : ''}>Solo Lectura</option>
                                </select>
                            </div>

                            <div class="flex items-center gap-1.5">
                                <label class="text-xs font-semibold text-slate-500">Estado:</label>
                                <select id="filter-user-status" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                    <option value="todos" ${filterStatus === 'todos' ? 'selected' : ''}>Todos los estados</option>
                                    <option value="activo" ${filterStatus === 'activo' ? 'selected' : ''}>Activos</option>
                                    <option value="inactivo" ${filterStatus === 'inactivo' ? 'selected' : ''}>Inactivos</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Tabla de Usuarios -->
                    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs">
                                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th class="px-5 py-3.5">Usuario / Correo</th>
                                        <th class="px-4 py-3.5">Rol y Permisos</th>
                                        <th class="px-4 py-3.5">Estado</th>
                                        <th class="px-4 py-3.5">Fecha Creación</th>
                                        <th class="px-5 py-3.5 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${filtered.length > 0 ? filtered.map(u => this.renderUserRow(u, currentAuthUser)).join('') : `
                                        <tr>
                                            <td colspan="5" class="py-12 text-center text-slate-400">
                                                <i data-lucide="user-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                                                <p class="font-medium">No se encontraron usuarios con los filtros seleccionados.</p>
                                            </td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Modal Crear Usuario -->
                <div id="modal-create-user" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
                    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div class="flex items-center gap-2">
                                <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <i data-lucide="user-plus" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-800 text-base">Crear Nuevo Usuario</h3>
                                    <p class="text-[11px] text-slate-400">Alta directa con activación inmediata en Supabase</p>
                                </div>
                            </div>
                            <button id="btn-close-create-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <form id="form-create-user" class="space-y-4 text-xs">
                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">Nombre Completo o Institución</label>
                                <input 
                                    type="text" 
                                    id="create-user-nombre" 
                                    required 
                                    placeholder="ej. Dra. María González"
                                    class="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                            </div>

                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico (Login)</label>
                                <input 
                                    type="email" 
                                    id="create-user-email" 
                                    required 
                                    placeholder="usuario@paho.org o profesional@gmail.com"
                                    class="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                            </div>

                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="block font-semibold text-slate-700">Contraseña Inicial</label>
                                    <button type="button" id="btn-gen-password" class="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline">
                                        Generar segura
                                    </button>
                                </div>
                                <div class="relative">
                                    <input 
                                        type="password" 
                                        id="create-user-password" 
                                        required 
                                        minlength="6"
                                        placeholder="Mínimo 6 caracteres..."
                                        class="w-full p-2.5 pr-20 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                    <button type="button" id="btn-toggle-create-pw" class="absolute right-2 top-2 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition">
                                        Ver
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="block font-semibold text-slate-700 mb-2">Rol y Nivel de Permisos</label>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <label class="border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-blue-50/50 transition flex flex-col justify-between has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/40">
                                        <div class="flex items-center gap-2">
                                            <input type="radio" name="create-user-role" value="administrador" class="text-blue-600 focus:ring-blue-500">
                                            <span class="font-bold text-slate-800">Administrador</span>
                                        </div>
                                        <span class="text-[10px] text-slate-500 mt-1.5 leading-snug">Acceso total, auditoría, diff y gestión de usuarios.</span>
                                    </label>

                                    <label class="border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-amber-50/50 transition flex flex-col justify-between has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50/40">
                                        <div class="flex items-center gap-2">
                                            <input type="radio" name="create-user-role" value="editor" checked class="text-amber-600 focus:ring-amber-500">
                                            <span class="font-bold text-slate-800">Editor</span>
                                        </div>
                                        <span class="text-[10px] text-slate-500 mt-1.5 leading-snug">Edición y traducción con IA. Sin acceso a auditoría.</span>
                                    </label>

                                    <label class="border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-purple-50/50 transition flex flex-col justify-between has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/40">
                                        <div class="flex items-center gap-2">
                                            <input type="radio" name="create-user-role" value="lector" class="text-purple-600 focus:ring-purple-500">
                                            <span class="font-bold text-slate-800">Solo Lectura</span>
                                        </div>
                                        <span class="text-[10px] text-slate-500 mt-1.5 leading-snug">Demostración y evaluación. Modificación bloqueada.</span>
                                    </label>
                                </div>
                            </div>

                            <div id="create-user-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs"></div>

                            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button type="button" id="btn-cancel-create-user" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancelar</button>
                                <button type="submit" id="btn-submit-create-user" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                    <span>Crear Usuario</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Modal Editar Usuario -->
                <div id="modal-edit-user" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
                    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div class="flex items-center gap-2">
                                <div class="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <i data-lucide="user-cog" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-800 text-base">Editar Usuario y Permisos</h3>
                                    <p id="edit-user-subtitle" class="text-[11px] text-slate-400">usuario@paho.org</p>
                                </div>
                            </div>
                            <button id="btn-close-edit-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <form id="form-edit-user" class="space-y-4 text-xs">
                            <input type="hidden" id="edit-user-id" value="">

                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    id="edit-user-nombre" 
                                    required 
                                    class="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                            </div>

                            <div>
                                <label class="block font-semibold text-slate-700 mb-2">Rol Asignado</label>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <label class="border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-blue-50/50 transition flex flex-col justify-between has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/40">
                                        <div class="flex items-center gap-2">
                                            <input type="radio" name="edit-user-role" value="administrador" class="text-blue-600 focus:ring-blue-500">
                                            <span class="font-bold text-slate-800">Administrador</span>
                                        </div>
                                        <span class="text-[10px] text-slate-500 mt-1.5 leading-snug">Total y auditoría.</span>
                                    </label>

                                    <label class="border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-amber-50/50 transition flex flex-col justify-between has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50/40">
                                        <div class="flex items-center gap-2">
                                            <input type="radio" name="edit-user-role" value="editor" class="text-amber-600 focus:ring-amber-500">
                                            <span class="font-bold text-slate-800">Editor</span>
                                        </div>
                                        <span class="text-[10px] text-slate-500 mt-1.5 leading-snug">Sin auditoría.</span>
                                    </label>

                                    <label class="border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-purple-50/50 transition flex flex-col justify-between has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/40">
                                        <div class="flex items-center gap-2">
                                            <input type="radio" name="edit-user-role" value="lector" class="text-purple-600 focus:ring-purple-500">
                                            <span class="font-bold text-slate-800">Solo Lectura</span>
                                        </div>
                                        <span class="text-[10px] text-slate-500 mt-1.5 leading-snug">Demostración.</span>
                                    </label>
                                </div>
                            </div>

                            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                <div>
                                    <span class="font-semibold text-slate-800">Estado de la Cuenta</span>
                                    <p class="text-[11px] text-slate-400">Si se desactiva, el usuario no podrá iniciar sesión.</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="edit-user-activo" class="sr-only peer" checked>
                                    <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>

                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">
                                    Restablecer Contraseña (Opcional)
                                </label>
                                <input 
                                    type="password" 
                                    id="edit-user-password" 
                                    placeholder="Dejar vacío para mantener contraseña actual..."
                                    class="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                            </div>

                            <div id="edit-user-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs"></div>

                            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button type="button" id="btn-cancel-edit-user" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancelar</button>
                                <button type="submit" id="btn-submit-edit-user" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5">
                                    <i data-lucide="save" class="w-4 h-4"></i>
                                    <span>Guardar Cambios</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();
            this.bindEvents(container);
        },

        renderUserRow(user, currentAuthUser) {
            const isSelf = currentAuthUser && (user.id === currentAuthUser.id || user.email === currentAuthUser.email);
            const initials = (user.nombre || user.email || 'U').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

            // Role badge styling
            let roleBadge = '';
            if (user.rol === 'administrador') {
                roleBadge = `<span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-800 border border-blue-200">Administrador</span>`;
            } else if (user.rol === 'editor') {
                roleBadge = `<span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 border border-amber-200">Editor</span>`;
            } else {
                roleBadge = `<span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-100 text-purple-800 border border-purple-200">Solo Lectura</span>`;
            }

            const isActive = user.activo !== false;
            const statusBadge = isActive
                ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo</span>`
                : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactivo</span>`;

            const createdDate = user.created_at
                ? new Date(user.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Histórico';

            return `
                <tr class="hover:bg-slate-50/60 transition">
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                ${initials}
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-slate-800 text-xs">${user.nombre || 'Sin nombre'}</span>
                                    ${isSelf ? '<span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-600 text-white rounded">Tú</span>' : ''}
                                </div>
                                <span class="text-[11px] text-slate-400 font-mono">${user.email}</span>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-4">
                        ${roleBadge}
                    </td>
                    <td class="px-4 py-4">
                        ${statusBadge}
                    </td>
                    <td class="px-4 py-4 text-slate-500 text-[11px]">
                        ${createdDate}
                    </td>
                    <td class="px-5 py-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button 
                                data-action="edit-user"
                                data-id="${user.id}"
                                class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Editar usuario y permisos"
                            >
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                            ${!isSelf ? `
                                <button 
                                    data-action="delete-user"
                                    data-id="${user.id}"
                                    data-email="${user.email}"
                                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Dar de baja / eliminar usuario"
                                >
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        },

        bindEvents(container) {
            // Search input
            container.querySelector('#users-search-input')?.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                this.renderContent(container);
            });

            // Filter Role
            container.querySelector('#filter-user-role')?.addEventListener('change', (e) => {
                filterRole = e.target.value;
                this.renderContent(container);
            });

            // Filter Status
            container.querySelector('#filter-user-status')?.addEventListener('change', (e) => {
                filterStatus = e.target.value;
                this.renderContent(container);
            });

            // Refresh
            container.querySelector('#btn-refresh-users')?.addEventListener('click', () => {
                this.render(container);
            });

            // Copy SQL button
            container.querySelector('#btn-copy-user-sql')?.addEventListener('click', () => {
                const sqlSnippet = `-- Copiar y ejecutar en Supabase SQL Editor:
-- migration.sql (Sección 6) contiene las 4 funciones RPC de gestión de usuarios.`;
                navigator.clipboard.writeText(sqlSnippet);
                window.AdminApp.showToast('Instrucciones SQL copiadas al portapapeles', 'info');
            });

            // Modal Create: Open
            const modalCreate = container.querySelector('#modal-create-user');
            container.querySelector('#btn-modal-create-user')?.addEventListener('click', () => {
                if (window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly()) {
                    window.AdminApp.showToast('Acción deshabilitada: Se encuentra en la vista demostrativa de invitados', 'info');
                    return;
                }
                modalCreate.classList.remove('hidden');
                container.querySelector('#create-user-nombre')?.focus();
            });

            // Modal Create: Close
            const closeCreate = () => modalCreate?.classList.add('hidden');
            container.querySelector('#btn-close-create-modal')?.addEventListener('click', closeCreate);
            container.querySelector('#btn-cancel-create-user')?.addEventListener('click', closeCreate);

            // Generate Password button
            container.querySelector('#btn-gen-password')?.addEventListener('click', () => {
                const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
                let gen = '';
                for (let i = 0; i < 12; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                const pwInput = container.querySelector('#create-user-password');
                if (pwInput) {
                    pwInput.value = gen;
                    pwInput.type = 'text';
                    window.AdminApp.showToast('Contraseña generada: ' + gen, 'info');
                }
            });

            // Toggle Create Password
            container.querySelector('#btn-toggle-create-pw')?.addEventListener('click', () => {
                const pwInput = container.querySelector('#create-user-password');
                const btn = container.querySelector('#btn-toggle-create-pw');
                if (pwInput.type === 'password') {
                    pwInput.type = 'text';
                    btn.textContent = 'Ocultar';
                } else {
                    pwInput.type = 'password';
                    btn.textContent = 'Ver';
                }
            });

            // Submit Create User
            container.querySelector('#form-create-user')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nombre = container.querySelector('#create-user-nombre').value.trim();
                const email = container.querySelector('#create-user-email').value.trim();
                const password = container.querySelector('#create-user-password').value;
                const rol = container.querySelector('input[name="create-user-role"]:checked')?.value || 'editor';
                const submitBtn = container.querySelector('#btn-submit-create-user');
                const errorBox = container.querySelector('#create-user-error');
                errorBox.classList.add('hidden');

                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Creando...</span>`;

                try {
                    await window.AdminAPI.createAdminUser({ email, password, nombre, rol });
                    window.AdminApp.showToast(`Usuario ${email} creado correctamente con rol ${rol}`, 'success');
                    closeCreate();
                    this.render(container);
                } catch (err) {
                    errorBox.textContent = err.message || err;
                    errorBox.classList.remove('hidden');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Crear Usuario</span>`;
                }
                if (window.lucide) window.lucide.createIcons();
            });

            // Modal Edit: Open
            const modalEdit = container.querySelector('#modal-edit-user');
            container.querySelectorAll('[data-action="edit-user"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly()) {
                        window.AdminApp.showToast('Acción deshabilitada: Se encuentra en la vista demostrativa de invitados', 'info');
                        return;
                    }
                    const id = btn.getAttribute('data-id');
                    const user = usersList.find(u => String(u.id) === String(id));
                    if (!user) return;

                    container.querySelector('#edit-user-id').value = user.id;
                    container.querySelector('#edit-user-subtitle').textContent = user.email;
                    container.querySelector('#edit-user-nombre').value = user.nombre || '';
                    container.querySelector('#edit-user-activo').checked = user.activo !== false;
                    container.querySelector('#edit-user-password').value = '';

                    const radio = container.querySelector(`input[name="edit-user-role"][value="${user.rol}"]`);
                    if (radio) radio.checked = true;

                    modalEdit.classList.remove('hidden');
                    container.querySelector('#edit-user-nombre')?.focus();
                });
            });

            // Modal Edit: Close
            const closeEdit = () => modalEdit?.classList.add('hidden');
            container.querySelector('#btn-close-edit-modal')?.addEventListener('click', closeEdit);
            container.querySelector('#btn-cancel-edit-user')?.addEventListener('click', closeEdit);

            // Submit Edit User
            container.querySelector('#form-edit-user')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly()) {
                    window.AdminApp.showToast('Acción deshabilitada: Se encuentra en la vista demostrativa de invitados', 'info');
                    return;
                }
                const id = container.querySelector('#edit-user-id').value;
                const nombre = container.querySelector('#edit-user-nombre').value.trim();
                const rol = container.querySelector('input[name="edit-user-role"]:checked')?.value || 'editor';
                const activo = container.querySelector('#edit-user-activo').checked;
                const password = container.querySelector('#edit-user-password').value.trim();
                const submitBtn = container.querySelector('#btn-submit-edit-user');
                const errorBox = container.querySelector('#edit-user-error');
                errorBox.classList.add('hidden');

                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Guardando...</span>`;

                try {
                    await window.AdminAPI.updateAdminUser({ id, nombre, rol, activo, password: password || null });
                    window.AdminApp.showToast(`Usuario actualizado correctamente`, 'success');
                    closeEdit();
                    this.render(container);
                } catch (err) {
                    errorBox.textContent = err.message || err;
                    errorBox.classList.remove('hidden');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Guardar Cambios</span>`;
                }
                if (window.lucide) window.lucide.createIcons();
            });

            // Action Delete User
            container.querySelectorAll('[data-action="delete-user"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly()) {
                        window.AdminApp.showToast('Acción deshabilitada: Se encuentra en la vista demostrativa de invitados', 'info');
                        return;
                    }
                    const id = btn.getAttribute('data-id');
                    const email = btn.getAttribute('data-email');
                    if (confirm(`¿Está seguro de eliminar definitivamente al usuario ${email}?\nEsta acción no se puede deshacer.`)) {
                        try {
                            await window.AdminAPI.deleteAdminUser(id);
                            window.AdminApp.showToast(`Usuario ${email} eliminado`, 'info');
                            this.render(container);
                        } catch (err) {
                            window.AdminApp.showToast(`Error al eliminar: ${err.message || err}`, 'error');
                        }
                    }
                });
            });
        }
    };

    window.AdminUsers = AdminUsers;
})();
