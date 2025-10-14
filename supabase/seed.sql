-- ==========================================
-- SEED - DATOS INICIALES PARA DESARROLLO
-- Escuchodromo
-- ==========================================

-- Nota: Los usuarios se crean primero en Supabase Auth
-- Luego se insertan en la tabla Usuario con el auth_id correspondiente

-- ==========================================
-- PRUEBAS PSICOLÓGICAS: PHQ-9 (Depresión)
-- ==========================================

INSERT INTO "Prueba" (codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  'PHQ9',
  'Cuestionario de Salud del Paciente-9',
  'Patient Health Questionnaire-9',
  'Evalúa síntomas de depresión en las últimas 2 semanas',
  'Assesses depression symptoms in the last 2 weeks',
  'depresion'
);

-- Preguntas PHQ-9
INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  1,
  'Poco interés o placer en hacer cosas',
  'Little interest or pleasure in doing things',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'PHQ9';

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  2,
  'Sentirse decaído/a, deprimido/a o sin esperanzas',
  'Feeling down, depressed, or hopeless',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'PHQ9';

-- ==========================================
-- PRUEBAS PSICOLÓGICAS: GAD-7 (Ansiedad)
-- ==========================================

INSERT INTO "Prueba" (codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  'GAD7',
  'Escala del Trastorno de Ansiedad Generalizada-7',
  'Generalized Anxiety Disorder-7',
  'Evalúa síntomas de ansiedad en las últimas 2 semanas',
  'Assesses anxiety symptoms in the last 2 weeks',
  'ansiedad'
);

-- Preguntas GAD-7
INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  1,
  'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
  'Feeling nervous, anxious or on edge',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'GAD7';

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  2,
  'No poder dejar de preocuparse o controlar la preocupación',
  'Not being able to stop or control worrying',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'GAD7';

-- ==========================================
-- INSTRUCCIONES PARA CREAR USUARIOS DE PRUEBA
-- ==========================================

-- Los usuarios deben crearse primero en Supabase Auth usando el dashboard
-- o usando el cliente de Supabase:

-- Usuario de prueba:
-- Email: usuario@escuchodromo.com
-- Password: 123456

-- Admin de prueba:
-- Email: admin@escuchodromo.com
-- Password: 123456

-- Una vez creados en Auth, ejecutar esto para insertarlos en la tabla Usuario:

/*
-- Después de crear los usuarios en Supabase Auth, obtén sus UUIDs y ejecuta:

INSERT INTO "Usuario" (auth_id, email, nombre, rol)
VALUES
  ('UUID-DEL-USUARIO-NORMAL', 'usuario@escuchodromo.com', 'Usuario Demo', 'USUARIO'),
  ('UUID-DEL-ADMIN', 'admin@escuchodromo.com', 'Admin Demo', 'ADMIN');

-- Crear perfiles para ambos usuarios
INSERT INTO "PerfilUsuario" (usuario_id, idioma_preferido, moneda, zona_horaria, consentimiento_datos)
SELECT
  id,
  'es',
  'COP',
  'America/Bogota',
  true
FROM "Usuario"
WHERE email IN ('usuario@escuchodromo.com', 'admin@escuchodromo.com');
*/

-- ==========================================
-- FIN DEL SEED
-- ==========================================
