-- ======================================================
-- MIGRACIÓN: Auditoría de Eventos de Autenticación
-- ======================================================
-- Fecha: 19 de octubre de 2025
-- VULNERABILIDAD CORREGIDA: MEDIO #2
-- ======================================================

CREATE TABLE IF NOT EXISTS public."AuditoriaAuth" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public."Usuario"(id) ON DELETE SET NULL,
  evento TEXT NOT NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  exitoso BOOLEAN DEFAULT false,
  metadata JSONB,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auditoria_usuario ON public."AuditoriaAuth"(usuario_id, creado_en DESC);
CREATE INDEX idx_auditoria_evento ON public."AuditoriaAuth"(evento, creado_en DESC);
CREATE INDEX idx_auditoria_fecha ON public."AuditoriaAuth"(creado_en DESC);

ALTER TABLE public."AuditoriaAuth" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven toda la auditor\u00eda"
  ON public."AuditoriaAuth"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

CREATE POLICY "Usuarios ven su propia auditor\u00eda"
  ON public."AuditoriaAuth"
  FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM public."Usuario" WHERE auth_id = auth.uid()
    )
  );
