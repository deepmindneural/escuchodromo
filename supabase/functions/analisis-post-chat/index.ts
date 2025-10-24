/**
 * Edge Function: Análisis Post-Chat
 *
 * Analiza conversaciones completas usando IA para:
 * - Extraer emociones dominantes
 * - Calcular score de bienestar
 * - Detectar riesgo suicida
 * - Identificar temas recurrentes
 * - Generar insights para profesionales
 * - Activar alertas si es necesario
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { GPTOSSClient } from '../_shared/gptoss-client.ts'
import { construirPromptAnalisisPostChat } from '../_shared/prompts-psicologo.ts'
import { CORS_HEADERS, ANALISIS_CONFIG, EVALUACIONES_CONFIG } from '../_shared/config.ts'
import type {
  AnalisisPostChatRequest,
  AnalisisPostChatResponse,
  AnalisisConversacion,
  AnalisisPostChatGemini
} from '../_shared/tipos.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parsear request
    const {
      conversacion_id,
      sesion_publica_id,
      forzar_reanalizacion = false
    }: AnalisisPostChatRequest = await req.json()

    if (!conversacion_id && !sesion_publica_id) {
      return new Response(
        JSON.stringify({ error: 'conversacion_id o sesion_publica_id requerido' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    console.log('[analisis-post-chat] Iniciando análisis...')

    // Verificar si ya existe análisis
    if (!forzar_reanalizacion) {
      const { data: analisisExistente } = await supabase
        .from('AnalisisConversacion')
        .select('*')
        .eq(conversacion_id ? 'conversacion_id' : 'sesion_publica_id',
            conversacion_id || sesion_publica_id)
        .single()

      if (analisisExistente) {
        console.log('[analisis-post-chat] Análisis ya existe')
        return new Response(
          JSON.stringify({
            analisis: analisisExistente,
            alerta_creada: false
          }),
          { status: 200, headers: CORS_HEADERS }
        )
      }
    }

    // Obtener mensajes de la conversación
    let mensajes: any[] = []
    let usuario_id: string | null = null

    if (conversacion_id) {
      const { data } = await supabase
        .from('Mensaje')
        .select('rol, contenido, creado_en')
        .eq('conversacion_id', conversacion_id)
        .order('creado_en', { ascending: true })
        .limit(ANALISIS_CONFIG.maxMensajesAnalisis)

      mensajes = data || []

      // Obtener usuario_id de la conversación
      const { data: conv } = await supabase
        .from('Conversacion')
        .select('usuario_id')
        .eq('id', conversacion_id)
        .single()

      usuario_id = conv?.usuario_id || null
    } else {
      const { data } = await supabase
        .from('MensajePublico')
        .select('rol, contenido, creado_en')
        .eq('sesion_id', sesion_publica_id)
        .order('creado_en', { ascending: true })
        .limit(ANALISIS_CONFIG.maxMensajesAnalisis)

      mensajes = data || []
    }

    if (mensajes.length < ANALISIS_CONFIG.mensajesMinimos) {
      return new Response(
        JSON.stringify({
          error: `Se requieren al menos ${ANALISIS_CONFIG.mensajesMinimos} mensajes para análisis`
        }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Obtener evaluaciones recientes si hay usuario
    let evaluaciones: any = {}
    if (usuario_id) {
      const { data: resultados } = await supabase
        .from('Resultado')
        .select(`
          id,
          prueba_id,
          puntuacion,
          severidad,
          creado_en,
          Prueba!inner (codigo)
        `)
        .eq('usuario_id', usuario_id)
        .order('creado_en', { ascending: false })
        .limit(2)

      if (resultados) {
        const phq9 = resultados.find(r => r.Prueba.codigo === EVALUACIONES_CONFIG.codigoPHQ9)
        const gad7 = resultados.find(r => r.Prueba.codigo === EVALUACIONES_CONFIG.codigoGAD7)

        if (phq9) {
          evaluaciones.phq9 = {
            puntuacion: phq9.puntuacion,
            severidad: phq9.severidad,
            dias: Math.floor((Date.now() - new Date(phq9.creado_en).getTime()) / 86400000)
          }
        }
        if (gad7) {
          evaluaciones.gad7 = {
            puntuacion: gad7.puntuacion,
            severidad: gad7.severidad,
            dias: Math.floor((Date.now() - new Date(gad7.creado_en).getTime()) / 86400000)
          }
        }
      }
    }

    // Construir prompt para análisis
    const prompt = construirPromptAnalisisPostChat({
      mensajes,
      evaluaciones
    })

    // Llamar a GPT OSS
    const gptossCliente = new GPTOSSClient()
    const respuesta = await gptossCliente.llamar({
      prompt,
      tipo: 'analisis',
      usuario_id,
      sesion_publica_id,
      funcion_origen: 'analisis-post-chat'
    })

    if (!respuesta.exitoso) {
      throw new Error(respuesta.error || 'Error al generar análisis')
    }

    // Parsear respuesta JSON
    const analisisIA = gptossCliente.parsearJSON<AnalisisPostChatGemini>(respuesta.respuesta)

    if (!analisisIA) {
      throw new Error('No se pudo parsear respuesta de IA')
    }

    // Crear objeto de análisis para guardar
    const analisis: Omit<AnalisisConversacion, 'id' | 'creado_en'> = {
      conversacion_id: conversacion_id || undefined,
      sesion_publica_id: sesion_publica_id || undefined,
      emociones_dominantes: analisisIA.emociones_dominantes,
      sentimiento_promedio: analisisIA.sentimiento_promedio,
      score_bienestar: analisisIA.score_bienestar,
      riesgo_suicidio: analisisIA.riesgo_suicidio,
      nivel_urgencia: analisisIA.nivel_urgencia,
      senales_crisis: analisisIA.riesgo_suicidio
        ? Object.keys(analisisIA.emociones_dominantes).filter(e =>
            ['tristeza', 'desesperanza', 'miedo'].includes(e) &&
            analisisIA.emociones_dominantes[e] > 0.7
          )
        : [],
      temas_recurrentes: analisisIA.temas_recurrentes,
      palabras_clave: analisisIA.palabras_clave,
      resumen_clinico: analisisIA.resumen_clinico,
      recomendaciones_terapeuta: analisisIA.recomendaciones_terapeuta,
      total_mensajes_analizados: mensajes.length,
      analizado_con_ia: true,
      modelo_usado: 'gpt-oss',
      tokens_consumidos: respuesta.tokens_usados
    }

    // Guardar análisis
    const { data: analisisGuardado, error: errorGuardar } = await supabase
      .from('AnalisisConversacion')
      .insert(analisis)
      .select()
      .single()

    if (errorGuardar) {
      console.error('[analisis-post-chat] Error al guardar:', errorGuardar)
      throw errorGuardar
    }

    console.log('[analisis-post-chat] Análisis guardado exitosamente')

    // Si hay riesgo de suicidio, crear alerta urgente
    let alerta_creada = false
    let alerta_id: string | undefined

    if (analisis.riesgo_suicidio && (analisis.nivel_urgencia === 'alto' || analisis.nivel_urgencia === 'critico')) {
      console.log('[analisis-post-chat] Creando alerta urgente...')

      const { data: alerta } = await supabase
        .from('AlertaUrgente')
        .insert({
          usuario_id: usuario_id || undefined,
          sesion_publica_id: sesion_publica_id || undefined,
          analisis_id: analisisGuardado.id,
          tipo_alerta: 'ideacion_suicida',
          nivel_urgencia: analisis.nivel_urgencia,
          titulo: 'Riesgo detectado en análisis post-conversación',
          descripcion: `Análisis automático detectó ${analisis.nivel_urgencia} nivel de urgencia. Score de bienestar: ${analisis.score_bienestar}/100`,
          senales_detectadas: analisis.senales_crisis,
          contexto: { evaluaciones, score_bienestar: analisis.score_bienestar },
          estado: 'pendiente'
        })
        .select()
        .single()

      if (alerta) {
        alerta_creada = true
        alerta_id = alerta.id

        // Crear notificaciones para profesionales
        await supabase
          .from('Notificacion')
          .insert({
            usuario_id: usuario_id || '00000000-0000-0000-0000-000000000000',
            tipo: 'push',
            titulo: '⚠️ Alerta de Crisis',
            contenido: `Se detectó riesgo de crisis (nivel: ${analisis.nivel_urgencia}). Requiere atención.`,
            leida: false,
            enviada: false
          })

        console.log('[analisis-post-chat] Alerta urgente creada')
      }
    }

    // Respuesta
    const resultado: AnalisisPostChatResponse = {
      analisis: analisisGuardado,
      alerta_creada,
      alerta_id
    }

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: CORS_HEADERS }
    )

  } catch (error) {
    console.error('[analisis-post-chat] Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Error procesando análisis',
        analisis: null,
        alerta_creada: false
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
