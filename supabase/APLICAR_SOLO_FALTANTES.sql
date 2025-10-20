-- ==========================================
-- APLICAR SOLO TABLAS FALTANTES
-- ==========================================
-- Este script crea SOLO las tablas que faltan
-- sin intentar recrear las que ya existen
--
-- Copia y pega en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

BEGIN;

-- Verificar que tenemos las tablas base
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Usuario') THEN
    RAISE EXCEPTION 'ERROR: Tabla Usuario no existe';
  END IF;

  RAISE NOTICE '✅ Tablas base verificadas';
END $$;

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función de trigger (si no existe)
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- CREAR TABLAS FALTANTES
-- ==========================================

-- PerfilProfesional
CREATE TABLE IF NOT EXISTS "PerfilProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE UNIQUE NOT NULL,
  titulo_profesional TEXT NOT NULL,
  numero_licencia TEXT NOT NULL UNIQUE,
  universidad TEXT,
  anos_experiencia INTEGER DEFAULT 0,
  especialidades TEXT[],
  biografia TEXT,
  idiomas TEXT[] DEFAULT ARRAY['es'],
  documentos_verificados BOOLEAN DEFAULT false,
  perfil_aprobado BOOLEAN DEFAULT false,
  aprobado_por UUID REFERENCES "Usuario"(id),
  aprobado_en TIMESTAMP,
  notas_admin TEXT,
  tarifa_por_sesion FLOAT,
  moneda TEXT DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD')),
  total_pacientes INTEGER DEFAULT 0,
  total_citas INTEGER DEFAULT 0,
  calificacion_promedio FLOAT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfil_profesional_usuario_id ON "PerfilProfesional"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfil_profesional_aprobado ON "PerfilProfesional"(perfil_aprobado);
CREATE INDEX IF NOT EXISTS idx_perfil_profesional_licencia ON "PerfilProfesional"(numero_licencia);

DROP TRIGGER IF EXISTS perfil_profesional_actualizado_en ON "PerfilProfesional";
CREATE TRIGGER perfil_profesional_actualizado_en
  BEFORE UPDATE ON "PerfilProfesional"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- DocumentoProfesional
CREATE TABLE IF NOT EXISTS "DocumentoProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_profesional_id UUID REFERENCES "PerfilProfesional"(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('licencia', 'titulo', 'cedula', 'certificado', 'otro')),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  url_archivo TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  tamano INTEGER,
  mime_type TEXT,
  verificado BOOLEAN DEFAULT false,
  verificado_por UUID REFERENCES "Usuario"(id),
  verificado_en TIMESTAMP,
  notas_verificacion TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documento_profesional_perfil_id ON "DocumentoProfesional"(perfil_profesional_id);
CREATE INDEX IF NOT EXISTS idx_documento_profesional_tipo ON "DocumentoProfesional"(tipo);
CREATE INDEX IF NOT EXISTS idx_documento_profesional_verificado ON "DocumentoProfesional"(verificado);

-- HorarioProfesional
CREATE TABLE IF NOT EXISTS "HorarioProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_profesional_id UUID REFERENCES "PerfilProfesional"(id) ON DELETE CASCADE NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_sesion INTEGER DEFAULT 60,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  UNIQUE(perfil_profesional_id, dia_semana, hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_horario_profesional_perfil_id ON "HorarioProfesional"(perfil_profesional_id);
CREATE INDEX IF NOT EXISTS idx_horario_profesional_dia ON "HorarioProfesional"(dia_semana);
CREATE INDEX IF NOT EXISTS idx_horario_profesional_activo ON "HorarioProfesional"(activo);

DROP TRIGGER IF EXISTS horario_profesional_actualizado_en ON "HorarioProfesional";
CREATE TRIGGER horario_profesional_actualizado_en
  BEFORE UPDATE ON "HorarioProfesional"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- Cita
CREATE TABLE IF NOT EXISTS "Cita" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  fecha_hora TIMESTAMP NOT NULL,
  duracion INTEGER DEFAULT 60,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'
  )),
  modalidad TEXT NOT NULL DEFAULT 'virtual' CHECK (modalidad IN ('virtual', 'presencial')),
  link_videollamada TEXT,
  motivo_consulta TEXT,
  notas_paciente TEXT,
  notas_profesional TEXT,
  cancelada_por UUID REFERENCES "Usuario"(id),
  motivo_cancelacion TEXT,
  cancelada_en TIMESTAMP,
  recordatorio_enviado BOOLEAN DEFAULT false,
  recordatorio_enviado_en TIMESTAMP,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CHECK (paciente_id != profesional_id)
);

