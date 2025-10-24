-- ==========================================
-- MIGRACIÓN SEGURA: SISTEMA DE IA Y ANALYTICS
-- Esta versión NO falla si los objetos ya existen
-- ==========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==========================================
-- TABLAS (con IF NOT EXISTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS "AnalisisConversacion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID REFERENCES "Conversacion"(id) ON DELETE CASCADE,
  sesion_publica_id TEXT REFERENCES "SesionPublica"(sesion_id) ON DELETE CASCADE,
  emociones_dominantes JSONB NOT NULL DEFAULT '{}',
  sentimiento_promedio FLOAT CHECK (sentimiento_promedio >= -1 AND sentimiento_promedio <= 1),
  score_bienestar INTEGER CHECK (score_bienestar >= 0 AND score_bienestar <= 100),
  riesgo_suicidio BOOLEAN DEFAULT false,
  nivel_urgencia TEXT CHECK (nivel_urgencia IN ('bajo', 'medio', 'alto', 'critico')),
  senales_crisis TEXT[],
  temas_recurrentes TEXT[],
  palabras_clave JSONB,
  resumen_clinico TEXT,
  recomendaciones_terapeuta TEXT[],
  total_mensajes_analizados INTEGER,
  analizado_con_ia BOOLEAN DEFAULT true,
  modelo_usado TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_consumidos INTEGER,
  creado_en TIMESTAMP DEFAULT now(),
  CHECK (
    (conversacion_id IS NOT NULL AND sesion_publica_id IS NULL) OR
    (conversacion_id IS NULL AND sesion_publica_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS "ReporteSemanal" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  score_bienestar_promedio INTEGER CHECK (score_bienestar_promedio >= 0 AND score_bienestar_promedio <= 100),
  emociones_dominantes JSONB,
  temas_identificados TEXT[],
  nube_palabras JSONB,
  total_mensajes INTEGER DEFAULT 0,
  total_sesiones INTEGER DEFAULT 0,
  promedio_mensajes_por_sesion FLOAT,
  horarios_uso JSONB,
  phq9_inicio INTEGER,
  phq9_fin INTEGER,
  phq9_tendencia TEXT CHECK (phq9_tendencia IN ('mejorando', 'estable', 'empeorando')),
  gad7_inicio INTEGER,
  gad7_fin INTEGER,
  gad7_tendencia TEXT CHECK (gad7_tendencia IN ('mejorando', 'estable', 'empeorando')),
  recomendaciones_terapeuticas TEXT[],
  resumen_ia TEXT,
  areas_enfoque TEXT[],
  generado_automaticamente BOOLEAN DEFAULT true,
  generado_en TIMESTAMP DEFAULT now(),
  modelo_usado TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_consumidos INTEGER,
  notificacion_enviada BOOLEAN DEFAULT false,
  notificacion_enviada_en TIMESTAMP,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ReporteMensual" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL,
  mes INTEGER CHECK (mes >= 1 AND mes <= 12),
  anio INTEGER,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  score_bienestar_promedio INTEGER,
  evolucion_semanal JSONB,
  emociones_dominantes JSONB,
  temas_principales TEXT[],
  total_mensajes INTEGER DEFAULT 0,
  total_sesiones INTEGER DEFAULT 0,
  dias_activos INTEGER DEFAULT 0,
  racha_mas_larga INTEGER DEFAULT 0,
  evaluaciones_phq9 JSONB,
  evaluaciones_gad7 JSONB,
  mejoria_phq9 INTEGER,
  mejoria_gad7 INTEGER,
  resumen_ejecutivo TEXT,
  progreso_observado TEXT,
  logros_principales TEXT[],
  desafios_identificados TEXT[],
  recomendaciones_largo_plazo TEXT[],
  generado_automaticamente BOOLEAN DEFAULT true,
  generado_en TIMESTAMP DEFAULT now(),
  modelo_usado TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_consumidos INTEGER,
  creado_en TIMESTAMP DEFAULT now(),
  UNIQUE(usuario_id, mes, anio)
);

CREATE TABLE IF NOT EXISTS "InsightDashboard" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  periodo TEXT CHECK (periodo IN ('dia', 'semana', 'mes', 'trimestre')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  score_bienestar_actual INTEGER,
  tendencia TEXT CHECK (tendencia IN ('mejorando', 'estable', 'empeorando')),
  evolucion_emocional JSONB,
  patrones_horarios JSONB,
  dias_mas_activos TEXT[],
  horas_pico TEXT[],
  ultima_phq9 INTEGER,
  penultima_phq9 INTEGER,
  diferencia_phq9 INTEGER,
  ultima_gad7 INTEGER,
  penultima_gad7 INTEGER,
  diferencia_gad7 INTEGER,
  top_emociones JSONB,
  top_temas TEXT[],
  top_palabras JSONB,
  calculado_en TIMESTAMP DEFAULT now(),
  ttl INTERVAL DEFAULT INTERVAL '1 hour',
  creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AlertaUrgente" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE,
  sesion_publica_id TEXT REFERENCES "SesionPublica"(sesion_id) ON DELETE CASCADE,
  analisis_id UUID REFERENCES "AnalisisConversacion"(id) ON DELETE SET NULL,
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN (
    'ideacion_suicida',
    'plan_suicida',
    'autolesion',
    'crisis_grave',
    'deterioro_rapido'
  )),
  nivel_urgencia TEXT NOT NULL CHECK (nivel_urgencia IN ('medio', 'alto', 'critico')),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  senales_detectadas TEXT[],
  contexto JSONB,
  mensaje_disparador TEXT,
  conversacion_id UUID REFERENCES "Conversacion"(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida', 'resuelta', 'falsa_alarma')),
  atendida_por UUID REFERENCES "Usuario"(id),
  atendida_en TIMESTAMP,
  notas_atencion TEXT,
  notificaciones_enviadas JSONB,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CHECK (
    (usuario_id IS NOT NULL AND sesion_publica_id IS NULL) OR
    (usuario_id IS NULL AND sesion_publica_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS "LogGeminiAPI" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcion_origen TEXT NOT NULL,
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL,
  sesion_publica_id TEXT,
  prompt_tipo TEXT,
  tokens_prompt INTEGER,
  tokens_respuesta INTEGER,
  tokens_total INTEGER,
  latencia_ms INTEGER,
  exitoso BOOLEAN DEFAULT true,
  codigo_error TEXT,
  mensaje_error TEXT,
  llamadas_hoy INTEGER,
  creado_en TIMESTAMP DEFAULT now()
);

-- ==========================================
-- ÍNDICES (con DROP IF EXISTS primero)
-- ==========================================

-- AnalisisConversacion
DROP INDEX IF EXISTS idx_analisis_conversacion_id;
CREATE INDEX idx_analisis_conversacion_id ON "AnalisisConversacion"(conversacion_id);

DROP INDEX IF EXISTS idx_analisis_sesion_publica_id;
CREATE INDEX idx_analisis_sesion_publica_id ON "AnalisisConversacion"(sesion_publica_id);

DROP INDEX IF EXISTS idx_analisis_riesgo;
CREATE INDEX idx_analisis_riesgo ON "AnalisisConversacion"(riesgo_suicidio) WHERE riesgo_suicidio = true;

DROP INDEX IF EXISTS idx_analisis_urgencia;
CREATE INDEX idx_analisis_urgencia ON "AnalisisConversacion"(nivel_urgencia);

DROP INDEX IF EXISTS idx_analisis_score;
CREATE INDEX idx_analisis_score ON "AnalisisConversacion"(score_bienestar);

DROP INDEX IF EXISTS idx_analisis_fecha;
CREATE INDEX idx_analisis_fecha ON "AnalisisConversacion"(creado_en DESC);

-- ReporteSemanal
DROP INDEX IF EXISTS idx_reporte_semanal_usuario_id;
CREATE INDEX idx_reporte_semanal_usuario_id ON "ReporteSemanal"(usuario_id);

DROP INDEX IF EXISTS idx_reporte_semanal_profesional_id;
CREATE INDEX idx_reporte_semanal_profesional_id ON "ReporteSemanal"(profesional_id);

DROP INDEX IF EXISTS idx_reporte_semanal_periodo;
CREATE INDEX idx_reporte_semanal_periodo ON "ReporteSemanal"(fecha_inicio, fecha_fin);

DROP INDEX IF EXISTS idx_reporte_semanal_fecha;
CREATE INDEX idx_reporte_semanal_fecha ON "ReporteSemanal"(creado_en DESC);

DROP INDEX IF EXISTS idx_reporte_semanal_generado;
CREATE INDEX idx_reporte_semanal_generado ON "ReporteSemanal"(generado_en DESC);

-- ReporteMensual
DROP INDEX IF EXISTS idx_reporte_mensual_usuario_id;
CREATE INDEX idx_reporte_mensual_usuario_id ON "ReporteMensual"(usuario_id);

DROP INDEX IF EXISTS idx_reporte_mensual_profesional_id;
CREATE INDEX idx_reporte_mensual_profesional_id ON "ReporteMensual"(profesional_id);

DROP INDEX IF EXISTS idx_reporte_mensual_periodo;
CREATE INDEX idx_reporte_mensual_periodo ON "ReporteMensual"(mes, anio);

DROP INDEX IF EXISTS idx_reporte_mensual_fecha;
CREATE INDEX idx_reporte_mensual_fecha ON "ReporteMensual"(creado_en DESC);

-- InsightDashboard
DROP INDEX IF EXISTS idx_insight_dashboard_usuario_id;
CREATE INDEX idx_insight_dashboard_usuario_id ON "InsightDashboard"(usuario_id);

DROP INDEX IF EXISTS idx_insight_dashboard_periodo;
CREATE INDEX idx_insight_dashboard_periodo ON "InsightDashboard"(periodo);

DROP INDEX IF EXISTS idx_insight_dashboard_fecha;
CREATE INDEX idx_insight_dashboard_fecha ON "InsightDashboard"(creado_en DESC);

-- AlertaUrgente
DROP INDEX IF EXISTS idx_alerta_urgente_usuario_id;
CREATE INDEX idx_alerta_urgente_usuario_id ON "AlertaUrgente"(usuario_id);

DROP INDEX IF EXISTS idx_alerta_urgente_sesion_id;
CREATE INDEX idx_alerta_urgente_sesion_id ON "AlertaUrgente"(sesion_publica_id);

DROP INDEX IF EXISTS idx_alerta_urgente_tipo;
CREATE INDEX idx_alerta_urgente_tipo ON "AlertaUrgente"(tipo_alerta);

DROP INDEX IF EXISTS idx_alerta_urgente_nivel;
CREATE INDEX idx_alerta_urgente_nivel ON "AlertaUrgente"(nivel_urgencia);

DROP INDEX IF EXISTS idx_alerta_urgente_estado;
CREATE INDEX idx_alerta_urgente_estado ON "AlertaUrgente"(estado);

DROP INDEX IF EXISTS idx_alerta_urgente_fecha;
CREATE INDEX idx_alerta_urgente_fecha ON "AlertaUrgente"(creado_en DESC);

DROP INDEX IF EXISTS idx_alerta_urgente_pendientes;
CREATE INDEX idx_alerta_urgente_pendientes ON "AlertaUrgente"(estado, nivel_urgencia) WHERE estado = 'pendiente';

-- LogGeminiAPI
DROP INDEX IF EXISTS idx_log_gemini_funcion;
CREATE INDEX idx_log_gemini_funcion ON "LogGeminiAPI"(funcion_origen);

DROP INDEX IF EXISTS idx_log_gemini_fecha;
CREATE INDEX idx_log_gemini_fecha ON "LogGeminiAPI"(creado_en DESC);

DROP INDEX IF EXISTS idx_log_gemini_usuario;
CREATE INDEX idx_log_gemini_usuario ON "LogGeminiAPI"(usuario_id);

DROP INDEX IF EXISTS idx_log_gemini_exitoso;
CREATE INDEX idx_log_gemini_exitoso ON "LogGeminiAPI"(exitoso);

-- ==========================================
-- HABILITAR RLS
-- ==========================================

ALTER TABLE "AnalisisConversacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReporteSemanal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReporteMensual" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InsightDashboard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertaUrgente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LogGeminiAPI" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS RLS (con DROP IF EXISTS)
-- ==========================================

-- AnalisisConversacion
DROP POLICY IF EXISTS "usuarios_ven_sus_analisis" ON "AnalisisConversacion";
CREATE POLICY "usuarios_ven_sus_analisis"
ON "AnalisisConversacion" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Conversacion"
    WHERE id = "AnalisisConversacion".conversacion_id
    AND usuario_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "profesionales_ven_analisis_pacientes" ON "AnalisisConversacion";
CREATE POLICY "profesionales_ven_analisis_pacientes"
ON "AnalisisConversacion" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Cita" c
    JOIN "Conversacion" cv ON cv.usuario_id = c.paciente_id
    WHERE cv.id = "AnalisisConversacion".conversacion_id
    AND c.profesional_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid() AND rol = 'ADMIN'
  )
);

-- ReporteSemanal
DROP POLICY IF EXISTS "usuarios_ven_sus_reportes_semanales" ON "ReporteSemanal";
CREATE POLICY "usuarios_ven_sus_reportes_semanales"
ON "ReporteSemanal" FOR SELECT
USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "profesionales_ven_reportes_pacientes" ON "ReporteSemanal";
CREATE POLICY "profesionales_ven_reportes_pacientes"
ON "ReporteSemanal" FOR SELECT
USING (
  profesional_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM "Cita"
    WHERE paciente_id = "ReporteSemanal".usuario_id
    AND profesional_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid() AND rol = 'ADMIN'
  )
);

-- ReporteMensual
DROP POLICY IF EXISTS "usuarios_ven_sus_reportes_mensuales" ON "ReporteMensual";
CREATE POLICY "usuarios_ven_sus_reportes_mensuales"
ON "ReporteMensual" FOR SELECT
USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "profesionales_ven_reportes_mensuales_pacientes" ON "ReporteMensual";
CREATE POLICY "profesionales_ven_reportes_mensuales_pacientes"
ON "ReporteMensual" FOR SELECT
USING (
  profesional_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM "Cita"
    WHERE paciente_id = "ReporteMensual".usuario_id
    AND profesional_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid() AND rol = 'ADMIN'
  )
);

