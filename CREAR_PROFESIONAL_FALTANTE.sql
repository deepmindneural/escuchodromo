-- ==========================================
-- SOLUCIÓN: Crear Usuario y PerfilUsuario faltantes
-- ==========================================
--
-- Problema: Existe PerfilProfesional para usuario_id 3ad0329a-3505-4c0c-a0d3-9cc55a719023
-- pero NO existe el Usuario ni PerfilUsuario correspondiente
--
-- Esta inconsistencia impide mostrar el profesional en el frontend
-- ==========================================

-- 1. Crear el Usuario con el ID que ya existe en PerfilProfesional
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
)
ON CONFLICT (id) DO UPDATE
SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  rol = EXCLUDED.rol,
  esta_activo = EXCLUDED.esta_activo;

-- 2. Crear el PerfilUsuario para este profesional
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
)
ON CONFLICT (usuario_id) DO UPDATE
SET
  especialidad = EXCLUDED.especialidad,
  experiencia_anos = EXCLUDED.experiencia_anos,
  foto_perfil = EXCLUDED.foto_perfil,
  biografia = EXCLUDED.biografia,
  direccion = EXCLUDED.direccion,
  tarifa_30min = EXCLUDED.tarifa_30min,
  tarifa_60min = EXCLUDED.tarifa_60min,
  disponible = EXCLUDED.disponible;

-- 3. Actualizar PerfilProfesional para asegurar que está aprobado
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

-- 4. Crear horarios de trabajo (Lunes a Viernes, 9 AM - 5 PM)
-- Primero obtener el ID del perfil profesional
WITH perfil AS (
  SELECT id FROM "PerfilProfesional"
  WHERE usuario_id = '3ad0329a-3505-4c0c-a0d3-9cc55a719023'
)
INSERT INTO "HorarioProfesional" (perfil_profesional_id, dia_semana, hora_inicio, hora_fin, activo)
SELECT
  perfil.id,
  dia_semana,
  hora_inicio,
  hora_fin,
  activo
FROM perfil,
LATERAL (
  VALUES
    (1, '09:00'::time, '17:00'::time, true),  -- Lunes
    (2, '09:00'::time, '17:00'::time, true),  -- Martes
    (3, '09:00'::time, '17:00'::time, true),  -- Miércoles
    (4, '09:00'::time, '17:00'::time, true),  -- Jueves
    (5, '09:00'::time, '17:00'::time, true)   -- Viernes
) AS horarios(dia_semana, hora_inicio, hora_fin, activo)
ON CONFLICT (perfil_profesional_id, dia_semana, hora_inicio, hora_fin)
DO UPDATE SET activo = EXCLUDED.activo;

-- 5. Verificación: Mostrar el profesional completo
SELECT
  u.id,
  u.nombre,
  u.apellido,
  u.email,
  u.rol,
  u.esta_activo,
  'PerfilUsuario' as perfil_usuario_existe,
  pu.especialidad,
  pu.tarifa_60min,
  'PerfilProfesional' as perfil_prof_existe,
  pp.perfil_aprobado,
  pp.documentos_verificados
FROM "Usuario" u
LEFT JOIN "PerfilUsuario" pu ON pu.usuario_id = u.id
LEFT JOIN "PerfilProfesional" pp ON pp.usuario_id = u.id
WHERE u.id = '3ad0329a-3505-4c0c-a0d3-9cc55a719023';

-- ==========================================
-- RESULTADO ESPERADO:
-- ==========================================
-- Después de ejecutar este SQL, el profesional debe aparecer en:
-- 1. /profesionales (listado)
-- 2. /profesionales/3ad0329a-3505-4c0c-a0d3-9cc55a719023 (detalle)
-- 3. /profesionales/3ad0329a-3505-4c0c-a0d3-9cc55a719023/reservar (reserva)
