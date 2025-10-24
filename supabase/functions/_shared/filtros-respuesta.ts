/**
 * FILTROS Y VALIDACIÓN DE RESPUESTAS GPT OSS
 *
 * Sistema de seguridad para garantizar que GPT OSS:
 * 1. NUNCA mencione ser IA, Gemini, Google o tecnología
 * 2. Mantenga identidad profesional de psicólogo emocional
 * 3. Siga lineamientos clínicos y éticos
 * 4. Proporcione respuestas de calidad terapéutica
 */

// ==========================================
// TIPOS
// ==========================================

export interface ValidacionRespuesta {
  valida: boolean
  errores: string[]
  advertencias: string[]
  score_calidad: number // 0-100
  necesita_reescritura: boolean
}

export interface RespuestaFiltrada {
  respuesta_original: string
  respuesta_filtrada: string
  cambios_aplicados: string[]
  validacion: ValidacionRespuesta
}

// ==========================================
// PATRONES PROHIBIDOS
// ==========================================

const MENCIONES_PROHIBIDAS = [
  // Referencias a IA/tecnología
  {
    patron: /\b(gemini|google\s+ai|google\s+bard)\b/gi,
    reemplazo: 'GPT OSS',
    severidad: 'critica',
    mensaje: 'Mención explícita de Gemini/Google AI detectada'
  },
  {
    patron: /\b(modelo\s+de\s+lenguaje|language\s+model|LLM)\b/gi,
    reemplazo: 'sistema de apoyo emocional',
    severidad: 'critica',
    mensaje: 'Referencia a modelo de lenguaje detectada'
  },
  {
    patron: /\b(inteligencia\s+artificial|IA|AI)\b/gi,
    reemplazo: 'sistema de apoyo',
    severidad: 'alta',
    mensaje: 'Mención de inteligencia artificial'
  },
  {
    patron: /\b(fui\s+(entrenado|programado|creado)\s+por)\b/gi,
    reemplazo: 'estoy diseñado para',
    severidad: 'critica',
    mensaje: 'Referencia al entrenamiento/programación'
  },
  {
    patron: /\b(no\s+soy\s+(humano|persona|real))\b/gi,
    reemplazo: 'soy un sistema de apoyo',
    severidad: 'alta',
    mensaje: 'Negación de humanidad (rompe inmersión)'
  },
  {
    patron: /\b(soy\s+un\s+(bot|robot|programa|sistema\s+automatizado))\b/gi,
    reemplazo: 'soy GPT OSS',
    severidad: 'alta',
    mensaje: 'Auto-identificación como bot'
  },
  {
    patron: /\b(algoritmo|neural\s+network|deep\s+learning)\b/gi,
    reemplazo: 'metodología',
    severidad: 'moderada',
    mensaje: 'Terminología técnica de IA'
  },
  {
    patron: /\b(base\s+de\s+datos\s+de\s+entrenamiento|training\s+data)\b/gi,
    reemplazo: 'conocimiento clínico',
    severidad: 'moderada',
    mensaje: 'Referencia a datos de entrenamiento'
  }
]

// ==========================================
// PATRONES ANTI-TERAPÉUTICOS (a evitar)
// ==========================================

const PATRONES_NO_TERAPEUTICOS = [
  {
    patron: /\b(simplemente|solo tienes que|es fácil)\b/gi,
    tipo: 'minimizacion',
    mensaje: 'Minimización del problema del usuario'
  },
  {
    patron: /\b(no deberías sentirte|no tienes que sentir)\b/gi,
    tipo: 'invalidacion',
    mensaje: 'Invalidación de emociones'
  },
  {
    patron: /\b(todos (pasan por|sienten)|es normal que)\b/gi,
    tipo: 'generalizacion',
    mensaje: 'Generalización excesiva que puede invalidar experiencia individual'
  },
  {
    patron: /\b(ánimo|no te preocupes|todo estará bien)\b/gi,
    tipo: 'optimismo_toxico',
    mensaje: 'Optimismo no validado que puede sentirse insensible'
  },
  {
    patron: /\b(lo que tienes es|tienes (depresión|ansiedad|trastorno))\b/gi,
    tipo: 'diagnostico',
    mensaje: 'Diagnóstico clínico (prohibido sin licencia)'
  }
]

