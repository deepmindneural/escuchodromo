-- ==========================================
-- Verificar Políticas RLS que causan recursión infinita
-- ==========================================

-- 1. Ver TODAS las políticas de la tabla Usuario
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'Usuario'
ORDER BY policyname;

-- 2. Ver si RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'Usuario';

-- 3. Ver políticas problemáticas (las que referencian Usuario dentro de Usuario)
SELECT
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'Usuario'
  AND (
    qual LIKE '%Usuario%'
    OR with_check LIKE '%Usuario%'
  );
