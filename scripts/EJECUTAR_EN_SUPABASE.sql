-- ==========================================
-- EJECUTAR ESTE SQL EN EL DASHBOARD DE SUPABASE
-- https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
-- ==========================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CREAR TABLAS NECESARIAS
-- ==========================================

-- Tabla Prueba
CREATE TABLE IF NOT EXISTS "Prueba" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  nombre_en TEXT,
  descripcion TEXT,
  descripcion_en TEXT,
  categoria TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prueba_codigo ON "Prueba"(codigo);
CREATE INDEX IF NOT EXISTS idx_prueba_categoria ON "Prueba"(categoria);

-- Tabla Pregunta
CREATE TABLE IF NOT EXISTS "Pregunta" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prueba_id UUID REFERENCES "Prueba"(id) ON DELETE CASCADE NOT NULL,
  orden INTEGER NOT NULL,
  texto TEXT NOT NULL,
  texto_en TEXT,
  opciones JSONB NOT NULL,
  creado_en TIMESTAMP DEFAULT now(),
  UNIQUE(prueba_id, orden)
);

CREATE INDEX IF NOT EXISTS idx_pregunta_prueba_id ON "Pregunta"(prueba_id);
CREATE INDEX IF NOT EXISTS idx_pregunta_orden ON "Pregunta"(orden);
CREATE INDEX IF NOT EXISTS idx_pregunta_prueba_orden ON "Pregunta"(prueba_id, orden);

-- Tabla Usuario (si no existe)
CREATE TABLE IF NOT EXISTS "Usuario" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  imagen TEXT,
  rol TEXT NOT NULL DEFAULT 'USUARIO' CHECK (rol IN ('USUARIO', 'TERAPEUTA', 'ADMIN')),
  esta_activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuario_email ON "Usuario"(email);
CREATE INDEX IF NOT EXISTS idx_usuario_auth_id ON "Usuario"(auth_id);

-- Tabla Resultado
CREATE TABLE IF NOT EXISTS "Resultado" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  prueba_id UUID REFERENCES "Prueba"(id) ON DELETE CASCADE NOT NULL,
  respuestas JSONB NOT NULL,
  puntuacion FLOAT NOT NULL,
  severidad TEXT NOT NULL CHECK (severidad IN ('minima', 'leve', 'moderada', 'moderadamente_severa', 'severa')),
  interpretacion TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resultado_usuario_id ON "Resultado"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resultado_prueba_id ON "Resultado"(prueba_id);
CREATE INDEX IF NOT EXISTS idx_resultado_fecha ON "Resultado"(creado_en DESC);

-- ==========================================
-- INSERTAR DATOS
-- ==========================================

-- PHQ-9
INSERT INTO "Prueba" (id, codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'PHQ-9',
  'Cuestionario de Salud del Paciente - 9',
  'Patient Health Questionnaire - 9',
  'Evaluación de síntomas de depresión en las últimas 2 semanas.',
  'Assessment of depression symptoms over the last 2 weeks.',
  'Salud Mental'
) ON CONFLICT (id) DO NOTHING;

-- GAD-7
INSERT INTO "Prueba" (id, codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'GAD-7',
  'Trastorno de Ansiedad Generalizada - 7',
  'Generalized Anxiety Disorder - 7',
  'Evaluación de síntomas de ansiedad en las últimas 2 semanas.',
  'Assessment of anxiety symptoms over the last 2 weeks.',
  'Salud Mental'
) ON CONFLICT (id) DO NOTHING;

-- Preguntas PHQ-9
INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 1, 'Poco interés o placer en hacer cosas', 'Little interest or pleasure in doing things', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 2, 'Sentirse desanimado/a, deprimido/a o sin esperanza', 'Feeling down, depressed, or hopeless', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 3, 'Problemas para dormir o dormir demasiado', 'Trouble falling or staying asleep, or sleeping too much', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 4, 'Sentirse cansado/a o tener poca energía', 'Feeling tired or having little energy', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 5, 'Poco apetito o comer en exceso', 'Poor appetite or overeating', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 6, 'Sentirse mal consigo mismo/a o sentir que es un fracaso', 'Feeling bad about yourself', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 7, 'Dificultad para concentrarse en cosas', 'Trouble concentrating on things', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 8, 'Moverse o hablar tan lentamente que otras personas lo han notado', 'Moving or speaking so slowly', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 9, 'Pensamientos de que estaría mejor muerto/a', 'Thoughts that you would be better off dead', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb)
ON CONFLICT (prueba_id, orden) DO NOTHING;

-- Preguntas GAD-7
INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 1, 'Sentirse nervioso/a, ansioso/a o muy alterado/a', 'Feeling nervous, anxious or on edge', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 2, 'No poder parar o controlar la preocupación', 'Not being able to stop or control worrying', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 3, 'Preocuparse demasiado por diferentes cosas', 'Worrying too much about different things', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 4, 'Dificultad para relajarse', 'Trouble relaxing', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 5, 'Estar tan inquieto/a que es difícil quedarse quieto/a', 'Being so restless that it is hard to sit still', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 6, 'Irritarse o enfadarse con facilidad', 'Becoming easily annoyed or irritable', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 7, 'Sentir miedo como si algo terrible fuera a pasar', 'Feeling afraid as if something awful might happen', '[{"valor": 0, "texto": "Nunca"}, {"valor": 1, "texto": "Varios días"}, {"valor": 2, "texto": "Más de la mitad de los días"}, {"valor": 3, "texto": "Casi todos los días"}]'::jsonb)
ON CONFLICT (prueba_id, orden) DO NOTHING;

-- Verificar
SELECT 'PHQ-9' as prueba, COUNT(*) as preguntas FROM "Pregunta" WHERE prueba_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
UNION ALL
SELECT 'GAD-7' as prueba, COUNT(*) as preguntas FROM "Pregunta" WHERE prueba_id = '550e8400-e29b-41d4-a716-446655440002'::uuid;
