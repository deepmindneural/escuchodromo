-- =====================================================
-- MIGRACIÓN: Recrear TODAS las funciones RPC sin recursión
-- Fecha: 2025-10-24
-- Problema: Las 7 funciones RPC tenían recursión en validación ADMIN
-- Solución: Usar obtener_rol_usuario_actual() en todas
-- =====================================================

-- IMPORTANTE: Esta migración requiere que exista obtener_rol_usuario_actual()
-- Debe ejecutarse DESPUÉS de 20251024_fix_rls_recursion_usuario.sql

-- Eliminar funciones anteriores (con recursión)
DROP FUNCTION IF EXISTS obtener_usuario_completo(UUID);
DROP FUNCTION IF EXISTS obtener_conversaciones_usuario(UUID);
DROP FUNCTION IF EXISTS obtener_evaluaciones_usuario(UUID);
DROP FUNCTION IF EXISTS obtener_pagos_usuario(UUID);
DROP FUNCTION IF EXISTS obtener_suscripcion_activa_usuario(UUID);
DROP FUNCTION IF EXISTS obtener_citas_usuario(UUID);
DROP FUNCTION IF EXISTS contar_mensajes_usuario(UUID);

-- 1. obtener_usuario_completo - SIN RECURSIÓN
CREATE OR REPLACE FUNCTION obtener_usuario_completo(p_usuario_id UUID)
RETURNS TABLE(
  id UUID,
  nombre TEXT,
  email TEXT,
  rol TEXT,
  telefono TEXT,
  apellido TEXT,
  imagen TEXT,
  esta_activo BOOLEAN,
  creado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_actual TEXT;
  v_auth_uid UUID;
BEGIN
  -- Obtener auth_id y rol sin recursión
  v_auth_uid := auth.uid();
  v_rol_actual := obtener_rol_usuario_actual();

  -- Verificar que el usuario autenticado sea ADMIN o el propio usuario
  IF NOT (
    v_rol_actual = 'ADMIN'
    OR
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE id = p_usuario_id AND auth_id = v_auth_uid
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver este usuario';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.nombre,
    u.email,
    u.rol,
    pu.telefono,
    u.apellido,
    u.imagen,
    u.esta_activo,
    u.creado_en,
    u.actualizado_en
  FROM "Usuario" u
  LEFT JOIN "PerfilUsuario" pu ON pu.usuario_id = u.id
  WHERE u.id = p_usuario_id;
END;
$$;

-- 2. obtener_conversaciones_usuario - SIN RECURSIÓN
CREATE OR REPLACE FUNCTION obtener_conversaciones_usuario(p_usuario_id UUID)
RETURNS TABLE(
  id UUID,
  usuario_id UUID,
  tipo TEXT,
  duracion_segundos INT,
  emocion_detectada TEXT,
  creado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ,
  titulo TEXT,
  estado TEXT,
  cantidad_mensajes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_actual TEXT;
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  v_rol_actual := obtener_rol_usuario_actual();

  IF NOT (
    v_rol_actual = 'ADMIN'
    OR
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE id = p_usuario_id AND auth_id = v_auth_uid
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.usuario_id,
    'chat'::TEXT as tipo,
    EXTRACT(EPOCH FROM (c.actualizado_en - c.creado_en))::INT as duracion_segundos,
    ac.emocion_predominante as emocion_detectada,
    c.creado_en,
    c.actualizado_en,
    c.titulo,
    c.estado,
    (SELECT COUNT(*) FROM "Mensaje" m WHERE m.conversacion_id = c.id) as cantidad_mensajes
  FROM "Conversacion" c
  LEFT JOIN "AnalisisConversacion" ac ON ac.conversacion_id = c.id
  WHERE c.usuario_id = p_usuario_id
  ORDER BY c.creado_en DESC;
END;
$$;

-- 3. obtener_evaluaciones_usuario - SIN RECURSIÓN
CREATE OR REPLACE FUNCTION obtener_evaluaciones_usuario(p_usuario_id UUID)
RETURNS TABLE(
  id UUID,
  tipo TEXT,
  puntaje_total DOUBLE PRECISION,
  severidad TEXT,
  creado_en TIMESTAMPTZ,
  test_nombre TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_actual TEXT;
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  v_rol_actual := obtener_rol_usuario_actual();

  IF NOT (
    v_rol_actual = 'ADMIN'
    OR
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE id = p_usuario_id AND auth_id = v_auth_uid
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    t.codigo as tipo,
    e.puntuacion as puntaje_total,
    e.severidad,
    e.creado_en,
    t.nombre as test_nombre
  FROM "Evaluacion" e
  INNER JOIN "Test" t ON e.test_id = t.id
  WHERE e.usuario_id = p_usuario_id
  ORDER BY e.creado_en DESC;
END;
$$;

-- 4. obtener_pagos_usuario - SIN RECURSIÓN
CREATE OR REPLACE FUNCTION obtener_pagos_usuario(p_usuario_id UUID)
RETURNS TABLE(
  id UUID,
  monto DECIMAL,
  metodo_pago TEXT,
  estado TEXT,
  creado_en TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_actual TEXT;
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  v_rol_actual := obtener_rol_usuario_actual();

  IF NOT (
    v_rol_actual = 'ADMIN'
    OR
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE id = p_usuario_id AND auth_id = v_auth_uid
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.monto,
    p.metodo_pago,
    p.estado,
    p.creado_en
  FROM "Pago" p
  WHERE p.usuario_id = p_usuario_id
  ORDER BY p.creado_en DESC;
END;
$$;

-- 5. obtener_suscripcion_activa_usuario - SIN RECURSIÓN
CREATE OR REPLACE FUNCTION obtener_suscripcion_activa_usuario(p_usuario_id UUID)
RETURNS TABLE(
  id UUID,
  plan_nombre TEXT,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  estado TEXT,
  precio DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_actual TEXT;
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  v_rol_actual := obtener_rol_usuario_actual();

  IF NOT (
    v_rol_actual = 'ADMIN'
    OR
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE id = p_usuario_id AND auth_id = v_auth_uid
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    pl.nombre as plan_nombre,
    s.fecha_inicio,
    s.fecha_fin,
    s.estado,
    pl.precio
  FROM "Suscripcion" s
  INNER JOIN "Plan" pl ON s.plan_id = pl.id
  WHERE s.usuario_id = p_usuario_id
    AND s.estado = 'activa'
  ORDER BY s.fecha_inicio DESC
  LIMIT 1;
END;
$$;

-- 6. obtener_citas_usuario - SIN RECURSIÓN
CREATE OR REPLACE FUNCTION obtener_citas_usuario(p_usuario_id UUID)
RETURNS TABLE(
  id UUID,
  terapeuta_nombre TEXT,
  fecha_hora TIMESTAMPTZ,
  estado TEXT,
  modalidad TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_actual TEXT;
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  v_rol_actual := obtener_rol_usuario_actual();

  IF NOT (
    v_rol_actual = 'ADMIN'
    OR
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE id = p_usuario_id AND auth_id = v_auth_uid
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    u.nombre as terapeuta_nombre,
    c.fecha_hora,
    c.estado,
    c.modalidad
  FROM "Cita" c
  INNER JOIN "Usuario" u ON c.profesional_id = u.id
  WHERE c.paciente_id = p_usuario_id
  ORDER BY c.fecha_hora DESC;
END;
$$;

-- 7. contar_mensajes_usuario - SIN RECURSIÓN
CREATE OR REPLACE FUNCTION contar_mensajes_usuario(p_usuario_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_actual TEXT;
  v_auth_uid UUID;
  v_count BIGINT;
BEGIN
  v_auth_uid := auth.uid();
  v_rol_actual := obtener_rol_usuario_actual();

  IF NOT (
    v_rol_actual = 'ADMIN'
    OR
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE id = p_usuario_id AND auth_id = v_auth_uid
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM "Mensaje" m
  INNER JOIN "Conversacion" c ON m.conversacion_id = c.id
  WHERE c.usuario_id = p_usuario_id
    AND m.rol = 'usuario';

  RETURN v_count;
END;
$$;

-- Dar permisos a todas las funciones
GRANT EXECUTE ON FUNCTION obtener_usuario_completo(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_conversaciones_usuario(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_evaluaciones_usuario(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_pagos_usuario(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_suscripcion_activa_usuario(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_citas_usuario(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION contar_mensajes_usuario(UUID) TO authenticated;

-- Comentarios
COMMENT ON FUNCTION obtener_usuario_completo(UUID) IS 'Obtiene usuario completo con teléfono. Sin recursión RLS.';
COMMENT ON FUNCTION obtener_conversaciones_usuario(UUID) IS 'Obtiene conversaciones de un usuario. Sin recursión RLS.';
COMMENT ON FUNCTION obtener_evaluaciones_usuario(UUID) IS 'Obtiene evaluaciones de un usuario. Sin recursión RLS.';
COMMENT ON FUNCTION obtener_pagos_usuario(UUID) IS 'Obtiene historial de pagos. Sin recursión RLS.';
COMMENT ON FUNCTION obtener_suscripcion_activa_usuario(UUID) IS 'Obtiene suscripción activa. Sin recursión RLS.';
COMMENT ON FUNCTION obtener_citas_usuario(UUID) IS 'Obtiene citas de un usuario. Sin recursión RLS.';
COMMENT ON FUNCTION contar_mensajes_usuario(UUID) IS 'Cuenta mensajes de un usuario. Sin recursión RLS.';
