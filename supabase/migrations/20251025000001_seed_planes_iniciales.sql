-- ==========================================
-- MIGRACIÓN: Seed de planes iniciales (pacientes)
-- ==========================================
-- Fecha: 2025-10-25
-- Propósito: Datos iniciales de planes para usuarios pacientes
-- ==========================================

-- Insertar planes para PACIENTES
INSERT INTO "Plan" (
  codigo, nombre, descripcion, tipo_usuario,
  precio_mensual, precio_anual, moneda,
  caracteristicas,
  limite_conversaciones, limite_evaluaciones, acceso_terapeutas,
  prioridad_soporte, esta_activo, destacado, orden_visualizacion
) VALUES

-- Plan Básico (GRATIS)
(
  'basico',
  'Básico',
  'Plan gratuito con funcionalidades esenciales para comenzar tu viaje de bienestar emocional',
  'paciente',
  0,
  0,
  'COP',
  '[
    {"nombre": "Chat con IA (100 mensajes/mes)", "incluido": true},
    {"nombre": "Análisis de emociones básico", "incluido": true},
    {"nombre": "5 evaluaciones psicológicas/mes", "incluido": true},
    {"nombre": "Historial de 30 días", "incluido": true},
    {"nombre": "Acceso a profesionales", "incluido": false},
    {"nombre": "Recomendaciones personalizadas", "incluido": false}
  ]'::jsonb,
  100, -- limite_conversaciones
  5,   -- limite_evaluaciones
  false, -- acceso_terapeutas
  'basica',
  true,
  false,
  1
),

-- Plan Premium
(
  'premium',
  'Premium',
  'Plan completo con acceso a profesionales certificados y funciones avanzadas',
  'paciente',
  49900,
  479000, -- 20% descuento anual
  'COP',
  '[
    {"nombre": "Chat ilimitado con IA", "incluido": true},
    {"nombre": "Análisis avanzado de emociones", "incluido": true},
    {"nombre": "Evaluaciones psicológicas ilimitadas", "incluido": true},
    {"nombre": "Historial completo (365 días)", "incluido": true},
    {"nombre": "Acceso a profesionales certificados", "incluido": true},
    {"nombre": "Recomendaciones personalizadas con IA", "incluido": true},
    {"nombre": "Soporte prioritario", "incluido": true},
    {"nombre": "Sesiones terapéuticas", "incluido": false}
  ]'::jsonb,
  NULL, -- ilimitado
  NULL, -- ilimitado
  true,
  'prioritaria',
  true,
  true, -- destacado
  2
),

-- Plan Profesional (para pacientes que quieren todo)
(
  'profesional',
  'Profesional',
  'Plan premium con sesiones terapéuticas incluidas y soporte VIP',
  'paciente',
  99900,
  959000, -- 20% descuento anual
  'COP',
  '[
    {"nombre": "Todo lo del plan Premium", "incluido": true},
    {"nombre": "4 sesiones terapéuticas/mes", "incluido": true},
    {"nombre": "Reportes clínicos personalizados", "incluido": true},
    {"nombre": "Soporte VIP 24/7", "incluido": true},
    {"nombre": "Acceso prioritario a nuevos profesionales", "incluido": true},
    {"nombre": "Historial completo (730 días)", "incluido": true}
  ]'::jsonb,
  NULL, -- ilimitado
  NULL, -- ilimitado
  true,
  'premium',
  true,
  false,
  3
);

-- Insertar planes para PROFESIONALES
INSERT INTO "Plan" (
  codigo, nombre, descripcion, tipo_usuario,
  precio_mensual, precio_anual, moneda,
  caracteristicas,
  limite_pacientes, limite_horas_sesion, acceso_analytics,
  verificado, destacado_busqueda,
  prioridad_soporte, esta_activo, destacado, orden_visualizacion
) VALUES

