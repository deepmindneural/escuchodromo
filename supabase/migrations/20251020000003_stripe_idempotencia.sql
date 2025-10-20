-- ==========================================
-- MIGRACIÓN: Sistema de Idempotencia para Webhooks de Stripe
-- Fecha: 2025-10-20
-- Descripción: Previene procesamiento duplicado de eventos de Stripe
-- ==========================================

-- ==========================================
-- TABLA: StripeEvento
-- Almacena eventos procesados para idempotencia
-- ==========================================
CREATE TABLE IF NOT EXISTS "StripeEvento" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ID del evento de Stripe (único)
  stripe_event_id TEXT UNIQUE NOT NULL,

  -- Tipo de evento
  tipo_evento TEXT NOT NULL,

  -- Estado del procesamiento
  procesado BOOLEAN DEFAULT false,
  intento_numero INTEGER DEFAULT 1,

  -- Datos del evento (para debugging)
  datos_evento JSONB,

  -- Resultado del procesamiento
  exitoso BOOLEAN DEFAULT NULL,
  error_mensaje TEXT,

  -- Timestamps
  recibido_en TIMESTAMP DEFAULT now(),
  procesado_en TIMESTAMP,

  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_stripe_evento_id ON "StripeEvento"(stripe_event_id);
CREATE INDEX idx_stripe_evento_procesado ON "StripeEvento"(procesado, recibido_en);
CREATE INDEX idx_stripe_evento_tipo ON "StripeEvento"(tipo_evento, recibido_en DESC);

COMMENT ON TABLE "StripeEvento" IS 'Registro de eventos de Stripe para idempotencia';
COMMENT ON COLUMN "StripeEvento".stripe_event_id IS 'ID único del evento de Stripe';
COMMENT ON COLUMN "StripeEvento".procesado IS 'Indica si el evento fue procesado exitosamente';

