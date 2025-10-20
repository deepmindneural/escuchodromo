-- ==========================================
-- MIGRACIÓN: SISTEMA DE IA Y ANALYTICS
-- Fecha: 2025-01-21
-- Descripción: Tablas para análisis con IA, reportes y alertas
-- ==========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==========================================
-- TABLA: AnalisisConversacion
-- Para almacenar el análisis post-chat con IA
-- ==========================================
CREATE TABLE IF NOT EXISTS "AnalisisConversacion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones (uno de los dos debe estar presente)
  conversacion_id UUID REFERENCES "Conversacion"(id) ON DELETE CASCADE,
  sesion_publica_id TEXT REFERENCES "SesionPublica"(sesion_id) ON DELETE CASCADE,

  -- Análisis emocional
  emociones_dominantes JSONB NOT NULL DEFAULT '{}',
  -- Ejemplo: {"tristeza": 0.8, "ansiedad": 0.6, "esperanza": 0.3}

  sentimiento_promedio FLOAT CHECK (sentimiento_promedio >= -1 AND sentimiento_promedio <= 1),
  -- Rango: -1 (muy negativo) a 1 (muy positivo)

  score_bienestar INTEGER CHECK (score_bienestar >= 0 AND score_bienestar <= 100),
  -- 0-25: Crisis, 26-50: Bajo, 51-75: Moderado, 76-100: Bueno

  -- Detección de riesgos
  riesgo_suicidio BOOLEAN DEFAULT false,
  nivel_urgencia TEXT CHECK (nivel_urgencia IN ('bajo', 'medio', 'alto', 'critico')),
  senales_crisis TEXT[], -- Señales específicas detectadas

  -- Temas y palabras clave
  temas_recurrentes TEXT[], -- ["ansiedad laboral", "relaciones", "sueño"]
  palabras_clave JSONB, -- {"trabajo": 15, "ansiedad": 12, "familia": 8}

  -- Insights clínicos (lenguaje profesional)
  resumen_clinico TEXT,
  recomendaciones_terapeuta TEXT[],

  -- Metadata del análisis
  total_mensajes_analizados INTEGER,
  analizado_con_ia BOOLEAN DEFAULT true,
  modelo_usado TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_consumidos INTEGER,

  creado_en TIMESTAMP DEFAULT now(),

  -- Constraint: debe tener conversacion_id O sesion_publica_id
  CHECK (
    (conversacion_id IS NOT NULL AND sesion_publica_id IS NULL) OR
    (conversacion_id IS NULL AND sesion_publica_id IS NOT NULL)
  )
);

-- Índices para AnalisisConversacion
CREATE INDEX idx_analisis_conversacion_id ON "AnalisisConversacion"(conversacion_id);
CREATE INDEX idx_analisis_sesion_publica_id ON "AnalisisConversacion"(sesion_publica_id);
CREATE INDEX idx_analisis_riesgo ON "AnalisisConversacion"(riesgo_suicidio) WHERE riesgo_suicidio = true;
CREATE INDEX idx_analisis_urgencia ON "AnalisisConversacion"(nivel_urgencia);
CREATE INDEX idx_analisis_score ON "AnalisisConversacion"(score_bienestar);
CREATE INDEX idx_analisis_fecha ON "AnalisisConversacion"(creado_en DESC);

-- ==========================================
-- TABLA: ReporteSemanal
-- Reportes automáticos generados semanalmente
-- ==========================================
CREATE TABLE IF NOT EXISTS "ReporteSemanal" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL,

  -- Período del reporte
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,

  -- Análisis del período
  score_bienestar_promedio INTEGER CHECK (score_bienestar_promedio >= 0 AND score_bienestar_promedio <= 100),
  emociones_dominantes JSONB, -- {"tristeza": 0.7, "ansiedad": 0.5}
  temas_identificados TEXT[],
  nube_palabras JSONB, -- {"trabajo": 25, "ansiedad": 20, ...}

  -- Métricas de uso
  total_mensajes INTEGER DEFAULT 0,
  total_sesiones INTEGER DEFAULT 0,
  promedio_mensajes_por_sesion FLOAT,
  horarios_uso JSONB, -- {"lunes": {"08:00": 2, "14:00": 1}, "martes": {...}}

  -- Evolución de evaluaciones
  phq9_inicio INTEGER,
  phq9_fin INTEGER,
  phq9_tendencia TEXT CHECK (phq9_tendencia IN ('mejorando', 'estable', 'empeorando')),
  gad7_inicio INTEGER,
  gad7_fin INTEGER,
  gad7_tendencia TEXT CHECK (gad7_tendencia IN ('mejorando', 'estable', 'empeorando')),

  -- Insights generados por IA
  recomendaciones_terapeuticas TEXT[],
  resumen_ia TEXT, -- Resumen ejecutivo generado por Gemini
  areas_enfoque TEXT[], -- Áreas de enfoque para próxima semana

  -- Metadata
  generado_automaticamente BOOLEAN DEFAULT true,
  generado_en TIMESTAMP DEFAULT now(),
  modelo_usado TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_consumidos INTEGER,

  -- Notificación
  notificacion_enviada BOOLEAN DEFAULT false,
  notificacion_enviada_en TIMESTAMP,

  creado_en TIMESTAMP DEFAULT now()
);

