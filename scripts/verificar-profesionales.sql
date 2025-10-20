-- ==========================================
-- SCRIPT DE VERIFICACIÓN: Profesionales en Base de Datos
-- ==========================================

-- 1. Verificar usuarios con rol TERAPEUTA
SELECT
  id,
  email,
  nombre,
  apellido,
  rol,
  esta_activo,
  creado_en
FROM "Usuario"
WHERE rol = 'TERAPEUTA'
ORDER BY creado_en DESC;

-- 2. Verificar perfiles profesionales
SELECT
  pp.id,
  pp.usuario_id,
  u.email,
  u.nombre,
  u.apellido,
  pp.titulo_profesional,
  pp.numero_licencia,
  pp.perfil_aprobado,
  pp.documentos_verificados,
  pp.tarifa_por_sesion,
  pp.creado_en
FROM "PerfilProfesional" pp
JOIN "Usuario" u ON pp.usuario_id = u.id
ORDER BY pp.creado_en DESC;

-- 3. Verificar profesionales aprobados y verificados (los que deberían aparecer)
SELECT
  u.id,
  u.email,
  u.nombre,
  u.apellido,
  u.rol,
  u.esta_activo,
  pp.perfil_aprobado,
  pp.documentos_verificados,
  pp.titulo_profesional
FROM "Usuario" u
JOIN "PerfilProfesional" pp ON u.id = pp.usuario_id
WHERE u.rol = 'TERAPEUTA'
  AND u.esta_activo = true
  AND pp.perfil_aprobado = true
  AND pp.documentos_verificados = true;

-- 4. Verificar documentos profesionales
SELECT
  dp.id,
  pp.usuario_id,
  u.email,
  dp.tipo,
  dp.nombre,
  dp.verificado,
  dp.creado_en
FROM "DocumentoProfesional" dp
JOIN "PerfilProfesional" pp ON dp.perfil_profesional_id = pp.id
JOIN "Usuario" u ON pp.usuario_id = u.id
ORDER BY dp.creado_en DESC;

-- 5. Contar profesionales por estado
SELECT
  COUNT(*) FILTER (WHERE u.esta_activo = true) as activos,
  COUNT(*) FILTER (WHERE pp.perfil_aprobado = true) as aprobados,
  COUNT(*) FILTER (WHERE pp.documentos_verificados = true) as verificados,
  COUNT(*) FILTER (
    WHERE u.esta_activo = true
    AND pp.perfil_aprobado = true
    AND pp.documentos_verificados = true
  ) as visibles_en_listado
FROM "Usuario" u
JOIN "PerfilProfesional" pp ON u.id = pp.usuario_id
WHERE u.rol = 'TERAPEUTA';
