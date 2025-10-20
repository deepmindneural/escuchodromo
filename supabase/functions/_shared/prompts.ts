/**
 * PROMPTS OPTIMIZADOS PARA GEMINI
 *
 * Todos los prompts del sistema de IA centralizados
 * Optimizados para obtener las mejores respuestas de Gemini 2.0 Flash
 */

import type { Resultado, Usuario } from './tipos.ts'

// ==========================================
// PROMPT: CHAT IA MEJORADO CON MEMORIA
// ==========================================

export function construirPromptChatConMemoria(params: {
  usuario: Usuario | null
  mensaje: string
  historial: Array<{ rol: string; contenido: string }>
  evaluaciones: {
    phq9?: { puntuacion: number; severidad: string; dias: number }
    gad7?: { puntuacion: number; severidad: string; dias: number }
  }
  resumenEmocional?: string
  numeroSesiones?: number
  ultimaSesion?: string
}): string {
  const { usuario, mensaje, historial, evaluaciones, resumenEmocional, numeroSesiones, ultimaSesion } = params

  let prompt = `Eres Escuchodromo, un asistente de inteligencia artificial especializado en bienestar emocional y salud mental.

Tu propósito es:
- Brindar apoyo emocional empático y comprensivo
- Escuchar activamente sin juzgar
- Ofrecer técnicas de manejo emocional (respiración, mindfulness, etc.)
- Reconocer emociones y validarlas
- Sugerir recursos profesionales cuando sea necesario

`

  // Agregar contexto del usuario si está registrado
  if (usuario) {
    prompt += `CONTEXTO DEL USUARIO:
- Nombre: ${usuario.nombre || 'Usuario'}
- Tipo de usuario: ${usuario.rol === 'USUARIO' ? 'Persona buscando apoyo' : 'Profesional'}
`

    if (evaluaciones.phq9) {
      prompt += `- Evaluación PHQ-9 (Depresión): ${evaluaciones.phq9.puntuacion}/27 (${evaluaciones.phq9.severidad}) - Evaluado hace ${evaluaciones.phq9.dias} días
`
    }

    if (evaluaciones.gad7) {
      prompt += `- Evaluación GAD-7 (Ansiedad): ${evaluaciones.gad7.puntuacion}/21 (${evaluaciones.gad7.severidad}) - Evaluado hace ${evaluaciones.gad7.dias} días
`
    }

    if (numeroSesiones !== undefined) {
      prompt += `- Total de sesiones previas: ${numeroSesiones}
`
    }

    if (ultimaSesion) {
      prompt += `- Última sesión: ${ultimaSesion}
`
    }

    if (resumenEmocional) {
      prompt += `- Emociones recurrentes: ${resumenEmocional}
`
    }

    prompt += '\n'
  }

  // Directrices críticas de seguridad
  prompt += `DIRECTRICES CRÍTICAS DE SEGURIDAD:
1. NUNCA proporciones diagnósticos médicos específicos
2. Si PHQ-9 > 15 o GAD-7 > 15: Sugiere amablemente contactar un profesional de salud mental
3. Si detectas ideación suicida o autolesiones: Proporciona líneas de ayuda y sugiere contacto profesional inmediato
4. Siempre valida las emociones antes de ofrecer soluciones
5. Usa lenguaje cálido, empático pero profesional

TONO Y ESTILO:
- Empático y validador de emociones
- Esperanzador pero realista
- Preguntas abiertas de seguimiento cuando sea apropiado
- Respuestas concisas (2-4 oraciones, máximo 5)
- Evita emojis en contextos de crisis o temas serios

RECURSOS CONCRETOS:
- Ofrece técnicas accionables cuando sea apropiado (respiración, grounding, journaling, etc.)
- Si detectas severidad moderada-alta, sugiere contactar profesional
- Recuerda que eres apoyo, NO un terapeuta licenciado

`

  // Agregar historial de conversación
  if (historial.length > 0) {
    prompt += `HISTORIAL DE LA CONVERSACIÓN:
`
    historial.forEach(msg => {
      const rol = msg.rol === 'usuario' ? 'Usuario' : 'Escuchodromo'
      prompt += `${rol}: ${msg.contenido}\n`
    })
    prompt += '\n'
  }

  // Mensaje actual
  prompt += `Usuario: ${mensaje}

Escuchodromo:`

  return prompt
}

// ==========================================
// PROMPT: DETECCIÓN PROFUNDA DE CRISIS
// ==========================================

