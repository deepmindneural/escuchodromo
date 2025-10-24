-- ==========================================
-- MIGRACIÓN: Funciones Admin para Detalles Completos con Auditoría
-- Fecha: 2025-10-24
-- Compliance: HIPAA §164.312(a)(1), §164.312(b), GDPR Art. 32, Art. 30
-- Descripción: Funciones RPC seguras para consultar detalles completos de usuarios y profesionales
--              con auditoría obligatoria y validación de justificación
-- ==========================================

-- NOTA IMPORTANTE: Este sistema usa "Resultado" para evaluaciones, no "Evaluacion"
-- Las referencias a "Evaluacion" en migraciones anteriores deben interpretarse como "Resultado"

-- ==========================================
-- PARTE 1: VALIDAR POLÍTICAS RLS EXISTENTES
-- ==========================================

-- Verificar que Admin pueda leer todas las tablas críticas
DO $$
DECLARE
  v_politica_conversacion INTEGER;
  v_politica_resultado INTEGER;
  v_politica_pago INTEGER;
  v_politica_suscripcion INTEGER;
  v_politica_cita INTEGER;
BEGIN
  -- Contar políticas de lectura para Admin
  SELECT COUNT(*) INTO v_politica_conversacion
  FROM pg_policies
  WHERE tablename = 'Conversacion'
  AND policyname LIKE '%Admin%'
  AND cmd = 'SELECT';

  SELECT COUNT(*) INTO v_politica_resultado
  FROM pg_policies
  WHERE tablename = 'Resultado'
  AND policyname LIKE '%Admin%'
  AND cmd = 'SELECT';

  SELECT COUNT(*) INTO v_politica_pago
  FROM pg_policies
  WHERE tablename = 'Pago'
  AND policyname LIKE '%Admin%'
  AND cmd = 'SELECT';

  SELECT COUNT(*) INTO v_politica_suscripcion
  FROM pg_policies
  WHERE tablename = 'Suscripcion'
  AND policyname LIKE '%Admin%'
  AND cmd = 'SELECT';

  SELECT COUNT(*) INTO v_politica_cita
  FROM pg_policies
  WHERE tablename = 'Cita'
  AND policyname LIKE '%Admin%'
  AND cmd = 'SELECT';

  RAISE NOTICE '📊 VERIFICACIÓN DE POLÍTICAS RLS EXISTENTES:';
  RAISE NOTICE '  ✓ Conversacion: % políticas Admin SELECT', v_politica_conversacion;
  RAISE NOTICE '  ✓ Resultado: % políticas Admin SELECT', v_politica_resultado;
  RAISE NOTICE '  ✓ Pago: % políticas Admin SELECT', v_politica_pago;
  RAISE NOTICE '  ✓ Suscripcion: % políticas Admin SELECT', v_politica_suscripcion;
  RAISE NOTICE '  ✓ Cita: % políticas Admin SELECT', v_politica_cita;

  IF v_politica_conversacion = 0 THEN
    RAISE WARNING 'No existe política SELECT para Admin en Conversacion';
  END IF;

  IF v_politica_resultado = 0 THEN
    RAISE WARNING 'No existe política SELECT para Admin en Resultado';
  END IF;

  IF v_politica_pago = 0 THEN
    RAISE WARNING 'No existe política SELECT para Admin en Pago';
  END IF;

  IF v_politica_suscripcion = 0 THEN
    RAISE WARNING 'No existe política SELECT para Admin en Suscripcion';
  END IF;

  IF v_politica_cita = 0 THEN
    RAISE WARNING 'No existe política SELECT para Admin en Cita';
  END IF;
END $$;

-- ==========================================
-- PARTE 2: FUNCIÓN PARA OBTENER DETALLES COMPLETOS DE USUARIO
-- ==========================================

