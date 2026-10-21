// admin/auth.js — Autenticación y Control de Acceso basado en Roles (RBAC) para el Panel de Administración
(function() {
    let currentUser = null;
    let authListeners = [];

    const AdminAuth = {
        init() {
            // Restore from localStorage if present
            try {
                const storageKey = window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER;
                const saved = localStorage.getItem(storageKey) || localStorage.getItem('reglac_admin_user_v1');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Discard demo accounts if any were stored previously
                    if (parsed && !parsed.isDemo) {
                        currentUser = parsed;
                        localStorage.setItem(storageKey, JSON.stringify(parsed));
                        localStorage.removeItem('reglac_admin_user_v1');
                    } else {
                        localStorage.removeItem(storageKey);
                        localStorage.removeItem('reglac_admin_user_v1');
                    }
                }
            } catch (e) {
                console.warn('[AdminAuth] Error reading saved user', e);
            }

            // Also check Supabase session if available
            const client = window.AdminAPI?.getClient();
            if (client) {
                client.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        this.resolveUserProfile(session.user);
                    }
                });

                client.auth.onAuthStateChange((event, session) => {
                    if (session?.user) {
                        this.resolveUserProfile(session.user);
                    } else {
                        currentUser = null;
                        localStorage.removeItem(window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER);
                        this.notifyListeners();
                    }
                });
            }
        },

        async resolveUserProfile(sbUser) {
            const client = window.AdminAPI?.getClient();
            let profile = {
                id: sbUser.id,
                email: sbUser.email,
                nombre: sbUser.user_metadata?.nombre || sbUser.email.split('@')[0],
                rol: sbUser.user_metadata?.rol || 'editor'
            };

            if (client) {
                try {
                    const { data, error } = await client
                        .from('admin_profiles')
                        .select('*')
                        .eq('id', sbUser.id)
                        .maybeSingle();
                    if (!error && data) {
                        profile.nombre = data.nombre || profile.nombre;
                        profile.rol = data.rol || profile.rol;
                    }
                } catch (_) {}
            }

            currentUser = profile;
            localStorage.setItem(window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(profile));
            this.notifyListeners();
            return profile;
        },

        async login(email, password) {
            const cleanEmail = (email || '').trim().toLowerCase();

            // Authenticate with Supabase Auth
            const client = window.AdminAPI?.getClient();
            if (!client) {
                throw new Error('Supabase no está conectado');
            }

            const { data, error } = await client.auth.signInWithPassword({
                email: cleanEmail,
                password
            });

            if (error) {
                throw error;
            }

            const profile = await this.resolveUserProfile(data.user);
            return { ok: true, user: profile };
        },

        async logout() {
            const client = window.AdminAPI?.getClient();
            if (client && !currentUser?.isGuest) {
                try {
                    await client.auth.signOut();
                } catch (_) {}
            }
            currentUser = null;
            localStorage.removeItem(window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER);
            this.notifyListeners();
            return { ok: true };
        },

        getCurrentUser() {
            return currentUser;
        },

        isAuthenticated() {
            return !!currentUser;
        },

        isAdmin() {
            return currentUser?.rol === 'administrador';
        },

        isEditor() {
            return currentUser?.rol === 'editor';
        },

        isReadOnly() {
            return currentUser?.rol === 'lector' || currentUser?.rol === 'solo_lectura' || currentUser?.rol === 'viewer';
        },

        canEdit() {
            return currentUser?.rol === 'administrador' || currentUser?.rol === 'editor';
        },

        canViewAudit() {
            // El usuario administrador y el perfil de solo lectura (demostración) pueden ver auditoría.
            // Los editores de contenido NO pueden ver auditoría por requerimiento específico.
            return currentUser?.rol === 'administrador' || this.isReadOnly();
        },

        async updateOwnPassword(newPassword) {
            if (currentUser?.isGuest) {
                throw new Error('La cuenta de demostración (solo lectura) no admite cambio de contraseña.');
            }
            if (!newPassword || newPassword.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres.');
            }
            const client = window.AdminAPI?.getClient();
            if (!client) throw new Error('Cliente Supabase no conectado');

            const { data, error } = await client.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            return { ok: true, user: data.user };
        },

        loginAsReadOnly(guestName = 'Invitado (Solo Lectura)') {
            const guestUser = {
                id: 'guest-readonly-' + Date.now(),
                email: 'invitado@regia.ar',
                nombre: guestName,
                rol: 'lector',
                isGuest: true
            };
            currentUser = guestUser;
            localStorage.setItem(window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(guestUser));
            this.notifyListeners();
            return { ok: true, user: guestUser };
        },

        getRoleInfo() {
            if (this.isAdmin()) {
                return {
                    label: 'Administrador',
                    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200'
                };
            }
            if (this.isEditor()) {
                return {
                    label: 'Editor',
                    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200'
                };
            }
            return {
                label: 'Solo Lectura',
                badgeClass: 'bg-purple-100 text-purple-800 border border-purple-200'
            };
        },

        onAuthChange(callback) {
            authListeners.push(callback);
            return () => {
                authListeners = authListeners.filter(l => l !== callback);
            };
        },

        notifyListeners() {
            authListeners.forEach(cb => {
                try { cb(currentUser); } catch (e) { console.error(e); }
            });
        }
    };

    window.AdminAuth = AdminAuth;
})();
