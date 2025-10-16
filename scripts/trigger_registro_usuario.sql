-- =====================================================
-- TRIGGER AUTOMÁTICO PARA CREAR PERFIL DE USUARIO
-- Ejecuta esto en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- =====================================================

-- 1. Crear función que se ejecutará cuando se registre un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insertar en tabla Usuario
  INSERT INTO public."Usuario" (auth_id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    'USUARIO'
  );

  -- Insertar en tabla PerfilUsuario
  INSERT INTO public."PerfilUsuario" (
    usuario_id,
    idioma_preferido,
    moneda,
    zona_horaria,
    consentimiento_datos
  )
  SELECT u.id, 'es', 'COP', 'America/Bogota', true
  FROM public."Usuario" u
  WHERE u.auth_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Crear trigger que ejecuta la función cuando se crea un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que el trigger fue creado
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
