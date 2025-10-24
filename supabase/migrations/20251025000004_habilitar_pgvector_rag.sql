-- =====================================================
-- MIGRACIÓN: Habilitar pgvector y crear tablas RAG
-- Fecha: 2025-10-25
-- Descripción: Sistema de Retrieval-Augmented Generation
--              con pgvector para base de conocimiento clínico
-- =====================================================

-- Habilitar extensión pgvector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLA: ConocimientoClinico
-- Descripción: Base de conocimiento clínico vectorizada
-- =====================================================
CREATE TABLE IF NOT EXISTS "ConocimientoClinico" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadata del contenido clínico
  categoria TEXT NOT NULL CHECK (categoria IN (
    'tecnica_ansiedad',
    'tecnica_depresion',
    'tecnica_estres',
    'psicoeducacion',
    'crisis',
    'autoayuda',
    'mindfulness',
    'tcc',
    'dbt',
    'act',
    'terapia_cognitiva',
    'terapia_conductual',
    'inteligencia_emocional',
    'relaciones',
    'trauma',
    'duelo'
  )),

  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  descripcion_corta TEXT,

  -- Cuándo usar esta técnica/conocimiento
  sintomas_objetivo TEXT[],
  cuando_usar TEXT,

  -- Evidencia científica y validación
  evidencia_cientifica TEXT,
  nivel_evidencia TEXT CHECK (nivel_evidencia IN ('alta', 'media', 'baja')),
  referencias_bibliograficas TEXT[],

  -- Búsqueda semántica con Gemini text-embedding-004
  -- Dimensión: 768 (embeddings de Gemini)
  embedding vector(768),

  -- Metadata adicional para filtrado
  keywords TEXT[],
  dificultad TEXT CHECK (dificultad IN ('facil', 'media', 'avanzada')),
  duracion_minutos INT,
  requiere_supervision_profesional BOOLEAN DEFAULT false,

  -- Control de calidad y estadísticas
  activo BOOLEAN DEFAULT true,
  veces_usada INT DEFAULT 0,
  promedio_utilidad DECIMAL(3,2), -- Rating 1.00 - 5.00

  -- Auditoría
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  creado_por UUID REFERENCES "Usuario"(id),
  actualizado_por UUID REFERENCES "Usuario"(id)
);

-- =====================================================
-- ÍNDICES para ConocimientoClinico
-- =====================================================

-- Índice para búsqueda vectorial usando HNSW
-- HNSW (Hierarchical Navigable Small World) es más rápido que IVFFlat
-- Usamos vector_cosine_ops para similitud del coseno (1 - distancia)
CREATE INDEX IF NOT EXISTS idx_conocimiento_embedding
  ON "ConocimientoClinico"
  USING hnsw (embedding vector_cosine_ops);

-- Índices para filtrado rápido
CREATE INDEX idx_conocimiento_categoria ON "ConocimientoClinico"(categoria) WHERE activo = true;
CREATE INDEX idx_conocimiento_activo ON "ConocimientoClinico"(activo);
CREATE INDEX idx_conocimiento_nivel_evidencia ON "ConocimientoClinico"(nivel_evidencia) WHERE activo = true;
CREATE INDEX idx_conocimiento_dificultad ON "ConocimientoClinico"(dificultad) WHERE activo = true;

-- Índice GIN para búsqueda de arrays
CREATE INDEX idx_conocimiento_sintomas ON "ConocimientoClinico" USING gin(sintomas_objetivo);
CREATE INDEX idx_conocimiento_keywords ON "ConocimientoClinico" USING gin(keywords);

-- Índice compuesto para queries frecuentes
CREATE INDEX idx_conocimiento_categoria_evidencia ON "ConocimientoClinico"(categoria, nivel_evidencia) WHERE activo = true;

