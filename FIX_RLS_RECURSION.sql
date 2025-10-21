-- ==========================================
-- FIX: Recursión Infinita en Políticas RLS
-- ==========================================
-- Este script arregla el error:
-- ERROR: 42P17: infinite recursion detected in policy for relation "Usuario"
-- ==========================================

-- PASO 1: DESACTIVAR RLS temporalmente para poder trabajar
ALTER TABLE "Usuario" DISABLE ROW LEVEL SECURITY;

-- PASO 2: ELIMINAR TODAS las políticas existentes (pueden estar rotas)
DROP POLICY IF EXISTS "Usuarios visibles públicamente" ON "Usuario";
DROP POLICY IF EXISTS "usuarios_publicos" ON "Usuario";
DROP POLICY IF EXISTS "usuarios_select_publico" ON "Usuario";
DROP POLICY IF EXISTS "usuarios_insert_propio" ON "Usuario";
DROP POLICY IF EXISTS "usuarios_update_propio" ON "Usuario";
DROP POLICY IF EXISTS "usuarios_delete_propio" ON "Usuario";
DROP POLICY IF EXISTS "allow_select_usuarios" ON "Usuario";
DROP POLICY IF EXISTS "allow_insert_usuarios" ON "Usuario";
DROP POLICY IF EXISTS "allow_update_usuarios" ON "Usuario";
DROP POLICY IF EXISTS "allow_delete_usuarios" ON "Usuario";

-- Eliminar cualquier otra política que pueda existir
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'Usuario'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "Usuario"', policy_record.policyname);
  END LOOP;
END $$;

-- PASO 3: CREAR POLÍTICAS CORRECTAS (sin recursión)

-- 3.1 Política SELECT: Permitir ver profesionales públicos (sin autenticación)
CREATE POLICY "select_profesionales_publicos" ON "Usuario"
FOR SELECT
USING (
  -- Permitir ver usuarios con rol TERAPEUTA que estén activos
  rol = 'TERAPEUTA' AND esta_activo = true
);

-- 3.2 Política SELECT: Permitir ver tu propio perfil (autenticado)
CREATE POLICY "select_propio_perfil" ON "Usuario"
FOR SELECT
USING (
  auth.uid() = auth_id  -- Comparar con auth_id, NO con Usuario.id
);

-- 3.3 Política INSERT: Solo usuarios autenticados pueden crear su perfil
CREATE POLICY "insert_propio_perfil" ON "Usuario"
FOR INSERT
WITH CHECK (
  auth.uid() = auth_id
);

-- 3.4 Política UPDATE: Solo puedes actualizar tu propio perfil
CREATE POLICY "update_propio_perfil" ON "Usuario"
FOR UPDATE
USING (
  auth.uid() = auth_id
)
WITH CHECK (
  auth.uid() = auth_id
);

-- 3.5 Política DELETE: Solo puedes eliminar tu propio perfil
CREATE POLICY "delete_propio_perfil" ON "Usuario"
FOR DELETE
USING (
  auth.uid() = auth_id
);

-- PASO 4: REACTIVAR RLS
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

-- PASO 5: HACER LO MISMO PARA PerfilUsuario
ALTER TABLE "PerfilUsuario" DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de PerfilUsuario
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'PerfilUsuario'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "PerfilUsuario"', policy_record.policyname);
  END LOOP;
END $$;

-- Políticas para PerfilUsuario
CREATE POLICY "select_perfiles_publicos" ON "PerfilUsuario"
FOR SELECT
USING (true);  -- Permitir ver todos los perfiles (no contienen PHI sensible)

CREATE POLICY "insert_propio_perfil_usuario" ON "PerfilUsuario"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Usuario" u
    WHERE u.id = usuario_id
      AND u.auth_id = auth.uid()
  )
);

CREATE POLICY "update_propio_perfil_usuario" ON "PerfilUsuario"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Usuario" u
    WHERE u.id = usuario_id
      AND u.auth_id = auth.uid()
  )
);

ALTER TABLE "PerfilUsuario" ENABLE ROW LEVEL SECURITY;

-- PASO 6: HACER LO MISMO PARA PerfilProfesional
ALTER TABLE "PerfilProfesional" DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'PerfilProfesional'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "PerfilProfesional"', policy_record.policyname);
  END LOOP;
END $$;

-- Políticas para PerfilProfesional
CREATE POLICY "select_perfiles_profesionales_publicos" ON "PerfilProfesional"
FOR SELECT
USING (
  perfil_aprobado = true AND documentos_verificados = true
);

CREATE POLICY "insert_propio_perfil_profesional" ON "PerfilProfesional"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Usuario" u
    WHERE u.id = usuario_id
      AND u.auth_id = auth.uid()
      AND u.rol = 'TERAPEUTA'
  )
);

CREATE POLICY "update_propio_perfil_profesional" ON "PerfilProfesional"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Usuario" u
    WHERE u.id = usuario_id
      AND u.auth_id = auth.uid()
  )
);

ALTER TABLE "PerfilProfesional" ENABLE ROW LEVEL SECURITY;

-- PASO 7: VERIFICACIÓN FINAL
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%Usuario%' AND tablename = 'Usuario' THEN '⚠️ POSIBLE RECURSIÓN'
    ELSE '✅ OK'
  END as estado
FROM pg_policies
WHERE tablename IN ('Usuario', 'PerfilUsuario', 'PerfilProfesional')
ORDER BY tablename, policyname;

-- RESULTADO ESPERADO:
-- Todas las políticas deben mostrar '✅ OK'
-- Si alguna muestra '⚠️ POSIBLE RECURSIÓN', hay que revisarla
