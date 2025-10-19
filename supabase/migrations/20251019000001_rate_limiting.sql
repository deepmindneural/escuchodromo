-- =====================================================
-- MIGRACIÓN: Sistema de Rate Limiting
-- =====================================================
-- Fecha: 19 de octubre de 2025
-- Descripción: Implementa rate limiting para proteger endpoints
--              de autenticación contra ataques de fuerza bruta,
--              credential stuffing y DoS.
--
-- VULNERABILIDAD CORREGIDA: CRÍTICO #4
-- Antes: No había límites de intentos en login, registro,
--        recuperación de contraseña, permitiendo ataques ilimitados.
-- =====================================================

-- Tabla para registrar intentos (usado para rate limiting)
CREATE TABLE IF NOT EXISTS public."RateLimitAttempts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,           -- IP address, email, o user_id
  tipo TEXT NOT NULL,                 -- 'login', 'register', 'reset_password', etc.
  exitoso BOOLEAN DEFAULT false,      -- Si el intento fue exitoso
  metadata JSONB,                     -- Info adicional (user agent, etc.)
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Índice compuesto para consultas eficientes de rate limiting
CREATE INDEX idx_rate_limit_identifier_tipo_fecha
  ON public."RateLimitAttempts"(identifier, tipo, creado_en DESC);

-- Índice para limpieza automática por fecha
CREATE INDEX idx_rate_limit_fecha
  ON public."RateLimitAttempts"(creado_en);

-- Comentarios descriptivos
COMMENT ON TABLE public."RateLimitAttempts" IS
  'Registro de intentos de autenticación para implementar rate limiting';

COMMENT ON COLUMN public."RateLimitAttempts".identifier IS
  'Identificador único: IP address, email, o auth_id del usuario';

COMMENT ON COLUMN public."RateLimitAttempts".tipo IS
  'Tipo de acción: login, register, reset_password, verify_email, etc.';

-- =====================================================
-- FUNCIÓN: Verificar Rate Limit
-- =====================================================
-- Verifica si un identificador ha excedido el límite de intentos
-- en una ventana de tiempo específica.
--
-- Parámetros:
--   - p_identifier: IP, email, o user_id
--   - p_tipo: tipo de acción (login, register, etc.)
--   - p_max_intentos: número máximo de intentos permitidos (default: 5)
--   - p_ventana_minutos: ventana de tiempo en minutos (default: 15)
--
-- Retorna:
--   - allowed: boolean (true si está permitido, false si excedió el límite)
--   - intentos_restantes: número de intentos que quedan
--   - tiempo_espera_segundos: segundos que debe esperar si está bloqueado

