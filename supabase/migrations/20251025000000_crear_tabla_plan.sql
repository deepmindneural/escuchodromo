-- ==========================================
-- MIGRACIÓN: Crear tabla Plan para gestión dinámica de suscripciones
-- ==========================================
-- Fecha: 2025-10-25
-- Propósito: Migrar de planes hardcoded a tabla dinámica
-- Relacionado con: Sistema de suscripciones usuarios y profesionales
-- ==========================================

-- Crear tabla Plan
CREATE TABLE IF NOT EXISTS "Plan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,

  -- Tipo de plan (paciente o profesional)
  tipo_usuario TEXT NOT NULL DEFAULT 'paciente' CHECK (tipo_usuario IN ('paciente', 'profesional')),

  -- Precios
  precio_mensual NUMERIC(10,2) NOT NULL,
  precio_anual NUMERIC(10,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD')),

  -- Características (JSON flexible)
  caracteristicas JSONB DEFAULT '[]'::jsonb,

  -- Límites para pacientes
  limite_conversaciones INTEGER,
  limite_evaluaciones INTEGER,
  acceso_terapeutas BOOLEAN DEFAULT false,

  -- Límites para profesionales
  limite_pacientes INTEGER,
  limite_horas_sesion INTEGER,
  acceso_analytics BOOLEAN DEFAULT false,
  verificado BOOLEAN DEFAULT false,
  destacado_busqueda BOOLEAN DEFAULT false,

  -- Display y ordenamiento
  prioridad_soporte TEXT DEFAULT 'basica' CHECK (prioridad_soporte IN ('basica', 'prioritaria', 'premium')),
  esta_activo BOOLEAN DEFAULT true,
  destacado BOOLEAN DEFAULT false,
  orden_visualizacion INTEGER DEFAULT 0,

  -- Integración con Stripe
  stripe_product_id TEXT UNIQUE,
  stripe_price_mensual_id TEXT,
  stripe_price_anual_id TEXT,

  -- Timestamps
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_plan_codigo ON "Plan"(codigo);
CREATE INDEX IF NOT EXISTS idx_plan_activo ON "Plan"(esta_activo);
CREATE INDEX IF NOT EXISTS idx_plan_tipo ON "Plan"(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_plan_orden ON "Plan"(orden_visualizacion);
CREATE INDEX IF NOT EXISTS idx_plan_stripe_product ON "Plan"(stripe_product_id);

-- RLS Policies
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver planes activos
CREATE POLICY "Planes activos son públicos"
  ON "Plan" FOR SELECT
  USING (esta_activo = true);

-- Política: Solo ADMIN puede gestionar planes
CREATE POLICY "Solo admin gestiona planes"
  ON "Plan" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp_plan()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_plan
  BEFORE UPDATE ON "Plan"
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_plan();

-- Comentarios
COMMENT ON TABLE "Plan" IS 'Planes de suscripción dinámicos para pacientes y profesionales';
COMMENT ON COLUMN "Plan".tipo_usuario IS 'Tipo de usuario: paciente o profesional';
COMMENT ON COLUMN "Plan".caracteristicas IS 'Array de características del plan en formato JSON';
COMMENT ON COLUMN "Plan".limite_pacientes IS 'Solo para profesionales: máximo de pacientes activos';
