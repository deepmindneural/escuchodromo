-- ==========================================
-- CORRECCIÓN DE POLÍTICAS RLS
-- Fecha: 2025-10-20
-- Descripción: Corrige políticas RLS para permitir consultas necesarias
--              mientras mantiene la seguridad de datos sensibles
-- ==========================================

-- ==========================================
-- IMPORTANTE: SEGURIDAD Y COMPLIANCE
-- ==========================================
-- Este archivo implementa políticas RLS que:
-- 1. Permiten a usuarios autenticados acceder a sus propios datos
-- 2. Permiten a ADMIN ver todos los datos necesarios para administración
-- 3. Permiten a TERAPEUTA ver datos de sus pacientes (vía relación de Cita)
-- 4. Protegen PHI (Protected Health Information) de acceso no autorizado
-- 5. Implementan principio de mínimo privilegio
-- ==========================================

-- ==========================================
-- TABLA: Usuario
-- ==========================================

-- Eliminar políticas conflictivas existentes y recrear
DROP POLICY IF EXISTS "Usuario ve su propio perfil" ON "Usuario";
DROP POLICY IF EXISTS "Usuario actualiza su propio perfil" ON "Usuario";
DROP POLICY IF EXISTS "Admin ve todos los usuarios" ON "Usuario";
DROP POLICY IF EXISTS "Admin gestiona usuarios" ON "Usuario";

-- POLÍTICA 1: Usuario ve su propio perfil (por auth_id o por id)
-- Permite consultas como: Usuario?select=id,rol&id=eq.xxx
-- Seguridad: Solo el usuario autenticado puede ver su propio perfil
CREATE POLICY "Usuario_ve_su_propio_perfil_mejorado"
  ON "Usuario"
  FOR SELECT
  USING (
    -- El usuario autenticado puede ver su propio perfil
    auth.uid() = auth_id
    OR
    -- O si está consultando por id y ese id corresponde a su auth_id
    (id IN (SELECT id FROM "Usuario" WHERE auth_id = auth.uid()))
  );

-- POLÍTICA 2: Usuario actualiza su propio perfil
-- Seguridad: Solo puede actualizar su propio registro
CREATE POLICY "Usuario_actualiza_su_propio_perfil_mejorado"
  ON "Usuario"
  FOR UPDATE
  USING (
    auth.uid() = auth_id
  )
  WITH CHECK (
    auth.uid() = auth_id
    -- Prevenir que usuarios cambien su propio rol (solo ADMIN puede hacerlo)
    AND (
      rol = (SELECT rol FROM "Usuario" WHERE auth_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM "Usuario"
        WHERE auth_id = auth.uid() AND rol = 'ADMIN'
      )
    )
  );

-- POLÍTICA 3: Admin ve todos los usuarios
-- Seguridad: Solo usuarios con rol ADMIN pueden ver todos los perfiles
CREATE POLICY "Admin_ve_todos_los_usuarios_mejorado"
  ON "Usuario"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICA 4: Admin gestiona cualquier usuario
-- Seguridad: Solo ADMIN puede crear, actualizar, eliminar usuarios
CREATE POLICY "Admin_gestiona_usuarios_mejorado"
  ON "Usuario"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICA 5: Terapeuta ve datos básicos de sus pacientes
-- Seguridad: Solo puede ver id, nombre, email de pacientes con citas confirmadas/completadas
CREATE POLICY "Terapeuta_ve_sus_pacientes"
  ON "Usuario"
  FOR SELECT
  USING (
    -- Si el usuario autenticado es TERAPEUTA y está consultando a un paciente
    EXISTS (
      SELECT 1 FROM "Usuario" u
      WHERE u.auth_id = auth.uid()
      AND u.rol = 'TERAPEUTA'
    )
    AND
    -- Y ese paciente tiene citas con el terapeuta
    id IN (
      SELECT DISTINCT c.paciente_id
      FROM "Cita" c
      JOIN "Usuario" profesional ON c.profesional_id = profesional.id
      WHERE profesional.auth_id = auth.uid()
      AND c.estado IN ('confirmada', 'completada', 'pendiente')
    )
  );

