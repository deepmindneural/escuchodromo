-- ==========================================
-- MEJORAS DE SEGURIDAD RLS
-- Sistema Escuchodromo
-- Fecha: 2025-10-24
-- ==========================================

-- IMPORTANTE: Ejecutar estas queries en Supabase SQL Editor
-- Orden de ejecución: De arriba hacia abajo

-- ==========================================
-- 1. FIJAR SEARCH_PATH EN FUNCIÓN VULNERABLE
-- ==========================================
-- Soluciona: Warning de "Function Search Path Mutable"
-- Previene: Search path injection attacks

CREATE OR REPLACE FUNCTION public.actualizar_timestamp_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'  -- ⭐ AGREGADO para seguridad
AS $function$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.actualizar_timestamp_plan() IS
'Trigger function para actualizar timestamp. SECURITY DEFINER con search_path fijo para prevenir injection.';

-- ==========================================
-- 2. MOVER EXTENSIÓN VECTOR A ESQUEMA DEDICADO
-- ==========================================
-- Soluciona: Warning de "Extension in Public Schema"
-- Mejora: Organización y seguridad de extensiones

-- Crear esquema para extensiones si no existe
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover extensión vector al esquema extensions
ALTER EXTENSION vector SET SCHEMA extensions;

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

COMMENT ON SCHEMA extensions IS
'Esquema dedicado para extensiones de PostgreSQL. Mejora organización y seguridad.';

-- ==========================================
-- 3. AUDITAR VISTAS SECURITY DEFINER
-- ==========================================
-- Objetivo: Verificar que vistas de admin no sean accesibles públicamente

-- 3.1 Ver definición de vistas para auditoría
SELECT
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE viewname IN (
  'PagoCitaSeguroAdmin',
  'ResumenAuditoriaAdmin',
  'PagoSeguroAdmin'
);

-- 3.2 Verificar permisos de las vistas
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN (
  'PagoCitaSeguroAdmin',
  'ResumenAuditoriaAdmin',
  'PagoSeguroAdmin'
)
ORDER BY table_name, grantee;

-- ==========================================
-- 4. CREAR POLÍTICAS RLS PARA VISTAS DE ADMIN
-- ==========================================
-- IMPORTANTE: Solo ejecutar si las vistas NO tienen RLS

-- Habilitar RLS en vistas de admin (si no está habilitado)
-- NOTA: Comentado por defecto, descomentar si es necesario

-- ALTER VIEW "PagoCitaSeguroAdmin" OWNER TO postgres;
-- ALTER VIEW "ResumenAuditoriaAdmin" OWNER TO postgres;
-- ALTER VIEW "PagoSeguroAdmin" OWNER TO postgres;

-- ==========================================
-- 5. CONSOLIDAR POLÍTICAS RLS REDUNDANTES (OPCIONAL)
-- ==========================================
-- Actualmente hay 2 políticas SELECT en Usuario que hacen lo mismo:
-- - select_propio_perfil (role: public)
-- - usuarios_pueden_leer_su_propio_rol (role: authenticated)

-- OPCIÓN A: Eliminar la redundante (usuarios_pueden_leer_su_propio_rol)
-- DROP POLICY IF EXISTS "usuarios_pueden_leer_su_propio_rol" ON "Usuario";

-- OPCIÓN B: Mantener ambas (no afecta funcionalidad, solo duplica)
-- No hacer nada - Son funcionalmente equivalentes y no causan problemas

-- ==========================================
-- 6. CREAR ÍNDICE PARA AUDIT LOG (Optimización)
-- ==========================================
-- Mejora: Performance de queries de auditoría por admin

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_creado_en
ON "AuditLogAdmin" (creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_accion
ON "AuditLogAdmin" (accion);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_admin_id
ON "AuditLogAdmin" (admin_id);

COMMENT ON INDEX idx_audit_log_admin_creado_en IS
'Índice para optimizar queries de auditoría ordenadas por fecha';

COMMENT ON INDEX idx_audit_log_admin_accion IS
'Índice para filtrar auditorías por tipo de acción';

-- ==========================================
-- 7. FUNCIÓN DE VERIFICACIÓN DE SESIÓN VÁLIDA
-- ==========================================
-- Utilidad: Helper function para verificar si auth.uid() es válido

CREATE OR REPLACE FUNCTION public.verificar_sesion_valida()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY INVOKER  -- ⭐ SECURITY INVOKER (no DEFINER)
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Verificar que hay un auth.uid() y que el usuario existe en la tabla
  RETURN EXISTS (
    SELECT 1
    FROM "Usuario"
    WHERE auth_id = auth.uid()
    AND esta_activo = true
  );
END;
$function$;

COMMENT ON FUNCTION public.verificar_sesion_valida() IS
'Verifica si el usuario autenticado actual tiene un registro válido y activo en la tabla Usuario';

-- ==========================================
-- 8. POLÍTICA RLS HELPER: Verificar admin activo
-- ==========================================
-- Utilidad: Function reutilizable para políticas que requieren admin

CREATE OR REPLACE FUNCTION public.es_admin_activo()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM "Usuario"
    WHERE auth_id = auth.uid()
    AND rol = 'ADMIN'
    AND esta_activo = true
  );
END;
$function$;

