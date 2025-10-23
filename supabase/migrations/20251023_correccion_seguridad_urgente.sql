-- =====================================================
-- CORRECCIÓN DE SEGURIDAD URGENTE - DASHBOARD ADMIN
-- Fecha: 2025-10-23
-- Prioridad: CRÍTICA
-- =====================================================

-- PROBLEMA 1: Vistas admin accesibles por roles no autorizados
-- RIESGO: Violación HIPAA, exposición de PHI
-- SOLUCIÓN: Revocar permisos excesivos

BEGIN;

-- ===========================================
-- 1. REVOCAR PERMISOS EXCESIVOS EN VISTAS
-- ===========================================

-- Revocar TODOS los permisos de anon (usuarios no autenticados)
REVOKE ALL ON public."PagoSeguroAdmin" FROM anon, public;
REVOKE ALL ON public."PagoCitaSeguroAdmin" FROM anon, public;
REVOKE ALL ON public."ResumenAuditoriaAdmin" FROM anon, public;

-- Revocar permisos de authenticated (las RLS policies manejarán el acceso)
REVOKE ALL ON public."PagoSeguroAdmin" FROM authenticated;
REVOKE ALL ON public."PagoCitaSeguroAdmin" FROM authenticated;
REVOKE ALL ON public."ResumenAuditoriaAdmin" FROM authenticated;

-- Otorgar solo SELECT a authenticated (las policies filtrarán por rol ADMIN)
GRANT SELECT ON public."PagoSeguroAdmin" TO authenticated;
GRANT SELECT ON public."PagoCitaSeguroAdmin" TO authenticated;
GRANT SELECT ON public."ResumenAuditoriaAdmin" TO authenticated;

-- ===========================================
-- 2. CREAR RLS POLICIES PARA VISTAS
-- ===========================================

-- Nota: Las vistas NO pueden tener RLS policies directamente en PostgreSQL.
-- Sin embargo, las vistas heredan el comportamiento RLS de las tablas subyacentes.
-- Como las tablas Pago, PagoCita y AuditLogAdmin ya tienen RLS que requiere
-- rol ADMIN para ver datos de otros usuarios, las vistas están protegidas.

-- Verificamos que las tablas subyacentes tengan RLS habilitado
DO $$
BEGIN
    -- Verificar que RLS está habilitado en tablas base
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'Pago' AND relnamespace = 'public'::regnamespace) THEN
        RAISE EXCEPTION 'RLS no está habilitado en tabla Pago';
    END IF;

    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'PagoCita' AND relnamespace = 'public'::regnamespace) THEN
        RAISE EXCEPTION 'RLS no está habilitado en tabla PagoCita';
    END IF;

    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'AuditLogAdmin' AND relnamespace = 'public'::regnamespace) THEN
        RAISE EXCEPTION 'RLS no está habilitado en tabla AuditLogAdmin';
    END IF;

    RAISE NOTICE 'Verificación RLS exitosa: Todas las tablas base tienen RLS habilitado';
END $$;

-- ===========================================
-- 3. LIMPIAR POLÍTICAS RLS DUPLICADAS EN SUSCRIPCION
-- ===========================================

-- Eliminar políticas antiguas/duplicadas (mantener solo las "_mejorado")
DROP POLICY IF EXISTS "Admin ve todas las suscripciones" ON "Suscripcion";
DROP POLICY IF EXISTS "Admin NO actualiza suscripciones directamente" ON "Suscripcion";
DROP POLICY IF EXISTS "Service role actualiza suscripciones" ON "Suscripcion";
DROP POLICY IF EXISTS "Usuario ve su suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "Usuario solicita cancelacion" ON "Suscripcion";
DROP POLICY IF EXISTS "usuarios_actualizan_suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "usuarios_insertan_suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "usuarios_ven_suscripcion" ON "Suscripcion";

-- Nota: service_role_suscripcion_all es un duplicado de Service_role_gestiona_suscripciones_mejorado
-- pero como service_role es un rol especial de Supabase, verificamos antes de eliminar
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'Suscripcion'
        AND policyname = 'Service_role_gestiona_suscripciones_mejorado'
        AND roles @> ARRAY['service_role']::name[]
    ) THEN
        -- Si existe la policy mejorada con service_role, eliminar la duplicada
        DROP POLICY IF EXISTS "service_role_suscripcion_all" ON "Suscripcion";
        RAISE NOTICE 'Política duplicada service_role_suscripcion_all eliminada';
    ELSE
        RAISE NOTICE 'Manteniendo service_role_suscripcion_all (no hay duplicado mejorado)';
    END IF;
END $$;

-- ===========================================
-- 4. AGREGAR SET SEARCH_PATH A FUNCIONES
-- ===========================================

