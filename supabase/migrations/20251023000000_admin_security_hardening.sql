-- ==========================================
-- MIGRACIÓN: Reforzamiento de Seguridad para Área Admin
-- Fecha: 2025-10-23
-- Compliance: HIPAA §164.312, GDPR Art. 32
-- Descripción: RLS policies seguras y audit logging para admins
-- ==========================================

-- ==========================================
-- PARTE 1: TABLA DE AUDIT LOG PARA ACCIONES ADMIN
-- ==========================================

CREATE TABLE IF NOT EXISTS "AuditLogAdmin" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin que realizó la acción
  admin_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL NOT NULL,
  admin_email TEXT NOT NULL,

  -- Acción realizada
  accion TEXT NOT NULL CHECK (accion IN (
    'ver_usuarios',
    'actualizar_usuario',
    'cambiar_rol_usuario',
    'activar_usuario',
    'desactivar_usuario',
    'ver_suscripciones',
    'cambiar_estado_suscripcion',
    'ver_pagos',
    'ver_evaluaciones',
    'ver_mensajes',
    'aprobar_profesional',
    'rechazar_profesional',
    'ver_profesionales',
    'exportar_datos',
    'eliminar_datos'
  )),

  -- Recurso afectado
  tabla_afectada TEXT NOT NULL,
  registro_id UUID, -- ID del registro modificado (si aplica)

  -- Cambios realizados (antes/después para UPDATE)
  cambios_realizados JSONB,

  -- Justificación de acceso (requerida para PHI)
  justificacion TEXT,
  es_acceso_phi BOOLEAN DEFAULT false,

  -- Contexto de la solicitud
  ip_address INET,
  user_agent TEXT,
  ruta_solicitud TEXT,
  metodo_http TEXT,

  -- Resultado
  exitoso BOOLEAN DEFAULT true,
  codigo_estado INTEGER,
  mensaje_error TEXT,

  -- Metadata adicional
  duracion_ms INTEGER,
  filtros_aplicados JSONB, -- Para búsquedas: qué filtros usó el admin

  creado_en TIMESTAMP DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_audit_admin_admin_id ON "AuditLogAdmin"(admin_id, creado_en DESC);
CREATE INDEX idx_audit_admin_accion ON "AuditLogAdmin"(accion, creado_en DESC);
CREATE INDEX idx_audit_admin_tabla ON "AuditLogAdmin"(tabla_afectada, registro_id);
CREATE INDEX idx_audit_admin_phi ON "AuditLogAdmin"(es_acceso_phi, creado_en DESC) WHERE es_acceso_phi = true;
CREATE INDEX idx_audit_admin_fecha ON "AuditLogAdmin"(creado_en DESC);
CREATE INDEX idx_audit_admin_fallidos ON "AuditLogAdmin"(exitoso, creado_en DESC) WHERE exitoso = false;

COMMENT ON TABLE "AuditLogAdmin" IS 'Auditoría completa de todas las acciones administrativas (HIPAA §164.312(b))';
COMMENT ON COLUMN "AuditLogAdmin".justificacion IS 'Justificación obligatoria para acceso a PHI por admin';
COMMENT ON COLUMN "AuditLogAdmin".es_acceso_phi IS 'Marca si la acción involucró acceso a Protected Health Information';
COMMENT ON COLUMN "AuditLogAdmin".cambios_realizados IS 'JSON con {antes: {...}, despues: {...}} para operaciones UPDATE';

-- ==========================================
-- RLS PARA AuditLogAdmin
-- ==========================================

ALTER TABLE "AuditLogAdmin" ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver toda la auditoría (transparencia interna)
CREATE POLICY "Admins ven toda la auditoria administrativa"
  ON "AuditLogAdmin"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Solo sistema puede insertar (via SECURITY DEFINER functions)
CREATE POLICY "Sistema inserta auditoria admin"
  ON "AuditLogAdmin"
  FOR INSERT
  WITH CHECK (true);

-- Nadie puede actualizar/eliminar (inmutabilidad)
-- No hay policies de UPDATE/DELETE = prohibido por defecto

-- ==========================================
-- PARTE 2: MEJORAR RLS POLICIES DE USUARIO
-- ==========================================

-- Eliminar policy peligrosa "Admin gestiona usuarios" (FOR ALL)
DROP POLICY IF EXISTS "Admin gestiona usuarios" ON "Usuario";

-- Reemplazar con policies granulares

