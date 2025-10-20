-- ==========================================
-- CREAR SOLO LAS 10 TABLAS FALTANTES
-- ==========================================
-- Ejecutar en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

BEGIN;

-- Verificar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función de trigger
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 1. PerfilProfesional
-- ==========================================
CREATE TABLE "PerfilProfesional" (
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
  aprobado_en TIMESTAMP WITH TIME ZONE,
  notas_admin TEXT,
  tarifa_por_sesion NUMERIC,
  moneda TEXT DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD')),
  total_pacientes INTEGER DEFAULT 0,
  total_citas INTEGER DEFAULT 0,
  calificacion_promedio NUMERIC DEFAULT 0,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_perfil_profesional_usuario_id ON "PerfilProfesional"(usuario_id);
CREATE INDEX idx_perfil_profesional_aprobado ON "PerfilProfesional"(perfil_aprobado);

CREATE TRIGGER perfil_profesional_actualizado_en
  BEFORE UPDATE ON "PerfilProfesional"
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- 2. DocumentoProfesional
-- ==========================================
CREATE TABLE "DocumentoProfesional" (
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
  verificado_en TIMESTAMP WITH TIME ZONE,
  notas_verificacion TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_documento_profesional_perfil_id ON "DocumentoProfesional"(perfil_profesional_id);

-- ==========================================
-- 3. HorarioProfesional
-- ==========================================
CREATE TABLE "HorarioProfesional" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_profesional_id UUID REFERENCES "PerfilProfesional"(id) ON DELETE CASCADE NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_sesion INTEGER DEFAULT 60,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(perfil_profesional_id, dia_semana, hora_inicio)
);

CREATE INDEX idx_horario_profesional_perfil_id ON "HorarioProfesional"(perfil_profesional_id);
CREATE INDEX idx_horario_profesional_dia ON "HorarioProfesional"(dia_semana);

CREATE TRIGGER horario_profesional_actualizado_en
  BEFORE UPDATE ON "HorarioProfesional"
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- 4. Cita
-- ==========================================
CREATE TABLE "Cita" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
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
  cancelada_en TIMESTAMP WITH TIME ZONE,
  recordatorio_enviado BOOLEAN DEFAULT false,
  recordatorio_enviado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (paciente_id != profesional_id)
);

CREATE INDEX idx_cita_paciente_id ON "Cita"(paciente_id);
CREATE INDEX idx_cita_profesional_id ON "Cita"(profesional_id);
CREATE INDEX idx_cita_fecha_hora ON "Cita"(fecha_hora);
CREATE INDEX idx_cita_estado ON "Cita"(estado);

CREATE TRIGGER cita_actualizado_en
  BEFORE UPDATE ON "Cita"
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- 5. CalificacionProfesional
-- ==========================================
CREATE TABLE "CalificacionProfesional" (
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
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_calificacion_profesional_id ON "CalificacionProfesional"(profesional_id);

-- ==========================================
-- 6. NotaSesionEncriptada
-- ==========================================
CREATE TABLE "NotaSesionEncriptada" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID REFERENCES "Cita"(id) ON DELETE CASCADE UNIQUE NOT NULL,
  notas_profesional_enc BYTEA,
  motivo_consulta_enc BYTEA,
  notas_hash TEXT,
  algoritmo TEXT DEFAULT 'aes-256-cbc',
  clave_version INTEGER DEFAULT 1,
  ultimo_acceso_por UUID REFERENCES "Usuario"(id),
  ultimo_acceso_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_nota_sesion_cita ON "NotaSesionEncriptada"(cita_id);

CREATE TRIGGER nota_sesion_actualizado_en
  BEFORE UPDATE ON "NotaSesionEncriptada"
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- 7. AuditoriaAccesoPHI
-- ==========================================
CREATE TABLE "AuditoriaAccesoPHI" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL NOT NULL,
  tipo_recurso TEXT NOT NULL CHECK (tipo_recurso IN (
    'cita', 'nota_sesion', 'mensaje', 'resultado', 'perfil_paciente', 'conversacion', 'evaluacion'
  )),
  recurso_id UUID NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN (
    'leer', 'crear', 'actualizar', 'eliminar', 'descargar', 'compartir'
  )),
  ip_address TEXT,
  user_agent TEXT,
  endpoint TEXT,
  metodo_http TEXT,
  justificacion TEXT,
  exitoso BOOLEAN DEFAULT true,
  codigo_http INTEGER,
  error_mensaje TEXT,
  datos_accedidos JSONB,
  duracion_ms INTEGER,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_auditoria_phi_usuario ON "AuditoriaAccesoPHI"(usuario_id, creado_en DESC);