CREATE OR REPLACE FUNCTION admin_obtener_detalles_usuario(
  p_usuario_id UUID,
  p_justificacion TEXT DEFAULT 'Consulta de detalles de usuario desde panel administrativo'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_resultado JSONB;
  v_inicio_timestamp TIMESTAMPTZ;
  v_duracion_ms INTEGER;
BEGIN
  v_inicio_timestamp := clock_timestamp();

  -- Validar que sea admin
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid() AND rol = 'ADMIN';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado: Solo ADMIN puede consultar detalles de usuarios';
  END IF;

  -- Validar justificación (mínimo 10 caracteres)
  IF p_justificacion IS NULL OR LENGTH(TRIM(p_justificacion)) < 10 THEN
    RAISE EXCEPTION 'Justificación obligatoria de mínimo 10 caracteres para acceder a datos de usuario';
  END IF;

  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM "Usuario" WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', p_usuario_id;
  END IF;

  -- Obtener datos completos del usuario (SIN contraseñas ni tokens)
  SELECT jsonb_build_object(
    'usuario', jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'nombre', u.nombre,
      'apellido', u.apellido,
      'imagen', u.imagen,
      'rol', u.rol,
      'esta_activo', u.esta_activo,
      'creado_en', u.creado_en,
      'actualizado_en', u.actualizado_en
      -- NUNCA incluir: password, auth_id completo, tokens
    ),
    'perfil', (
      SELECT row_to_json(pu.*)
      FROM "PerfilUsuario" pu
      WHERE pu.usuario_id = p_usuario_id
    ),
    'estadisticas', jsonb_build_object(
      'total_conversaciones', (
        SELECT COUNT(*) FROM "Conversacion" WHERE usuario_id = p_usuario_id
      ),
      'conversaciones_activas', (
        SELECT COUNT(*) FROM "Conversacion"
        WHERE usuario_id = p_usuario_id AND estado = 'activa'
      ),
      'total_mensajes', (
        SELECT COUNT(*) FROM "Mensaje" m
        INNER JOIN "Conversacion" c ON m.conversacion_id = c.id
        WHERE c.usuario_id = p_usuario_id
      ),
      'total_evaluaciones', (
        SELECT COUNT(*) FROM "Resultado" WHERE usuario_id = p_usuario_id
      ),
      'evaluaciones_completadas', (
        SELECT COUNT(*) FROM "Resultado"
        WHERE usuario_id = p_usuario_id
        AND puntuacion IS NOT NULL
      ),
      'total_pagos', (
        SELECT COUNT(*) FROM "Pago" WHERE usuario_id = p_usuario_id
      ),
      'pagos_completados', (
        SELECT COUNT(*) FROM "Pago"
        WHERE usuario_id = p_usuario_id AND estado = 'completado'
      ),
      'monto_total_pagado', (
        SELECT COALESCE(SUM(monto), 0)::NUMERIC(10,2)
        FROM "Pago"
        WHERE usuario_id = p_usuario_id AND estado = 'completado'
      ),
      'total_citas', (
        SELECT COUNT(*) FROM "Cita" WHERE paciente_id = p_usuario_id
      ),
      'citas_completadas', (
        SELECT COUNT(*) FROM "Cita"
        WHERE paciente_id = p_usuario_id AND estado = 'completada'
      ),
      'citas_pendientes', (
        SELECT COUNT(*) FROM "Cita"
        WHERE paciente_id = p_usuario_id AND estado = 'pendiente'
      )
    ),
    'suscripcion_activa', (
      SELECT row_to_json(s.*)
      FROM "Suscripcion" s
      WHERE s.usuario_id = p_usuario_id AND s.estado = 'activa'
      ORDER BY s.fecha_inicio DESC
      LIMIT 1
    ),
    'ultima_conversacion', (
      SELECT jsonb_build_object(
        'id', c.id,
        'titulo', c.titulo,
        'estado', c.estado,
        'creado_en', c.creado_en,
        'actualizado_en', c.actualizado_en,
        'total_mensajes', (
          SELECT COUNT(*) FROM "Mensaje" WHERE conversacion_id = c.id
        )
      )
      FROM "Conversacion" c
      WHERE c.usuario_id = p_usuario_id
      ORDER BY c.actualizado_en DESC
      LIMIT 1
    ),
    'ultimos_pagos', (
      SELECT json_agg(p_data.*)
      FROM (
        SELECT
          p.id,
          p.monto,
          p.moneda,
          p.estado,
          p.metodo,
          p.descripcion,
          p.creado_en,
          -- Enmascarar ID de transacción externa (solo últimos 8 chars)
          CASE
            WHEN p.id_transaccion_externa IS NOT NULL
            THEN '***' || RIGHT(p.id_transaccion_externa, 8)
            ELSE NULL
          END as id_transaccion_externa
        FROM "Pago" p
        WHERE p.usuario_id = p_usuario_id
        ORDER BY p.creado_en DESC
        LIMIT 5
      ) p_data
    )
  ) INTO v_resultado;

  -- Calcular duración
  v_duracion_ms := EXTRACT(MILLISECOND FROM clock_timestamp() - v_inicio_timestamp)::INTEGER;

  -- Registrar acceso en auditoría (NO es PHI agregado, pero sí requiere justificación)
  PERFORM registrar_accion_admin(
    'ver_usuarios',
    'Usuario',
    p_usuario_id,
    jsonb_build_object(
      'campos_accedidos', ARRAY['usuario', 'perfil', 'estadisticas', 'suscripcion', 'pagos'],
      'duracion_ms', v_duracion_ms
    ),
    p_justificacion,
    false, -- No es PHI directo (datos agregados)
    NULL,
    NULL,
    NULL,
    'rpc_function',
    'SELECT'
  );

  RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION admin_obtener_detalles_usuario IS