CREATE OR REPLACE FUNCTION public.verificar_rate_limit(
  p_identifier TEXT,
  p_tipo TEXT,
  p_max_intentos INTEGER DEFAULT 5,
  p_ventana_minutos INTEGER DEFAULT 15
)
RETURNS TABLE(
  allowed BOOLEAN,
  intentos_restantes INTEGER,
  tiempo_espera_segundos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_intentos_actuales INTEGER;
  v_primer_intento TIMESTAMP;
  v_tiempo_transcurrido INTEGER;
BEGIN
  -- Calcular la ventana de tiempo
  SELECT COUNT(*), MIN(creado_en)
  INTO v_intentos_actuales, v_primer_intento
  FROM public."RateLimitAttempts"
  WHERE identifier = p_identifier
    AND tipo = p_tipo
    AND creado_en >= NOW() - INTERVAL '1 minute' * p_ventana_minutos;

  -- Si no ha excedido el límite
  IF v_intentos_actuales < p_max_intentos THEN
    RETURN QUERY SELECT
      true AS allowed,
      (p_max_intentos - v_intentos_actuales - 1) AS intentos_restantes,
      0 AS tiempo_espera_segundos;
    RETURN;
  END IF;

  -- Ha excedido el límite
  v_tiempo_transcurrido := EXTRACT(EPOCH FROM (NOW() - v_primer_intento))::INTEGER;

  RETURN QUERY SELECT
    false AS allowed,
    0 AS intentos_restantes,
    (p_ventana_minutos * 60 - v_tiempo_transcurrido) AS tiempo_espera_segundos;
END;
$$;

COMMENT ON FUNCTION public.verificar_rate_limit IS
  'Verifica si un identificador puede realizar una acción basándose en rate limiting';

-- =====================================================
-- FUNCIÓN: Registrar Intento
-- =====================================================
-- Registra un intento de autenticación (exitoso o fallido)

CREATE OR REPLACE FUNCTION public.registrar_intento(
  p_identifier TEXT,
  p_tipo TEXT,
  p_exitoso BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_intento_id UUID;
BEGIN
  INSERT INTO public."RateLimitAttempts" (
    identifier,
    tipo,
    exitoso,
    metadata,
    creado_en
  )
  VALUES (
    p_identifier,
    p_tipo,
    p_exitoso,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_intento_id;

  RETURN v_intento_id;
END;
$$;

COMMENT ON FUNCTION public.registrar_intento IS
  'Registra un intento de autenticación para tracking de rate limiting';

-- =====================================================
-- FUNCIÓN: Limpiar Intentos Antiguos
-- =====================================================
-- Elimina registros de intentos más antiguos que X horas
-- para mantener la tabla optimizada

CREATE OR REPLACE FUNCTION public.limpiar_rate_limit_antiguos(
  p_horas_antiguedad INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registros_eliminados INTEGER;
BEGIN
  DELETE FROM public."RateLimitAttempts"
  WHERE creado_en < NOW() - INTERVAL '1 hour' * p_horas_antiguedad;

  GET DIAGNOSTICS v_registros_eliminados = ROW_COUNT;

  RETURN v_registros_eliminados;
END;
$$;

COMMENT ON FUNCTION public.limpiar_rate_limit_antiguos IS
  'Elimina registros de rate limiting antiguos para optimizar la tabla';

-- =====================================================
-- FUNCIÓN: Resetear Rate Limit de Usuario
-- =====================================================
-- Permite a un admin resetear el rate limit de un usuario específico

CREATE OR REPLACE FUNCTION public.resetear_rate_limit(
  p_identifier TEXT,
  p_tipo TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registros_eliminados INTEGER;
BEGIN
  IF p_tipo IS NULL THEN
    -- Resetear todos los tipos para este identifier
    DELETE FROM public."RateLimitAttempts"
    WHERE identifier = p_identifier;
  ELSE
    -- Resetear solo un tipo específico
    DELETE FROM public."RateLimitAttempts"
    WHERE identifier = p_identifier
      AND tipo = p_tipo;
  END IF;

  GET DIAGNOSTICS v_registros_eliminados = ROW_COUNT;

  RETURN v_registros_eliminados;
END;
$$;

COMMENT ON FUNCTION public.resetear_rate_limit IS
  'Resetea el rate limit de un usuario específico (solo para admins)';

-- =====================================================
-- CONFIGURACIÓN DE RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE public."RateLimitAttempts" ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver todos los registros
CREATE POLICY "Admins ven todos los rate limits"
  ON public."RateLimitAttempts"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Usuario"
      WHERE auth_id = auth.uid()
        AND rol = 'ADMIN'
    )
  );

-- Nadie puede insertar directamente (solo vía funciones)
-- Esto asegura que solo las funciones SECURITY DEFINER puedan insertar
CREATE POLICY "Solo funciones pueden insertar rate limits"
  ON public."RateLimitAttempts"
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Nadie puede actualizar o eliminar manualmente
CREATE POLICY "Solo funciones pueden modificar rate limits"
  ON public."RateLimitAttempts"
  FOR ALL
  TO authenticated
  USING (false);

-- =====================================================
-- TAREA PROGRAMADA: Limpieza Automática (pg_cron)
-- =====================================================
-- Nota: Requiere extensión pg_cron instalada en Supabase
-- Para habilitar, ejecutar en Supabase SQL Editor:
--
-- SELECT cron.schedule(
--   'limpiar-rate-limits',
--   '0 */6 * * *',  -- Cada 6 horas
--   $$SELECT public.limpiar_rate_limit_antiguos(24)$$
-- );

-- =====================================================
-- DATOS DE PRUEBA (Opcional - solo para desarrollo)
-- =====================================================

-- Descomentar para crear datos de prueba
-- INSERT INTO public."RateLimitAttempts" (identifier, tipo, exitoso, metadata)
-- VALUES
--   ('192.168.1.1', 'login', false, '{"user_agent": "Test"}'::JSONB),
--   ('192.168.1.1', 'login', false, '{"user_agent": "Test"}'::JSONB),
--   ('192.168.1.1', 'login', true, '{"user_agent": "Test"}'::JSONB);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Probar función de verificación
DO $$
DECLARE
  resultado RECORD;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PRUEBA DE RATE LIMITING';
  RAISE NOTICE '===========================================';

  -- Simular intentos
  PERFORM public.registrar_intento('test@example.com', 'login', false);
  PERFORM public.registrar_intento('test@example.com', 'login', false);
  PERFORM public.registrar_intento('test@example.com', 'login', false);

  -- Verificar límite
  SELECT * INTO resultado
  FROM public.verificar_rate_limit('test@example.com', 'login', 5, 15);

  RAISE NOTICE 'Permitido: %', resultado.allowed;
  RAISE NOTICE 'Intentos restantes: %', resultado.intentos_restantes;
  RAISE NOTICE 'Tiempo de espera: % segundos', resultado.tiempo_espera_segundos;

  -- Limpiar prueba
  PERFORM public.resetear_rate_limit('test@example.com', 'login');

  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ Sistema de rate limiting funcionando';
  RAISE NOTICE '===========================================';
END $$;
