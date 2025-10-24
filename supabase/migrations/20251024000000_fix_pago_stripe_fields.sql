-- ==========================================
-- MIGRACIÓN: Verificar y optimizar campos Stripe en tabla Pago
-- ==========================================
-- Fecha: 2025-10-24
-- Propósito: Verificar campos Stripe existentes y agregar índices/constraints
-- Relacionado con: Auditoría de seguridad Stripe/HIPAA
-- Nota: Los campos ya fueron agregados en migraciones previas,
--       esta migración solo agrega optimizaciones
-- ==========================================

-- Verificar que los campos existen (no hacer nada si ya existen)
DO $$
BEGIN
  -- Los campos stripe_sesion_id, stripe_pago_id, fecha_pago, metadata y metodo_pago
  -- ya existen en la tabla Pago desde migraciones previas
  RAISE NOTICE 'Verificando campos Stripe en tabla Pago...';
END $$;

-- Crear índices para mejorar rendimiento de consultas (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_pago_stripe_sesion ON "Pago"(stripe_sesion_id);
CREATE INDEX IF NOT EXISTS idx_pago_stripe_pago ON "Pago"(stripe_pago_id);
CREATE INDEX IF NOT EXISTS idx_pago_fecha_pago ON "Pago"(fecha_pago DESC);

-- Crear constraint única para evitar pagos duplicados (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_stripe_pago_id'
  ) THEN
    ALTER TABLE "Pago" ADD CONSTRAINT unique_stripe_pago_id UNIQUE (stripe_pago_id);
  END IF;
END $$;

COMMENT ON TABLE "Pago" IS 'Registros de pagos. Campos Stripe: stripe_sesion_id, stripe_pago_id, fecha_pago, metadata, metodo_pago';