-- Índices para ReporteSemanal
CREATE INDEX idx_reporte_semanal_usuario_id ON "ReporteSemanal"(usuario_id);
CREATE INDEX idx_reporte_semanal_profesional_id ON "ReporteSemanal"(profesional_id);
CREATE INDEX idx_reporte_semanal_periodo ON "ReporteSemanal"(fecha_inicio, fecha_fin);
CREATE INDEX idx_reporte_semanal_fecha ON "ReporteSemanal"(creado_en DESC);
CREATE INDEX idx_reporte_semanal_generado ON "ReporteSemanal"(generado_en DESC);

-- ==========================================
-- TABLA: ReporteMensual
-- Reportes mensuales completos
-- ==========================================
CREATE TABLE IF NOT EXISTS "ReporteMensual" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  profesional_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL,

  -- Período del reporte
  mes INTEGER CHECK (mes >= 1 AND mes <= 12),
  anio INTEGER,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,

  -- Análisis del período
  score_bienestar_promedio INTEGER,
  evolucion_semanal JSONB, -- [{"semana": 1, "score": 65}, ...]
  emociones_dominantes JSONB,
  temas_principales TEXT[],

  -- Métricas de uso
  total_mensajes INTEGER DEFAULT 0,
  total_sesiones INTEGER DEFAULT 0,
  dias_activos INTEGER DEFAULT 0,
  racha_mas_larga INTEGER DEFAULT 0, -- Días consecutivos más largos

  -- Evolución de evaluaciones
  evaluaciones_phq9 JSONB, -- [{"fecha": "2025-01-01", "score": 12}, ...]
  evaluaciones_gad7 JSONB,
  mejoria_phq9 INTEGER, -- Diferencia entre primera y última
  mejoria_gad7 INTEGER,

  -- Análisis profesional generado por IA
  resumen_ejecutivo TEXT,
  progreso_observado TEXT,
  logros_principales TEXT[],
  desafios_identificados TEXT[],
  recomendaciones_largo_plazo TEXT[],

  -- Metadata
  generado_automaticamente BOOLEAN DEFAULT true,
  generado_en TIMESTAMP DEFAULT now(),
  modelo_usado TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_consumidos INTEGER,

  creado_en TIMESTAMP DEFAULT now(),

  UNIQUE(usuario_id, mes, anio)
);

-- Índices para ReporteMensual
CREATE INDEX idx_reporte_mensual_usuario_id ON "ReporteMensual"(usuario_id);
CREATE INDEX idx_reporte_mensual_profesional_id ON "ReporteMensual"(profesional_id);
CREATE INDEX idx_reporte_mensual_periodo ON "ReporteMensual"(mes, anio);
CREATE INDEX idx_reporte_mensual_fecha ON "ReporteMensual"(creado_en DESC);

-- ==========================================
-- TABLA: InsightDashboard
-- Snapshots de insights en tiempo real
-- ==========================================
CREATE TABLE IF NOT EXISTS "InsightDashboard" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,

  -- Período de análisis
  periodo TEXT CHECK (periodo IN ('dia', 'semana', 'mes', 'trimestre')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,

  -- Métricas clave
  score_bienestar_actual INTEGER,
  tendencia TEXT CHECK (tendencia IN ('mejorando', 'estable', 'empeorando')),

  -- Evolución emocional (para gráficos)
  evolucion_emocional JSONB,
  -- [{"fecha": "2025-01-20", "score": 65, "emociones": {...}}, ...]

  -- Patrones de uso
  patrones_horarios JSONB, -- {"lunes": {"08:00": 2, ...}, ...}
  dias_mas_activos TEXT[], -- ["lunes", "miércoles"]
  horas_pico TEXT[], -- ["09:00", "21:00"]

  -- Comparación de evaluaciones
  ultima_phq9 INTEGER,
  penultima_phq9 INTEGER,
  diferencia_phq9 INTEGER,
  ultima_gad7 INTEGER,
  penultima_gad7 INTEGER,
  diferencia_gad7 INTEGER,

  -- Top insights
  top_emociones JSONB, -- {"tristeza": 0.7, "ansiedad": 0.6}
  top_temas TEXT[], -- Top 5 temas
  top_palabras JSONB, -- Top 20 palabras

  -- Metadata
  calculado_en TIMESTAMP DEFAULT now(),
  ttl INTERVAL DEFAULT INTERVAL '1 hour', -- Time to live del snapshot

  creado_en TIMESTAMP DEFAULT now()
);