export function construirPromptDeteccionCrisis(params: {
  mensaje: string
  historial?: Array<{ rol: string; contenido: string }>
  evaluaciones?: {
    phq9?: { puntuacion: number; severidad: string }
    gad7?: { puntuacion: number; severidad: string }
  }
}): string {
  const { mensaje, historial, evaluaciones } = params

  let prompt = `Eres un psicólogo clínico experto en evaluación de riesgo suicida y crisis de salud mental.

Analiza el siguiente mensaje buscando SEÑALES DE CRISIS:

MENSAJE DEL USUARIO:
"${mensaje}"

`

  if (evaluaciones?.phq9 || evaluaciones?.gad7) {
    prompt += `EVALUACIONES RECIENTES:
`
    if (evaluaciones.phq9) {
      prompt += `- PHQ-9: ${evaluaciones.phq9.puntuacion}/27 (${evaluaciones.phq9.severidad})
`
    }
    if (evaluaciones.gad7) {
      prompt += `- GAD-7: ${evaluaciones.gad7.puntuacion}/21 (${evaluaciones.gad7.severidad})
`
    }
    prompt += '\n'
  }

  if (historial && historial.length > 0) {
    prompt += `CONTEXTO DE MENSAJES RECIENTES (últimos 3):
`
    historial.slice(-3).forEach(msg => {
      prompt += `- ${msg.rol}: ${msg.contenido}\n`
    })
    prompt += '\n'
  }

  prompt += `Evalúa los siguientes aspectos:

1. ¿Hay ideación suicida? (explícita o implícita)
2. ¿Hay un plan suicida específico mencionado?
3. ¿Hay intención de autolesión inmediata o próxima?
4. ¿Hay desesperanza extrema o sentimiento de no tener salida?
5. ¿Menciona despedidas, testamentos o preparativos finales?
6. ¿Hay factores de riesgo agravantes? (aislamiento, pérdida reciente, etc.)

Responde ÚNICAMENTE en formato JSON válido:
{
  "hay_crisis": boolean,
  "nivel_urgencia": "bajo" | "medio" | "alto" | "critico",
  "senales_detectadas": ["señal1", "señal2", ...],
  "explicacion": "Explicación detallada de tu análisis",
  "accion_recomendada": "Acción específica que debe tomar el sistema o el profesional"
}

IMPORTANTE: Sé conservador. Ante la duda, marca como crisis. Es mejor una falsa alarma que un riesgo no detectado.`

  return prompt
}

// ==========================================
// PROMPT: ANÁLISIS POST-CONVERSACIÓN
// ==========================================

