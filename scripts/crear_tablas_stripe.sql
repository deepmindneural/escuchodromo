-- Tabla de Suscripciones
CREATE TABLE IF NOT EXISTS "Suscripcion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE,
  stripe_suscripcion_id TEXT UNIQUE,
  stripe_cliente_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'premium', 'profesional')),
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada', 'pausada', 'vencida')),
  precio DECIMAL(10, 2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP',
  periodo TEXT NOT NULL CHECK (periodo IN ('mensual', 'anual')),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMPTZ,
  fecha_renovacion TIMESTAMPTZ,
  cancelada_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS "Pago" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suscripcion_id UUID REFERENCES "Suscripcion"(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE,
  stripe_pago_id TEXT UNIQUE,
  stripe_sesion_id TEXT,
  monto DECIMAL(10, 2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP',
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'completado', 'fallido', 'reembolsado')),
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('tarjeta', 'paypal', 'transferencia')),
  descripcion TEXT,
  metadata JSONB,
  fecha_pago TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_suscripcion_usuario ON "Suscripcion"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripcion_stripe ON "Suscripcion"(stripe_suscripcion_id);
CREATE INDEX IF NOT EXISTS idx_suscripcion_estado ON "Suscripcion"(estado);
CREATE INDEX IF NOT EXISTS idx_pago_usuario ON "Pago"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pago_suscripcion ON "Pago"(suscripcion_id);
CREATE INDEX IF NOT EXISTS idx_pago_stripe ON "Pago"(stripe_pago_id);

-- Trigger para actualizar timestamp en Suscripcion
CREATE OR REPLACE FUNCTION update_suscripcion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suscripcion_timestamp
  BEFORE UPDATE ON "Suscripcion"
  FOR EACH ROW
  EXECUTE FUNCTION update_suscripcion_timestamp();

-- Trigger para actualizar timestamp en Pago
CREATE OR REPLACE FUNCTION update_pago_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pago_timestamp
  BEFORE UPDATE ON "Pago"
  FOR EACH ROW
  EXECUTE FUNCTION update_pago_timestamp();
