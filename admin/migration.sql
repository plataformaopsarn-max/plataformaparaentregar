-- ============================================================
-- ADMIN PANEL — MIGRATION: 4 tablas nuevas
-- Ejecutar en Supabase SQL Editor: mugtfugfabhrqcomynrs
-- ============================================================

-- 1. ADMIN PROFILES
-- Roles soportados:
--   'administrador': Control total y gestión de auditoría/configuración
--   'editor': Edición bilingüe y revisión (sin acceso a auditoría)
--   'lector': Solo lectura para demostración y evaluación (acceso visual total, guardado bloqueado)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('administrador', 'editor', 'lector')),
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

-- Si la tabla admin_profiles ya fue creada previamente, actualizar el check de rol:
ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_rol_check;
ALTER TABLE public.admin_profiles ADD CONSTRAINT admin_profiles_rol_check CHECK (rol IN ('administrador', 'editor', 'lector'));

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
DROP POLICY IF EXISTS "anon_read_queue" ON public.translation_queue;
CREATE POLICY "anon_read_queue" ON public.translation_queue FOR SELECT TO anon USING (TRUE);

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
DROP POLICY IF EXISTS "anon_read_sync" ON public.content_sync_status;
CREATE POLICY "anon_read_sync" ON public.content_sync_status FOR SELECT TO anon USING (TRUE);

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
DROP POLICY IF EXISTS "anon_read_log" ON public.content_edit_log;
CREATE POLICY "anon_read_log" ON public.content_edit_log FOR SELECT TO anon USING (TRUE);

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

-- ============================================================
-- 6. GESTIÓN DE USUARIOS Y ROLES (RBAC) DESDE EL PANEL ADMIN
-- Ejecutar estas funciones en Supabase SQL Editor para permitir
-- que el Administrador dé altas, bajas y cambios de rol directamente.
-- ============================================================

-- Habilitar extensión pgcrypto si aún no está activa
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 6.1 LISTAR USUARIOS
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  result JSONB;
BEGIN
  -- Verificar permisos del llamador
  SELECT rol INTO caller_role FROM public.admin_profiles WHERE id = auth.uid();
  IF caller_role != 'administrador' THEN
    RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Administrador para gestionar usuarios';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'nombre', COALESCE(p.nombre, u.raw_user_meta_data->>'nombre', split_part(u.email, '@', 1)),
      'rol', COALESCE(p.rol, u.raw_user_meta_data->>'rol', 'editor'),
      'activo', COALESCE(p.activo, TRUE),
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at
    ) ORDER BY u.created_at DESC
  ) INTO result
  FROM auth.users u
  LEFT JOIN public.admin_profiles p ON p.id = u.id;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 6.2 CREAR NUEVO USUARIO (Con activación inmediata sin espera de confirmación)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_email TEXT,
  new_password TEXT,
  new_nombre TEXT,
  new_rol TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  new_user_id UUID;
  clean_email TEXT;
  clean_rol TEXT;
BEGIN
  -- Verificar permisos
  SELECT rol INTO caller_role FROM public.admin_profiles WHERE id = auth.uid();
  IF caller_role != 'administrador' THEN
    RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Administrador para crear usuarios';
  END IF;

  clean_email := lower(trim(new_email));
  clean_rol := lower(trim(new_rol));

  IF clean_rol NOT IN ('administrador', 'editor', 'lector') THEN
    RAISE EXCEPTION 'Rol inválido. Debe ser: administrador, editor o lector';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = clean_email) THEN
    RAISE EXCEPTION 'El correo % ya se encuentra registrado', clean_email;
  END IF;

  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe contener al menos 6 caracteres';
  END IF;

  new_user_id := gen_random_uuid();

  -- Insertar en auth.users con contraseña encriptada y email_confirmed_at activo
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    clean_email,
    extensions.crypt(new_password, extensions.gen_salt('bf')),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('nombre', new_nombre, 'rol', clean_rol),
    NOW(),
    NOW()
  );

  -- Insertar en admin_profiles
  INSERT INTO public.admin_profiles (id, email, nombre, rol, activo, created_at)
  VALUES (new_user_id, clean_email, new_nombre, clean_rol, TRUE, NOW())
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    activo = TRUE;

  RETURN jsonb_build_object(
    'id', new_user_id,
    'email', clean_email,
    'nombre', new_nombre,
    'rol', clean_rol
  );
END;
$$;

-- 6.3 ACTUALIZAR USUARIO (Cambio de Rol, Estado, Nombre o Contraseña)
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id UUID,
  new_nombre TEXT,
  new_rol TEXT,
  new_activo BOOLEAN,
  new_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  clean_rol TEXT;
BEGIN
  -- Verificar permisos
  SELECT rol INTO caller_role FROM public.admin_profiles WHERE id = auth.uid();
  IF caller_role != 'administrador' THEN
    RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Administrador';
  END IF;

  clean_rol := lower(trim(new_rol));
  IF clean_rol NOT IN ('administrador', 'editor', 'lector') THEN
    RAISE EXCEPTION 'Rol inválido. Debe ser: administrador, editor o lector';
  END IF;

  -- Actualizar admin_profiles
  UPDATE public.admin_profiles
  SET nombre = new_nombre,
      rol = clean_rol,
      activo = new_activo
  WHERE id = target_user_id;

  -- Actualizar metadata en auth.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
        jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{nombre}', to_jsonb(new_nombre)),
        '{rol}', to_jsonb(clean_rol)
      ),
      updated_at = NOW()
  WHERE id = target_user_id;

  -- Si se suministró nueva contraseña, actualizarla
  IF new_password IS NOT NULL AND length(trim(new_password)) >= 6 THEN
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(trim(new_password), extensions.gen_salt('bf')),
        updated_at = NOW()
    WHERE id = target_user_id;
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'id', target_user_id);
END;
$$;

-- 6.4 ELIMINAR USUARIO
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verificar permisos
  SELECT rol INTO caller_role FROM public.admin_profiles WHERE id = auth.uid();
  IF caller_role != 'administrador' THEN
    RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Administrador';
  END IF;

  -- Prevenir auto-eliminación
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puede eliminar su propia cuenta de administrador activo';
  END IF;

  DELETE FROM public.admin_profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object('ok', TRUE, 'id', target_user_id);
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados (la función valida internamente si es administrador)
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- ============================================================
-- HELPER: ASEGURAR QUE TU CUENTA SEA ADMINISTRADOR
-- Ejecuta esto reemplazando tu correo para garantizar acceso total:
-- ============================================================
-- INSERT INTO public.admin_profiles (id, email, nombre, rol, activo)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'nombre', 'Administrador'), 'administrador', TRUE
-- FROM auth.users
-- WHERE email = 'tu_correo@paho.org'
-- ON CONFLICT (id) DO UPDATE SET rol = 'administrador', activo = TRUE;

