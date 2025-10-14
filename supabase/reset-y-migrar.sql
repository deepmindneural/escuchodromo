-- ==========================================
-- RESET Y MIGRACIÓN COMPLETA
-- Elimina todo y vuelve a crear desde cero
-- ==========================================

-- Deshabilitar Realtime primero (ignorar errores si no existen)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE "Mensaje";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE "Notificacion";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE "MensajePublico";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Eliminar todas las tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS "MensajePublico" CASCADE;
DROP TABLE IF EXISTS "SesionPublica" CASCADE;
DROP TABLE IF EXISTS "Pregunta" CASCADE;
DROP TABLE IF EXISTS "Prueba" CASCADE;
DROP TABLE IF EXISTS "Sesion" CASCADE;
DROP TABLE IF EXISTS "ArchivoAdjunto" CASCADE;
DROP TABLE IF EXISTS "Notificacion" CASCADE;
DROP TABLE IF EXISTS "Pago" CASCADE;
DROP TABLE IF EXISTS "Recomendacion" CASCADE;
DROP TABLE IF EXISTS "Resultado" CASCADE;
DROP TABLE IF EXISTS "RegistroAnimo" CASCADE;
DROP TABLE IF EXISTS "Mensaje" CASCADE;
DROP TABLE IF EXISTS "Conversacion" CASCADE;
DROP TABLE IF EXISTS "PerfilUsuario" CASCADE;
DROP TABLE IF EXISTS "Usuario" CASCADE;

-- Eliminar función de trigger si existe
DROP FUNCTION IF EXISTS update_actualizado_en() CASCADE;

-- ==========================================
-- AHORA CREAR TODO DE NUEVO
-- ==========================================

-- NOTA: Las extensiones deben estar habilitadas desde el Dashboard de Supabase
-- Ve a: Database > Extensions
-- Asegúrate de que estén activas: uuid-ossp, pgcrypto, vector

-- ==========================================
-- TABLA: Usuario
-- ==========================================
CREATE TABLE "Usuario" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  imagen TEXT,
  rol TEXT NOT NULL DEFAULT 'USUARIO' CHECK (rol IN ('USUARIO', 'TERAPEUTA', 'ADMIN')),
  esta_activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

-- Índices para Usuario
CREATE INDEX idx_usuario_email ON "Usuario"(email);
CREATE INDEX idx_usuario_auth_id ON "Usuario"(auth_id);
CREATE INDEX idx_usuario_rol ON "Usuario"(rol);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuario_actualizado_en
  BEFORE UPDATE ON "Usuario"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- TABLA: PerfilUsuario
-- ==========================================
CREATE TABLE "PerfilUsuario" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE UNIQUE NOT NULL,
  telefono TEXT,
  fecha_nacimiento DATE,
  genero TEXT,
  idioma_preferido TEXT DEFAULT 'es' CHECK (idioma_preferido IN ('es', 'en')),
  moneda TEXT DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD')),
  zona_horaria TEXT DEFAULT 'America/Bogota',
  consentimiento_datos BOOLEAN DEFAULT false,
  consentimiento_mkt BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_perfil_usuario_id ON "PerfilUsuario"(usuario_id);

CREATE TRIGGER perfil_actualizado_en
  BEFORE UPDATE ON "PerfilUsuario"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- TABLA: Sesion
-- ==========================================
CREATE TABLE "Sesion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_sesion_usuario_id ON "Sesion"(usuario_id);
CREATE INDEX idx_sesion_token ON "Sesion"(token);

-- ==========================================
-- TABLA: RegistroAnimo
-- ==========================================
CREATE TABLE "RegistroAnimo" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_id UUID REFERENCES "PerfilUsuario"(id) ON DELETE CASCADE NOT NULL,
  animo INTEGER NOT NULL CHECK (animo >= 1 AND animo <= 10),
  energia INTEGER NOT NULL CHECK (energia >= 1 AND energia <= 10),
  estres INTEGER NOT NULL CHECK (estres >= 1 AND estres <= 10),
  notas TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_registro_animo_perfil_id ON "RegistroAnimo"(perfil_id);
CREATE INDEX idx_registro_animo_fecha ON "RegistroAnimo"(creado_en DESC);

