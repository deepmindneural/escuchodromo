-- Crear tabla de Contacto para formulario
CREATE TABLE IF NOT EXISTS "Contacto" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('consulta', 'soporte', 'sugerencia', 'bienestar')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_contacto_email ON "Contacto"(email);
CREATE INDEX IF NOT EXISTS idx_contacto_estado ON "Contacto"(estado);
CREATE INDEX IF NOT EXISTS idx_contacto_creado_en ON "Contacto"(creado_en DESC);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_contacto_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contacto_timestamp
  BEFORE UPDATE ON "Contacto"
  FOR EACH ROW
  EXECUTE FUNCTION update_contacto_timestamp();