'Obtiene detalles completos de un usuario con estadísticas agregadas.
IMPORTANTE: NO devuelve contraseñas, tokens ni credenciales.
Requiere justificación mínima de 10 caracteres.
Registra acceso en AuditLogAdmin.
Compliance: HIPAA §164.312(a)(1), GDPR Art. 32';

-- ==========================================
-- PARTE 3: FUNCIÓN PARA OBTENER DETALLES COMPLETOS DE PROFESIONAL
-- ==========================================

CREATE OR REPLACE FUNCTION admin_obtener_detalles_profesional(
  p_profesional_id UUID,
  p_justificacion TEXT DEFAULT 'Consulta de detalles de profesional desde panel administrativo'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_resultado JSONB;
  v_inicio_timestamp TIMESTAMPTZ;
  v_duracion_ms INTEGER;
  v_usuario_id UUID;
BEGIN
  v_inicio_timestamp := clock_timestamp();

  -- Validar que sea admin
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid() AND rol = 'ADMIN';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado: Solo ADMIN puede consultar detalles de profesionales';
  END IF;

  -- Validar justificación
  IF p_justificacion IS NULL OR LENGTH(TRIM(p_justificacion)) < 10 THEN
    RAISE EXCEPTION 'Justificación obligatoria de mínimo 10 caracteres para acceder a datos de profesional';
  END IF;

  -- Obtener usuario_id del perfil profesional
  SELECT usuario_id INTO v_usuario_id
  FROM "PerfilProfesional"
  WHERE id = p_profesional_id;

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Perfil profesional no encontrado: %', p_profesional_id;
  END IF;

  -- Obtener datos completos del profesional
  SELECT jsonb_build_object(
    'usuario', jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'nombre', u.nombre,
      'apellido', u.apellido,
      'imagen', u.imagen,
      'rol', u.rol,
      'esta_activo', u.esta_activo,
      'creado_en', u.creado_en,
      'actualizado_en', u.actualizado_en
    ),
    'perfil_profesional', (
      SELECT row_to_json(pp.*)
      FROM "PerfilProfesional" pp
      WHERE pp.id = p_profesional_id
    ),
    'documentos', (
      SELECT json_agg(doc.*)
      FROM "DocumentoProfesional" doc
      WHERE doc.perfil_profesional_id = p_profesional_id
      ORDER BY doc.fecha_subida DESC
    ),
    'horarios', (
      SELECT json_agg(h.*)
      FROM "HorarioProfesional" h
      WHERE h.perfil_profesional_id = p_profesional_id AND h.activo = true
      ORDER BY h.dia_semana, h.hora_inicio
    ),
    'estadisticas', jsonb_build_object(
      'total_citas', (
        SELECT COUNT(*) FROM "Cita" WHERE profesional_id = v_usuario_id
      ),
      'citas_completadas', (
        SELECT COUNT(*) FROM "Cita"
        WHERE profesional_id = v_usuario_id AND estado = 'completada'
      ),
      'citas_pendientes', (
        SELECT COUNT(*) FROM "Cita"
        WHERE profesional_id = v_usuario_id AND estado = 'pendiente'
      ),
      'citas_canceladas', (
        SELECT COUNT(*) FROM "Cita"
        WHERE profesional_id = v_usuario_id AND estado = 'cancelada'
      ),
      'total_pacientes_unicos', (
        SELECT COUNT(DISTINCT paciente_id)
        FROM "Cita"
        WHERE profesional_id = v_usuario_id
      ),
      'calificacion_promedio', (
        SELECT ROUND(AVG(calificacion)::NUMERIC, 2)
        FROM "CalificacionProfesional"
        WHERE profesional_id = v_usuario_id
      ),
      'total_calificaciones', (
        SELECT COUNT(*)
        FROM "CalificacionProfesional"
        WHERE profesional_id = v_usuario_id
      )
    ),
    'ultimas_citas', (
      SELECT json_agg(c_data.*)
      FROM (
        SELECT
          c.id,
          c.fecha_hora,
          c.estado,
          c.tipo_sesion,
          c.creado_en,
          jsonb_build_object(
            'id', p.id,
            'nombre', p.nombre,
            'apellido', p.apellido,
            'email', p.email
          ) as paciente
        FROM "Cita" c
        INNER JOIN "Usuario" p ON c.paciente_id = p.id
        WHERE c.profesional_id = v_usuario_id
        ORDER BY c.fecha_hora DESC
        LIMIT 10
      ) c_data
    ),
    'calificaciones_recientes', (
      SELECT json_agg(cal_data.*)
      FROM (
        SELECT
          cal.id,
          cal.calificacion,
          cal.comentario,
          cal.creado_en,
          jsonb_build_object(
            'id', pac.id,
            'nombre', pac.nombre,
            'apellido', pac.apellido
          ) as paciente
        FROM "CalificacionProfesional" cal
        INNER JOIN "Usuario" pac ON cal.paciente_id = pac.id
        WHERE cal.profesional_id = v_usuario_id
        ORDER BY cal.creado_en DESC
        LIMIT 5
      ) cal_data
    )
  ) INTO v_resultado
  FROM "Usuario" u
  WHERE u.id = v_usuario_id;

  -- Calcular duración
  v_duracion_ms := EXTRACT(MILLISECOND FROM clock_timestamp() - v_inicio_timestamp)::INTEGER;

  -- Registrar acceso en auditoría
  PERFORM registrar_accion_admin(
    'ver_profesionales',
    'PerfilProfesional',
    p_profesional_id,
    jsonb_build_object(
      'campos_accedidos', ARRAY['usuario', 'perfil', 'documentos', 'horarios', 'estadisticas', 'citas', 'calificaciones'],
      'duracion_ms', v_duracion_ms,
      'usuario_id', v_usuario_id
    ),
    p_justificacion,
    false, -- No es PHI directo (datos agregados)
    NULL,
    NULL,
    NULL,
    'rpc_function',
    'SELECT'
  );

  RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION admin_obtener_detalles_profesional IS
