import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RespuestaEvaluacion {
  pregunta_id: string
  valor: number
}

interface RequestBody {
  test_id: string
  usuario_id?: string  // Opcional para usuarios no registrados
  sesion_publica_id?: string  // Para sesiones públicas
  respuestas: RespuestaEvaluacion[]
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // 1. Obtener credenciales
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada')
    }

    // 2. Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Parsear request
    const body: RequestBody = await req.json()
    const { test_id, usuario_id, sesion_publica_id, respuestas } = body

    console.log('[procesar-evaluacion] Request recibido:', {
      test_id,
      usuario_id,
      respuestas_count: respuestas.length,
      timestamp: new Date().toISOString()
    })

    // 4. Validaciones
    if (!test_id || !respuestas || respuestas.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 5. Obtener información del test
    const { data: test, error: testError } = await supabase
      .from('Test')
      .select('id, codigo, nombre, descripcion, categoria')
      .eq('id', test_id)
      .single()

    if (testError || !test) {
      console.error('[procesar-evaluacion] Error al obtener test:', testError)
      return new Response(
        JSON.stringify({ error: 'Test no encontrado' }),
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 6. Calcular puntuación según el tipo de test
    const puntuacion = calcularPuntuacion(respuestas)
    const severidad = determinarSeveridad(puntuacion, test.codigo)

    console.log('[procesar-evaluacion] Resultados calculados:', {
      codigo: test.codigo,
      puntuacion,
      severidad
    })

    // 7. Generar interpretación con IA
    const interpretacion = await generarInterpretacionIA(
      test.codigo,
      test.nombre,
      puntuacion,
      severidad,
      GEMINI_API_KEY
    )

    // 8. Guardar evaluacion en base de datos (solo si hay usuario registrado)
    let evaluacion = null
    if (usuario_id) {
      const { data, error: evaluacionError } = await supabase
        .from('Evaluacion')
        .insert({
          usuario_id,
          test_id,
          respuestas: respuestas,
          puntuacion,
          severidad,
          interpretacion,
          creado_en: new Date().toISOString()
        })
        .select()
        .single()

      if (evaluacionError) {
        console.error('[procesar-evaluacion] Error al guardar evaluacion:', evaluacionError)
      } else {
        evaluacion = data
      }
    }

    // 9. Retornar resultado
    return new Response(
      JSON.stringify({
        test: {
          codigo: test.codigo,
          nombre: test.nombre,
          categoria: test.categoria
        },
        puntuacion,
        severidad,
        interpretacion,
        evaluacion_id: evaluacion?.id || null,
        guardado_en_bd: !!usuario_id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('[procesar-evaluacion] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error al procesar evaluación',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Calcula la puntuación total sumando todos los valores de respuestas
 */
function calcularPuntuacion(respuestas: RespuestaEvaluacion[]): number {
  return respuestas.reduce((total, respuesta) => total + respuesta.valor, 0)
}

/**
 * Determina el nivel de severidad según la puntuación y tipo de prueba
 */
function determinarSeveridad(puntuacion: number, codigoPrueba: string): string {
  // PHQ-9: Escala de Depresión (0-27 puntos)
  if (codigoPrueba === 'PHQ-9') {
    if (puntuacion <= 4) return 'minima'
    if (puntuacion <= 9) return 'leve'
    if (puntuacion <= 14) return 'moderada'
    if (puntuacion <= 19) return 'moderadamente_severa'
    return 'severa'
  }

  // GAD-7: Escala de Ansiedad (0-21 puntos)
  if (codigoPrueba === 'GAD-7') {
    if (puntuacion <= 4) return 'minima'
    if (puntuacion <= 9) return 'leve'
    if (puntuacion <= 14) return 'moderada'
    return 'severa'
  }

  // Default para otras pruebas
  if (puntuacion <= 5) return 'minima'
  if (puntuacion <= 10) return 'leve'
  if (puntuacion <= 15) return 'moderada'
  return 'severa'
}

/**
 * Genera interpretación personalizada usando IA
 */
async function generarInterpretacionIA(
  codigoPrueba: string,
  nombrePrueba: string,
  puntuacion: number,
  severidad: string,
  apiKey: string
): Promise<string> {
  const prompt = `Eres un asistente especializado en salud mental y bienestar emocional.

Un usuario ha completado la evaluación "${nombrePrueba}" (${codigoPrueba}) con los siguientes resultados:

- Puntuación: ${puntuacion}
- Severidad: ${severidad.replace('_', ' ')}

CONTEXTO DE LAS ESCALAS:
${codigoPrueba === 'PHQ-9' ? `
PHQ-9 (Patient Health Questionnaire-9):
- Mínima (0-4): Síntomas mínimos o nulos de depresión
- Leve (5-9): Depresión leve
- Moderada (10-14): Depresión moderada
- Moderadamente severa (15-19): Depresión moderadamente severa
- Severa (20-27): Depresión severa
` : ''}
${codigoPrueba === 'GAD-7' ? `
GAD-7 (Generalized Anxiety Disorder-7):
- Mínima (0-4): Ansiedad mínima
- Leve (5-9): Ansiedad leve
- Moderada (10-14): Ansiedad moderada
- Severa (15-21): Ansiedad severa
` : ''}

INSTRUCCIONES:
1. Explica de forma clara y empática qué significa esta puntuación
2. Valida los sentimientos del usuario
3. Ofrece 3-4 recomendaciones prácticas y accionables
4. Si la severidad es "moderadamente_severa" o "severa", sugiere buscar ayuda profesional
5. Mantén un tono cálido, profesional y esperanzador
6. Máximo 250 palabras

FORMATO DE RESPUESTA:
**Interpretación de resultados:**
[Explicación del resultado]

**Recomendaciones:**
- [Recomendación 1]
- [Recomendación 2]
- [Recomendación 3]
${severidad === 'moderadamente_severa' || severidad === 'severa' ? '- [Mención de ayuda profesional]' : ''}

Genera la interpretación ahora:`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
            topP: 0.9,
            topK: 40
          }
        })
      }
    )

    const data = await response.json()

    if (!data.candidates || !data.candidates[0]) {
      throw new Error('Respuesta inválida de IA')
    }

    return data.candidates[0].content.parts[0].text.trim()

  } catch (error) {
    console.error('[generarInterpretacionIA] Error:', error)

    // Fallback: interpretación genérica si falla IA
    return generarInterpretacionFallback(codigoPrueba, puntuacion, severidad)
  }
}

/**
 * Genera interpretación de respaldo si falla IA
 */
function generarInterpretacionFallback(
  codigoPrueba: string,
  puntuacion: number,
  severidad: string
): string {
  const severidadTexto = severidad.replace('_', ' ')

  let texto = `**Interpretación de resultados:**\n`
  texto += `Tu puntuación de ${puntuacion} indica síntomas de nivel ${severidadTexto}. `

  if (codigoPrueba === 'PHQ-9') {
    if (severidad === 'minima') {
      texto += 'Esto sugiere que actualmente experimentas pocos o ningún síntoma depresivo. Es importante mantener hábitos saludables para preservar tu bienestar emocional.\n\n'
    } else if (severidad === 'leve') {
      texto += 'Experimentas algunos síntomas depresivos que pueden estar afectando tu día a día. Con estrategias de autocuidado y apoyo, es posible mejorar significativamente.\n\n'
    } else if (severidad === 'moderada') {
      texto += 'Los síntomas que experimentas están afectando tu funcionamiento diario. Es recomendable considerar apoyo profesional para desarrollar estrategias de manejo efectivas.\n\n'
    } else {
      texto += 'Los síntomas que experimentas son significativos y requieren atención profesional. Te recomendamos encarecidamente buscar ayuda de un profesional de salud mental.\n\n'
    }
  } else if (codigoPrueba === 'GAD-7') {
    if (severidad === 'minima') {
      texto += 'Esto indica que experimentas poca ansiedad en tu vida cotidiana. Continúa con las prácticas que te ayudan a mantenerte tranquilo/a.\n\n'
    } else if (severidad === 'leve') {
      texto += 'Experimentas cierto nivel de ansiedad que puede estar interfiriendo ocasionalmente con tu vida diaria. Técnicas de relajación y mindfulness pueden ser útiles.\n\n'
    } else if (severidad === 'moderada') {
      texto += 'La ansiedad que experimentas está afectando tu vida diaria de manera notable. Considera buscar apoyo profesional para aprender técnicas de manejo de ansiedad.\n\n'
    } else {
      texto += 'Los síntomas de ansiedad que experimentas son severos y requieren atención profesional. Te recomendamos buscar ayuda de un terapeuta o psicólogo especializado.\n\n'
    }
  }

  texto += `**Recomendaciones:**\n`
  texto += `- Practica técnicas de respiración y mindfulness diariamente\n`
  texto += `- Mantén una rutina de sueño regular y ejercicio moderado\n`
  texto += `- Conecta con personas de confianza y comparte cómo te sientes\n`

  if (severidad === 'moderadamente_severa' || severidad === 'severa') {
    texto += `- **Busca ayuda profesional**: Contacta con un psicólogo o terapeuta licenciado\n`
  }

  return texto
}