-- ==========================================
-- TABLA: Conversacion (con vector embeddings)
-- ==========================================
CREATE TABLE "Conversacion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT,
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'archivada', 'finalizada')),
  contexto_embedding vector(1536),  -- Embedding para búsqueda semántica
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_conversacion_usuario_id ON "Conversacion"(usuario_id);
CREATE INDEX idx_conversacion_estado ON "Conversacion"(estado);
CREATE INDEX idx_conversacion_fecha ON "Conversacion"(creado_en DESC);
CREATE INDEX idx_conversacion_embedding ON "Conversacion" USING ivfflat (contexto_embedding vector_cosine_ops);

CREATE TRIGGER conversacion_actualizado_en
  BEFORE UPDATE ON "Conversacion"
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en();

-- ==========================================
-- TABLA: Mensaje (con análisis IA)
-- ==========================================
CREATE TABLE "Mensaje" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID REFERENCES "Conversacion"(id) ON DELETE CASCADE NOT NULL,
  contenido TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('usuario', 'asistente')),
  tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'audio')),
  url_audio TEXT,
  sentimiento FLOAT CHECK (sentimiento >= -1 AND sentimiento <= 1),
  emociones JSONB,
  embedding vector(1536),  -- Embedding para contexto IA
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_mensaje_conversacion_id ON "Mensaje"(conversacion_id);
CREATE INDEX idx_mensaje_fecha ON "Mensaje"(creado_en);
CREATE INDEX idx_mensaje_embedding ON "Mensaje" USING ivfflat (embedding vector_cosine_ops);

-- ==========================================
-- TABLA: Prueba (Tests Psicológicos)
-- ==========================================
CREATE TABLE "Prueba" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  nombre_en TEXT,
  descripcion TEXT,
  descripcion_en TEXT,
  categoria TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_prueba_codigo ON "Prueba"(codigo);
CREATE INDEX idx_prueba_categoria ON "Prueba"(categoria);

-- ==========================================
-- TABLA: Pregunta
-- ==========================================
CREATE TABLE "Pregunta" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prueba_id UUID REFERENCES "Prueba"(id) ON DELETE CASCADE NOT NULL,
  orden INTEGER NOT NULL,
  texto TEXT NOT NULL,
  texto_en TEXT,
  opciones JSONB NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pregunta_prueba_id ON "Pregunta"(prueba_id);
CREATE INDEX idx_pregunta_orden ON "Pregunta"(orden);

-- ==========================================
-- TABLA: Resultado
-- ==========================================
CREATE TABLE "Resultado" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  prueba_id UUID REFERENCES "Prueba"(id) ON DELETE CASCADE NOT NULL,
  respuestas JSONB NOT NULL,
  puntuacion FLOAT NOT NULL,
  severidad TEXT NOT NULL CHECK (severidad IN ('minima', 'leve', 'moderada', 'moderadamente_severa', 'severa')),
  interpretacion TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_resultado_usuario_id ON "Resultado"(usuario_id);
CREATE INDEX idx_resultado_prueba_id ON "Resultado"(prueba_id);
CREATE INDEX idx_resultado_fecha ON "Resultado"(creado_en DESC);

-- ==========================================
-- TABLA: Recomendacion
-- ==========================================
CREATE TABLE "Recomendacion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  prioridad INTEGER DEFAULT 1,
  titulo TEXT NOT NULL,
  titulo_en TEXT,
  descripcion TEXT NOT NULL,
  descripcion_en TEXT,
  url_accion TEXT,
  esta_activa BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_recomendacion_usuario_id ON "Recomendacion"(usuario_id);
CREATE INDEX idx_recomendacion_prioridad ON "Recomendacion"(prioridad DESC);

-- ==========================================
-- TABLA: Pago
-- ==========================================
CREATE TABLE "Pago" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  monto FLOAT NOT NULL,
  moneda TEXT NOT NULL CHECK (moneda IN ('COP', 'USD')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'fallido', 'cancelado')),
  metodo TEXT NOT NULL CHECK (metodo IN ('stripe', 'paypal', 'transferencia')),
  id_transaccion_externa TEXT,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pago_usuario_id ON "Pago"(usuario_id);
CREATE INDEX idx_pago_estado ON "Pago"(estado);
CREATE INDEX idx_pago_fecha ON "Pago"(creado_en DESC);
CREATE INDEX idx_pago_transaccion ON "Pago"(id_transaccion_externa);

