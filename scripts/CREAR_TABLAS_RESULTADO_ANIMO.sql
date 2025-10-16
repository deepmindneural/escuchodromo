-- =====================================================
-- CREAR TABLAS FALTANTES: Resultado y RegistroAnimo
-- Ejecutar en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- =====================================================

-- =====================================================
-- 1. TABLA DE RESULTADOS DE EVALUACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS "Resultado" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE,
  test_id UUID REFERENCES "Test"(id) ON DELETE SET NULL,
  puntuacion INTEGER NOT NULL,
  severidad TEXT,
  respuestas JSONB,
  interpretacion TEXT,
  recomendaciones TEXT[],
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Resultado
CREATE INDEX IF NOT EXISTS idx_resultado_usuario ON "Resultado"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resultado_test ON "Resultado"(test_id);
CREATE INDEX IF NOT EXISTS idx_resultado_creado ON "Resultado"(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_resultado_severidad ON "Resultado"(severidad);

-- =====================================================
-- 2. TABLA DE REGISTRO DE ÁNIMO
-- =====================================================
CREATE TABLE IF NOT EXISTS "RegistroAnimo" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE,
  animo INTEGER NOT NULL CHECK (animo BETWEEN 1 AND 10),
  energia INTEGER CHECK (energia BETWEEN 1 AND 10),
  estres INTEGER CHECK (estres BETWEEN 1 AND 10),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para RegistroAnimo
CREATE INDEX IF NOT EXISTS idx_registro_animo_usuario ON "RegistroAnimo"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registro_animo_creado ON "RegistroAnimo"(creado_en DESC);

-- =====================================================
-- 3. TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

-- Trigger para Resultado
CREATE OR REPLACE FUNCTION update_resultado_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_resultado_timestamp ON "Resultado";
CREATE TRIGGER trigger_update_resultado_timestamp
  BEFORE UPDATE ON "Resultado"
  FOR EACH ROW
  EXECUTE FUNCTION update_resultado_timestamp();

-- =====================================================
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE "Resultado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistroAnimo" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. POLÍTICAS RLS PARA RESULTADO
-- =====================================================

-- Usuarios pueden ver sus propios resultados
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios resultados" ON "Resultado";
CREATE POLICY "Usuarios pueden ver sus propios resultados"
  ON "Resultado" FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Usuarios pueden insertar sus propios resultados
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios resultados" ON "Resultado";
CREATE POLICY "Usuarios pueden insertar sus propios resultados"
  ON "Resultado" FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Service role puede hacer todo en Resultado
DROP POLICY IF EXISTS "Service role puede hacer todo en Resultado" ON "Resultado";
CREATE POLICY "Service role puede hacer todo en Resultado"
  ON "Resultado" FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. POLÍTICAS RLS PARA REGISTROANIMO
-- =====================================================

-- Usuarios pueden ver sus propios registros de ánimo
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios registros de animo" ON "RegistroAnimo";
CREATE POLICY "Usuarios pueden ver sus propios registros de animo"
  ON "RegistroAnimo" FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Usuarios pueden insertar sus propios registros de ánimo
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios registros de animo" ON "RegistroAnimo";
CREATE POLICY "Usuarios pueden insertar sus propios registros de animo"
  ON "RegistroAnimo" FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Usuarios pueden actualizar sus propios registros de ánimo
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios registros de animo" ON "RegistroAnimo";
CREATE POLICY "Usuarios pueden actualizar sus propios registros de animo"
  ON "RegistroAnimo" FOR UPDATE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  )
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Usuarios pueden eliminar sus propios registros de ánimo
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios registros de animo" ON "RegistroAnimo";
CREATE POLICY "Usuarios pueden eliminar sus propios registros de animo"
  ON "RegistroAnimo" FOR DELETE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Service role puede hacer todo en RegistroAnimo
DROP POLICY IF EXISTS "Service role puede hacer todo en RegistroAnimo" ON "RegistroAnimo";
CREATE POLICY "Service role puede hacer todo en RegistroAnimo"
  ON "RegistroAnimo" FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. VERIFICAR CREACIÓN DE TABLAS
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('Resultado', 'RegistroAnimo')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('Resultado', 'RegistroAnimo')
ORDER BY tablename, policyname;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
