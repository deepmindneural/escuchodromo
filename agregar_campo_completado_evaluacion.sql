-- =====================================================
-- Migración: Agregar campo 'completado' a tabla Evaluacion
-- =====================================================
-- Fecha: 2025-10-23
-- Razón: El código TypeScript en /src/lib/supabase/queries/evaluaciones.ts
--        referencia el campo 'completado' pero no existe en el schema actual.
-- Impacto: Sin este campo, todas las queries de evaluaciones fallarán.
-- Cumplimiento: HIPAA/GDPR - Campo no contiene PHI, solo estado de proceso.
-- =====================================================

BEGIN;

-- 1. Agregar columna 'completado' a tabla Evaluacion
ALTER TABLE "Evaluacion"
ADD COLUMN IF NOT EXISTS completado BOOLEAN NOT NULL DEFAULT true;

-- 2. Comentario para documentación
COMMENT ON COLUMN "Evaluacion".completado IS
'Indica si la evaluación psicológica fue completada por el usuario.
- true: Evaluación finalizada, datos válidos para análisis clínico
- false: Evaluación iniciada pero no terminada, no usar en reportes
Solo evaluaciones completadas se muestran en dashboards, gráficos de evolución y reportes terapéuticos.
Cumplimiento: No contiene PHI, solo metadato de estado de proceso.';

-- 3. Actualizar todas las evaluaciones existentes como completadas
-- (Asumimos que si están en la base de datos, fueron completadas)
UPDATE "Evaluacion"
SET completado = true
WHERE completado IS NULL;

-- 4. Crear índice para mejorar rendimiento de queries con filtro completado
CREATE INDEX IF NOT EXISTS idx_evaluacion_usuario_completado
ON "Evaluacion" (usuario_id, completado, creado_en DESC)
WHERE completado = true;

COMMENT ON INDEX idx_evaluacion_usuario_completado IS
'Índice compuesto para optimizar queries de evaluaciones completadas por usuario.
Usado por: obtenerEvaluacionesPaciente(), obtenerEvolucionPHQ9(), obtenerEvolucionGAD7().
WHERE clause filtra solo completadas para reducir tamaño del índice.';

-- 5. Validar que el cambio se aplicó correctamente
DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_total_evaluaciones INTEGER;
  v_evaluaciones_completadas INTEGER;
BEGIN
  -- Verificar que la columna existe
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Evaluacion'
      AND column_name = 'completado'
  ) INTO v_column_exists;

  IF NOT v_column_exists THEN
    RAISE EXCEPTION 'ERROR: La columna completado no se creó correctamente';
  END IF;

  -- Contar evaluaciones
  SELECT COUNT(*) INTO v_total_evaluaciones FROM "Evaluacion";
  SELECT COUNT(*) INTO v_evaluaciones_completadas FROM "Evaluacion" WHERE completado = true;

  -- Log de confirmación
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '   - Columna "completado" agregada a tabla Evaluacion';
  RAISE NOTICE '   - Total evaluaciones: %', v_total_evaluaciones;
  RAISE NOTICE '   - Evaluaciones completadas: %', v_evaluaciones_completadas;
  RAISE NOTICE '   - Índice idx_evaluacion_usuario_completado creado';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (solo en caso de emergencia)
-- =====================================================
-- Si necesitas revertir esta migración:
/*
BEGIN;
DROP INDEX IF EXISTS idx_evaluacion_usuario_completado;
ALTER TABLE "Evaluacion" DROP COLUMN IF EXISTS completado;
COMMIT;
*/

-- =====================================================
-- QUERIES DE VALIDACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar estructura de columna
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Evaluacion'
  AND column_name = 'completado';

-- Verificar evaluaciones completadas
SELECT
  completado,
  COUNT(*) as total,
  MIN(creado_en)::date as primera_evaluacion,
  MAX(creado_en)::date as ultima_evaluacion
FROM "Evaluacion"
GROUP BY completado;

-- Probar query que usa el filtro completado
SELECT
  e.id,
  t.codigo,
  e.puntuacion,
  e.severidad,
  e.completado,
  e.creado_en
FROM "Evaluacion" e
JOIN "Test" t ON e.test_id = t.id
WHERE e.completado = true
ORDER BY e.creado_en DESC
LIMIT 5;
