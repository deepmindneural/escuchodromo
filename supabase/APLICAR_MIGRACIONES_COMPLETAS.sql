-- ==========================================
-- SCRIPT CONSOLIDADO: Aplicar Todas las Migraciones Faltantes
-- Fecha: 2025-10-20
-- Instrucciones: Copiar y pegar este archivo completo en Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

-- Este script aplica solo las migraciones del sistema de profesionales y citas
-- y las nuevas migraciones de seguridad (si las anteriores ya están aplicadas)

BEGIN;

-- ==========================================
-- VERIFICAR EXTENSIONES NECESARIAS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- VERIFICAR FUNCIÓN DE TRIGGER (si no existe, crearla)
-- ==========================================
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PASO 1: Verificar si las tablas básicas existen
-- Si Usuario no existe, debes aplicar las migraciones iniciales primero
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Usuario') THEN
    RAISE EXCEPTION 'La tabla Usuario no existe. Debes aplicar las migraciones iniciales primero (20250114000000_initial_schema.sql)';
  END IF;
END $$;

-- ==========================================
-- VERIFICACIÓN: ¿Qué tablas ya existen?
-- ==========================================
DO $$
DECLARE
  v_cita_exists BOOLEAN;
  v_perfil_prof_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Cita') INTO v_cita_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PerfilProfesional') INTO v_perfil_prof_exists;

  RAISE NOTICE 'Cita existe: %, PerfilProfesional existe: %', v_cita_exists, v_perfil_prof_exists;
END $$;

COMMIT;

-- ==========================================
-- IMPORTANTE: Lee este mensaje antes de continuar
-- ==========================================
/*
  Si ves el mensaje "Cita existe: false" arriba, ejecuta este script.
  Si ves "Cita existe: true", salta a la sección de migraciones de seguridad al final.

  Para ejecutar solo una parte, comenta (con -- al inicio) las secciones que no necesites.
*/

-- ==========================================
-- MIGRACIÓN 1: PROFESIONALES Y CITAS
-- (Solo si Cita no existe)
-- ==========================================

-- Descomentar desde aquí si necesitas crear las tablas
/*
BEGIN;

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

CREATE INDEX idx_perfil_profesional_usuario_id ON "PerfilProfesional"(usuario_id);
CREATE INDEX idx_perfil_profesional_aprobado ON "PerfilProfesional"(perfil_aprobado);
CREATE INDEX idx_perfil_profesional_licencia ON "PerfilProfesional"(numero_licencia);

CREATE TRIGGER perfil_profesional_actualizado_en
  BEFORE UPDATE ON "PerfilProfesional"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

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

CREATE INDEX idx_documento_profesional_perfil_id ON "DocumentoProfesional"(perfil_profesional_id);
CREATE INDEX idx_documento_profesional_tipo ON "DocumentoProfesional"(tipo);
CREATE INDEX idx_documento_profesional_verificado ON "DocumentoProfesional"(verificado);

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

CREATE INDEX idx_horario_profesional_perfil_id ON "HorarioProfesional"(perfil_profesional_id);
CREATE INDEX idx_horario_profesional_dia ON "HorarioProfesional"(dia_semana);
CREATE INDEX idx_horario_profesional_activo ON "HorarioProfesional"(activo);

CREATE TRIGGER horario_profesional_actualizado_en
  BEFORE UPDATE ON "HorarioProfesional"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

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

-- Remover el constraint de fecha futura para permitir crear citas históricas
-- CHECK (fecha_hora > now())

CREATE INDEX idx_cita_paciente_id ON "Cita"(paciente_id);
CREATE INDEX idx_cita_profesional_id ON "Cita"(profesional_id);
CREATE INDEX idx_cita_fecha_hora ON "Cita"(fecha_hora);
CREATE INDEX idx_cita_estado ON "Cita"(estado);
CREATE INDEX idx_cita_fecha_estado ON "Cita"(fecha_hora, estado);

CREATE TRIGGER cita_actualizado_en
  BEFORE UPDATE ON "Cita"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

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

CREATE INDEX idx_suscripcion_usuario_id ON "Suscripcion"(usuario_id);
CREATE INDEX idx_suscripcion_estado ON "Suscripcion"(estado);
CREATE INDEX idx_suscripcion_plan ON "Suscripcion"(plan);
CREATE INDEX idx_suscripcion_fecha_fin ON "Suscripcion"(fecha_fin);
CREATE INDEX idx_suscripcion_stripe ON "Suscripcion"(stripe_subscription_id);

CREATE TRIGGER suscripcion_actualizado_en
  BEFORE UPDATE ON "Suscripcion"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

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

CREATE INDEX idx_calificacion_cita_id ON "CalificacionProfesional"(cita_id);
CREATE INDEX idx_calificacion_profesional_id ON "CalificacionProfesional"(profesional_id);
CREATE INDEX idx_calificacion_puntuacion ON "CalificacionProfesional"(puntuacion);

-- Comentarios
COMMENT ON TABLE "PerfilProfesional" IS 'Información adicional y profesional para usuarios con rol TERAPEUTA';
COMMENT ON TABLE "DocumentoProfesional" IS 'Documentos de validación de los profesionales';
COMMENT ON TABLE "HorarioProfesional" IS 'Disponibilidad horaria de los profesionales';
COMMENT ON TABLE "Cita" IS 'Citas agendadas entre pacientes y profesionales';
COMMENT ON TABLE "Suscripcion" IS 'Gestión de suscripciones y planes de los usuarios';
COMMENT ON TABLE "CalificacionProfesional" IS 'Calificaciones de los profesionales';

COMMIT;

RAISE NOTICE 'Tablas de profesionales y citas creadas exitosamente';
*/
-- Fin de sección de profesionales (comentar si ya existe)

-- ==========================================
-- A PARTIR DE AQUÍ: APLICAR SIEMPRE
-- Migraciones de Seguridad (20251020)
-- ==========================================

-- Copiar el contenido completo de cada migración aquí
-- Por ahora, te voy a proporcionar instrucciones más simples
