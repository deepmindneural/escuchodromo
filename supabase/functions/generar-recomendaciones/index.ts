import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GPTOSSClient } from '../_shared/gptoss-client.ts'

interface RequestBody {
  usuario_id: string
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 2. Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Crear cliente GPT OSS
    const gptossCliente = new GPTOSSClient()

    // 4. Parsear request
    const body: RequestBody = await req.json()
    const { usuario_id } = body

    console.log('[generar-recomendaciones] Request recibido:', {
      usuario_id,
      timestamp: new Date().toISOString()
    })

    if (!usuario_id) {
      return new Response(
        JSON.stringify({ error: 'usuario_id es requerido' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 5. Obtener evaluaciones recientes del usuario (últimos 3 meses)
    const { data: evaluaciones, error: evaluacionesError } = await supabase
      .from('Evaluacion')
      .select(`
        id,
        puntuacion,
        severidad,
        creado_en,
        Test (codigo, nombre)
      `)
      .eq('usuario_id', usuario_id)
      .gte('creado_en', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('creado_en', { ascending: false })
      .limit(10)

    if (evaluacionesError) {
      console.error('[generar-recomendaciones] Error al obtener evaluaciones:', evaluacionesError)
    }

    // 6. Obtener conversaciones recientes (últimos 7 días)
    const { data: conversaciones, error: conversacionesError } = await supabase
      .from('Conversacion')
      .select(`
        id,
        titulo,
        Mensaje (
          contenido,
          rol,
          emociones,
          sentimiento
        )
      `)
      .eq('usuario_id', usuario_id)
      .gte('creado_en', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('creado_en', { ascending: false })
      .limit(5)

    if (conversacionesError) {
      console.error('[generar-recomendaciones] Error al obtener conversaciones:', conversacionesError)
    }

    // 7. Analizar datos y preparar contexto para GPT OSS
    const contextoEvaluaciones = (evaluaciones || []).map(ev => ({
      test: ev.Test?.nombre || 'Desconocido',
      puntuacion: ev.puntuacion,
      severidad: ev.severidad,
      fecha: new Date(ev.creado_en).toLocaleDateString('es-ES')
    }))

    // Analizar emociones predominantes en conversaciones
    const emocionesAgregadas: Record<string, number> = {}
    let sentimientoPromedio = 0
    let totalMensajes = 0

    if (conversaciones) {
      conversaciones.forEach(conv => {
        conv.Mensaje?.forEach((msg: any) => {
          if (msg.emociones) {
            Object.entries(msg.emociones).forEach(([emocion, valor]) => {
              emocionesAgregadas[emocion] = (emocionesAgregadas[emocion] || 0) + (valor as number)
            })
          }
          if (msg.sentimiento !== null) {
            sentimientoPromedio += msg.sentimiento
            totalMensajes++
          }
        })
      })
    }

    if (totalMensajes > 0) {
      sentimientoPromedio = sentimientoPromedio / totalMensajes
    }

    // 8. Generar recomendaciones con GPT OSS
    const recomendaciones = await generarRecomendacionesIA(
      contextoEvaluaciones,
      emocionesAgregadas,
      sentimientoPromedio,
      gptossCliente
    )

    // 9. Guardar recomendaciones en la base de datos
    const recomendacionesGuardadas = []
    for (const rec of recomendaciones) {
      const { data, error } = await supabase
        .from('Recomendacion')
        .insert({
          usuario_id,
          tipo: rec.tipo,
          prioridad: rec.prioridad,
          titulo: rec.titulo,
          descripcion: rec.descripcion,
          url_accion: rec.url_accion || null,
          esta_activa: true,
          creado_en: new Date().toISOString()
        })
        .select()
        .single()

      if (!error && data) {
        recomendacionesGuardadas.push(data)
      }
    }

    // 10. Retornar resultado
    return new Response(
      JSON.stringify({
        recomendaciones: recomendacionesGuardadas,
        total: recomendacionesGuardadas.length,
        contexto: {
          evaluaciones_analizadas: contextoEvaluaciones.length,
          conversaciones_analizadas: conversaciones?.length || 0,
          sentimiento_promedio: sentimientoPromedio,
          emociones_predominantes: Object.keys(emocionesAgregadas).slice(0, 3)
        }
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
    console.error('[generar-recomendaciones] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error al generar recomendaciones',
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
// FUNCIÓN AUXILIAR: Generar Recomendaciones con IA
// ==========================================

interface Evaluacion {
  test: string
  puntuacion: number
  severidad: string
  fecha: string
}

interface Recomendacion {
  tipo: string
  prioridad: number
  titulo: string
  descripcion: string
  url_accion?: string
}

async function generarRecomendacionesIA(
  evaluaciones: Evaluacion[],
  emociones: Record<string, number>,
  sentimiento: number,
  gptossCliente: GPTOSSClient
): Promise<Recomendacion[]> {
  const prompt = `Eres GPT OSS, un sistema de apoyo emocional especializado en bienestar mental.

Analiza la siguiente información de un usuario y genera 5 recomendaciones personalizadas y prácticas:

**Evaluaciones recientes:**
${evaluaciones.length > 0 ? evaluaciones.map(e =>
  `- ${e.test}: Puntuación ${e.puntuacion} (${e.severidad}) - ${e.fecha}`
).join('\n') : 'No hay evaluaciones recientes'}

**Análisis emocional (últimos 7 días):**
- Sentimiento promedio: ${sentimiento.toFixed(2)} (escala -1 a 1)
- Emociones detectadas: ${Object.entries(emociones).map(([e, v]) => `${e}: ${v.toFixed(1)}`).join(', ') || 'No hay datos'}

**Instrucciones:**
1. Genera 5 recomendaciones específicas y accionables
2. Cada recomendación debe tener:
   - tipo: (actividad|recurso|habito|profesional|emergencia)
   - prioridad: número del 1 al 5 (5 = más urgente)
   - titulo: título breve (máximo 8 palabras)
   - descripcion: descripción detallada (2-3 oraciones)

3. Adapta las recomendaciones según:
   - Severidad de evaluaciones (prioriza ayuda profesional si es severa)
   - Emociones predominantes
   - Tendencia del sentimiento

4. Si detectas severidad "moderadamente_severa" o "severa", incluye una recomendación de tipo "profesional" con prioridad 5

**IMPORTANTE:** Responde SOLO con un array JSON válido, sin texto adicional, en este formato:
[
  {
    "tipo": "habito",
    "prioridad": 3,
    "titulo": "Práctica de Mindfulness Diario",
    "descripcion": "Dedica 10 minutos cada mañana a meditación guiada. Esto puede ayudar a reducir la ansiedad y mejorar tu estado de ánimo general."
  }
]`

  try {
    // Llamar a GPT OSS
    const respuesta = await gptossCliente.llamar({
      prompt,
      tipo: 'reporte',
      funcion_origen: 'generar-recomendaciones'
    })

    if (!respuesta.exitoso) {
      throw new Error('Error al generar recomendaciones con GPT OSS')
    }

    // Parsear respuesta JSON
    const recomendaciones = gptossCliente.parsearJSON<Recomendacion[]>(respuesta.respuesta)

    if (!recomendaciones) {
      throw new Error('No se pudo parsear respuesta de GPT OSS')
    }

    return recomendaciones

  } catch (error) {
    console.error('[generarRecomendacionesIA] Error:', error)

    // Fallback: recomendaciones genéricas
    return generarRecomendacionesFallback(evaluaciones)
  }
}

/**
 * Genera recomendaciones genéricas si falla IA
 */
function generarRecomendacionesFallback(evaluaciones: Evaluacion[]): Recomendacion[] {
  const tieneSeveridadAlta = evaluaciones.some(e =>
    e.severidad === 'moderadamente_severa' || e.severidad === 'severa'
  )

  const recomendaciones: Recomendacion[] = [
    {
      tipo: 'habito',
      prioridad: 4,
      titulo: 'Rutina de Sueño Regular',
      descripcion: 'Establece un horario fijo para dormir y despertar. Un buen descanso es fundamental para el bienestar emocional.'
    },
    {
      tipo: 'actividad',
      prioridad: 3,
      titulo: 'Ejercicio Físico Moderado',
      descripcion: 'Realiza al menos 30 minutos de actividad física 3-4 veces por semana. El ejercicio libera endorfinas que mejoran el estado de ánimo.'
    },
    {
      tipo: 'habito',
      prioridad: 3,
      titulo: 'Práctica de Mindfulness',
      descripcion: 'Dedica 10-15 minutos diarios a la meditación o respiración consciente. Esto puede reducir el estrés y la ansiedad.'
    },
    {
      tipo: 'recurso',
      prioridad: 2,
      titulo: 'Diario de Emociones',
      descripcion: 'Lleva un registro diario de tus emociones y pensamientos. Esto te ayudará a identificar patrones y desencadenantes.'
    }
  ]

  if (tieneSeveridadAlta) {
    recomendaciones.unshift({
      tipo: 'profesional',
      prioridad: 5,
      titulo: 'Consulta con Profesional de Salud Mental',
      descripcion: 'Tus evaluaciones indican que podrías beneficiarte de apoyo profesional. Te recomendamos agendar una consulta con un psicólogo o psiquiatra licenciado.'
    })
  } else {
    recomendaciones.push({
      tipo: 'actividad',
      prioridad: 2,
      titulo: 'Conexión Social',
      descripcion: 'Dedica tiempo a conectar con amigos y familiares. El apoyo social es clave para el bienestar emocional.'
    })
  }

  return recomendaciones
}
