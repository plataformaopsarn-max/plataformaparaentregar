// admin/config.js — Configuración para el Panel de Administración RegLAC (OPS/OMS)
(function() {
    const parentConfig = (typeof window !== 'undefined' && window.APP_CONFIG) || {};

    const ADMIN_CONFIG = {
        SUPABASE_URL: parentConfig.SUPABASE_URL || 'https://mugtfugfabhrqcomynrs.supabase.co',
        SUPABASE_ANON_KEY: parentConfig.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z3RmdWdmYWJocnFjb215bnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTk0ODcsImV4cCI6MjA4NjIzNTQ4N30.SNJHTTOHlJ2e7TbvwigkTSWNUk3zPF7cRNZYP74vWAI',
        
        // Gemini API Configuration for automatic regulatory translations
        // Model: gemini-flash-latest (o gemini-3.6-flash / gemini-3.5-flash)
        GEMINI_MODEL: 'gemini-flash-latest',
        
        // Storage keys
        STORAGE_KEYS: {
            AUTH_USER: 'reglac_admin_user_v1',
            TRANSLATION_QUEUE: 'reglac_admin_queue_v1',
            SYNC_STATUS: 'reglac_admin_sync_status_v1',
            AUDIT_LOG: 'reglac_admin_audit_log_v1',
            GEMINI_API_KEY: 'reglac_admin_gemini_key'
        }
    };

    if (typeof window !== 'undefined') {
        window.ADMIN_CONFIG = ADMIN_CONFIG;
    }
})();
