-- ==========================================
-- MIGRACIÓN: Corregir Search Path en Funciones Admin
-- Fecha: 2025-10-24
-- Compliance: Supabase Security Linter
-- Descripción: Establece search_path fijo en funciones SECURITY DEFINER
--              para prevenir ataques de search_path hijacking
-- ==========================================

-- IMPORTANTE: Las funciones SECURITY DEFINER con search_path mutable son vulnerables
-- a ataques donde un usuario malicioso crea objetos con el mismo nombre en su schema
-- y engaña a la función para usar esos objetos en lugar de los legítimos.

-- ==========================================
-- PARTE 1: ACTUALIZAR FUNCIONES ADMIN
-- ==========================================

-- 1. admin_desactivar_usuario
CREATE OR REPLACE FUNCTION admin_desactivar_usuario(
  p_usuario_id UUID,
  p_justificacion TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_cambios JSONB;
BEGIN
  -- Validar que sea admin
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid() AND rol = 'ADMIN';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Solo administradores pueden desactivar usuarios';
  END IF;

  -- Validar justificación
  IF p_justificacion IS NULL OR length(p_justificacion) < 20 THEN
    RAISE EXCEPTION 'Justificación obligatoria de mínimo 20 caracteres para desactivar usuarios';
  END IF;

  -- Prevenir auto-desactivación
  IF p_usuario_id = v_admin_id THEN
    RAISE EXCEPTION 'Un administrador no puede desactivarse a sí mismo';
  END IF;

  -- Construir cambios
  SELECT jsonb_build_object(
    'antes', jsonb_build_object('esta_activo', esta_activo),
    'despues', jsonb_build_object('esta_activo', false)
  )
  INTO v_cambios
  FROM "Usuario"
  WHERE id = p_usuario_id;

  -- Actualizar usuario
  UPDATE "Usuario"
  SET esta_activo = false
  WHERE id = p_usuario_id;

  -- Registrar acción
  PERFORM registrar_accion_admin(
    'eliminar_usuario_soft',
    'Usuario',
    p_usuario_id,
    v_cambios,
    p_justificacion,
    false,
    NULL,
    NULL,
    NULL,
    'rpc_function',
    'UPDATE'
  );

  RETURN true;
END;
$$;

-- 2. admin_actualizar_evaluacion
CREATE OR REPLACE FUNCTION admin_actualizar_evaluacion(
  p_evaluacion_id UUID,
  p_interpretacion TEXT DEFAULT NULL,
  p_severidad TEXT DEFAULT NULL,
  p_completado BOOLEAN DEFAULT NULL,
  p_justificacion TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_cambios JSONB;
  v_old_record RECORD;
BEGIN
  -- Validar que sea admin
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid() AND rol = 'ADMIN';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Solo administradores pueden actualizar evaluaciones';
  END IF;

  -- Validar justificación (PHI crítico)
  IF p_justificacion IS NULL OR length(p_justificacion) < 20 THEN
    RAISE EXCEPTION 'Justificación obligatoria de mínimo 20 caracteres para actualizar evaluaciones (PHI)';
  END IF;

  -- Obtener registro anterior
  SELECT * INTO v_old_record
  FROM "Evaluacion"
  WHERE id = p_evaluacion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evaluación no encontrada';
  END IF;

  -- Registrar justificación primero (para que pase RLS)
  PERFORM registrar_accion_admin(
    'actualizar_evaluacion',
    'Evaluacion',
    p_evaluacion_id,
    NULL,
    p_justificacion,
    true, -- es_acceso_phi
    NULL,
    NULL,
    NULL,
    'rpc_function',
    'UPDATE'
  );

  -- Actualizar solo campos permitidos
  UPDATE "Evaluacion"
  SET
    interpretacion = COALESCE(p_interpretacion, interpretacion),
    severidad = COALESCE(p_severidad, severidad),
    completado = COALESCE(p_completado, completado)
  WHERE id = p_evaluacion_id;

  RETURN true;
END;
$$;

-- 3. admin_eliminar_evaluacion
CREATE OR REPLACE FUNCTION admin_eliminar_evaluacion(
  p_evaluacion_id UUID,
  p_justificacion TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_evaluacion RECORD;
BEGIN
  -- Validar que sea admin
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid() AND rol = 'ADMIN';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Solo administradores pueden eliminar evaluaciones';
  END IF;

  -- Validar justificación detallada (PHI crítico)
  IF p_justificacion IS NULL OR length(p_justificacion) < 30 THEN
    RAISE EXCEPTION 'Justificación detallada obligatoria de mínimo 30 caracteres para eliminar evaluaciones (PHI crítico)';
  END IF;

  -- Obtener evaluación
  SELECT * INTO v_evaluacion
  FROM "Evaluacion"
  WHERE id = p_evaluacion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evaluación no encontrada';
  END IF;

  -- Registrar justificación primero (para que pase RLS)
  PERFORM registrar_accion_admin(
    'eliminar_evaluacion',
    'Evaluacion',
    p_evaluacion_id,
    jsonb_build_object('evaluacion_a_eliminar', row_to_json(v_evaluacion)::jsonb),
    p_justificacion,
    true, -- es_acceso_phi
    NULL,
    NULL,
    NULL,
    'rpc_function',
    'DELETE'
  );

  -- Eliminar evaluación
  DELETE FROM "Evaluacion"
  WHERE id = p_evaluacion_id;

  RETURN true;
END;
$$;

-- 4. admin_listar_evaluaciones
CREATE OR REPLACE FUNCTION admin_listar_evaluaciones(
  p_usuario_id UUID DEFAULT NULL,
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_justificacion TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  usuario_id UUID,
  test_id UUID,
  puntuacion DOUBLE PRECISION,
  severidad TEXT,
  interpretacion TEXT,
  completado BOOLEAN,
  creado_en TIMESTAMPTZ,
  usuario_email TEXT,
  usuario_nombre TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Validar que sea admin
  SELECT u.id INTO v_admin_id
  FROM "Usuario" u
  WHERE u.auth_id = auth.uid() AND u.rol = 'ADMIN';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Solo administradores pueden listar evaluaciones';
  END IF;

  -- Validar justificación (PHI crítico)
  IF p_justificacion IS NULL OR length(p_justificacion) < 10 THEN
    RAISE EXCEPTION 'Justificación obligatoria de mínimo 10 caracteres para acceder a evaluaciones (PHI)';
  END IF;

  -- Registrar acceso con justificación
  PERFORM registrar_accion_admin(
    'ver_evaluaciones',
    'Evaluacion',
    NULL,
    jsonb_build_object(
      'filtros', jsonb_build_object(
        'usuario_id', p_usuario_id,
        'limite', p_limite,
        'offset', p_offset
      )
    ),
    p_justificacion,
    true, -- es_acceso_phi
    NULL,
    NULL,
    NULL,
    'rpc_function',
    'SELECT'
  );

  -- Retornar evaluaciones
  RETURN QUERY
  SELECT
    e.id,
    e.usuario_id,
    e.test_id,
    e.puntuacion,
    e.severidad,
    e.interpretacion,
    e.completado,
    e.creado_en,
    u.email as usuario_email,
    u.nombre as usuario_nombre
  FROM "Evaluacion" e
  INNER JOIN "Usuario" u ON e.usuario_id = u.id
  WHERE (p_usuario_id IS NULL OR e.usuario_id = p_usuario_id)
  ORDER BY e.creado_en DESC
  LIMIT p_limite
  OFFSET p_offset;
END;
$$;

-- ==========================================
-- PARTE 2: ACTUALIZAR TRIGGERS DE AUDITORÍA
-- ==========================================

-- Trigger para auditar actualizaciones de evaluaciones
CREATE OR REPLACE FUNCTION trigger_auditar_actualizacion_evaluacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_cambios JSONB;
BEGIN
  -- Obtener admin que hace el cambio
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid();

  -- Construir objeto de cambios
  v_cambios := jsonb_build_object(
    'antes', row_to_json(OLD)::jsonb,
    'despues', row_to_json(NEW)::jsonb
  );

  -- Registrar cambio en auditoría
  PERFORM registrar_accion_admin(
    'actualizar_evaluacion',
    'Evaluacion',
    NEW.id,
    v_cambios,
    'Actualización de evaluación vía trigger automático',
    true, -- es_acceso_phi = true (evaluaciones son PHI crítico)
    NULL,
    NULL,
    NULL,
    'database_trigger',
    'UPDATE'
  );

  RETURN NEW;
END;
$$;

-- Trigger para auditar eliminaciones de evaluaciones
CREATE OR REPLACE FUNCTION trigger_auditar_eliminacion_evaluacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Obtener admin que hace el cambio
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid();

  -- Registrar eliminación en auditoría
  PERFORM registrar_accion_admin(
    'eliminar_evaluacion',
    'Evaluacion',
    OLD.id,
    jsonb_build_object('evaluacion_eliminada', row_to_json(OLD)::jsonb),
    'Eliminación de evaluación vía trigger automático',
    true, -- es_acceso_phi = true
    NULL,
    NULL,
    NULL,
    'database_trigger',
    'DELETE'
  );

  RETURN OLD;
END;
$$;

-- ==========================================
-- VALIDACIÓN
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Search path fijado en funciones SECURITY DEFINER';
  RAISE NOTICE '🔒 Protección contra search_path hijacking activada';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones actualizadas:';
  RAISE NOTICE '  - admin_desactivar_usuario';
  RAISE NOTICE '  - admin_actualizar_evaluacion';
  RAISE NOTICE '  - admin_eliminar_evaluacion';
  RAISE NOTICE '  - admin_listar_evaluaciones';
  RAISE NOTICE '  - trigger_auditar_actualizacion_evaluacion';
  RAISE NOTICE '  - trigger_auditar_eliminacion_evaluacion';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  search_path = public, pg_temp';
END $$;
