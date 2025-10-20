-- Verificar si existe la tabla PerfilUsuario
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name IN ('PerfilUsuario', 'perfil_usuario', 'perfilusuario');

-- Verificar columnas de PerfilUsuario
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'PerfilUsuario';

-- Verificar foreign keys entre Usuario y PerfilUsuario
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'PerfilUsuario' OR ccu.table_name = 'PerfilUsuario');

-- Verificar si el usuario tiene PerfilUsuario
SELECT 
  u.id,
  u.email,
  u.nombre,
  pu.usuario_id,
  pu.especialidad
FROM "Usuario" u
LEFT JOIN "PerfilUsuario" pu ON u.id = pu.usuario_id
WHERE u.email = 'profesional@escuchodromo.com';
