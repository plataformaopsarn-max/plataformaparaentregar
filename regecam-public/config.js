// config.js — Configuración Dinámica para la Plataforma ReGeCAM (OPS)
// Este archivo abstrae completamente las credenciales. Las variables se leen
// desde el entorno de producción (ej. Cloudflare Pages / Vercel / Netlify / Servidor OPS).

const CONFIG = {
    // Credenciales de Supabase (Se inyectan mediante window.ENV_SUPABASE_* o proxy de servidor)
    SUPABASE_URL: (typeof window !== 'undefined' && window.ENV_SUPABASE_URL) ? window.ENV_SUPABASE_URL : '',
    SUPABASE_ANON_KEY: (typeof window !== 'undefined' && window.ENV_SUPABASE_ANON_KEY) ? window.ENV_SUPABASE_ANON_KEY : '',
    
    // Versión de la Aplicación y Parámetros de Caché
    APP_VERSION: '1.2.0',
    CACHE_KEY: 'regecam_cache_v1.2',
    CACHE_TTL_MS: 24 * 60 * 60 * 1000 // 24 Horas
};

if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
