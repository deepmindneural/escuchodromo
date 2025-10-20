-- ==========================================
-- SOLUCIÓN SIMPLE: Crear Profesional Faltante
-- ==========================================
-- Sin usar ON CONFLICT - más compatible
-- ==========================================

-- 1. Crear el Usuario
INSERT INTO "Usuario" (
  id,
  nombre,
  apellido,
  email,
  rol,
  esta_activo
)
VALUES (
  '3ad0329a-3505-4c0c-a0d3-9cc55a719023',
  'Dr. Carlos',
  'Rodríguez',
  'carlos.rodriguez@escuchodromo.com',
  'TERAPEUTA',
  true
);

-- 2. Crear el PerfilUsuario
INSERT INTO "PerfilUsuario" (
  usuario_id,
  especialidad,
  experiencia_anos,
  foto_perfil,
  biografia,
  direccion,
  tarifa_30min,
  tarifa_60min,
  disponible
)
VALUES (
  '3ad0329a-3505-4c0c-a0d3-9cc55a719023',
  'Psicología Clínica',
  10,
  'https://i.pravatar.cc/300?img=12',
  'Psicólogo clínico con más de 10 años de experiencia en terapia cognitivo-conductual. Especializado en ansiedad, depresión y manejo del estrés. Mi enfoque es crear un espacio seguro donde puedas explorar tus emociones y desarrollar herramientas prácticas para tu bienestar.',
  'Calle 85 #15-20, Bogotá',
  80000,
  150000,
  true
);

-- 3. Actualizar PerfilProfesional existente
UPDATE "PerfilProfesional"
SET
  perfil_aprobado = true,
  documentos_verificados = true,
  titulo_profesional = 'Psicólogo Clínico',
  especialidades = ARRAY['Ansiedad', 'Depresión', 'Manejo del Estrés'],
  tarifa_por_sesion = 150000,
  calificacion_promedio = 4.8,
  total_pacientes = 45,
  total_citas = 320
WHERE usuario_id = '3ad0329a-3505-4c0c-a0d3-9cc55a719023';

-- 4. Crear horarios (Lunes a Viernes, 9 AM - 5 PM)
-- Primero obtener el ID del perfil profesional
DO $$
DECLARE
  perfil_prof_id UUID;
BEGIN
  -- Obtener ID del perfil profesional
  SELECT id INTO perfil_prof_id
  FROM "PerfilProfesional"
  WHERE usuario_id = '3ad0329a-3505-4c0c-a0d3-9cc55a719023';

  -- Insertar horarios
  INSERT INTO "HorarioProfesional" (perfil_profesional_id, dia_semana, hora_inicio, hora_fin, activo)
  VALUES
    (perfil_prof_id, 1, '09:00', '17:00', true),  -- Lunes
    (perfil_prof_id, 2, '09:00', '17:00', true),  -- Martes
    (perfil_prof_id, 3, '09:00', '17:00', true),  -- Miércoles
    (perfil_prof_id, 4, '09:00', '17:00', true),  -- Jueves
    (perfil_prof_id, 5, '09:00', '17:00', true);  -- Viernes
END $$;

-- 5. Verificación final
SELECT
  u.id,
  u.nombre,
  u.apellido,
  u.email,
  u.rol,
  u.esta_activo,
  CASE WHEN pu.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_perfil_usuario,
  pu.especialidad,
  pu.tarifa_60min,
  CASE WHEN pp.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_perfil_profesional,
  pp.perfil_aprobado,
  pp.documentos_verificados
FROM "Usuario" u
LEFT JOIN "PerfilUsuario" pu ON pu.usuario_id = u.id
LEFT JOIN "PerfilProfesional" pp ON pp.usuario_id = u.id
WHERE u.id = '3ad0329a-3505-4c0c-a0d3-9cc55a719023';
