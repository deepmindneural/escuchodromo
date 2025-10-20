-- ==========================================
-- MIGRACIÓN: RATE LIMITING PARA REGISTRO DE PROFESIONALES
-- Fecha: 2025-10-20
-- Descripción: Tabla y función para prevenir abuso en registro de profesionales
-- ==========================================

-- ==========================================
-- TABLA: RateLimitRegistro
-- Para rastrear intentos de registro por IP
-- ==========================================
CREATE TABLE IF NOT EXISTS "RateLimitRegistro" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  tipo_accion TEXT NOT NULL, -- 'registro_profesional', 'registro_usuario', etc.
  email_intento TEXT, -- Email que intentó registrar (para análisis)
  exitoso BOOLEAN DEFAULT false,
  user_agent TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_rate_limit_registro_ip ON "RateLimitRegistro"(ip_address);
CREATE INDEX idx_rate_limit_registro_tipo ON "RateLimitRegistro"(tipo_accion);
CREATE INDEX idx_rate_limit_registro_fecha ON "RateLimitRegistro"(creado_en DESC);
CREATE INDEX idx_rate_limit_registro_ip_tipo_fecha ON "RateLimitRegistro"(ip_address, tipo_accion, creado_en DESC);

-- ==========================================
-- FUNCIÓN: Verificar Rate Limit de Registro
-- ==========================================
CREATE OR REPLACE FUNCTION verificar_rate_limit_registro(
  p_ip_address TEXT,
  p_tipo_accion TEXT,
  p_max_intentos INTEGER DEFAULT 3,
  p_ventana_horas INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_intentos INTEGER;
  v_fecha_limite TIMESTAMP;
BEGIN
  -- Calcular fecha límite
  v_fecha_limite := now() - (p_ventana_horas || ' hours')::INTERVAL;

  -- Contar intentos en la ventana de tiempo
  SELECT COUNT(*)
  INTO v_intentos
  FROM "RateLimitRegistro"
  WHERE ip_address = p_ip_address
    AND tipo_accion = p_tipo_accion
    AND creado_en > v_fecha_limite;

  -- Retornar true si está bajo el límite, false si lo excedió
  RETURN v_intentos < p_max_intentos;
END;
$$;

-- ==========================================
-- FUNCIÓN: Registrar Intento de Registro
-- ==========================================
CREATE OR REPLACE FUNCTION registrar_intento_registro(
  p_ip_address TEXT,
  p_tipo_accion TEXT,
  p_email_intento TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_exitoso BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registro_id UUID;
BEGIN
  INSERT INTO "RateLimitRegistro" (
    ip_address,
    tipo_accion,
    email_intento,
    exitoso,
    user_agent
  )
  VALUES (
    p_ip_address,
    p_tipo_accion,
    p_email_intento,
    p_exitoso,
    p_user_agent
  )
  RETURNING id INTO v_registro_id;

  RETURN v_registro_id;
END;
$$;

-- ==========================================
-- FUNCIÓN DE LIMPIEZA AUTOMÁTICA
-- Eliminar registros antiguos (>30 días)
-- ==========================================
CREATE OR REPLACE FUNCTION limpiar_rate_limit_antiguo()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_eliminados INTEGER;
BEGIN
  DELETE FROM "RateLimitRegistro"
  WHERE creado_en < now() - INTERVAL '30 days';

  GET DIAGNOSTICS v_eliminados = ROW_COUNT;

  RETURN v_eliminados;
END;
$$;

-- ==========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==========================================
COMMENT ON TABLE "RateLimitRegistro" IS 'Registro de intentos de registro para prevenir abuso y ataques automatizados';
COMMENT ON FUNCTION verificar_rate_limit_registro IS 'Verifica si una IP ha excedido el límite de intentos de registro en un período de tiempo';
COMMENT ON FUNCTION registrar_intento_registro IS 'Registra un intento de registro (exitoso o fallido) para auditoría y rate limiting';
COMMENT ON FUNCTION limpiar_rate_limit_antiguo IS 'Limpia registros antiguos (>30 días) para mantener la tabla eficiente';
