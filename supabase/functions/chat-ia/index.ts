/**
 * Edge Function: Chat con IA usando Google Gemini (100% GRATIS)
 *
 * Google Gemini 2.5 Flash-Lite ofrece:
 * - 1,000 requests por día (GRATIS)
 * - 15 requests por minuto
 * - 250,000 tokens por minuto
 * - Sin tarjeta de crédito requerida
 *
 * API Key: Obtener en https://aistudio.google.com/apikey
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MensajeRequest {
  mensaje: string
  sesion_id: string
  historial?: Array<{ rol: string; contenido: string }>
}

serve(async (req) => {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada. Obtén una en https://aistudio.google.com/apikey')
    }

    const { mensaje, sesion_id, historial = [] }: MensajeRequest = await req.json()

    if (!mensaje || !sesion_id) {
      return new Response(
        JSON.stringify({ error: 'mensaje y sesion_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir contexto de conversación para Gemini
    let contexto = `Eres Escuchodromo, un asistente de inteligencia artificial especializado en bienestar emocional y salud mental.

Tu propósito es:
- Brindar apoyo emocional empático y comprensivo
- Escuchar activamente sin juzgar
- Ofrecer técnicas de manejo emocional (respiración, mindfulness, etc.)
- Reconocer emociones y validarlas
- Sugerir recursos profesionales cuando sea necesario

Directrices:
- Usa un tono cálido, empático y cercano
- Responde en español de forma natural
- Haz preguntas de seguimiento para entender mejor
- Nunca reemplaces a un profesional de salud mental
- Si detectas crisis o ideación suicida, sugiere ayuda profesional inmediata
- Mantén respuestas concisas (2-4 oraciones máximo)
- Usa emojis ocasionalmente para humanizar la conversación 💙

Recuerda: Eres un apoyo, no un terapeuta licenciado.\n\n`

    // Agregar historial previo (máximo 8 mensajes para contexto)
    const historialReciente = historial.slice(-8)
    historialReciente.forEach(msg => {
      contexto += `${msg.rol === 'usuario' ? 'Usuario' : 'Escuchodromo'}: ${msg.contenido}\n`
    })

    // Agregar mensaje actual
    contexto += `Usuario: ${mensaje}\nEscuchodromo:`

    console.log('Enviando request a Gemini API...')

    // Llamar a Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: contexto
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.9,
            topK: 40
          },
          safetySettings: [
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
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Error de Gemini:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`)
    }

    const data = await geminiResponse.json()

    // Extraer respuesta de Gemini
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Respuesta inválida de Gemini API')
    }

    const respuestaIA = data.candidates[0].content.parts[0].text.trim()

    console.log('Respuesta generada:', respuestaIA.substring(0, 100))

    // Análisis básico de emociones (basado en palabras clave)
    const emociones = analizarEmociones(mensaje)
    const sentimiento = calcularSentimiento(mensaje)

    // Guardar respuesta en Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    await supabase.from('MensajePublico').insert({
      sesion_id,
      contenido: respuestaIA,
      rol: 'asistente',
      creado_en: new Date().toISOString()
    })

    // Actualizar última actividad de la sesión
    await supabase
      .from('SesionPublica')
      .update({ ultima_actividad: new Date().toISOString() })
      .eq('sesion_id', sesion_id)

    return new Response(
      JSON.stringify({
        respuesta: respuestaIA,
        emociones,
        sentimiento,
        modelo: 'gemini-2.0-flash-exp',
        tokens_usados: data.usageMetadata?.totalTokenCount || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error en Edge Function:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Error procesando solicitud',
        respuesta: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en un momento. 🙏'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Análisis básico de emociones basado en palabras clave
 */
function analizarEmociones(texto: string): Record<string, number> {
  const textoLower = texto.toLowerCase()

  const patrones = {
    alegria: ['feliz', 'contento', 'alegre', 'bien', 'genial', 'excelente', 'maravilloso', 'emocionado'],
    tristeza: ['triste', 'deprimido', 'solo', 'mal', 'llorar', 'pena', 'melancolía', 'decaído'],
    enojo: ['enojado', 'furioso', 'molesto', 'irritado', 'rabia', 'ira', 'frustrado'],
    miedo: ['miedo', 'asustado', 'temor', 'nervioso', 'pánico', 'preocupado', 'ansiedad'],
    sorpresa: ['sorprendido', 'impresionado', 'increíble', 'wow', 'asombrado'],
    asco: ['asco', 'repulsión', 'desagradable'],
    ansiedad: ['ansioso', 'ansiedad', 'estrés', 'estresado', 'agobiado', 'abrumado'],
    esperanza: ['esperanza', 'optimista', 'mejor', 'mejorar', 'cambio', 'positivo']
  }

  const emociones: Record<string, number> = {}

  Object.entries(patrones).forEach(([emocion, palabras]) => {
    const coincidencias = palabras.filter(palabra => textoLower.includes(palabra)).length
    emociones[emocion] = Math.min(coincidencias * 0.3, 1.0)
  })

  return emociones
}

/**
 * Cálculo simple de sentimiento (-1 a 1)
 */
function calcularSentimiento(texto: string): number {
  const textoLower = texto.toLowerCase()

  const positivas = ['bien', 'feliz', 'alegre', 'mejor', 'gracias', 'genial', 'excelente', 'contento']
  const negativas = ['mal', 'triste', 'horrible', 'terrible', 'peor', 'deprimido', 'solo', 'dolor']

  let puntuacion = 0

  positivas.forEach(palabra => {
    if (textoLower.includes(palabra)) puntuacion += 0.2
  })

  negativas.forEach(palabra => {
    if (textoLower.includes(palabra)) puntuacion -= 0.2
  })

  return Math.max(-1, Math.min(1, puntuacion))
}
