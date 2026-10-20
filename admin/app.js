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
                this.navigate('dashboard');
            }

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
            this.state.currentView = view;
            this.state.params = params;

            // Highlight active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                const targetView = link.getAttribute('data-view');
                if (targetView === view) {
                    link.className = 'nav-link px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 flex items-center gap-1.5 transition';
                } else {
                    link.className = 'nav-link px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition';
                }
            });

            const mainContainer = document.getElementById('admin-main-container');
            if (!mainContainer) return;

            // Route view
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
                default:
                    window.AdminDashboard.render(mainContainer);
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
                const isAdmin = user.rol === 'administrador';
                userRoleEl.textContent = isAdmin ? 'Administrador' : 'Editor';
                userRoleEl.className = `px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                    isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`;
            }

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
                    if (!currentlyUsingDefault) {
                        resetBtn.classList.remove('hidden');
                    } else {
                        resetBtn.classList.add('hidden');
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
