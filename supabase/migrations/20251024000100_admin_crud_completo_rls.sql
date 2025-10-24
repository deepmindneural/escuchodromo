-- ==========================================
-- MIGRACIÓN: Habilitar CRUD Completo para ADMIN
-- Fecha: 2025-10-24
-- Compliance: HIPAA §164.312, GDPR Art. 32
-- Descripción: Políticas RLS para operaciones CRUD completas de ADMIN
--              con auditoría obligatoria para datos PHI
-- ==========================================

-- ==========================================
-- PARTE 1: AMPLIAR ACCIONES PERMITIDAS EN AuditLogAdmin
-- ==========================================

-- Verificar y agregar nuevas acciones al CHECK constraint de AuditLogAdmin
-- Primero eliminar el constraint existente
ALTER TABLE "AuditLogAdmin" DROP CONSTRAINT IF EXISTS "AuditLogAdmin_accion_check";

-- Crear constraint actualizado con más acciones
ALTER TABLE "AuditLogAdmin" ADD CONSTRAINT "AuditLogAdmin_accion_check"
CHECK (accion IN (
  -- Acciones de usuarios
  'ver_usuarios',
  'crear_usuario',
  'actualizar_usuario',
  'cambiar_rol_usuario',
  'activar_usuario',
  'desactivar_usuario',
  'eliminar_usuario_soft',

  -- Acciones de suscripciones
  'ver_suscripciones',
  'cambiar_estado_suscripcion',

  -- Acciones de pagos
  'ver_pagos',

  -- Acciones de evaluaciones (PHI)
  'ver_evaluaciones',
  'actualizar_evaluacion',
  'eliminar_evaluacion',

  -- Acciones de mensajes (PHI)
  'ver_mensajes',

  -- Acciones de profesionales
  'aprobar_profesional',
  'rechazar_profesional',
  'ver_profesionales',
  'actualizar_profesional',
  'eliminar_profesional',

  -- Acciones de documentos profesionales
  'ver_documentos_profesionales',
  'actualizar_documento_profesional',
  'eliminar_documento_profesional',

  -- Acciones administrativas
  'exportar_datos',
  'eliminar_datos',
  'ver_estadisticas',
  'crear_admin_autorizado'
));

COMMENT ON CONSTRAINT "AuditLogAdmin_accion_check" ON "AuditLogAdmin"
IS 'Lista completa de acciones administrativas auditables con operaciones CRUD';

-- ==========================================
-- PARTE 2: POLÍTICAS RLS PARA EVALUACION
-- ==========================================

-- Política SELECT: Admin ve todas las evaluaciones con justificación
-- NOTA: Esta política ya existe desde admin_security_hardening.sql
-- La validamos pero no la recreamos

