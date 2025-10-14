-- ==========================================
-- MIGRACIÓN INICIAL - ESCUCHODROMO
-- Fecha: 2025-01-14
-- Convertido desde Prisma Schema
-- ==========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- Para IA con embeddings

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
