// admin/app.js — Orquestador Principal de la SPA Administrativa (OPS/OMS)
(function() {
    const AdminApp = {
        state: {
            currentView: 'dashboard',
            params: {},
            pendingCount: 0
        },

        init() {
            // Initialize Auth
            window.AdminAuth.init();
            window.AdminAuth.onAuthChange((user) => {
                this.updateHeaderUser();
                if (!user) {
                    this.renderLogin();
                } else {
                    this.navigate(this.state.currentView || 'dashboard', this.state.params);
                }
            });

            // Bind global header navigation
            this.bindGlobalEvents();

            // Check initial auth state
            if (!window.AdminAuth.isAuthenticated()) {
                this.renderLogin();
            } else {
                this.updateHeaderUser();
                const hashView = (window.location.hash || '').replace('#', '').trim();
                const validViews = ['dashboard', 'translations', 'resources', 'audit', 'users', 'backups', 'editor'];
                const initialView = validViews.includes(hashView) ? hashView : 'dashboard';
                this.navigate(initialView);
            }

            // Listen to browser hash changes
            window.addEventListener('hashchange', () => {
                if (!window.AdminAuth.isAuthenticated()) return;
                const view = (window.location.hash || '').replace('#', '').trim();
                const validViews = ['dashboard', 'translations', 'resources', 'audit', 'users', 'backups', 'editor'];
                if (validViews.includes(view) && view !== this.state.currentView) {
                    this.navigate(view);
                }
            });

            // Periodic badge check for pending translations
            this.refreshPendingCounter();
            setInterval(() => this.refreshPendingCounter(), 30000);
        },

        async refreshPendingCounter() {
            if (!window.AdminAuth.isAuthenticated()) return;
            try {
                const queue = await window.AdminAPI.getTranslationQueue('pendiente');
                this.state.pendingCount = queue.length;
                const badge = document.getElementById('nav-pending-badge');
                if (badge) {
                    if (this.state.pendingCount > 0) {
                        badge.textContent = this.state.pendingCount;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                }
            } catch (_) {}
        },

        navigate(view, params = {}) {
            // Guard de permisos para Auditoría: Los editores no pueden ver auditoría
            if (view === 'audit' && !window.AdminAuth.canViewAudit()) {
                this.showToast('Acceso restringido: El rol Editor no tiene permisos para ver auditoría', 'warning');
                this.navigate('dashboard');
                return;
            }

            // Guard de permisos para Usuarios: Solo los administradores pueden gestionar usuarios
            if (view === 'users' && !window.AdminAuth.isAdmin()) {
                this.showToast('Acceso restringido: Solo los administradores pueden gestionar usuarios', 'warning');
                this.navigate('dashboard');
                return;
            }

            // Guard de permisos para Copias y Restauración: Solo administradores
            if (view === 'backups' && !window.AdminAuth.isAdmin()) {
                this.showToast('Acceso restringido: Solo los administradores pueden gestionar copias de seguridad', 'warning');
                this.navigate('dashboard');
                return;
            }

            this.state.currentView = view;
            this.state.params = params;

            // Sincronizar hash en la barra de direcciones sin provocar saltos bruscos
            if (window.location.hash !== '#' + view) {
                history.replaceState(null, '', '#' + view);
            }

            // Highlight active nav link without stripping persistent classes like 'hidden'
            document.querySelectorAll('.nav-link').forEach(link => {
                const targetView = link.getAttribute('data-view');
                if (targetView === view) {
                    link.classList.add('bg-blue-50', 'text-blue-700', 'font-semibold');
                    link.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100', 'font-medium');
                } else {
                    link.classList.remove('bg-blue-50', 'text-blue-700', 'font-semibold');
                    link.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100', 'font-medium');
                }
            });

            // Reinforce role-based nav link visibility
            this.updateNavPermissions();

            const mainContainer = document.getElementById('admin-main-container');
            if (!mainContainer) return;

            // Route view
            try {
                switch (view) {
                    case 'dashboard':
                        window.AdminDashboard.render(mainContainer);
                        break;
                    case 'editor':
                        window.AdminEditor.render(mainContainer, params);
                        break;
                    case 'translations':
                        window.AdminTranslations.render(mainContainer);
                        break;
                    case 'resources':
                        window.AdminResources.render(mainContainer, params);
                        break;
                    case 'audit':
                        window.AdminAudit.render(mainContainer, params);
                        break;
                    case 'users':
                        window.AdminUsers.render(mainContainer, params);
                        break;
                    case 'backups':
                        if (window.AdminBackups && typeof window.AdminBackups.render === 'function') {
                            window.AdminBackups.render(mainContainer, params);
                        } else {
                            console.error('[AdminApp] AdminBackups no está disponible');
                            window.AdminDashboard.render(mainContainer);
                        }
                        break;
                    default:
                        window.AdminDashboard.render(mainContainer);
                }
            } catch (err) {
                console.error(`[AdminApp] Error rendering view ${view}:`, err);
                this.showToast(`Error al cargar vista ${view}: ${err.message || err}`, 'error');
            }

            this.refreshPendingCounter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        renderLogin() {
            const mainContainer = document.getElementById('admin-main-container');
            const nav = document.getElementById('admin-main-nav');
            if (nav) nav.classList.add('hidden');

            if (!mainContainer) return;

            mainContainer.innerHTML = `
                <div class="min-h-[85vh] flex items-center justify-center p-4">
                    <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-6">
                        <div class="text-center space-y-3">
                            <div class="flex justify-center pb-1">
                                <img src="regia-logo.png" alt="REGIA - Regulaciones para la Investigación en las Américas" class="h-16 sm:h-20 w-auto object-contain">
                            </div>
                            <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-blue-600"></i>
                                <span>Panel de Administración</span>
                            </div>
                            <p class="text-xs text-slate-500 max-w-xs mx-auto">
                                Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas (OPS/OMS)
                            </p>
                        </div>

                        <!-- Formulario de Login -->
                        <form id="login-form" class="space-y-4 text-xs">
                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    id="login-email" 
                                    required 
                                    placeholder="usuario@paho.org"
                                    class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                            </div>

                            <div>
                                <label class="block font-semibold text-slate-700 mb-1">Contraseña</label>
                                <input 
                                    type="password" 
                                    id="login-password" 
                                    required 
                                    placeholder="••••••••"
                                    class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                            </div>

                            <button 
                                type="submit" 
                                id="btn-submit-login"
                                class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                            >
                                <i data-lucide="log-in" class="w-4 h-4"></i>
                                <span>Iniciar Sesión</span>
                            </button>
                        </form>

                        <div id="login-error-msg" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"></div>

                        <!-- Acceso Demostración (Solo Lectura) -->
                        <div class="pt-2">
                            <div class="relative my-3">
                                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
                                <div class="relative flex justify-center text-[10px] uppercase"><span class="bg-white px-2 text-slate-400 font-semibold tracking-wider">o acceso de evaluación</span></div>
                            </div>

                            <button 
                                type="button" 
                                id="btn-login-readonly"
                                class="w-full py-2.5 px-4 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 hover:border-purple-200 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs"
                            >
                                <i data-lucide="eye" class="w-4 h-4 text-purple-600"></i>
                                <span>Explorar en Modo Solo Lectura</span>
                            </button>
                            <p class="text-[11px] text-slate-400 text-center mt-1.5">Permite recorrer todo el panel administrativo y auditoría con permisos de modificación deshabilitados.</p>
                        </div>
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();

            // Bind login form
            const form = mainContainer.querySelector('#login-form');
            form?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = mainContainer.querySelector('#login-email')?.value;
                const password = mainContainer.querySelector('#login-password')?.value;
                const btn = mainContainer.querySelector('#btn-submit-login');
                const errorBox = mainContainer.querySelector('#login-error-msg');
                if (errorBox) errorBox.classList.add('hidden');

                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Verificando...</span>`;

                try {
                    await window.AdminAuth.login(email, password);
                    this.showToast('Bienvenido a REGIA Admin', 'success');
                } catch (err) {
                    if (errorBox) {
                        errorBox.textContent = 'Credenciales no válidas o error de autenticación: ' + (err.message || err);
                        errorBox.classList.remove('hidden');
                    } else {
                        this.showToast('Error de autenticación: ' + (err.message || err), 'error');
                    }
                    btn.disabled = false;
                    btn.innerHTML = `<span>Iniciar Sesión</span>`;
                }
            });

            // Bind read-only demo access button
            mainContainer.querySelector('#btn-login-readonly')?.addEventListener('click', () => {
                window.AdminAuth.loginAsReadOnly();
                this.showToast('Sesión iniciada en Modo Solo Lectura (Demostración)', 'info');
            });
        },

        updateNavPermissions() {
            const isAdmin = window.AdminAuth.isAdmin();
            const canViewAudit = window.AdminAuth.canViewAudit();

            // 1. Auditoría: Visible para Administrador y Lector (demo), NUNCA para Editor
            const navAuditLink = document.querySelector('.nav-link[data-view="audit"]');
            if (navAuditLink) {
                if (canViewAudit) {
                    navAuditLink.classList.remove('hidden');
                } else {
                    navAuditLink.classList.add('hidden');
                }
            }

            // 2. Usuarios: Solo Administrador
            const navUsersLink = document.querySelector('.nav-link[data-view="users"]');
            if (navUsersLink) {
                if (isAdmin) {
                    navUsersLink.classList.remove('hidden');
                } else {
                    navUsersLink.classList.add('hidden');
                }
            }

            // 3. Copias y Restauración: Solo Administrador
            const navBackupsLink = document.querySelector('.nav-link[data-view="backups"]');
            if (navBackupsLink) {
                if (isAdmin) {
                    navBackupsLink.classList.remove('hidden');
                } else {
                    navBackupsLink.classList.add('hidden');
                }
            }
        },

        updateHeaderUser() {
            const nav = document.getElementById('admin-main-nav');
            const user = window.AdminAuth.getCurrentUser();

            if (!user) {
                if (nav) nav.classList.add('hidden');
                return;
            }

            if (nav) nav.classList.remove('hidden');

            const userNameEl = document.getElementById('user-display-name');
            const userRoleEl = document.getElementById('user-display-role');

            if (userNameEl) userNameEl.textContent = user.nombre || user.email;
            if (userRoleEl) {
                const roleInfo = window.AdminAuth.getRoleInfo();
                userRoleEl.textContent = roleInfo.label;
                userRoleEl.className = `px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${roleInfo.badgeClass}`;
            }

            // Control estricto de visibilidad por rol
            this.updateNavPermissions();

            if (window.lucide) window.lucide.createIcons();
        },

        bindGlobalEvents() {
            // Navigation Links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const view = link.getAttribute('data-view');
                    this.navigate(view);
                });
            });

            // Logout Button
            document.getElementById('btn-logout')?.addEventListener('click', async () => {
                if (confirm('¿Desea cerrar la sesión del panel administrativo?')) {
                    await window.AdminAuth.logout();
                    this.renderLogin();
                }
            });

            // Settings modal triggers
            document.getElementById('btn-header-settings')?.addEventListener('click', () => {
                this.showSettingsModal();
            });
        },

        showSettingsModal() {
            const modal = document.getElementById('admin-settings-modal');
            if (!modal) return;

            const user = window.AdminAuth.getCurrentUser();
            const isAdmin = window.AdminAuth.isAdmin();

            // Actualizar información de la cuenta en el modal
            const userNameEl = modal.querySelector('#settings-user-name');
            const userEmailEl = modal.querySelector('#settings-user-email');
            const userAvatarEl = modal.querySelector('#settings-user-avatar');
            const userRoleBadge = modal.querySelector('#settings-user-role-badge');
            const modalTitleEl = modal.querySelector('#settings-modal-title');
            const techSection = modal.querySelector('#settings-technical-admin-section');
            const submitSettingsBtn = modal.querySelector('#btn-submit-settings');

            if (user) {
                if (userNameEl) userNameEl.textContent = user.nombre || user.email;
                if (userEmailEl) userEmailEl.textContent = user.email;
                if (userAvatarEl) {
                    const initials = (user.nombre || user.email || 'U').substring(0, 2).toUpperCase();
                    userAvatarEl.textContent = initials;
                }
                if (userRoleBadge) {
                    const roleInfo = window.AdminAuth.getRoleInfo();
                    userRoleBadge.textContent = roleInfo.label;
                    userRoleBadge.className = `px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${roleInfo.badgeClass}`;
                }
            }

            // Ocultar sección técnica para todo perfil que NO sea administrador
            if (!isAdmin) {
                if (techSection) techSection.classList.add('hidden');
                if (submitSettingsBtn) submitSettingsBtn.classList.add('hidden');
                if (modalTitleEl) modalTitleEl.textContent = 'Mi Cuenta y Seguridad';
            } else {
                if (techSection) techSection.classList.remove('hidden');
                if (submitSettingsBtn) submitSettingsBtn.classList.remove('hidden');
                if (modalTitleEl) modalTitleEl.textContent = 'Configuración del Panel (Administrador)';
            }

            const isDefault = window.AdminAPI.isUsingDefaultKey();
            const customKey = window.AdminAPI.getUserCustomGeminiKey();
            const keyInput = modal.querySelector('#settings-gemini-key');
            const statusBadge = modal.querySelector('#gemini-key-status-badge');
            const resetBtn = modal.querySelector('#btn-reset-default-key');
            const toggleBtn = modal.querySelector('#btn-toggle-key-visibility');

            function updateUI() {
                const currentlyUsingDefault = window.AdminAPI.isUsingDefaultKey();
                const currentCustomKey = window.AdminAPI.getUserCustomGeminiKey();

                if (keyInput) {
                    keyInput.value = currentCustomKey;
                    keyInput.type = 'password';
                }
                if (toggleBtn) toggleBtn.textContent = 'Mostrar';

                if (statusBadge) {
                    if (currentlyUsingDefault) {
                        statusBadge.className = 'text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200';
                        statusBadge.textContent = 'Clave oficial activa';
                    } else {
                        statusBadge.className = 'text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
                        statusBadge.textContent = 'Clave personalizada activa';
                    }
                }

                if (resetBtn) {
                    if (!currentlyUsingDefault && !window.AdminAuth.isReadOnly()) {
                        resetBtn.classList.remove('hidden');
                    } else {
                        resetBtn.classList.add('hidden');
                    }
                }

                if (window.AdminAuth.isReadOnly()) {
                    if (keyInput) keyInput.disabled = true;
                    if (submitSettingsBtn) {
                        submitSettingsBtn.disabled = true;
                        submitSettingsBtn.classList.add('opacity-50', 'cursor-not-allowed');
                        submitSettingsBtn.title = 'Modo Solo Lectura: Modificación deshabilitada';
                    }
                }
            }

            updateUI();

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();

            // Toggle visibility
            if (toggleBtn) {
                toggleBtn.onclick = () => {
                    if (keyInput.type === 'password') {
                        keyInput.type = 'text';
                        toggleBtn.textContent = 'Ocultar';
                    } else {
                        keyInput.type = 'password';
                        toggleBtn.textContent = 'Mostrar';
                    }
                };
            }

            // Reset default key
            if (resetBtn) {
                resetBtn.onclick = () => {
                    window.AdminAPI.setGeminiKey('');
                    updateUI();
                    this.showToast('Se restableció la clave oficial por defecto', 'info');
                };
            }

            // Close
            modal.querySelector('#btn-close-settings')?.addEventListener('click', () => modal.classList.add('hidden'));
            modal.querySelector('#btn-cancel-settings')?.addEventListener('click', () => modal.classList.add('hidden'));

            // Save settings
            modal.querySelector('#form-settings')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const newKey = keyInput?.value?.trim() || '';
                window.AdminAPI.setGeminiKey(newKey);
                if (newKey) {
                    this.showToast('Clave personalizada guardada para este navegador', 'success');
                } else {
                    this.showToast('Configuración guardada (usando clave oficial por defecto)', 'success');
                }
                updateUI();
                modal.classList.add('hidden');
            });

            // Change Own Password
            const newPwInput = modal.querySelector('#settings-new-password');
            const confirmPwInput = modal.querySelector('#settings-confirm-password');
            const changePwBtn = modal.querySelector('#btn-change-own-password');
            const pwSection = modal.querySelector('#user-password-change-section');

            if (window.AdminAuth.isReadOnly()) {
                if (pwSection) pwSection.classList.add('hidden');
            } else {
                if (pwSection) pwSection.classList.remove('hidden');
            }

            if (changePwBtn) {
                changePwBtn.onclick = async () => {
                    const newPw = newPwInput?.value?.trim() || '';
                    const confirmPw = confirmPwInput?.value?.trim() || '';

                    if (!newPw || newPw.length < 6) {
                        this.showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
                        return;
                    }
                    if (newPw !== confirmPw) {
                        this.showToast('Las contraseñas no coinciden', 'error');
                        return;
                    }

                    changePwBtn.disabled = true;
                    changePwBtn.innerHTML = `<span>Actualizando...</span>`;

                    try {
                        await window.AdminAuth.updateOwnPassword(newPw);
                        this.showToast('¡Contraseña actualizada correctamente!', 'success');
                        if (newPwInput) newPwInput.value = '';
                        if (confirmPwInput) confirmPwInput.value = '';
                    } catch (err) {
                        this.showToast('Error al actualizar contraseña: ' + (err.message || err), 'error');
                    } finally {
                        changePwBtn.disabled = false;
                        changePwBtn.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i><span>Actualizar Contraseña</span>`;
                        if (window.lucide) window.lucide.createIcons();
                    }
                };
            }

            // Copy SQL Migration
            modal.querySelector('#btn-copy-migration')?.addEventListener('click', () => {
                const sqlText = `-- Ejecutar en Supabase SQL Editor:
-- migration.sql disponible en la carpeta /admin/migration.sql`;
                navigator.clipboard.writeText(sqlText);
                this.showToast('Instrucciones copiadas al portapapeles', 'info');
            });
        },

        showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            const bgClass = 
                type === 'success' ? 'bg-emerald-600 text-white' :
                type === 'error' ? 'bg-red-600 text-white' :
                type === 'warning' ? 'bg-amber-600 text-white' :
                'bg-slate-800 text-white';

            toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-medium ${bgClass} transition-all transform translate-y-2 opacity-0 duration-200`;
            toast.innerHTML = `
                <span>${message}</span>
            `;

            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            });

            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 200);
            }, 3500);
        }
    };

    window.AdminApp = AdminApp;

    // Start on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        AdminApp.init();
    });
})();
