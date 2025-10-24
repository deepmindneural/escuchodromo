-- ==========================================
-- MIGRACIÓN: Relacionar Suscripcion con Plan mediante foreign key
-- ==========================================
-- Fecha: 2025-10-25
-- Propósito: Establecer relación entre tabla Suscripcion (campo plan) y Plan (campo codigo)
-- ==========================================

-- Primero, actualizar suscripciones existentes que tengan planes no válidos
-- asignándoles el plan básico por defecto
UPDATE "Suscripcion"
SET plan = 'basico'
WHERE plan NOT IN (SELECT codigo FROM "Plan" WHERE tipo_usuario = 'paciente');

-- Agregar foreign key constraint
-- Nota: Usamos MATCH SIMPLE porque estamos haciendo FK desde TEXT a TEXT (codigo)
ALTER TABLE "Suscripcion"
  DROP CONSTRAINT IF EXISTS suscripcion_plan_fkey;

ALTER TABLE "Suscripcion"
  ADD CONSTRAINT suscripcion_plan_fkey
  FOREIGN KEY (plan)
  REFERENCES "Plan"(codigo)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- Crear índice para mejorar performance de los JOINs
CREATE INDEX IF NOT EXISTS idx_suscripcion_plan ON "Suscripcion"(plan);

-- Comentario explicativo
COMMENT ON CONSTRAINT suscripcion_plan_fkey ON "Suscripcion" IS
  'Relación con Plan usando codigo como foreign key. Permite hacer JOIN para obtener detalles del plan.';