-- Índices para InsightDashboard
CREATE INDEX idx_insight_dashboard_usuario_id ON "InsightDashboard"(usuario_id);
CREATE INDEX idx_insight_dashboard_periodo ON "InsightDashboard"(periodo);
CREATE INDEX idx_insight_dashboard_fecha ON "InsightDashboard"(creado_en DESC);

-- ==========================================
-- TABLA: AlertaUrgente
-- Alertas de crisis para profesionales/admins
-- ==========================================
CREATE TABLE IF NOT EXISTS "AlertaUrgente" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Usuario en riesgo
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE,
  sesion_publica_id TEXT REFERENCES "SesionPublica"(sesion_id) ON DELETE CASCADE,

  -- Análisis relacionado
  analisis_id UUID REFERENCES "AnalisisConversacion"(id) ON DELETE SET NULL,

  -- Tipo de alerta
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN (
    'ideacion_suicida',
    'plan_suicida',
    'autolesion',
    'crisis_grave',
    'deterioro_rapido'
  )),

  nivel_urgencia TEXT NOT NULL CHECK (nivel_urgencia IN ('medio', 'alto', 'critico')),

  -- Detalles de la alerta
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  senales_detectadas TEXT[],
  contexto JSONB, -- Información adicional

  -- Mensaje/conversación que activó la alerta
  mensaje_disparador TEXT,
  conversacion_id UUID REFERENCES "Conversacion"(id) ON DELETE SET NULL,

  -- Estado de la alerta
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida', 'resuelta', 'falsa_alarma')),
  atendida_por UUID REFERENCES "Usuario"(id),
  atendida_en TIMESTAMP,
  notas_atencion TEXT,

  -- Notificaciones enviadas
  notificaciones_enviadas JSONB, -- [{"usuario_id": "...", "tipo": "email", "enviado_en": "..."}]

  -- Metadata
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),

  -- Constraint: debe tener usuario_id O sesion_publica_id
  CHECK (
    (usuario_id IS NOT NULL AND sesion_publica_id IS NULL) OR
    (usuario_id IS NULL AND sesion_publica_id IS NOT NULL)
  )
);

-- Índices para AlertaUrgente
CREATE INDEX idx_alerta_urgente_usuario_id ON "AlertaUrgente"(usuario_id);
CREATE INDEX idx_alerta_urgente_sesion_id ON "AlertaUrgente"(sesion_publica_id);
CREATE INDEX idx_alerta_urgente_tipo ON "AlertaUrgente"(tipo_alerta);
CREATE INDEX idx_alerta_urgente_nivel ON "AlertaUrgente"(nivel_urgencia);
CREATE INDEX idx_alerta_urgente_estado ON "AlertaUrgente"(estado);
CREATE INDEX idx_alerta_urgente_fecha ON "AlertaUrgente"(creado_en DESC);
CREATE INDEX idx_alerta_urgente_pendientes ON "AlertaUrgente"(estado, nivel_urgencia) WHERE estado = 'pendiente';

-- Trigger para actualizar updated_at
CREATE TRIGGER alerta_urgente_actualizado_en
  BEFORE UPDATE ON "AlertaUrgente"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- TABLA: LogGeminiAPI
-- Para monitorear uso de Gemini API
-- ==========================================
CREATE TABLE IF NOT EXISTS "LogGeminiAPI" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Origen de la llamada
  funcion_origen TEXT NOT NULL, -- 'chat-ia', 'analisis-post-chat', etc.
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE SET NULL,
  sesion_publica_id TEXT,

  -- Detalles de la llamada
  prompt_tipo TEXT, -- 'chat', 'analisis', 'reporte', 'crisis'
  tokens_prompt INTEGER,
  tokens_respuesta INTEGER,
  tokens_total INTEGER,

  -- Performance
  latencia_ms INTEGER, -- Tiempo de respuesta en milisegundos
  exitoso BOOLEAN DEFAULT true,
  codigo_error TEXT,
  mensaje_error TEXT,

  -- Rate limiting
  llamadas_hoy INTEGER, -- Contador diario

  creado_en TIMESTAMP DEFAULT now()
);

-- Índices para LogGeminiAPI
CREATE INDEX idx_log_gemini_funcion ON "LogGeminiAPI"(funcion_origen);
CREATE INDEX idx_log_gemini_fecha ON "LogGeminiAPI"(creado_en DESC);
CREATE INDEX idx_log_gemini_usuario ON "LogGeminiAPI"(usuario_id);
CREATE INDEX idx_log_gemini_exitoso ON "LogGeminiAPI"(exitoso);

