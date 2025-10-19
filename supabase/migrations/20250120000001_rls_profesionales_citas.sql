-- ==========================================
-- ROW LEVEL SECURITY (RLS) - PROFESIONALES Y CITAS
-- Fecha: 2025-01-20
-- Descripción: Políticas de seguridad para tablas de profesionales, citas y suscripciones
-- ==========================================

-- ==========================================
-- TABLA: PerfilProfesional
-- ==========================================
ALTER TABLE "PerfilProfesional" ENABLE ROW LEVEL SECURITY;

-- Los profesionales pueden ver y editar su propio perfil
CREATE POLICY "Profesionales pueden ver su propio perfil"
  ON "PerfilProfesional"
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE id = usuario_id
    )
  );

CREATE POLICY "Profesionales pueden actualizar su propio perfil"
  ON "PerfilProfesional"
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE id = usuario_id
    )
  );

CREATE POLICY "Profesionales pueden insertar su propio perfil"
  ON "PerfilProfesional"
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE id = usuario_id AND rol = 'TERAPEUTA'
    )
  );

-- Los admins pueden ver y editar todos los perfiles
CREATE POLICY "Admins pueden ver todos los perfiles profesionales"
  ON "PerfilProfesional"
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE rol = 'ADMIN'
    )
  );

CREATE POLICY "Admins pueden actualizar todos los perfiles profesionales"
  ON "PerfilProfesional"
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE rol = 'ADMIN'
    )
  );

-- Usuarios pueden ver perfiles aprobados de profesionales (para elegir terapeuta)
CREATE POLICY "Usuarios pueden ver perfiles aprobados"
  ON "PerfilProfesional"
  FOR SELECT
  USING (perfil_aprobado = true AND documentos_verificados = true);

-- ==========================================
-- TABLA: DocumentoProfesional
-- ==========================================
ALTER TABLE "DocumentoProfesional" ENABLE ROW LEVEL SECURITY;

