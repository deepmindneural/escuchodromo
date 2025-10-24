-- ==========================================
-- MIGRACIÓN: Funciones RPC para gestión de planes
-- ==========================================
-- Fecha: 2025-10-25
-- Propósito: Funciones para CRUD de planes desde panel admin
-- Seguridad: Solo usuarios con rol ADMIN
-- ==========================================

-- ==========================================
-- FUNCIÓN: obtener_planes_admin
-- Descripción: Obtiene todos los planes con estadísticas de suscripciones
-- ==========================================
CREATE OR REPLACE FUNCTION obtener_planes_admin(
  p_incluir_inactivos BOOLEAN DEFAULT false,
  p_moneda_filtro TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  nombre text,
  codigo text,
  descripcion text,
  tipo_usuario text,
  precio_mensual numeric,
  precio_anual numeric,
  moneda text,
  caracteristicas jsonb,
  limite_conversaciones int,
  limite_evaluaciones int,
  acceso_terapeutas boolean,
  limite_pacientes int,
  limite_horas_sesion int,
  acceso_analytics boolean,
  verificado boolean,
  destacado_busqueda boolean,
  prioridad_soporte text,
  esta_activo boolean,
  destacado boolean,
  orden_visualizacion int,
  stripe_product_id text,
  stripe_price_mensual_id text,
  stripe_price_anual_id text,
  creado_en timestamp,
  actualizado_en timestamp,
  total_suscripciones_activas bigint,
  total_suscripciones_historicas bigint,
  ingresos_mensuales_estimados numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que usuario es ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden obtener planes';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.nombre,
    p.codigo,
    p.descripcion,
    p.tipo_usuario,
    p.precio_mensual,
    p.precio_anual,
    p.moneda,
    p.caracteristicas,
    p.limite_conversaciones,
    p.limite_evaluaciones,
    p.acceso_terapeutas,
    p.limite_pacientes,
    p.limite_horas_sesion,
    p.acceso_analytics,
    p.verificado,
    p.destacado_busqueda,
    p.prioridad_soporte,
    p.esta_activo,
    p.destacado,
    p.orden_visualizacion,
    p.stripe_product_id,
    p.stripe_price_mensual_id,
    p.stripe_price_anual_id,
    p.creado_en,
    p.actualizado_en,
    COUNT(s.id) FILTER (WHERE s.estado = 'activa')::bigint as total_suscripciones_activas,
    COUNT(s.id)::bigint as total_suscripciones_historicas,
    COALESCE(
      SUM(s.precio) FILTER (WHERE s.estado = 'activa' AND s.periodo = 'mensual'),
      0
    )::numeric as ingresos_mensuales_estimados
  FROM "Plan" p
  LEFT JOIN "Suscripcion" s ON s.plan = p.codigo
  WHERE
    (p_incluir_inactivos = true OR p.esta_activo = true)
    AND (p_moneda_filtro IS NULL OR p.moneda = p_moneda_filtro)
  GROUP BY p.id
  ORDER BY p.tipo_usuario, p.orden_visualizacion, p.codigo;
END;
$$;

-- ==========================================
-- FUNCIÓN: crear_plan_admin
-- Descripción: Crea un nuevo plan de suscripción
-- ==========================================
CREATE OR REPLACE FUNCTION crear_plan_admin(
  p_nombre TEXT,
  p_codigo TEXT,
  p_descripcion TEXT,
  p_tipo_usuario TEXT,
  p_precio_mensual NUMERIC,
  p_precio_anual NUMERIC,
  p_moneda TEXT,
  p_caracteristicas JSONB,
  p_limite_conversaciones INT DEFAULT NULL,
  p_limite_evaluaciones INT DEFAULT NULL,
  p_acceso_terapeutas BOOLEAN DEFAULT false,
  p_limite_pacientes INT DEFAULT NULL,
  p_limite_horas_sesion INT DEFAULT NULL,
  p_acceso_analytics BOOLEAN DEFAULT false,
  p_verificado BOOLEAN DEFAULT false,
  p_destacado_busqueda BOOLEAN DEFAULT false,
  p_prioridad_soporte TEXT DEFAULT 'basica',
  p_destacado BOOLEAN DEFAULT false,
  p_orden_visualizacion INT DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Validar que usuario es ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden crear planes';
  END IF;

  -- Validar que código no existe
  IF EXISTS (SELECT 1 FROM "Plan" WHERE codigo = p_codigo) THEN
    RAISE EXCEPTION 'Ya existe un plan con el código: %', p_codigo;
  END IF;

  -- Validar tipo de usuario
  IF p_tipo_usuario NOT IN ('paciente', 'profesional') THEN
    RAISE EXCEPTION 'Tipo de usuario debe ser paciente o profesional';
  END IF;

  INSERT INTO "Plan" (
    nombre, codigo, descripcion, tipo_usuario,
    precio_mensual, precio_anual, moneda,
    caracteristicas,
    limite_conversaciones, limite_evaluaciones, acceso_terapeutas,
    limite_pacientes, limite_horas_sesion, acceso_analytics,
    verificado, destacado_busqueda,
    prioridad_soporte, destacado, orden_visualizacion
  ) VALUES (
    p_nombre, p_codigo, p_descripcion, p_tipo_usuario,
    p_precio_mensual, p_precio_anual, p_moneda,
    p_caracteristicas,
    p_limite_conversaciones, p_limite_evaluaciones, p_acceso_terapeutas,
    p_limite_pacientes, p_limite_horas_sesion, p_acceso_analytics,
    p_verificado, p_destacado_busqueda,
    p_prioridad_soporte, p_destacado, p_orden_visualizacion
  )
  RETURNING id INTO v_plan_id;

  -- Registrar acción en audit log (si existe la función)
  BEGIN
    PERFORM registrar_accion_admin(
      'crear_plan',
      jsonb_build_object(
        'plan_id', v_plan_id,
        'codigo', p_codigo,
        'nombre', p_nombre
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar si la función de audit log no existe
    NULL;
  END;

  RETURN v_plan_id;
END;
$$;

-- ==========================================
-- FUNCIÓN: actualizar_plan_admin
-- Descripción: Actualiza un plan existente
-- ==========================================
CREATE OR REPLACE FUNCTION actualizar_plan_admin(
  p_plan_id UUID,
  p_nombre TEXT,
  p_descripcion TEXT,
  p_precio_mensual NUMERIC,
  p_precio_anual NUMERIC,
  p_caracteristicas JSONB,
  p_limite_conversaciones INT DEFAULT NULL,
  p_limite_evaluaciones INT DEFAULT NULL,
  p_acceso_terapeutas BOOLEAN DEFAULT false,
  p_limite_pacientes INT DEFAULT NULL,
  p_limite_horas_sesion INT DEFAULT NULL,
  p_acceso_analytics BOOLEAN DEFAULT false,
  p_verificado BOOLEAN DEFAULT false,
  p_destacado_busqueda BOOLEAN DEFAULT false,
  p_prioridad_soporte TEXT DEFAULT 'basica',
  p_destacado BOOLEAN DEFAULT false,
  p_orden_visualizacion INT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_codigo TEXT;
BEGIN
  -- Validar que usuario es ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden actualizar planes';
  END IF;

  -- Obtener código del plan
  SELECT codigo INTO v_codigo FROM "Plan" WHERE id = p_plan_id;

  IF v_codigo IS NULL THEN
    RAISE EXCEPTION 'Plan no encontrado: %', p_plan_id;
  END IF;

  UPDATE "Plan" SET
    nombre = p_nombre,
    descripcion = p_descripcion,
    precio_mensual = p_precio_mensual,
    precio_anual = p_precio_anual,
    caracteristicas = p_caracteristicas,
    limite_conversaciones = p_limite_conversaciones,
    limite_evaluaciones = p_limite_evaluaciones,
    acceso_terapeutas = p_acceso_terapeutas,
    limite_pacientes = p_limite_pacientes,
    limite_horas_sesion = p_limite_horas_sesion,
    acceso_analytics = p_acceso_analytics,
    verificado = p_verificado,
    destacado_busqueda = p_destacado_busqueda,
    prioridad_soporte = p_prioridad_soporte,
    destacado = p_destacado,
    orden_visualizacion = p_orden_visualizacion,
    actualizado_en = now()
  WHERE id = p_plan_id;

  -- Registrar acción en audit log
  BEGIN
    PERFORM registrar_accion_admin(
      'actualizar_plan',
      jsonb_build_object(
        'plan_id', p_plan_id,
        'codigo', v_codigo,
        'nombre', p_nombre
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

-- ==========================================
-- FUNCIÓN: activar_desactivar_plan_admin
-- Descripción: Activa o desactiva un plan
-- ==========================================
CREATE OR REPLACE FUNCTION activar_desactivar_plan_admin(
  p_plan_id UUID,
  p_activar BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_codigo TEXT;
  v_nombre TEXT;
BEGIN
  -- Validar que usuario es ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden activar/desactivar planes';
  END IF;

  -- Obtener datos del plan
  SELECT codigo, nombre INTO v_codigo, v_nombre FROM "Plan" WHERE id = p_plan_id;

  IF v_codigo IS NULL THEN
    RAISE EXCEPTION 'Plan no encontrado: %', p_plan_id;
  END IF;

  UPDATE "Plan" SET
    esta_activo = p_activar,
    actualizado_en = now()
  WHERE id = p_plan_id;

  -- Registrar acción en audit log
  BEGIN
    PERFORM registrar_accion_admin(
      CASE WHEN p_activar THEN 'activar_plan' ELSE 'desactivar_plan' END,
      jsonb_build_object(
        'plan_id', p_plan_id,
        'codigo', v_codigo,
        'nombre', v_nombre
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

-- ==========================================
-- FUNCIÓN: obtener_plan_publico (para usuarios)
-- Descripción: Obtiene planes activos para mostrar en frontend
-- ==========================================
CREATE OR REPLACE FUNCTION obtener_planes_publico(
  p_tipo_usuario TEXT DEFAULT 'paciente',
  p_moneda TEXT DEFAULT 'COP'
)
RETURNS TABLE (
  id uuid,
  codigo text,
  nombre text,
  descripcion text,
  precio_mensual numeric,
  precio_anual numeric,
  caracteristicas jsonb,
  limite_conversaciones int,
  limite_evaluaciones int,
  acceso_terapeutas boolean,
  limite_pacientes int,
  limite_horas_sesion int,
  acceso_analytics boolean,
  verificado boolean,
  destacado_busqueda boolean,
  prioridad_soporte text,
  destacado boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id,
    codigo,
    nombre,
    descripcion,
    precio_mensual,
    precio_anual,
    caracteristicas,
    limite_conversaciones,
    limite_evaluaciones,
    acceso_terapeutas,
    limite_pacientes,
    limite_horas_sesion,
    acceso_analytics,
    verificado,
    destacado_busqueda,
    prioridad_soporte,
    destacado
  FROM "Plan"
  WHERE
    esta_activo = true
    AND tipo_usuario = p_tipo_usuario
    AND moneda = p_moneda
  ORDER BY orden_visualizacion, codigo;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION obtener_planes_admin TO authenticated;
GRANT EXECUTE ON FUNCTION crear_plan_admin TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_plan_admin TO authenticated;
GRANT EXECUTE ON FUNCTION activar_desactivar_plan_admin TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_planes_publico TO anon, authenticated;

-- Comentarios
COMMENT ON FUNCTION obtener_planes_admin IS 'Obtiene todos los planes con estadísticas (solo ADMIN)';
COMMENT ON FUNCTION crear_plan_admin IS 'Crea un nuevo plan de suscripción (solo ADMIN)';
COMMENT ON FUNCTION actualizar_plan_admin IS 'Actualiza un plan existente (solo ADMIN)';
COMMENT ON FUNCTION activar_desactivar_plan_admin IS 'Activa o desactiva un plan (solo ADMIN)';
COMMENT ON FUNCTION obtener_planes_publico IS 'Obtiene planes activos para mostrar en frontend (público)';