-- =====================================================
-- TABLA: HistorialRAG
-- Descripción: Registro de búsquedas RAG para análisis
--              y mejora continua del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS "HistorialRAG" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE,
  conversacion_id UUID REFERENCES "Conversacion"(id) ON DELETE CASCADE,

  -- Query del usuario
  query_original TEXT NOT NULL,
  query_embedding vector(768),
  query_categoria_inferida TEXT, -- Categoría inferida del query

  -- Filtros aplicados en la búsqueda
  filtros_aplicados JSONB,

  -- Resultados recuperados (top K)
  resultados_ids UUID[],
  scores_similitud DECIMAL[],
  cantidad_resultados INT,

  -- Resultado usado en la respuesta final
  conocimiento_usado_id UUID REFERENCES "ConocimientoClinico"(id) ON DELETE SET NULL,

  -- Feedback del usuario sobre la utilidad
  fue_util BOOLEAN,
  rating_respuesta INT CHECK (rating_respuesta >= 1 AND rating_respuesta <= 5),
  feedback_texto TEXT,

  -- Métricas de rendimiento
  tiempo_busqueda_ms INT,
  tiempo_generacion_ms INT,

  -- Auditoría
  creado_en TIMESTAMP DEFAULT now()
);

-- =====================================================
-- ÍNDICES para HistorialRAG
-- =====================================================
CREATE INDEX idx_historial_rag_usuario ON "HistorialRAG"(usuario_id);
CREATE INDEX idx_historial_rag_conversacion ON "HistorialRAG"(conversacion_id);
CREATE INDEX idx_historial_rag_conocimiento ON "HistorialRAG"(conocimiento_usado_id);
CREATE INDEX idx_historial_rag_fecha ON "HistorialRAG"(creado_en DESC);
CREATE INDEX idx_historial_rag_util ON "HistorialRAG"(fue_util) WHERE fue_util IS NOT NULL;

-- Índice para análisis de rendimiento
CREATE INDEX idx_historial_rag_metricas ON "HistorialRAG"(tiempo_busqueda_ms, tiempo_generacion_ms);

-- =====================================================
-- TRIGGER: Actualizar timestamp automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp_conocimiento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_conocimiento
  BEFORE UPDATE ON "ConocimientoClinico"
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_conocimiento();

-- =====================================================
-- COMENTARIOS de documentación
-- =====================================================
COMMENT ON TABLE "ConocimientoClinico" IS 'Base de conocimiento clínico vectorizada para RAG en chat de IA. Almacena técnicas psicoterapéuticas, psicoeducación y recursos validados científicamente.';
COMMENT ON COLUMN "ConocimientoClinico".embedding IS 'Vector de 768 dimensiones generado con Gemini text-embedding-004 para búsqueda semántica.';
COMMENT ON COLUMN "ConocimientoClinico".nivel_evidencia IS 'Nivel de evidencia científica: alta (meta-análisis, RCT), media (estudios controlados), baja (estudios observacionales).';
COMMENT ON COLUMN "ConocimientoClinico".veces_usada IS 'Contador de veces que este conocimiento fue usado en respuestas del chatbot.';
COMMENT ON COLUMN "ConocimientoClinico".promedio_utilidad IS 'Rating promedio de utilidad basado en feedback de usuarios (1.00 - 5.00).';

COMMENT ON TABLE "HistorialRAG" IS 'Registro histórico de búsquedas RAG para análisis de rendimiento, mejora del sistema y auditoría de uso.';
COMMENT ON COLUMN "HistorialRAG".query_embedding IS 'Embedding del query del usuario para análisis de similitud y agrupamiento de consultas.';
COMMENT ON COLUMN "HistorialRAG".scores_similitud IS 'Array de scores de similitud (0.0 - 1.0) para cada resultado recuperado, ordenados de mayor a menor.';
COMMENT ON COLUMN "HistorialRAG".filtros_aplicados IS 'JSON con filtros aplicados en la búsqueda (ej: {"categoria": "tecnica_ansiedad", "nivel_evidencia": "alta"})';

-- =====================================================
-- GRANTS: Permisos iniciales
-- =====================================================

-- Los usuarios autenticados pueden leer conocimiento activo
-- (más policies específicas en la siguiente migración)
GRANT SELECT ON "ConocimientoClinico" TO authenticated;
GRANT SELECT ON "HistorialRAG" TO authenticated;

-- Service role tiene permisos completos (usado por Edge Functions)
GRANT ALL ON "ConocimientoClinico" TO service_role;
GRANT ALL ON "HistorialRAG" TO service_role;
