-- ==========================================
-- MIGRACIÓN: POLÍTICAS DE STORAGE PARA REGISTRO DE PROFESIONALES
-- Fecha: 2025-10-20
-- Descripción: Permite subida de documentos durante proceso de registro (sin autenticación previa)
-- ==========================================

-- ==========================================
-- ACTUALIZAR POLÍTICA: Permitir subida anónima durante registro
-- ==========================================

-- Eliminar política restrictiva anterior para INSERT
DROP POLICY IF EXISTS "Profesionales pueden subir documentos" ON storage.objects;

-- Nueva política: Permitir subida con service role o usuario autenticado
-- Durante el registro, la Edge Function usa service_role_key
CREATE POLICY "Permitir subida de documentos durante registro"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'documentos-profesionales'
  -- Permitir a cualquiera subir (la validación se hace en Edge Function)
  -- Los archivos se organizan por hash de email durante registro
  -- Una vez aprobado, se vinculan al usuario en DocumentoProfesional
);

-- ==========================================
-- ACTUALIZAR POLÍTICA: Solo service role y admins pueden ver durante registro
-- ==========================================

DROP POLICY IF EXISTS "Profesionales pueden ver sus documentos" ON storage.objects;
DROP POLICY IF EXISTS "Admins pueden ver todos los documentos" ON storage.objects;

-- Service role siempre puede ver (usado en Edge Functions)
CREATE POLICY "Service role puede ver todos los documentos"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'documentos-profesionales');

-- Admins pueden ver todos los documentos para verificación
CREATE POLICY "Admins pueden ver documentos para verificar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-profesionales'
  AND EXISTS (
    SELECT 1 FROM public."Usuario"
    WHERE auth_id = auth.uid()
    AND rol = 'ADMIN'
  )
);

-- Profesionales aprobados pueden ver sus propios documentos
CREATE POLICY "Profesionales aprobados pueden ver sus documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-profesionales'
  AND EXISTS (
    SELECT 1
    FROM public."Usuario" u
    INNER JOIN public."PerfilProfesional" pp ON pp.usuario_id = u.id
    INNER JOIN public."DocumentoProfesional" dp ON dp.perfil_profesional_id = pp.id
    WHERE u.auth_id = auth.uid()
    AND dp.url_archivo LIKE '%' || name || '%'
  )
);

-- ==========================================
-- LIMPIEZA: Documentos huérfanos (no vinculados después de 7 días)
-- ==========================================

CREATE OR REPLACE FUNCTION limpiar_documentos_huerfanos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_eliminados INTEGER := 0;
  v_documento RECORD;
BEGIN
  -- Buscar archivos en storage que no están en DocumentoProfesional
  -- y tienen más de 7 días
  FOR v_documento IN
    SELECT name, created_at
    FROM storage.objects
    WHERE bucket_id = 'documentos-profesionales'
    AND created_at < now() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1
      FROM public."DocumentoProfesional"
      WHERE url_archivo LIKE '%' || name || '%'
    )
  LOOP
    -- Eliminar archivo huérfano
    DELETE FROM storage.objects
    WHERE bucket_id = 'documentos-profesionales'
    AND name = v_documento.name;

    v_eliminados := v_eliminados + 1;
  END LOOP;

  RETURN v_eliminados;
END;
$$;

-- ==========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==========================================
COMMENT ON POLICY "Permitir subida de documentos durante registro" ON storage.objects IS 'Permite subir documentos durante el proceso de registro sin autenticación previa. La validación se realiza en la Edge Function.';
COMMENT ON POLICY "Service role puede ver todos los documentos" ON storage.objects IS 'Permite a Edge Functions con service_role_key acceder a documentos para procesamiento.';
COMMENT ON POLICY "Admins pueden ver documentos para verificar" ON storage.objects IS 'Permite a administradores revisar y verificar documentos de profesionales.';
COMMENT ON FUNCTION limpiar_documentos_huerfanos IS 'Elimina documentos que fueron subidos pero nunca vinculados a un registro de profesional (proceso de registro abandonado).';
