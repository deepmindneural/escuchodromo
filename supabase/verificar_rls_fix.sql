-- ==========================================
-- SCRIPT DE VERIFICACIÓN DE POLÍTICAS RLS
-- Fecha: 2025-10-20
-- Descripción: Verifica que las políticas RLS corregidas funcionan correctamente
-- ==========================================

-- ==========================================
-- 1. VERIFICAR QUE RLS ESTÁ HABILITADO
-- ==========================================

SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ HABILITADO'
    ELSE '❌ DESHABILITADO'
  END AS estado_rls
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Usuario', 'Suscripcion', 'AuditoriaAcceso')
ORDER BY tablename;

-- ==========================================
-- 2. LISTAR TODAS LAS POLÍTICAS DE USUARIO
-- ==========================================

SELECT
  policyname AS "Política",
  cmd AS "Comando",
  roles AS "Roles",
  CASE
    WHEN qual IS NOT NULL THEN '✅ Tiene USING'
    ELSE '⚠️  Sin USING'
  END AS "USING Clause",
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Tiene WITH CHECK'
    ELSE '⚠️  Sin WITH CHECK'
  END AS "WITH CHECK Clause"
FROM pg_policies
WHERE tablename = 'Usuario'
ORDER BY policyname;

-- ==========================================
-- 3. LISTAR TODAS LAS POLÍTICAS DE SUSCRIPCION
-- ==========================================

SELECT
  policyname AS "Política",
  cmd AS "Comando",
  roles AS "Roles",
  CASE
    WHEN qual IS NOT NULL THEN '✅ Tiene USING'
    ELSE '⚠️  Sin USING'
  END AS "USING Clause",
  CASE
    WHEN with_check IS NOT NULL THEN '✅ Tiene WITH CHECK'
    ELSE '⚠️  Sin WITH CHECK'
  END AS "WITH CHECK Clause"
FROM pg_policies
WHERE tablename = 'Suscripcion'
ORDER BY policyname;

-- ==========================================
-- 4. VERIFICAR ESTRUCTURA DE TABLA AUDITORIAACCESO
-- ==========================================

SELECT
  column_name AS "Columna",
  data_type AS "Tipo",
  is_nullable AS "Nullable",
  column_default AS "Default"
FROM information_schema.columns
WHERE table_name = 'AuditoriaAcceso'
ORDER BY ordinal_position;

-- ==========================================
-- 5. CONTAR POLÍTICAS POR TABLA
-- ==========================================

SELECT
  tablename AS "Tabla",
  COUNT(*) AS "Número de Políticas",
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ Suficientes'
    ELSE '⚠️  Pocas políticas'
  END AS "Estado"
FROM pg_policies
WHERE tablename IN ('Usuario', 'Suscripcion', 'AuditoriaAcceso')
GROUP BY tablename
ORDER BY tablename;

-- ==========================================
-- 6. VERIFICAR POLÍTICAS ESPECÍFICAS CRÍTICAS
-- ==========================================

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'Usuario'
      AND policyname = 'Usuario_ve_su_propio_perfil_mejorado'
    ) THEN '✅ Usuario_ve_su_propio_perfil_mejorado'
    ELSE '❌ FALTA: Usuario_ve_su_propio_perfil_mejorado'
  END AS "Política Usuario SELECT",

  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'Usuario'
      AND policyname = 'Terapeuta_ve_sus_pacientes'
    ) THEN '✅ Terapeuta_ve_sus_pacientes'
    ELSE '❌ FALTA: Terapeuta_ve_sus_pacientes'
  END AS "Política Terapeuta",

  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'Suscripcion'
      AND policyname = 'Usuario_ve_su_suscripcion_mejorado'
    ) THEN '✅ Usuario_ve_su_suscripcion_mejorado'
    ELSE '❌ FALTA: Usuario_ve_su_suscripcion_mejorado'
  END AS "Política Suscripcion SELECT",

  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'Suscripcion'
      AND policyname = 'Service_role_gestiona_suscripciones_mejorado'
    ) THEN '✅ Service_role_gestiona_suscripciones_mejorado'
    ELSE '❌ FALTA: Service_role_gestiona_suscripciones_mejorado'
  END AS "Política Service Role";

-- ==========================================
-- 7. VERIFICAR ÍNDICES PARA RENDIMIENTO
-- ==========================================

SELECT
  schemaname,
  tablename,
  indexname,
  CASE
    WHEN indexdef LIKE '%UNIQUE%' THEN '🔑 UNIQUE'
    ELSE '📊 INDEX'
  END AS tipo_indice
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('Usuario', 'Suscripcion', 'AuditoriaAcceso')
ORDER BY tablename, indexname;