// ==========================================
// VALIDADORES DE CALIDAD TERAPÉUTICA
// ==========================================

const REQUISITOS_CALIDAD = {
  // Longitud apropiada (no muy corto, no muy largo)
  longitud_minima: 50,
  longitud_maxima: 600,
  longitud_optima_min: 150,
  longitud_optima_max: 400,

  // Debe contener validación emocional
  tiene_validacion: /(entiendo|comprendo|es comprensible|tiene sentido|valido|es natural)/i,

  // Debe tener preguntas reflexivas o exploración
  tiene_exploracion: /(\?|te has preguntado|has notado|podrías|te gustaría)/i,

  // Debe ofrecer recursos prácticos
  tiene_tecnica: /(técnica|ejercicio|práctica|puedes intentar|te recomiendo|una forma de)/i,

  // Debe tener tono empático
  tiene_empatia: /(acompañ|apoy|escuch|comprend|valid|sient)/i
}

// ==========================================
// FUNCIÓN PRINCIPAL: FILTRAR Y VALIDAR RESPUESTA
// ==========================================

export function filtrarYValidarRespuesta(
  respuesta: string,
  contexto?: {
    mensaje_usuario?: string
    tiene_crisis?: boolean
    tiene_evaluaciones_severas?: boolean
  }
): RespuestaFiltrada {

  let respuesta_filtrada = respuesta
  const cambios_aplicados: string[] = []

  // ==========================================
  // PASO 1: APLICAR FILTROS DE MENCIONES PROHIBIDAS
  // ==========================================

  for (const filtro of MENCIONES_PROHIBIDAS) {
    const matches = respuesta_filtrada.match(filtro.patron)
    if (matches && matches.length > 0) {
      respuesta_filtrada = respuesta_filtrada.replace(filtro.patron, filtro.reemplazo)
      cambios_aplicados.push(
        `${filtro.severidad.toUpperCase()}: ${filtro.mensaje} - Reemplazado ${matches.length} veces`
      )
    }
  }

  // ==========================================
  // PASO 2: VALIDAR CALIDAD TERAPÉUTICA
  // ==========================================

  const validacion = validarRespuestaPsicologica(respuesta_filtrada, contexto)

  // ==========================================
  // PASO 3: DETECTAR PATRONES NO TERAPÉUTICOS
  // ==========================================

  for (const patron of PATRONES_NO_TERAPEUTICOS) {
    if (patron.patron.test(respuesta_filtrada)) {
      validacion.advertencias.push(
        `${patron.tipo}: ${patron.mensaje}`
      )
      // Penalizar score
      validacion.score_calidad -= 5
    }
  }

  // ==========================================
  // PASO 4: VALIDACIONES DE CONTEXTO
  // ==========================================

  if (contexto?.tiene_crisis) {
    // En crisis, validar que incluya recursos de emergencia
    const tiene_recursos = /((línea|teléfono|número)\s+(de\s+)?(crisis|emergencia|ayuda)|988|106|132)/i.test(respuesta_filtrada)

    if (!tiene_recursos) {
      validacion.errores.push('Contexto de crisis pero no se proporcionaron recursos de emergencia')
      validacion.score_calidad -= 20
      validacion.necesita_reescritura = true
    }
  }

  if (contexto?.tiene_evaluaciones_severas) {
    // Con evaluaciones severas, validar que sugiera profesional
    const sugiere_profesional = /(profesional|terapeuta|psicólogo|psiquiatra|salud mental)/i.test(respuesta_filtrada)

    if (!sugiere_profesional) {
      validacion.advertencias.push('Evaluaciones severas pero no se sugiere profesional')
      validacion.score_calidad -= 10
    }
  }

  // ==========================================
  // PASO 5: NORMALIZAR SCORE FINAL
  // ==========================================

  validacion.score_calidad = Math.max(0, Math.min(100, validacion.score_calidad))

  // Si score es muy bajo, marcar para reescritura
  if (validacion.score_calidad < 50) {
    validacion.necesita_reescritura = true
  }

  // Determinar validez final
  validacion.valida = (
    validacion.errores.length === 0 &&
    validacion.score_calidad >= 60 &&
    !validacion.necesita_reescritura
  )

  return {
    respuesta_original: respuesta,
    respuesta_filtrada,
    cambios_aplicados,
    validacion
  }
}

