-- ==========================================
-- HABILITAR RLS EN TABLAS FALTANTES
-- ==========================================
-- Este script habilita RLS en las tablas críticas
-- que aún no lo tienen activado
-- ==========================================

BEGIN;

-- Habilitar RLS en todas las tablas críticas
ALTER TABLE "Cita" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerfilProfesional" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotaSesionEncriptada" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditoriaAccesoPHI" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsentimientoDetallado" ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
DO $$
DECLARE
  v_tablas_con_rls INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tablas_con_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'Cita', 'PerfilProfesional', 'NotaSesionEncriptada',
      'AuditoriaAccesoPHI', 'ConsentimientoDetallado'
    );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS HABILITADO EN TABLAS CRÍTICAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas con RLS activo: %/5', v_tablas_con_rls;
  RAISE NOTICE '';

  IF v_tablas_con_rls = 5 THEN
    RAISE NOTICE '✅ RLS ACTIVO EN TODAS LAS TABLAS CRÍTICAS';
    RAISE NOTICE '';
    RAISE NOTICE '  ✅ Cita';
    RAISE NOTICE '  ✅ PerfilProfesional';
    RAISE NOTICE '  ✅ NotaSesionEncriptada';
    RAISE NOTICE '  ✅ AuditoriaAccesoPHI';
    RAISE NOTICE '  ✅ ConsentimientoDetallado';
  ELSE
    RAISE NOTICE '⚠️  Algunas tablas aún sin RLS';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
