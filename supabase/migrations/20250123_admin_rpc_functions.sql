-- =====================================================
-- FUNCIONES RPC PARA DASHBOARD DE ADMINISTRADOR
-- Fecha: 2025-01-23
-- Propósito: Optimizar queries y eliminar N+1 problems
-- =====================================================

-- =====================================================
-- 1. ESTADÍSTICAS GENERALES DEL DASHBOARD
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado jsonb;
  hoy date;
BEGIN
  hoy := CURRENT_DATE;

  SELECT jsonb_build_object(
    'total_usuarios', (SELECT COUNT(*) FROM "Usuario"),
    'nuevos_usuarios_hoy', (
      SELECT COUNT(*) FROM "Usuario"
      WHERE DATE("creado_en") = hoy
    ),
    'conversaciones_activas', (
      SELECT COUNT(*) FROM "Conversacion" WHERE estado = 'activa'
    ),
    'total_conversaciones', (
      SELECT COUNT(*) FROM "Conversacion"
    ),
    'evaluaciones_realizadas', (
      SELECT COUNT(*) FROM "Evaluacion" WHERE completado = true
    ),
    'suscripciones_activas', (
      SELECT COUNT(*) FROM "Suscripcion" WHERE estado = 'activa'
    ),
    'ingresos_mensuales', (
      SELECT COALESCE(SUM(precio), 0)::numeric(10,2)
      FROM "Suscripcion"
      WHERE estado = 'activa' AND periodo = 'mensual'
    ),
    'ingresos_anuales', (
      SELECT COALESCE(SUM(precio), 0)::numeric(10,2)
      FROM "Suscripcion"
      WHERE estado = 'activa' AND periodo = 'anual'
    ),
    'pagos_completados_hoy', (
      SELECT COUNT(*) FROM "Pago"
      WHERE estado = 'completado' AND DATE("creado_en") = hoy
    ),
    'total_ingresos_hoy', (
      SELECT COALESCE(SUM(monto), 0)::numeric(10,2)
      FROM "Pago"
      WHERE estado = 'completado' AND DATE("creado_en") = hoy
    ),
    'profesionales_aprobados', (
      SELECT COUNT(*) FROM "PerfilProfesional"
      WHERE perfil_aprobado = true
    ),
    'profesionales_pendientes', (
      SELECT COUNT(*) FROM "PerfilProfesional"
      WHERE perfil_aprobado = false
    ),
    'citas_hoy', (
      SELECT COUNT(*) FROM "Cita"
      WHERE DATE("fecha_hora") = hoy
    ),
    'citas_pendientes', (
      SELECT COUNT(*) FROM "Cita"
      WHERE estado = 'pendiente' AND "fecha_hora" >= NOW()
    )
  ) INTO resultado;

  RETURN resultado;
END;
$$;

COMMENT ON FUNCTION obtener_estadisticas_dashboard() IS
'Obtiene todas las estadísticas principales del dashboard de admin en una sola query.
Uso: SELECT obtener_estadisticas_dashboard();';