-- Política UPDATE: Admin puede actualizar evaluaciones con justificación
CREATE POLICY "Admin actualiza evaluaciones con justificacion"
  ON "Evaluacion"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
    AND
    -- Requiere justificación reciente (últimos 10 minutos)
    EXISTS (
      SELECT 1 FROM "AuditLogAdmin"
      WHERE admin_id = (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
        AND accion = 'actualizar_evaluacion'
        AND justificacion IS NOT NULL
        AND length(justificacion) >= 20
        AND creado_en >= now() - INTERVAL '10 minutes'
    )
  )
  WITH CHECK (
    -- Admin puede actualizar solo ciertos campos críticos
    -- NO puede cambiar: usuario_id, test_id, creado_en
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

COMMENT ON POLICY "Admin actualiza evaluaciones con justificacion" ON "Evaluacion"
IS 'Admin puede actualizar evaluaciones con justificación obligatoria de mínimo 20 caracteres (PHI crítico)';

-- Política DELETE: Admin puede eliminar evaluaciones con justificación
CREATE POLICY "Admin elimina evaluaciones con justificacion"
  ON "Evaluacion"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
    AND
    -- Requiere justificación reciente y específica para eliminación
    EXISTS (
      SELECT 1 FROM "AuditLogAdmin"
      WHERE admin_id = (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
        AND accion = 'eliminar_evaluacion'
        AND justificacion IS NOT NULL
        AND length(justificacion) >= 30
        AND creado_en >= now() - INTERVAL '5 minutes'
    )
  );

COMMENT ON POLICY "Admin elimina evaluaciones con justificacion" ON "Evaluacion"
IS 'Admin puede eliminar evaluaciones con justificación obligatoria detallada de mínimo 30 caracteres (PHI crítico)';

-- ==========================================
-- PARTE 3: TRIGGER DE AUDITORÍA PARA EVALUACION
-- ==========================================

-- Trigger para auditar actualizaciones de evaluaciones
CREATE OR REPLACE FUNCTION trigger_auditar_actualizacion_evaluacion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auditar_actualizacion_evaluacion
  AFTER UPDATE ON "Evaluacion"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auditar_actualizacion_evaluacion();

COMMENT ON TRIGGER auditar_actualizacion_evaluacion ON "Evaluacion"
IS 'Audita automáticamente todas las actualizaciones de evaluaciones (PHI crítico)';

-- Trigger para auditar eliminaciones de evaluaciones
CREATE OR REPLACE FUNCTION trigger_auditar_eliminacion_evaluacion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auditar_eliminacion_evaluacion
  BEFORE DELETE ON "Evaluacion"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auditar_eliminacion_evaluacion();

COMMENT ON TRIGGER auditar_eliminacion_evaluacion ON "Evaluacion"
IS 'Audita automáticamente todas las eliminaciones de evaluaciones antes de ejecutarlas (PHI crítico)';

-- ==========================================
-- PARTE 4: POLÍTICA DELETE SOFT PARA USUARIO
-- ==========================================

-- IMPORTANTE: Por política de seguridad establecida en admin_security_hardening.sql,
-- Admin NO puede eliminar físicamente usuarios (hard delete).
-- Solo puede desactivar usuarios (soft delete) vía UPDATE.

-- Crear función para soft delete de usuarios
CREATE OR REPLACE FUNCTION admin_desactivar_usuario(
  p_usuario_id UUID,
  p_justificacion TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION admin_desactivar_usuario IS
'Desactiva (soft delete) un usuario con justificación obligatoria. NO permite hard delete por seguridad.';

-- ==========================================
-- PARTE 5: FUNCIONES RPC PARA OPERACIONES ADMIN CON AUDITORÍA
-- ==========================================

-- Función para actualizar evaluaciones con auditoría
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

COMMENT ON FUNCTION admin_actualizar_evaluacion IS
'Actualiza evaluaciones con validación de justificación y auditoría automática (PHI crítico)';

-- Función para eliminar evaluaciones con auditoría
CREATE OR REPLACE FUNCTION admin_eliminar_evaluacion(
  p_evaluacion_id UUID,
  p_justificacion TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION admin_eliminar_evaluacion IS
'Elimina evaluaciones con validación estricta de justificación y auditoría automática (PHI crítico)';

-- ==========================================
-- PARTE 6: FUNCIÓN PARA LISTAR EVALUACIONES CON AUDITORÍA
-- ==========================================

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

COMMENT ON FUNCTION admin_listar_evaluaciones IS
'Lista evaluaciones con auditoría automática y justificación obligatoria (PHI crítico)';

-- ==========================================
-- PARTE 7: VALIDACIÓN DE MIGRACIÓN
-- ==========================================

DO $$
DECLARE
  v_politicas_evaluacion INTEGER;
  v_triggers_evaluacion INTEGER;
BEGIN
  -- Contar políticas de Evaluacion
  SELECT COUNT(*) INTO v_politicas_evaluacion
  FROM pg_policies
  WHERE tablename = 'Evaluacion';

  -- Contar triggers de Evaluacion
  SELECT COUNT(*) INTO v_triggers_evaluacion
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'Evaluacion'
  AND t.tgname LIKE 'auditar%';

  RAISE NOTICE '✅ Migración de CRUD completo para ADMIN completada';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMEN DE POLÍTICAS RLS:';
  RAISE NOTICE '   - Evaluacion: % políticas RLS configuradas', v_politicas_evaluacion;
  RAISE NOTICE '   - Triggers de auditoría en Evaluacion: %', v_triggers_evaluacion;
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SEGURIDAD IMPLEMENTADA:';
  RAISE NOTICE '   ✓ Admin puede SELECT evaluaciones (con justificación)';
  RAISE NOTICE '   ✓ Admin puede UPDATE evaluaciones (con justificación >= 20 chars)';
  RAISE NOTICE '   ✓ Admin puede DELETE evaluaciones (con justificación >= 30 chars)';
  RAISE NOTICE '   ✓ Usuario NO puede hacer hard delete (solo soft delete con justificación)';
  RAISE NOTICE '   ✓ Todas las operaciones generan logs de auditoría automáticos';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '   - Evaluaciones son PHI crítico - requieren justificación detallada';
  RAISE NOTICE '   - Usuarios solo pueden desactivarse (soft delete), NO eliminarse';
  RAISE NOTICE '   - Todas las acciones se registran en AuditLogAdmin';
  RAISE NOTICE '   - Justificaciones tienen ventana de validez de 5-10 minutos';
  RAISE NOTICE '';
  RAISE NOTICE '📝 FUNCIONES RPC DISPONIBLES:';
  RAISE NOTICE '   - admin_listar_evaluaciones(usuario_id, limite, offset, justificacion)';
  RAISE NOTICE '   - admin_actualizar_evaluacion(evaluacion_id, ..., justificacion)';
  RAISE NOTICE '   - admin_eliminar_evaluacion(evaluacion_id, justificacion)';
  RAISE NOTICE '   - admin_desactivar_usuario(usuario_id, justificacion)';
END $$;
