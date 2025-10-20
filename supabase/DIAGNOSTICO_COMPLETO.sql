-- ==========================================
-- DIAGNÓSTICO COMPLETO: ¿Qué falta aplicar?
-- Copia y pega en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

-- Verificar todas las tablas importantes
SELECT
  t.table_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ Existe'
    ELSE '❌ NO EXISTE'
  END as estado
FROM (
  VALUES
    ('Usuario'),
    ('PerfilUsuario'),
    ('Evaluacion'),
    ('Resultado'),
    ('Mensaje'),
    ('Conversacion'),
    ('Cita'),
    ('PerfilProfesional'),
    ('HorarioProfesional'),
    ('Suscripcion'),
    ('NotaSesionEncriptada'),
    ('AuditoriaAccesoPHI'),
    ('ConsentimientoDetallado'),
    ('StripeEvento'),
    ('PagoCita')
) AS t(table_name)
ORDER BY
  CASE
    WHEN table_name IN ('Usuario', 'PerfilUsuario') THEN 1
    WHEN table_name IN ('Cita', 'PerfilProfesional') THEN 2
    WHEN table_name IN ('NotaSesionEncriptada', 'AuditoriaAccesoPHI') THEN 3
    ELSE 4
  END,
  t.table_name;

-- Verificar extensiones
SELECT
  extname as extension,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = e.extname)
    THEN '✅ Instalada'
    ELSE '❌ Falta'
  END as estado
FROM (
  VALUES
    ('uuid-ossp'),
    ('pgcrypto')
) AS e(extname);

-- Verificar funciones críticas
SELECT
  routine_name as funcion,
  '✅ Existe' as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_actualizado_en',
    'encriptar_nota_sesion',
    'desencriptar_nota_sesion',
    'registrar_acceso_phi',
    'verificar_consentimiento',
    'otorgar_consentimiento',
    'registrar_stripe_evento',
    'procesar_pago_cita'
  )
ORDER BY routine_name;

-- Resumen final
DO $$
DECLARE
  v_cita_exists BOOLEAN;
  v_nota_enc_exists BOOLEAN;
  v_auditoria_exists BOOLEAN;
  v_consentimiento_exists BOOLEAN;
  v_stripe_evento_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Cita') INTO v_cita_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'NotaSesionEncriptada') INTO v_nota_enc_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AuditoriaAccesoPHI') INTO v_auditoria_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ConsentimientoDetallado') INTO v_consentimiento_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'StripeEvento') INTO v_stripe_evento_exists;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETO';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Tablas Base:';
  RAISE NOTICE '   Cita: %', CASE WHEN v_cita_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Migraciones de Seguridad:';
  RAISE NOTICE '   1. Encriptación (NotaSesionEncriptada): %', CASE WHEN v_nota_enc_exists THEN '✅ Aplicada' ELSE '❌ Pendiente' END;
  RAISE NOTICE '   2. Auditoría (AuditoriaAccesoPHI): %', CASE WHEN v_auditoria_exists THEN '✅ Aplicada' ELSE '❌ Pendiente' END;
  RAISE NOTICE '   3. Consentimientos (ConsentimientoDetallado): %', CASE WHEN v_consentimiento_exists THEN '✅ Aplicada' ELSE '❌ Pendiente' END;
  RAISE NOTICE '   4. Stripe (StripeEvento): %', CASE WHEN v_stripe_evento_exists THEN '✅ Aplicada' ELSE '❌ Pendiente' END;
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'ACCIÓN REQUERIDA:';
  RAISE NOTICE '==========================================';

  IF v_cita_exists AND NOT v_nota_enc_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tabla Cita existe.';
    RAISE NOTICE '⚠️  Faltan migraciones de seguridad.';
    RAISE NOTICE '';
    RAISE NOTICE 'APLICA EN ORDEN (copia y pega cada archivo):';
    RAISE NOTICE '1. supabase/migrations/20251020000000_encriptacion_phi.sql';
    RAISE NOTICE '2. supabase/migrations/20251020000001_auditoria_phi.sql';
    RAISE NOTICE '3. supabase/migrations/20251020000002_consentimientos_granulares.sql';
    RAISE NOTICE '4. supabase/migrations/20251020000003_stripe_idempotencia.sql';
  ELSIF NOT v_cita_exists THEN
    RAISE EXCEPTION 'ERROR: Tabla Cita no existe. Algo salió mal con las migraciones anteriores.';
  ELSIF v_nota_enc_exists AND v_auditoria_exists AND v_consentimiento_exists AND v_stripe_evento_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡TODAS LAS MIGRACIONES APLICADAS CORRECTAMENTE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '1. Configurar PHI_ENCRYPTION_KEY en Supabase Secrets';
    RAISE NOTICE '2. Desplegar Edge Functions';
    RAISE NOTICE '3. Probar las interfaces frontend';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE 'Estado parcial. Aplica las migraciones faltantes en orden.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
END $$;
