/**
 * =====================================================
 * UTILIDAD: Rate Limiting
 * =====================================================
 * Protección contra ataques de fuerza bruta mediante
 * limitación de intentos por IP/usuario/email.
 *
 * VULNERABILIDAD CORREGIDA: CRÍTICO #4
 * =====================================================
 */

import { crearClienteServidor } from '@/lib/supabase/servidor'

/**
 * Tipos de acciones protegidas por rate limiting
 */
export type TipoRateLimit =
  | 'login'
  | 'register'
  | 'reset_password'
  | 'verify_email'
  | 'change_password'
  | 'resend_verification'

/**
 * Configuración de límites por tipo de acción
 */
const LIMITES_POR_TIPO: Record<
  TipoRateLimit,
  { maxIntentos: number; ventanaMinutos: number }
> = {
  login: { maxIntentos: 5, ventanaMinutos: 15 },
  register: { maxIntentos: 3, ventanaMinutos: 60 },
  reset_password: { maxIntentos: 3, ventanaMinutos: 60 },
  verify_email: { maxIntentos: 5, ventanaMinutos: 60 },
  change_password: { maxIntentos: 3, ventanaMinutos: 30 },
  resend_verification: { maxIntentos: 3, ventanaMinutos: 30 },
}

/**
 * Resultado de la verificación de rate limit
 */
export interface ResultadoRateLimit {
  permitido: boolean
  intentosRestantes: number
  tiempoEsperaSegundos: number
  mensaje?: string
}

/**
 * Verifica si una acción está permitida según rate limiting
 *
 * @param identifier - Identificador único (IP, email, auth_id)
 * @param tipo - Tipo de acción
 * @returns Resultado con información de límite
 *
 * @example
 * ```typescript
 * const resultado = await verificarRateLimit('user@example.com', 'login')
 * if (!resultado.permitido) {
 *   return { error: resultado.mensaje }
 * }
 * ```
 */
export async function verificarRateLimit(
  identifier: string,
  tipo: TipoRateLimit
): Promise<ResultadoRateLimit> {
  try {
    const config = LIMITES_POR_TIPO[tipo]
    const supabase = await crearClienteServidor()

    // Llamar a la función de Supabase
    const { data, error } = await supabase.rpc('verificar_rate_limit', {
      p_identifier: identifier,
      p_tipo: tipo,
      p_max_intentos: config.maxIntentos,
      p_ventana_minutos: config.ventanaMinutos,
    })

    if (error) {
      console.error('Error al verificar rate limit:', error)
      // En caso de error, permitir la acción (fail open)
      return {
        permitido: true,
        intentosRestantes: config.maxIntentos,
        tiempoEsperaSegundos: 0,
      }
    }

    const resultado = data[0]

    if (!resultado.allowed) {
      const minutos = Math.ceil(resultado.tiempo_espera_segundos / 60)
      return {
        permitido: false,
        intentosRestantes: 0,
        tiempoEsperaSegundos: resultado.tiempo_espera_segundos,
        mensaje: `Demasiados intentos. Por favor, espera ${minutos} minuto(s) antes de intentar de nuevo.`,
      }
    }

    return {
      permitido: true,
      intentosRestantes: resultado.intentos_restantes,
      tiempoEsperaSegundos: 0,
    }
  } catch (error) {
    console.error('Excepción en verificarRateLimit:', error)
    // Fail open: en caso de error, permitir
    return {
      permitido: true,
      intentosRestantes: LIMITES_POR_TIPO[tipo].maxIntentos,
      tiempoEsperaSegundos: 0,
    }
  }
}

/**
 * Registra un intento de autenticación
 *
 * @param identifier - Identificador único (IP, email, auth_id)
 * @param tipo - Tipo de acción
 * @param exitoso - Si el intento fue exitoso
 * @param metadata - Información adicional (user agent, etc.)
 *
 * @example
 * ```typescript
 * await registrarIntento('user@example.com', 'login', false, {
 *   user_agent: req.headers['user-agent'],
 *   ip: req.ip
 * })
 * ```
 */