-- Los profesionales pueden ver y gestionar sus propios documentos
CREATE POLICY "Profesionales pueden ver sus propios documentos"
  ON "DocumentoProfesional"
  FOR SELECT
  USING (
    perfil_profesional_id IN (
      SELECT pp.id
      FROM "PerfilProfesional" pp
      JOIN "Usuario" u ON pp.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Profesionales pueden insertar sus propios documentos"
  ON "DocumentoProfesional"
  FOR INSERT
  WITH CHECK (
    perfil_profesional_id IN (
      SELECT pp.id
      FROM "PerfilProfesional" pp
      JOIN "Usuario" u ON pp.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Profesionales pueden eliminar sus propios documentos"
  ON "DocumentoProfesional"
  FOR DELETE
  USING (
    perfil_profesional_id IN (
      SELECT pp.id
      FROM "PerfilProfesional" pp
      JOIN "Usuario" u ON pp.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Los admins pueden ver y verificar todos los documentos
CREATE POLICY "Admins pueden ver todos los documentos"
  ON "DocumentoProfesional"
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE rol = 'ADMIN'
    )
  );

-- ==========================================
-- TABLA: HorarioProfesional
-- ==========================================
ALTER TABLE "HorarioProfesional" ENABLE ROW LEVEL SECURITY;

-- Los profesionales pueden gestionar sus propios horarios
CREATE POLICY "Profesionales pueden gestionar sus horarios"
  ON "HorarioProfesional"
  FOR ALL
  USING (
    perfil_profesional_id IN (
      SELECT pp.id
      FROM "PerfilProfesional" pp
      JOIN "Usuario" u ON pp.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Todos los usuarios autenticados pueden ver horarios de profesionales aprobados
CREATE POLICY "Usuarios pueden ver horarios de profesionales aprobados"
  ON "HorarioProfesional"
  FOR SELECT
  USING (
    perfil_profesional_id IN (
      SELECT id
      FROM "PerfilProfesional"
      WHERE perfil_aprobado = true AND documentos_verificados = true
    )
    AND activo = true
  );

-- ==========================================
-- TABLA: Cita
-- ==========================================
ALTER TABLE "Cita" ENABLE ROW LEVEL SECURITY;

-- Los pacientes pueden ver sus propias citas
CREATE POLICY "Pacientes pueden ver sus citas"
  ON "Cita"
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Los profesionales pueden ver sus citas
CREATE POLICY "Profesionales pueden ver sus citas"
  ON "Cita"
  FOR SELECT
  USING (
    profesional_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Los pacientes pueden crear citas
CREATE POLICY "Pacientes pueden crear citas"
  ON "Cita"
  FOR INSERT
  WITH CHECK (
    paciente_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Los pacientes pueden actualizar sus citas (para cancelar, etc.)
CREATE POLICY "Pacientes pueden actualizar sus citas"
  ON "Cita"
  FOR UPDATE
  USING (
    paciente_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Los profesionales pueden actualizar sus citas (confirmar, completar, etc.)
CREATE POLICY "Profesionales pueden actualizar sus citas"
  ON "Cita"
  FOR UPDATE
  USING (
    profesional_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Los admins pueden ver todas las citas
CREATE POLICY "Admins pueden ver todas las citas"
  ON "Cita"
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE rol = 'ADMIN'
    )
  );

-- ==========================================
-- TABLA: Suscripcion
-- ==========================================
ALTER TABLE "Suscripcion" ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver y gestionar su propia suscripción
CREATE POLICY "Usuarios pueden ver su suscripcion"
  ON "Suscripcion"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden crear su suscripcion"
  ON "Suscripcion"
  FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar su suscripcion"
  ON "Suscripcion"
  FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Los admins pueden ver y gestionar todas las suscripciones
CREATE POLICY "Admins pueden gestionar suscripciones"
  ON "Suscripcion"
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE rol = 'ADMIN'
    )
  );

-- Service role puede hacer todo (para Edge Functions)
CREATE POLICY "Service role puede gestionar suscripciones"
  ON "Suscripcion"
  FOR ALL
  USING (auth.role() = 'service_role');

-- ==========================================
-- TABLA: CalificacionProfesional
-- ==========================================
ALTER TABLE "CalificacionProfesional" ENABLE ROW LEVEL SECURITY;

-- Los pacientes pueden crear calificaciones de sus propias citas
CREATE POLICY "Pacientes pueden crear calificaciones"
  ON "CalificacionProfesional"
  FOR INSERT
  WITH CHECK (
    paciente_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
    AND cita_id IN (
      SELECT id FROM "Cita"
      WHERE paciente_id IN (
        SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
      )
      AND estado = 'completada'
    )
  );

-- Los pacientes pueden ver y actualizar sus propias calificaciones
CREATE POLICY "Pacientes pueden ver sus calificaciones"
  ON "CalificacionProfesional"
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Pacientes pueden actualizar sus calificaciones"
  ON "CalificacionProfesional"
  FOR UPDATE
  USING (
    paciente_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Los profesionales pueden ver las calificaciones que recibieron
CREATE POLICY "Profesionales pueden ver sus calificaciones"
  ON "CalificacionProfesional"
  FOR SELECT
  USING (
    profesional_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Todos pueden ver calificaciones de profesionales aprobados (sin comentarios sensibles)
CREATE POLICY "Ver calificaciones de profesionales aprobados"
  ON "CalificacionProfesional"
  FOR SELECT
  USING (
    profesional_id IN (
      SELECT usuario_id FROM "PerfilProfesional"
      WHERE perfil_aprobado = true
    )
  );

-- Los admins pueden ver todas las calificaciones
CREATE POLICY "Admins pueden ver todas las calificaciones"
  ON "CalificacionProfesional"
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT auth_id FROM "Usuario" WHERE rol = 'ADMIN'
    )
  );

-- ==========================================
-- COMENTARIOS
-- ==========================================
COMMENT ON POLICY "Profesionales pueden ver su propio perfil" ON "PerfilProfesional" IS 'Permite a los terapeutas ver su propio perfil profesional';
COMMENT ON POLICY "Usuarios pueden ver perfiles aprobados" ON "PerfilProfesional" IS 'Permite a los usuarios ver profesionales verificados para agendar citas';
COMMENT ON POLICY "Pacientes pueden crear citas" ON "Cita" IS 'Permite a los pacientes agendar citas con profesionales';
COMMENT ON POLICY "Service role puede gestionar suscripciones" ON "Suscripcion" IS 'Permite a las Edge Functions gestionar suscripciones vía webhooks de Stripe';
