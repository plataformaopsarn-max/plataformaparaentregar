// admin/api.js — Servicios de Base de Datos y Traducción con IA (OPS/OMS)
(function() {
    let supabaseClient = null;

    function getClient() {
        if (!supabaseClient && window.supabase) {
            const cfg = window.ADMIN_CONFIG || {};
            supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        }
        return supabaseClient;
    }

    // Local Storage helpers for fallback persistence
    const Storage = {
        get(key, defaultValue = []) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.warn('[Admin Storage] Error reading', key, e);
                return defaultValue;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('[Admin Storage] Error saving', key, e);
            }
        }
    };

    const AdminAPI = {
        getClient,

        // Verificación de permisos de edición (RBAC)
        checkEditPermission() {
            if (window.AdminAuth?.isReadOnly && window.AdminAuth.isReadOnly()) {
                throw new Error('Operación no permitida: El usuario actual tiene perfil de Solo Lectura (Demostración)');
            }
        },

        // Test Supabase connection
        async testConnection() {
            const client = getClient();
            if (!client) return { ok: false, error: 'Cliente Supabase no inicializado' };
            try {
                const { data, error } = await client.from('faq_rows_corregido').select('pais').limit(1);
                if (error) throw error;
                return { ok: true, data };
            } catch (err) {
                return { ok: false, error: err.message || err };
            }
        },

        // Check if custom admin tables exist
        async checkCustomTables() {
            const client = getClient();
            const result = { admin_profiles: false, translation_queue: false, content_sync_status: false, content_edit_log: false };
            if (!client) return result;

            try {
                const { error: err1 } = await client.from('admin_profiles').select('id').limit(1);
                if (!err1 || err1.code !== 'PGRST205') result.admin_profiles = true;
            } catch (_) {}

            try {
                const { error: err2 } = await client.from('translation_queue').select('id').limit(1);
                if (!err2 || err2.code !== 'PGRST205') result.translation_queue = true;
            } catch (_) {}

            try {
                const { error: err3 } = await client.from('content_sync_status').select('pais').limit(1);
                if (!err3 || err3.code !== 'PGRST205') result.content_sync_status = true;
            } catch (_) {}

            try {
                const { error: err4 } = await client.from('content_edit_log').select('id').limit(1);
                if (!err4 || err4.code !== 'PGRST205') result.content_edit_log = true;
            } catch (_) {}

            return result;
        },

        // Fetch all countries with sync stats
        async getCountriesOverview() {
            const client = getClient();
            let esRows = [];
            let enRows = [];
            let queue = await this.getTranslationQueue();

            if (client) {
                try {
                    const [resES, resEN] = await Promise.all([
                        client.from('faq_rows_corregido').select('pais'),
                        client.from('faq_rows_corregido_en').select('pais')
                    ]);
                    esRows = resES.data || [];
                    enRows = resEN.data || [];
                } catch (e) {
                    console.warn('[AdminAPI] Error loading countries from DB:', e);
                }
            }

            const enPaisSet = new Set(enRows.map(r => r.pais));
            const pendingByCountry = {};
            queue.filter(q => q.estado === 'pendiente').forEach(item => {
                pendingByCountry[item.pais] = (pendingByCountry[item.pais] || 0) + 1;
            });

            return {
                countriesES: esRows.map(r => r.pais),
                countriesEN: Array.from(enPaisSet),
                pendingCounts: pendingByCountry,
                totalPending: Object.values(pendingByCountry).reduce((a, b) => a + b, 0)
            };
        },

        // Get full country detail (ES and EN rows)
        async getCountryDetail(countryName) {
            const client = getClient();
            let esData = null;
            let enData = null;
            let resumen = null;

            if (client) {
                try {
                    const [resES, resEN, resResumen] = await Promise.all([
                        client.from('faq_rows_corregido').select('*').eq('pais', countryName).maybeSingle(),
                        client.from('faq_rows_corregido_en').select('*').eq('pais', countryName).maybeSingle(),
                        client.from('resumen_ejecutivo').select('*').eq('pais', countryName).maybeSingle()
                    ]);
                    esData = resES.data;
                    enData = resEN.data;
                    resumen = resResumen.data;
                } catch (e) {
                    console.error('[AdminAPI] getCountryDetail error:', e);
                }
            }

            return {
                pais: countryName,
                es: esData || {},
                en: enData || {},
                resumen: resumen || {}
            };
        },

        // Save an entire FAQ question group (ES or EN) with consolidated audit log
        async saveFaqQuestionGroup({ pais, lang, colPrefix, questionLabel, updateFields, oldValueFormatted, newValueFormatted, user }) {
            this.checkEditPermission();
            const client = getClient();
            const table = lang === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';

            if (!client) throw new Error('Cliente no conectado a Supabase');

            // 1. Update table row in a single query
            const { error } = await client
                .from(table)
                .update(updateFields)
                .eq('pais', pais);

            if (error) {
                // If row doesn't exist in EN table yet, create it
                if (lang === 'en') {
                    const { error: insertError } = await client
                        .from(table)
                        .insert({ pais, ...updateFields });
                    if (insertError) throw insertError;
                } else {
                    throw error;
                }
            }

            // 2. Audit log: EXACTLY ONE entry for this question with full diff
            await this.logEdit({
                pais,
                tabla: table,
                campo: questionLabel || colPrefix,
                idioma: lang,
                valor_anterior: oldValueFormatted || '',
                valor_nuevo: newValueFormatted || '',
                usuario_id: user?.id || null,
                usuario_nombre: user?.nombre || user?.email || 'Usuario'
            });

            // 3. Mark the opposite language as pending synchronization
            const oppositeLang = lang === 'es' ? 'en' : 'es';
            const oppositeTable = oppositeLang === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';
            await this.updateSyncStatus(pais, oppositeTable, colPrefix, false);

            return { ok: true };
        },

        // Save single field (backwards compatibility)
        async saveFaqField({ pais, lang, field, value, oldValue, user }) {
            this.checkEditPermission();
            const client = getClient();
            const table = lang === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';

            if (!client) throw new Error('Cliente no conectado');

            const updatePayload = { [field]: value };
            const { error } = await client
                .from(table)
                .update(updatePayload)
                .eq('pais', pais);

            if (error) {
                if (lang === 'en') {
                    const { error: insertError } = await client
                        .from(table)
                        .insert({ pais, [field]: value });
                    if (insertError) throw insertError;
                } else {
                    throw error;
                }
            }

            if (oldValue !== undefined && oldValue !== value) {
                await this.logEdit({
                    pais,
                    tabla: table,
                    campo: field,
                    idioma: lang,
                    valor_anterior: oldValue || '',
                    valor_nuevo: value || '',
                    usuario_id: user?.id || null,
                    usuario_nombre: user?.nombre || user?.email || 'Usuario'
                });
            }

            const oppositeLang = lang === 'es' ? 'en' : 'es';
            await this.updateSyncStatus(pais, table, field, false);

            return { ok: true };
        },

        // Audit log helper
        async logEdit(logItem) {
            const client = getClient();
            const item = {
                created_at: new Date().toISOString(),
                ...logItem
            };

            // Try DB
            if (client) {
                try {
                    await client.from('content_edit_log').insert(item);
                } catch (e) {
                    // Fallback to local
                }
            }

            // Always store in local fallback
            const localLogs = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.AUDIT_LOG, []);
            localLogs.unshift(item);
            if (localLogs.length > 200) localLogs.pop();
            Storage.set(window.ADMIN_CONFIG.STORAGE_KEYS.AUDIT_LOG, localLogs);
        },

        // Get audit log
        async getAuditLog(limit = 50) {
            const client = getClient();
            if (client) {
                try {
                    const { data, error } = await client
                        .from('content_edit_log')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(limit);
                    if (!error && data && data.length > 0) return data;
                } catch (_) {}
            }
            const localLogs = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.AUDIT_LOG, []);
            return localLogs.slice(0, limit);
        },

        // Sync Status helper
        async updateSyncStatus(pais, tabla, campo, sincronizado) {
            const client = getClient();
            const now = new Date().toISOString();
            const record = {
                pais,
                tabla,
                campo,
                sincronizado,
                es_updated_at: now
            };

            if (client) {
                try {
                    await client.from('content_sync_status').upsert(record);
                } catch (_) {}
            }

            const localSync = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.SYNC_STATUS, {});
            const key = `${pais}:${tabla}:${campo}`;
            localSync[key] = record;
            Storage.set(window.ADMIN_CONFIG.STORAGE_KEYS.SYNC_STATUS, localSync);
        },

        // Translation Queue: Read
        async getTranslationQueue(filter = 'todos') {
            const client = getClient();
            let items = [];

            if (client) {
                try {
                    let q = client.from('translation_queue').select('*').order('created_at', { ascending: false });
                    if (filter && filter !== 'todos') {
                        q = q.eq('estado', filter);
                    }
                    const { data, error } = await q;
                    if (!error && data) items = data;
                } catch (_) {}
            }

            // Merge / fallback with localStorage
            if (items.length === 0) {
                const localQueue = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, []);
                if (filter === 'todos' || !filter) items = localQueue;
                else items = localQueue.filter(i => i.estado === filter);
            }

            return items;
        },

        // Get pending desync items specifically for a country
        async getPendingDesyncsForCountry(pais) {
            const client = getClient();
            let items = [];

            if (client) {
                try {
                    const { data, error } = await client
                        .from('translation_queue')
                        .select('*')
                        .eq('pais', pais)
                        .eq('estado', 'pendiente');
                    if (!error && data) items = data;
                } catch (_) {}
            }

            if (items.length === 0) {
                const localQueue = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, []);
                items = localQueue.filter(i => i.pais === pais && i.estado === 'pendiente');
            }

            return items;
        },

        // Register a question desync when one language is modified
        async registerTranslationDesync({ pais, colPrefix, questionLabel, sourceLang, targetLang, sourceText, currentTargetText }) {
            this.checkEditPermission();
            const client = getClient();
            const targetTable = targetLang === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';
            const now = new Date().toISOString();

            const itemData = {
                pais,
                tabla: targetTable,
                campo: colPrefix,
                idioma_origen: sourceLang,
                idioma_destino: targetLang,
                texto_origen: sourceText || '',
                texto_anterior: currentTargetText || '',
                traduccion_sugerida: '',
                estado: 'pendiente',
                created_at: now
            };

            // Check if already exists in DB as 'pendiente'
            if (client) {
                try {
                    const { data: existing } = await client
                        .from('translation_queue')
                        .select('id')
                        .eq('pais', pais)
                        .eq('campo', colPrefix)
                        .eq('idioma_destino', targetLang)
                        .eq('estado', 'pendiente')
                        .maybeSingle();

                    if (existing && existing.id) {
                        await client.from('translation_queue').update({
                            texto_origen: sourceText || '',
                            texto_anterior: currentTargetText || '',
                            created_at: now
                        }).eq('id', existing.id);
                        return { id: existing.id, ...itemData };
                    } else {
                        const { data: inserted } = await client.from('translation_queue').insert([itemData]).select();
                        if (inserted && inserted[0]) return inserted[0];
                    }
                } catch (e) {
                    console.warn('[AdminAPI] Translation queue DB upsert notice:', e);
                }
            }

            // Fallback / sync local storage
            const localQueue = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, []);
            const existingIdx = localQueue.findIndex(q => q.pais === pais && q.campo === colPrefix && q.idioma_destino === targetLang && q.estado === 'pendiente');
            if (existingIdx >= 0) {
                localQueue[existingIdx].texto_origen = sourceText || '';
                localQueue[existingIdx].texto_anterior = currentTargetText || '';
                localQueue[existingIdx].created_at = now;
            } else {
                localQueue.unshift({ id: Date.now(), ...itemData });
            }
            Storage.set(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, localQueue);

            // Update sync status to out of sync
            await this.updateSyncStatus(pais, targetTable, colPrefix, false);

            return itemData;
        },

        // Dismiss desync alert (editor explicitly discarded or resolved it)
        async dismissDesyncAlert(pais, colPrefix, targetLang) {
            this.checkEditPermission();
            const client = getClient();
            const targetTable = targetLang === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';
            const now = new Date().toISOString();

            if (client) {
                try {
                    await client.from('translation_queue').update({
                        estado: 'descartado',
                        revisado_at: now
                    })
                    .eq('pais', pais)
                    .eq('campo', colPrefix)
                    .eq('estado', 'pendiente');
                } catch (_) {}
            }

            const localQueue = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, []);
            localQueue.forEach(q => {
                if (q.pais === pais && q.campo === colPrefix && q.estado === 'pendiente') {
                    q.estado = 'descartado';
                    q.revisado_at = now;
                }
            });
            Storage.set(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, localQueue);

            // Mark as synchronized
            await this.updateSyncStatus(pais, targetTable, colPrefix, true);
            return { ok: true };
        },

        // Translation Queue: Add manual/arbitrary item
        async addToTranslationQueue(item) {
            this.checkEditPermission();
            const client = getClient();
            const queueItem = {
                id: Date.now(),
                created_at: new Date().toISOString(),
                estado: 'pendiente',
                ...item
            };

            if (client) {
                try {
                    const { data, error } = await client.from('translation_queue').insert([item]).select();
                    if (!error && data && data[0]) return data[0];
                } catch (_) {}
            }

            // Local fallback
            const localQueue = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, []);
            localQueue.unshift(queueItem);
            Storage.set(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, localQueue);
            return queueItem;
        },

        // Translation Queue: Update status & apply
        async updateQueueItem({ id, estado, textoAprobado, usuario }) {
            this.checkEditPermission();
            const client = getClient();
            const now = new Date().toISOString();
            const localQueue = Storage.get(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, []);
            const targetIndex = localQueue.findIndex(q => String(q.id) === String(id));
            let targetItem = targetIndex >= 0 ? localQueue[targetIndex] : null;

            if (client) {
                try {
                    const { data } = await client.from('translation_queue').select('*').eq('id', id).maybeSingle();
                    if (data) targetItem = data;
                } catch (_) {}
            }

            if (!targetItem) throw new Error('Item no encontrado en cola');

            const finalText = textoAprobado !== undefined ? textoAprobado : targetItem.traduccion_sugerida;
            const targetTable = targetItem.idioma_destino === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';

            // If approved, write into the target table
            if (estado === 'aprobado' || estado === 'editado') {
                if (client) {
                    try {
                        const updateObj = {};
                        if (targetItem.campo.includes('_directa') || targetItem.campo.includes('_ampliada') || targetItem.campo.includes('_fuente')) {
                            updateObj[targetItem.campo] = finalText;
                        } else {
                            // If field is just question code like q_1_1, parse sections if present, or set ampliada
                            if (finalText.includes('[Respuesta Directa]') || finalText.includes('[Respuesta Ampliada]')) {
                                const directMatch = finalText.match(/\[Respuesta Directa\]\s*\n([\s\S]*?)(?=\n\s*\[|$)/i);
                                const ampMatch = finalText.match(/\[Respuesta Ampliada\]\s*\n([\s\S]*?)(?=\n\s*\[|$)/i);
                                const fuenteMatch = finalText.match(/\[Fuente(?: Normativa)?\]\s*\n([\s\S]*?)(?=\n\s*\[|$)/i);
                                if (directMatch) updateObj[`${targetItem.campo}_directa`] = directMatch[1].trim();
                                if (ampMatch) updateObj[`${targetItem.campo}_ampliada`] = ampMatch[1].trim();
                                if (fuenteMatch) updateObj[`${targetItem.campo}_fuente`] = fuenteMatch[1].trim();
                            } else {
                                updateObj[`${targetItem.campo}_ampliada`] = finalText;
                            }
                        }

                        if (Object.keys(updateObj).length > 0) {
                            await client
                                .from(targetTable)
                                .update(updateObj)
                                .eq('pais', targetItem.pais);
                        }
                    } catch (err) {
                        console.error('[AdminAPI] Error applying approved translation to DB:', err);
                    }
                }
            }

            // Update in DB
            if (client) {
                try {
                    await client.from('translation_queue').update({
                        estado,
                        traduccion_sugerida: finalText,
                        revisado_por: usuario?.id || null,
                        revisado_at: now
                    }).eq('id', id);
                } catch (_) {}
            }

            // Update in localStorage
            if (targetIndex >= 0) {
                localQueue[targetIndex].estado = estado;
                localQueue[targetIndex].traduccion_sugerida = finalText;
                localQueue[targetIndex].revisado_at = now;
                Storage.set(window.ADMIN_CONFIG.STORAGE_KEYS.TRANSLATION_QUEUE, localQueue);
            }

            // If approved or discarded, update sync status to true
            if (estado === 'aprobado' || estado === 'editado' || estado === 'descartado') {
                await this.updateSyncStatus(targetItem.pais, targetTable, targetItem.campo, true);
            }

            return { ok: true };
        },

        // Resources / Enlaces
        async getCountryEnlaces(pais) {
            const client = getClient();
            if (!client) return [];
            try {
                const [resEnlaces, resDescEN] = await Promise.all([
                    client.from('enlaces').select('*').eq('pais', pais).order('question_code'),
                    client.from('enlaces_descripcion_en').select('*')
                ]);

                const enlaces = resEnlaces.data || [];
                const enMap = new Map((resDescEN.data || []).map(d => [d.id, d.proposito_descripcion_en]));

                return enlaces.map(e => ({
                    ...e,
                    proposito_descripcion_en: enMap.get(e.id) || ''
                }));
            } catch (e) {
                console.error('[AdminAPI] Error fetching enlaces:', e);
                return [];
            }
        },

        async saveEnlace({ id, pais, question_code, titulo, enlace, proposito_descripcion, proposito_descripcion_en }) {
            this.checkEditPermission();
            const client = getClient();
            if (!client) throw new Error('Cliente no conectado');

            // Save Spanish enlace
            if (id) {
                await client.from('enlaces').update({
                    titulo,
                    enlace,
                    proposito_descripcion,
                    question_code
                }).eq('id', id);
            } else {
                const { data, error } = await client.from('enlaces').insert([{
                    pais,
                    titulo,
                    enlace,
                    proposito_descripcion,
                    question_code
                }]).select();
                if (error) throw error;
                id = data[0].id;
            }

            // Save English description if provided
            if (proposito_descripcion_en) {
                await client.from('enlaces_descripcion_en').upsert({
                    id,
                    proposito_descripcion_en
                });
            }

            // Audit log
            const user = window.AdminAuth ? window.AdminAuth.getCurrentUser() : null;
            await this.logEdit({
                pais,
                tabla: 'enlaces',
                campo: `Sec. ${question_code}: ${titulo}`,
                idioma: 'es/en',
                valor_anterior: id ? '(Recurso editado)' : '(Nuevo recurso)',
                valor_nuevo: `${titulo} - ${enlace}`,
                usuario_id: user?.id || null,
                usuario_nombre: user?.nombre || user?.email || 'Usuario'
            });

            return { ok: true, id };
        },

        async deleteEnlace(id) {
            this.checkEditPermission();
            const client = getClient();
            if (!client) throw new Error('Cliente no conectado');

            const user = window.AdminAuth ? window.AdminAuth.getCurrentUser() : null;
            await this.logEdit({
                pais: '-',
                tabla: 'enlaces',
                campo: `ID ${id}`,
                idioma: 'es/en',
                valor_anterior: `Recurso ID ${id}`,
                valor_nuevo: '(Eliminado)',
                usuario_id: user?.id || null,
                usuario_nombre: user?.nombre || user?.email || 'Usuario'
            });

            await client.from('enlaces_descripcion_en').delete().eq('id', id);
            await client.from('enlaces').delete().eq('id', id);
            return { ok: true };
        },

        // --- USER MANAGEMENT (RBAC) ---
        async getAdminUsers() {
            const client = getClient();
            if (!client) throw new Error('Cliente no conectado a Supabase');

            // 1. Intentar vía función RPC
            try {
                const { data, error } = await client.rpc('admin_list_users');
                if (!error && data) {
                    return { ok: true, users: data, rpcActive: true };
                }
            } catch (_) {}

            // 2. Fallback: Consultar directamente admin_profiles
            try {
                const { data, error } = await client.from('admin_profiles').select('*').order('created_at', { ascending: false });
                if (!error && data && data.length > 0) {
                    return { ok: true, users: data, rpcActive: false };
                }
            } catch (_) {}

            // 3. Fallback: Retornar usuario en sesión
            const currentUser = window.AdminAuth?.getCurrentUser();
            const fallbackUsers = currentUser ? [currentUser] : [];
            return { ok: true, users: fallbackUsers, rpcActive: false };
        },

        async createAdminUser({ email, password, nombre, rol }) {
            this.checkEditPermission();
            const client = getClient();
            if (!client) throw new Error('Cliente no conectado');

            try {
                const { data, error } = await client.rpc('admin_create_user', {
                    new_email: email,
                    new_password: password,
                    new_nombre: nombre,
                    new_rol: rol
                });
                if (!error && data) {
                    return { ok: true, user: data };
                }
                if (error) throw error;
            } catch (err) {
                if (err.message && (err.message.includes('function') || err.message.includes('admin_create_user') || err.code === 'PGRST202')) {
                    throw new Error('La función de base de datos no está instalada. Debe ejecutar el script SQL (sección 6 de migration.sql) en el SQL Editor de Supabase.');
                }
                throw err;
            }
        },

        async updateAdminUser({ id, nombre, rol, activo, password }) {
            this.checkEditPermission();
            const client = getClient();
            if (!client) throw new Error('Cliente no conectado');

            try {
                const { data, error } = await client.rpc('admin_update_user', {
                    target_user_id: id,
                    new_nombre: nombre,
                    new_rol: rol,
                    new_activo: activo,
                    new_password: password || null
                });
                if (!error && data) return { ok: true };
                if (error) throw error;
            } catch (err) {
                try {
                    const updateData = { nombre, rol, activo };
                    const { error } = await client.from('admin_profiles').update(updateData).eq('id', id);
                    if (!error) return { ok: true };
                } catch (_) {}
                throw err;
            }
        },

        async deleteAdminUser(id) {
            this.checkEditPermission();
            const client = getClient();
            if (!client) throw new Error('Cliente no conectado');

            try {
                const { data, error } = await client.rpc('admin_delete_user', { target_user_id: id });
                if (!error && data) return { ok: true };
                if (error) throw error;
            } catch (err) {
                try {
                    const { error } = await client.from('admin_profiles').delete().eq('id', id);
                    if (!error) return { ok: true };
                } catch (_) {}
                throw err;
            }
        },

        // --- GEMINI TRANSLATION MOTOR ---
        getGeminiKey() {
            const storageKey = window.ADMIN_CONFIG?.STORAGE_KEYS?.GEMINI_API_KEY || 'regia_admin_gemini_key';
            const userKey = localStorage.getItem(storageKey) || localStorage.getItem('reglac_admin_gemini_key');
            if (userKey && userKey.trim()) {
                return userKey.trim();
            }
            return window.ADMIN_CONFIG?.DEFAULT_GEMINI_KEY || window.ENV_GEMINI_API_KEY || '';
        },

        getUserCustomGeminiKey() {
            const storageKey = window.ADMIN_CONFIG?.STORAGE_KEYS?.GEMINI_API_KEY || 'regia_admin_gemini_key';
            return localStorage.getItem(storageKey) || localStorage.getItem('reglac_admin_gemini_key') || '';
        },

        isUsingDefaultKey() {
            const storageKey = window.ADMIN_CONFIG?.STORAGE_KEYS?.GEMINI_API_KEY || 'regia_admin_gemini_key';
            const userKey = localStorage.getItem(storageKey) || localStorage.getItem('reglac_admin_gemini_key');
            return !userKey || !userKey.trim();
        },

        setGeminiKey(key) {
            const storageKey = window.ADMIN_CONFIG?.STORAGE_KEYS?.GEMINI_API_KEY || 'regia_admin_gemini_key';
            localStorage.removeItem('reglac_admin_gemini_key');
            if (!key || !key.trim()) {
                localStorage.removeItem(storageKey);
            } else {
                localStorage.setItem(storageKey, key.trim());
            }
        },

        async translateWithGemini({ text, sourceLang = 'es', targetLang = 'en', existingTargetText = '', context = '' }) {
            const apiKey = this.getGeminiKey();
            if (!apiKey) {
                throw new Error('MISSING_API_KEY');
            }

            const systemPrompt = `You are a professional regulatory translator specialized in Latin American and Caribbean clinical trial frameworks for the Pan American Health Organization (PAHO/WHO).
Your task is to translate regulatory text between Spanish and English with maximum legal and technical fidelity.

CRITICAL REGULATORY RULES:
1. Official law/decree/regulation names and numbers MUST REMAIN in original Spanish (e.g., "Decreto 1490/1992", "Disposición ANMAT 7516/2025", "Resolución 1480/2011", "Ley General de Salud"). Never translate the proper names of acts.
2. Standard regulatory acronyms:
   - Autoridad Regulatoria Nacional (ARN) -> National Regulatory Authority (NRA)
   - Comité de Ética de la Investigación (CEI) -> Research Ethics Committee (REC)
   - Buenas Prácticas Clínicas (BPC) -> Good Clinical Practices (GCP)
   - Buenas Prácticas de Manufactura (BPM) -> Good Manufacturing Practices (GMP)
   - Evento Adverso Serio (EAS) -> Serious Adverse Event (SAE)
   - Reacción Adversa Seria e Inesperada (RASI / SUSAR) -> Suspected Unexpected Serious Adverse Reaction (SUSAR)
   - Organización de Investigación por Contrato (OIC / CRO) -> Contract Research Organization (CRO)
   - Producto en Investigación (PI) -> Investigational Product (IP)
3. Maintain an institutional, precise, neutral tone.
4. Output STRICT JSON format only with these keys:
   {
     "translatedText": "the complete translated text",
     "detectedNovelty": "brief summary (in ${sourceLang === 'es' ? 'Spanish' : 'English'}) of what was changed or added compared to the existing target version, or 'Nueva traducción completa' if none existed"
   }`;

            const userPrompt = `SOURCE LANGUAGE: ${sourceLang.toUpperCase()}
TARGET LANGUAGE: ${targetLang.toUpperCase()}
REGULATORY CONTEXT: ${context || 'Ficha regulatoria de ensayos clínicos OPS'}
EXISTING TARGET TEXT (to detect differences): "${existingTargetText || ''}"

TEXT TO TRANSLATE:
"""
${text}
"""

Return JSON only.`;

            const candidateModels = [
                window.ADMIN_CONFIG?.GEMINI_MODEL || 'gemini-3.8-flash',
                'gemini-3.8-flash',
                'gemini-flash-latest',
                'gemini-3.6-flash',
                'gemini-3.5-flash',
                'gemini-3.5-flash-lite',
                'gemini-3.1-flash-lite'
            ];
            // Deduplicate candidate models
            const modelsToTry = Array.from(new Set(candidateModels));

            let lastError = null;
            let successData = null;
            let usedModel = modelsToTry[0];

            function isRecoverableError(errMsg, status) {
                const lower = (errMsg || '').toLowerCase();
                return (
                    status === 404 ||
                    status === 429 ||
                    status === 503 ||
                    status === 500 ||
                    lower.includes('no longer available') ||
                    lower.includes('not found') ||
                    lower.includes('high demand') ||
                    lower.includes('spikes in demand') ||
                    lower.includes('overloaded') ||
                    lower.includes('temporarily') ||
                    lower.includes('resource_exhausted') ||
                    lower.includes('quota')
                );
            }

            for (const model of modelsToTry) {
                try {
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [
                                { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
                            ],
                            generationConfig: {
                                temperature: 0.1,
                                responseMimeType: 'application/json'
                            }
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        const errMsg = errData.error?.message || `Error HTTP ${response.status} de Gemini API`;
                        
                        // If recoverable error (high demand, retired model, 503, 429), try next model
                        if (isRecoverableError(errMsg, response.status)) {
                            console.warn(`[Gemini Fallback] Modelo ${model} saturado o no disponible (${errMsg}). Probando siguiente modelo...`);
                            lastError = new Error(errMsg);
                            continue;
                        }
                        throw new Error(errMsg);
                    }

                    successData = await response.json();
                    usedModel = model;
                    break; // Success!
                } catch (err) {
                    lastError = err;
                    if (isRecoverableError(err.message, 0)) {
                        console.warn(`[Gemini Fallback] Excepción en ${model}: ${err.message}. Probando siguiente modelo...`);
                        continue;
                    }
                    throw err;
                }
            }

            if (!successData) {
                throw lastError || new Error('No se pudo conectar con ningún modelo de Gemini disponible');
            }

            // Extract parts from candidates[0].content.parts (Gemini standard)
            const candidate = successData.candidates?.[0];
            const parts = candidate?.content?.parts || candidate?.parts || [];
            
            // Extract text parts (excluding thinking tokens)
            const textParts = parts.filter(p => p.text && !p.thought).map(p => p.text);
            const rawContent = textParts.join('\n') || (parts[0]?.text) || '{}';

            let cleanJson = rawContent.trim();
            // Clean markdown code blocks if returned
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            }

            let parsed = {};
            try {
                parsed = JSON.parse(cleanJson);
            } catch (e) {
                console.warn('[AdminAPI] Fallback parse:', cleanJson);
                parsed = { translatedText: cleanJson, detectedNovelty: 'Traducción directa' };
            }

            const translatedText = 
                parsed.translatedText || 
                parsed.translation || 
                parsed.translated_text || 
                parsed.textoTraducido || 
                parsed.texto_traducido || 
                (typeof parsed === 'string' ? parsed : cleanJson);

            const detectedNovelty = 
                parsed.detectedNovelty || 
                parsed.novelty || 
                parsed.novedad || 
                parsed.detected_novelty || 
                'Actualización de contenido';

            return {
                translatedText: translatedText || '',
                detectedNovelty: detectedNovelty || 'Actualización de contenido',
                engine: usedModel
            };
        },

        // --- BACKUPS & DISASTER RECOVERY ---
        async fetchTableData(tableName) {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase no conectado');
            let all = [];
            let from = 0;
            const step = 1000;
            while (true) {
                const { data, error } = await client.from(tableName).select('*').range(from, from + step - 1);
                if (error) throw error;
                if (!data || data.length === 0) break;
                all = all.concat(data);
                if (data.length < step) break;
                from += step;
            }
            return all;
        },

        async exportFullDatabase() {
            const tables = ['faq_rows_corregido', 'faq_rows_corregido_en', 'enlaces', 'enlaces_descripcion_en', 'resumen_ejecutivo'];
            const dump = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    exportedBy: window.AdminAuth?.getCurrentUser()?.email || 'Administrador',
                    platform: 'REGIA Admin (OPS/OMS)',
                    version: '2.0'
                },
                tables: {}
            };

            for (const t of tables) {
                try {
                    dump.tables[t] = await this.fetchTableData(t);
                } catch (e) {
                    console.warn(`[AdminAPI] Error exportando tabla ${t}:`, e);
                    dump.tables[t] = [];
                }
            }
            return dump;
        },

        async getAvailableSnapshots() {
            function cleanBackupMessage(raw) {
                let msg = (raw || '').replace(/\[skip ci\]/gi, '').replace(/\[ci skip\]/gi, '').trim();
                if (/auto-backup:\s*respaldo de tablas descargado desde api rest/i.test(msg)) {
                    return 'Respaldo Automático (API REST)';
                }
                if (/update automatic backup script and save fresh daily snapshot/i.test(msg)) {
                    return 'Respaldo Inicial de Tablas';
                }
                return msg;
            }

            // Lista histórica verificada de respaldos en el repositorio de GitHub (excluyendo commits de UI/CSS)
            const defaultSnapshots = [
                { sha: 'main', shortSha: 'main', date: 'Actual', label: '📌 Versión más reciente (Main - Actual en GitHub)', message: 'Última versión disponible en repositorio' },
                { sha: '448dc548062dc513c031fe528dfe66a4b353869c', shortSha: '448dc54', date: '2026-10-20T09:10:30Z', label: '📅 20/10/2026 09:10 UTC — Respaldo Automático (Commit 448dc54)', message: 'Respaldo Automático (API REST)' },
                { sha: '24cb4d679691f207cc564997f9cf1bf209784bcc', shortSha: '24cb4d6', date: '2026-10-03T09:41:43Z', label: '📅 03/10/2026 09:41 UTC — Respaldo Automático (Commit 24cb4d6)', message: 'Respaldo Automático (API REST)' },
                { sha: 'f0f5e68f522359af1c9bf43db43fd25919887b7c', shortSha: 'f0f5e68', date: '2026-10-02T10:19:43Z', label: '📅 02/10/2026 10:19 UTC — Respaldo Automático (Commit f0f5e68)', message: 'Respaldo Automático (API REST)' },
                { sha: 'b48f27671809d15e60680b8f67afb44493b35d88', shortSha: 'b48f276', date: '2026-09-18T08:48:05Z', label: '📅 18/09/2026 08:48 UTC — Respaldo Automático (Commit b48f276)', message: 'Respaldo Automático (API REST)' },
                { sha: '812c01c440c37e83c6e2b33fd708d7732f2f8b6b', shortSha: '812c01c', date: '2026-08-28T15:55:36Z', label: '📅 28/08/2026 15:55 UTC — Respaldo Automático (Commit 812c01c)', message: 'Respaldo Automático (API REST)' },
                { sha: 'd7bcb4d0a182b7293e3c95c0220e71495427a0fe', shortSha: 'd7bcb4d', date: '2026-08-27T15:00:21Z', label: '📅 27/08/2026 15:00 UTC — Respaldo Automático (Commit d7bcb4d)', message: 'Respaldo Automático (API REST)' },
                { sha: '837de2bad0eba33c420bff73ad49a35e83caf528', shortSha: '837de2b', date: '2026-08-25T04:37:53Z', label: '📅 25/08/2026 04:37 UTC — Respaldo Automático (Commit 837de2b)', message: 'Respaldo Automático (API REST)' },
                { sha: '1b3e2cdc42955c46bdb32dd4cddb9b970054d5a6', shortSha: '1b3e2cd', date: '2026-08-22T04:31:43Z', label: '📅 22/08/2026 04:31 UTC — Respaldo Automático (Commit 1b3e2cd)', message: 'Respaldo Automático (API REST)' },
                { sha: '3827ca469b3b458b2db0811e057aba7802736c0e', shortSha: '3827ca4', date: '2026-08-21T04:36:56Z', label: '📅 21/08/2026 04:36 UTC — Respaldo Automático (Commit 3827ca4)', message: 'Respaldo Automático (API REST)' },
                { sha: '0543050bd3918e6812ab06c2586b5e46b942f1c7', shortSha: '0543050', date: '2026-08-19T04:35:37Z', label: '📅 19/08/2026 04:35 UTC — Respaldo Automático (Commit 0543050)', message: 'Respaldo Automático (API REST)' },
                { sha: '5e988312a1e4ebf8ba04b256633c21c81a94a8dc', shortSha: '5e98831', date: '2026-08-02T17:32:59Z', label: '📅 02/08/2026 17:32 UTC — Respaldo Inicial de Tablas (Commit 5e98831)', message: 'Respaldo Inicial de Tablas' }
            ];

            try {
                // Consulta en vivo a la API pública de GitHub para traer commits recientes
                const res = await fetch('https://api.github.com/repos/plataformaopsarn-max/plataformaparaentregar/commits?path=backups&per_page=25', {
                    headers: { 'Accept': 'application/vnd.github.v3+json' }
                });
                if (res.ok) {
                    const commits = await res.json();
                    if (Array.isArray(commits) && commits.length > 0) {
                        const dynamicSnapshots = commits
                            .filter(c => {
                                const msg = (c.commit?.message || '').toLowerCase();
                                // Filtrar y excluir commits de frontend, UI, CSS, build, etc.
                                if (msg.startsWith('perf(') || msg.startsWith('fix(ui') || msg.includes('css') || msg.includes('footer') || msg.includes('tailwind')) {
                                    return false;
                                }
                                return msg.includes('backup') || msg.includes('respaldo') || msg.includes('volcado');
                            })
                            .map(c => {
                                const dateObj = new Date(c.commit?.committer?.date || c.commit?.author?.date);
                                const formatted = `${String(dateObj.getUTCDate()).padStart(2, '0')}/${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}/${dateObj.getUTCFullYear()} ${String(dateObj.getUTCHours()).padStart(2, '0')}:${String(dateObj.getUTCMinutes()).padStart(2, '0')} UTC`;
                                const cleanedMsg = cleanBackupMessage(c.commit?.message || '');
                                return {
                                    sha: c.sha,
                                    shortSha: c.sha.slice(0, 7),
                                    date: c.commit?.committer?.date,
                                    label: `📅 ${formatted} — ${cleanedMsg} (Commit ${c.sha.slice(0, 7)})`,
                                    message: cleanedMsg
                                };
                            });

                        if (dynamicSnapshots.length > 0) {
                            return [defaultSnapshots[0], ...dynamicSnapshots];
                        }
                    }
                }
            } catch (_) {}

            return defaultSnapshots;
        },

        async loadBaselineJson(fileName, commitSha = 'main') {
            const urls = [];
            const safeSha = commitSha || 'main';

            if (safeSha === 'main') {
                urls.push(`../backups/${fileName}`);
                urls.push(`./backups/${fileName}`);
                urls.push(`/backups/${fileName}`);
                urls.push(`https://raw.githubusercontent.com/plataformaopsarn-max/plataformaparaentregar/main/backups/${fileName}`);
                urls.push(`https://raw.githubusercontent.com/PAHO-EIH/Plataforma_Informacion_Regulatoria/main/backups/${fileName}`);
            } else {
                urls.push(`https://raw.githubusercontent.com/plataformaopsarn-max/plataformaparaentregar/${safeSha}/backups/${fileName}`);
                urls.push(`https://raw.githubusercontent.com/PAHO-EIH/Plataforma_Informacion_Regulatoria/${safeSha}/backups/${fileName}`);
            }

            for (const url of urls) {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        return await res.json();
                    }
                } catch (_) {}
            }
            throw new Error(`No se pudo cargar el archivo ${fileName} para el punto de restauración (${safeSha.slice(0, 7)})`);
        },

        // Inspección Previa y Comparación (Preview & Diff) antes de restaurar
        async previewCountryBaseline(pais, commitSha = 'main', lang = 'es') {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase no conectado');

            const table = lang === 'en' ? 'faq_rows_corregido_en' : 'faq_rows_corregido';
            const fileName = lang === 'en' ? 'faq_rows_corregido_en.json' : 'faq_rows_corregido.json';

            // 1. Obtener fila en vivo actual de Supabase
            const { data: liveData, error } = await client
                .from(table)
                .select('*')
                .ilike('pais', pais)
                .maybeSingle();

            if (error) throw error;
            const liveRow = liveData || {};

            // 2. Cargar fila del backup en ese commitSha
            const backupJson = await this.loadBaselineJson(fileName, commitSha);
            const backupRow = backupJson.find(r => r.pais && r.pais.toLowerCase() === pais.toLowerCase()) || null;

            if (!backupRow) {
                throw new Error(`No se encontró el país "${pais}" en el respaldo seleccionado (${commitSha.slice(0, 7)}).`);
            }

            // 3. Comparar las 38 preguntas
            const questions = window.QUESTIONS || {};
            const comparisons = [];
            let modifiedCount = 0;

            for (const code of Object.keys(questions)) {
                const qKey = 'q_' + code.replace('.', '_');
                const liveDirecta = (liveRow[`${qKey}_directa`] || '').trim();
                const liveAmpliada = (liveRow[`${qKey}_ampliada`] || '').trim();
                const liveFuente = (liveRow[`${qKey}_fuente`] || '').trim();

                const backupDirecta = (backupRow[`${qKey}_directa`] || '').trim();
                const backupAmpliada = (backupRow[`${qKey}_ampliada`] || '').trim();
                const backupFuente = (backupRow[`${qKey}_fuente`] || '').trim();

                const isIdentical = (liveDirecta === backupDirecta) &&
                                    (liveAmpliada === backupAmpliada) &&
                                    (liveFuente === backupFuente);

                if (!isIdentical) {
                    modifiedCount++;
                }

                comparisons.push({
                    code,
                    label: questions[code],
                    isIdentical,
                    hasDirectaDiff: liveDirecta !== backupDirecta,
                    hasAmpliadaDiff: liveAmpliada !== backupAmpliada,
                    hasFuenteDiff: liveFuente !== backupFuente,
                    live: {
                        directa: liveDirecta,
                        ampliada: liveAmpliada,
                        fuente: liveFuente
                    },
                    backup: {
                        directa: backupDirecta,
                        ampliada: backupAmpliada,
                        fuente: backupFuente
                    }
                });
            }

            return {
                pais,
                lang,
                table,
                commitSha,
                totalQuestions: comparisons.length,
                modifiedCount,
                identicalCount: comparisons.length - modifiedCount,
                comparisons
            };
        },

        async restoreCountryFromBaseline(pais, targetTable = 'both', commitSha = 'main', snapshotLabel = '') {
            this.checkEditPermission();
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase no conectado');

            const results = { es: false, en: false };

            // 1. Restaurar Español si aplica
            if (targetTable === 'both' || targetTable === 'faq_rows_corregido') {
                const dataES = await this.loadBaselineJson('faq_rows_corregido.json', commitSha);
                const rowES = dataES.find(r => r.pais && r.pais.toLowerCase() === pais.toLowerCase());
                if (rowES) {
                    const { error } = await client.from('faq_rows_corregido').upsert(rowES);
                    if (error) throw error;
                    results.es = true;
                }
            }

            // 2. Restaurar Inglés si aplica
            if (targetTable === 'both' || targetTable === 'faq_rows_corregido_en') {
                const dataEN = await this.loadBaselineJson('faq_rows_corregido_en.json', commitSha);
                const rowEN = dataEN.find(r => r.pais && r.pais.toLowerCase() === pais.toLowerCase());
                if (rowEN) {
                    const { error } = await client.from('faq_rows_corregido_en').upsert(rowEN);
                    if (error) throw error;
                    results.en = true;
                }
            }

            // 3. Registrar en Auditoría
            const user = window.AdminAuth?.getCurrentUser();
            const versionDesc = snapshotLabel || (commitSha === 'main' ? 'Baseline Actual (Main)' : `Snapshot ${commitSha.slice(0, 7)}`);
            await this.logEdit({
                pais: pais,
                tabla: targetTable === 'both' ? 'faq_rows_corregido (ES+EN)' : targetTable,
                campo: `Restauración Granular (${versionDesc})`,
                idioma: targetTable === 'both' ? 'es/en' : (targetTable.includes('_en') ? 'en' : 'es'),
                valor_anterior: '(Versión en producción)',
                valor_nuevo: `Restaurado desde Punto Temporal: ${versionDesc}`,
                usuario_id: user?.id || null,
                usuario_nombre: user?.nombre || user?.email || 'Administrador'
            });

            return results;
        },

        async restoreTableData(tableName, recordsArray) {
            this.checkEditPermission();
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase no conectado');
            if (!Array.isArray(recordsArray) || recordsArray.length === 0) {
                throw new Error('El archivo no contiene registros válidos para esta tabla.');
            }

            const batchSize = 50;
            let processed = 0;
            for (let i = 0; i < recordsArray.length; i += batchSize) {
                const chunk = recordsArray.slice(i, i + batchSize);
                const { error } = await client.from(tableName).upsert(chunk);
                if (error) throw error;
                processed += chunk.length;
            }

            const user = window.AdminAuth?.getCurrentUser();
            await this.logEdit({
                pais: 'TODOS',
                tabla: tableName,
                campo: 'Restauración de Tabla Completa',
                idioma: tableName.includes('_en') ? 'en' : 'es',
                valor_anterior: `(Tabla ${tableName} previa)`,
                valor_nuevo: `Restaurada con ${processed} registros`,
                usuario_id: user?.id || null,
                usuario_nombre: user?.nombre || user?.email || 'Administrador'
            });

            return { ok: true, count: processed };
        }
    };

    window.AdminAPI = AdminAPI;
})();
