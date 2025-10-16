-- =====================================================
-- SETUP FINAL ADAPTATIVO - ESCUCHODROMO
-- Ejecutar en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- =====================================================
-- Este script se adapta automáticamente al tipo de dato de auth_id
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PASO 1: DETECTAR TIPO DE DATO DE auth_id
-- =====================================================

DO $$
DECLARE
  auth_id_type TEXT;
BEGIN
  -- Detectar tipo de dato de auth_id si la tabla existe
  SELECT data_type INTO auth_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Usuario'
    AND column_name = 'auth_id';

  IF auth_id_type IS NOT NULL THEN
    RAISE NOTICE 'Tipo de dato auth_id detectado: %', auth_id_type;
  ELSE
    RAISE NOTICE 'Tabla Usuario no existe o no tiene columna auth_id';
  END IF;
END $$;

-- =====================================================
-- PASO 2: CREAR/VERIFICAR TABLA TEST
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Test'
  ) THEN
    CREATE TABLE "Test" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      codigo TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      categoria TEXT,
      creado_en TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_test_codigo ON "Test"(codigo);

    -- Insertar tests básicos
    INSERT INTO "Test" (id, codigo, nombre, descripcion, categoria) VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'PHQ-9', 'Cuestionario de Salud del Paciente - 9', 'Evaluación de síntomas de depresión', 'Salud Mental'),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'GAD-7', 'Trastorno de Ansiedad Generalizada - 7', 'Evaluación de síntomas de ansiedad', 'Salud Mental');

    RAISE NOTICE '✅ Tabla Test creada';
  ELSE
    RAISE NOTICE '✅ Tabla Test ya existe';
  END IF;
END $$;

-- =====================================================
-- PASO 3: CREAR TABLA RESULTADO
-- =====================================================

DROP TABLE IF EXISTS "Resultado" CASCADE;