CREATE INDEX idx_auditoria_phi_recurso ON "AuditoriaAccesoPHI"(tipo_recurso, recurso_id);

-- ==========================================
-- 8. ConsentimientoDetallado
-- ==========================================
CREATE TABLE "ConsentimientoDetallado" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'procesamiento_phi', 'compartir_con_profesional', 'analisis_ia',
    'almacenamiento_mensajes', 'almacenamiento_voz', 'marketing',
    'investigacion_anonimizado', 'notificaciones_push', 'notificaciones_email',
    'compartir_progreso', 'cookies_analiticas'
  )),
  otorgado BOOLEAN NOT NULL,
  version_texto INTEGER NOT NULL DEFAULT 1,
  texto_consentimiento TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metodo_otorgamiento TEXT CHECK (metodo_otorgamiento IN (
    'web', 'app', 'email_link', 'telefono', 'presencial'
  )),
  otorgado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revocado_en TIMESTAMP WITH TIME ZONE,
  expira_en TIMESTAMP WITH TIME ZONE,
  recordatorio_enviado BOOLEAN DEFAULT false,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_consentimiento_usuario ON "ConsentimientoDetallado"(usuario_id, tipo);
CREATE UNIQUE INDEX idx_consentimiento_unico_activo
  ON "ConsentimientoDetallado"(usuario_id, tipo)
  WHERE otorgado = true AND revocado_en IS NULL;

CREATE TRIGGER consentimiento_actualizado_en
  BEFORE UPDATE ON "ConsentimientoDetallado"
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- 9. StripeEvento
-- ==========================================
CREATE TABLE "StripeEvento" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  tipo_evento TEXT NOT NULL,
  procesado BOOLEAN DEFAULT false,
  intento_numero INTEGER DEFAULT 1,
  datos_evento JSONB,
  exitoso BOOLEAN DEFAULT NULL,
  error_mensaje TEXT,
  recibido_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  procesado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_stripe_evento_id ON "StripeEvento"(stripe_event_id);
CREATE INDEX idx_stripe_evento_procesado ON "StripeEvento"(procesado, recibido_en);

-- ==========================================
-- 10. PagoCita
-- ==========================================
CREATE TABLE "PagoCita" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID REFERENCES "Cita"(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_sesion_id TEXT,
  monto NUMERIC NOT NULL,
  moneda TEXT DEFAULT 'COP',
  estado TEXT CHECK (estado IN (
    'pendiente', 'procesando', 'completado', 'fallido', 'reembolsado', 'cancelado'
  )) DEFAULT 'pendiente',
  fecha_pago TIMESTAMP WITH TIME ZONE,
  fecha_reembolso TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_pago_cita_cita ON "PagoCita"(cita_id);
CREATE INDEX idx_pago_cita_usuario ON "PagoCita"(usuario_id);

CREATE TRIGGER pago_cita_actualizado_en
  BEFORE UPDATE ON "PagoCita"
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

COMMIT;

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 10 TABLAS CREADAS EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 1. PerfilProfesional';
  RAISE NOTICE '✅ 2. DocumentoProfesional';
  RAISE NOTICE '✅ 3. HorarioProfesional';
  RAISE NOTICE '✅ 4. Cita';
  RAISE NOTICE '✅ 5. CalificacionProfesional';
  RAISE NOTICE '✅ 6. NotaSesionEncriptada';
  RAISE NOTICE '✅ 7. AuditoriaAccesoPHI';
  RAISE NOTICE '✅ 8. ConsentimientoDetallado';
  RAISE NOTICE '✅ 9. StripeEvento';
  RAISE NOTICE '✅ 10. PagoCita';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Aplicar RLS (seguridad de filas)';
  RAISE NOTICE '2. Crear funciones de encriptación y auditoría';
  RAISE NOTICE '3. Configurar PHI_ENCRYPTION_KEY';
  RAISE NOTICE '4. Desplegar Edge Functions';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
