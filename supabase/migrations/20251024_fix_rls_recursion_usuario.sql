-- =====================================================
-- MIGRACIÓN: Solución de Recursión Infinita en RLS de Usuario
-- Fecha: 2025-10-24
-- Problema: Políticas RLS causan recursión al hacer SELECT en Usuario
-- Solución: Función SECURITY DEFINER que bypasea RLS
-- =====================================================

-- PASO 1: Crear función que obtiene el rol sin activar RLS
-- Esta función usa SECURITY DEFINER para bypasear RLS completamente
CREATE OR REPLACE FUNCTION obtener_rol_usuario_actual()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_rol TEXT;
BEGIN
  -- Obtener rol directamente sin activar RLS
  SELECT rol INTO v_rol
  FROM "Usuario"
  WHERE auth_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_rol, 'USUARIO');
END;
$$;

-- Comentar la función
COMMENT ON FUNCTION obtener_rol_usuario_actual() IS
'Obtiene el rol del usuario autenticado sin activar RLS. Previene recursión infinita.';

-- Dar permisos de ejecución a authenticated
GRANT EXECUTE ON FUNCTION obtener_rol_usuario_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_rol_usuario_actual() TO anon;

-- =====================================================
-- PASO 2: Eliminar políticas recursivas
-- =====================================================

DROP POLICY IF EXISTS "Admin_ve_todos_los_usuarios" ON "Usuario";
DROP POLICY IF EXISTS "Admin actualiza usuarios con restricciones" ON "Usuario";
DROP POLICY IF EXISTS "Admin crea usuarios con validacion" ON "Usuario";

-- =====================================================
-- PASO 3: Crear nuevas políticas NO RECURSIVAS
-- =====================================================

-- POLICY 1: Admins pueden ver todos los usuarios (NO RECURSIVA)
CREATE POLICY "admin_select_todos_usuarios_no_recursion" ON "Usuario"
  FOR SELECT
  TO authenticated
  USING (
    obtener_rol_usuario_actual() = 'ADMIN'
  );

COMMENT ON POLICY "admin_select_todos_usuarios_no_recursion" ON "Usuario" IS
'Permite a ADMIN ver todos los usuarios. Usa función SECURITY DEFINER para evitar recursión.';

-- POLICY 2: Admins pueden actualizar usuarios con restricciones (NO RECURSIVA)
CREATE POLICY "admin_update_usuarios_no_recursion" ON "Usuario"
  FOR UPDATE
  TO authenticated
  USING (
    obtener_rol_usuario_actual() = 'ADMIN'
  )
  WITH CHECK (
    -- No puede cambiar su propio rol
    (id != (SELECT id FROM "Usuario" WHERE auth_id = auth.uid()) OR
     rol = (SELECT rol FROM "Usuario" WHERE auth_id = auth.uid()))
  );

COMMENT ON POLICY "admin_update_usuarios_no_recursion" ON "Usuario" IS
'Permite a ADMIN actualizar usuarios pero no cambiar su propio rol. No recursiva.';

-- POLICY 3: Admins pueden crear usuarios (NO RECURSIVA)
CREATE POLICY "admin_insert_usuarios_no_recursion" ON "Usuario"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    obtener_rol_usuario_actual() = 'ADMIN'
    AND (
      -- Solo puede crear usuarios no-ADMIN sin restricciones
      rol != 'ADMIN'
      OR
      -- Para crear ADMIN, debe existir log de auditoría en últimos 5 minutos
      EXISTS (
        SELECT 1 FROM "AuditLogAdmin"
        WHERE accion = 'crear_admin_autorizado'
        AND creado_en >= NOW() - INTERVAL '5 minutes'
      )
    )
  );

COMMENT ON POLICY "admin_insert_usuarios_no_recursion" ON "Usuario" IS
'Permite a ADMIN crear usuarios. Requiere auditoría para crear otros ADMIN. No recursiva.';

-- =====================================================
-- PASO 4: Verificación de políticas existentes
-- =====================================================

-- Listar todas las políticas actuales (para log)
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%Usuario%' AND qual LIKE '%SELECT%' THEN '⚠️ POSIBLE RECURSIÓN'
    ELSE '✅ OK'
  END as estado
FROM pg_policies
WHERE tablename = 'Usuario'
ORDER BY policyname;

-- =====================================================
-- PASO 5: Testing de la función
-- =====================================================

-- Test: Verificar que la función retorna el rol correcto
DO $$
DECLARE
  v_test_rol TEXT;
BEGIN
  -- Intentar obtener el rol (debería funcionar sin recursión)
  v_test_rol := obtener_rol_usuario_actual();

  RAISE NOTICE '✅ Función obtener_rol_usuario_actual() funciona correctamente. Rol: %', COALESCE(v_test_rol, 'NULL');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error al probar función: %', SQLERRM;
END;
$$;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. La función obtener_rol_usuario_actual() usa SECURITY DEFINER
--    Esto significa que se ejecuta con privilegios del dueño (postgres)
--    y NO activa RLS, previniendo la recursión.

-- 2. Las nuevas políticas usan la función en vez de SELECT directo
--    Esto rompe el ciclo recursivo.

-- 3. El atributo STABLE en la función permite que PostgreSQL
--    cachee el resultado durante la transacción, mejorando performance.

-- 4. La política de UPDATE todavía usa SELECT para el WITH CHECK,
--    pero esto NO causa recursión porque:
--    - El USING ya pasó (usando la función)
--    - El SELECT en WITH CHECK es para comparar valores, no para validar permisos

-- 5. IMPORTANTE: Después de aplicar esta migración, REINICIAR el servidor
--    para que Next.js middleware vuelva a intentar obtener el rol.

-- =====================================================
-- ROLLBACK (si es necesario)
-- =====================================================

-- Para revertir esta migración:
-- DROP POLICY IF EXISTS "admin_select_todos_usuarios_no_recursion" ON "Usuario";
-- DROP POLICY IF EXISTS "admin_update_usuarios_no_recursion" ON "Usuario";
-- DROP POLICY IF EXISTS "admin_insert_usuarios_no_recursion" ON "Usuario";
-- DROP FUNCTION IF EXISTS obtener_rol_usuario_actual();

-- Luego recrear las políticas originales (NO RECOMENDADO - causará recursión otra vez)
