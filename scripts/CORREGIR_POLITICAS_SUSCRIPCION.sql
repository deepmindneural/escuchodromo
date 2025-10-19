-- =====================================================
-- CORREGIR POLÍTICAS RLS DE SUSCRIPCION
-- Ejecutar en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- =====================================================

-- Verificar que la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Suscripcion'
  ) THEN
    RAISE EXCEPTION 'La tabla Suscripcion no existe. Ejecuta primero el script de creación de tablas.';
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE "Suscripcion" ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias suscripciones" ON "Suscripcion";
DROP POLICY IF EXISTS "Usuarios pueden ver su propia suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "Service role puede hacer todo en Suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "usuarios_ven_suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "usuarios_insertan_suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "usuarios_actualizan_suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "service_role_suscripcion_all" ON "Suscripcion";

-- Crear políticas nuevas adaptativas
DO $$
DECLARE
  auth_id_type TEXT;
  policy_condition TEXT;
BEGIN
  -- Detectar tipo de dato de auth_id en Usuario
  SELECT data_type INTO auth_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Usuario'
    AND column_name = 'auth_id';

  -- Construir condición según tipo
  IF auth_id_type = 'uuid' THEN
    policy_condition := 'auth.uid()';
    RAISE NOTICE 'Usando políticas para auth_id tipo UUID';
  ELSIF auth_id_type = 'text' THEN
    policy_condition := 'auth.uid()::text';
    RAISE NOTICE 'Usando políticas para auth_id tipo TEXT';
  ELSE
    policy_condition := 'auth.uid()';
    RAISE NOTICE 'Tipo no detectado, usando UUID por defecto';
  END IF;

  -- Política de SELECT
  EXECUTE format('
    CREATE POLICY "usuarios_ven_suscripcion"
      ON "Suscripcion" FOR SELECT
      TO authenticated
      USING (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition);

  -- Política de INSERT
  EXECUTE format('
    CREATE POLICY "usuarios_insertan_suscripcion"
      ON "Suscripcion" FOR INSERT
      TO authenticated
      WITH CHECK (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition);

  -- Política de UPDATE
  EXECUTE format('
    CREATE POLICY "usuarios_actualizan_suscripcion"
      ON "Suscripcion" FOR UPDATE
      TO authenticated
      USING (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
      WITH CHECK (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition, policy_condition);

  -- Service role acceso total
  CREATE POLICY "service_role_suscripcion_all"
    ON "Suscripcion" FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  RAISE NOTICE '✅ Políticas RLS creadas correctamente para Suscripcion';
END $$;

-- Verificar políticas creadas
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'Suscripcion'
ORDER BY policyname;

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ POLÍTICAS RLS DE SUSCRIPCION CORREGIDAS';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora deberías poder:';
  RAISE NOTICE '  - Ver tu suscripción en /perfil';
  RAISE NOTICE '  - Ver tu suscripción en /dashboard';
  RAISE NOTICE '  - Cancelar/reactivar tu suscripción';
END $$;
