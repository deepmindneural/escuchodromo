-- =====================================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- =====================================================
-- Ejecuta esto primero para ver qué tablas existen:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Suscripcion', 'Pago', 'Contacto');

-- Ver columnas de la tabla Pago (si existe):
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Pago';

-- =====================================================
-- PASO 2: ELIMINAR TABLAS EXISTENTES (SI ES NECESARIO)
-- =====================================================
-- ⚠️ CUIDADO: Esto eliminará todas las tablas y sus datos
-- Solo ejecuta esto si no hay datos importantes

DROP TABLE IF EXISTS "Pago" CASCADE;
DROP TABLE IF EXISTS "Suscripcion" CASCADE;
DROP TABLE IF EXISTS "Contacto" CASCADE;

-- =====================================================
-- PASO 3: RECREAR TABLAS CORRECTAMENTE
-- =====================================================

-- TABLA SUSCRIPCION
CREATE TABLE "Suscripcion" (
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
  cancelar_al_final BOOLEAN DEFAULT FALSE,
  cancelada_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA PAGO
CREATE TABLE "Pago" (
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

-- TABLA CONTACTO
CREATE TABLE "Contacto" (
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

-- =====================================================
-- PASO 4: CREAR ÍNDICES
-- =====================================================

-- Índices para Suscripcion
CREATE INDEX idx_suscripcion_usuario ON "Suscripcion"(usuario_id);
CREATE INDEX idx_suscripcion_stripe ON "Suscripcion"(stripe_suscripcion_id);
CREATE INDEX idx_suscripcion_estado ON "Suscripcion"(estado);

-- Índices para Pago
CREATE INDEX idx_pago_usuario ON "Pago"(usuario_id);
CREATE INDEX idx_pago_suscripcion ON "Pago"(suscripcion_id);
CREATE INDEX idx_pago_stripe ON "Pago"(stripe_pago_id);
CREATE INDEX idx_pago_stripe_sesion ON "Pago"(stripe_sesion_id);

-- Índices para Contacto
CREATE INDEX idx_contacto_email ON "Contacto"(email);
CREATE INDEX idx_contacto_estado ON "Contacto"(estado);
CREATE INDEX idx_contacto_creado_en ON "Contacto"(creado_en DESC);

-- =====================================================
-- PASO 5: CREAR TRIGGERS
-- =====================================================

-- Trigger para Suscripcion
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

-- Trigger para Pago
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

-- Trigger para Contacto
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

-- =====================================================
-- PASO 6: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE "Suscripcion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contacto" ENABLE ROW LEVEL SECURITY;

-- Políticas para Suscripcion
CREATE POLICY "Usuarios pueden ver sus propias suscripciones"
  ON "Suscripcion" FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM "Usuario" WHERE id = usuario_id));

CREATE POLICY "Service role puede hacer todo en Suscripcion"
  ON "Suscripcion" FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para Pago
CREATE POLICY "Usuarios pueden ver sus propios pagos"
  ON "Pago" FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM "Usuario" WHERE id = usuario_id));

CREATE POLICY "Service role puede hacer todo en Pago"
  ON "Pago" FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para Contacto
CREATE POLICY "Cualquiera puede insertar contactos"
  ON "Contacto" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role puede hacer todo en Contacto"
  ON "Contacto" FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PASO 7: VERIFICAR RESULTADO
-- =====================================================
-- Ejecuta esto al final para confirmar que todo está bien:

-- Ver tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Suscripcion', 'Pago', 'Contacto');

-- Ver columnas de Pago (debe incluir suscripcion_id)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Pago'
ORDER BY ordinal_position;

-- Ver columnas de Suscripcion
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Suscripcion'
ORDER BY ordinal_position;

-- Ver columnas de Contacto
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Contacto'
ORDER BY ordinal_position;