-- InsightDashboard
DROP POLICY IF EXISTS "usuarios_ven_sus_insights" ON "InsightDashboard";
CREATE POLICY "usuarios_ven_sus_insights"
ON "InsightDashboard" FOR SELECT
USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "profesionales_ven_insights_pacientes" ON "InsightDashboard";
CREATE POLICY "profesionales_ven_insights_pacientes"
ON "InsightDashboard" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Cita"
    WHERE paciente_id = "InsightDashboard".usuario_id
    AND profesional_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid() AND rol = 'ADMIN'
  )
);

-- AlertaUrgente
DROP POLICY IF EXISTS "profesionales_ven_alertas" ON "AlertaUrgente";
CREATE POLICY "profesionales_ven_alertas"
ON "AlertaUrgente" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid()
    AND rol IN ('TERAPEUTA', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "profesionales_actualizan_alertas" ON "AlertaUrgente";
CREATE POLICY "profesionales_actualizan_alertas"
ON "AlertaUrgente" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid()
    AND rol IN ('TERAPEUTA', 'ADMIN')
  )
);

-- LogGeminiAPI
DROP POLICY IF EXISTS "solo_admins_ven_logs" ON "LogGeminiAPI";
CREATE POLICY "solo_admins_ven_logs"
ON "LogGeminiAPI" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid() AND rol = 'ADMIN'
  )
);

-- ==========================================
-- FUNCIONES SQL
-- ==========================================

CREATE OR REPLACE FUNCTION obtener_llamadas_gemini_hoy()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM "LogGeminiAPI"
    WHERE DATE(creado_en) = CURRENT_DATE
    AND exitoso = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION puede_llamar_gemini()
RETURNS BOOLEAN AS $$
DECLARE
  llamadas_hoy INTEGER;
  limite_diario INTEGER := 1000; -- Límite diario de GPT OSS
  reserva_emergencia INTEGER := 100; -- Reserva para emergencias
BEGIN
  llamadas_hoy := obtener_llamadas_gemini_hoy();
  RETURN llamadas_hoy < (limite_diario - reserva_emergencia);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION limpiar_insights_expirados()
RETURNS INTEGER AS $$
DECLARE
  registros_eliminados INTEGER;
BEGIN
  DELETE FROM "InsightDashboard"
  WHERE creado_en + ttl < now();

  GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
  RETURN registros_eliminados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensaje final
SELECT '✅ Migración completada exitosamente. 6 tablas creadas/actualizadas.' as resultado;