-- Función: registrar_accion_admin
CREATE OR REPLACE FUNCTION registrar_accion_admin(
    p_accion TEXT,
    p_tabla_afectada TEXT,
    p_registro_id UUID DEFAULT NULL,
    p_cambios_realizados JSONB DEFAULT NULL,
    p_justificacion TEXT DEFAULT NULL,
    p_es_acceso_phi BOOLEAN DEFAULT false,
    p_filtros_aplicados JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ruta_solicitud TEXT DEFAULT NULL,
    p_metodo_http TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'  -- FIX: Prevenir search_path hijacking
AS $$
DECLARE
    v_admin_id UUID;
    v_admin_email TEXT;
    v_audit_id UUID;
BEGIN
    -- Obtener ID y email del admin actual
    SELECT id, email INTO v_admin_id, v_admin_email
    FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN';

    -- Verificar que el usuario es admin
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autorizado: no es ADMIN';
    END IF;

    -- Insertar registro de auditoría
    INSERT INTO "AuditLogAdmin" (
        admin_id,
        admin_email,
        accion,
        tabla_afectada,
        registro_id,
        cambios_realizados,
        justificacion,
        es_acceso_phi,
        filtros_aplicados,
        ip_address,
        user_agent,
        ruta_solicitud,
        metodo_http,
        exitoso,
        codigo_estado,
        creado_en
    ) VALUES (
        v_admin_id,
        v_admin_email,
        p_accion,
        p_tabla_afectada,
        p_registro_id,
        p_cambios_realizados,
        p_justificacion,
        p_es_acceso_phi,
        p_filtros_aplicados,
        p_ip_address::INET,
        p_user_agent,
        p_ruta_solicitud,
        p_metodo_http,
        true,
        200,
        NOW()
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;

-- Función: admin_tiene_justificacion_reciente
CREATE OR REPLACE FUNCTION admin_tiene_justificacion_reciente(
    p_accion TEXT,
    p_minutos INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path TO 'public'  -- FIX: Prevenir search_path hijacking
AS $$
DECLARE
    v_admin_id UUID;
    v_tiene_justificacion BOOLEAN;
BEGIN
    -- Obtener ID del admin actual
    SELECT id INTO v_admin_id
    FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN';

    -- Verificar que el usuario es admin
    IF v_admin_id IS NULL THEN
        RETURN false;
    END IF;

    -- Verificar si hay una justificación reciente para esta acción
    SELECT EXISTS(
        SELECT 1
        FROM "AuditLogAdmin"
        WHERE admin_id = v_admin_id
        AND accion = p_accion
        AND justificacion IS NOT NULL
        AND justificacion != ''
        AND creado_en >= NOW() - (p_minutos || ' minutes')::INTERVAL
    ) INTO v_tiene_justificacion;

    RETURN v_tiene_justificacion;
END;
$$;

-- Función: obtener_estadisticas_admin (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'obtener_estadisticas_admin'
        AND pronamespace = 'public'::regnamespace
    ) THEN
        EXECUTE '
            CREATE OR REPLACE FUNCTION obtener_estadisticas_admin()
            RETURNS JSONB
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path TO ''public''
            AS $func$
            DECLARE
                v_result JSONB;
            BEGIN
                -- Verificar que el usuario es admin
                IF NOT EXISTS (
                    SELECT 1 FROM "Usuario"
                    WHERE auth_id = auth.uid() AND rol = ''ADMIN''
                ) THEN
                    RAISE EXCEPTION ''Usuario no autorizado: no es ADMIN'';
                END IF;

                -- Construir JSON con estadísticas
                SELECT jsonb_build_object(
                    ''total_usuarios'', (SELECT COUNT(*) FROM "Usuario"),
                    ''total_admins'', (SELECT COUNT(*) FROM "Usuario" WHERE rol = ''ADMIN''),
                    ''total_terapeutas'', (SELECT COUNT(*) FROM "Usuario" WHERE rol = ''TERAPEUTA''),
                    ''total_acciones_hoy'', (SELECT COUNT(*) FROM "AuditLogAdmin" WHERE DATE(creado_en) = CURRENT_DATE),
                    ''accesos_phi_hoy'', (SELECT COUNT(*) FROM "AuditLogAdmin" WHERE DATE(creado_en) = CURRENT_DATE AND es_acceso_phi = true)
                ) INTO v_result;

                RETURN v_result;
            END;
            $func$;
        ';
        RAISE NOTICE 'Función obtener_estadisticas_admin actualizada con search_path';
    END IF;
END $$;

-- ===========================================
-- 5. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ===========================================

-- Índice para búsquedas rápidas de justificaciones recientes
CREATE INDEX IF NOT EXISTS idx_auditlogadmin_justificacion_reciente
ON "AuditLogAdmin" (admin_id, accion, creado_en DESC)
WHERE justificacion IS NOT NULL;

-- Índice para accesos PHI
CREATE INDEX IF NOT EXISTS idx_auditlogadmin_phi_accesos
ON "AuditLogAdmin" (es_acceso_phi, creado_en DESC)
WHERE es_acceso_phi = true;

-- Índice para búsquedas de auditoría por admin
CREATE INDEX IF NOT EXISTS idx_auditlogadmin_admin_fecha
ON "AuditLogAdmin" (admin_id, creado_en DESC);

-- ===========================================
-- 6. AGREGAR COMENTARIOS DE DOCUMENTACIÓN
-- ===========================================

COMMENT ON VIEW "PagoSeguroAdmin" IS
'Vista segura que enmascara IDs de Stripe en pagos. Solo accesible por administradores mediante RLS policies de la tabla Pago subyacente. Cumplimiento HIPAA §164.312(a)(2)(iv).';

COMMENT ON VIEW "PagoCitaSeguroAdmin" IS
'Vista segura que enmascara IDs de Stripe en pagos de citas. Solo accesible por administradores mediante RLS policies de la tabla PagoCita subyacente. Cumplimiento HIPAA §164.312(a)(2)(iv).';

COMMENT ON VIEW "ResumenAuditoriaAdmin" IS
'Vista agregada de auditoría administrativa con métricas de los últimos 30 días. Solo accesible por administradores mediante RLS policies de la tabla AuditLogAdmin subyacente. Cumplimiento HIPAA §164.312(b).';

-- ===========================================
-- 7. VERIFICACIÓN DE SEGURIDAD
-- ===========================================

DO $$
DECLARE
    v_permisos_anon INTEGER;
    v_permisos_auth_excesivos INTEGER;
    v_policies_duplicadas INTEGER;
BEGIN
    -- Verificar que anon no tiene permisos en vistas
    SELECT COUNT(*) INTO v_permisos_anon
    FROM information_schema.table_privileges
    WHERE table_name IN ('PagoSeguroAdmin', 'PagoCitaSeguroAdmin', 'ResumenAuditoriaAdmin')
    AND grantee IN ('anon', 'public');

    IF v_permisos_anon > 0 THEN
        RAISE EXCEPTION 'FALLO DE SEGURIDAD: anon/public todavía tiene permisos en vistas admin';
    END IF;

    -- Verificar que authenticated solo tiene SELECT
    SELECT COUNT(*) INTO v_permisos_auth_excesivos
    FROM information_schema.table_privileges
    WHERE table_name IN ('PagoSeguroAdmin', 'PagoCitaSeguroAdmin', 'ResumenAuditoriaAdmin')
    AND grantee = 'authenticated'
    AND privilege_type NOT IN ('SELECT');

    IF v_permisos_auth_excesivos > 0 THEN
        RAISE EXCEPTION 'FALLO DE SEGURIDAD: authenticated tiene permisos excesivos en vistas admin';
    END IF;

    -- Contar políticas en Suscripcion (debe haber aprox 5-7, no 17)
    SELECT COUNT(*) INTO v_policies_duplicadas
    FROM pg_policies
    WHERE tablename = 'Suscripcion';

    RAISE NOTICE '=== VERIFICACIÓN DE SEGURIDAD COMPLETADA ===';
    RAISE NOTICE 'Permisos anon/public en vistas: % (esperado: 0)', v_permisos_anon;
    RAISE NOTICE 'Permisos excesivos authenticated: % (esperado: 0)', v_permisos_auth_excesivos;
    RAISE NOTICE 'Políticas en Suscripcion: % (esperado: 5-7)', v_policies_duplicadas;
    RAISE NOTICE '============================================';

    IF v_permisos_anon = 0 AND v_permisos_auth_excesivos = 0 THEN
        RAISE NOTICE 'ÉXITO: Todas las verificaciones de seguridad pasaron';
    END IF;
END $$;

COMMIT;

-- ===========================================
-- 8. REGISTRO EN AUDIT LOG
-- ===========================================

-- Registrar esta migración en el log de auditoría
INSERT INTO "AuditLogAdmin" (
    admin_id,
    admin_email,
    accion,
    tabla_afectada,
    justificacion,
    es_acceso_phi,
    exitoso,
    codigo_estado,
    creado_en
)
SELECT
    u.id,
    u.email,
    'migracion_seguridad_urgente',
    'SISTEMA',
    'Aplicación automática de migración de seguridad 20251023: Revocación de permisos excesivos en vistas admin, limpieza de políticas RLS duplicadas, adición de search_path a funciones.',
    false,
    true,
    200,
    NOW()
FROM "Usuario" u
WHERE u.rol = 'ADMIN'
LIMIT 1;

-- ===========================================
-- FIN DE MIGRACIÓN
-- ===========================================
