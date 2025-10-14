-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Configuración de seguridad para Escuchodromo
-- ==========================================

-- ==========================================
-- POLÍTICAS PARA TABLA: Usuario
-- ==========================================

ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

-- Usuario puede ver su propio perfil
CREATE POLICY "Usuario ve su propio perfil"
  ON "Usuario"
  FOR SELECT
  USING (auth.uid() = auth_id);

-- Usuario puede actualizar su propio perfil
CREATE POLICY "Usuario actualiza su propio perfil"
  ON "Usuario"
  FOR UPDATE
  USING (auth.uid() = auth_id);

-- Admin ve todos los usuarios
CREATE POLICY "Admin ve todos los usuarios"
  ON "Usuario"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Admin puede gestionar cualquier usuario
CREATE POLICY "Admin gestiona usuarios"
  ON "Usuario"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: PerfilUsuario
-- ==========================================

ALTER TABLE "PerfilUsuario" ENABLE ROW LEVEL SECURITY;

-- Usuario ve su propio perfil
CREATE POLICY "Usuario ve su perfil"
  ON "PerfilUsuario"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario actualiza su propio perfil
CREATE POLICY "Usuario actualiza su perfil"
  ON "PerfilUsuario"
  FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario crea su propio perfil
CREATE POLICY "Usuario crea su perfil"
  ON "PerfilUsuario"
  FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Admin ve todos los perfiles
CREATE POLICY "Admin ve todos los perfiles"
  ON "PerfilUsuario"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: Conversacion
-- ==========================================

ALTER TABLE "Conversacion" ENABLE ROW LEVEL SECURITY;

-- Usuario ve solo sus conversaciones
CREATE POLICY "Usuario ve sus conversaciones"
  ON "Conversacion"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario crea sus conversaciones
CREATE POLICY "Usuario crea sus conversaciones"
  ON "Conversacion"
  FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario actualiza sus conversaciones
CREATE POLICY "Usuario actualiza sus conversaciones"
  ON "Conversacion"
  FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Admin ve todas las conversaciones
CREATE POLICY "Admin ve todas las conversaciones"
  ON "Conversacion"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: Mensaje
-- ==========================================

ALTER TABLE "Mensaje" ENABLE ROW LEVEL SECURITY;