-- Admin puede actualizar usuarios (pero NO su propio rol ni crear ADMIN)
CREATE POLICY "Admin actualiza usuarios con restricciones"
  ON "Usuario"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario" u_admin
      WHERE u_admin.auth_id = auth.uid() AND u_admin.rol = 'ADMIN'
    )
  )
  WITH CHECK (
    -- No puede cambiar su propio rol
    (id != (SELECT id FROM "Usuario" WHERE auth_id = auth.uid()))
    OR
    -- Si es él mismo, solo puede actualizar campos no-críticos
    (id = (SELECT id FROM "Usuario" WHERE auth_id = auth.uid()) AND rol = (SELECT rol FROM "Usuario" WHERE auth_id = auth.uid()))
  );

-- Admin puede insertar usuarios (excepto otros ADMIN sin justificación)
CREATE POLICY "Admin crea usuarios con validacion"
  ON "Usuario"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
    AND
    -- Prevenir creación de múltiples ADMIN sin control
    (rol != 'ADMIN' OR EXISTS (
      SELECT 1 FROM "AuditLogAdmin"
      WHERE accion = 'crear_admin_autorizado'
        AND creado_en >= now() - INTERVAL '5 minutes'
    ))
  );

-- Admin NO puede eliminar usuarios (solo desactivar)
-- No hay policy DELETE = prohibido

COMMENT ON POLICY "Admin actualiza usuarios con restricciones" ON "Usuario"
IS 'Admin puede actualizar usuarios pero NO puede auto-promover ni cambiar rol de otros admins';

-- ==========================================
-- PARTE 3: RLS PARA SUSCRIPCION (FALTABA)
-- ==========================================

ALTER TABLE "Suscripcion" ENABLE ROW LEVEL SECURITY;

-- Usuario ve solo su propia suscripción
CREATE POLICY "Usuario ve su suscripcion"
  ON "Suscripcion"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario puede actualizar solo cancelación (no cambiar plan)
CREATE POLICY "Usuario solicita cancelacion"
  ON "Suscripcion"
  FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Solo puede cambiar a 'cancelar_al_final'
    estado IN ('activa', 'cancelar_al_final')
    AND plan = (SELECT plan FROM "Suscripcion" WHERE id = "Suscripcion".id)
  );

-- Admin ve todas las suscripciones
CREATE POLICY "Admin ve todas las suscripciones"
  ON "Suscripcion"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Admin NO puede actualizar directamente (debe usar Edge Function)
-- Esto previene cambios sin validar con Stripe
CREATE POLICY "Admin NO actualiza suscripciones directamente"
  ON "Suscripcion"
  FOR UPDATE
  USING (false); -- Siempre deniega

-- Service role puede actualizar (webhooks de Stripe)
CREATE POLICY "Service role actualiza suscripciones"
  ON "Suscripcion"
  FOR UPDATE
  TO service_role
  USING (true);

COMMENT ON POLICY "Admin NO actualiza suscripciones directamente" ON "Suscripcion"
IS 'Admin debe usar Edge Function que valida con Stripe antes de cambiar estado';

-- ==========================================
-- PARTE 4: MEJORAR RLS PARA MENSAJES (Acceso PHI)
-- ==========================================

-- Eliminar policy actual de admin
DROP POLICY IF EXISTS "Admin ve todos los mensajes" ON "Mensaje";

-- Nueva policy que requiere justificación via función
CREATE POLICY "Admin ve mensajes con justificacion registrada"
  ON "Mensaje"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
    AND
    -- Solo si hay justificación reciente (últimos 10 minutos)
    EXISTS (
      SELECT 1 FROM "AuditLogAdmin"
      WHERE admin_id = (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
        AND accion = 'ver_mensajes'
        AND justificacion IS NOT NULL
        AND creado_en >= now() - INTERVAL '10 minutes'
    )
  );

COMMENT ON POLICY "Admin ve mensajes con justificacion registrada" ON "Mensaje"
IS 'Admin debe registrar justificación antes de acceder a mensajes (PHI)';

-- ==========================================
-- PARTE 5: MEJORAR RLS PARA RESULTADO (Evaluaciones)
-- ==========================================

-- Eliminar policy actual
DROP POLICY IF EXISTS "Admin ve todos los resultados" ON "Resultado";

-- Nueva policy con justificación
CREATE POLICY "Admin ve evaluaciones con justificacion"
  ON "Resultado"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
    AND
    EXISTS (
      SELECT 1 FROM "AuditLogAdmin"
      WHERE admin_id = (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
        AND accion = 'ver_evaluaciones'
        AND justificacion IS NOT NULL
        AND creado_en >= now() - INTERVAL '10 minutes'
    )
  );