-- ==========================================
-- TABLA: Notificacion
-- ==========================================
CREATE TABLE "Notificacion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'push', 'sms')),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  enviada BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notificacion_usuario_id ON "Notificacion"(usuario_id);
CREATE INDEX idx_notificacion_leida ON "Notificacion"(leida);
CREATE INDEX idx_notificacion_fecha ON "Notificacion"(creado_en DESC);

-- ==========================================
-- TABLA: ArchivoAdjunto
-- ==========================================
CREATE TABLE "ArchivoAdjunto" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamano INTEGER NOT NULL,
  url TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_archivo_usuario_id ON "ArchivoAdjunto"(usuario_id);

-- ==========================================
-- TABLA: SesionPublica (Chat público con límite)
-- ==========================================
CREATE TABLE "SesionPublica" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sesion_id TEXT NOT NULL UNIQUE,
  iniciado_en TIMESTAMP NOT NULL DEFAULT now(),
  ultima_actividad TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_sesion_publica_sesion_id ON "SesionPublica"(sesion_id);

-- ==========================================
-- TABLA: MensajePublico
-- ==========================================
CREATE TABLE "MensajePublico" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sesion_id TEXT NOT NULL,
  contenido TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('usuario', 'asistente')),
  creado_en TIMESTAMP DEFAULT now(),
  FOREIGN KEY (sesion_id) REFERENCES "SesionPublica"(sesion_id) ON DELETE CASCADE
);

CREATE INDEX idx_mensaje_publico_sesion_id ON "MensajePublico"(sesion_id);
CREATE INDEX idx_mensaje_publico_rol ON "MensajePublico"(rol);
CREATE INDEX idx_mensaje_publico_fecha ON "MensajePublico"(creado_en);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- POLÍTICAS PARA TABLA: Usuario
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve su propio perfil"
  ON "Usuario" FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Usuario actualiza su propio perfil"
  ON "Usuario" FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "Admin ve todos los usuarios"
  ON "Usuario" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

CREATE POLICY "Admin gestiona usuarios"
  ON "Usuario" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: PerfilUsuario
ALTER TABLE "PerfilUsuario" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve su perfil"
  ON "PerfilUsuario" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario actualiza su perfil"
  ON "PerfilUsuario" FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario crea su perfil"
  ON "PerfilUsuario" FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admin ve todos los perfiles"
  ON "PerfilUsuario" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: Conversacion
ALTER TABLE "Conversacion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus conversaciones"
  ON "Conversacion" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario crea sus conversaciones"
  ON "Conversacion" FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario actualiza sus conversaciones"
  ON "Conversacion" FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admin ve todas las conversaciones"
  ON "Conversacion" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: Mensaje
