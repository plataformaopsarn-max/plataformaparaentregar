-- ============================================================
-- ADMIN PANEL — MIGRATION: 4 tablas nuevas
-- Ejecutar en Supabase SQL Editor: mugtfugfabhrqcomynrs
-- ============================================================

-- 1. ADMIN PROFILES
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('administrador', 'editor')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "self_all" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_full" ON public.admin_profiles;
CREATE POLICY "self_all" ON public.admin_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "admin_full" ON public.admin_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_profiles p2 WHERE p2.id = auth.uid() AND p2.rol = 'administrador')
);

-- 2. TRANSLATION QUEUE
CREATE TABLE IF NOT EXISTS public.translation_queue (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pais TEXT NOT NULL,
  tabla TEXT NOT NULL,
  campo TEXT NOT NULL,
  idioma_origen TEXT NOT NULL CHECK (idioma_origen IN ('es', 'en')),
  idioma_destino TEXT NOT NULL CHECK (idioma_destino IN ('es', 'en')),
  texto_origen TEXT NOT NULL,
  traduccion_sugerida TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'editado', 'descartado')),
  revisado_por UUID REFERENCES auth.users(id),
  revisado_at TIMESTAMPTZ,
  texto_anterior TEXT
);
ALTER TABLE public.translation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON public.translation_queue;
CREATE POLICY "authenticated_all" ON public.translation_queue FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 3. CONTENT SYNC STATUS
CREATE TABLE IF NOT EXISTS public.content_sync_status (
  pais TEXT NOT NULL,
  tabla TEXT NOT NULL,
  campo TEXT NOT NULL,
  es_updated_at TIMESTAMPTZ,
  en_updated_at TIMESTAMPTZ,
  sincronizado BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (pais, tabla, campo)
);
ALTER TABLE public.content_sync_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_sync" ON public.content_sync_status;
CREATE POLICY "auth_all_sync" ON public.content_sync_status FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 4. CONTENT EDIT LOG
CREATE TABLE IF NOT EXISTS public.content_edit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nombre TEXT,
  pais TEXT NOT NULL,
  tabla TEXT NOT NULL,
  campo TEXT NOT NULL,
  idioma TEXT NOT NULL CHECK (idioma IN ('es', 'en')),
  valor_anterior TEXT,
  valor_nuevo TEXT
);
ALTER TABLE public.content_edit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_log" ON public.content_edit_log;
DROP POLICY IF EXISTS "auth_insert_log" ON public.content_edit_log;
CREATE POLICY "auth_read_log" ON public.content_edit_log FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "auth_insert_log" ON public.content_edit_log FOR INSERT TO authenticated WITH CHECK (TRUE);

-- INDICES
CREATE INDEX IF NOT EXISTS idx_tq_estado ON public.translation_queue(estado);
CREATE INDEX IF NOT EXISTS idx_tq_pais ON public.translation_queue(pais);
CREATE INDEX IF NOT EXISTS idx_css_pais ON public.content_sync_status(pais);
CREATE INDEX IF NOT EXISTS idx_cel_pais ON public.content_edit_log(pais);

-- 5. PERMISOS DE EDICIÓN PARA USUARIOS AUTENTICADOS EN TABLAS REGULATORIAS
-- Permite que los editores y administradores guarden cambios en las matrices
DROP POLICY IF EXISTS "auth_update_faq" ON public.faq_rows_corregido;
CREATE POLICY "auth_update_faq" ON public.faq_rows_corregido 
FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_update_faq_en" ON public.faq_rows_corregido_en;
CREATE POLICY "auth_update_faq_en" ON public.faq_rows_corregido_en 
FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_update_enlaces" ON public.enlaces;
CREATE POLICY "auth_update_enlaces" ON public.enlaces 
FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_update_enlaces_en" ON public.enlaces_descripcion_en;
CREATE POLICY "auth_update_enlaces_en" ON public.enlaces_descripcion_en 
FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_update_resumen" ON public.resumen_ejecutivo;
CREATE POLICY "auth_update_resumen" ON public.resumen_ejecutivo 
FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