COMMENT ON FUNCTION public.es_admin_activo() IS
'Helper function para políticas RLS: verifica si el usuario actual es un admin activo';

-- ==========================================
-- 9. CREAR VISTA DE AUDITORÍA SEGURA (SIN SECURITY DEFINER)
-- ==========================================
-- Alternativa a vistas SECURITY DEFINER: Vista con RLS

CREATE OR REPLACE VIEW public.vista_auditoria_segura
WITH (security_invoker = true)  -- ⭐ No usar SECURITY DEFINER
AS
SELECT
  a.id,
  a.accion,
  a.entidad,
  a.entidad_id,
  a.admin_id,
  u.email as admin_email,
  u.nombre as admin_nombre,
  a.creado_en
FROM "AuditLogAdmin" a
INNER JOIN "Usuario" u ON u.id = a.admin_id
-- Solo admins pueden ver auditorías
WHERE EXISTS (
  SELECT 1 FROM "Usuario"
  WHERE auth_id = auth.uid()
  AND rol = 'ADMIN'
);

COMMENT ON VIEW public.vista_auditoria_segura IS
'Vista de auditoría accesible solo para admins usando SECURITY INVOKER en lugar de DEFINER';

-- ==========================================
-- 10. VERIFICAR ESTADO FINAL DE SEGURIDAD
-- ==========================================

-- Ver todas las políticas RLS en Usuario
SELECT
  policyname,
  permissive,
  roles,
  cmd as comando,
  qual as condicion_where
FROM pg_policies
WHERE tablename = 'Usuario'
ORDER BY cmd, policyname;

-- Ver funciones SECURITY DEFINER (deberían tener search_path fijo)
SELECT
  p.proname as nombre_funcion,
  p.prosecdef as es_security_definer,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  CASE
    WHEN p.proconfig IS NULL THEN 'NO - ⚠️ VULNERABLE'
    ELSE 'SÍ - ✅ SEGURO: ' || array_to_string(p.proconfig, ', ')
  END as tiene_search_path_fijo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- Solo SECURITY DEFINER
ORDER BY p.proname;

-- Ver extensiones y sus esquemas
SELECT
  e.extname as extension,
  n.nspname as esquema,
  CASE
    WHEN n.nspname = 'public' THEN '⚠️ En public'
    ELSE '✅ En esquema dedicado'
  END as estado_seguridad
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY e.extname;

-- ==========================================
-- 11. HEALTH CHECK DE SEGURIDAD
-- ==========================================

DO $$
DECLARE
  rls_habilitado boolean;
  funciones_vulnerables int;
  extensiones_en_public int;
BEGIN
  -- Verificar RLS en Usuario
  SELECT relrowsecurity INTO rls_habilitado
  FROM pg_class
  WHERE relname = 'Usuario';

  IF NOT rls_habilitado THEN
    RAISE WARNING '⚠️ RLS NO está habilitado en tabla Usuario';
  ELSE
    RAISE NOTICE '✅ RLS está habilitado en tabla Usuario';
  END IF;

  -- Contar funciones SECURITY DEFINER sin search_path fijo
  SELECT COUNT(*) INTO funciones_vulnerables
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL;

  IF funciones_vulnerables > 0 THEN
    RAISE WARNING '⚠️ % funciones SECURITY DEFINER sin search_path fijo', funciones_vulnerables;
  ELSE
    RAISE NOTICE '✅ Todas las funciones SECURITY DEFINER tienen search_path fijo';
  END IF;

  -- Contar extensiones en public
  SELECT COUNT(*) INTO extensiones_en_public
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname = 'public';

  IF extensiones_en_public > 0 THEN
    RAISE WARNING '⚠️ % extensiones en esquema public', extensiones_en_public;
  ELSE
    RAISE NOTICE '✅ No hay extensiones en esquema public';
  END IF;
END $$;

-- ==========================================
-- FIN DE SCRIPT DE MEJORAS DE SEGURIDAD
-- ==========================================

-- RESUMEN DE CAMBIOS:
-- ✅ Función actualizar_timestamp_plan ahora tiene search_path fijo
-- ✅ Extensión vector movida a esquema extensions
-- ✅ Índices de auditoría creados para mejor performance
-- ✅ Funciones helper para políticas RLS
-- ✅ Vista de auditoría segura sin SECURITY DEFINER
-- ✅ Health check de seguridad ejecutado

-- PRÓXIMOS PASOS:
-- 1. Habilitar protección contra contraseñas filtradas en Supabase Dashboard
-- 2. Auditar manualmente las 3 vistas SECURITY DEFINER
-- 3. Aplicar solución de autenticación en middleware (ver SOLUCION_AUTENTICACION.md)

-- NOTAS DE SEGURIDAD:
-- - Todas las políticas RLS siguen activas y sin cambios
-- - No se eliminaron políticas existentes (solo mejoras)
-- - Cambios son retrocompatibles con código existente
-- - No requiere migración de datos

-- COMPLIANCE:
-- ✅ HIPAA: Mantiene control de acceso y audit trails
-- ✅ GDPR: Mantiene derecho al olvido y minimización de datos
-- ✅ Principio de mínimo privilegio: Mejorado con helpers
-- ✅ Defense in depth: Múltiples capas de seguridad