CREATE TABLE "Resultado" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  test_id UUID REFERENCES "Test"(id) ON DELETE SET NULL,
  puntuacion INTEGER NOT NULL,
  severidad TEXT,
  respuestas JSONB,
  interpretacion TEXT,
  recomendaciones TEXT[],
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar foreign key solo si Usuario existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Usuario'
  ) THEN
    ALTER TABLE "Resultado"
      ADD CONSTRAINT fk_resultado_usuario
      FOREIGN KEY (usuario_id) REFERENCES "Usuario"(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Foreign key agregada a Resultado';
  ELSE
    RAISE NOTICE '⚠️ Usuario no existe, FK no agregada a Resultado';
  END IF;
END $$;

-- Índices
CREATE INDEX idx_resultado_usuario ON "Resultado"(usuario_id);
CREATE INDEX idx_resultado_test ON "Resultado"(test_id);
CREATE INDEX idx_resultado_creado ON "Resultado"(creado_en DESC);
CREATE INDEX idx_resultado_severidad ON "Resultado"(severidad);

-- Trigger
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

-- RLS
ALTER TABLE "Resultado" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 4: CREAR TABLA REGISTROANIMO
-- =====================================================

DROP TABLE IF EXISTS "RegistroAnimo" CASCADE;

CREATE TABLE "RegistroAnimo" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  animo INTEGER NOT NULL CHECK (animo BETWEEN 1 AND 10),
  energia INTEGER CHECK (energia BETWEEN 1 AND 10),
  estres INTEGER CHECK (estres BETWEEN 1 AND 10),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar foreign key solo si Usuario existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Usuario'
  ) THEN
    ALTER TABLE "RegistroAnimo"
      ADD CONSTRAINT fk_registro_animo_usuario
      FOREIGN KEY (usuario_id) REFERENCES "Usuario"(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Foreign key agregada a RegistroAnimo';
  ELSE
    RAISE NOTICE '⚠️ Usuario no existe, FK no agregada a RegistroAnimo';
  END IF;
END $$;

-- Índices
CREATE INDEX idx_registro_animo_usuario ON "RegistroAnimo"(usuario_id);
CREATE INDEX idx_registro_animo_creado ON "RegistroAnimo"(creado_en DESC);

-- RLS
ALTER TABLE "RegistroAnimo" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 5: CREAR POLÍTICAS RLS (ADAPTATIVAS)
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "usuarios_ven_resultados" ON "Resultado";
DROP POLICY IF EXISTS "usuarios_insertan_resultados" ON "Resultado";
DROP POLICY IF EXISTS "service_role_resultado_all" ON "Resultado";
DROP POLICY IF EXISTS "usuarios_ven_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "usuarios_insertan_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "usuarios_actualizan_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "usuarios_eliminan_animo" ON "RegistroAnimo";
DROP POLICY IF EXISTS "service_role_animo_all" ON "RegistroAnimo";

-- Crear políticas adaptativas según el tipo de auth_id
DO $$
DECLARE
  auth_id_type TEXT;
  policy_condition TEXT;
BEGIN
  -- Detectar tipo de dato de auth_id
  SELECT data_type INTO auth_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Usuario'
    AND column_name = 'auth_id';

  -- Construir condición según tipo
  IF auth_id_type = 'uuid' THEN
    policy_condition := 'auth.uid()';
    RAISE NOTICE 'Usando políticas para auth_id tipo UUID';
  ELSIF auth_id_type = 'text' THEN
    policy_condition := 'auth.uid()::text';
    RAISE NOTICE 'Usando políticas para auth_id tipo TEXT';
  ELSE
    -- Default a UUID si no se puede detectar
    policy_condition := 'auth.uid()';
    RAISE NOTICE 'Tipo no detectado, usando UUID por defecto';
  END IF;

  -- Políticas para Resultado
  EXECUTE format('
    CREATE POLICY "usuarios_ven_resultados"
      ON "Resultado" FOR SELECT
      TO authenticated
      USING (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition);

  EXECUTE format('
    CREATE POLICY "usuarios_insertan_resultados"
      ON "Resultado" FOR INSERT
      TO authenticated
      WITH CHECK (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition);

  CREATE POLICY "service_role_resultado_all"
    ON "Resultado" FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  -- Políticas para RegistroAnimo
  EXECUTE format('
    CREATE POLICY "usuarios_ven_animo"
      ON "RegistroAnimo" FOR SELECT
      TO authenticated
      USING (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition);

  EXECUTE format('
    CREATE POLICY "usuarios_insertan_animo"
      ON "RegistroAnimo" FOR INSERT
      TO authenticated
      WITH CHECK (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition);

  EXECUTE format('
    CREATE POLICY "usuarios_actualizan_animo"
      ON "RegistroAnimo" FOR UPDATE
      TO authenticated
      USING (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
      WITH CHECK (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition, policy_condition);

  EXECUTE format('
    CREATE POLICY "usuarios_eliminan_animo"
      ON "RegistroAnimo" FOR DELETE
      TO authenticated
      USING (
        usuario_id IN (
          SELECT id FROM "Usuario" WHERE auth_id = %s
        )
      )
  ', policy_condition);

  CREATE POLICY "service_role_animo_all"
    ON "RegistroAnimo" FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  RAISE NOTICE '✅ Políticas RLS creadas correctamente';
END $$;

-- =====================================================
-- PASO 6: VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
  tabla_count INTEGER;
  politica_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tabla_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('Resultado', 'RegistroAnimo', 'Test');

  SELECT COUNT(*) INTO politica_count
  FROM pg_policies
  WHERE tablename IN ('Resultado', 'RegistroAnimo');

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ SETUP COMPLETADO EXITOSAMENTE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas: %', tabla_count;
  RAISE NOTICE 'Políticas RLS: %', politica_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ahora puedes usar:';
  RAISE NOTICE '  - Sistema de evaluaciones (PHQ-9, GAD-7)';
  RAISE NOTICE '  - Seguimiento de ánimo diario';
  RAISE NOTICE '  - Recomendaciones personalizadas con IA';
  RAISE NOTICE '';
END $$;

-- Mostrar resumen de tablas creadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as politicas_rls
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('Test', 'Resultado', 'RegistroAnimo')
ORDER BY table_name;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
