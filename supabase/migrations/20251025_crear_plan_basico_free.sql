-- ==========================================
-- MIGRACIÓN: Crear plan básico FREE
-- ==========================================
-- Fecha: 2025-10-25
-- Propósito: Garantizar que todos los usuarios tengan un plan básico disponible
-- Relacionado: AUDITORIA_UX_USUARIO_FREE.md
-- ==========================================

-- Insertar plan básico FREE si no existe
INSERT INTO "Plan" (
  codigo,
  nombre,
  descripcion,
  tipo_usuario,
  precio_mensual,
  precio_anual,
  moneda,
  caracteristicas,
  limite_conversaciones,
  limite_evaluaciones,
  acceso_terapeutas,
  limite_pacientes,
  limite_horas_sesion,
  acceso_analytics,
  verificado,
  destacado_busqueda,
  prioridad_soporte,
  esta_activo,
  destacado,
  orden_visualizacion
) VALUES (
  'basico',
  'Plan Básico',
  'Acceso a funcionalidades básicas de la plataforma para comenzar tu viaje de bienestar emocional',
  'paciente',
  0.00,
  0.00,
  'COP',
  '[
    {"nombre": "Chat con IA (20 mensajes/mes)", "incluido": true},
    {"nombre": "Evaluaciones básicas (3/mes)", "incluido": true},
    {"nombre": "Registro de ánimo ilimitado", "incluido": true},
    {"nombre": "Visualización de progreso", "incluido": true},
    {"nombre": "Acceso a recomendaciones básicas", "incluido": true},
    {"nombre": "Soporte por email", "incluido": true},
    {"nombre": "Acceso a terapeutas", "incluido": false},
    {"nombre": "Evaluaciones ilimitadas", "incluido": false},
    {"nombre": "Mensajes ilimitados", "incluido": false},
    {"nombre": "Análisis de voz avanzado", "incluido": false}
  ]'::jsonb,
  20,  -- límite de mensajes con IA por mes
  3,   -- límite de evaluaciones por mes
  false,
  NULL,
  NULL,
  false,
  false,
  false,
  'basica',
  true,  -- plan activo
  false,
  1      -- primer plan en orden de visualización
)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar plan básico en moneda USD también
INSERT INTO "Plan" (
  codigo,
  nombre,
  descripcion,
  tipo_usuario,
  precio_mensual,
  precio_anual,
  moneda,
  caracteristicas,
  limite_conversaciones,
  limite_evaluaciones,
  acceso_terapeutas,
  limite_pacientes,
  limite_horas_sesion,
  acceso_analytics,
  verificado,
  destacado_busqueda,
  prioridad_soporte,
  esta_activo,
  destacado,
  orden_visualizacion
) VALUES (
  'basico_usd',
  'Basic Plan',
  'Access to basic platform features to start your emotional wellness journey',
  'paciente',
  0.00,
  0.00,
  'USD',
  '[
    {"nombre": "AI Chat (20 messages/month)", "incluido": true},
    {"nombre": "Basic Assessments (3/month)", "incluido": true},
    {"nombre": "Unlimited mood tracking", "incluido": true},
    {"nombre": "Progress visualization", "incluido": true},
    {"nombre": "Basic recommendations access", "incluido": true},
    {"nombre": "Email support", "incluido": true},
    {"nombre": "Therapist access", "incluido": false},
    {"nombre": "Unlimited assessments", "incluido": false},
    {"nombre": "Unlimited messages", "incluido": false},
    {"nombre": "Advanced voice analysis", "incluido": false}
  ]'::jsonb,
  20,
  3,
  false,
  NULL,
  NULL,
  false,
  false,
  false,
  'basica',
  true,
  false,
  1
)
ON CONFLICT (codigo) DO NOTHING;

-- Comentarios para documentación
COMMENT ON COLUMN "Plan".codigo IS 'El código "basico" es el plan FREE por defecto para todos los usuarios nuevos';

-- Verificar que el plan se creó correctamente
DO $$
DECLARE
  v_plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plan_count
  FROM "Plan"
  WHERE codigo IN ('basico', 'basico_usd')
    AND esta_activo = true;

  IF v_plan_count < 1 THEN
    RAISE WARNING 'No se pudo crear el plan básico. Verificar restricciones de la tabla.';
  ELSE
    RAISE NOTICE 'Plan(es) básico(s) creado(s) correctamente: % plan(es)', v_plan_count;
  END IF;
END $$;
