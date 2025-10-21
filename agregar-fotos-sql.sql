-- ==========================================
-- Agregar fotos de perfil a profesionales
-- ==========================================

-- Ver profesionales actuales y sus fotos
SELECT
  u.id,
  u.nombre,
  u.apellido,
  u.rol,
  pu.foto_perfil,
  pu.biografia,
  pu.especialidad
FROM "Usuario" u
LEFT JOIN "PerfilUsuario" pu ON pu.usuario_id = u.id
WHERE u.rol = 'TERAPEUTA' AND u.esta_activo = true;

-- Agregar foto de perfil profesional de alta calidad desde Unsplash
UPDATE "PerfilUsuario"
SET
  foto_perfil = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&q=80',
  biografia = COALESCE(biografia, 'Psicólogo clínico con amplia experiencia en terapia cognitivo-conductual y mindfulness. Mi enfoque se centra en proporcionar un espacio seguro y empático donde puedas explorar tus pensamientos y emociones, desarrollar herramientas de afrontamiento efectivas y alcanzar tu bienestar emocional.'),
  especialidad = COALESCE(especialidad, 'Psicología Clínica'),
  experiencia_anos = COALESCE(experiencia_anos, 10),
  disponible = true
WHERE usuario_id IN (
  SELECT id FROM "Usuario"
  WHERE rol = 'TERAPEUTA' AND esta_activo = true
);

-- Verificar que se actualizó
SELECT
  u.nombre,
  u.apellido,
  pu.foto_perfil,
  CASE
    WHEN pu.foto_perfil IS NOT NULL THEN '✅ Tiene foto'
    ELSE '❌ Sin foto'
  END as estado_foto,
  pu.especialidad,
  pu.experiencia_anos
FROM "Usuario" u
LEFT JOIN "PerfilUsuario" pu ON pu.usuario_id = u.id
WHERE u.rol = 'TERAPEUTA' AND u.esta_activo = true;

-- RESULTADO ESPERADO:
-- Todos los profesionales deben mostrar "✅ Tiene foto"
