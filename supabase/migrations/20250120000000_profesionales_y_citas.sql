-- ==========================================
-- MIGRACIÓN: SISTEMA DE PROFESIONALES Y CITAS
-- Fecha: 2025-01-20
-- Descripción: Agrega tablas para profesionales, sus documentos, citas y suscripciones
-- ==========================================

-- Habilitar extensión para tipos UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLA: PerfilProfesional
-- Para almacenar información adicional de psicólogos y profesionales
-- ==========================================
CREATE TABLE IF NOT EXISTS "PerfilProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Información profesional
  titulo_profesional TEXT NOT NULL, -- Ej: "Psicólogo", "Psiquiatra", "Terapeuta"
  numero_licencia TEXT NOT NULL UNIQUE, -- Número de licencia profesional
  universidad TEXT, -- Universidad donde estudió
  anos_experiencia INTEGER DEFAULT 0,
  especialidades TEXT[], -- Array de especialidades
  biografia TEXT,

  -- Idiomas que habla
  idiomas TEXT[] DEFAULT ARRAY['es'],

  -- Verificación y aprobación
  documentos_verificados BOOLEAN DEFAULT false,
  perfil_aprobado BOOLEAN DEFAULT false,
  aprobado_por UUID REFERENCES "Usuario"(id), -- Admin que aprobó
  aprobado_en TIMESTAMP,
  notas_admin TEXT, -- Notas internas del admin

  -- Tarifa
  tarifa_por_sesion FLOAT, -- En COP o USD
  moneda TEXT DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD')),

  -- Estadísticas
  total_pacientes INTEGER DEFAULT 0,
  total_citas INTEGER DEFAULT 0,
  calificacion_promedio FLOAT DEFAULT 0,

  -- Metadata
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

-- ==========================================
-- TABLA: DocumentoProfesional
-- Para almacenar los documentos de validación de profesionales
-- ==========================================
CREATE TABLE IF NOT EXISTS "DocumentoProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_profesional_id UUID REFERENCES "PerfilProfesional"(id) ON DELETE CASCADE NOT NULL,

  -- Información del documento
  tipo TEXT NOT NULL CHECK (tipo IN ('licencia', 'titulo', 'cedula', 'certificado', 'otro')),
  nombre TEXT NOT NULL,
  descripcion TEXT,

  -- Archivo en Supabase Storage
  url_archivo TEXT NOT NULL, -- URL del archivo en storage
  nombre_archivo TEXT NOT NULL,
  tamano INTEGER, -- Tamaño en bytes
  mime_type TEXT, -- Tipo MIME del archivo

  -- Verificación
  verificado BOOLEAN DEFAULT false,
  verificado_por UUID REFERENCES "Usuario"(id), -- Admin que verificó
  verificado_en TIMESTAMP,
  notas_verificacion TEXT,

  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_documento_profesional_perfil_id ON "DocumentoProfesional"(perfil_profesional_id);
CREATE INDEX idx_documento_profesional_tipo ON "DocumentoProfesional"(tipo);
CREATE INDEX idx_documento_profesional_verificado ON "DocumentoProfesional"(verificado);

-- ==========================================
-- TABLA: HorarioProfesional
-- Para definir la disponibilidad de los profesionales
-- ==========================================
CREATE TABLE IF NOT EXISTS "HorarioProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_profesional_id UUID REFERENCES "PerfilProfesional"(id) ON DELETE CASCADE NOT NULL,

  -- Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),

  -- Horarios
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,

  -- Duración de las sesiones en minutos
  duracion_sesion INTEGER DEFAULT 60,

  -- Estado
  activo BOOLEAN DEFAULT true,

  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),

  -- Constraint para evitar duplicados
  UNIQUE(perfil_profesional_id, dia_semana, hora_inicio)
);

CREATE INDEX idx_horario_profesional_perfil_id ON "HorarioProfesional"(perfil_profesional_id);
CREATE INDEX idx_horario_profesional_dia ON "HorarioProfesional"(dia_semana);
CREATE INDEX idx_horario_profesional_activo ON "HorarioProfesional"(activo);

CREATE TRIGGER horario_profesional_actualizado_en
  BEFORE UPDATE ON "HorarioProfesional"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- TABLA: Cita
-- Para gestionar las citas entre pacientes y profesionales
-- ==========================================
CREATE TABLE IF NOT EXISTS "Cita" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  paciente_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,

  -- Fecha y hora
  fecha_hora TIMESTAMP NOT NULL,
  duracion INTEGER DEFAULT 60, -- Duración en minutos

  -- Estado de la cita
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente',      -- Creada, esperando confirmación
    'confirmada',     -- Confirmada por el profesional
    'completada',     -- Sesión completada
    'cancelada',      -- Cancelada por cualquiera de las partes
    'no_asistio'      -- El paciente no asistió
  )),

  -- Modalidad
  modalidad TEXT NOT NULL DEFAULT 'virtual' CHECK (modalidad IN ('virtual', 'presencial')),

  -- Link de videollamada (para citas virtuales)
  link_videollamada TEXT,

  -- Motivo/Notas
  motivo_consulta TEXT,
  notas_paciente TEXT,
  notas_profesional TEXT, -- Notas privadas del profesional

  -- Cancelación
  cancelada_por UUID REFERENCES "Usuario"(id),
  motivo_cancelacion TEXT,
  cancelada_en TIMESTAMP,

  -- Recordatorios
  recordatorio_enviado BOOLEAN DEFAULT false,
  recordatorio_enviado_en TIMESTAMP,

  -- Metadata
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),

  -- Constraints
  CHECK (fecha_hora > now()), -- No permitir citas en el pasado al crearlas
  CHECK (paciente_id != profesional_id) -- Paciente y profesional deben ser diferentes
);

