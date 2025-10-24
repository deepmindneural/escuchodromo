/**
 * CLIENTE REUTILIZABLE DE IA
 *
 * Cliente centralizado para todas las llamadas a la API de IA
 * Con retry logic, rate limiting, error handling y logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { GeminiRequest, GeminiResponse, LogGeminiAPI } from './tipos.ts'
import {
  GEMINI_CONFIG,
  GEMINI_API_URL,
  RATE_LIMIT,
  SUPABASE_CONFIG,
  obtenerConfigGemini
} from './config.ts'

// ==========================================
// CLIENTE DE IA
// ==========================================

export class GeminiClient {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_CONFIG.apiKey
    this.apiUrl = GEMINI_API_URL

    if (!this.apiKey) {
      throw new Error('La API de IA no está configurada correctamente. Contacta al administrador.')
    }
  }

  /**
   * Llamar a la IA con retry logic y manejo de errores
   */
  async llamar(params: {
    prompt: string
    tipo: 'chat' | 'analisis' | 'crisis' | 'reporte'
    usuario_id?: string
    sesion_publica_id?: string
    funcion_origen: string
  }): Promise<GeminiResponse> {
    const { prompt, tipo, usuario_id, sesion_publica_id, funcion_origen } = params

    const inicioTiempo = Date.now()

    try {
      // Verificar rate limit
      const puedeHacerLlamada = await this.verificarRateLimit(tipo)
      if (!puedeHacerLlamada) {
        throw new Error('Límite de uso de IA alcanzado. Por favor, intenta más tarde.')
      }

      // Obtener configuración según tipo
      const config = obtenerConfigGemini(tipo)

      // Intentar llamada con retry logic
      const resultado = await this.llamarConRetry(prompt, config)

      // Calcular latencia
      const latencia = Date.now() - inicioTiempo

      // Registrar llamada exitosa
      await this.registrarLlamada({
        funcion_origen,
        usuario_id,
        sesion_publica_id,
        prompt_tipo: tipo,
        tokens_prompt: this.estimarTokens(prompt),
        tokens_respuesta: this.estimarTokens(resultado.respuesta),
        tokens_total: resultado.tokens_usados,
        latencia_ms: latencia,
        exitoso: true
      })

      return {
        respuesta: resultado.respuesta,
        tokens_usados: resultado.tokens_usados,
        modelo: GEMINI_CONFIG.model,
        latencia_ms: latencia,
        exitoso: true
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

      console.error('[IAClient] Error:', error)

      return {
        respuesta: '',
        tokens_usados: 0,
        modelo: GEMINI_CONFIG.model,
        latencia_ms: latencia,
        exitoso: false,
        error: error.message
      }
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            ...config
          }),
          signal: AbortSignal.timeout(GEMINI_CONFIG.timeout)
        }
      )

      if (!response.ok) {
        const errorText = await response.text()

        // Si es rate limit (429) y no hemos superado intentos, reintentar
        if (response.status === 429 && intentos < GEMINI_CONFIG.retryAttempts) {
          const delay = GEMINI_CONFIG.retryDelay * Math.pow(2, intentos)
          console.log(`[IAClient] Rate limit alcanzado. Reintentando en ${delay}ms...`)
          await this.sleep(delay)
          return this.llamarConRetry(prompt, config, intentos + 1)
        }

        throw new Error(`Error de la API de IA (${response.status}). Por favor, intenta nuevamente.`)
      }

      const data = await response.json()

      // Validar respuesta
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Respuesta inválida del sistema de IA')
      }

      const respuesta = data.candidates[0].content.parts[0].text.trim()
      const tokens_usados = data.usageMetadata?.totalTokenCount || 0

      return { respuesta, tokens_usados }

    } catch (error) {
      // Si es error de red y no hemos superado intentos, reintentar
      if ((error.name === 'TypeError' || error.name === 'AbortError') && intentos < GEMINI_CONFIG.retryAttempts) {
        const delay = GEMINI_CONFIG.retryDelay * Math.pow(2, intentos)
        console.log(`[IAClient] Error de red. Reintentando en ${delay}ms...`)
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
      const supabase = createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.serviceRoleKey
      )

      // Contar llamadas de hoy
      const { data, error } = await supabase
        .rpc('obtener_llamadas_gemini_hoy')

      if (error) {
        console.error('[IAClient] Error al verificar rate limit:', error)
        // Si hay error, permitir la llamada (fail open)
        return true
      }

      const llamadas_hoy = data || 0

      // Límite con reserva
      const limite_efectivo = RATE_LIMIT.maxCalls - RATE_LIMIT.reserva

      // Si es crisis, siempre permitir (hasta el límite absoluto)
      if (prioridad === 'crisis') {
        return llamadas_hoy < RATE_LIMIT.maxCalls
      }

      // Para otras prioridades, respetar el límite con reserva
      return llamadas_hoy < limite_efectivo

    } catch (error) {
      console.error('[IAClient] Error al verificar rate limit:', error)
      // Fail open: permitir la llamada si hay error
      return true
    }
  }

  /**
   * Registrar llamada en base de datos
   */
  private async registrarLlamada(log: Omit<LogGeminiAPI, 'id' | 'creado_en' | 'llamadas_hoy'>): Promise<void> {
    try {
      const supabase = createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.serviceRoleKey
      )

      // Obtener contador del día
      const { data: llamadas_hoy } = await supabase
        .rpc('obtener_llamadas_gemini_hoy')

      await supabase
        .from('LogGeminiAPI')
        .insert({
          ...log,
          llamadas_hoy: (llamadas_hoy || 0) + 1
        })

    } catch (error) {
      console.error('[IAClient] Error al registrar log:', error)
      // No lanzar error, solo loguear
    }
  }

  /**
   * Parsear respuesta JSON de la IA
   */
  parsearJSON<T>(respuesta: string): T | null {
    try {
      // Intentar parsear directamente
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
    // Aproximación: 1 token ≈ 4 caracteres en español
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
 * Crear instancia del cliente
 */
export function crearClienteGemini(apiKey?: string): GeminiClient {
  return new GeminiClient(apiKey)
}

/**
 * Obtener estadísticas de uso de API
 */
export async function obtenerEstadisticasGemini(): Promise<{
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

    const { data: llamadas_hoy, error } = await supabase
      .rpc('obtener_llamadas_gemini_hoy')

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
    console.error('[IAClient] Error al obtener estadísticas:', error)
    return {
      llamadas_hoy: 0,
      limite_diario: RATE_LIMIT.maxCalls,
      porcentaje_uso: 0,
      llamadas_restantes: RATE_LIMIT.maxCalls
    }
  }
}

/**
 * Verificar si el sistema puede hacer llamadas a la IA
 */
export async function puedeUsarGemini(): Promise<{ puede: boolean; razon?: string }> {
  const stats = await obtenerEstadisticasGemini()

  if (stats.llamadas_restantes < RATE_LIMIT.reserva) {
    return {
      puede: false,
      razon: `Límite diario casi alcanzado (${stats.llamadas_hoy}/${stats.limite_diario}). Reservando ${RATE_LIMIT.reserva} llamadas para emergencias.`
    }
  }

  if (stats.llamadas_hoy >= stats.limite_diario) {
    return {
      puede: false,
      razon: `Límite diario alcanzado (${stats.llamadas_hoy}/${stats.limite_diario}).`
    }
  }

  return { puede: true }
}

// ==========================================
// EXPORTACIONES
// ==========================================

export default {
  GeminiClient,
  crearClienteGemini,
  obtenerEstadisticasGemini,
  puedeUsarGemini
}
