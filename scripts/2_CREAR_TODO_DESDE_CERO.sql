-- ==========================================
-- PASO 2: CREAR TODAS LAS TABLAS Y DATOS
-- Ejecutar este SQL completo en Supabase SQL Editor
-- ==========================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ELIMINAR TABLAS SI EXISTEN (para empezar limpio)
-- ==========================================
DROP TABLE IF EXISTS "Pregunta" CASCADE;
DROP TABLE IF EXISTS "Resultado" CASCADE;
DROP TABLE IF EXISTS "Prueba" CASCADE;

-- ==========================================
-- CREAR TABLA: Prueba
-- ==========================================
CREATE TABLE "Prueba" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  nombre_en TEXT,
  descripcion TEXT,
  descripcion_en TEXT,
  categoria TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_prueba_codigo ON "Prueba"(codigo);
CREATE INDEX idx_prueba_categoria ON "Prueba"(categoria);

-- ==========================================
-- CREAR TABLA: Pregunta
-- ==========================================
CREATE TABLE "Pregunta" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prueba_id UUID REFERENCES "Prueba"(id) ON DELETE CASCADE NOT NULL,
  orden INTEGER NOT NULL,
  texto TEXT NOT NULL,
  texto_en TEXT,
  opciones JSONB NOT NULL,
  creado_en TIMESTAMP DEFAULT now(),
  UNIQUE(prueba_id, orden)
);

CREATE INDEX idx_pregunta_prueba_id ON "Pregunta"(prueba_id);
CREATE INDEX idx_pregunta_orden ON "Pregunta"(orden);
CREATE INDEX idx_pregunta_prueba_orden ON "Pregunta"(prueba_id, orden);

-- ==========================================
-- CREAR TABLA: Resultado (si no existe Usuario, comentar la FK)
-- ==========================================
CREATE TABLE "Resultado" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID, -- Referencias a Usuario (comentado temporalmente)
  prueba_id UUID REFERENCES "Prueba"(id) ON DELETE CASCADE NOT NULL,
  respuestas JSONB NOT NULL,
  puntuacion FLOAT NOT NULL,
  severidad TEXT NOT NULL CHECK (severidad IN ('minima', 'leve', 'moderada', 'moderadamente_severa', 'severa')),
  interpretacion TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_resultado_usuario_id ON "Resultado"(usuario_id);
CREATE INDEX idx_resultado_prueba_id ON "Resultado"(prueba_id);
CREATE INDEX idx_resultado_fecha ON "Resultado"(creado_en DESC);

-- ==========================================
-- INSERTAR PRUEBAS
-- ==========================================

-- PHQ-9 (Depresión)
INSERT INTO "Prueba" (id, codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'PHQ-9',
  'Cuestionario de Salud del Paciente - 9',
  'Patient Health Questionnaire - 9',
  'Evaluación de síntomas de depresión en las últimas 2 semanas. Escala validada internacionalmente.',
  'Assessment of depression symptoms over the last 2 weeks. Internationally validated scale.',
  'Salud Mental'
);

-- GAD-7 (Ansiedad)
INSERT INTO "Prueba" (id, codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'GAD-7',
  'Trastorno de Ansiedad Generalizada - 7',
  'Generalized Anxiety Disorder - 7',
  'Evaluación de síntomas de ansiedad en las últimas 2 semanas. Escala validada internacionalmente.',
  'Assessment of anxiety symptoms over the last 2 weeks. Validated scale.',
  'Salud Mental'
);

-- ==========================================
-- INSERTAR PREGUNTAS PHQ-9 (9 preguntas)
-- ==========================================

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 1,
  'Poco interés o placer en hacer cosas',
  'Little interest or pleasure in doing things',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 2,
  'Sentirse desanimado/a, deprimido/a o sin esperanza',
  'Feeling down, depressed, or hopeless',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 3,
  'Problemas para dormir, quedarse dormido/a, o dormir demasiado',
  'Trouble falling or staying asleep, or sleeping too much',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 4,
  'Sentirse cansado/a o tener poca energía',
  'Feeling tired or having little energy',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 5,
  'Poco apetito o comer en exceso',
  'Poor appetite or overeating',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 6,
  'Sentirse mal consigo mismo/a, sentir que es un fracaso, o que ha decepcionado a su familia',
  'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 7,
  'Dificultad para concentrarse en cosas como leer el periódico o ver televisión',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 8,
  'Moverse o hablar tan lentamente que otras personas lo han notado, o estar tan inquieto/a que se mueve más de lo habitual',
  'Moving or speaking so slowly that other people could have noticed, or the opposite',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 9,
  'Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna manera',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

-- ==========================================
-- INSERTAR PREGUNTAS GAD-7 (7 preguntas)
-- ==========================================

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 1,
  'Sentirse nervioso/a, ansioso/a o muy alterado/a',
  'Feeling nervous, anxious or on edge',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 2,
  'No poder parar o controlar la preocupación',
  'Not being able to stop or control worrying',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 3,
  'Preocuparse demasiado por diferentes cosas',
  'Worrying too much about different things',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 4,
  'Dificultad para relajarse',
  'Trouble relaxing',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 5,
  'Estar tan inquieto/a que es difícil quedarse quieto/a',
  'Being so restless that it is hard to sit still',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 6,
  'Irritarse o enfadarse con facilidad',
  'Becoming easily annoyed or irritable',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, 7,
  'Sentir miedo como si algo terrible fuera a pasar',
  'Feeling afraid as if something awful might happen',
  '[{"valor": 0, "texto": "Nunca", "texto_en": "Not at all"}, {"valor": 1, "texto": "Varios días", "texto_en": "Several days"}, {"valor": 2, "texto": "Más de la mitad de los días", "texto_en": "More than half the days"}, {"valor": 3, "texto": "Casi todos los días", "texto_en": "Nearly every day"}]'::jsonb);

-- ==========================================
-- VERIFICAR RESULTADOS
-- ==========================================

SELECT
  'PHQ-9' as prueba,
  COUNT(*) as total_preguntas
FROM "Pregunta"
WHERE prueba_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
UNION ALL
SELECT
  'GAD-7' as prueba,
  COUNT(*) as total_preguntas
FROM "Pregunta"
WHERE prueba_id = '550e8400-e29b-41d4-a716-446655440002'::uuid;

-- Deberías ver:
-- PHQ-9 | 9
-- GAD-7 | 7
