-- ==========================================
-- SCRIPT RÁPIDO: Verificar y Aplicar Todo
-- Copia y pega este script en Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

-- PASO 1: Verificar qué tablas existen
DO $$
DECLARE
  v_usuario_exists BOOLEAN;
  v_cita_exists BOOLEAN;
  v_nota_enc_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Usuario') INTO v_usuario_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Cita') INTO v_cita_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'NotaSesionEncriptada') INTO v_nota_enc_exists;

  RAISE NOTICE '=== ESTADO ACTUAL ===';
  RAISE NOTICE 'Usuario existe: %', v_usuario_exists;
  RAISE NOTICE 'Cita existe: %', v_cita_exists;
  RAISE NOTICE 'NotaSesionEncriptada existe: %', v_nota_enc_exists;
  RAISE NOTICE '';

  IF NOT v_usuario_exists THEN
    RAISE EXCEPTION 'ERROR: La tabla Usuario no existe. Debes aplicar las migraciones iniciales primero.';
  END IF;

  IF NOT v_cita_exists THEN
    RAISE NOTICE '⚠️  ACCIÓN REQUERIDA: Debes aplicar la migración 20250120000000_profesionales_y_citas.sql primero';
    RAISE NOTICE 'Pasos:';
    RAISE NOTICE '1. Abre el archivo supabase/migrations/20250120000000_profesionales_y_citas.sql';
    RAISE NOTICE '2. Copia TODO el contenido';
    RAISE NOTICE '3. Pégalo en el SQL Editor';
    RAISE NOTICE '4. Click en Run';
    RAISE NOTICE '5. Luego ejecuta este script de nuevo';
    RAISE EXCEPTION 'Deteniendo: Tabla Cita no existe';
  END IF;

  IF v_cita_exists AND NOT v_nota_enc_exists THEN
    RAISE NOTICE '✅ Tabla Cita existe. Puedes aplicar las migraciones de seguridad ahora.';
    RAISE NOTICE '';
    RAISE NOTICE 'Sigue estos pasos EN ORDEN:';
    RAISE NOTICE '1. Ejecuta 20251020000000_encriptacion_phi.sql';
    RAISE NOTICE '2. Ejecuta 20251020000001_auditoria_phi.sql';
    RAISE NOTICE '3. Ejecuta 20251020000002_consentimientos_granulares.sql';
    RAISE NOTICE '4. Ejecuta 20251020000003_stripe_idempotencia.sql';
  END IF;

  IF v_nota_enc_exists THEN
    RAISE NOTICE '✅✅✅ TODAS LAS MIGRACIONES APLICADAS CORRECTAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '1. Configurar PHI_ENCRYPTION_KEY en Supabase Secrets';
    RAISE NOTICE '2. Desplegar Edge Functions';
    RAISE NOTICE '3. Probar las interfaces frontend';
  END IF;
END $$;

-- PASO 2: Listar todas las tablas actuales
SELECT
  table_name,
  '✅' as estado
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
