-- =====================================================
-- MIGRACIÓN: Permitir a usuarios leer su propio rol
-- =====================================================
-- Fecha: 2025-10-23
-- Propósito: Solucionar error en middleware donde rol aparece como null
--
-- PROBLEMA:
-- - El middleware necesita leer el rol del usuario autenticado
-- - No existe política RLS que permita a un usuario leer su propio rol
-- - Usar SERVICE_ROLE_KEY en middleware es inseguro e incorrecto
--
-- SOLUCIÓN:
-- - Crear política RLS que permita a cada usuario leer SOLO su propio rol
-- - Esto mantiene la seguridad mientras permite la funcionalidad necesaria
-- =====================================================

-- Verificar que RLS esté habilitado en Usuario (debería estarlo)
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

-- Crear política para que usuarios puedan leer su propio rol
-- IMPORTANTE: Solo permite leer el rol, NO modificarlo
CREATE POLICY "usuarios_pueden_leer_su_propio_rol"
ON "Usuario"
FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

-- Comentario de seguridad
COMMENT ON POLICY "usuarios_pueden_leer_su_propio_rol" ON "Usuario" IS
'Permite a usuarios autenticados leer su propio registro (incluyendo rol)
para propósitos de autorización en el middleware. Solo lectura, sin modificación.
Principio de menor privilegio: solo su propio registro donde auth_id = auth.uid()';

-- Verificar políticas existentes
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS en tabla Usuario:';
  RAISE NOTICE '%', (
    SELECT string_agg(policyname || ' (' || cmd || ')', ', ')
    FROM pg_policies
    WHERE tablename = 'Usuario'
  );
END $$;
