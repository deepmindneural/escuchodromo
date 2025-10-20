-- ==========================================
-- MIGRACIÓN: Agregar campos faltantes a PerfilUsuario
-- Fecha: 2025-10-20
-- Descripción: Agrega campos que se usan en el listado de profesionales
--              y otras funcionalidades del perfil de usuario
-- ==========================================

-- Agregar campos profesionales al perfil de usuario
ALTER TABLE "PerfilUsuario"
ADD COLUMN IF NOT EXISTS especialidad TEXT,
ADD COLUMN IF NOT EXISTS experiencia_anos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS foto_perfil TEXT,
ADD COLUMN IF NOT EXISTS biografia TEXT,
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS tarifa_30min FLOAT,
ADD COLUMN IF NOT EXISTS tarifa_60min FLOAT,
ADD COLUMN IF NOT EXISTS disponible BOOLEAN DEFAULT true;

-- Crear índices para campos de búsqueda
CREATE INDEX IF NOT EXISTS idx_perfil_usuario_especialidad ON "PerfilUsuario"(especialidad);
CREATE INDEX IF NOT EXISTS idx_perfil_usuario_disponible ON "PerfilUsuario"(disponible);

-- Comentarios para documentación
COMMENT ON COLUMN "PerfilUsuario".especialidad IS 'Especialidad del profesional (si aplica)';
COMMENT ON COLUMN "PerfilUsuario".experiencia_anos IS 'Años de experiencia profesional';
COMMENT ON COLUMN "PerfilUsuario".foto_perfil IS 'URL de la foto de perfil del usuario';
COMMENT ON COLUMN "PerfilUsuario".biografia IS 'Biografía o descripción del usuario/profesional';
COMMENT ON COLUMN "PerfilUsuario".direccion IS 'Dirección física del usuario (para profesionales con consultorio)';
COMMENT ON COLUMN "PerfilUsuario".tarifa_30min IS 'Tarifa por sesión de 30 minutos (para profesionales)';
COMMENT ON COLUMN "PerfilUsuario".tarifa_60min IS 'Tarifa por sesión de 60 minutos (para profesionales)';
COMMENT ON COLUMN "PerfilUsuario".disponible IS 'Indica si el profesional está disponible para nuevas citas';