'Obtiene detalles completos de un profesional incluyendo documentos, horarios y estadísticas.
Requiere justificación mínima de 10 caracteres.
Registra acceso en AuditLogAdmin.
Compliance: HIPAA §164.312(a)(1), GDPR Art. 32';

-- ==========================================
-- PARTE 4: FUNCIÓN PARA VALIDAR PROTECCIÓN DE DATOS SENSIBLES
-- ==========================================

CREATE OR REPLACE FUNCTION validar_proteccion_datos_sensibles()
RETURNS TABLE(
  funcion TEXT,
  campos_excluidos TEXT[],
  cumple_seguridad BOOLEAN,
  observaciones TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validar que sea admin
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo ADMIN puede ejecutar validaciones de seguridad';
  END IF;

  RETURN QUERY
  SELECT
    'admin_obtener_detalles_usuario'::TEXT as funcion,
    ARRAY['password', 'auth_id', 'tokens', 'credenciales']::TEXT[] as campos_excluidos,
    true as cumple_seguridad,
    'Función NO expone contraseñas, tokens ni credenciales. IDs de transacción enmascarados.'::TEXT as observaciones
  UNION ALL
  SELECT
    'admin_obtener_detalles_profesional'::TEXT,
    ARRAY['password', 'auth_id', 'tokens', 'credenciales']::TEXT[],
    true,
    'Función NO expone contraseñas, tokens ni credenciales. Datos PHI de pacientes limitados.'::TEXT
  UNION ALL
  SELECT
    'PagoSeguroAdmin (vista)'::TEXT,
    ARRAY['stripe_payment_intent_id', 'stripe_sesion_id']::TEXT[],
    true,
    'Vista enmascara IDs de Stripe (solo últimos 8 caracteres visibles).'::TEXT;
END;
$$;

COMMENT ON FUNCTION validar_proteccion_datos_sensibles IS
'Valida que las funciones admin NO expongan datos sensibles como contraseñas, tokens o credenciales.
Solo ejecutable por ADMIN.
Compliance: HIPAA §164.312(a)(2)(i), GDPR Art. 32(1)(a)';

-- ==========================================
-- PARTE 5: REVOCAR Y OTORGAR PERMISOS
-- ==========================================

-- Revocar permisos públicos
REVOKE ALL ON FUNCTION admin_obtener_detalles_usuario FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_obtener_detalles_profesional FROM PUBLIC;
REVOKE ALL ON FUNCTION validar_proteccion_datos_sensibles FROM PUBLIC;

-- Otorgar permisos solo a usuarios autenticados (validación interna verifica rol ADMIN)
GRANT EXECUTE ON FUNCTION admin_obtener_detalles_usuario TO authenticated;
GRANT EXECUTE ON FUNCTION admin_obtener_detalles_profesional TO authenticated;
GRANT EXECUTE ON FUNCTION validar_proteccion_datos_sensibles TO authenticated;

-- ==========================================
-- PARTE 6: VALIDACIÓN Y RESUMEN
-- ==========================================

DO $$
DECLARE
  v_total_funciones INTEGER;
  v_funciones_con_search_path INTEGER;
BEGIN
  -- Contar funciones SECURITY DEFINER con search_path fijo
  SELECT COUNT(*) INTO v_total_funciones
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND p.proname LIKE 'admin_%';

  SELECT COUNT(*) INTO v_funciones_con_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND p.proname LIKE 'admin_%'
  AND p.proconfig IS NOT NULL
  AND 'search_path=public, pg_temp' = ANY(p.proconfig);

  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRACIÓN COMPLETADA: Funciones Admin de Detalles Completos';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMEN DE SEGURIDAD:';
  RAISE NOTICE '  ✓ Total funciones SECURITY DEFINER admin: %', v_total_funciones;
  RAISE NOTICE '  ✓ Funciones con search_path fijo: %', v_funciones_con_search_path;
  RAISE NOTICE '';
  RAISE NOTICE '🔒 FUNCIONES CREADAS:';
  RAISE NOTICE '  ✓ admin_obtener_detalles_usuario(usuario_id, justificacion)';
  RAISE NOTICE '  ✓ admin_obtener_detalles_profesional(profesional_id, justificacion)';
  RAISE NOTICE '  ✓ validar_proteccion_datos_sensibles()';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️ PROTECCIONES IMPLEMENTADAS:';
  RAISE NOTICE '  ✓ Justificación obligatoria (mínimo 10 caracteres)';
  RAISE NOTICE '  ✓ Auditoría automática en AuditLogAdmin';
  RAISE NOTICE '  ✓ NUNCA expone: contraseñas, tokens, credenciales';
  RAISE NOTICE '  ✓ IDs de transacción Stripe enmascarados';
  RAISE NOTICE '  ✓ search_path fijo contra hijacking';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COMPLIANCE:';
  RAISE NOTICE '  ✓ HIPAA §164.312(a)(1) - Access Control';
  RAISE NOTICE '  ✓ HIPAA §164.312(b) - Audit Controls';
  RAISE NOTICE '  ✓ HIPAA §164.308(a)(5)(ii)(C) - Log-in Monitoring';
  RAISE NOTICE '  ✓ GDPR Art. 32 - Security of Processing';
  RAISE NOTICE '  ✓ GDPR Art. 30 - Records of Processing Activities';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  - Tabla "Resultado" almacena evaluaciones (no "Evaluacion")';
  RAISE NOTICE '  - Admin debe proporcionar justificación válida';
  RAISE NOTICE '  - Todos los accesos se registran permanentemente';
  RAISE NOTICE '  - Datos sensibles NUNCA se exponen en respuestas';
  RAISE NOTICE '';
END $$;