-- ==========================================
-- POLÍTICAS RLS (Row Level Security)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE "AnalisisConversacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReporteSemanal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReporteMensual" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InsightDashboard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertaUrgente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LogGeminiAPI" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS: AnalisisConversacion
-- ==========================================

-- Usuarios registrados pueden ver sus propios análisis
CREATE POLICY "usuarios_ven_sus_analisis"
ON "AnalisisConversacion" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Conversacion"
    WHERE id = "AnalisisConversacion".conversacion_id
    AND usuario_id = auth.uid()
  )
);

-- Profesionales ven análisis de sus pacientes
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

-- ==========================================
-- RLS: ReporteSemanal / ReporteMensual
-- ==========================================

-- Usuarios ven sus propios reportes
CREATE POLICY "usuarios_ven_sus_reportes_semanales"
ON "ReporteSemanal" FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "usuarios_ven_sus_reportes_mensuales"
ON "ReporteMensual" FOR SELECT
USING (usuario_id = auth.uid());

-- Profesionales ven reportes de sus pacientes
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

-- ==========================================
-- RLS: InsightDashboard
-- ==========================================

CREATE POLICY "usuarios_ven_sus_insights"
ON "InsightDashboard" FOR SELECT
USING (usuario_id = auth.uid());

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

-- ==========================================
-- RLS: AlertaUrgente
-- ==========================================

-- Solo profesionales y admins ven alertas
CREATE POLICY "profesionales_ven_alertas"
ON "AlertaUrgente" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid()
    AND rol IN ('TERAPEUTA', 'ADMIN')
  )
);

-- Profesionales pueden actualizar alertas
CREATE POLICY "profesionales_actualizan_alertas"
ON "AlertaUrgente" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid()
    AND rol IN ('TERAPEUTA', 'ADMIN')
  )
);

-- ==========================================
-- RLS: LogGeminiAPI
-- ==========================================

-- Solo admins ven logs de API
CREATE POLICY "solo_admins_ven_logs"
ON "LogGeminiAPI" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE id = auth.uid() AND rol = 'ADMIN'
  )
);

-- ==========================================
-- FUNCIONES AUXILIARES
-- ==========================================

-- Función: Obtener contador de llamadas Gemini del día
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

-- Función: Verificar si se puede hacer llamada a Gemini
CREATE OR REPLACE FUNCTION puede_llamar_gemini()
RETURNS BOOLEAN AS $$
DECLARE
  llamadas_hoy INTEGER;
  limite_diario INTEGER := 1000;
  reserva_emergencia INTEGER := 100;
BEGIN
  llamadas_hoy := obtener_llamadas_gemini_hoy();
  RETURN llamadas_hoy < (limite_diario - reserva_emergencia);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Limpiar snapshots de insights expirados
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

-- ==========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==========================================
COMMENT ON TABLE "AnalisisConversacion" IS 'Análisis post-chat generado por IA con emociones, riesgos y recomendaciones';
COMMENT ON TABLE "ReporteSemanal" IS 'Reportes semanales automáticos generados por IA para usuarios registrados';
COMMENT ON TABLE "ReporteMensual" IS 'Reportes mensuales completos con evolución y análisis profundo';
COMMENT ON TABLE "InsightDashboard" IS 'Snapshots de insights en tiempo real con TTL para dashboard';
COMMENT ON TABLE "AlertaUrgente" IS 'Alertas de crisis para profesionales cuando se detecta riesgo suicida o deterioro';
COMMENT ON TABLE "LogGeminiAPI" IS 'Log de todas las llamadas a Gemini API para monitoreo y rate limiting';

COMMENT ON COLUMN "AnalisisConversacion"."score_bienestar" IS '0-25: Crisis, 26-50: Bajo, 51-75: Moderado, 76-100: Bueno';
COMMENT ON COLUMN "AnalisisConversacion"."nivel_urgencia" IS 'bajo: seguimiento regular, medio: atención pronta, alto: intervención, critico: crisis activa';
COMMENT ON COLUMN "ReporteSemanal"."horarios_uso" IS 'JSON con días de semana y horarios de uso: {"lunes": {"08:00": 2}}';
COMMENT ON COLUMN "AlertaUrgente"."tipo_alerta" IS 'Tipo de crisis detectada: ideacion_suicida, plan_suicida, autolesion, etc.';

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================

-- Verificar que todas las tablas se crearon correctamente
DO $$
DECLARE
  tablas_creadas INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO tablas_creadas
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'AnalisisConversacion',
    'ReporteSemanal',
    'ReporteMensual',
    'InsightDashboard',
    'AlertaUrgente',
    'LogGeminiAPI'
  );

  RAISE NOTICE 'Tablas creadas: % de 6', tablas_creadas;

  IF tablas_creadas != 6 THEN
    RAISE EXCEPTION 'No se crearon todas las tablas necesarias';
  END IF;
END $$;