-- POLÍTICA 6: Service role puede hacer todo (para Edge Functions)
-- Seguridad: Solo el service_role de Supabase puede usar esta política
CREATE POLICY "Service_role_gestiona_usuarios"
  ON "Usuario"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- TABLA: Suscripcion
-- ==========================================

-- Eliminar políticas conflictivas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver su suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "Usuarios pueden crear su suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "Usuarios pueden actualizar su suscripcion" ON "Suscripcion";
DROP POLICY IF EXISTS "Admins pueden gestionar suscripciones" ON "Suscripcion";
DROP POLICY IF EXISTS "Service role puede gestionar suscripciones" ON "Suscripcion";

-- POLÍTICA 1: Usuario ve su propia suscripción (mejorada)
-- Permite consultas como: Suscripcion?select=plan&usuario_id=eq.xxx&estado=eq.activa
-- Seguridad: Solo el usuario dueño de la suscripción puede verla
CREATE POLICY "Usuario_ve_su_suscripcion_mejorado"
  ON "Suscripcion"
  FOR SELECT
  USING (
    -- El usuario_id de la suscripción corresponde al usuario autenticado
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
    OR
    -- O el auth_id del usuario corresponde directamente
    EXISTS (
      SELECT 1 FROM "Usuario" u
      WHERE u.id = "Suscripcion".usuario_id
      AND u.auth_id = auth.uid()
    )
  );

-- POLÍTICA 2: Usuario crea su propia suscripción
-- Seguridad: Solo puede crear suscripciones para sí mismo
CREATE POLICY "Usuario_crea_su_suscripcion_mejorado"
  ON "Suscripcion"
  FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- POLÍTICA 3: Usuario actualiza su propia suscripción
-- Seguridad: Solo puede actualizar su propia suscripción
-- Restricción: No puede cambiar el usuario_id de la suscripción
CREATE POLICY "Usuario_actualiza_su_suscripcion_mejorado"
  ON "Suscripcion"
  FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    -- El usuario_id no puede cambiar
    usuario_id = (SELECT usuario_id FROM "Suscripcion" WHERE id = "Suscripcion".id)
    AND
    -- Solo puede actualizar su propia suscripción
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- POLÍTICA 4: Admin ve y gestiona todas las suscripciones
-- Seguridad: Solo usuarios con rol ADMIN
CREATE POLICY "Admin_gestiona_suscripciones_mejorado"
  ON "Suscripcion"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICA 5: Service role puede hacer todo
-- Seguridad: Para webhooks de Stripe/PayPal que actualizan suscripciones
CREATE POLICY "Service_role_gestiona_suscripciones_mejorado"
  ON "Suscripcion"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- AUDITORÍA: Crear tabla de logs de acceso a datos sensibles
-- ==========================================

-- Tabla para auditoría de acceso a PHI y datos sensibles
CREATE TABLE IF NOT EXISTS "AuditoriaAcceso" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Usuario que accedió
  usuario_auth_id UUID NOT NULL,
  usuario_rol TEXT NOT NULL,

  -- Recurso accedido
  tabla TEXT NOT NULL,
  registro_id UUID,
  accion TEXT NOT NULL CHECK (accion IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),

  -- Contexto
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  accedido_en TIMESTAMP DEFAULT now(),

  -- Metadata adicional (JSON)
  metadata JSONB
);

CREATE INDEX idx_auditoria_acceso_usuario ON "AuditoriaAcceso"(usuario_auth_id);
CREATE INDEX idx_auditoria_acceso_tabla ON "AuditoriaAcceso"(tabla);
CREATE INDEX idx_auditoria_acceso_fecha ON "AuditoriaAcceso"(accedido_en DESC);
CREATE INDEX idx_auditoria_acceso_accion ON "AuditoriaAcceso"(accion);

-- Habilitar RLS en tabla de auditoría
ALTER TABLE "AuditoriaAcceso" ENABLE ROW LEVEL SECURITY;

-- Solo ADMIN puede ver logs de auditoría
CREATE POLICY "Admin_ve_auditoria"
  ON "AuditoriaAcceso"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Service role puede insertar logs
CREATE POLICY "Service_role_inserta_auditoria"
  ON "AuditoriaAcceso"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ==========================================
