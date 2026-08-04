// config.js — Configuración Dinámica para la Plataforma ReGeCAM (OPS)
// Este archivo abstrae completamente las credenciales. Las variables se leen
// desde el entorno de producción (ej. Cloudflare Pages / Vercel / Netlify / Servidor OPS).

const CONFIG = {
    // Credenciales públicas de Supabase con fallback para cliente estático
    SUPABASE_URL: (typeof window !== 'undefined' && window.ENV_SUPABASE_URL) ? window.ENV_SUPABASE_URL : 'https://mugtfugfabhrqcomynrs.supabase.co',
    SUPABASE_ANON_KEY: (typeof window !== 'undefined' && window.ENV_SUPABASE_ANON_KEY) ? window.ENV_SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z3RmdWdmYWJocnFjb215bnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTk0ODcsImV4cCI6MjA4NjIzNTQ4N30.SNJHTTOHlJ2e7TbvwigkTSWNUk3zPF7cRNZYP74vWAI',
    
    // Versión de la Aplicación y Parámetros de Caché
    APP_VERSION: '1.2.0',
    CACHE_KEY: 'regecam_cache_v1.2',
    CACHE_TTL_MS: 24 * 60 * 60 * 1000 // 24 Horas
};

if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