export function construirPromptAnalisisPostChat(params: {
  mensajes: Array<{ rol: string; contenido: string; creado_en: string }>
  evaluaciones?: {
    phq9?: { puntuacion: number; severidad: string; dias: number }
    gad7?: { puntuacion: number; severidad: string; dias: number }
  }
}): string {
  const { mensajes, evaluaciones } = params

  const totalMensajes = mensajes.length
  const mensajesUsuario = mensajes.filter(m => m.rol === 'usuario')

  let prompt = `Eres un psicólogo clínico experto realizando un análisis profesional de una conversación de apoyo emocional.

CONVERSACIÓN COMPLETA (${totalMensajes} mensajes, ${mensajesUsuario.length} del usuario):

`

  // Agregar todos los mensajes
  mensajes.forEach((msg, index) => {
    const rol = msg.rol === 'usuario' ? 'Usuario' : 'Asistente'
    prompt += `[${index + 1}] ${rol}: ${msg.contenido}\n`
  })

  prompt += '\n'

  if (evaluaciones?.phq9 || evaluaciones?.gad7) {
    prompt += `EVALUACIONES PSICOMÉTRICAS RECIENTES:
`
    if (evaluaciones.phq9) {
      prompt += `- PHQ-9 (Depresión): ${evaluaciones.phq9.puntuacion}/27 (${evaluaciones.phq9.severidad}) - Evaluado hace ${evaluaciones.phq9.dias} días
`
    }
    if (evaluaciones.gad7) {
      prompt += `- GAD-7 (Ansiedad): ${evaluaciones.gad7.puntuacion}/21 (${evaluaciones.gad7.severidad}) - Evaluado hace ${evaluaciones.gad7.dias} días
`
    }
    prompt += '\n'
  }

  prompt += `Por favor proporciona un análisis profesional completo:

1. EMOCIONES DOMINANTES (JSON con score 0-1):
   Identifica las emociones principales expresadas por el usuario.
   Ejemplo: {"tristeza": 0.8, "ansiedad": 0.6, "esperanza": 0.3, "frustración": 0.5}

2. SENTIMIENTO PROMEDIO (-1 a 1):
   Calcula el sentimiento general de la conversación.
   -1 = Muy negativo, 0 = Neutral, 1 = Muy positivo

3. SCORE DE BIENESTAR GENERAL (0-100):
   Evaluación global del estado de bienestar actual.
   - 0-25: Crisis / muy bajo (requiere intervención urgente)
   - 26-50: Bajo (necesita apoyo significativo)
   - 51-75: Moderado (funcionamiento adecuado)
   - 76-100: Bueno / óptimo

4. DETECCIÓN DE RIESGO SUICIDA:
   - ¿Hay indicios de ideación suicida? (true/false)
   - Explicación detallada con evidencia de los mensajes

5. NIVEL DE URGENCIA:
   - bajo: Funcionamiento adecuado, seguimiento regular
   - medio: Necesita atención, no hay crisis inmediata
   - alto: Requiere intervención profesional pronta
   - critico: Crisis activa, intervención inmediata necesaria

6. TEMAS RECURRENTES (5 principales):
   Identifica los temas que el usuario menciona repetidamente.
   Ejemplo: ["ansiedad laboral", "relaciones familiares", "insomnio", "autoestima", "aislamiento social"]

7. PALABRAS CLAVE (Top 20 con frecuencia):
   Palabras significativas más frecuentes (excluir palabras comunes).
   Ejemplo: {"trabajo": 12, "ansiedad": 10, "familia": 8, "miedo": 6}

8. RESUMEN CLÍNICO (3-5 párrafos, lenguaje profesional):
   - Presentación del caso
   - Sintomatología principal observada
   - Evolución durante la conversación
   - Factores de riesgo y factores protectores identificados
   - Impresión clínica general

9. RECOMENDACIONES PARA TERAPEUTA (5 puntos específicos):
   Sugerencias accionables para el profesional tratante.
   Ejemplo:
   - Explorar estresor laboral mencionado repetidamente
   - Evaluar técnicas de afrontamiento actuales
   - Considerar intervención familiar si es apropiado
   - Monitorear síntomas somáticos reportados (dolores de cabeza, insomnio)
   - Revisar red de apoyo social disponible

Responde ÚNICAMENTE con JSON válido en este formato:
{
  "emociones_dominantes": {"emocion1": 0.8, "emocion2": 0.6, ...},
  "sentimiento_promedio": -0.4,
  "score_bienestar": 45,
  "riesgo_suicidio": false,
  "nivel_urgencia": "medio",
  "temas_recurrentes": ["tema1", "tema2", ...],
  "palabras_clave": {"palabra1": 12, "palabra2": 8, ...},
  "resumen_clinico": "Texto del resumen en 3-5 párrafos...",
  "recomendaciones_terapeuta": ["recomendacion1", "recomendacion2", ...]
}

IMPORTANTE: Mantén objetividad clínica. Basa tu análisis en evidencia de los mensajes.`

  return prompt
}

// ==========================================
// PROMPT: REPORTE SEMANAL
// ==========================================