-- ==========================================
-- TABLA: PagoCita
-- Pagos específicos para citas (separado de suscripciones)
-- ==========================================
CREATE TABLE IF NOT EXISTS "PagoCita" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cita asociada
  cita_id UUID REFERENCES "Cita"(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,

  -- Datos de Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_sesion_id TEXT,

  -- Monto
  monto DECIMAL(10, 2) NOT NULL,
  moneda TEXT DEFAULT 'COP',

  -- Estado del pago
  estado TEXT CHECK (estado IN (
    'pendiente',
    'procesando',
    'completado',
    'fallido',
    'reembolsado',
    'cancelado'
  )) DEFAULT 'pendiente',

  -- Fechas
  fecha_pago TIMESTAMP,
  fecha_reembolso TIMESTAMP,

  -- Metadata adicional
  metadata JSONB,

  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pago_cita_cita ON "PagoCita"(cita_id);
CREATE INDEX idx_pago_cita_usuario ON "PagoCita"(usuario_id);
CREATE INDEX idx_pago_cita_stripe ON "PagoCita"(stripe_payment_intent_id);
CREATE INDEX idx_pago_cita_estado ON "PagoCita"(estado);

COMMENT ON TABLE "PagoCita" IS 'Pagos de citas individuales con profesionales';

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_pago_cita_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pago_cita_actualizado_en
  BEFORE UPDATE ON "PagoCita"
  FOR EACH ROW
  EXECUTE FUNCTION update_pago_cita_actualizado_en();

-- ==========================================
-- RLS PARA StripeEvento
-- ==========================================

ALTER TABLE "StripeEvento" ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver eventos
CREATE POLICY "Solo admins ven eventos de Stripe"
  ON "StripeEvento"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Sistema puede insertar (via SECURITY DEFINER functions)
CREATE POLICY "Sistema inserta eventos"
  ON "StripeEvento"
  FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- RLS PARA PagoCita
-- ==========================================

ALTER TABLE "PagoCita" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus propios pagos
CREATE POLICY "Usuario ve sus pagos de citas"
  ON "PagoCita"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Profesional ve pagos de sus citas
CREATE POLICY "Profesional ve pagos de sus citas"
  ON "PagoCita"
  FOR SELECT
  USING (
    cita_id IN (
      SELECT c.id FROM "Cita" c
      INNER JOIN "Usuario" u ON c.profesional_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Admins ven todos los pagos
CREATE POLICY "Admins ven todos los pagos de citas"
  ON "PagoCita"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Sistema puede insertar/actualizar
CREATE POLICY "Sistema gestiona pagos"
  ON "PagoCita"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- FUNCIONES DE UTILIDAD
-- ==========================================

-- Función para registrar evento de Stripe (idempotencia)
CREATE OR REPLACE FUNCTION registrar_stripe_evento(
  p_stripe_event_id TEXT,
  p_tipo_evento TEXT,
  p_datos_evento JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_evento_id UUID;
  v_ya_procesado BOOLEAN;
BEGIN
  -- Verificar si el evento ya fue procesado
  SELECT id, procesado INTO v_evento_id, v_ya_procesado
  FROM "StripeEvento"
  WHERE stripe_event_id = p_stripe_event_id;

  IF v_evento_id IS NOT NULL THEN
    -- Evento ya existe, incrementar contador de intentos
    UPDATE "StripeEvento"
    SET intento_numero = intento_numero + 1
    WHERE id = v_evento_id;

    -- Si ya fue procesado exitosamente, no procesarlo de nuevo
    IF v_ya_procesado THEN
      RAISE EXCEPTION 'Evento ya procesado: %', p_stripe_event_id;
    END IF;

    RETURN v_evento_id;
  END IF;

  -- Insertar nuevo evento
  INSERT INTO "StripeEvento" (
    stripe_event_id,
    tipo_evento,
    datos_evento
  ) VALUES (
    p_stripe_event_id,
    p_tipo_evento,
    p_datos_evento
  )
  RETURNING id INTO v_evento_id;

  RETURN v_evento_id;
END;
$$;

COMMENT ON FUNCTION registrar_stripe_evento IS 'Registra evento de Stripe con idempotencia';

-- Función para marcar evento como procesado
CREATE OR REPLACE FUNCTION marcar_stripe_evento_procesado(
  p_stripe_event_id TEXT,
  p_exitoso BOOLEAN,
  p_error_mensaje TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "StripeEvento"
  SET
    procesado = true,
    procesado_en = now(),
    exitoso = p_exitoso,
    error_mensaje = p_error_mensaje
  WHERE stripe_event_id = p_stripe_event_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION marcar_stripe_evento_procesado IS 'Marca evento de Stripe como procesado';

-- Función para procesar pago de cita
CREATE OR REPLACE FUNCTION procesar_pago_cita(
  p_cita_id UUID,
  p_usuario_id UUID,
  p_stripe_payment_intent_id TEXT,
  p_stripe_sesion_id TEXT,
  p_monto DECIMAL,
  p_moneda TEXT DEFAULT 'COP',
  p_estado TEXT DEFAULT 'completado'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pago_id UUID;
BEGIN
  -- Insertar o actualizar pago
  INSERT INTO "PagoCita" (
    cita_id,
    usuario_id,
    stripe_payment_intent_id,
    stripe_sesion_id,
    monto,
    moneda,
    estado,
    fecha_pago
  ) VALUES (
    p_cita_id,
    p_usuario_id,
    p_stripe_payment_intent_id,
    p_stripe_sesion_id,
    p_monto,
    p_moneda,
    p_estado,
    CASE WHEN p_estado = 'completado' THEN now() ELSE NULL END
  )
  ON CONFLICT (stripe_payment_intent_id) DO UPDATE SET
    estado = p_estado,
    fecha_pago = CASE WHEN p_estado = 'completado' THEN now() ELSE EXCLUDED.fecha_pago END,
    actualizado_en = now()
  RETURNING id INTO v_pago_id;

  -- Actualizar estado de la cita si el pago fue exitoso
  IF p_estado = 'completado' THEN
    UPDATE "Cita"
    SET estado = 'confirmada'
    WHERE id = p_cita_id AND estado = 'pendiente';
  END IF;

  RETURN v_pago_id;
END;
$$;

COMMENT ON FUNCTION procesar_pago_cita IS 'Procesa pago de cita y actualiza estado';

-- ==========================================
-- VISTA: ResumenPagos
-- ==========================================

CREATE OR REPLACE VIEW "ResumenPagosPorUsuario" AS
SELECT
  u.id as usuario_id,
  u.email,
  COUNT(pc.id) as total_pagos_citas,
  COALESCE(SUM(pc.monto) FILTER (WHERE pc.estado = 'completado'), 0) as total_pagado_citas,
  COUNT(pc.id) FILTER (WHERE pc.estado = 'completado') as pagos_completados,
  COUNT(pc.id) FILTER (WHERE pc.estado = 'fallido') as pagos_fallidos,
  COUNT(pc.id) FILTER (WHERE pc.estado = 'reembolsado') as pagos_reembolsados
FROM "Usuario" u
LEFT JOIN "PagoCita" pc ON u.id = pc.usuario_id
GROUP BY u.id, u.email;

COMMENT ON VIEW "ResumenPagosPorUsuario" IS 'Resumen de pagos por usuario';
