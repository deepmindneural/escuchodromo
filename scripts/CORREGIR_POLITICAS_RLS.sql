-- =====================================================
-- CORREGIR POLÍTICAS RLS PARA PERMITIR REGISTRO
-- Ejecutar en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- =====================================================

-- 1. Eliminar políticas antiguas de Usuario
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON "Usuario";
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON "Usuario";
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar su perfil" ON "Usuario";
DROP POLICY IF EXISTS "Service role puede hacer todo en Usuario" ON "Usuario";

-- 2. Crear políticas correctas para Usuario
-- Permitir que usuarios recién registrados inserten su perfil
CREATE POLICY "Usuarios autenticados pueden insertar su perfil"
  ON "Usuario" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = auth_id);

-- Permitir que usuarios vean su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON "Usuario" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = auth_id);

-- Permitir que usuarios actualicen su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON "Usuario" FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = auth_id)
  WITH CHECK (auth.uid()::text = auth_id);

-- Service role puede hacer todo (para Edge Functions)
CREATE POLICY "Service role puede hacer todo en Usuario"
  ON "Usuario" FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Habilitar RLS en Usuario si no está habilitado
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

-- 4. Verificar políticas creadas
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'Usuario';