-- =====================================================
-- 2. USUARIOS CON ESTADÍSTICAS AGREGADAS
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_usuarios_con_estadisticas(
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0,
  p_busqueda TEXT DEFAULT NULL,
  p_rol_filtro TEXT DEFAULT NULL,
  p_estado_filtro BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  email text,
  nombre text,
  apellido text,
  rol text,
  esta_activo boolean,
  creado_en timestamptz,
  actualizado_en timestamptz,
  total_conversaciones bigint,
  total_evaluaciones bigint,
  total_pagos bigint,
  total_citas bigint,
  ultima_actividad timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.nombre,
    u.apellido,
    u.rol,
    u.esta_activo,
    u.creado_en,
    u.actualizado_en,
    COUNT(DISTINCT c.id) as total_conversaciones,
    COUNT(DISTINCT e.id) as total_evaluaciones,
    COUNT(DISTINCT p.id) as total_pagos,
    COUNT(DISTINCT ci.id) as total_citas,
    GREATEST(
      MAX(c.actualizado_en),
      MAX(e.creado_en),
      MAX(ci.actualizado_en),
      u.actualizado_en
    ) as ultima_actividad
  FROM "Usuario" u
  LEFT JOIN "Conversacion" c ON c.usuario_id = u.id
  LEFT JOIN "Evaluacion" e ON e.usuario_id = u.id
  LEFT JOIN "Pago" p ON p.usuario_id = u.id
  LEFT JOIN "Cita" ci ON ci.paciente_id = u.id
  WHERE
    (p_busqueda IS NULL OR
     u.email ILIKE '%' || p_busqueda || '%' OR
     u.nombre ILIKE '%' || p_busqueda || '%' OR
     u.apellido ILIKE '%' || p_busqueda || '%')
    AND (p_rol_filtro IS NULL OR u.rol = p_rol_filtro)
    AND (p_estado_filtro IS NULL OR u.esta_activo = p_estado_filtro)
  GROUP BY u.id, u.email, u.nombre, u.apellido, u.rol, u.esta_activo, u.creado_en, u.actualizado_en
  ORDER BY u.creado_en DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION obtener_usuarios_con_estadisticas IS
'Obtiene usuarios con sus estadísticas agregadas evitando N+1 queries.
Parámetros:
- p_limit: Número de registros a retornar
- p_offset: Desplazamiento para paginación
- p_busqueda: Texto para buscar en email/nombre/apellido
- p_rol_filtro: Filtrar por rol (USUARIO, TERAPEUTA, ADMIN)
- p_estado_filtro: Filtrar por estado activo/inactivo';

-- =====================================================
-- 3. CONTADOR DE USUARIOS FILTRADOS
-- =====================================================
CREATE OR REPLACE FUNCTION contar_usuarios_filtrados(
  p_busqueda TEXT DEFAULT NULL,
  p_rol_filtro TEXT DEFAULT NULL,
  p_estado_filtro BOOLEAN DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total bigint;
BEGIN
  SELECT COUNT(*)
  INTO total
  FROM "Usuario" u
  WHERE
    (p_busqueda IS NULL OR
     u.email ILIKE '%' || p_busqueda || '%' OR
     u.nombre ILIKE '%' || p_busqueda || '%' OR
     u.apellido ILIKE '%' || p_busqueda || '%')
    AND (p_rol_filtro IS NULL OR u.rol = p_rol_filtro)
    AND (p_estado_filtro IS NULL OR u.esta_activo = p_estado_filtro);

  RETURN total;
END;
$$;

-- =====================================================
-- 4. SUSCRIPCIONES CON INFORMACIÓN DE USUARIO
-- =====================================================
CREATE OR REPLACE FUNCTION buscar_suscripciones(
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0,
  p_busqueda TEXT DEFAULT NULL,
  p_plan_filtro TEXT DEFAULT NULL,
  p_estado_filtro TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  plan text,
  periodo text,
  precio numeric,
  moneda text,
  estado text,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  fecha_renovacion timestamptz,
  cancelar_al_final boolean,
  usuario_id uuid,
  usuario_nombre text,
  usuario_apellido text,
  usuario_email text,
  dias_restantes int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.plan,
    s.periodo,
    s.precio,
    s.moneda,
    s.estado,
    s.fecha_inicio,
    s.fecha_fin,
    s.fecha_renovacion,
    s.cancelar_al_final,
    u.id as usuario_id,
    u.nombre as usuario_nombre,
    u.apellido as usuario_apellido,
    u.email as usuario_email,
    CASE
      WHEN s.fecha_fin IS NOT NULL THEN
        EXTRACT(DAY FROM (s.fecha_fin - NOW()))::int
      ELSE NULL
    END as dias_restantes
  FROM "Suscripcion" s
  JOIN "Usuario" u ON u.id = s.usuario_id
  WHERE
    (p_busqueda IS NULL OR
     u.nombre ILIKE '%' || p_busqueda || '%' OR
     u.apellido ILIKE '%' || p_busqueda || '%' OR
     u.email ILIKE '%' || p_busqueda || '%')
    AND (p_plan_filtro IS NULL OR s.plan = p_plan_filtro)
    AND (p_estado_filtro IS NULL OR s.estado = p_estado_filtro)
  ORDER BY s.fecha_inicio DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- 5. ESTADÍSTICAS DE SUSCRIPCIONES
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_suscripciones()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'activas', COUNT(*) FILTER (WHERE estado = 'activa'),
    'canceladas', COUNT(*) FILTER (WHERE estado = 'cancelada'),
    'vencidas', COUNT(*) FILTER (WHERE estado = 'vencida'),
    'pausadas', COUNT(*) FILTER (WHERE estado = 'pausada'),
    'ingresos_mensuales', (
      SELECT COALESCE(SUM(precio), 0)::numeric(10,2)
      FROM "Suscripcion"
      WHERE estado = 'activa' AND periodo = 'mensual'
    ),
    'ingresos_anuales', (
      SELECT COALESCE(SUM(precio), 0)::numeric(10,2)
      FROM "Suscripcion"
      WHERE estado = 'activa' AND periodo = 'anual'
    ),
    'por_plan', (
      SELECT jsonb_object_agg(plan, count)
      FROM (
        SELECT plan, COUNT(*) as count
        FROM "Suscripcion"
        WHERE estado = 'activa'
        GROUP BY plan
      ) subq
    ),
    'vencen_este_mes', (
      SELECT COUNT(*)
      FROM "Suscripcion"
      WHERE estado = 'activa'
        AND fecha_fin IS NOT NULL
        AND DATE_TRUNC('month', fecha_fin) = DATE_TRUNC('month', NOW())
    )
  )
  INTO resultado
  FROM "Suscripcion";

  RETURN resultado;
END;
$$;

-- =====================================================
-- 6. ESTADÍSTICAS DE PAGOS
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_pagos(
  p_fecha_inicio date DEFAULT NULL,
  p_fecha_fin date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado jsonb;
  fecha_inicio date;
  fecha_fin date;
BEGIN
  -- Si no se especifican fechas, usar últimos 30 días
  fecha_inicio := COALESCE(p_fecha_inicio, CURRENT_DATE - INTERVAL '30 days');
  fecha_fin := COALESCE(p_fecha_fin, CURRENT_DATE);

  SELECT jsonb_build_object(
    'total_pagos', COUNT(*),
    'total_ingresos', COALESCE(SUM(monto) FILTER (WHERE estado = 'completado'), 0)::numeric(10,2),
    'pendientes', COUNT(*) FILTER (WHERE estado = 'pendiente'),
    'completados', COUNT(*) FILTER (WHERE estado = 'completado'),
    'fallidos', COUNT(*) FILTER (WHERE estado = 'fallido'),
    'reembolsados', COUNT(*) FILTER (WHERE estado = 'reembolsado'),
    'tasa_exito', (
      CASE
        WHEN COUNT(*) > 0 THEN
          ROUND((COUNT(*) FILTER (WHERE estado = 'completado')::numeric / COUNT(*)) * 100, 2)
        ELSE 0
      END
    ),
    'promedio_pago', (
      CASE
        WHEN COUNT(*) FILTER (WHERE estado = 'completado') > 0 THEN
          ROUND(AVG(monto) FILTER (WHERE estado = 'completado'), 2)
        ELSE 0
      END
    ),
    'por_metodo', (
      SELECT jsonb_object_agg(metodo_pago, count)
      FROM (
        SELECT metodo_pago, COUNT(*) as count
        FROM "Pago"
        WHERE DATE("creado_en") BETWEEN fecha_inicio AND fecha_fin
        GROUP BY metodo_pago
      ) subq
    ),
    'ingresos_diarios', (
      SELECT jsonb_object_agg(fecha, total)
      FROM (
        SELECT
          DATE("creado_en") as fecha,
          SUM(monto)::numeric(10,2) as total
        FROM "Pago"
        WHERE estado = 'completado'
          AND DATE("creado_en") BETWEEN fecha_inicio AND fecha_fin
        GROUP BY DATE("creado_en")
        ORDER BY DATE("creado_en")
      ) subq
    )
  )
  INTO resultado
  FROM "Pago"
  WHERE DATE("creado_en") BETWEEN fecha_inicio AND fecha_fin;

  RETURN resultado;
END;
$$;

-- =====================================================
-- 7. ACTIVIDAD RECIENTE
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_actividad_reciente(
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  tipo text,
  titulo text,
  descripcion text,
  usuario_email text,
  creado_en timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH actividad_unida AS (
    -- Nuevos usuarios
    SELECT
      'nuevo_usuario' as tipo,
      'Nuevo usuario registrado' as titulo,
      u.nombre || ' (' || u.email || ')' as descripcion,
      u.email as usuario_email,
      u.creado_en
    FROM "Usuario" u
    WHERE u.creado_en >= NOW() - INTERVAL '24 hours'

    UNION ALL

    -- Pagos completados
    SELECT
      'pago_completado' as tipo,
      'Pago completado' as titulo,
      u.nombre || ' - ' || p.monto::text || ' ' || p.moneda as descripcion,
      u.email as usuario_email,
      p.creado_en
    FROM "Pago" p
    JOIN "Usuario" u ON u.id = p.usuario_id
    WHERE p.estado = 'completado' AND p.creado_en >= NOW() - INTERVAL '24 hours'

    UNION ALL

    -- Nuevas suscripciones
    SELECT
      'nueva_suscripcion' as tipo,
      'Nueva suscripción ' || s.plan as titulo,
      u.nombre || ' - Plan ' || s.plan as descripcion,
      u.email as usuario_email,
      s.creado_en
    FROM "Suscripcion" s
    JOIN "Usuario" u ON u.id = s.usuario_id
    WHERE s.creado_en >= NOW() - INTERVAL '24 hours'

    UNION ALL

    -- Evaluaciones completadas
    SELECT
      'evaluacion_completada' as tipo,
      'Evaluación completada' as titulo,
      u.nombre || ' - Puntuación: ' || e.puntuacion::text as descripcion,
      u.email as usuario_email,
      e.creado_en
    FROM "Evaluacion" e
    JOIN "Usuario" u ON u.id = e.usuario_id
    WHERE e.completado = true AND e.creado_en >= NOW() - INTERVAL '24 hours'

    UNION ALL

    -- Profesionales aprobados
    SELECT
      'profesional_aprobado' as tipo,
      'Profesional aprobado' as titulo,
      u.nombre || ' - ' || pp.titulo_profesional as descripcion,
      u.email as usuario_email,
      pp.aprobado_en
    FROM "PerfilProfesional" pp
    JOIN "Usuario" u ON u.id = pp.usuario_id
    WHERE pp.perfil_aprobado = true AND pp.aprobado_en >= NOW() - INTERVAL '24 hours'
  )
  SELECT
    au.tipo,
    au.titulo,
    au.descripcion,
    au.usuario_email,
    au.creado_en
  FROM actividad_unida au
  ORDER BY au.creado_en DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 8. CRECIMIENTO DE USUARIOS POR MES
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_crecimiento_usuarios(
  p_meses INT DEFAULT 6
)
RETURNS TABLE (
  mes text,
  total_usuarios bigint,
  nuevos_usuarios bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE meses AS (
    SELECT
      DATE_TRUNC('month', NOW())::date - (n || ' months')::interval AS mes_inicio,
      DATE_TRUNC('month', NOW())::date - (n || ' months')::interval + INTERVAL '1 month' - INTERVAL '1 day' AS mes_fin
    FROM generate_series(p_meses - 1, 0, -1) AS n
  )
  SELECT
    TO_CHAR(m.mes_inicio, 'Mon YYYY') as mes,
    (SELECT COUNT(*) FROM "Usuario" WHERE "creado_en" <= m.mes_fin) as total_usuarios,
    (SELECT COUNT(*) FROM "Usuario" WHERE DATE_TRUNC('month', "creado_en") = m.mes_inicio) as nuevos_usuarios
  FROM meses m
  ORDER BY m.mes_inicio;
END;
$$;

-- =====================================================
-- PERMISOS Y SEGURIDAD
-- =====================================================

-- Revocar permisos públicos
REVOKE ALL ON FUNCTION obtener_estadisticas_dashboard() FROM PUBLIC;
REVOKE ALL ON FUNCTION obtener_usuarios_con_estadisticas FROM PUBLIC;
REVOKE ALL ON FUNCTION contar_usuarios_filtrados FROM PUBLIC;
REVOKE ALL ON FUNCTION buscar_suscripciones FROM PUBLIC;
REVOKE ALL ON FUNCTION obtener_estadisticas_suscripciones() FROM PUBLIC;
REVOKE ALL ON FUNCTION obtener_estadisticas_pagos FROM PUBLIC;
REVOKE ALL ON FUNCTION obtener_actividad_reciente FROM PUBLIC;
REVOKE ALL ON FUNCTION obtener_crecimiento_usuarios FROM PUBLIC;

-- Otorgar permisos solo a usuarios autenticados
GRANT EXECUTE ON FUNCTION obtener_estadisticas_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_usuarios_con_estadisticas TO authenticated;
GRANT EXECUTE ON FUNCTION contar_usuarios_filtrados TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_suscripciones TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_estadisticas_suscripciones() TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_estadisticas_pagos TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_actividad_reciente TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_crecimiento_usuarios TO authenticated;

-- =====================================================
-- NOTAS
-- =====================================================
-- Estas funciones están diseñadas para:
-- 1. Eliminar N+1 query problems
-- 2. Optimizar rendimiento del dashboard
-- 3. Centralizar lógica de negocio
-- 4. Facilitar mantenimiento
--
-- Uso desde TypeScript:
-- const { data } = await supabase.rpc('nombre_funcion', { parametros })
--
-- Todas las funciones usan SECURITY DEFINER para ejecutarse
-- con permisos del propietario de la función, permitiendo
-- acceso a datos que requieren ser admin.
-- =====================================================