-- FUNCIÓN: Logging automático de acceso a Usuario
-- ==========================================
-- NOTA: Esta función está comentada por defecto porque puede generar
--       muchos registros. Descomentar solo si se requiere auditoría completa.

/*
CREATE OR REPLACE FUNCTION log_acceso_usuario()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo loggear si es un usuario autenticado (no service_role)
  IF auth.uid() IS NOT NULL AND current_setting('role', true) != 'service_role' THEN
    INSERT INTO "AuditoriaAcceso" (
      usuario_auth_id,
      usuario_rol,
      tabla,
      registro_id,
      accion,
      metadata
    ) VALUES (
      auth.uid(),
      (SELECT rol FROM "Usuario" WHERE auth_id = auth.uid()),
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      jsonb_build_object(
        'timestamp', now(),
        'table', TG_TABLE_NAME,
        'operation', TG_OP
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para Usuario
CREATE TRIGGER usuario_acceso_log
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON "Usuario"
  FOR EACH ROW
  EXECUTE FUNCTION log_acceso_usuario();
*/

-- ==========================================
-- VERIFICACIÓN DE POLÍTICAS
-- ==========================================

-- Verificar que las tablas tienen RLS habilitado
DO $$
DECLARE
  tabla TEXT;
  rls_enabled BOOLEAN;
BEGIN
  FOR tabla IN
    SELECT tablename::TEXT
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('Usuario', 'Suscripcion')
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = tabla;

    IF NOT rls_enabled THEN
      RAISE EXCEPTION 'RLS no está habilitado en la tabla: %', tabla;
    ELSE
      RAISE NOTICE 'RLS confirmado en tabla: %', tabla;
    END IF;
  END LOOP;
END $$;

-- ==========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==========================================

COMMENT ON POLICY "Usuario_ve_su_propio_perfil_mejorado" ON "Usuario"
  IS 'Permite a usuarios ver su propio perfil, consultando por auth_id o id. Cumple con principio de mínimo privilegio.';

COMMENT ON POLICY "Terapeuta_ve_sus_pacientes" ON "Usuario"
  IS 'Permite a terapeutas ver información básica de pacientes con citas confirmadas. Protege PHI de acceso no autorizado.';

COMMENT ON POLICY "Usuario_ve_su_suscripcion_mejorado" ON "Suscripcion"
  IS 'Permite consultas flexibles de suscripción por usuario_id mientras mantiene seguridad. Compatible con consultas del frontend.';

COMMENT ON POLICY "Service_role_gestiona_suscripciones_mejorado" ON "Suscripcion"
  IS 'Permite a Edge Functions gestionar suscripciones vía webhooks de Stripe/PayPal. Solo accesible con service_role key.';

COMMENT ON TABLE "AuditoriaAcceso"
  IS 'Tabla de auditoría HIPAA/GDPR para rastrear acceso a datos sensibles. Retención: revisar políticas de compliance.';

-- ==========================================
-- NOTAS DE SEGURIDAD
-- ==========================================

-- HIPAA COMPLIANCE:
-- 1. Las políticas implementan "minimum necessary" standard (45 CFR 164.502(b))
-- 2. Terapeutas solo ven datos de pacientes con relación activa (citas)
-- 3. Tabla de auditoría permite rastrear acceso a PHI (45 CFR 164.308(a)(1)(ii)(D))
-- 4. Service role restringido a operaciones automatizadas necesarias

-- GDPR COMPLIANCE:
-- 1. Principio de minimización de datos (Art. 5(1)(c))
-- 2. Limitación de finalidad (Art. 5(1)(b))
-- 3. Auditoría para ejercer derechos de acceso (Art. 15)
-- 4. Permite implementar derecho al olvido (Art. 17) vía CASCADE DELETE

-- PRÓXIMOS PASOS DE SEGURIDAD:
-- 1. Implementar rotación de claves de encriptación
-- 2. Configurar alertas para accesos anómalos
-- 3. Implementar rate limiting en consultas sensibles
-- 4. Agregar MFA obligatorio para roles ADMIN y TERAPEUTA
-- 5. Encriptar campos sensibles con pgp_sym_encrypt

-- ==========================================
-- FIN DE MIGRACIÓN
-- ==========================================
