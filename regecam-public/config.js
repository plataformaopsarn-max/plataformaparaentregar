// config.js — Centralización de Configuración y Credenciales para la Plataforma de Información Regulatoria sobre Ensayos Clínicos en las Américas (OPS)
// Este archivo permite que la aplicación lea las variables del entorno del servidor si existen,
// o use las credenciales por defecto de Supabase de forma segura y centralizada.

const CONFIG = {
    // URL y Llave pública anónima de Supabase
    SUPABASE_URL: (typeof window !== 'undefined' && window.ENV_SUPABASE_URL) || 'https://mugtfugfabhrqcomynrs.supabase.co',
    SUPABASE_ANON_KEY: (typeof window !== 'undefined' && window.ENV_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z3RmdWdmYWJocnFjb215bnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTk0ODcsImV4cCI6MjA4NjIzNTQ4N30.SNJHTTOHlJ2e7TbvwigkTSWNUk3zPF7cRNZYP74vWAI',
    
    // Versión de la Aplicación y Parámetros de Caché Independientes por Idioma
    APP_VERSION: '1.2.7',
    CACHE_KEY_ES: 'regia_cache_es_v1.4',
    CACHE_KEY_EN: 'regia_cache_en_v1.4',
    CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 Horas en milisegundos

    // Configuración de Almacenamiento
    STORAGE_BUCKET_REPORTES: 'reportes'
};

if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
