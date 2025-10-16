-- =====================================================
-- CREAR TABLAS FALTANTES: Resultado y RegistroAnimo (CORREGIDO)
-- Ejecutar en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICAR ESTRUCTURA DE TABLA USUARIO
-- =====================================================

-- Ver estructura actual de la tabla Usuario
DO $$
BEGIN
  RAISE NOTICE 'Verificando estructura de tabla Usuario...';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Usuario'
ORDER BY ordinal_position;

-- =====================================================
-- PASO 2: CREAR TABLA RESULTADO
-- =====================================================

-- Eliminar tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS "Resultado" CASCADE;

-- Crear tabla Resultado
CREATE TABLE "Resultado" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  test_id UUID,
  puntuacion INTEGER NOT NULL,
  severidad TEXT,
  respuestas JSONB,
  interpretacion TEXT,
  recomendaciones TEXT[],
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar foreign key constraint DESPUÉS de crear la tabla
-- Esto permite que la tabla se cree incluso si Usuario no existe aún
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Usuario'
  ) THEN
    ALTER TABLE "Resultado"
      ADD CONSTRAINT fk_resultado_usuario
      FOREIGN KEY (usuario_id) REFERENCES "Usuario"(id) ON DELETE CASCADE;
    RAISE NOTICE 'Foreign key constraint agregada para usuario_id';
  ELSE
    RAISE NOTICE 'Tabla Usuario no encontrada, foreign key no agregada';
  END IF;
END $$;

-- Índices para Resultado
CREATE INDEX IF NOT EXISTS idx_resultado_usuario ON "Resultado"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resultado_test ON "Resultado"(test_id);
CREATE INDEX IF NOT EXISTS idx_resultado_creado ON "Resultado"(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_resultado_severidad ON "Resultado"(severidad);

-- =====================================================
-- PASO 3: CREAR TABLA REGISTROANIMO
-- =====================================================

-- Eliminar tabla si existe
DROP TABLE IF EXISTS "RegistroAnimo" CASCADE;

-- Crear tabla RegistroAnimo
CREATE TABLE "RegistroAnimo" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  animo INTEGER NOT NULL CHECK (animo BETWEEN 1 AND 10),
  energia INTEGER CHECK (energia BETWEEN 1 AND 10),
  estres INTEGER CHECK (estres BETWEEN 1 AND 10),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Usuario'
  ) THEN
    ALTER TABLE "RegistroAnimo"
      ADD CONSTRAINT fk_registro_animo_usuario
      FOREIGN KEY (usuario_id) REFERENCES "Usuario"(id) ON DELETE CASCADE;
    RAISE NOTICE 'Foreign key constraint agregada para usuario_id en RegistroAnimo';
  ELSE
    RAISE NOTICE 'Tabla Usuario no encontrada, foreign key no agregada para RegistroAnimo';
  END IF;
END $$;

-- Índices para RegistroAnimo
CREATE INDEX IF NOT EXISTS idx_registro_animo_usuario ON "RegistroAnimo"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registro_animo_creado ON "RegistroAnimo"(creado_en DESC);

-- =====================================================
-- PASO 4: TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

-- Función para actualizar timestamps (puede existir ya)
CREATE OR REPLACE FUNCTION update_resultado_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Resultado
DROP TRIGGER IF EXISTS trigger_update_resultado_timestamp ON "Resultado";
CREATE TRIGGER trigger_update_resultado_timestamp
  BEFORE UPDATE ON "Resultado"
  FOR EACH ROW
  EXECUTE FUNCTION update_resultado_timestamp();

-- =====================================================
-- PASO 5: HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE "Resultado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistroAnimo" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 6: POLÍTICAS RLS PARA RESULTADO
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "usuarios_pueden_ver_resultados" ON "Resultado";
DROP POLICY IF EXISTS "usuarios_pueden_insertar_resultados" ON "Resultado";
DROP POLICY IF EXISTS "service_role_resultado_all" ON "Resultado";

-- Política: Usuarios pueden ver sus propios resultados
CREATE POLICY "usuarios_pueden_ver_resultados"
  ON "Resultado"
  FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Política: Usuarios pueden insertar sus propios resultados
CREATE POLICY "usuarios_pueden_insertar_resultados"
  ON "Resultado"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Política: Service role acceso total
CREATE POLICY "service_role_resultado_all"
  ON "Resultado"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PASO 7: POLÍTICAS RLS PARA REGISTROANIMO
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "usuarios_pueden_ver_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "usuarios_pueden_insertar_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "usuarios_pueden_actualizar_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "usuarios_pueden_eliminar_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "service_role_animo_all" ON "RegistroAnimo";

-- Política: Ver registros propios
CREATE POLICY "usuarios_pueden_ver_animo"
  ON "RegistroAnimo"
  FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Política: Insertar registros propios
CREATE POLICY "usuarios_pueden_insertar_animo"
  ON "RegistroAnimo"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Política: Actualizar registros propios
CREATE POLICY "usuarios_pueden_actualizar_animo"
  ON "RegistroAnimo"
  FOR UPDATE
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

-- Política: Eliminar registros propios
CREATE POLICY "usuarios_pueden_eliminar_animo"
  ON "RegistroAnimo"
  FOR DELETE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

-- Política: Service role acceso total
CREATE POLICY "service_role_animo_all"
  ON "RegistroAnimo"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PASO 8: VERIFICAR CREACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('Resultado', 'RegistroAnimo')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('Resultado', 'RegistroAnimo')
ORDER BY tablename, policyname;

-- Verificar foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('Resultado', 'RegistroAnimo');

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '✅ Tablas Resultado y RegistroAnimo creadas exitosamente';
  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Índices creados';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE: Si ves warnings sobre Usuario, ejecuta primero el script que crea esa tabla';
END $$;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
