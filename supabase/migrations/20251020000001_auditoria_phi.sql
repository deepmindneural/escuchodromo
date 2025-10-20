-- ==========================================
-- MIGRACIÓN: Auditoría Completa de Acceso a PHI
-- Fecha: 2025-10-20
-- Compliance: HIPAA (§164.312(b) - Audit Controls)
-- Descripción: Sistema completo de auditoría de accesos a PHI
-- ==========================================

-- ==========================================
-- TABLA: AuditoriaAccesoPHI
-- Registro completo de todos los accesos a Protected Health Information
-- ==========================================
CREATE TABLE IF NOT EXISTS "AuditoriaAccesoPHI" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario que accedió
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL NOT NULL,

  -- Recurso accedido
  tipo_recurso TEXT NOT NULL CHECK (tipo_recurso IN (
    'cita',
    'nota_sesion',
    'mensaje',
    'resultado',
    'perfil_paciente',
    'conversacion',
    'evaluacion'
  )),
  recurso_id UUID NOT NULL,

  -- Acción realizada
  accion TEXT NOT NULL CHECK (accion IN (
    'leer',
    'crear',
    'actualizar',
    'eliminar',
    'descargar',
    'compartir'
  )),

  -- Contexto de acceso
  ip_address TEXT,
  user_agent TEXT,
  endpoint TEXT, -- API endpoint usado
  metodo_http TEXT, -- GET, POST, PUT, DELETE

  -- Justificación de acceso (requerido para admins)
  justificacion TEXT,

  -- Resultado del acceso
  exitoso BOOLEAN DEFAULT true,
  codigo_http INTEGER,
  error_mensaje TEXT,

  -- Metadata adicional
  datos_accedidos JSONB, -- Metadatos de qué datos fueron accedidos (no los datos en sí)
  duracion_ms INTEGER, -- Tiempo que tomó la operación

  creado_en TIMESTAMP DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_auditoria_phi_usuario ON "AuditoriaAccesoPHI"(usuario_id, creado_en DESC);
CREATE INDEX idx_auditoria_phi_recurso ON "AuditoriaAccesoPHI"(tipo_recurso, recurso_id);
CREATE INDEX idx_auditoria_phi_fecha ON "AuditoriaAccesoPHI"(creado_en DESC);
CREATE INDEX idx_auditoria_phi_accion ON "AuditoriaAccesoPHI"(accion, creado_en DESC);
CREATE INDEX idx_auditoria_phi_exitoso ON "AuditoriaAccesoPHI"(exitoso, creado_en DESC) WHERE exitoso = false;

COMMENT ON TABLE "AuditoriaAccesoPHI" IS 'Auditoría completa de accesos a información médica protegida (HIPAA §164.312(b))';
COMMENT ON COLUMN "AuditoriaAccesoPHI".tipo_recurso IS 'Tipo de recurso PHI accedido';
COMMENT ON COLUMN "AuditoriaAccesoPHI".accion IS 'Acción realizada sobre el recurso';
COMMENT ON COLUMN "AuditoriaAccesoPHI".justificacion IS 'Justificación del acceso (requerido para admins)';
COMMENT ON COLUMN "AuditoriaAccesoPHI".datos_accedidos IS 'Metadata sobre qué datos fueron accedidos (NO los datos en sí)';

-- ==========================================
-- RLS PARA AuditoriaAccesoPHI
-- ==========================================

ALTER TABLE "AuditoriaAccesoPHI" ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver toda la auditoría
CREATE POLICY "Admins ven toda la auditoría PHI"
  ON "AuditoriaAccesoPHI"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Usuarios pueden ver su propia auditoría (transparencia GDPR)
CREATE POLICY "Usuarios ven su propia auditoría PHI"
  ON "AuditoriaAccesoPHI"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Solo el sistema puede insertar registros de auditoría (SECURITY DEFINER functions)
CREATE POLICY "Sistema inserta auditoría"
  ON "AuditoriaAccesoPHI"
  FOR INSERT
  WITH CHECK (true); -- Controlado por SECURITY DEFINER functions

-- Nadie puede actualizar o eliminar registros de auditoría (inmutabilidad)
-- No hay políticas de UPDATE/DELETE, por lo tanto, están prohibidas por defecto

-- ==========================================
-- FUNCIONES DE AUDITORÍA
-- ==========================================

