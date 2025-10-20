-- ==========================================
-- MIGRACIÓN: Agregar campo apellido a tabla Usuario
-- Fecha: 2025-10-20
-- Descripción: Agrega el campo apellido a la tabla Usuario
--              Este campo es necesario para el registro de profesionales
--              y para mostrar nombres completos en el listado
-- ==========================================

-- Agregar columna apellido
ALTER TABLE "Usuario"
ADD COLUMN IF NOT EXISTS apellido TEXT;

-- Crear índice compuesto para búsquedas por nombre completo
CREATE INDEX IF NOT EXISTS idx_usuario_nombre_apellido ON "Usuario"(nombre, apellido);

-- Comentario para documentación
COMMENT ON COLUMN "Usuario".apellido IS 'Apellido del usuario. Usado principalmente para profesionales y visualización de nombres completos';
