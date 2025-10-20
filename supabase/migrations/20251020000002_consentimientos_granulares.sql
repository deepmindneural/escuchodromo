-- ==========================================
-- MIGRACIÓN: Sistema de Consentimientos Granulares
-- Fecha: 2025-10-20
-- Compliance: GDPR Art. 7 (Condiciones para el consentimiento)
-- Descripción: Gestión detallada de consentimientos por tipo de procesamiento
-- ==========================================

-- ==========================================
-- TABLA: ConsentimientoDetallado
-- Gestión granular de consentimientos para cumplimiento GDPR
-- ==========================================
CREATE TABLE IF NOT EXISTS "ConsentimientoDetallado" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,

  -- Tipo de consentimiento
  tipo TEXT NOT NULL CHECK (tipo IN (
    'procesamiento_phi',           -- Procesar datos de salud (requerido)
    'compartir_con_profesional',   -- Compartir con terapeuta asignado (requerido)
    'analisis_ia',                 -- Análisis con IA (Gemini/Groq)
    'almacenamiento_mensajes',     -- Guardar historial de chat
    'almacenamiento_voz',          -- Guardar grabaciones de voz
    'marketing',                   -- Emails promocionales (opcional)
    'investigacion_anonimizado',   -- Datos anonimizados para investigación (opcional)
    'notificaciones_push',         -- Notificaciones push
    'notificaciones_email',        -- Emails transaccionales
    'compartir_progreso',          -- Compartir progreso con terceros autorizados
    'cookies_analiticas'           -- Cookies de análisis
  )),

  -- Estado del consentimiento
  otorgado BOOLEAN NOT NULL,

  -- Versión del texto de consentimiento
  version_texto INTEGER NOT NULL DEFAULT 1,
  texto_consentimiento TEXT NOT NULL,

  -- Metadata de otorgamiento
  ip_address TEXT,
  user_agent TEXT,
  metodo_otorgamiento TEXT CHECK (metodo_otorgamiento IN (
    'web', 'app', 'email_link', 'telefono', 'presencial'
  )),

  -- Fechas
  otorgado_en TIMESTAMP NOT NULL DEFAULT now(),
  revocado_en TIMESTAMP,
  expira_en TIMESTAMP, -- Algunos consentimientos pueden expirar

  -- Recordatorios de renovación
  recordatorio_enviado BOOLEAN DEFAULT false,

  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

-- Índices
CREATE INDEX idx_consentimiento_usuario ON "ConsentimientoDetallado"(usuario_id, tipo);
CREATE INDEX idx_consentimiento_tipo ON "ConsentimientoDetallado"(tipo, otorgado);
CREATE INDEX idx_consentimiento_expiracion ON "ConsentimientoDetallado"(expira_en)
  WHERE expira_en IS NOT NULL;
CREATE INDEX idx_consentimiento_activo ON "ConsentimientoDetallado"(usuario_id, otorgado)
  WHERE otorgado = true AND revocado_en IS NULL;

-- Constraint: Un usuario solo puede tener un consentimiento activo por tipo
CREATE UNIQUE INDEX idx_consentimiento_unico_activo
  ON "ConsentimientoDetallado"(usuario_id, tipo)
  WHERE otorgado = true AND revocado_en IS NULL;

COMMENT ON TABLE "ConsentimientoDetallado" IS 'Gestión granular de consentimientos GDPR Art. 7';
COMMENT ON COLUMN "ConsentimientoDetallado".tipo IS 'Tipo de procesamiento para el cual se otorga el consentimiento';
COMMENT ON COLUMN "ConsentimientoDetallado".version_texto IS 'Versión del texto de consentimiento (para tracking de cambios)';
COMMENT ON COLUMN "ConsentimientoDetallado".expira_en IS 'Fecha de expiración del consentimiento (GDPR requiere renovación periódica)';

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_consentimiento_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consentimiento_actualizado_en
  BEFORE UPDATE ON "ConsentimientoDetallado"
  FOR EACH ROW
  EXECUTE FUNCTION update_consentimiento_actualizado_en();

