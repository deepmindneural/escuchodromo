-- ==========================================
-- VER ESTRUCTURA COMPLETA DE LA BASE DE DATOS
-- ==========================================
-- Copia y pega en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

-- 1. LISTA DE TODAS LAS TABLAS
SELECT
  tablename as tabla,
  schemaname as schema
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. ESTRUCTURA DETALLADA DE CADA TABLA (Columnas)
SELECT
  table_name as tabla,
  column_name as columna,
  data_type as tipo,
  character_maximum_length as longitud_max,
  is_nullable as permite_null,
  column_default as valor_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. CONSTRAINTS (Primary Keys, Foreign Keys, Checks)
SELECT
  tc.table_name as tabla,
  tc.constraint_name as constraint,
  tc.constraint_type as tipo,
  kcu.column_name as columna,
  ccu.table_name as tabla_referenciada,
  ccu.column_name as columna_referenciada
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 4. ÍNDICES
SELECT
  schemaname as schema,
  tablename as tabla,
  indexname as indice,
  indexdef as definicion
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. RESUMEN POR TABLA (Conteo de columnas)
SELECT
  table_name as tabla,
  COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- 6. TABLAS CON DATOS (Conteo de registros)
DO $$
DECLARE
  r RECORD;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TABLAS Y CONTEO DE REGISTROS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', r.tablename) INTO v_count;
    RAISE NOTICE '% - % registros', RPAD(r.tablename, 40), v_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- 7. BÚSQUEDA ESPECÍFICA: Tablas de Escuchodromo vs Otras
SELECT
  'Escuchodromo' as tipo,
  table_name as tabla
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'Usuario', 'PerfilUsuario', 'Evaluacion', 'Resultado',
    'Mensaje', 'Conversacion', 'Cita', 'PerfilProfesional',
    'HorarioProfesional', 'Suscripcion', 'Pago',
    'NotaSesionEncriptada', 'AuditoriaAccesoPHI',
    'ConsentimientoDetallado', 'StripeEvento', 'PagoCita'
  )
UNION ALL
SELECT
  'Otro Proyecto' as tipo,
  table_name as tabla
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name NOT IN (
    'Usuario', 'PerfilUsuario', 'Evaluacion', 'Resultado',
    'Mensaje', 'Conversacion', 'Cita', 'PerfilProfesional',
    'HorarioProfesional', 'Suscripcion', 'Pago',
    'NotaSesionEncriptada', 'AuditoriaAccesoPHI',
    'ConsentimientoDetallado', 'StripeEvento', 'PagoCita'
  )
ORDER BY tipo, tabla;

-- 8. COLUMNAS DE TABLA SUSCRIPCION (Específico)
SELECT
  column_name as columna,
  data_type as tipo,
  is_nullable as permite_null,
  column_default as default_value
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Suscripcion'
ORDER BY ordinal_position;

-- 9. COLUMNAS QUE FALTAN EN SUSCRIPCION (Diagnóstico)
DO $$
DECLARE
  v_columnas_esperadas TEXT[] := ARRAY[
    'id', 'usuario_id', 'plan', 'periodo', 'precio', 'moneda',
    'estado', 'fecha_inicio', 'fecha_fin', 'fecha_proximo_pago',
    'fecha_cancelacion', 'stripe_subscription_id', 'stripe_customer_id',
    'paypal_subscription_id', 'ultimo_pago_exitoso', 'proximo_intento_cobro',
    'creado_en', 'actualizado_en'
  ];
  v_columna TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO: COLUMNAS DE SUSCRIPCION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_columna IN ARRAY v_columnas_esperadas
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Suscripcion' AND column_name = v_columna
    ) THEN
      RAISE NOTICE '✅ % - Existe', RPAD(v_columna, 30);
    ELSE
      RAISE NOTICE '❌ % - FALTA', RPAD(v_columna, 30);
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
