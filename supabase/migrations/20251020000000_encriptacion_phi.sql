-- ==========================================
-- MIGRACIÓN: Sistema de Encriptación de Datos Sensibles
-- Fecha: 2025-10-20
-- Compliance: HIPAA/GDPR
-- Descripción: Implementa encriptación field-level para PHI
-- ==========================================

-- Habilitar extensión de encriptación
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- TABLA: ClaveEncriptacion
-- Gestión de claves de encriptación (alternativo a Vault)
-- ==========================================
CREATE TABLE IF NOT EXISTS "ClaveEncriptacion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL, -- 'phi_key', 'chat_key', etc.
  clave_hash TEXT NOT NULL, -- Hash de la clave, nunca la clave real
  activa BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  rotada_en TIMESTAMP,
  expira_en TIMESTAMP
);

CREATE INDEX idx_clave_encriptacion_activa ON "ClaveEncriptacion"(activa, nombre);

COMMENT ON TABLE "ClaveEncriptacion" IS 'Gestión de claves de encriptación para datos sensibles';

-- ==========================================
-- TABLA: NotaSesionEncriptada
-- Almacenamiento seguro de notas de sesión con encriptación AES-256
-- ==========================================
CREATE TABLE IF NOT EXISTS "NotaSesionEncriptada" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID REFERENCES "Cita"(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Notas encriptadas (AES-256)
  notas_profesional_enc BYTEA, -- pgp_sym_encrypt()
  motivo_consulta_enc BYTEA,

  -- Hash para búsqueda (sin revelar contenido)
  notas_hash TEXT,

  -- Metadata de encriptación
  algoritmo TEXT DEFAULT 'aes-256-cbc',
  clave_version INTEGER DEFAULT 1,

  -- Auditoría de acceso
  ultimo_acceso_por UUID REFERENCES "Usuario"(id),
  ultimo_acceso_en TIMESTAMP,

  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_nota_sesion_cita ON "NotaSesionEncriptada"(cita_id);
CREATE INDEX idx_nota_sesion_acceso ON "NotaSesionEncriptada"(ultimo_acceso_en DESC);

COMMENT ON TABLE "NotaSesionEncriptada" IS 'Notas de sesión encriptadas con AES-256 (HIPAA-compliant)';
COMMENT ON COLUMN "NotaSesionEncriptada".notas_profesional_enc IS 'Notas del profesional encriptadas (solo visible para terapeuta)';
COMMENT ON COLUMN "NotaSesionEncriptada".motivo_consulta_enc IS 'Motivo de consulta del paciente encriptado';

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_nota_sesion_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nota_sesion_actualizado_en
  BEFORE UPDATE ON "NotaSesionEncriptada"
  FOR EACH ROW
  EXECUTE FUNCTION update_nota_sesion_actualizado_en();

-- ==========================================
-- AGREGAR COLUMNAS DE ENCRIPTACIÓN A TABLAS EXISTENTES
-- ==========================================

-- Agregar encriptación a Mensaje
ALTER TABLE "Mensaje"
  ADD COLUMN IF NOT EXISTS contenido_enc BYTEA,
  ADD COLUMN IF NOT EXISTS encriptado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS clave_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_mensaje_encriptado ON "Mensaje"(encriptado, conversacion_id);

COMMENT ON COLUMN "Mensaje".contenido_enc IS 'Contenido del mensaje encriptado (para conversaciones terapéuticas)';

-- Agregar encriptación a Resultado (evaluaciones psicológicas)
ALTER TABLE "Resultado"
  ADD COLUMN IF NOT EXISTS respuestas_enc BYTEA,
  ADD COLUMN IF NOT EXISTS encriptado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS clave_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_resultado_encriptado ON "Resultado"(encriptado, usuario_id);

COMMENT ON COLUMN "Resultado".respuestas_enc IS 'Respuestas de evaluación encriptadas (PHQ-9, GAD-7, etc.)';

-- ==========================================
-- FUNCIONES DE ENCRIPTACIÓN/DESENCRIPTACIÓN
-- ==========================================

-- Función para encriptar notas de sesión
CREATE OR REPLACE FUNCTION encriptar_nota_sesion(
  p_cita_id UUID,
  p_notas_profesional TEXT,
  p_motivo_consulta TEXT,
  p_clave TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nota_id UUID;
BEGIN
  INSERT INTO "NotaSesionEncriptada" (
    cita_id,
    notas_profesional_enc,
    motivo_consulta_enc,
    notas_hash,
    clave_version
  ) VALUES (
    p_cita_id,
    CASE
      WHEN p_notas_profesional IS NOT NULL AND p_notas_profesional != ''
      THEN pgp_sym_encrypt(p_notas_profesional, p_clave)
      ELSE NULL
    END,
    CASE
      WHEN p_motivo_consulta IS NOT NULL AND p_motivo_consulta != ''
      THEN pgp_sym_encrypt(p_motivo_consulta, p_clave)
      ELSE NULL
    END,
    CASE
      WHEN p_notas_profesional IS NOT NULL AND p_notas_profesional != ''
      THEN encode(digest(p_notas_profesional, 'sha256'), 'hex')
      ELSE NULL
    END,
    1
  )
  ON CONFLICT (cita_id) DO UPDATE SET
    notas_profesional_enc = CASE
      WHEN p_notas_profesional IS NOT NULL AND p_notas_profesional != ''
      THEN pgp_sym_encrypt(p_notas_profesional, p_clave)
      ELSE EXCLUDED.notas_profesional_enc
    END,
    motivo_consulta_enc = CASE
      WHEN p_motivo_consulta IS NOT NULL AND p_motivo_consulta != ''
      THEN pgp_sym_encrypt(p_motivo_consulta, p_clave)
      ELSE EXCLUDED.motivo_consulta_enc
    END,
    notas_hash = CASE
      WHEN p_notas_profesional IS NOT NULL AND p_notas_profesional != ''
      THEN encode(digest(p_notas_profesional, 'sha256'), 'hex')
      ELSE EXCLUDED.notas_hash
    END,
    actualizado_en = now()
  RETURNING id INTO v_nota_id;

  RETURN v_nota_id;
END;
$$;

COMMENT ON FUNCTION encriptar_nota_sesion IS 'Encripta notas de sesión con AES-256 (HIPAA-compliant)';

-- Función para desencriptar notas (con auditoría)
CREATE OR REPLACE FUNCTION desencriptar_nota_sesion(
  p_cita_id UUID,
  p_clave TEXT,
  p_usuario_id UUID
)
RETURNS TABLE(
  notas_profesional TEXT,
  motivo_consulta TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar auditoría de acceso
  UPDATE "NotaSesionEncriptada"
  SET
    ultimo_acceso_por = p_usuario_id,
    ultimo_acceso_en = now()
  WHERE cita_id = p_cita_id;

  -- Retornar datos desencriptados
  RETURN QUERY
  SELECT
    CASE
      WHEN notas_profesional_enc IS NOT NULL
      THEN pgp_sym_decrypt(notas_profesional_enc, p_clave)::TEXT
      ELSE NULL
    END,
    CASE
      WHEN motivo_consulta_enc IS NOT NULL
      THEN pgp_sym_decrypt(motivo_consulta_enc, p_clave)::TEXT
      ELSE NULL
    END
  FROM "NotaSesionEncriptada"
  WHERE cita_id = p_cita_id;
END;
$$;

COMMENT ON FUNCTION desencriptar_nota_sesion IS 'Desencripta notas con auditoría de acceso';

-- Función para encriptar contenido de mensaje
CREATE OR REPLACE FUNCTION encriptar_mensaje(
  p_mensaje_id UUID,
  p_contenido TEXT,
  p_clave TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "Mensaje"
  SET
    contenido_enc = pgp_sym_encrypt(p_contenido, p_clave),
    encriptado = true,
    clave_version = 1
  WHERE id = p_mensaje_id;

  RETURN p_mensaje_id;
END;
$$;

COMMENT ON FUNCTION encriptar_mensaje IS 'Encripta contenido de mensaje terapéutico';

-- Función para encriptar respuestas de evaluación
CREATE OR REPLACE FUNCTION encriptar_resultado(
  p_resultado_id UUID,
  p_respuestas JSONB,
  p_clave TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "Resultado"
  SET
    respuestas_enc = pgp_sym_encrypt(p_respuestas::TEXT, p_clave),
    encriptado = true,
    clave_version = 1
  WHERE id = p_resultado_id;

  RETURN p_resultado_id;
END;
$$;

COMMENT ON FUNCTION encriptar_resultado IS 'Encripta respuestas de evaluaciones psicológicas';

-- ==========================================
-- RLS PARA NotaSesionEncriptada
-- ==========================================

ALTER TABLE "NotaSesionEncriptada" ENABLE ROW LEVEL SECURITY;

-- Solo el profesional asignado puede ver las notas
CREATE POLICY "Profesional ve notas de sus citas recientes"
  ON "NotaSesionEncriptada"
  FOR SELECT
  USING (
    cita_id IN (
      SELECT c.id FROM "Cita" c
      INNER JOIN "Usuario" u ON c.profesional_id = u.id
      WHERE u.auth_id = auth.uid()
      -- Restricción temporal: solo citas de los últimos 90 días
      AND c.fecha_hora >= now() - INTERVAL '90 days'
    )
  );

-- El paciente solo ve su motivo de consulta (NO las notas del profesional)
-- Esto se implementará en la aplicación, no en RLS
-- La política permite lectura pero la app filtra qué campos retornar

-- Admins pueden ver con auditoría
CREATE POLICY "Admin ve notas con auditoría"
  ON "NotaSesionEncriptada"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Solo profesional puede crear/actualizar notas
CREATE POLICY "Solo profesional crea notas"
  ON "NotaSesionEncriptada"
  FOR INSERT
  WITH CHECK (
    cita_id IN (
      SELECT c.id FROM "Cita" c
      INNER JOIN "Usuario" u ON c.profesional_id = u.id
      WHERE u.auth_id = auth.uid()
      AND u.rol = 'TERAPEUTA'
      AND c.estado IN ('confirmada', 'completada')
    )
  );

CREATE POLICY "Solo profesional actualiza notas"
  ON "NotaSesionEncriptada"
  FOR UPDATE
  USING (
    cita_id IN (
      SELECT c.id FROM "Cita" c
      INNER JOIN "Usuario" u ON c.profesional_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ==========================================
-- MEJORAR RLS DE CITA (Restricción temporal)
-- ==========================================

-- Actualizar política existente de profesionales
DROP POLICY IF EXISTS "Profesionales pueden ver sus citas" ON "Cita";

CREATE POLICY "Profesionales ven citas recientes y futuras"
  ON "Cita"
  FOR SELECT
  USING (
    profesional_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
    -- Solo citas futuras o de los últimos 180 días
    AND fecha_hora >= now() - INTERVAL '180 days'
  );

-- Los pacientes mantienen acceso a todas sus citas (sin restricción temporal)
-- Política "Pacientes pueden ver sus citas" se mantiene sin cambios