-- ==========================================
-- 8. VERIFICAR TRIGGERS RELACIONADOS
-- ==========================================

SELECT
  tgname AS "Trigger",
  tgrelid::regclass AS "Tabla",
  tgtype AS "Tipo",
  tgenabled AS "Habilitado"
FROM pg_trigger
WHERE tgrelid::regclass::text IN ('Usuario', 'Suscripcion', 'AuditoriaAcceso')
AND tgname NOT LIKE 'pg_%'
ORDER BY tgrelid::regclass, tgname;

-- ==========================================
-- 9. ESTADÍSTICAS DE DATOS (OPCIONAL)
-- ==========================================

-- Contar usuarios por rol
SELECT
  rol AS "Rol",
  COUNT(*) AS "Cantidad",
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Datos presentes'
    ELSE '⚠️  Sin datos'
  END AS "Estado"
FROM "Usuario"
GROUP BY rol
ORDER BY rol;

-- Contar suscripciones por estado
SELECT
  estado AS "Estado",
  COUNT(*) AS "Cantidad",
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Datos presentes'
    ELSE '⚠️  Sin datos'
  END AS "Estado Verificación"
FROM "Suscripcion"
GROUP BY estado
ORDER BY estado;

-- ==========================================
-- 10. VERIFICAR FUNCIONES DE SEGURIDAD
-- ==========================================

SELECT
  proname AS "Función",
  pg_get_functiondef(oid) LIKE '%SECURITY DEFINER%' AS "Es Security Definer",
  CASE
    WHEN pg_get_functiondef(oid) LIKE '%SECURITY DEFINER%'
    THEN '⚠️  Revisar (SECURITY DEFINER)'
    ELSE '✅ OK'
  END AS "Estado"
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'update_actualizado_en',
  'actualizar_calificacion_profesional',
  'log_acceso_usuario'
)
ORDER BY proname;

-- ==========================================
-- 11. TEST DE CONSULTA SIMULADA (COMENTADO)
-- ==========================================
-- NOTA: Este test requiere un usuario real en auth.users
-- Descomentar y reemplazar 'your-auth-uuid' con un UUID real para probar

/*
-- Simular contexto de usuario autenticado
SET request.jwt.claims.sub = 'your-auth-uuid';

-- Test 1: Consulta de Usuario por id
SELECT
  id,
  email,
  rol,
  nombre
FROM "Usuario"
WHERE id = (SELECT id FROM "Usuario" WHERE auth_id = current_setting('request.jwt.claims.sub')::uuid LIMIT 1);

-- Test 2: Consulta de Suscripcion
SELECT
  plan,
  estado,
  fecha_fin
FROM "Suscripcion"
WHERE usuario_id = (SELECT id FROM "Usuario" WHERE auth_id = current_setting('request.jwt.claims.sub')::uuid LIMIT 1)
AND estado = 'activa';

-- Reset del contexto
RESET request.jwt.claims.sub;
*/

-- ==========================================
-- 12. RESUMEN DE VERIFICACIÓN
-- ==========================================

SELECT
  'VERIFICACIÓN COMPLETADA' AS "Estado",
  now() AS "Fecha y Hora",
  current_database() AS "Base de Datos",
  current_user AS "Usuario Ejecutor";

-- ==========================================
-- INTERPRETACIÓN DE RESULTADOS
-- ==========================================

/*
RESULTADOS ESPERADOS:

1. RLS HABILITADO:
   - Todas las tablas deben mostrar "✅ HABILITADO"

2. POLÍTICAS DE USUARIO:
   - Mínimo 6 políticas (incluyendo Terapeuta_ve_sus_pacientes)

3. POLÍTICAS DE SUSCRIPCION:
   - Mínimo 5 políticas (incluyendo Service_role)

4. TABLA AUDITORIAACCESO:
   - Debe existir con columnas: usuario_auth_id, tabla, accion, etc.

5. POLÍTICAS CRÍTICAS:
   - Todas deben mostrar "✅"

6. ÍNDICES:
   - Deben existir índices en auth_id, usuario_id, estado, etc.

SI ALGÚN RESULTADO MUESTRA "❌":
- La migración fix_rls_policies.sql no se aplicó correctamente
- Ejecutar nuevamente la migración
- Revisar logs de PostgreSQL para errores

SI TODO MUESTRA "✅":
- Las políticas RLS están correctamente configuradas
- Puedes proceder a probar desde el frontend
*/