-- ==========================================
-- TABLA: HistorialConsentimiento
-- Registro inmutable de cambios de consentimiento (GDPR Art. 7.1 - demostrar consentimiento)
-- ==========================================
CREATE TABLE IF NOT EXISTS "HistorialConsentimiento" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consentimiento_id UUID REFERENCES "ConsentimientoDetallado"(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,

  -- Cambio realizado
  accion TEXT NOT NULL CHECK (accion IN ('otorgado', 'revocado', 'renovado', 'expirado')),
  valor_anterior BOOLEAN,
  valor_nuevo BOOLEAN NOT NULL,

  -- Contexto del cambio
  ip_address TEXT,
  user_agent TEXT,
  metodo TEXT,

  -- Metadata
  version_texto INTEGER,
  notas TEXT,

  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_historial_consentimiento ON "HistorialConsentimiento"(consentimiento_id, creado_en DESC);
CREATE INDEX idx_historial_usuario ON "HistorialConsentimiento"(usuario_id, creado_en DESC);

COMMENT ON TABLE "HistorialConsentimiento" IS 'Registro inmutable de cambios de consentimiento (GDPR Art. 7.1)';

-- ==========================================
-- RLS PARA ConsentimientoDetallado
-- ==========================================

ALTER TABLE "ConsentimientoDetallado" ENABLE ROW LEVEL SECURITY;

-- Usuarios gestionan sus propios consentimientos
CREATE POLICY "Usuarios gestionan sus consentimientos"
  ON "ConsentimientoDetallado"
  FOR ALL
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Admins pueden ver todos los consentimientos (solo lectura)
CREATE POLICY "Admins ven todos los consentimientos"
  ON "ConsentimientoDetallado"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- RLS PARA HistorialConsentimiento
-- ==========================================

ALTER TABLE "HistorialConsentimiento" ENABLE ROW LEVEL SECURITY;

-- Usuarios ven su propio historial
CREATE POLICY "Usuarios ven su historial de consentimientos"
  ON "HistorialConsentimiento"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Admins ven todo el historial
CREATE POLICY "Admins ven todo el historial de consentimientos"
  ON "HistorialConsentimiento"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Sistema inserta historial (via triggers)
CREATE POLICY "Sistema inserta historial"
  ON "HistorialConsentimiento"
  FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- FUNCIONES DE GESTIÓN DE CONSENTIMIENTOS
-- ==========================================

-- Función para verificar si un consentimiento está activo
CREATE OR REPLACE FUNCTION verificar_consentimiento(
  p_usuario_id UUID,
  p_tipo TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consentimiento_valido BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM "ConsentimientoDetallado"
    WHERE usuario_id = p_usuario_id
      AND tipo = p_tipo
      AND otorgado = true
      AND revocado_en IS NULL
      AND (expira_en IS NULL OR expira_en > now())
  ) INTO v_consentimiento_valido;

  RETURN v_consentimiento_valido;
END;
$$;

COMMENT ON FUNCTION verificar_consentimiento IS 'Verifica si un usuario tiene un consentimiento específico activo';

-- Función para otorgar consentimiento
CREATE OR REPLACE FUNCTION otorgar_consentimiento(
  p_usuario_id UUID,
  p_tipo TEXT,
  p_texto_consentimiento TEXT,
  p_version_texto INTEGER DEFAULT 1,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metodo TEXT DEFAULT 'web',
  p_expira_en TIMESTAMP DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consentimiento_id UUID;
  v_consentimiento_existente UUID;
BEGIN
  -- Verificar si ya existe un consentimiento activo del mismo tipo
  SELECT id INTO v_consentimiento_existente
  FROM "ConsentimientoDetallado"
  WHERE usuario_id = p_usuario_id
    AND tipo = p_tipo
    AND otorgado = true
    AND revocado_en IS NULL;

  IF v_consentimiento_existente IS NOT NULL THEN
    -- Actualizar el existente (renovación)
    UPDATE "ConsentimientoDetallado"
    SET
      version_texto = p_version_texto,
      texto_consentimiento = p_texto_consentimiento,
      otorgado_en = now(),
      expira_en = p_expira_en,
      actualizado_en = now()
    WHERE id = v_consentimiento_existente
    RETURNING id INTO v_consentimiento_id;

    -- Registrar en historial
    INSERT INTO "HistorialConsentimiento" (
      consentimiento_id, usuario_id, tipo, accion,
      valor_anterior, valor_nuevo, ip_address, user_agent, metodo, version_texto
    ) VALUES (
      v_consentimiento_id, p_usuario_id, p_tipo, 'renovado',
      true, true, p_ip_address, p_user_agent, p_metodo, p_version_texto
    );
  ELSE
    -- Crear nuevo consentimiento
    INSERT INTO "ConsentimientoDetallado" (
      usuario_id, tipo, otorgado, version_texto, texto_consentimiento,
      ip_address, user_agent, metodo_otorgamiento, expira_en
    ) VALUES (
      p_usuario_id, p_tipo, true, p_version_texto, p_texto_consentimiento,
      p_ip_address, p_user_agent, p_metodo, p_expira_en
    )
    RETURNING id INTO v_consentimiento_id;

    -- Registrar en historial
    INSERT INTO "HistorialConsentimiento" (
      consentimiento_id, usuario_id, tipo, accion,
      valor_anterior, valor_nuevo, ip_address, user_agent, metodo, version_texto
    ) VALUES (
      v_consentimiento_id, p_usuario_id, p_tipo, 'otorgado',
      NULL, true, p_ip_address, p_user_agent, p_metodo, p_version_texto
    );
  END IF;

  RETURN v_consentimiento_id;
END;
$$;

COMMENT ON FUNCTION otorgar_consentimiento IS 'Otorga o renueva un consentimiento específico';

-- Función para revocar consentimiento
CREATE OR REPLACE FUNCTION revocar_consentimiento(
  p_usuario_id UUID,
  p_tipo TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consentimiento_id UUID;
BEGIN
  -- Buscar consentimiento activo
  SELECT id INTO v_consentimiento_id
  FROM "ConsentimientoDetallado"
  WHERE usuario_id = p_usuario_id
    AND tipo = p_tipo
    AND otorgado = true
    AND revocado_en IS NULL;

  IF v_consentimiento_id IS NULL THEN
    RETURN false; -- No hay consentimiento activo para revocar
  END IF;

  -- Marcar como revocado
  UPDATE "ConsentimientoDetallado"
  SET
    otorgado = false,
    revocado_en = now(),
    actualizado_en = now()
  WHERE id = v_consentimiento_id;

  -- Registrar en historial
  INSERT INTO "HistorialConsentimiento" (
    consentimiento_id, usuario_id, tipo, accion,
    valor_anterior, valor_nuevo, ip_address, user_agent
  ) VALUES (
    v_consentimiento_id, p_usuario_id, p_tipo, 'revocado',
    true, false, p_ip_address, p_user_agent
  );

  RETURN true;
END;
$$;

COMMENT ON FUNCTION revocar_consentimiento IS 'Revoca un consentimiento específico (GDPR Right to Withdraw)';

-- Función para obtener todos los consentimientos de un usuario
CREATE OR REPLACE FUNCTION obtener_consentimientos_usuario(
  p_usuario_id UUID
)
RETURNS TABLE(
  tipo TEXT,
  otorgado BOOLEAN,
  otorgado_en TIMESTAMP,
  revocado_en TIMESTAMP,
  expira_en TIMESTAMP,
  version_texto INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario que consulta sea el propietario o admin
  IF NOT (
    p_usuario_id IN (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN')
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver consentimientos de otro usuario';
  END IF;

  RETURN QUERY
  SELECT
    c.tipo,
    c.otorgado,
    c.otorgado_en,
    c.revocado_en,
    c.expira_en,
    c.version_texto
  FROM "ConsentimientoDetallado" c
  WHERE c.usuario_id = p_usuario_id
    AND c.revocado_en IS NULL -- Solo consentimientos activos
  ORDER BY c.tipo;
END;
$$;

COMMENT ON FUNCTION obtener_consentimientos_usuario IS 'Obtiene todos los consentimientos activos de un usuario';

-- ==========================================
-- FUNCIÓN PARA EXPIRAR CONSENTIMIENTOS AUTOMÁTICAMENTE
-- ==========================================

CREATE OR REPLACE FUNCTION expirar_consentimientos_vencidos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consentimientos_expirados INTEGER;
BEGIN
  -- Marcar como revocados los consentimientos expirados
  UPDATE "ConsentimientoDetallado"
  SET
    otorgado = false,
    revocado_en = now(),
    actualizado_en = now()
  WHERE expira_en IS NOT NULL
    AND expira_en <= now()
    AND otorgado = true
    AND revocado_en IS NULL;

  GET DIAGNOSTICS v_consentimientos_expirados = ROW_COUNT;

  -- Registrar en historial
  INSERT INTO "HistorialConsentimiento" (
    consentimiento_id, usuario_id, tipo, accion,
    valor_anterior, valor_nuevo
  )
  SELECT
    id, usuario_id, tipo, 'expirado', true, false
  FROM "ConsentimientoDetallado"
  WHERE expira_en IS NOT NULL
    AND expira_en <= now()
    AND revocado_en = now(); -- Recién revocados

  RETURN v_consentimientos_expirados;
END;
$$;

COMMENT ON FUNCTION expirar_consentimientos_vencidos IS 'Expira automáticamente consentimientos vencidos (ejecutar con pg_cron diariamente)';

-- ==========================================
-- DATOS INICIALES: Consentimientos requeridos al crear usuario
-- ==========================================

-- Trigger para crear consentimientos por defecto al crear usuario
CREATE OR REPLACE FUNCTION crear_consentimientos_iniciales()
RETURNS TRIGGER AS $$
BEGIN
  -- Consentimientos requeridos (otorgados por defecto en el registro)
  -- Estos deben ser explícitamente aceptados en el formulario de registro

  -- Procesamiento de datos de salud (requerido)
  INSERT INTO "ConsentimientoDetallado" (
    usuario_id, tipo, otorgado, version_texto,
    texto_consentimiento, metodo_otorgamiento
  ) VALUES (
    NEW.id, 'procesamiento_phi', true, 1,
    'Autorizo el procesamiento de mis datos de salud mental para proporcionar servicios terapéuticos.',
    'web'
  );

  -- Compartir con profesional (requerido)
  INSERT INTO "ConsentimientoDetallado" (
    usuario_id, tipo, otorgado, version_texto,
    texto_consentimiento, metodo_otorgamiento
  ) VALUES (
    NEW.id, 'compartir_con_profesional', true, 1,
    'Autorizo compartir mis datos con profesionales de salud mental asignados.',
    'web'
  );

  -- Notificaciones transaccionales (requerido)
  INSERT INTO "ConsentimientoDetallado" (
    usuario_id, tipo, otorgado, version_texto,
    texto_consentimiento, metodo_otorgamiento
  ) VALUES (
    NEW.id, 'notificaciones_email', true, 1,
    'Autorizo recibir notificaciones por email relacionadas con mi cuenta y citas.',
    'web'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crear_consentimientos_usuario
  AFTER INSERT ON "Usuario"
  FOR EACH ROW
  EXECUTE FUNCTION crear_consentimientos_iniciales();

COMMENT ON TRIGGER crear_consentimientos_usuario ON "Usuario" IS 'Crea consentimientos iniciales al registrar usuario';

-- ==========================================
-- VISTAS ÚTILES
-- ==========================================

-- Vista de usuarios sin consentimientos requeridos
CREATE OR REPLACE VIEW "UsuariosSinConsentimientosRequeridos" AS
SELECT
  u.id,
  u.email,
  u.rol,
  u.creado_en
FROM "Usuario" u
WHERE NOT EXISTS (
  SELECT 1 FROM "ConsentimientoDetallado" c
  WHERE c.usuario_id = u.id
    AND c.tipo = 'procesamiento_phi'
    AND c.otorgado = true
    AND c.revocado_en IS NULL
);

COMMENT ON VIEW "UsuariosSinConsentimientosRequeridos" IS 'Usuarios sin consentimiento de procesamiento PHI (bloqueados para usar servicios)';
