/**
 * CLIENTE GPT OSS CON RAG INTEGRADO
 *
 * Cliente centralizado para GPT OSS que:
 * - Busca conocimiento clínico relevante (RAG con pgvector)
 * - Filtra respuestas para eliminar referencias a IA/Gemini
 * - Mantiene identidad profesional de psicólogo
 * - Registro de uso y rate limiting
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { GeminiResponse, LogGeminiAPI } from './tipos.ts'
import {
  GEMINI_CONFIG,
  GEMINI_API_URL,
  RATE_LIMIT,
  SUPABASE_CONFIG,
  obtenerConfigGemini
} from './config.ts'
import { filtrarYValidarRespuesta, generarRespuestaFallback, analizarMensajeUsuario } from './filtros-respuesta.ts'

// ==========================================
// TIPOS
// ==========================================

export interface ConocimientoRAG {
  id: string
  titulo: string
  contenido: string
  similitud: number
  categoria: string
}

export interface RespuestaGPTOSS extends GeminiResponse {
  conocimiento_usado?: ConocimientoRAG[]
  filtros_aplicados?: string[]
  score_calidad?: number
}

// ==========================================
// CLIENTE GPT OSS
// ==========================================

export class GPTOSSClient {
  private apiKey: string
  private apiUrl: string
  private supabase: any

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_CONFIG.apiKey
    this.apiUrl = GEMINI_API_URL

    if (!this.apiKey) {
      throw new Error('La API de GPT OSS no está configurada correctamente. Contacta al administrador.')
    }

    // Inicializar cliente de Supabase para RAG
    this.supabase = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey
    )
  }

  /**
   * Llamar a GPT OSS con RAG + filtrado automático
   */
  async llamar(params: {
    prompt: string
    tipo: 'chat' | 'analisis' | 'crisis' | 'reporte'
    usuario_id?: string
    sesion_publica_id?: string
    funcion_origen: string
    usar_rag?: boolean
    mensaje_usuario?: string // Para generar embedding RAG
  }): Promise<RespuestaGPTOSS> {
    const { prompt, tipo, usuario_id, sesion_publica_id, funcion_origen, usar_rag = false, mensaje_usuario } = params

    const inicioTiempo = Date.now()

    try {
      // ==========================================
      // PASO 1: BUSCAR CONOCIMIENTO CLÍNICO (RAG)
      // ==========================================

      let conocimiento_rag: ConocimientoRAG[] = []

      if (usar_rag && mensaje_usuario) {
        try {
          conocimiento_rag = await this.buscarConocimientoRAG(mensaje_usuario, usuario_id, sesion_publica_id)
          console.log(`[GPT OSS] Encontrados ${conocimiento_rag.length} documentos RAG relevantes`)
        } catch (error) {
          console.error('[GPT OSS] Error en búsqueda RAG:', error)
          // Continuar sin RAG si falla
        }
      }

      // ==========================================
      // PASO 2: VERIFICAR RATE LIMIT
      // ==========================================

      const puedeHacerLlamada = await this.verificarRateLimit(tipo)
      if (!puedeHacerLlamada) {
        return {
          respuesta: generarRespuestaFallback('limite'),
          tokens_usados: 0,
          modelo: 'gpt-oss',
          latencia_ms: Date.now() - inicioTiempo,
          exitoso: false,
          error: 'Límite de uso diario alcanzado'
        }
      }

      // ==========================================
      // PASO 3: OBTENER CONFIGURACIÓN
      // ==========================================

      const config = obtenerConfigGemini(tipo)

      // ==========================================
      // PASO 4: LLAMAR A LA API CON RETRY
      // ==========================================

      const resultado = await this.llamarConRetry(prompt, config)

      // ==========================================
      // PASO 5: FILTRAR Y VALIDAR RESPUESTA
      // ==========================================

      const analisis_mensaje = mensaje_usuario ? analizarMensajeUsuario(mensaje_usuario) : undefined

      const { respuesta_filtrada, cambios_aplicados, validacion } = filtrarYValidarRespuesta(
        resultado.respuesta,
        {
          mensaje_usuario,
          tiene_crisis: analisis_mensaje?.posible_crisis,
          tiene_evaluaciones_severas: false // TODO: pasar desde params
        }
      )

      // Si la respuesta necesita reescritura, loguear pero usar de todos modos
      if (!validacion.valida) {
        console.warn('[GPT OSS] Respuesta no pasó validación completa:', validacion.errores)
        console.warn('[GPT OSS] Score de calidad:', validacion.score_calidad)
      }

      // ==========================================
      // PASO 6: REGISTRAR USO DE CONOCIMIENTO RAG
      // ==========================================

      if (conocimiento_rag.length > 0) {
        await this.registrarUsoRAG(conocimiento_rag, usuario_id, sesion_publica_id)
      }

      // ==========================================
      // PASO 7: REGISTRAR LLAMADA
      // ==========================================

      const latencia = Date.now() - inicioTiempo

      await this.registrarLlamada({
        funcion_origen,
        usuario_id,
        sesion_publica_id,
        prompt_tipo: tipo,
        tokens_prompt: this.estimarTokens(prompt),
        tokens_respuesta: this.estimarTokens(respuesta_filtrada),
        tokens_total: resultado.tokens_usados,
        latencia_ms: latencia,
        exitoso: true
      })

      return {
        respuesta: respuesta_filtrada,
        tokens_usados: resultado.tokens_usados,
        modelo: 'gpt-oss',
        latencia_ms: latencia,
        exitoso: true,
        conocimiento_usado: conocimiento_rag.length > 0 ? conocimiento_rag : undefined,
        filtros_aplicados: cambios_aplicados.length > 0 ? cambios_aplicados : undefined,
        score_calidad: validacion.score_calidad
      }

    } catch (error) {
      const latencia = Date.now() - inicioTiempo

      // Registrar error
      await this.registrarLlamada({
        funcion_origen,
        usuario_id,
        sesion_publica_id,
        prompt_tipo: tipo,
        tokens_prompt: this.estimarTokens(prompt),
        tokens_respuesta: 0,
        tokens_total: 0,
        latencia_ms: latencia,
        exitoso: false,
        codigo_error: error.code || 'UNKNOWN',
        mensaje_error: error.message
      })

      console.error('[GPT OSS] Error:', error)

      return {
        respuesta: generarRespuestaFallback('error'),
        tokens_usados: 0,
        modelo: 'gpt-oss',
        latencia_ms: latencia,
        exitoso: false,
        error: error.message
      }
    }
  }

  /**
   * Buscar conocimiento clínico relevante usando RAG
   */
  private async buscarConocimientoRAG(
    mensaje: string,
    usuario_id?: string,
    sesion_publica_id?: string
  ): Promise<ConocimientoRAG[]> {

    try {
      // ==========================================
      // PASO 1: GENERAR EMBEDDING DEL MENSAJE
      // ==========================================

      const embedding = await this.generarEmbedding(mensaje)

      if (!embedding || embedding.length === 0) {
        console.warn('[GPT OSS RAG] No se pudo generar embedding')
        return []
      }

      // ==========================================
      // PASO 2: BUSCAR CONOCIMIENTO SIMILAR
      // ==========================================

      const { data, error } = await this.supabase.rpc('buscar_conocimiento_similar', {
        query_embedding: embedding,
        limite: 3, // Top 3 documentos más relevantes
        umbral_similitud: 0.65 // Mínimo 65% de similitud
      })

      if (error) {
        console.error('[GPT OSS RAG] Error en búsqueda:', error)
        return []
      }

      if (!data || data.length === 0) {
        console.log('[GPT OSS RAG] No se encontró conocimiento relevante')
        return []
      }

      // ==========================================
      // PASO 3: REGISTRAR BÚSQUEDA
      // ==========================================

      await this.supabase.rpc('registrar_busqueda_rag', {
        p_usuario_id: usuario_id || null,
        p_sesion_publica_id: sesion_publica_id || null,
        p_query_texto: mensaje,
        p_query_embedding: embedding,
        p_resultados_encontrados: data.length,
        p_mejor_similitud: data[0]?.similitud || 0
      })

      return data.map((item: any) => ({
        id: item.id,
        titulo: item.titulo,
        contenido: item.contenido,
        similitud: item.similitud,
        categoria: item.categoria || 'general'
      }))

    } catch (error) {
      console.error('[GPT OSS RAG] Error general:', error)
      return []
    }
  }

  /**
   * Generar embedding de texto usando Gemini API
   */
  private async generarEmbedding(texto: string): Promise<number[] | null> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
              parts: [{ text: texto }]
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Error al generar embedding: ${response.status}`)
      }

      const data = await response.json()
      return data.embedding?.values || null

    } catch (error) {
      console.error('[GPT OSS] Error generando embedding:', error)
      return null
    }
  }

  /**
   * Registrar uso de conocimiento RAG
   */
  private async registrarUsoRAG(
    conocimiento: ConocimientoRAG[],
    usuario_id?: string,
    sesion_publica_id?: string
  ): Promise<void> {
    try {
      // Incrementar contador de uso de cada documento
      for (const doc of conocimiento) {
        await this.supabase.rpc('registrar_uso_conocimiento', {
          p_conocimiento_id: doc.id,
          p_usuario_id: usuario_id || null,
          p_sesion_publica_id: sesion_publica_id || null
        })
      }
    } catch (error) {
      console.error('[GPT OSS RAG] Error registrando uso:', error)
      // No lanzar error, solo loguear
    }
  }

  /**
   * Llamar con retry logic exponencial
   */
  private async llamarConRetry(
    prompt: string,
    config: any,
    intentos: number = 0
  ): Promise<{ respuesta: string; tokens_usados: number }> {
    try {
      const response = await fetch(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            ...config
          }),
          signal: AbortSignal.timeout(GEMINI_CONFIG.timeout)
        }
      )

      if (!response.ok) {
        // Si es rate limit (429) y no hemos superado intentos, reintentar
        if (response.status === 429 && intentos < GEMINI_CONFIG.retryAttempts) {
          const delay = GEMINI_CONFIG.retryDelay * Math.pow(2, intentos)
          console.log(`[GPT OSS] Rate limit alcanzado. Reintentando en ${delay}ms...`)
          await this.sleep(delay)
          return this.llamarConRetry(prompt, config, intentos + 1)
        }

        throw new Error(`Error de la API (${response.status}). Por favor, intenta nuevamente.`)
      }

      const data = await response.json()

      // Validar respuesta
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Respuesta inválida del sistema')
      }

      const respuesta = data.candidates[0].content.parts[0].text.trim()
      const tokens_usados = data.usageMetadata?.totalTokenCount || 0

      return { respuesta, tokens_usados }

    } catch (error) {
      // Si es error de red y no hemos superado intentos, reintentar
      if ((error.name === 'TypeError' || error.name === 'AbortError') && intentos < GEMINI_CONFIG.retryAttempts) {
        const delay = GEMINI_CONFIG.retryDelay * Math.pow(2, intentos)
        console.log(`[GPT OSS] Error de red. Reintentando en ${delay}ms...`)
        await this.sleep(delay)
        return this.llamarConRetry(prompt, config, intentos + 1)
      }

      throw error
    }
  }

  /**
   * Verificar si podemos hacer una llamada (rate limiting)
   */
  private async verificarRateLimit(prioridad: 'chat' | 'analisis' | 'crisis' | 'reporte'): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('obtener_llamadas_gemini_hoy')

      if (error) {
        console.error('[GPT OSS] Error al verificar rate limit:', error)
        return true // Fail open
      }

      const llamadas_hoy = data || 0
      const limite_efectivo = RATE_LIMIT.maxCalls - RATE_LIMIT.reserva

      // Si es crisis, siempre permitir (hasta el límite absoluto)
      if (prioridad === 'crisis') {
        return llamadas_hoy < RATE_LIMIT.maxCalls
      }

      // Para otras prioridades, respetar el límite con reserva
      return llamadas_hoy < limite_efectivo

    } catch (error) {
      console.error('[GPT OSS] Error al verificar rate limit:', error)
      return true // Fail open
    }
  }

  /**
   * Registrar llamada en base de datos
   */
  private async registrarLlamada(log: Omit<LogGeminiAPI, 'id' | 'creado_en' | 'llamadas_hoy'>): Promise<void> {
    try {
      const { data: llamadas_hoy } = await this.supabase.rpc('obtener_llamadas_gemini_hoy')

      await this.supabase
        .from('LogGeminiAPI')
        .insert({
          ...log,
          llamadas_hoy: (llamadas_hoy || 0) + 1
        })

    } catch (error) {
      console.error('[GPT OSS] Error al registrar log:', error)
    }
  }

  /**
   * Parsear respuesta JSON de la IA
   */
  parsearJSON<T>(respuesta: string): T | null {
    try {
      return JSON.parse(respuesta)
    } catch {
      // Intentar extraer JSON de markdown code blocks
      const jsonMatch = respuesta.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1])
        } catch {
          return null
        }
      }

      // Intentar encontrar objeto JSON en el texto
      const objectMatch = respuesta.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0])
        } catch {
          return null
        }
      }

      return null
    }
  }

  /**
   * Estimar tokens (aproximación)
   */
  private estimarTokens(texto: string): number {
    return Math.ceil(texto.length / 4)
  }

  /**
   * Sleep helper para retry logic
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

/**
 * Crear instancia del cliente GPT OSS
 */
export function crearClienteGPTOSS(apiKey?: string): GPTOSSClient {
  return new GPTOSSClient(apiKey)
}

/**
 * Obtener estadísticas de uso de API
 */
export async function obtenerEstadisticasGPTOSS(): Promise<{
  llamadas_hoy: number
  limite_diario: number
  porcentaje_uso: number
  llamadas_restantes: number
}> {
  try {
    const supabase = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey
    )

    const { data: llamadas_hoy, error } = await supabase.rpc('obtener_llamadas_gemini_hoy')

    if (error) throw error

    const llamadas = llamadas_hoy || 0
    const limite = RATE_LIMIT.maxCalls

    return {
      llamadas_hoy: llamadas,
      limite_diario: limite,
      porcentaje_uso: (llamadas / limite) * 100,
      llamadas_restantes: limite - llamadas
    }

  } catch (error) {
    console.error('[GPT OSS] Error al obtener estadísticas:', error)
    return {
      llamadas_hoy: 0,
      limite_diario: RATE_LIMIT.maxCalls,
      porcentaje_uso: 0,
      llamadas_restantes: RATE_LIMIT.maxCalls
    }
  }
}

// ==========================================
// EXPORTACIONES
// ==========================================

// Exportar también como GeminiClient para compatibilidad temporal
export const GeminiClient = GPTOSSClient

export default {
  GPTOSSClient,
  GeminiClient, // Alias de compatibilidad
  crearClienteGPTOSS,
  obtenerEstadisticasGPTOSS
}
