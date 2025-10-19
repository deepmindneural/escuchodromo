-- ==========================================
-- SUPABASE STORAGE - DOCUMENTOS PROFESIONALES
-- Fecha: 2025-01-20
-- Descripción: Configuración de buckets de Storage para documentos de profesionales
-- ==========================================

-- ==========================================
-- CREAR BUCKET PARA DOCUMENTOS PROFESIONALES
-- ==========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-profesionales',
  'documentos-profesionales',
  false, -- No público
  10485760, -- 10MB de límite
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- POLÍTICAS DE STORAGE: Documentos Profesionales
-- ==========================================

-- Los profesionales pueden subir sus propios documentos
CREATE POLICY "Profesionales pueden subir documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-profesionales'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los profesionales pueden ver sus propios documentos
CREATE POLICY "Profesionales pueden ver sus documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-profesionales'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los profesionales pueden actualizar sus propios documentos
CREATE POLICY "Profesionales pueden actualizar sus documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos-profesionales'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los profesionales pueden eliminar sus propios documentos
CREATE POLICY "Profesionales pueden eliminar sus documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-profesionales'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los admins pueden ver todos los documentos
CREATE POLICY "Admins pueden ver todos los documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-profesionales'
  AND auth.uid() IN (
    SELECT auth_id FROM public."Usuario" WHERE rol = 'ADMIN'
  )
);

-- Los admins pueden gestionar todos los documentos
CREATE POLICY "Admins pueden gestionar todos los documentos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'documentos-profesionales'
  AND auth.uid() IN (
    SELECT auth_id FROM public."Usuario" WHERE rol = 'ADMIN'
  )
);

-- ==========================================
-- CREAR BUCKET PARA FOTOS DE PERFIL
-- ==========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatares',
  'avatares',
  true, -- Público
  2097152, -- 2MB de límite
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- POLÍTICAS DE STORAGE: Avatares
-- ==========================================

-- Los usuarios pueden subir su propio avatar
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatares'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Todos pueden ver avatares (bucket público)
CREATE POLICY "Todos pueden ver avatares"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatares');

-- Los usuarios pueden actualizar su propio avatar
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatares'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden eliminar su propio avatar
CREATE POLICY "Usuarios pueden eliminar su avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatares'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- COMENTARIOS
-- ==========================================
COMMENT ON POLICY "Profesionales pueden subir documentos" ON storage.objects IS 'Permite a los profesionales subir documentos de validación organizados por su auth_id';
COMMENT ON POLICY "Admins pueden ver todos los documentos" ON storage.objects IS 'Permite a los admins verificar documentos de todos los profesionales';
COMMENT ON POLICY "Usuarios pueden subir su avatar" ON storage.objects IS 'Permite a todos los usuarios subir su foto de perfil';