-- Plan Trial (GRATIS por 14 días)
(
  'profesional_trial',
  'Trial Profesional',
  'Prueba gratuita de 14 días con acceso completo a la plataforma',
  'profesional',
  0,
  0,
  'COP',
  '[
    {"nombre": "Hasta 3 pacientes activos", "incluido": true},
    {"nombre": "Chat y videollamadas ilimitadas", "incluido": true},
    {"nombre": "Reportes clínicos básicos", "incluido": true},
    {"nombre": "14 días de prueba gratuita", "incluido": true},
    {"nombre": "Analytics avanzado", "incluido": false},
    {"nombre": "Insignia verificado", "incluido": false}
  ]'::jsonb,
  3,    -- limite_pacientes
  NULL, -- ilimitado
  false,
  false,
  false,
  'basica',
  true,
  false,
  101
),

-- Plan Inicial
(
  'profesional_inicial',
  'Inicial',
  'Plan ideal para profesionales freelance que están comenzando',
  'profesional',
  69900,
  671000, -- 20% descuento anual
  'COP',
  '[
    {"nombre": "Hasta 10 pacientes activos", "incluido": true},
    {"nombre": "Chat y videollamadas ilimitadas", "incluido": true},
    {"nombre": "Reportes clínicos personalizados", "incluido": true},
    {"nombre": "Agenda digital automatizada", "incluido": true},
    {"nombre": "Soporte por email", "incluido": true},
    {"nombre": "Analytics básico", "incluido": true},
    {"nombre": "Insignia verificado", "incluido": false},
    {"nombre": "Destacado en búsqueda", "incluido": false}
  ]'::jsonb,
  10,   -- limite_pacientes
  NULL, -- ilimitado
  true,
  false,
  false,
  'basica',
  true,
  true, -- destacado
  102
),

-- Plan Crecimiento
(
  'profesional_crecimiento',
  'Crecimiento',
  'Plan para profesionales en expansión que quieren crecer su práctica',
  'profesional',
  149900,
  1439000, -- 20% descuento anual
  'COP',
  '[
    {"nombre": "Hasta 50 pacientes activos", "incluido": true},
    {"nombre": "Todo lo del plan Inicial", "incluido": true},
    {"nombre": "Analytics avanzado con gráficos", "incluido": true},
    {"nombre": "Insignia verificado en perfil", "incluido": true},
    {"nombre": "Destacado en búsqueda", "incluido": true},
    {"nombre": "Soporte prioritario por chat", "incluido": true},
    {"nombre": "Acceso a webinars y capacitaciones", "incluido": true},
    {"nombre": "API de integración", "incluido": false}
  ]'::jsonb,
  50,   -- limite_pacientes
  NULL, -- ilimitado
  true,
  true,  -- verificado
  true,  -- destacado en búsqueda
  'prioritaria',
  true,
  false,
  103
),

-- Plan Plus
(
  'profesional_plus',
  'Plus',
  'Plan premium con pacientes ilimitados y todas las funciones avanzadas',
  'profesional',
  299900,
  2879000, -- 20% descuento anual
  'COP',
  '[
    {"nombre": "Pacientes ilimitados", "incluido": true},
    {"nombre": "Todo lo del plan Crecimiento", "incluido": true},
    {"nombre": "IA para análisis de sesiones", "incluido": true},
    {"nombre": "Transcripción automática de sesiones", "incluido": true},
    {"nombre": "API de integración con otros sistemas", "incluido": true},
    {"nombre": "Soporte VIP por WhatsApp", "incluido": true},
    {"nombre": "Capacitación personalizada 1-on-1", "incluido": true},
    {"nombre": "Prioridad máxima en listados", "incluido": true}
  ]'::jsonb,
  NULL, -- ilimitado
  NULL, -- ilimitado
  true,
  true,
  true,
  'premium',
  true,
  false,
  104
);

-- Comentario de verificación
COMMENT ON TABLE "Plan" IS 'Planes iniciales: 3 para pacientes + 4 para profesionales (incluyendo trial de 14 días)';
