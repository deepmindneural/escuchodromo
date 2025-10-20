-- ==========================================
-- REPARAR MIGRACIONES: Verificar y Limpiar
-- Copia y pega en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

-- PASO 1: Ver TODAS las tablas que existen actualmente
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- PASO 2: Ver TODOS los índices que existen
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%suscripcion%'
ORDER BY tablename, indexname;

-- PASO 3: Verificación específica de tablas críticas (sin errores)
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ESTADO REAL DE LAS TABLAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Usuario
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Usuario') THEN
    RAISE NOTICE '✅ Usuario existe';
  ELSE
    RAISE NOTICE '❌ Usuario NO EXISTE';
  END IF;

  -- PerfilUsuario
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PerfilUsuario') THEN
    RAISE NOTICE '✅ PerfilUsuario existe';
  ELSE
    RAISE NOTICE '❌ PerfilUsuario NO EXISTE';
  END IF;

  -- Cita (mayúsculas)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Cita') THEN
    RAISE NOTICE '✅ Cita existe (con mayúscula)';
  ELSE
    RAISE NOTICE '❌ Cita NO EXISTE (con mayúscula)';
  END IF;

  -- cita (minúsculas)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cita') THEN
    RAISE NOTICE '✅ cita existe (minúscula)';
  ELSE
    RAISE NOTICE '❌ cita NO EXISTE (minúscula)';
  END IF;

  -- Suscripcion
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Suscripcion') THEN
    RAISE NOTICE '✅ Suscripcion existe';
  ELSE
    RAISE NOTICE '❌ Suscripcion NO EXISTE';
  END IF;

  -- PerfilProfesional
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PerfilProfesional') THEN
    RAISE NOTICE '✅ PerfilProfesional existe';
  ELSE
    RAISE NOTICE '❌ PerfilProfesional NO EXISTE';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÍNDICES HUÉRFANOS (sin tabla)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Verificar índices sin tabla
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_suscripcion_estado'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'Suscripcion'
  ) THEN
    RAISE NOTICE '⚠️  Índice idx_suscripcion_estado existe pero tabla Suscripcion NO';
    RAISE NOTICE '   Esto indica que la migración falló a medias.';
    RAISE NOTICE '   Solución: Eliminar índices huérfanos y reaplicar migración';
  END IF;

  RAISE NOTICE '';
END $$;
