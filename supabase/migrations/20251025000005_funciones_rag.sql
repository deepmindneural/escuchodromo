-- =====================================================
-- MIGRACIÓN: Funciones RPC para búsqueda RAG
-- Fecha: 2025-10-25
-- Descripción: Funciones de búsqueda semántica, registro
--              de uso y análisis de conocimiento clínico
-- =====================================================

-- =====================================================
-- FUNCIÓN: buscar_conocimiento_similar
-- Descripción: Búsqueda semántica usando similitud coseno
-- Parámetros:
--   - query_embedding: Vector de 768 dims del query
--   - limite: Número máximo de resultados (default 5)
--   - umbral_similitud: Score mínimo requerido (default 0.7)
--   - filtro_categoria: Filtrar por categoría específica
--   - filtro_nivel_evidencia: Filtrar por nivel de evidencia
--   - solo_supervision_opcional: Excluir técnicas que requieren supervisión
-- =====================================================
CREATE OR REPLACE FUNCTION buscar_conocimiento_similar(
  query_embedding vector(768),
  limite INT DEFAULT 5,
  umbral_similitud FLOAT DEFAULT 0.7,
  filtro_categoria TEXT DEFAULT NULL,
  filtro_nivel_evidencia TEXT DEFAULT NULL,
  solo_supervision_opcional BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id uuid,
  categoria text,
  titulo text,
  contenido text,
  descripcion_corta text,
  sintomas_objetivo text[],
  cuando_usar text,
  evidencia_cientifica text,
  nivel_evidencia text,
  keywords text[],
  dificultad text,
  duracion_minutos int,
  requiere_supervision_profesional boolean,
  veces_usada int,
  promedio_utilidad numeric,
  similitud float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.categoria,
    c.titulo,
    c.contenido,
    c.descripcion_corta,
    c.sintomas_objetivo,
    c.cuando_usar,
    c.evidencia_cientifica,
    c.nivel_evidencia,
    c.keywords,
    c.dificultad,
    c.duracion_minutos,
    c.requiere_supervision_profesional,
    c.veces_usada,
    c.promedio_utilidad,
    -- Similitud coseno: 1 - distancia (más cercano a 1 = más similar)
    (1 - (c.embedding <=> query_embedding))::float as similitud
  FROM "ConocimientoClinico" c
  WHERE
    c.activo = true
    AND (1 - (c.embedding <=> query_embedding)) >= umbral_similitud
    AND (filtro_categoria IS NULL OR c.categoria = filtro_categoria)
    AND (filtro_nivel_evidencia IS NULL OR c.nivel_evidencia = filtro_nivel_evidencia)
    AND (NOT solo_supervision_opcional OR c.requiere_supervision_profesional = false)
  ORDER BY c.embedding <=> query_embedding
  LIMIT limite;
END;
$$;

-- =====================================================
-- FUNCIÓN: registrar_uso_conocimiento
-- Descripción: Incrementa contador de uso y actualiza rating
-- Parámetros:
--   - p_conocimiento_id: ID del conocimiento usado
--   - p_fue_util: Feedback booleano (opcional)
--   - p_rating: Rating 1-5 (opcional)
-- =====================================================
CREATE OR REPLACE FUNCTION registrar_uso_conocimiento(
  p_conocimiento_id UUID,
  p_fue_util BOOLEAN DEFAULT NULL,
  p_rating INT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_veces_usada INT;
  v_promedio_actual DECIMAL(3,2);
  v_nuevo_promedio DECIMAL(3,2);
BEGIN
  -- Obtener valores actuales
  SELECT veces_usada, promedio_utilidad
  INTO v_veces_usada, v_promedio_actual
  FROM "ConocimientoClinico"
  WHERE id = p_conocimiento_id;

  -- Si no existe el conocimiento, salir
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calcular nuevo promedio si hay rating
  IF p_rating IS NOT NULL AND p_rating BETWEEN 1 AND 5 THEN
    IF v_promedio_actual IS NULL THEN
      v_nuevo_promedio := p_rating;
    ELSE
      -- Promedio móvil ponderado
      v_nuevo_promedio := (v_promedio_actual * v_veces_usada + p_rating) / (v_veces_usada + 1);
    END IF;
  ELSIF p_fue_util IS NOT NULL THEN
    -- Convertir booleano a rating (útil=5, no útil=1)
    IF v_promedio_actual IS NULL THEN
      v_nuevo_promedio := CASE WHEN p_fue_util THEN 5 ELSE 1 END;
    ELSE
      v_nuevo_promedio := (v_promedio_actual * v_veces_usada + (CASE WHEN p_fue_util THEN 5 ELSE 1 END)) / (v_veces_usada + 1);
    END IF;
  ELSE
    v_nuevo_promedio := v_promedio_actual;
  END IF;

  -- Actualizar registro
  UPDATE "ConocimientoClinico"
  SET
    veces_usada = veces_usada + 1,
    promedio_utilidad = v_nuevo_promedio,
    actualizado_en = now()
  WHERE id = p_conocimiento_id;
END;
$$;

-- =====================================================
-- FUNCIÓN: registrar_busqueda_rag
-- Descripción: Registra una búsqueda RAG en el historial
-- =====================================================
CREATE OR REPLACE FUNCTION registrar_busqueda_rag(
  p_usuario_id UUID,
  p_conversacion_id UUID,
  p_query_original TEXT,
  p_query_embedding vector(768),
  p_resultados_ids UUID[],
  p_scores_similitud DECIMAL[],
  p_conocimiento_usado_id UUID DEFAULT NULL,
  p_filtros_aplicados JSONB DEFAULT NULL,
  p_tiempo_busqueda_ms INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_historial_id UUID;
BEGIN
  INSERT INTO "HistorialRAG" (
    usuario_id,
    conversacion_id,
    query_original,
    query_embedding,
    resultados_ids,
    scores_similitud,
    cantidad_resultados,
    conocimiento_usado_id,
    filtros_aplicados,
    tiempo_busqueda_ms
  ) VALUES (
    p_usuario_id,
    p_conversacion_id,
    p_query_original,
    p_query_embedding,
    p_resultados_ids,
    p_scores_similitud,
    array_length(p_resultados_ids, 1),
    p_conocimiento_usado_id,
    p_filtros_aplicados,
    p_tiempo_busqueda_ms
  )
  RETURNING id INTO v_historial_id;

  RETURN v_historial_id;
END;
$$;

-- =====================================================
-- FUNCIÓN: actualizar_feedback_rag
-- Descripción: Actualiza feedback del usuario sobre respuesta RAG
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_feedback_rag(
  p_historial_id UUID,
  p_fue_util BOOLEAN,
  p_rating INT DEFAULT NULL,
  p_feedback_texto TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conocimiento_id UUID;
BEGIN
  -- Actualizar feedback en el historial
  UPDATE "HistorialRAG"
  SET
    fue_util = p_fue_util,
    rating_respuesta = p_rating,
    feedback_texto = p_feedback_texto
  WHERE id = p_historial_id
  RETURNING conocimiento_usado_id INTO v_conocimiento_id;

  -- Si se usó un conocimiento específico, actualizar sus métricas
  IF v_conocimiento_id IS NOT NULL THEN
    PERFORM registrar_uso_conocimiento(v_conocimiento_id, p_fue_util, p_rating);
  END IF;
END;
$$;

-- =====================================================
-- FUNCIÓN: obtener_estadisticas_conocimiento
-- Descripción: Obtiene estadísticas de uso de conocimientos
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_conocimiento(
  p_dias_atras INT DEFAULT 30,
  p_limite INT DEFAULT 10
)
RETURNS TABLE (
  conocimiento_id uuid,
  titulo text,
  categoria text,
  veces_usada int,
  promedio_utilidad numeric,
  veces_usado_periodo int,
  promedio_rating_periodo numeric,
  porcentaje_util numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.titulo,
    c.categoria,
    c.veces_usada,
    c.promedio_utilidad,
    COUNT(h.id)::int as veces_usado_periodo,
    AVG(h.rating_respuesta)::numeric(3,2) as promedio_rating_periodo,
    (COUNT(CASE WHEN h.fue_util = true THEN 1 END)::numeric / NULLIF(COUNT(h.id), 0) * 100)::numeric(5,2) as porcentaje_util
  FROM "ConocimientoClinico" c
  LEFT JOIN "HistorialRAG" h ON h.conocimiento_usado_id = c.id
    AND h.creado_en >= now() - (p_dias_atras || ' days')::interval
  WHERE c.activo = true
  GROUP BY c.id, c.titulo, c.categoria, c.veces_usada, c.promedio_utilidad
  ORDER BY veces_usado_periodo DESC, c.promedio_utilidad DESC NULLS LAST
  LIMIT p_limite;
END;
$$;

-- =====================================================
-- FUNCIÓN: buscar_conocimiento_por_sintomas
-- Descripción: Búsqueda por síntomas objetivo (sin embeddings)
-- =====================================================
CREATE OR REPLACE FUNCTION buscar_conocimiento_por_sintomas(
  p_sintomas TEXT[],
  p_limite INT DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  categoria text,
  titulo text,
  descripcion_corta text,
  sintomas_objetivo text[],
  nivel_evidencia text,
  dificultad text,
  coincidencias_sintomas int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.categoria,
    c.titulo,
    c.descripcion_corta,
    c.sintomas_objetivo,
    c.nivel_evidencia,
    c.dificultad,
    -- Contar cuántos síntomas coinciden
    (
      SELECT COUNT(*)::int
      FROM unnest(c.sintomas_objetivo) s
      WHERE s = ANY(p_sintomas)
    ) as coincidencias_sintomas
  FROM "ConocimientoClinico" c
  WHERE
    c.activo = true
    AND c.sintomas_objetivo && p_sintomas -- Operador de intersección de arrays
  ORDER BY coincidencias_sintomas DESC, c.promedio_utilidad DESC NULLS LAST
  LIMIT p_limite;
END;
$$;

-- =====================================================
-- FUNCIÓN: obtener_conocimientos_recomendados
-- Descripción: Obtiene conocimientos recomendados según
--              historial del usuario y categoría
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_conocimientos_recomendados(
  p_usuario_id UUID,
  p_categoria TEXT DEFAULT NULL,
  p_limite INT DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  categoria text,
  titulo text,
  descripcion_corta text,
  nivel_evidencia text,
  promedio_utilidad numeric,
  razon_recomendacion text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Conocimientos mejor valorados que el usuario no ha usado
  SELECT
    c.id,
    c.categoria,
    c.titulo,
    c.descripcion_corta,
    c.nivel_evidencia,
    c.promedio_utilidad,
    'Alto rating y evidencia científica'::text as razon_recomendacion
  FROM "ConocimientoClinico" c
  WHERE
    c.activo = true
    AND (p_categoria IS NULL OR c.categoria = p_categoria)
    AND c.promedio_utilidad >= 4.0
    AND c.nivel_evidencia IN ('alta', 'media')
    AND NOT EXISTS (
      SELECT 1 FROM "HistorialRAG" h
      WHERE h.usuario_id = p_usuario_id
      AND h.conocimiento_usado_id = c.id
    )
  ORDER BY c.promedio_utilidad DESC, c.veces_usada DESC
  LIMIT p_limite;
END;
$$;

-- =====================================================
-- GRANTS: Permisos de ejecución
-- =====================================================
GRANT EXECUTE ON FUNCTION buscar_conocimiento_similar TO authenticated;
GRANT EXECUTE ON FUNCTION registrar_uso_conocimiento TO authenticated;
GRANT EXECUTE ON FUNCTION registrar_busqueda_rag TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_feedback_rag TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_estadisticas_conocimiento TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_conocimiento_por_sintomas TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_conocimientos_recomendados TO authenticated;

-- Service role tiene acceso completo
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION buscar_conocimiento_similar IS 'Búsqueda semántica de conocimiento clínico usando embeddings de Gemini. Retorna los K conocimientos más similares según similitud coseno.';
COMMENT ON FUNCTION registrar_uso_conocimiento IS 'Incrementa contador de uso y actualiza rating promedio de un conocimiento clínico.';
COMMENT ON FUNCTION registrar_busqueda_rag IS 'Registra una búsqueda RAG completa en el historial para análisis y auditoría.';
COMMENT ON FUNCTION actualizar_feedback_rag IS 'Actualiza el feedback del usuario sobre una respuesta RAG y propaga métricas al conocimiento usado.';
COMMENT ON FUNCTION obtener_estadisticas_conocimiento IS 'Obtiene estadísticas de uso y utilidad de conocimientos clínicos en un período.';
COMMENT ON FUNCTION buscar_conocimiento_por_sintomas IS 'Búsqueda por coincidencia de síntomas objetivo (útil cuando no hay embeddings disponibles).';
COMMENT ON FUNCTION obtener_conocimientos_recomendados IS 'Recomienda conocimientos al usuario basándose en ratings, evidencia y contenido no visto.';
