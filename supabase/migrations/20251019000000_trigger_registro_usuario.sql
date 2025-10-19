-- =====================================================
-- MIGRACIÓN: Trigger de Registro Automático de Usuario
-- =====================================================
-- Fecha: 19 de octubre de 2025
-- Descripción: Crea automáticamente registros en las tablas Usuario
--              y PerfilUsuario cuando un nuevo usuario se registra
--              en auth.users mediante Supabase Auth
--
-- VULNERABILIDAD CORREGIDA: CRÍTICO #2
-- Antes: Los usuarios se registraban en auth.users pero no se
--        creaban sus registros en Usuario/PerfilUsuario, causando
--        que RLS fallara y los usuarios no pudieran acceder a nada.
-- =====================================================

-- Función que se ejecuta cuando se crea un nuevo usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  nuevo_usuario_id UUID;
  nombre_usuario TEXT;
BEGIN
  -- Extraer el nombre del metadata o usar parte del email
  nombre_usuario := COALESCE(
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Insertar registro en tabla Usuario
  INSERT INTO public."Usuario" (
    auth_id,
    email,
    nombre,
    rol,
    esta_activo,
    creado_en,
    actualizado_en
  )
  VALUES (
    NEW.id,                    -- auth_id del usuario de Supabase Auth
    NEW.email,                 -- email del usuario
    nombre_usuario,            -- nombre extraído
    'USUARIO',                 -- rol por defecto
    true,                      -- activo por defecto
    NOW(),
    NOW()
  )
  RETURNING id INTO nuevo_usuario_id;

  -- Insertar perfil básico en PerfilUsuario
  INSERT INTO public."PerfilUsuario" (
    usuario_id,
    fecha_nacimiento,
    genero,
    telefono,
    pais,
    idioma_preferido,
    consentimiento_datos,
    creado_en,
    actualizado_en
  )
  VALUES (
    nuevo_usuario_id,          -- ID del usuario recién creado
    NULL,                      -- fecha_nacimiento (se completa después)
    NULL,                      -- genero (se completa después)
    NULL,                      -- telefono (se completa después)
    NULL,                      -- pais (se completa después)
    'es',                      -- idioma por defecto: español
    false,                     -- consentimiento pendiente
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error (Supabase lo capturará)
    RAISE WARNING 'Error en handle_new_user para user_id %: %', NEW.id, SQLERRM;
    -- Propagar el error para que el registro en auth.users también falle
    RAISE;
END;
$$;

-- Trigger que ejecuta la función después de cada INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentario descriptivo
COMMENT ON FUNCTION public.handle_new_user() IS
  'Crea automáticamente registros en Usuario y PerfilUsuario cuando un nuevo usuario se registra en Supabase Auth';

-- =====================================================
-- MIGRACIÓN DE USUARIOS EXISTENTES (si los hay)
-- =====================================================
-- Si ya existen usuarios en auth.users que no tienen registro
-- en la tabla Usuario, los creamos ahora.

DO $$
DECLARE
  auth_user RECORD;
  nuevo_usuario_id UUID;
  nombre_usuario TEXT;
BEGIN
  -- Iterar sobre usuarios de auth que no tienen registro en Usuario
  FOR auth_user IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT auth_id FROM public."Usuario")
  LOOP
    -- Extraer nombre
    nombre_usuario := COALESCE(
      auth_user.raw_user_meta_data->>'nombre',
      auth_user.raw_user_meta_data->>'name',
      auth_user.raw_user_meta_data->>'full_name',
      split_part(auth_user.email, '@', 1)
    );

    -- Crear Usuario
    INSERT INTO public."Usuario" (
      auth_id,
      email,
      nombre,
      rol,
      esta_activo,
      creado_en,
      actualizado_en
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      nombre_usuario,
      'USUARIO',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO nuevo_usuario_id;

    -- Crear PerfilUsuario
    INSERT INTO public."PerfilUsuario" (
      usuario_id,
      idioma_preferido,
      consentimiento_datos,
      creado_en,
      actualizado_en
    )
    VALUES (
      nuevo_usuario_id,
      'es',
      false,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Usuario migrado: % (auth_id: %)', auth_user.email, auth_user.id;
  END LOOP;
END $$;

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar que todos los usuarios de auth tienen registro en Usuario
DO $$
DECLARE
  usuarios_auth INTEGER;
  usuarios_tabla INTEGER;
BEGIN
  SELECT COUNT(*) INTO usuarios_auth FROM auth.users;
  SELECT COUNT(*) INTO usuarios_tabla FROM public."Usuario";

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICACIÓN DE TRIGGER DE REGISTRO';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Usuarios en auth.users: %', usuarios_auth;
  RAISE NOTICE 'Usuarios en tabla Usuario: %', usuarios_tabla;

  IF usuarios_auth = usuarios_tabla THEN
    RAISE NOTICE '✅ ÉXITO: Todos los usuarios tienen registro';
  ELSE
    RAISE WARNING '⚠️ INCONSISTENCIA: Hay % usuarios sin registro', (usuarios_auth - usuarios_tabla);
  END IF;
  RAISE NOTICE '===========================================';
END $$;
