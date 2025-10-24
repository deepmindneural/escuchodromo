/**
 * CONFIGURACIÓN CENTRAL PARA EDGE FUNCTIONS DE IA
 *
 * Configuración compartida entre todas las Edge Functions
 * del sistema de IA de Escuchodromo
 */

import type { RateLimitConfig, GeminiConfig } from './tipos.ts'

// ==========================================
// CONFIGURACIÓN DE API DE IA
// ==========================================

export const GEMINI_CONFIG: GeminiConfig = {
  apiKey: Deno.env.get('GEMINI_API_KEY') || '',
  model: 'gemini-2.0-flash-exp',
  defaultTemperature: 0.7,
  defaultMaxTokens: 1000,
  timeout: 30000, // 30 segundos
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo inicial
}

export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.model}:generateContent`

// ==========================================
// CONFIGURACIÓN DE RATE LIMITING
// ==========================================

export const RATE_LIMIT: RateLimitConfig = {
  maxCalls: 1000,      // Límite diario de IA (tier gratuito)
  window: 86400000,    // 24 horas en milisegundos
  reserva: 100,        // Reservar para emergencias y crisis
  prioridad: {
    crisis: 1,         // Máxima prioridad (detección de riesgo suicida)
    chat: 2,          // Alta prioridad (interacción con usuario)
    analisis: 3,      // Media prioridad (análisis post-conversación)
    reportes: 4       // Baja prioridad (reportes periódicos)
  }
}

// ==========================================
// CONFIGURACIÓN DE ANÁLISIS
// ==========================================

export const ANALISIS_CONFIG = {
  // Mínimo de mensajes para hacer análisis post-chat
  mensajesMinimos: 5,

  // Historial máximo a incluir en el análisis
  maxMensajesAnalisis: 100,

  // Historial de conversación en chat (contexto)
  maxMensajesHistorial: 20,

  // TTL de cache para insights dashboard
  ttlInsights: '1 hour',

  // Límite de palabras clave a extraer
  maxPalabrasClave: 20,

  // Límite de temas recurrentes a identificar
  maxTemasRecurrentes: 5,
}

// ==========================================
// CONFIGURACIÓN DE ALERTAS
// ==========================================

export const ALERTAS_CONFIG = {
  // Palabras clave que activan análisis profundo de crisis
  palabrasClavesCrisis: [
    // Ideación suicida explícita
    'suicidio',
    'suicidarme',
    'matarme',
    'quitarme la vida',
    'acabar con mi vida',
    'terminar con todo',
    'no quiero vivir',
    'mejor muerto',
    'mejor muerta',

    // Planificación
    'plan para',
    'voy a acabar',
    'voy a terminar',
    'me voy a matar',

    // Autolesión
    'cortarme',
    'hacerme daño',
    'lastimarme',
    'herirme',

    // Desesperanza extrema
    'no hay salida',
    'no tiene sentido',
    'todo está perdido',
    'no puedo más',
    'es insoportable',

    // Despedidas
    'adiós a todos',
    'última vez',
    'despedirme',
    'me despido'
  ],

  // Notificar a estos roles cuando hay alerta
  rolesNotificar: ['TERAPEUTA', 'ADMIN'],

  // Enviar email para alertas críticas
  enviarEmailCritico: true,

  // Tiempo máximo para responder alerta (horas)
  tiempoMaximoRespuesta: 2,
}

// ==========================================
// CONFIGURACIÓN DE REPORTES
// ==========================================

export const REPORTES_CONFIG = {
  // Día de la semana para generar reportes semanales (1 = Lunes)
  diaSemanalReporte: 1,

  // Hora del día para generar reportes (UTC)
  horaReporte: 6, // 6:00 AM

  // Generar reporte pre-cita (horas antes)
  horasAntesPreCita: 24,

  // Máximo de reportes a generar en paralelo
  maxReportesParalelos: 10,

  // Incluir gráficos en reportes PDF
  incluirGraficos: true,
}

// ==========================================
// CONFIGURACIÓN DE EVALUACIONES
// ==========================================

export const EVALUACIONES_CONFIG = {
  // Códigos de pruebas psicológicas
  codigoPHQ9: 'PHQ-9',
  codigoGAD7: 'GAD-7',

  // Umbrales de severidad PHQ-9
  phq9: {
    minima: { min: 0, max: 4 },
    leve: { min: 5, max: 9 },
    moderada: { min: 10, max: 14 },
    moderadamente_severa: { min: 15, max: 19 },
    severa: { min: 20, max: 27 }
  },

  // Umbrales de severidad GAD-7
  gad7: {
    minima: { min: 0, max: 4 },
    leve: { min: 5, max: 9 },
    moderada: { min: 10, max: 14 },
    severa: { min: 15, max: 21 }
  },

  // Score que sugiere intervención profesional
  umbralIntervencion: {
    phq9: 15, // Moderadamente severa o mayor
    gad7: 15  // Severa o mayor
  }
}

// ==========================================
// CONFIGURACIÓN DE SCORE DE BIENESTAR
// ==========================================

export const SCORE_BIENESTAR_CONFIG = {
  // Pesos para calcular score de bienestar (0-100)
  pesos: {
    sentimiento: 0.30,        // 30% - Sentimiento general de mensajes
    emociones_positivas: 0.20, // 20% - Alegría, esperanza, etc.
    phq9: 0.25,               // 25% - Depresión (inverso)
    gad7: 0.25                // 25% - Ansiedad (inverso)
  },

  // Interpretación de scores
  interpretacion: {
    crisis: { min: 0, max: 25 },      // Requiere intervención urgente
    bajo: { min: 26, max: 50 },       // Necesita apoyo significativo
    moderado: { min: 51, max: 75 },   // Funcionamiento adecuado
    bueno: { min: 76, max: 100 }      // Bienestar óptimo
  }
}

// ==========================================
// CONFIGURACIÓN DE CORS
// ==========================================

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
}

// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================

export const SUPABASE_CONFIG = {
  url: Deno.env.get('SUPABASE_URL') || '',
  serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  anonKey: Deno.env.get('SUPABASE_ANON_KEY') || '',
}

// ==========================================
// SAFETY SETTINGS PARA IA
// ==========================================

export const GEMINI_SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_ONLY_HIGH'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH'
  }
]

// ==========================================
// GENERACIÓN DE CONFIGURACIÓN SEGÚN TIPO
// ==========================================

export function obtenerConfigGemini(tipo: 'chat' | 'analisis' | 'crisis' | 'reporte') {
  const baseConfig = {
    safetySettings: GEMINI_SAFETY_SETTINGS
  }

  switch (tipo) {
    case 'chat':
      return {
        ...baseConfig,
        generationConfig: {
          temperature: 0.7,     // Equilibrio creatividad/coherencia
          maxOutputTokens: 500, // Respuestas concisas
          topP: 0.9,
          topK: 40
        }
      }

    case 'crisis':
      return {
        ...baseConfig,
        generationConfig: {
          temperature: 0.3,      // Más determinista para análisis
          maxOutputTokens: 800,  // Análisis detallado
          topP: 0.85,
          topK: 30
        }
      }

    case 'analisis':
      return {
        ...baseConfig,
        generationConfig: {
          temperature: 0.5,      // Balance análisis/creatividad
          maxOutputTokens: 2000, // Análisis completo
          topP: 0.9,
          topK: 40
        }
      }

    case 'reporte':
      return {
        ...baseConfig,
        generationConfig: {
          temperature: 0.6,       // Profesional pero no rígido
          maxOutputTokens: 3000,  // Reportes extensos
          topP: 0.9,
          topK: 40
        }
      }

    default:
      return baseConfig
  }
}

// ==========================================
// VALIDACIÓN DE CONFIGURACIÓN
// ==========================================

export function validarConfiguracion(): { valida: boolean; errores: string[] } {
  const errores: string[] = []

  if (!GEMINI_CONFIG.apiKey) {
    errores.push('GEMINI_API_KEY no configurada')
  }

  if (!SUPABASE_CONFIG.url) {
    errores.push('SUPABASE_URL no configurada')
  }

  if (!SUPABASE_CONFIG.serviceRoleKey) {
    errores.push('SUPABASE_SERVICE_ROLE_KEY no configurada')
  }

  return {
    valida: errores.length === 0,
    errores
  }
}

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================

export default {
  GEMINI_CONFIG,
  GEMINI_API_URL,
  RATE_LIMIT,
  ANALISIS_CONFIG,
  ALERTAS_CONFIG,
  REPORTES_CONFIG,
  EVALUACIONES_CONFIG,
  SCORE_BIENESTAR_CONFIG,
  CORS_HEADERS,
  SUPABASE_CONFIG,
  GEMINI_SAFETY_SETTINGS,
  obtenerConfigGemini,
  validarConfiguracion
}