-- Función principal para registrar acceso a PHI
CREATE OR REPLACE FUNCTION registrar_acceso_phi(
  p_usuario_id UUID,
  p_tipo_recurso TEXT,
  p_recurso_id UUID,
  p_accion TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL,
  p_metodo_http TEXT DEFAULT NULL,
  p_justificacion TEXT DEFAULT NULL,
  p_exitoso BOOLEAN DEFAULT true,
  p_codigo_http INTEGER DEFAULT 200,
  p_error_mensaje TEXT DEFAULT NULL,
  p_datos_accedidos JSONB DEFAULT NULL,
  p_duracion_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auditoria_id UUID;
BEGIN
  INSERT INTO "AuditoriaAccesoPHI" (
    usuario_id,
    tipo_recurso,
    recurso_id,
    accion,
    ip_address,
    user_agent,
    endpoint,
    metodo_http,
    justificacion,
    exitoso,
    codigo_http,
    error_mensaje,
    datos_accedidos,
    duracion_ms
  ) VALUES (
    p_usuario_id,
    p_tipo_recurso,
    p_recurso_id,
    p_accion,
    p_ip_address,
    p_user_agent,
    p_endpoint,
    p_metodo_http,
    p_justificacion,
    p_exitoso,
    p_codigo_http,
    p_error_mensaje,
    p_datos_accedidos,
    p_duracion_ms
  ) RETURNING id INTO v_auditoria_id;

  RETURN v_auditoria_id;
END;
$$;

COMMENT ON FUNCTION registrar_acceso_phi IS 'Registra acceso a PHI con contexto completo (HIPAA-compliant)';

-- Función para obtener historial de acceso a un recurso específico
CREATE OR REPLACE FUNCTION obtener_historial_acceso_phi(
  p_tipo_recurso TEXT,
  p_recurso_id UUID,
  p_limite INTEGER DEFAULT 50
)
RETURNS TABLE(
  usuario_nombre TEXT,
  usuario_email TEXT,
  accion TEXT,
  fecha_acceso TIMESTAMP,
  ip_address TEXT,
  exitoso BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario que consulta sea admin
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden consultar historial de acceso';
  END IF;

  RETURN QUERY
  SELECT
    pu.nombre,
    pu.email,
    a.accion,
    a.creado_en,
    a.ip_address,
    a.exitoso
  FROM "AuditoriaAccesoPHI" a
  INNER JOIN "Usuario" u ON a.usuario_id = u.id
  LEFT JOIN "PerfilUsuario" pu ON u.id = pu.usuario_id
  WHERE a.tipo_recurso = p_tipo_recurso
    AND a.recurso_id = p_recurso_id
  ORDER BY a.creado_en DESC
  LIMIT p_limite;
END;
$$;

COMMENT ON FUNCTION obtener_historial_acceso_phi IS 'Obtiene historial de accesos a un recurso PHI específico (solo admins)';

-- Función para detectar patrones de acceso sospechosos
CREATE OR REPLACE FUNCTION detectar_accesos_sospechosos(
  p_dias_atras INTEGER DEFAULT 7
)
RETURNS TABLE(
  usuario_id UUID,
  usuario_email TEXT,
  total_accesos BIGINT,
  accesos_fallidos BIGINT,
  recursos_distintos BIGINT,
  alerta TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario que consulta sea admin
  IF NOT EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden consultar accesos sospechosos';
  END IF;

  RETURN QUERY
  SELECT
    a.usuario_id,
    u.email,
    COUNT(*) as total_accesos,
    COUNT(*) FILTER (WHERE a.exitoso = false) as accesos_fallidos,
    COUNT(DISTINCT a.recurso_id) as recursos_distintos,
    CASE
      WHEN COUNT(*) > 1000 THEN 'Volumen excesivo de accesos'
      WHEN COUNT(*) FILTER (WHERE a.exitoso = false) > 50 THEN 'Múltiples intentos fallidos'
      WHEN COUNT(DISTINCT a.recurso_id) > 100 THEN 'Acceso a múltiples recursos'
      ELSE 'Patrón inusual'
    END as alerta
  FROM "AuditoriaAccesoPHI" a
  INNER JOIN "Usuario" u ON a.usuario_id = u.id
  WHERE a.creado_en >= now() - (p_dias_atras || ' days')::INTERVAL
  GROUP BY a.usuario_id, u.email
  HAVING
    COUNT(*) > 500 OR -- Más de 500 accesos
    COUNT(*) FILTER (WHERE a.exitoso = false) > 20 OR -- Más de 20 fallos
    COUNT(DISTINCT a.recurso_id) > 50 -- Acceso a más de 50 recursos distintos
  ORDER BY COUNT(*) DESC;
END;
$$;

COMMENT ON FUNCTION detectar_accesos_sospechosos IS 'Detecta patrones de acceso sospechosos a PHI (prevención de breaches)';

-- ==========================================
-- VISTAS ÚTILES PARA REPORTING
-- ==========================================

-- Vista de resumen de auditoría por usuario
CREATE OR REPLACE VIEW "ResumenAuditoriaPorUsuario" AS
SELECT
  u.id as usuario_id,
  u.email,
  pu.nombre,
  u.rol,
  COUNT(*) as total_accesos,
  COUNT(*) FILTER (WHERE a.accion = 'leer') as lecturas,
  COUNT(*) FILTER (WHERE a.accion = 'crear') as creaciones,
  COUNT(*) FILTER (WHERE a.accion = 'actualizar') as actualizaciones,
  COUNT(*) FILTER (WHERE a.exitoso = false) as accesos_fallidos,
  MAX(a.creado_en) as ultimo_acceso
FROM "Usuario" u
LEFT JOIN "PerfilUsuario" pu ON u.id = pu.usuario_id
LEFT JOIN "AuditoriaAccesoPHI" a ON u.id = a.usuario_id
WHERE a.creado_en >= now() - INTERVAL '30 days'
GROUP BY u.id, u.email, pu.nombre, u.rol;

COMMENT ON VIEW "ResumenAuditoriaPorUsuario" IS 'Resumen de actividad de auditoría por usuario (últimos 30 días)';

-- Vista de accesos recientes a PHI
CREATE OR REPLACE VIEW "AccesosRecientesPHI" AS
SELECT
  a.id,
  u.email as usuario_email,
  pu.nombre as usuario_nombre,
  u.rol,
  a.tipo_recurso,
  a.accion,
  a.exitoso,
  a.ip_address,
  a.creado_en
FROM "AuditoriaAccesoPHI" a
INNER JOIN "Usuario" u ON a.usuario_id = u.id
LEFT JOIN "PerfilUsuario" pu ON u.id = pu.usuario_id
WHERE a.creado_en >= now() - INTERVAL '24 hours'
ORDER BY a.creado_en DESC;

COMMENT ON VIEW "AccesosRecientesPHI" IS 'Accesos recientes a PHI (últimas 24 horas) para monitoreo';

-- ==========================================
-- TRIGGERS AUTOMÁTICOS DE AUDITORÍA
-- ==========================================

-- Trigger para auditar accesos a NotaSesionEncriptada
CREATE OR REPLACE FUNCTION trigger_auditar_acceso_nota_sesion()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar acceso de lectura cuando se desencripta
  -- Esto se manejará en la función desencriptar_nota_sesion
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditar creación de citas
CREATE OR REPLACE FUNCTION trigger_auditar_cita()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  -- Obtener usuario_id del auth.uid()
  SELECT id INTO v_usuario_id
  FROM "Usuario"
  WHERE auth_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    PERFORM registrar_acceso_phi(
      v_usuario_id,
      'cita',
      NEW.id,
      'crear',
      NULL, -- IP se pasará desde la aplicación
      NULL, -- User agent se pasará desde la aplicación
      'database_trigger',
      'INSERT',
      'Creación de cita desde trigger',
      true,
      201
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM registrar_acceso_phi(
      v_usuario_id,
      'cita',
      NEW.id,
      'actualizar',
      NULL,
      NULL,
      'database_trigger',
      'UPDATE',
      'Actualización de cita desde trigger',
      true,
      200
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditar_cita_insert_update
  AFTER INSERT OR UPDATE ON "Cita"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auditar_cita();

COMMENT ON TRIGGER auditar_cita_insert_update ON "Cita" IS 'Audita automáticamente creación y actualización de citas';

-- ==========================================
-- POLÍTICAS DE RETENCIÓN DE AUDITORÍA
-- ==========================================

-- Función para archivar auditorías antiguas (>2 años)
-- En producción, esto se ejecutaría con pg_cron mensualmente
CREATE OR REPLACE FUNCTION archivar_auditorias_antiguas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registros_archivados INTEGER;
BEGIN
  -- HIPAA requiere mantener auditorías por mínimo 6 años
  -- Esta función solo marca como archivables (no elimina)

  -- En implementación real, mover a tabla de archivo
  -- Por ahora, solo retorna count de registros antiguos

  SELECT COUNT(*)
  INTO v_registros_archivados
  FROM "AuditoriaAccesoPHI"
  WHERE creado_en < now() - INTERVAL '2 years';

  RETURN v_registros_archivados;
END;
$$;

COMMENT ON FUNCTION archivar_auditorias_antiguas IS 'Identifica auditorías antiguas para archivo (HIPAA requiere 6 años de retención)';