export async function registrarIntento(
  identifier: string,
  tipo: TipoRateLimit,
  exitoso: boolean = false,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = await crearClienteServidor()

    const { error } = await supabase.rpc('registrar_intento', {
      p_identifier: identifier,
      p_tipo: tipo,
      p_exitoso: exitoso,
      p_metadata: metadata,
    })

    if (error) {
      console.error('Error al registrar intento:', error)
    }
  } catch (error) {
    console.error('Excepción en registrarIntento:', error)
    // No propagamos el error para no bloquear el flujo principal
  }
}

/**
 * Resetea el rate limit de un usuario (solo para admins)
 *
 * @param identifier - Identificador del usuario
 * @param tipo - Tipo específico o null para todos
 * @returns Número de registros eliminados
 *
 * @example
 * ```typescript
 * // Resetear todos los límites
 * await resetearRateLimit('user@example.com')
 *
 * // Resetear solo login
 * await resetearRateLimit('user@example.com', 'login')
 * ```
 */
export async function resetearRateLimit(
  identifier: string,
  tipo?: TipoRateLimit
): Promise<number> {
  try {
    const supabase = await crearClienteServidor()

    const { data, error } = await supabase.rpc('resetear_rate_limit', {
      p_identifier: identifier,
      p_tipo: tipo || null,
    })

    if (error) {
      console.error('Error al resetear rate limit:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Excepción en resetearRateLimit:', error)
    return 0
  }
}

/**
 * Obtiene la dirección IP del cliente en Next.js
 *
 * @param request - Request de Next.js
 * @returns IP address o identificador de fallback
 *
 * @example
 * ```typescript
 * const ip = obtenerIPCliente(request)
 * await verificarRateLimit(ip, 'login')
 * ```
 */
export function obtenerIPCliente(request: Request): string {
  // Intentar obtener IP real (considerando proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    // x-forwarded-for puede contener múltiples IPs separadas por coma
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  // Fallback: generar un identificador temporal
  // En desarrollo esto puede ser común
  return 'unknown-' + Date.now()
}

/**
 * Middleware helper para rate limiting en Server Actions
 *
 * @param identifier - Identificador (email, IP, etc.)
 * @param tipo - Tipo de acción
 * @param accion - Función a ejecutar si está permitido
 * @returns Resultado de la acción o error de rate limit
 *
 * @example
 * ```typescript
 * export async function loginAction(email: string, password: string) {
 *   return conRateLimit(email, 'login', async () => {
 *     // Lógica de login...
 *     return { success: true }
 *   })
 * }
 * ```
 */
export async function conRateLimit<T>(
  identifier: string,
  tipo: TipoRateLimit,
  accion: () => Promise<T>
): Promise<T | { error: string; tiempoEspera?: number }> {
  // Verificar límite
  const limite = await verificarRateLimit(identifier, tipo)

  if (!limite.permitido) {
    return {
      error: limite.mensaje || 'Demasiados intentos',
      tiempoEspera: limite.tiempoEsperaSegundos,
    }
  }

  try {
    // Ejecutar la acción
    const resultado = await accion()

    // Registrar intento exitoso
    await registrarIntento(identifier, tipo, true)

    return resultado
  } catch (error) {
    // Registrar intento fallido
    await registrarIntento(identifier, tipo, false)

    throw error
  }
}

/**
 * Formatea el mensaje de tiempo de espera
 *
 * @param segundos - Segundos de espera
 * @returns Mensaje formateado
 */
export function formatearTiempoEspera(segundos: number): string {
  if (segundos < 60) {
    return `${segundos} segundo(s)`
  }

  const minutos = Math.ceil(segundos / 60)
  return `${minutos} minuto(s)`
}