CREATE INDEX idx_cita_paciente_id ON "Cita"(paciente_id);
CREATE INDEX idx_cita_profesional_id ON "Cita"(profesional_id);
CREATE INDEX idx_cita_fecha_hora ON "Cita"(fecha_hora);
CREATE INDEX idx_cita_estado ON "Cita"(estado);
CREATE INDEX idx_cita_fecha_estado ON "Cita"(fecha_hora, estado);

CREATE TRIGGER cita_actualizado_en
  BEFORE UPDATE ON "Cita"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- TABLA: Suscripcion
-- Para gestionar las suscripciones de los usuarios
-- ==========================================
CREATE TABLE IF NOT EXISTS "Suscripcion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Plan
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'premium', 'profesional')),
  periodo TEXT NOT NULL DEFAULT 'mensual' CHECK (periodo IN ('mensual', 'anual')),

  -- Precio
  precio FLOAT NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD')),

  -- Estado
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN (
    'activa',           -- Suscripción activa
    'cancelada',        -- Cancelada, pero aún vigente hasta fin de período
    'pausada',          -- Pausada temporalmente
    'vencida',          -- Venció y no se renovó
    'cancelar_al_final' -- Se cancelará al final del período
  )),

  -- Fechas
  fecha_inicio TIMESTAMP DEFAULT now(),
  fecha_fin TIMESTAMP NOT NULL,
  fecha_proximo_pago TIMESTAMP,
  fecha_cancelacion TIMESTAMP,

  -- Stripe/PayPal
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  paypal_subscription_id TEXT,

  -- Historial de pagos
  ultimo_pago_exitoso TIMESTAMP,
  proximo_intento_cobro TIMESTAMP,

  -- Metadata
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

-- ==========================================
-- TABLA: CalificacionProfesional
-- Para que los pacientes califiquen a los profesionales
-- ==========================================
CREATE TABLE IF NOT EXISTS "CalificacionProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID REFERENCES "Cita"(id) ON DELETE CASCADE UNIQUE NOT NULL,
  paciente_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,

  -- Calificación
  puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario TEXT,

  -- Aspectos específicos (escala 1-5)
  puntualidad INTEGER CHECK (puntualidad >= 1 AND puntualidad <= 5),
  profesionalismo INTEGER CHECK (profesionalismo >= 1 AND profesionalismo <= 5),
  empatia INTEGER CHECK (empatia >= 1 AND empatia <= 5),

  -- Recomendaría
  recomendaria BOOLEAN,

  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_calificacion_cita_id ON "CalificacionProfesional"(cita_id);
CREATE INDEX idx_calificacion_profesional_id ON "CalificacionProfesional"(profesional_id);
CREATE INDEX idx_calificacion_puntuacion ON "CalificacionProfesional"(puntuacion);

-- ==========================================
-- FUNCIÓN: Actualizar calificación promedio del profesional
-- ==========================================
CREATE OR REPLACE FUNCTION actualizar_calificacion_profesional()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "PerfilProfesional"
  SET calificacion_promedio = (
    SELECT AVG(puntuacion)::FLOAT
    FROM "CalificacionProfesional"
    WHERE profesional_id = (
      SELECT usuario_id
      FROM "PerfilProfesional"
      WHERE id = (
        SELECT perfil_profesional_id
        FROM "PerfilProfesional"
        WHERE usuario_id = NEW.profesional_id
      )
    )
  )
  WHERE usuario_id = NEW.profesional_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calificacion
  AFTER INSERT OR UPDATE ON "CalificacionProfesional"
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_calificacion_profesional();

-- ==========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==========================================
COMMENT ON TABLE "PerfilProfesional" IS 'Información adicional y profesional para usuarios con rol TERAPEUTA';
COMMENT ON TABLE "DocumentoProfesional" IS 'Documentos de validación de los profesionales (títulos, licencias, etc.)';
COMMENT ON TABLE "HorarioProfesional" IS 'Disponibilidad horaria de los profesionales para agendar citas';
COMMENT ON TABLE "Cita" IS 'Citas agendadas entre pacientes y profesionales';
COMMENT ON TABLE "Suscripcion" IS 'Gestión de suscripciones y planes de los usuarios';
COMMENT ON TABLE "CalificacionProfesional" IS 'Calificaciones y reseñas de los profesionales por parte de los pacientes';
