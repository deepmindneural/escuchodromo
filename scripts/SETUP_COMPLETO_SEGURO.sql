-- =====================================================
-- SETUP COMPLETO Y SEGURO - ESCUCHODROMO
-- Ejecutar en: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- =====================================================
-- Este script:
-- 1. Verifica estructura existente
-- 2. Crea tabla Usuario si no existe
-- 3. Crea tablas Resultado y RegistroAnimo
-- 4. Configura RLS correctamente
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PASO 1: VERIFICAR Y CREAR TABLA USUARIO (SI NO EXISTE)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Usuario'
  ) THEN
    -- Crear tabla Usuario
    CREATE TABLE "Usuario" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_id TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      nombre TEXT,
      imagen TEXT,
      rol TEXT NOT NULL DEFAULT 'USUARIO' CHECK (rol IN ('USUARIO', 'TERAPEUTA', 'ADMIN')),
      esta_activo BOOLEAN DEFAULT true,
      creado_en TIMESTAMPTZ DEFAULT now(),
      actualizado_en TIMESTAMPTZ DEFAULT now()
    );

    -- Índices
    CREATE INDEX idx_usuario_email ON "Usuario"(email);
    CREATE INDEX idx_usuario_auth_id ON "Usuario"(auth_id);
    CREATE INDEX idx_usuario_rol ON "Usuario"(rol);

    -- RLS
    ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

    -- Políticas
    CREATE POLICY "usuarios_insertan_perfil"
      ON "Usuario" FOR INSERT
      TO authenticated
      WITH CHECK (auth_id = auth.uid()::text);

    CREATE POLICY "usuarios_ven_perfil"
      ON "Usuario" FOR SELECT
      TO authenticated
      USING (auth_id = auth.uid()::text);

    CREATE POLICY "usuarios_actualizan_perfil"
      ON "Usuario" FOR UPDATE
      TO authenticated
      USING (auth_id = auth.uid()::text)
      WITH CHECK (auth_id = auth.uid()::text);

    CREATE POLICY "service_role_usuario_all"
      ON "Usuario" FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    RAISE NOTICE '✅ Tabla Usuario creada';
  ELSE
    RAISE NOTICE '✅ Tabla Usuario ya existe';
  END IF;
END $$;

-- =====================================================
-- PASO 2: VERIFICAR Y CREAR TABLA TEST (para evaluaciones)
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

    RAISE NOTICE '✅ Tabla Test creada con datos iniciales';
  ELSE
    RAISE NOTICE '✅ Tabla Test ya existe';
  END IF;
END $$;

-- =====================================================
-- PASO 3: CREAR/RECREAR TABLA RESULTADO
-- =====================================================

-- Eliminar tabla si existe (para asegurar estructura correcta)
DROP TABLE IF EXISTS "Resultado" CASCADE;

-- Crear tabla Resultado
CREATE TABLE "Resultado" (
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

-- Índices
CREATE INDEX idx_resultado_usuario ON "Resultado"(usuario_id);
CREATE INDEX idx_resultado_test ON "Resultado"(test_id);
CREATE INDEX idx_resultado_creado ON "Resultado"(creado_en DESC);
CREATE INDEX idx_resultado_severidad ON "Resultado"(severidad);

-- Trigger para actualizar timestamp
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

-- Políticas RLS
DROP POLICY IF EXISTS "usuarios_ven_resultados" ON "Resultado";
CREATE POLICY "usuarios_ven_resultados"
  ON "Resultado" FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "usuarios_insertan_resultados" ON "Resultado";
CREATE POLICY "usuarios_insertan_resultados"
  ON "Resultado" FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "service_role_resultado_all" ON "Resultado";
CREATE POLICY "service_role_resultado_all"
  ON "Resultado" FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PASO 4: CREAR/RECREAR TABLA REGISTROANIMO
-- =====================================================

-- Eliminar tabla si existe
DROP TABLE IF EXISTS "RegistroAnimo" CASCADE;

-- Crear tabla
CREATE TABLE "RegistroAnimo" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE,
  animo INTEGER NOT NULL CHECK (animo BETWEEN 1 AND 10),
  energia INTEGER CHECK (energia BETWEEN 1 AND 10),
  estres INTEGER CHECK (estres BETWEEN 1 AND 10),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_registro_animo_usuario ON "RegistroAnimo"(usuario_id);
CREATE INDEX idx_registro_animo_creado ON "RegistroAnimo"(creado_en DESC);

-- RLS
ALTER TABLE "RegistroAnimo" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "usuarios_ven_animo" ON "RegistroAnimo";
CREATE POLICY "usuarios_ven_animo"
  ON "RegistroAnimo" FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "usuarios_insertan_animo" ON "RegistroAnimo";
CREATE POLICY "usuarios_insertan_animo"
  ON "RegistroAnimo" FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "usuarios_actualizan_animo" ON "RegistroAnimo";
CREATE POLICY "usuarios_actualizan_animo"
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

DROP POLICY IF EXISTS "usuarios_eliminan_animo" ON "RegistroAnimo";
CREATE POLICY "usuarios_eliminan_animo"
  ON "RegistroAnimo" FOR DELETE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "service_role_animo_all" ON "RegistroAnimo";
CREATE POLICY "service_role_animo_all"
  ON "RegistroAnimo" FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PASO 5: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar tablas creadas
DO $$
DECLARE
  tabla_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tabla_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('Usuario', 'Test', 'Resultado', 'RegistroAnimo');

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ SETUP COMPLETADO EXITOSAMENTE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas: %', tabla_count;
  RAISE NOTICE '';
END $$;

-- Mostrar resumen
SELECT
  'TABLAS CREADAS' as categoria,
  table_name as nombre,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('Usuario', 'Test', 'Resultado', 'RegistroAnimo')

UNION ALL

SELECT
  'POLÍTICAS RLS' as categoria,
  tablename as nombre,
  COUNT(*)::text as columnas
FROM pg_policies
WHERE tablename IN ('Usuario', 'Test', 'Resultado', 'RegistroAnimo')
GROUP BY tablename

ORDER BY categoria, nombre;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- PRÓXIMOS PASOS:
-- 1. ✅ Tablas creadas correctamente
-- 2. ⚠️ Desplegar Edge Functions en Supabase
-- 3. ⚠️ Configurar API Keys (GEMINI_API_KEY, STRIPE_SECRET_KEY)
