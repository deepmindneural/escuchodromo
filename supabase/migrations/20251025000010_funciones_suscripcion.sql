-- ==========================================
-- MIGRACIÓN: Funciones RPC para Suscripciones
-- Fecha: 2025-10-25
-- Propósito: Funciones auxiliares para gestión de suscripciones
-- ==========================================

-- ==========================================
-- FUNCIÓN: obtener_suscripcion_usuario
-- Descripción: Obtiene la suscripción activa del usuario autenticado
-- ==========================================
CREATE OR REPLACE FUNCTION obtener_suscripcion_usuario()
RETURNS TABLE (
  id uuid,
  usuario_id uuid,
  plan text,
  estado text,
  precio numeric,
  moneda text,
  periodo text,
  stripe_subscription_id text,
  stripe_customer_id text,
  fecha_inicio timestamp,
  fecha_fin timestamp,
  fecha_renovacion timestamp,
  fecha_proximo_pago timestamp,
  cancelar_al_final boolean,
  cancelada_en timestamp,
  creado_en timestamp,
  actualizado_en timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  -- Obtener ID del usuario autenticado
  SELECT u.id INTO v_usuario_id
  FROM "Usuario" u
  WHERE u.auth_id = auth.uid();

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Retornar la última suscripción del usuario
  RETURN QUERY
  SELECT
    s.id,
    s.usuario_id,
    s.plan,
    s.estado,
    s.precio,
    s.moneda,
    s.periodo,
    s.stripe_subscription_id,
    s.stripe_customer_id,
    s.fecha_inicio,
    s.fecha_fin,
    s.fecha_renovacion,
    s.fecha_proximo_pago,
    s.cancelar_al_final,
    s.cancelada_en,
    s.creado_en,
    s.actualizado_en
  FROM "Suscripcion" s
  WHERE s.usuario_id = v_usuario_id
  ORDER BY s.creado_en DESC
  LIMIT 1;
END;
$$;

-- ==========================================
-- FUNCIÓN: obtener_suscripciones_usuario
-- Descripción: Obtiene todas las suscripciones del usuario autenticado
-- ==========================================
CREATE OR REPLACE FUNCTION obtener_suscripciones_usuario()
RETURNS TABLE (
  id uuid,
  usuario_id uuid,
  plan text,
  estado text,
  precio numeric,
  moneda text,
  periodo text,
  stripe_subscription_id text,
  fecha_inicio timestamp,
  fecha_fin timestamp,
  creado_en timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  -- Obtener ID del usuario autenticado
  SELECT u.id INTO v_usuario_id
  FROM "Usuario" u
  WHERE u.auth_id = auth.uid();

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Retornar todas las suscripciones del usuario
  RETURN QUERY
  SELECT
    s.id,
    s.usuario_id,
    s.plan,
    s.estado,
    s.precio,
    s.moneda,
    s.periodo,
    s.stripe_subscription_id,
    s.fecha_inicio,
    s.fecha_fin,
    s.creado_en
  FROM "Suscripcion" s
  WHERE s.usuario_id = v_usuario_id
  ORDER BY s.creado_en DESC;
END;
$$;

-- ==========================================
-- FUNCIÓN: verificar_suscripcion_activa
-- Descripción: Verifica si el usuario tiene una suscripción activa
-- ==========================================
CREATE OR REPLACE FUNCTION verificar_suscripcion_activa(
  p_plan_codigo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usuario_id UUID;
  v_tiene_suscripcion BOOLEAN;
BEGIN
  -- Obtener ID del usuario autenticado
  SELECT u.id INTO v_usuario_id
  FROM "Usuario" u
  WHERE u.auth_id = auth.uid();

  IF v_usuario_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar suscripción activa
  IF p_plan_codigo IS NULL THEN
    -- Cualquier suscripción activa
    SELECT EXISTS (
      SELECT 1 FROM "Suscripcion"
      WHERE usuario_id = v_usuario_id
        AND estado = 'activa'
        AND (fecha_fin IS NULL OR fecha_fin > now())
    ) INTO v_tiene_suscripcion;
  ELSE
    -- Suscripción activa de un plan específico
    SELECT EXISTS (
      SELECT 1 FROM "Suscripcion"
      WHERE usuario_id = v_usuario_id
        AND plan = p_plan_codigo
        AND estado = 'activa'
        AND (fecha_fin IS NULL OR fecha_fin > now())
    ) INTO v_tiene_suscripcion;
  END IF;

  RETURN v_tiene_suscripcion;
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION obtener_suscripcion_usuario TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_suscripciones_usuario TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_suscripcion_activa TO authenticated;

-- Comentarios
COMMENT ON FUNCTION obtener_suscripcion_usuario IS 'Obtiene la suscripción activa del usuario autenticado';
COMMENT ON FUNCTION obtener_suscripciones_usuario IS 'Obtiene todas las suscripciones del usuario autenticado';
COMMENT ON FUNCTION verificar_suscripcion_activa IS 'Verifica si el usuario tiene una suscripción activa';