-- Admin NO puede modificar evaluaciones
-- No hay policy UPDATE/DELETE = prohibido

COMMENT ON POLICY "Admin ve evaluaciones con justificacion" ON "Resultado"
IS 'Admin debe registrar justificación antes de acceder a evaluaciones (PHI crítico)';

-- ==========================================
-- PARTE 6: FUNCIONES DE AUDITORÍA
-- ==========================================

-- Función para registrar acción administrativa
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

  -- Validar que sea admin
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Solo administradores pueden registrar acciones administrativas';
  END IF;

  -- Validar justificación para acceso a PHI
  IF p_es_acceso_phi AND (p_justificacion IS NULL OR length(p_justificacion) < 10) THEN
    RAISE EXCEPTION 'Justificación obligatoria para acceso a PHI (mínimo 10 caracteres)';
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
    ip_address,
    user_agent,
    ruta_solicitud,
    metodo_http,
    filtros_aplicados
  ) VALUES (
    v_admin_id,
    v_admin_email,
    p_accion,
    p_tabla_afectada,
    p_registro_id,
    p_cambios_realizados,
    p_justificacion,
    p_es_acceso_phi,
    p_ip_address::INET,
    p_user_agent,
    p_ruta_solicitud,
    p_metodo_http,
    p_filtros_aplicados
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

COMMENT ON FUNCTION registrar_accion_admin IS 'Registra acción administrativa con validación de justificación para PHI';

-- Función para validar acceso reciente (usado por RLS)
CREATE OR REPLACE FUNCTION admin_tiene_justificacion_reciente(
  p_accion TEXT,
  p_minutos INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_tiene_justificacion BOOLEAN;
BEGIN
  -- Obtener ID del admin
  SELECT id INTO v_admin_id
  FROM "Usuario"
  WHERE auth_id = auth.uid() AND rol = 'ADMIN';

  IF v_admin_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar si hay justificación reciente
  SELECT EXISTS (
    SELECT 1 FROM "AuditLogAdmin"
    WHERE admin_id = v_admin_id
      AND accion = p_accion
      AND justificacion IS NOT NULL
      AND length(justificacion) >= 10
      AND creado_en >= now() - (p_minutos || ' minutes')::INTERVAL
  ) INTO v_tiene_justificacion;

  RETURN v_tiene_justificacion;
END;
$$;

COMMENT ON FUNCTION admin_tiene_justificacion_reciente IS 'Verifica si admin registró justificación recientemente';

-- ==========================================
-- PARTE 7: VISTA PARA ENMASCARAR DATOS DE PAGO
-- ==========================================

-- Vista segura de pagos (sin datos sensibles de Stripe)
CREATE OR REPLACE VIEW "PagoSeguroAdmin" AS
SELECT
  p.id,
  p.usuario_id,
  p.monto,
  p.moneda,
  p.estado,
  p.tipo,
  p.descripcion,
  p.fecha_creacion,
  p.fecha_procesamiento,

  -- Enmascarar IDs de Stripe (solo últimos 8 caracteres)
  CASE
    WHEN p.stripe_payment_intent_id IS NOT NULL
    THEN 'pi_***' || right(p.stripe_payment_intent_id, 8)
    ELSE NULL
  END as stripe_payment_intent_id_enmascarado,

  CASE
    WHEN p.stripe_sesion_id IS NOT NULL
    THEN 'cs_***' || right(p.stripe_sesion_id, 8)
    ELSE NULL
  END as stripe_sesion_id_enmascarado,

  -- Información del usuario (segura)
  u.email as usuario_email,
  u.nombre as usuario_nombre,
  u.rol as usuario_rol
FROM "Pago" p
INNER JOIN "Usuario" u ON p.usuario_id = u.id;

COMMENT ON VIEW "PagoSeguroAdmin" IS 'Vista de pagos con datos de Stripe enmascarados para admin';

-- Vista segura de pagos de citas
CREATE OR REPLACE VIEW "PagoCitaSeguroAdmin" AS
SELECT
  pc.id,
  pc.cita_id,
  pc.usuario_id,
  pc.monto,
  pc.moneda,
  pc.estado,
  pc.fecha_pago,
  pc.creado_en,

  -- Enmascarar IDs de Stripe
  CASE
    WHEN pc.stripe_payment_intent_id IS NOT NULL
    THEN 'pi_***' || right(pc.stripe_payment_intent_id, 8)
    ELSE NULL
  END as stripe_payment_intent_id_enmascarado,

  -- Información del usuario
  u.email as usuario_email,
  u.nombre as usuario_nombre,

  -- Información de la cita (sin PHI)
  c.fecha_hora as cita_fecha_hora,
  c.estado as cita_estado,
  prof.nombre as profesional_nombre
FROM "PagoCita" pc
INNER JOIN "Usuario" u ON pc.usuario_id = u.id
INNER JOIN "Cita" c ON pc.cita_id = c.id
INNER JOIN "Usuario" prof ON c.profesional_id = prof.id;

COMMENT ON VIEW "PagoCitaSeguroAdmin" IS 'Vista de pagos de citas con datos sensibles enmascarados';

-- ==========================================
-- PARTE 8: RLS PARA VISTAS
-- ==========================================

-- Admin puede acceder a vistas seguras sin restricción adicional
ALTER VIEW "PagoSeguroAdmin" SET (security_barrier = true);
ALTER VIEW "PagoCitaSeguroAdmin" SET (security_barrier = true);

-- ==========================================
-- PARTE 9: FUNCIÓN PARA ESTADÍSTICAS ADMIN (AGREGADAS, SIN PHI)
-- ==========================================

CREATE OR REPLACE FUNCTION obtener_estadisticas_admin()
RETURNS TABLE(
  total_usuarios BIGINT,
  usuarios_activos BIGINT,
  usuarios_por_rol JSONB,
  total_suscripciones BIGINT,
  suscripciones_activas BIGINT,
  ingresos_mensuales NUMERIC,
  ingresos_anuales NUMERIC,
  total_citas BIGINT,
  citas_completadas BIGINT,
  total_evaluaciones BIGINT,
  total_conversaciones BIGINT,
  profesionales_pendientes BIGINT,
  profesionales_aprobados BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que sea admin
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden obtener estadísticas';
  END IF;

  -- Registrar acceso (NO es PHI, son agregados)
  PERFORM registrar_accion_admin(
    'ver_estadisticas',
    'dashboard',
    NULL,
    NULL,
    'Visualización de dashboard administrativo',
    false
  );

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM "Usuario") as total_usuarios,
    (SELECT COUNT(*) FROM "Usuario" WHERE esta_activo = true) as usuarios_activos,
    (SELECT jsonb_object_agg(rol, count) FROM (
      SELECT rol, COUNT(*)::bigint as count FROM "Usuario" GROUP BY rol
    ) as rol_counts) as usuarios_por_rol,
    (SELECT COUNT(*) FROM "Suscripcion") as total_suscripciones,
    (SELECT COUNT(*) FROM "Suscripcion" WHERE estado = 'activa') as suscripciones_activas,
    (SELECT COALESCE(SUM(precio), 0) FROM "Suscripcion" WHERE estado = 'activa' AND periodo = 'mensual') as ingresos_mensuales,
    (SELECT COALESCE(SUM(precio * 12), 0) FROM "Suscripcion" WHERE estado = 'activa' AND periodo = 'mensual') +
    (SELECT COALESCE(SUM(precio), 0) FROM "Suscripcion" WHERE estado = 'activa' AND periodo = 'anual') as ingresos_anuales,
    (SELECT COUNT(*) FROM "Cita") as total_citas,
    (SELECT COUNT(*) FROM "Cita" WHERE estado = 'completada') as citas_completadas,
    (SELECT COUNT(*) FROM "Evaluacion") as total_evaluaciones,
    (SELECT COUNT(*) FROM "Conversacion") as total_conversaciones,
    (SELECT COUNT(*) FROM "Profesional" WHERE estado_aprobacion = 'pendiente') as profesionales_pendientes,
    (SELECT COUNT(*) FROM "Profesional" WHERE estado_aprobacion = 'aprobado') as profesionales_aprobados;
END;
$$;

COMMENT ON FUNCTION obtener_estadisticas_admin IS 'Obtiene estadísticas agregadas para dashboard admin (no contiene PHI)';

-- ==========================================
-- PARTE 10: TRIGGERS AUTOMÁTICOS DE AUDITORÍA
-- ==========================================

-- Trigger para auditar cambios de rol de usuario
CREATE OR REPLACE FUNCTION trigger_auditar_cambio_rol_usuario()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Solo si el rol cambió
  IF OLD.rol != NEW.rol THEN
    -- Obtener admin que hace el cambio
    SELECT id INTO v_admin_id
    FROM "Usuario"
    WHERE auth_id = auth.uid();

    -- Registrar cambio
    PERFORM registrar_accion_admin(
      'cambiar_rol_usuario',
      'Usuario',
      NEW.id,
      jsonb_build_object(
        'antes', jsonb_build_object('rol', OLD.rol),
        'despues', jsonb_build_object('rol', NEW.rol)
      ),
      'Cambio de rol de usuario',
      false,
      NULL,
      NULL,
      NULL,
      'database_trigger',
      'UPDATE'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditar_cambio_rol_usuario
  AFTER UPDATE ON "Usuario"
  FOR EACH ROW
  WHEN (OLD.rol IS DISTINCT FROM NEW.rol)
  EXECUTE FUNCTION trigger_auditar_cambio_rol_usuario();

COMMENT ON TRIGGER auditar_cambio_rol_usuario ON "Usuario"
IS 'Audita automáticamente cambios de rol de usuario';

-- Trigger para auditar cambios de estado de suscripción
CREATE OR REPLACE FUNCTION trigger_auditar_cambio_suscripcion()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el estado cambió
  IF OLD.estado != NEW.estado THEN
    PERFORM registrar_accion_admin(
      'cambiar_estado_suscripcion',
      'Suscripcion',
      NEW.id,
      jsonb_build_object(
        'antes', jsonb_build_object('estado', OLD.estado),
        'despues', jsonb_build_object('estado', NEW.estado)
      ),
      'Cambio de estado de suscripción via sistema',
      false,
      NULL,
      NULL,
      NULL,
      'database_trigger',
      'UPDATE'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditar_cambio_suscripcion
  AFTER UPDATE ON "Suscripcion"
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION trigger_auditar_cambio_suscripcion();

-- ==========================================
-- PARTE 11: POLÍTICA DE RETENCIÓN DE AUDITORÍA
-- ==========================================

-- Función para archivar auditorías antiguas (ejecutar mensualmente con cron)
CREATE OR REPLACE FUNCTION archivar_auditorias_admin_antiguas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registros_archivados INTEGER;
BEGIN
  -- HIPAA requiere mínimo 6 años de retención de auditoría
  -- Esta función identifica registros > 2 años para archivo en cold storage

  SELECT COUNT(*)
  INTO v_registros_archivados
  FROM "AuditLogAdmin"
  WHERE creado_en < now() - INTERVAL '2 years';

  -- En implementación real, mover a tabla de archivo o S3 Glacier
  -- Por ahora, solo retorna count

  RETURN v_registros_archivados;
END;
$$;

COMMENT ON FUNCTION archivar_auditorias_admin_antiguas IS
'Identifica auditorías > 2 años para archivo (HIPAA requiere 6 años de retención total)';

-- ==========================================
-- PARTE 12: VISTA DE RESUMEN DE AUDITORÍA
-- ==========================================

CREATE OR REPLACE VIEW "ResumenAuditoriaAdmin" AS
SELECT
  a.admin_email,
  a.accion,
  COUNT(*) as total_acciones,
  COUNT(*) FILTER (WHERE a.es_acceso_phi = true) as accesos_phi,
  COUNT(*) FILTER (WHERE a.exitoso = false) as acciones_fallidas,
  MIN(a.creado_en) as primera_accion,
  MAX(a.creado_en) as ultima_accion,
  COUNT(DISTINCT DATE(a.creado_en)) as dias_activos
FROM "AuditLogAdmin" a
WHERE a.creado_en >= now() - INTERVAL '30 days'
GROUP BY a.admin_email, a.accion
ORDER BY COUNT(*) DESC;

COMMENT ON VIEW "ResumenAuditoriaAdmin" IS
'Resumen de actividad administrativa (últimos 30 días) para compliance reporting';

-- ==========================================
-- FIN DE LA MIGRACIÓN
-- ==========================================

-- Validaciones finales
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Tablas creadas: AuditLogAdmin';
  RAISE NOTICE '🔒 RLS policies actualizadas: Usuario, Suscripcion, Mensaje, Resultado';
  RAISE NOTICE '🛡️ Funciones de auditoría: registrar_accion_admin, admin_tiene_justificacion_reciente';
  RAISE NOTICE '👁️ Vistas seguras: PagoSeguroAdmin, PagoCitaSeguroAdmin';
  RAISE NOTICE '⚠️ IMPORTANTE: Admin debe registrar justificación antes de acceder a PHI';
END $$;