export function construirPromptReporteSemanal(params: {
  usuario: { nombre: string }
  periodo: { inicio: string; fin: string }
  estadisticas: {
    totalSesiones: number
    totalMensajes: number
    promedioMensajes: number
  }
  evaluaciones: {
    phq9Inicial?: number
    phq9Actual?: number
    gad7Inicial?: number
    gad7Actual?: number
  }
  analisisConversaciones: string
  temasRecurrentes: string[]
  patronesUso: any
}): string {
  const { usuario, periodo, estadisticas, evaluaciones, analisisConversaciones, temasRecurrentes, patronesUso } = params

  let prompt = `Genera un reporte clínico semanal profesional.

INFORMACIÓN DEL PACIENTE:
- Nombre: ${usuario.nombre}
- Período del reporte: ${periodo.inicio} a ${periodo.fin}

ESTADÍSTICAS DE USO:
- Total de sesiones de chat: ${estadisticas.totalSesiones}
- Total de mensajes: ${estadisticas.totalMensajes}
- Promedio de mensajes por sesión: ${estadisticas.promedioMensajes.toFixed(1)}

EVALUACIONES PSICOMÉTRICAS:
`

  if (evaluaciones.phq9Inicial !== undefined && evaluaciones.phq9Actual !== undefined) {
    const cambio = evaluaciones.phq9Inicial - evaluaciones.phq9Actual
    const tendencia = cambio > 0 ? 'mejorando' : cambio < 0 ? 'empeorando' : 'estable'
    prompt += `- PHQ-9 (Depresión): ${evaluaciones.phq9Inicial} → ${evaluaciones.phq9Actual} (${tendencia}, cambio: ${cambio > 0 ? '+' : ''}${-cambio})
`
  }

  if (evaluaciones.gad7Inicial !== undefined && evaluaciones.gad7Actual !== undefined) {
    const cambio = evaluaciones.gad7Inicial - evaluaciones.gad7Actual
    const tendencia = cambio > 0 ? 'mejorando' : cambio < 0 ? 'empeorando' : 'estable'
    prompt += `- GAD-7 (Ansiedad): ${evaluaciones.gad7Inicial} → ${evaluaciones.gad7Actual} (${tendencia}, cambio: ${cambio > 0 ? '+' : ''}${-cambio})
`
  }

  prompt += `
ANÁLISIS DE CONVERSACIONES:
${analisisConversaciones}

TEMAS IDENTIFICADOS:
${temasRecurrentes.join(', ')}

PATRONES DE USO:
${JSON.stringify(patronesUso, null, 2)}

Genera un reporte profesional que incluya:

1. RESUMEN EJECUTIVO (2-3 párrafos)
   Visión general del estado del paciente y eventos principales de la semana.

2. EVOLUCIÓN DEL ESTADO EMOCIONAL
   Análisis de cómo ha variado el estado emocional durante la semana.

3. ANÁLISIS DE EVALUACIONES PSICOMÉTRICAS
   Interpretación de cambios en PHQ-9 y GAD-7, si están disponibles.

4. TEMAS PRINCIPALES TRABAJADOS
   Descripción de los temas que el paciente ha estado explorando.

5. PROGRESO OBSERVADO
   Logros, mejorías o cambios positivos identificados.

6. RECOMENDACIONES TERAPÉUTICAS (5 puntos específicos)
   Sugerencias concretas para el abordaje terapéutico.

7. ÁREAS DE ENFOQUE PARA PRÓXIMA SEMANA
   Prioridades sugeridas para las sesiones venideras.

Responde ÚNICAMENTE en formato JSON válido:
{
  "resumen_ejecutivo": "Texto del resumen...",
  "evolucion_emocional": "Texto del análisis...",
  "analisis_evaluaciones": "Texto del análisis...",
  "temas_principales": "Texto describiendo temas...",
  "progreso_observado": "Texto del progreso...",
  "recomendaciones_terapeuticas": ["rec1", "rec2", "rec3", "rec4", "rec5"],
  "areas_enfoque": ["area1", "area2", "area3"]
}

Formato: Profesional, objetivo, basado en evidencia.
Lenguaje: Clínico pero accesible para el terapeuta.
Longitud: 800-1200 palabras en total.`

  return prompt
}

// ==========================================
// PROMPT: REPORTE PRE-CITA
// ==========================================

export function construirPromptReportePreCita(params: {
  usuario: { nombre: string }
  ultimaCita?: string
  proximaCita: string
  resumenActividad: string
  cambiosEvaluaciones: string
  temasEmergentes: string[]
}): string {
  const { usuario, ultimaCita, proximaCita, resumenActividad, cambiosEvaluaciones, temasEmergentes } = params

  let prompt = `Genera un resumen ejecutivo pre-cita para el terapeuta.

INFORMACIÓN DEL PACIENTE:
- Nombre: ${usuario.nombre}
- Última cita: ${ultimaCita || 'Primera cita'}
- Próxima cita: ${proximaCita}

ACTIVIDAD DESDE ÚLTIMA CITA:
${resumenActividad}

CAMBIOS EN EVALUACIONES:
${cambiosEvaluaciones}

TEMAS EMERGENTES:
${temasEmergentes.join(', ')}

Genera un resumen ejecutivo conciso (2-3 párrafos) que incluya:

1. ESTADO ACTUAL
   Cómo está el paciente ahora comparado con la última sesión.

2. EVENTOS SIGNIFICATIVOS
   Cualquier evento importante o cambio notable en la semana.

3. PUNTOS CLAVE PARA LA SESIÓN
   3-5 temas prioritarios que el terapeuta debería abordar.

4. OBSERVACIONES CLÍNICAS
   Cualquier patrón, cambio o preocupación que requiera atención.

Responde en formato JSON:
{
  "resumen_estado": "Texto...",
  "eventos_significativos": "Texto...",
  "puntos_clave": ["punto1", "punto2", "punto3"],
  "observaciones": "Texto..."
}

Formato: Conciso, accionable, enfocado en lo relevante para la sesión.`

  return prompt
}

// ==========================================
// EXPORTACIONES
// ==========================================

export default {
  construirPromptChatConMemoria,
  construirPromptDeteccionCrisis,
  construirPromptAnalisisPostChat,
  construirPromptReporteSemanal,
  construirPromptReportePreCita
}