// ==========================================
// VALIDADOR DE CALIDAD PSICOLÓGICA
// ==========================================

function validarRespuestaPsicologica(
  respuesta: string,
  contexto?: any
): ValidacionRespuesta {

  const errores: string[] = []
  const advertencias: string[] = []
  let score = 100

  // 1. VALIDAR LONGITUD
  const longitud = respuesta.length

  if (longitud < REQUISITOS_CALIDAD.longitud_minima) {
    errores.push(`Respuesta demasiado corta (${longitud} chars). Mínimo: ${REQUISITOS_CALIDAD.longitud_minima}`)
    score -= 30
  } else if (longitud > REQUISITOS_CALIDAD.longitud_maxima) {
    advertencias.push(`Respuesta muy larga (${longitud} chars). Máximo recomendado: ${REQUISITOS_CALIDAD.longitud_maxima}`)
    score -= 10
  }

  // Bonus por longitud óptima
  if (longitud >= REQUISITOS_CALIDAD.longitud_optima_min && longitud <= REQUISITOS_CALIDAD.longitud_optima_max) {
    score += 5
  }

  // 2. VALIDAR ESTRUCTURA TERAPÉUTICA

  // ¿Tiene validación emocional?
  if (!REQUISITOS_CALIDAD.tiene_validacion.test(respuesta)) {
    errores.push('Falta validación emocional explícita')
    score -= 20
  } else {
    score += 5
  }

  // ¿Tiene exploración/preguntas?
  if (!REQUISITOS_CALIDAD.tiene_exploracion.test(respuesta)) {
    advertencias.push('No incluye preguntas reflexivas o exploración')
    score -= 10
  } else {
    score += 5
  }

  // ¿Ofrece técnicas prácticas?
  if (!REQUISITOS_CALIDAD.tiene_tecnica.test(respuesta)) {
    advertencias.push('No ofrece técnicas o recursos prácticos')
    score -= 15
  } else {
    score += 10
  }

  // ¿Tiene tono empático?
  if (!REQUISITOS_CALIDAD.tiene_empatia.test(respuesta)) {
    errores.push('Falta tono empático (palabras clave de empatía ausentes)')
    score -= 25
  } else {
    score += 5
  }

  // 3. VALIDAR QUE NO TENGA MENCIONES RESIDUALES PROHIBIDAS
  const tiene_menciones_ai = /(gemini|google|AI|modelo|entrenado|programado)/i.test(respuesta)
  if (tiene_menciones_ai) {
    errores.push('Menciones prohibidas detectadas (IA/Gemini/Google)')
    score -= 40
  }

  // 4. VALIDAR FORMATO Y MARKDOWN
  const num_emojis = (respuesta.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length
  if (num_emojis > 4) {
    advertencias.push(`Uso excesivo de emojis (${num_emojis}). Máximo recomendado: 3-4`)
    score -= 5
  }

  // 5. BONUS: Incluye datos concretos (técnicas con nombres, pasos)
  const incluye_pasos = /(\d+\.\s|\d+\)\s|primero|segundo|luego|finalmente)/i.test(respuesta)
  if (incluye_pasos) {
    score += 5
  }

  return {
    valida: errores.length === 0,
    errores,
    advertencias,
    score_calidad: score,
    necesita_reescritura: errores.length > 0 || score < 60
  }
}

