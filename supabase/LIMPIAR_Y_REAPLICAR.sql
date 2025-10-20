-- ==========================================
-- LIMPIEZA COMPLETA Y REAPLICACIÓN
-- ==========================================
-- IMPORTANTE: Este script limpiará las tablas relacionadas con
-- profesionales, citas y las nuevas de seguridad, y las recreará.
--
-- ⚠️ SI TIENES DATOS IMPORTANTES EN ESTAS TABLAS, HAZ BACKUP PRIMERO
--
-- Copia y pega en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

BEGIN;

-- ==========================================
-- PASO 1: ELIMINAR ÍNDICES HUÉRFANOS (si existen)
-- ==========================================
DROP INDEX IF EXISTS idx_suscripcion_estado;
DROP INDEX IF EXISTS idx_suscripcion_usuario_id;
DROP INDEX IF EXISTS idx_suscripcion_plan;
DROP INDEX IF EXISTS idx_suscripcion_fecha_fin;
DROP INDEX IF EXISTS idx_suscripcion_stripe;
DROP INDEX IF EXISTS idx_cita_paciente_id;
DROP INDEX IF EXISTS idx_cita_profesional_id;
DROP INDEX IF EXISTS idx_cita_fecha_hora;
DROP INDEX IF EXISTS idx_cita_estado;
DROP INDEX IF EXISTS idx_cita_fecha_estado;

-- ==========================================
-- PASO 2: ELIMINAR TABLAS (si existen) EN ORDEN CORRECTO
-- ==========================================

-- Nuevas tablas de seguridad
DROP TABLE IF EXISTS "PagoCita" CASCADE;
DROP TABLE IF EXISTS "StripeEvento" CASCADE;
DROP TABLE IF EXISTS "HistorialConsentimiento" CASCADE;
DROP TABLE IF EXISTS "ConsentimientoDetallado" CASCADE;
DROP TABLE IF EXISTS "AuditoriaAccesoPHI" CASCADE;
DROP TABLE IF EXISTS "NotaSesionEncriptada" CASCADE;
DROP TABLE IF EXISTS "ClaveEncriptacion" CASCADE;

-- Tablas de profesionales y citas
DROP TABLE IF EXISTS "CalificacionProfesional" CASCADE;
DROP TABLE IF EXISTS "Suscripcion" CASCADE;
DROP TABLE IF EXISTS "Cita" CASCADE;
DROP TABLE IF EXISTS "HorarioProfesional" CASCADE;
DROP TABLE IF EXISTS "DocumentoProfesional" CASCADE;
DROP TABLE IF EXISTS "PerfilProfesional" CASCADE;

-- ==========================================
-- PASO 3: ASEGURAR EXTENSIONES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- PASO 4: FUNCIÓN DE TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PASO 5: VERIFICAR QUE Usuario EXISTE
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Usuario') THEN
    RAISE EXCEPTION 'ERROR CRÍTICO: La tabla Usuario no existe. Debes aplicar las migraciones base primero.';
  END IF;
END $$;

COMMIT;

-- ==========================================
-- MENSAJE FINAL
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LIMPIEZA COMPLETADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Abre el archivo: supabase/migrations/20250120000000_profesionales_y_citas.sql';
  RAISE NOTICE '2. Copia TODO el contenido';
  RAISE NOTICE '3. Pega en el SQL Editor';
  RAISE NOTICE '4. Click en RUN';
  RAISE NOTICE '';
  RAISE NOTICE 'Luego aplica las migraciones de seguridad en orden:';
  RAISE NOTICE '5. 20251020000000_encriptacion_phi.sql';
  RAISE NOTICE '6. 20251020000001_auditoria_phi.sql';
  RAISE NOTICE '7. 20251020000002_consentimientos_granulares.sql';
  RAISE NOTICE '8. 20251020000003_stripe_idempotencia.sql';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