-- Usuario ve mensajes de sus conversaciones
CREATE POLICY "Usuario ve sus mensajes"
  ON "Mensaje"
  FOR SELECT
  USING (
    conversacion_id IN (
      SELECT c.id FROM "Conversacion" c
      JOIN "Usuario" u ON c.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Usuario crea mensajes en sus conversaciones
CREATE POLICY "Usuario crea sus mensajes"
  ON "Mensaje"
  FOR INSERT
  WITH CHECK (
    conversacion_id IN (
      SELECT c.id FROM "Conversacion" c
      JOIN "Usuario" u ON c.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Service role (Edge Functions) puede insertar mensajes
CREATE POLICY "Service role inserta mensajes"
  ON "Mensaje"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admin ve todos los mensajes
CREATE POLICY "Admin ve todos los mensajes"
  ON "Mensaje"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: RegistroAnimo
-- ==========================================

ALTER TABLE "RegistroAnimo" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus registros de ánimo
CREATE POLICY "Usuario ve sus registros de animo"
  ON "RegistroAnimo"
  FOR SELECT
  USING (
    perfil_id IN (
      SELECT p.id FROM "PerfilUsuario" p
      JOIN "Usuario" u ON p.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Usuario crea sus registros de ánimo
CREATE POLICY "Usuario crea sus registros de animo"
  ON "RegistroAnimo"
  FOR INSERT
  WITH CHECK (
    perfil_id IN (
      SELECT p.id FROM "PerfilUsuario" p
      JOIN "Usuario" u ON p.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: Resultado
-- ==========================================

ALTER TABLE "Resultado" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus resultados
CREATE POLICY "Usuario ve sus resultados"
  ON "Resultado"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario crea sus resultados
CREATE POLICY "Usuario crea sus resultados"
  ON "Resultado"
  FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Admin ve todos los resultados
CREATE POLICY "Admin ve todos los resultados"
  ON "Resultado"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: Recomendacion
-- ==========================================

ALTER TABLE "Recomendacion" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus recomendaciones
CREATE POLICY "Usuario ve sus recomendaciones"
  ON "Recomendacion"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario actualiza sus recomendaciones (marcar como vista)
CREATE POLICY "Usuario actualiza sus recomendaciones"
  ON "Recomendacion"
  FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Admin gestiona recomendaciones
CREATE POLICY "Admin gestiona recomendaciones"
  ON "Recomendacion"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Service role crea recomendaciones
CREATE POLICY "Service role crea recomendaciones"
  ON "Recomendacion"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA TABLA: Pago
-- ==========================================

ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus pagos
CREATE POLICY "Usuario ve sus pagos"
  ON "Pago"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario crea sus pagos
CREATE POLICY "Usuario crea sus pagos"
  ON "Pago"
  FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Admin ve todos los pagos
CREATE POLICY "Admin ve todos los pagos"
  ON "Pago"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Service role actualiza pagos (webhooks)
CREATE POLICY "Service role actualiza pagos"
  ON "Pago"
  FOR UPDATE
  TO service_role
  USING (true);

-- ==========================================
-- POLÍTICAS PARA TABLA: Notificacion
-- ==========================================

ALTER TABLE "Notificacion" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus notificaciones
CREATE POLICY "Usuario ve sus notificaciones"
  ON "Notificacion"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario actualiza sus notificaciones (marcar como leída)
CREATE POLICY "Usuario actualiza sus notificaciones"
  ON "Notificacion"
  FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Service role crea notificaciones
CREATE POLICY "Service role crea notificaciones"
  ON "Notificacion"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admin ve todas las notificaciones
CREATE POLICY "Admin ve todas las notificaciones"
  ON "Notificacion"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: ArchivoAdjunto
-- ==========================================

ALTER TABLE "ArchivoAdjunto" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus archivos
CREATE POLICY "Usuario ve sus archivos"
  ON "ArchivoAdjunto"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario crea sus archivos
CREATE POLICY "Usuario crea sus archivos"
  ON "ArchivoAdjunto"
  FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Usuario elimina sus archivos
CREATE POLICY "Usuario elimina sus archivos"
  ON "ArchivoAdjunto"
  FOR DELETE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: Sesion
-- ==========================================

ALTER TABLE "Sesion" ENABLE ROW LEVEL SECURITY;

-- Usuario ve sus sesiones
CREATE POLICY "Usuario ve sus sesiones"
  ON "Sesion"
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- Service role gestiona sesiones
CREATE POLICY "Service role gestiona sesiones"
  ON "Sesion"
  FOR ALL
  TO service_role
  USING (true);

-- ==========================================
-- POLÍTICAS PARA TABLA: Prueba
-- ==========================================

ALTER TABLE "Prueba" ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver las pruebas disponibles
CREATE POLICY "Todos ven pruebas publicas"
  ON "Prueba"
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin gestiona pruebas
CREATE POLICY "Admin gestiona pruebas"
  ON "Prueba"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: Pregunta
-- ==========================================

ALTER TABLE "Pregunta" ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver las preguntas
CREATE POLICY "Todos ven preguntas"
  ON "Pregunta"
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin gestiona preguntas
CREATE POLICY "Admin gestiona preguntas"
  ON "Pregunta"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ==========================================
-- POLÍTICAS PARA TABLA: SesionPublica
-- ==========================================

ALTER TABLE "SesionPublica" ENABLE ROW LEVEL SECURITY;

-- Todos pueden crear sesiones públicas (sin auth)
CREATE POLICY "Todos crean sesiones publicas"
  ON "SesionPublica"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Todos pueden ver sesiones públicas
CREATE POLICY "Todos ven sesiones publicas"
  ON "SesionPublica"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Todos pueden actualizar su sesión pública
CREATE POLICY "Todos actualizan sesiones publicas"
  ON "SesionPublica"
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- ==========================================
-- POLÍTICAS PARA TABLA: MensajePublico
-- ==========================================

ALTER TABLE "MensajePublico" ENABLE ROW LEVEL SECURITY;

-- Todos pueden crear mensajes públicos (sin auth)
CREATE POLICY "Todos crean mensajes publicos"
  ON "MensajePublico"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Todos pueden ver mensajes públicos
CREATE POLICY "Todos ven mensajes publicos"
  ON "MensajePublico"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role puede crear mensajes (respuestas IA)
CREATE POLICY "Service role crea mensajes publicos"
  ON "MensajePublico"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ==========================================
-- HABILITAR REALTIME PARA TABLAS ESPECÍFICAS
-- ==========================================

-- Habilitar Realtime para Mensaje (chat en tiempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE "Mensaje";

-- Habilitar Realtime para Notificacion (notificaciones en vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE "Notificacion";

-- Habilitar Realtime para MensajePublico (chat público)
ALTER PUBLICATION supabase_realtime ADD TABLE "MensajePublico";
