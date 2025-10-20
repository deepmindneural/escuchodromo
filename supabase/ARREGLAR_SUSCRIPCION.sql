-- ==========================================
-- ARREGLAR TABLA SUSCRIPCION
-- ==========================================
-- La tabla Suscripcion existe pero le faltan columnas
-- Este script las agrega sin perder datos
-- ==========================================

BEGIN;

-- Ver estructura actual
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Suscripcion'
ORDER BY ordinal_position;

-- Agregar columnas faltantes (si no existen)
ALTER TABLE "Suscripcion"
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS ultimo_pago_exitoso TIMESTAMP,
  ADD COLUMN IF NOT EXISTS proximo_intento_cobro TIMESTAMP;

-- Agregar columna fecha_proximo_pago si no existe (puede tener nombre diferente)
ALTER TABLE "Suscripcion"
  ADD COLUMN IF NOT EXISTS fecha_proximo_pago TIMESTAMP;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_suscripcion_stripe_subscription ON "Suscripcion"(stripe_subscription_id);

-- Verificar resultado
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'Suscripcion'
ORDER BY ordinal_position;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TABLA SUSCRIPCION ACTUALIZADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Columnas agregadas:';
  RAISE NOTICE '  - stripe_subscription_id';
  RAISE NOTICE '  - stripe_customer_id';
  RAISE NOTICE '  - paypal_subscription_id';
  RAISE NOTICE '  - ultimo_pago_exitoso';
  RAISE NOTICE '  - proximo_intento_cobro';
  RAISE NOTICE '  - fecha_proximo_pago';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora puedes aplicar el script APLICAR_SOLO_FALTANTES.sql de nuevo';
  RAISE NOTICE '========================================';
END $$;
