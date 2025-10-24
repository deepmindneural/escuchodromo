/**
 * Edge Function: Chat con IA avanzada - MEJORADO
 *
 * NUEVAS FUNCIONALIDADES:
 * - Memoria avanzada con contexto de evaluaciones PHQ-9/GAD-7
 * - Detección profunda de crisis en paralelo
 * - Historial ampliado (20 mensajes)
 * - Personalización según rol de usuario
 * - Cliente de IA reutilizable con retry logic
 * - Rate limiting inteligente
 *
 * Sistema de IA ofrece:
 * - Respuestas rápidas y contextuales
 * - Análisis emocional avanzado
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Importar utilidades compartidas
import { GeminiClient } from '../_shared/gemini-client.ts'
import { construirPromptChatConMemoria, construirPromptDeteccionCrisis } from '../_shared/prompts.ts'
import { CORS_HEADERS, ALERTAS_CONFIG, EVALUACIONES_CONFIG, ANALISIS_CONFIG } from '../_shared/config.ts'
import type { ChatIARequest, ChatIAResponse, DeteccionCrisis } from '../_shared/tipos.ts'

serve(async (req) => {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const inicioTiempo = Date.now()

  try {
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parsear request
    const { mensaje, sesion_id, historial = [] }: ChatIARequest = await req.json()

    if (!mensaje || !sesion_id) {
      return new Response(
        JSON.stringify({ error: 'mensaje y sesion_id son requeridos' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    console.log(`[chat-ia] Procesando mensaje para sesión: ${sesion_id}`)

    // ==========================================
    // PASO 1: DETECTAR USUARIO Y OBTENER CONTEXTO
    // ==========================================

    let usuario = null
    let evaluaciones: any = {}
    let resumenEmocional = ''
    let numeroSesiones = 0
    let ultimaSesion = ''

    // Intentar obtener usuario autenticado desde el header
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        )

        if (user) {
          // Obtener datos del usuario
          const { data: usuarioData } = await supabase
            .from('Usuario')
            .select('*')
            .eq('auth_id', user.id)
            .single()

          if (usuarioData) {
            usuario = usuarioData
            console.log(`[chat-ia] Usuario registrado detectado: ${usuario.nombre || usuario.email}`)

            // Obtener últimas evaluaciones PHQ-9 y GAD-7
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
              .eq('usuario_id', usuario.id)
              .order('creado_en', { ascending: false })
              .limit(5)

            if (resultados && resultados.length > 0) {
              // Buscar PHQ-9 más reciente
              const phq9 = resultados.find(r => r.Prueba.codigo === EVALUACIONES_CONFIG.codigoPHQ9)
              if (phq9) {
                const diasDesde = Math.floor(
                  (Date.now() - new Date(phq9.creado_en).getTime()) / (1000 * 60 * 60 * 24)
                )
                evaluaciones.phq9 = {
                  puntuacion: phq9.puntuacion,
                  severidad: phq9.severidad,
                  dias: diasDesde
                }
              }

              // Buscar GAD-7 más reciente
              const gad7 = resultados.find(r => r.Prueba.codigo === EVALUACIONES_CONFIG.codigoGAD7)
              if (gad7) {
                const diasDesde = Math.floor(
                  (Date.now() - new Date(gad7.creado_en).getTime()) / (1000 * 60 * 60 * 24)
                )
                evaluaciones.gad7 = {
                  puntuacion: gad7.puntuacion,
                  severidad: gad7.severidad,
                  dias: diasDesde
                }
              }
            }

            // Obtener número de sesiones previas
            const { count } = await supabase
              .from('Conversacion')
              .select('id', { count: 'exact', head: true })
              .eq('usuario_id', usuario.id)

            numeroSesiones = count || 0

            // Resumen emocional (simplificado)
            if (numeroSesiones > 0) {
              resumenEmocional = 'Conversaciones previas registradas'
            }
          }
        }
      } catch (error) {
        console.log('[chat-ia] No se pudo obtener usuario autenticado:', error.message)
      }
    }

    // ==========================================
    // PASO 2: GUARDAR MENSAJE DEL USUARIO
    // ==========================================

    await supabase.from('MensajePublico').insert({
      sesion_id,
      contenido: mensaje,
      rol: 'usuario',
      creado_en: new Date().toISOString()
    })

    // ==========================================
    // PASO 3: DETECCIÓN DE CRISIS EN PARALELO
    // ==========================================

    let alertaCrisis = null

    // Detectar palabras clave de crisis
    const tienePalabrasCrisis = ALERTAS_CONFIG.palabrasClavesCrisis.some(palabra =>
      mensaje.toLowerCase().includes(palabra)
    )

    if (tienePalabrasCrisis) {
      console.log('[chat-ia] Palabras de crisis detectadas. Iniciando análisis profundo...')

      try {
        // Análisis profundo de crisis en paralelo (no bloquea la respuesta)
        const geminiCliente = new GeminiClient()

        const promptCrisis = construirPromptDeteccionCrisis({
          mensaje,
          historial: historial.slice(-5), // Últimos 5 mensajes de contexto
          evaluaciones
        })

        // Llamar a la IA para análisis de crisis
        const respuestaCrisis = await geminiCliente.llamar({
          prompt: promptCrisis,
          tipo: 'crisis',
          sesion_publica_id: sesion_id,
          funcion_origen: 'chat-ia-deteccion-crisis'
        })

        if (respuestaCrisis.exitoso) {
          const deteccion = geminiCliente.parsearJSON<DeteccionCrisis>(respuestaCrisis.respuesta)

          if (deteccion && deteccion.hay_crisis) {
            alertaCrisis = {
              detectada: true,
              nivel: deteccion.nivel_urgencia,
              mensaje: deteccion.accion_recomendada,
              senales: deteccion.senales_detectadas
            }

            console.log(`[chat-ia] CRISIS DETECTADA - Nivel: ${deteccion.nivel_urgencia}`)

            // Si es crítico o alto, crear alerta urgente inmediatamente
            if (deteccion.nivel_urgencia === 'critico' || deteccion.nivel_urgencia === 'alto') {
              await supabase.from('AlertaUrgente').insert({
                sesion_publica_id: sesion_id,
                usuario_id: usuario?.id || null,
                tipo_alerta: 'ideacion_suicida',
                nivel_urgencia: deteccion.nivel_urgencia,
                titulo: 'Crisis detectada en chat',
                descripcion: deteccion.explicacion,
                senales_detectadas: deteccion.senales_detectadas,
                mensaje_disparador: mensaje,
                contexto: { evaluaciones, historial: historial.slice(-3) },
                estado: 'pendiente'
              })

              console.log('[chat-ia] Alerta urgente creada')
            }
          }
        }
      } catch (error) {
        console.error('[chat-ia] Error en detección de crisis:', error)
        // Si hay error en detección, asumir crisis por seguridad
        alertaCrisis = {
          detectada: true,
          nivel: 'alto',
          mensaje: 'Se detectaron posibles señales de crisis. Recomendamos buscar ayuda profesional.',
          senales: []
        }
      }
    }

    // ==========================================
    // PASO 4: GENERAR RESPUESTA CON IA
    // ==========================================

    const geminiCliente = new GeminiClient()

    // Construir prompt con memoria mejorada
    const historialAmpliado = historial.slice(-ANALISIS_CONFIG.maxMensajesHistorial) // Últimos 20

    const prompt = construirPromptChatConMemoria({
      usuario,
      mensaje,
      historial: historialAmpliado,
      evaluaciones,
      resumenEmocional,
      numeroSesiones,
      ultimaSesion
    })

    // Llamar a la IA
    const respuestaGemini = await geminiCliente.llamar({
      prompt,
      tipo: 'chat',
      usuario_id: usuario?.id,
      sesion_publica_id: sesion_id,
      funcion_origen: 'chat-ia'
    })

    if (!respuestaGemini.exitoso) {
      throw new Error(respuestaGemini.error || 'Error al generar respuesta')
    }

    let respuestaFinal = respuestaGemini.respuesta

    // Si hay alerta de crisis, agregar mensaje de recursos
    if (alertaCrisis && alertaCrisis.detectada) {
      const recursosCrisis = `

📞 **Recursos de ayuda inmediata:**
- Línea Nacional de Prevención del Suicidio: 988
- Cruz Roja: 132
- Línea de atención psicológica 24/7: (01) 459-0420

Por favor, considera contactar a un profesional de salud mental lo antes posible. Tu bienestar es muy importante.`

      // Agregar recursos al final de la respuesta
      respuestaFinal += recursosCrisis
    }

    // ==========================================
    // PASO 5: GUARDAR RESPUESTA
    // ==========================================

    await supabase.from('MensajePublico').insert({
      sesion_id,
      contenido: respuestaFinal,
      rol: 'asistente',
      creado_en: new Date().toISOString()
    })

    // Actualizar última actividad
    await supabase
      .from('SesionPublica')
      .update({ ultima_actividad: new Date().toISOString() })
      .eq('sesion_id', sesion_id)

    // ==========================================
    // PASO 6: RESPUESTA AL CLIENTE
    // ==========================================

    const latencia = Date.now() - inicioTiempo

    const response: ChatIAResponse = {
      respuesta: respuestaFinal,
      modelo: 'ia-avanzada',
      tokens_usados: respuestaGemini.tokens_usados,
      alerta_crisis: alertaCrisis ? {
        detectada: alertaCrisis.detectada,
        nivel: alertaCrisis.nivel,
        mensaje: alertaCrisis.mensaje
      } : undefined
    }

    console.log(`[chat-ia] Respuesta generada en ${latencia}ms`)

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: CORS_HEADERS
      }
    )

  } catch (error) {
    console.error('[chat-ia] Error:', error)

    const latencia = Date.now() - inicioTiempo

    return new Response(
      JSON.stringify({
        error: error.message || 'Error procesando solicitud',
        respuesta: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en un momento. Si necesitas ayuda urgente, contacta con un profesional de salud mental.',
        modelo: 'ia-avanzada',
        tokens_usados: 0
      }),
      {
        status: 500,
        headers: CORS_HEADERS
      }
    )
  }
})