// ==========================================
// RESPUESTA DE FALLBACK (si falla IA)
// ==========================================

export function generarRespuestaFallback(tipo: 'error' | 'limite' | 'timeout'): string {
  const respuestas = {
    error: `Lamento las dificultades técnicas que estoy experimentando en este momento. Tu bienestar es importante, y quiero asegurarme de brindarte el apoyo que mereces.

¿Podrías intentar reformular tu mensaje? Mientras tanto, si necesitas ayuda urgente, por favor contacta:
- Línea 106 (Colombia): Atención 24/7
- Línea 988: Prevención del Suicidio

Estoy aquí para acompañarte.`,

    limite: `He alcanzado mi capacidad de respuestas por hoy, pero tu bienestar es prioritario.

Si necesitas apoyo inmediato:
- Línea 106: Atención psicológica 24/7
- Cruz Roja: 132
- Puedes agendar una sesión con nuestros profesionales certificados

Volveré a estar disponible mañana para continuar acompañándote.`,

    timeout: `Disculpa la demora. Permíteme un momento para procesar tu mensaje adecuadamente.

Si es urgente, no dudes en contactar:
- Línea 106: Disponible 24/7
- O explora nuestra red de profesionales certificados

Vuelve a intentarlo en un momento.`
  }

  return respuestas[tipo]
}

// ==========================================
// VALIDADOR DE MENSAJE DE USUARIO (detección temprana)
// ==========================================

export function analizarMensajeUsuario(mensaje: string): {
  posible_crisis: boolean
  posible_ideacion_suicida: boolean
  palabras_clave_detectadas: string[]
  requiere_analisis_profundo: boolean
} {

  const palabras_crisis = [
    'suicidio', 'suicidarme', 'matarme', 'acabar con todo',
    'no quiero vivir', 'mejor muerto', 'desaparecer', 'no aguanto más',
    'sin salida', 'no tiene sentido', 'adiós', 'despedida'
  ]

  const palabras_autolesion = [
    'cortarme', 'lastimarme', 'hacerme daño', 'automutilación'
  ]

  const palabras_desesperanza = [
    'desesperanza', 'sin esperanza', 'no hay solución', 'todo mal',
    'nada funciona', 'soy una carga', 'todos estarían mejor sin mí'
  ]

  const mensaje_lower = mensaje.toLowerCase()
  const palabras_detectadas: string[] = []

  let tiene_crisis = false
  let tiene_ideacion = false

  // Detectar crisis severa
  for (const palabra of palabras_crisis) {
    if (mensaje_lower.includes(palabra)) {
      palabras_detectadas.push(palabra)
      tiene_ideacion = true
      tiene_crisis = true
    }
  }

  // Detectar autolesión
  for (const palabra of palabras_autolesion) {
    if (mensaje_lower.includes(palabra)) {
      palabras_detectadas.push(palabra)
      tiene_crisis = true
    }
  }

  // Detectar desesperanza
  let count_desesperanza = 0
  for (const palabra of palabras_desesperanza) {
    if (mensaje_lower.includes(palabra)) {
      palabras_detectadas.push(palabra)
      count_desesperanza++
    }
  }

  // Si tiene muchas palabras de desesperanza, es crisis
  if (count_desesperanza >= 2) {
    tiene_crisis = true
  }

  return {
    posible_crisis: tiene_crisis,
    posible_ideacion_suicida: tiene_ideacion,
    palabras_clave_detectadas: palabras_detectadas,
    requiere_analisis_profundo: tiene_crisis || tiene_ideacion || count_desesperanza >= 1
  }
}

// ==========================================
// EXPORTACIONES
// ==========================================

export default {
  filtrarYValidarRespuesta,
  validarRespuestaPsicologica,
  generarRespuestaFallback,
  analizarMensajeUsuario,
  MENCIONES_PROHIBIDAS,
  PATRONES_NO_TERAPEUTICOS,
  REQUISITOS_CALIDAD
}