CREATE INDEX IF NOT EXISTS idx_cita_paciente_id ON "Cita"(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cita_profesional_id ON "Cita"(profesional_id);
CREATE INDEX IF NOT EXISTS idx_cita_fecha_hora ON "Cita"(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_cita_estado ON "Cita"(estado);
CREATE INDEX IF NOT EXISTS idx_cita_fecha_estado ON "Cita"(fecha_hora, estado);

DROP TRIGGER IF EXISTS cita_actualizado_en ON "Cita";
CREATE TRIGGER cita_actualizado_en
  BEFORE UPDATE ON "Cita"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- Suscripcion (puede ya existir, usamos IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "Suscripcion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'premium', 'profesional')),
  periodo TEXT NOT NULL DEFAULT 'mensual' CHECK (periodo IN ('mensual', 'anual')),
  precio FLOAT NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD')),
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN (
    'activa', 'cancelada', 'pausada', 'vencida', 'cancelar_al_final'
  )),
  fecha_inicio TIMESTAMP DEFAULT now(),
  fecha_fin TIMESTAMP NOT NULL,
  fecha_proximo_pago TIMESTAMP,
  fecha_cancelacion TIMESTAMP,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  paypal_subscription_id TEXT,
  ultimo_pago_exitoso TIMESTAMP,
  proximo_intento_cobro TIMESTAMP,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suscripcion_usuario_id ON "Suscripcion"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripcion_estado ON "Suscripcion"(estado);
CREATE INDEX IF NOT EXISTS idx_suscripcion_plan ON "Suscripcion"(plan);
CREATE INDEX IF NOT EXISTS idx_suscripcion_fecha_fin ON "Suscripcion"(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_suscripcion_stripe ON "Suscripcion"(stripe_subscription_id);

DROP TRIGGER IF EXISTS suscripcion_actualizado_en ON "Suscripcion";
CREATE TRIGGER suscripcion_actualizado_en
  BEFORE UPDATE ON "Suscripcion"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- CalificacionProfesional
CREATE TABLE IF NOT EXISTS "CalificacionProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID REFERENCES "Cita"(id) ON DELETE CASCADE UNIQUE NOT NULL,
  paciente_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario TEXT,
  puntualidad INTEGER CHECK (puntualidad >= 1 AND puntualidad <= 5),
  profesionalismo INTEGER CHECK (profesionalismo >= 1 AND profesionalismo <= 5),
  empatia INTEGER CHECK (empatia >= 1 AND empatia <= 5),
  recomendaria BOOLEAN,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calificacion_cita_id ON "CalificacionProfesional"(cita_id);
CREATE INDEX IF NOT EXISTS idx_calificacion_profesional_id ON "CalificacionProfesional"(profesional_id);
CREATE INDEX IF NOT EXISTS idx_calificacion_puntuacion ON "CalificacionProfesional"(puntuacion);

-- Comentarios
COMMENT ON TABLE "PerfilProfesional" IS 'Información adicional y profesional para usuarios con rol TERAPEUTA';
COMMENT ON TABLE "DocumentoProfesional" IS 'Documentos de validación de los profesionales';
COMMENT ON TABLE "HorarioProfesional" IS 'Disponibilidad horaria de los profesionales';
COMMENT ON TABLE "Cita" IS 'Citas agendadas entre pacientes y profesionales';
COMMENT ON TABLE "Suscripcion" IS 'Gestión de suscripciones y planes de los usuarios';
COMMENT ON TABLE "CalificacionProfesional" IS 'Calificaciones de los profesionales';

COMMIT;

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TABLAS DE PROFESIONALES Y CITAS CREADAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ PerfilProfesional';
  RAISE NOTICE '  ✅ DocumentoProfesional';
  RAISE NOTICE '  ✅ HorarioProfesional';
  RAISE NOTICE '  ✅ Cita';
  RAISE NOTICE '  ✅ Suscripcion (verificada)';
  RAISE NOTICE '  ✅ CalificacionProfesional';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Aplicar RLS: 20250120000001_rls_profesionales_citas.sql';
  RAISE NOTICE '2. Aplicar encriptación: 20251020000000_encriptacion_phi.sql';
  RAISE NOTICE '3. Aplicar auditoría: 20251020000001_auditoria_phi.sql';
  RAISE NOTICE '4. Aplicar consentimientos: 20251020000002_consentimientos_granulares.sql';
  RAISE NOTICE '5. Aplicar Stripe: 20251020000003_stripe_idempotencia.sql';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