ALTER TABLE "Mensaje" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus mensajes"
  ON "Mensaje" FOR SELECT
  USING (
    conversacion_id IN (
      SELECT c.id FROM "Conversacion" c
      JOIN "Usuario" u ON c.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario crea sus mensajes"
  ON "Mensaje" FOR INSERT
  WITH CHECK (
    conversacion_id IN (
      SELECT c.id FROM "Conversacion" c
      JOIN "Usuario" u ON c.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Service role inserta mensajes"
  ON "Mensaje" FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admin ve todos los mensajes"
  ON "Mensaje" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: RegistroAnimo
ALTER TABLE "RegistroAnimo" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus registros de animo"
  ON "RegistroAnimo" FOR SELECT
  USING (
    perfil_id IN (
      SELECT p.id FROM "PerfilUsuario" p
      JOIN "Usuario" u ON p.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario crea sus registros de animo"
  ON "RegistroAnimo" FOR INSERT
  WITH CHECK (
    perfil_id IN (
      SELECT p.id FROM "PerfilUsuario" p
      JOIN "Usuario" u ON p.usuario_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- POLÍTICAS PARA TABLA: Resultado
ALTER TABLE "Resultado" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus resultados"
  ON "Resultado" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario crea sus resultados"
  ON "Resultado" FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admin ve todos los resultados"
  ON "Resultado" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: Recomendacion
ALTER TABLE "Recomendacion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus recomendaciones"
  ON "Recomendacion" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario actualiza sus recomendaciones"
  ON "Recomendacion" FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admin gestiona recomendaciones"
  ON "Recomendacion" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

CREATE POLICY "Service role crea recomendaciones"
  ON "Recomendacion" FOR INSERT
  TO service_role
  WITH CHECK (true);

-- POLÍTICAS PARA TABLA: Pago
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus pagos"
  ON "Pago" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario crea sus pagos"
  ON "Pago" FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admin ve todos los pagos"
  ON "Pago" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

CREATE POLICY "Service role actualiza pagos"
  ON "Pago" FOR UPDATE
  TO service_role
  USING (true);

-- POLÍTICAS PARA TABLA: Notificacion
ALTER TABLE "Notificacion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus notificaciones"
  ON "Notificacion" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario actualiza sus notificaciones"
  ON "Notificacion" FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Service role crea notificaciones"
  ON "Notificacion" FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admin ve todas las notificaciones"
  ON "Notificacion" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: ArchivoAdjunto
ALTER TABLE "ArchivoAdjunto" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus archivos"
  ON "ArchivoAdjunto" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario crea sus archivos"
  ON "ArchivoAdjunto" FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuario elimina sus archivos"
  ON "ArchivoAdjunto" FOR DELETE
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

-- POLÍTICAS PARA TABLA: Sesion
ALTER TABLE "Sesion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus sesiones"
  ON "Sesion" FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Service role gestiona sesiones"
  ON "Sesion" FOR ALL
  TO service_role
  USING (true);

-- POLÍTICAS PARA TABLA: Prueba
ALTER TABLE "Prueba" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos ven pruebas publicas"
  ON "Prueba" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin gestiona pruebas"
  ON "Prueba" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: Pregunta
ALTER TABLE "Pregunta" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos ven preguntas"
  ON "Pregunta" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin gestiona preguntas"
  ON "Pregunta" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- POLÍTICAS PARA TABLA: SesionPublica
ALTER TABLE "SesionPublica" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos crean sesiones publicas"
  ON "SesionPublica" FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Todos ven sesiones publicas"
  ON "SesionPublica" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Todos actualizan sesiones publicas"
  ON "SesionPublica" FOR UPDATE
  TO anon, authenticated
  USING (true);

-- POLÍTICAS PARA TABLA: MensajePublico
ALTER TABLE "MensajePublico" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos crean mensajes publicos"
  ON "MensajePublico" FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Todos ven mensajes publicos"
  ON "MensajePublico" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role crea mensajes publicos"
  ON "MensajePublico" FOR INSERT
  TO service_role
  WITH CHECK (true);

-- HABILITAR REALTIME PARA TABLAS ESPECÍFICAS
ALTER PUBLICATION supabase_realtime ADD TABLE "Mensaje";
ALTER PUBLICATION supabase_realtime ADD TABLE "Notificacion";
ALTER PUBLICATION supabase_realtime ADD TABLE "MensajePublico";

-- ==========================================
-- SEED DATA - Tests Psicológicos
-- ==========================================

INSERT INTO "Prueba" (codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  'PHQ9',
  'Cuestionario de Salud del Paciente-9',
  'Patient Health Questionnaire-9',
  'Evalúa síntomas de depresión en las últimas 2 semanas',
  'Assesses depression symptoms in the last 2 weeks',
  'depresion'
);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  1,
  'Poco interés o placer en hacer cosas',
  'Little interest or pleasure in doing things',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'PHQ9';

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  2,
  'Sentirse decaído/a, deprimido/a o sin esperanzas',
  'Feeling down, depressed, or hopeless',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'PHQ9';

INSERT INTO "Prueba" (codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
VALUES (
  'GAD7',
  'Escala del Trastorno de Ansiedad Generalizada-7',
  'Generalized Anxiety Disorder-7',
  'Evalúa síntomas de ansiedad en las últimas 2 semanas',
  'Assesses anxiety symptoms in the last 2 weeks',
  'ansiedad'
);

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  1,
  'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
  'Feeling nervous, anxious or on edge',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'GAD7';

INSERT INTO "Pregunta" (prueba_id, orden, texto, texto_en, opciones)
SELECT
  id,
  2,
  'No poder dejar de preocuparse o controlar la preocupación',
  'Not being able to stop or control worrying',
  '[
    {"valor": 0, "etiqueta": "Para nada", "etiquetaEn": "Not at all"},
    {"valor": 1, "etiqueta": "Varios días", "etiquetaEn": "Several days"},
    {"valor": 2, "etiqueta": "Más de la mitad de los días", "etiquetaEn": "More than half the days"},
    {"valor": 3, "etiqueta": "Casi todos los días", "etiquetaEn": "Nearly every day"}
  ]'::jsonb
FROM "Prueba" WHERE codigo = 'GAD7';
