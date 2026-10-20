// admin/auth.js — Autenticación y Control de Acceso basado en Roles (RBAC) para el Panel de Administración
(function() {
    let currentUser = null;
    let authListeners = [];

    const DEMO_USERS = {
        'admin@paho.org': {
            id: 'demo-admin-uuid',
            email: 'admin@paho.org',
            nombre: 'Administrador OPS',
            rol: 'administrador',
            isDemo: true
        },
        'editor@paho.org': {
            id: 'demo-editor-uuid',
            email: 'editor@paho.org',
            nombre: 'Editor Regulatorio',
            rol: 'editor',
            isDemo: true
        }
    };

    const AdminAuth = {
        init() {
            // Restore from localStorage if present
            try {
                const saved = localStorage.getItem(window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER);
                if (saved) {
                    currentUser = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('[AdminAuth] Error reading saved user', e);
            }

            // Also check Supabase session if available
            const client = window.AdminAPI?.getClient();
            if (client && !currentUser?.isDemo) {
                client.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        this.resolveUserProfile(session.user);
                    }
                });

                client.auth.onAuthStateChange((event, session) => {
                    if (session?.user) {
                        this.resolveUserProfile(session.user);
                    } else if (!currentUser?.isDemo) {
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

            // 1. Check Demo accounts first for seamless local development
            if (DEMO_USERS[cleanEmail]) {
                const user = DEMO_USERS[cleanEmail];
                currentUser = user;
                localStorage.setItem(window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
                this.notifyListeners();
                return { ok: true, user };
            }

            // 2. Authenticate with Supabase Auth
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

        // Fast demo login for UI testing
        loginAsDemo(role = 'administrador') {
            const email = role === 'administrador' ? 'admin@paho.org' : 'editor@paho.org';
            const user = DEMO_USERS[email];
            currentUser = user;
            localStorage.setItem(window.ADMIN_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
            this.notifyListeners();
            return user;
        },

        async logout() {
            const client = window.AdminAPI?.getClient();
            if (client && !currentUser?.isDemo) {
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
            return currentUser?.rol === 'editor' || currentUser?.rol === 'administrador';
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
