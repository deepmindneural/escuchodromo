-- ==========================================
-- SCRIPT CONSOLIDADO: FUNCIONES DE SEGURIDAD
-- ==========================================
-- Este script crea TODAS las funciones de seguridad necesarias
-- Usa CREATE OR REPLACE para evitar errores de "already exists"
-- ==========================================

BEGIN;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. FUNCIONES DE ENCRIPTACIÓN
-- ==========================================

-- Función para encriptar notas de sesión
CREATE OR REPLACE FUNCTION encriptar_nota_sesion(
  p_cita_id UUID,
  p_notas_profesional TEXT,
  p_motivo_consulta TEXT,
  p_clave TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Insertar o actualizar nota encriptada
  INSERT INTO "NotaSesionEncriptada" (
    cita_id,
    notas_profesional_enc,
    motivo_consulta_enc,
    notas_hash,
    algoritmo,
    clave_version,
    actualizado_en
  ) VALUES (
    p_cita_id,
    pgp_sym_encrypt(p_notas_profesional, p_clave),
    pgp_sym_encrypt(p_motivo_consulta, p_clave),
    encode(digest(p_notas_profesional || p_motivo_consulta, 'sha256'), 'hex'),
    'aes-256-cbc',
    1,
    now()
  )
  ON CONFLICT (cita_id) DO UPDATE SET
    notas_profesional_enc = pgp_sym_encrypt(p_notas_profesional, p_clave),
    motivo_consulta_enc = pgp_sym_encrypt(p_motivo_consulta, p_clave),
    notas_hash = encode(digest(p_notas_profesional || p_motivo_consulta, 'sha256'), 'hex'),
    actualizado_en = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para desencriptar notas de sesión
CREATE OR REPLACE FUNCTION desencriptar_nota_sesion(
  p_cita_id UUID,
  p_clave TEXT
)
RETURNS TABLE(
  notas_profesional TEXT,
  motivo_consulta TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pgp_sym_decrypt(notas_profesional_enc, p_clave)::TEXT,
    pgp_sym_decrypt(motivo_consulta_enc, p_clave)::TEXT
  FROM "NotaSesionEncriptada"
  WHERE cita_id = p_cita_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. FUNCIONES DE AUDITORÍA
-- ==========================================

-- Función para registrar acceso a PHI
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
  p_codigo_http INTEGER DEFAULT NULL,
  p_error_mensaje TEXT DEFAULT NULL,
  p_datos_accedidos JSONB DEFAULT NULL,
  p_duracion_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
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
    duracion_ms,
    creado_en
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
    p_duracion_ms,
    now()
  ) RETURNING id INTO v_auditoria_id;

  RETURN v_auditoria_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para detectar accesos sospechosos
CREATE OR REPLACE FUNCTION detectar_accesos_sospechosos(
  p_horas_atras INTEGER DEFAULT 24
)
RETURNS TABLE(
  usuario_id UUID,
  total_accesos BIGINT,
  accesos_fallidos BIGINT,
  recursos_distintos BIGINT,
  ips_distintas BIGINT,
  nivel_sospecha TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH accesos_recientes AS (
    SELECT
      a.usuario_id,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE NOT a.exitoso) as fallidos,
      COUNT(DISTINCT a.recurso_id) as recursos,
      COUNT(DISTINCT a.ip_address) as ips
    FROM "AuditoriaAccesoPHI" a
    WHERE a.creado_en >= now() - (p_horas_atras || ' hours')::INTERVAL
    GROUP BY a.usuario_id
  )
  SELECT
    ar.usuario_id,
    ar.total,
    ar.fallidos,
    ar.recursos,
    ar.ips,
    CASE
      WHEN ar.fallidos > 10 OR ar.ips > 5 OR ar.total > 100 THEN 'ALTO'
      WHEN ar.fallidos > 5 OR ar.ips > 3 OR ar.total > 50 THEN 'MEDIO'
      ELSE 'BAJO'
    END as nivel_sospecha
  FROM accesos_recientes ar
  WHERE ar.fallidos > 3 OR ar.ips > 2 OR ar.total > 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. FUNCIONES DE CONSENTIMIENTO
-- ==========================================

-- Verificar si el usuario ha dado consentimiento
CREATE OR REPLACE FUNCTION verificar_consentimiento(
  p_usuario_id UUID,
  p_tipo TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_consentimiento_activo BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM "ConsentimientoDetallado"
    WHERE usuario_id = p_usuario_id
      AND tipo = p_tipo
      AND otorgado = true
      AND revocado_en IS NULL
      AND (expira_en IS NULL OR expira_en > now())
  ) INTO v_consentimiento_activo;

  RETURN COALESCE(v_consentimiento_activo, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar consentimiento
CREATE OR REPLACE FUNCTION otorgar_consentimiento(
  p_usuario_id UUID,
  p_tipo TEXT,
  p_version_texto INTEGER,
  p_texto_consentimiento TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metodo_otorgamiento TEXT DEFAULT 'web',
  p_expira_en TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_consentimiento_id UUID;
BEGIN
  -- Revocar consentimientos anteriores del mismo tipo
  UPDATE "ConsentimientoDetallado"
  SET revocado_en = now()
  WHERE usuario_id = p_usuario_id
    AND tipo = p_tipo
    AND otorgado = true
    AND revocado_en IS NULL;

  -- Insertar nuevo consentimiento
  INSERT INTO "ConsentimientoDetallado" (
    usuario_id,
    tipo,
    otorgado,
    version_texto,
    texto_consentimiento,
    ip_address,
    user_agent,
    metodo_otorgamiento,
    otorgado_en,
    expira_en
  ) VALUES (
    p_usuario_id,
    p_tipo,
    true,
    p_version_texto,
    p_texto_consentimiento,
    p_ip_address,
    p_user_agent,
    p_metodo_otorgamiento,
    now(),
    p_expira_en
  ) RETURNING id INTO v_consentimiento_id;

  RETURN v_consentimiento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revocar consentimiento
CREATE OR REPLACE FUNCTION revocar_consentimiento(
  p_usuario_id UUID,
  p_tipo TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_rows_afectadas INTEGER;
BEGIN
  UPDATE "ConsentimientoDetallado"
  SET revocado_en = now()
  WHERE usuario_id = p_usuario_id
    AND tipo = p_tipo
    AND otorgado = true
    AND revocado_en IS NULL;

  GET DIAGNOSTICS v_rows_afectadas = ROW_COUNT;

  RETURN v_rows_afectadas > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Consentimientos próximos a vencer
CREATE OR REPLACE FUNCTION consentimientos_proximos_vencer(
  p_dias INTEGER DEFAULT 30
)
RETURNS TABLE(
  usuario_id UUID,
  email TEXT,
  tipo TEXT,
  expira_en TIMESTAMP WITH TIME ZONE,
  dias_restantes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.usuario_id,
    u.email,
    c.tipo,
    c.expira_en,
    EXTRACT(DAY FROM c.expira_en - now())::INTEGER as dias_restantes
  FROM "ConsentimientoDetallado" c
  JOIN "Usuario" u ON u.id = c.usuario_id
  WHERE c.otorgado = true
    AND c.revocado_en IS NULL
    AND c.expira_en IS NOT NULL
    AND c.expira_en <= now() + (p_dias || ' days')::INTERVAL
    AND c.expira_en > now()
  ORDER BY c.expira_en ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. FUNCIONES DE STRIPE IDEMPOTENCIA
-- ==========================================

-- Registrar evento de Stripe (prevenir duplicados)
CREATE OR REPLACE FUNCTION registrar_stripe_evento(
  p_stripe_event_id TEXT,
  p_tipo_evento TEXT,
  p_datos_evento JSONB
)
RETURNS TABLE(
  es_duplicado BOOLEAN,
  evento_id UUID
) AS $$
DECLARE
  v_evento_existente UUID;
  v_nuevo_evento_id UUID;
BEGIN
  -- Verificar si ya existe
  SELECT id INTO v_evento_existente
  FROM "StripeEvento"
  WHERE stripe_event_id = p_stripe_event_id;

  IF v_evento_existente IS NOT NULL THEN
    -- Es duplicado
    RETURN QUERY SELECT true, v_evento_existente;
  ELSE
    -- Insertar nuevo evento
    INSERT INTO "StripeEvento" (
      stripe_event_id,
      tipo_evento,
      procesado,
      intento_numero,
      datos_evento,
      recibido_en
    ) VALUES (
      p_stripe_event_id,
      p_tipo_evento,
      false,
      1,
      p_datos_evento,
      now()
    ) RETURNING id INTO v_nuevo_evento_id;

    RETURN QUERY SELECT false, v_nuevo_evento_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procesar pago de cita
CREATE OR REPLACE FUNCTION procesar_pago_cita(
  p_cita_id UUID,
  p_usuario_id UUID,
  p_stripe_payment_intent_id TEXT,
  p_monto NUMERIC,
  p_moneda TEXT DEFAULT 'COP',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_pago_id UUID;
BEGIN
  INSERT INTO "PagoCita" (
    cita_id,
    usuario_id,
    stripe_payment_intent_id,
    monto,
    moneda,
    estado,
    fecha_pago,
    metadata
  ) VALUES (
    p_cita_id,
    p_usuario_id,
    p_stripe_payment_intent_id,
    p_monto,
    p_moneda,
    'completado',
    now(),
    p_metadata
  )
  ON CONFLICT (stripe_payment_intent_id) DO UPDATE SET
    estado = 'completado',
    fecha_pago = now()
  RETURNING id INTO v_pago_id;

  -- Actualizar estado de la cita
  UPDATE "Cita"
  SET estado = 'confirmada'
  WHERE id = p_cita_id AND estado = 'pendiente';

  RETURN v_pago_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ==========================================
-- MENSAJE DE CONFIRMACIÓN
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FUNCIONES DE SEGURIDAD CREADAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones de encriptación:';
  RAISE NOTICE '  ✅ encriptar_nota_sesion()';
  RAISE NOTICE '  ✅ desencriptar_nota_sesion()';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones de auditoría:';
  RAISE NOTICE '  ✅ registrar_acceso_phi()';
  RAISE NOTICE '  ✅ detectar_accesos_sospechosos()';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones de consentimiento:';
  RAISE NOTICE '  ✅ verificar_consentimiento()';
  RAISE NOTICE '  ✅ otorgar_consentimiento()';
  RAISE NOTICE '  ✅ revocar_consentimiento()';
  RAISE NOTICE '  ✅ consentimientos_proximos_vencer()';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones de Stripe:';
  RAISE NOTICE '  ✅ registrar_stripe_evento()';
  RAISE NOTICE '  ✅ procesar_pago_cita()';
  RAISE NOTICE '';
  RAISE NOTICE 'Total: 10 funciones creadas';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
