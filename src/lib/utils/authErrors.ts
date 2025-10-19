/**
 * =====================================================
 * UTILIDAD: Manejo Seguro de Errores de Autenticación
 * =====================================================
 * Gestiona errores de autenticación sin revelar
 * información sensible que pueda facilitar account
 * enumeration o timing attacks.
 *
 * VULNERABILIDAD CORREGIDA: ALTO #5
 * Antes: Mensajes de error revelaban si un email existía
 * Ahora: Mensajes genéricos que no revelan información
 * =====================================================
 */

/**
 * Códigos de error internos (no se muestran al usuario)
 */
export enum CodigoErrorAuth {
  // Login
  CREDENCIALES_INVALIDAS = 'credenciales_invalidas',
  EMAIL_NO_CONFIRMADO = 'email_no_confirmado',
  CUENTA_BLOQUEADA = 'cuenta_bloqueada',
  CUENTA_INACTIVA = 'cuenta_inactiva',

  // Registro
  EMAIL_YA_REGISTRADO = 'email_ya_registrado',
  CONTRASENA_DEBIL = 'contrasena_debil',
  DATOS_INVALIDOS = 'datos_invalidos',

  // Rate Limiting
  DEMASIADOS_INTENTOS = 'demasiados_intentos',

  // Recuperación de contraseña
  EMAIL_NO_ENCONTRADO = 'email_no_encontrado', // Internamente, pero no se revela al usuario

  // Errores generales
  ERROR_SERVIDOR = 'error_servidor',
  ERROR_RED = 'error_red',
  ERROR_DESCONOCIDO = 'error_desconocido',
}

/**
 * Mensajes de error seguros para mostrar al usuario
 * Estos mensajes NO revelan información sensible
 */
const MENSAJES_SEGUROS: Record<CodigoErrorAuth, string> = {
  // ✅ SEGURO: No revela si el email existe o si la contraseña es incorrecta
  [CodigoErrorAuth.CREDENCIALES_INVALIDAS]:
    'Email o contraseña incorrectos. Por favor, verifica tus datos.',

  [CodigoErrorAuth.EMAIL_NO_CONFIRMADO]:
    'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',

  [CodigoErrorAuth.CUENTA_BLOQUEADA]:
    'Tu cuenta ha sido bloqueada temporalmente. Contacta con soporte si necesitas ayuda.',

  [CodigoErrorAuth.CUENTA_INACTIVA]:
    'Tu cuenta está inactiva. Contacta con soporte para más información.',

  // ✅ SEGURO: No revela si el email ya existe
  [CodigoErrorAuth.EMAIL_YA_REGISTRADO]:
    'No se pudo completar el registro. Si ya tienes una cuenta, intenta iniciar sesión.',

  [CodigoErrorAuth.CONTRASENA_DEBIL]:
    'La contraseña no cumple con los requisitos de seguridad. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.',

  [CodigoErrorAuth.DATOS_INVALIDOS]:
    'Los datos proporcionados no son válidos. Por favor, revisa el formulario.',

  [CodigoErrorAuth.DEMASIADOS_INTENTOS]:
    'Demasiados intentos. Por favor, espera unos minutos antes de intentar de nuevo.',

  // ✅ SEGURO: No revela si el email existe
  [CodigoErrorAuth.EMAIL_NO_ENCONTRADO]:
    'Si ese email está registrado, recibirás instrucciones para restablecer tu contraseña.',

  [CodigoErrorAuth.ERROR_SERVIDOR]:
    'Ocurrió un error en el servidor. Por favor, intenta de nuevo más tarde.',

  [CodigoErrorAuth.ERROR_RED]: 'Error de conexión. Por favor, verifica tu conexión a internet.',

  [CodigoErrorAuth.ERROR_DESCONOCIDO]: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
}

/**
 * Interfaz de error de autenticación
 */
export interface ErrorAuth {
  codigo: CodigoErrorAuth
  mensaje: string // Mensaje seguro para mostrar al usuario
  detalles?: string // Detalles internos (solo para logging, NO mostrar al usuario)
  timestamp: Date
}

/**
 * Crea un error de autenticación seguro
 *
 * @param codigo - Código de error interno
 * @param detalles - Detalles adicionales (solo para logging interno)
 * @returns Error formateado de manera segura
 *
 * @example
 * ```typescript
 * const error = crearErrorAuth(CodigoErrorAuth.CREDENCIALES_INVALIDAS, 'Email: user@example.com no encontrado')
 * console.error(error.detalles) // Solo en servidor
 * return { error: error.mensaje } // Al usuario
 * ```
 */
export function crearErrorAuth(codigo: CodigoErrorAuth, detalles?: string): ErrorAuth {
  return {
    codigo,
    mensaje: MENSAJES_SEGUROS[codigo],
    detalles,
    timestamp: new Date(),
  }
}

/**
 * Mapea errores de Supabase a errores seguros
 *
 * @param error - Error de Supabase
 * @returns Error de autenticación seguro
 *
 * @example
 * ```typescript
 * const { error } = await supabase.auth.signInWithPassword({ email, password })
 * if (error) {
 *   return mapearErrorSupabase(error)
 * }
 * ```
 */
export function mapearErrorSupabase(error: any): ErrorAuth {
  const mensajeError = error?.message?.toLowerCase() || ''
  const codigoError = error?.status || error?.code

  // Logging interno (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error('[AuthError - DEV ONLY]', {
      mensaje: error.message,
      codigo: codigoError,
      detalles: error,
    })
  }

  // Mapeo de errores comunes de Supabase
  if (
    mensajeError.includes('invalid login credentials') ||
    mensajeError.includes('invalid password') ||
    mensajeError.includes('user not found')
  ) {
    // ✅ CRÍTICO: Usar mensaje genérico para prevenir account enumeration
    return crearErrorAuth(
      CodigoErrorAuth.CREDENCIALES_INVALIDAS,
      `Supabase: ${error.message}` // Solo para logs internos
    )
  }

  if (mensajeError.includes('email not confirmed')) {
    return crearErrorAuth(CodigoErrorAuth.EMAIL_NO_CONFIRMADO, `Supabase: ${error.message}`)
  }

  if (mensajeError.includes('user already registered') || mensajeError.includes('duplicate')) {
    // ✅ CRÍTICO: No revelar que el email ya existe
    return crearErrorAuth(CodigoErrorAuth.EMAIL_YA_REGISTRADO, `Supabase: ${error.message}`)
  }

  if (mensajeError.includes('password') && mensajeError.includes('weak')) {
    return crearErrorAuth(CodigoErrorAuth.CONTRASENA_DEBIL, `Supabase: ${error.message}`)
  }

  if (codigoError === 429 || mensajeError.includes('too many requests')) {
    return crearErrorAuth(CodigoErrorAuth.DEMASIADOS_INTENTOS, `Supabase: ${error.message}`)
  }

  if (codigoError >= 500) {
    return crearErrorAuth(CodigoErrorAuth.ERROR_SERVIDOR, `Supabase: ${error.message}`)
  }

  if (mensajeError.includes('network') || mensajeError.includes('timeout')) {
    return crearErrorAuth(CodigoErrorAuth.ERROR_RED, `Supabase: ${error.message}`)
  }

  // Error genérico para casos no mapeados
  return crearErrorAuth(CodigoErrorAuth.ERROR_DESCONOCIDO, `Supabase: ${error.message}`)
}

/**
 * Registra un error de autenticación en el servidor (logging server-side)
 *
 * IMPORTANTE: En producción, esto debería enviar a un servicio de logging
 * como Sentry, LogRocket, Datadog, etc.
 *
 * @param error - Error a registrar
 * @param contexto - Contexto adicional (usuario, IP, etc.)
 */
export async function registrarErrorAuth(
  error: ErrorAuth,
  contexto?: {
    usuario_id?: string
    email?: string
    ip?: string
    user_agent?: string
    accion?: string
  }
): Promise<void> {
  // En desarrollo, solo console.error
  if (process.env.NODE_ENV === 'development') {
    console.error('[AuthError]', {
      ...error,
      contexto,
    })
    return
  }

  // TODO: En producción, enviar a servicio de logging
  // Ejemplos:
  // - await Sentry.captureException(error, { contexts: { auth: contexto } })
  // - await LogRocket.error(error.mensaje, { ...error, contexto })
  // - await fetch('/api/log', { method: 'POST', body: JSON.stringify({ error, contexto }) })

  // Por ahora, solo console.error también en producción
  console.error('[AuthError - PROD]', {
    codigo: error.codigo,
    timestamp: error.timestamp,
    contexto: {
      usuario_id: contexto?.usuario_id,
      accion: contexto?.accion,
      // NO incluir email o IP en logs de producción por privacidad
    },
  })
}

/**
 * Valida formato de email de manera segura
 * (evita timing attacks comparando siempre toda la validación)
 *
 * @param email - Email a validar
 * @returns true si es válido, false si no
 */
export function validarEmailSeguro(email: string): boolean {
  // Regex simple para email (puedes usar una librería como validator.js)
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Validaciones adicionales
  const validaciones = [
    email.length > 0,
    email.length < 255,
    regexEmail.test(email),
    !email.includes('..'), // No permitir puntos consecutivos
    email.indexOf('@') > 0, // @ no al inicio
    email.lastIndexOf('.') > email.indexOf('@'), // . después de @
  ]

  // ✅ IMPORTANTE: Evaluar TODAS las validaciones para evitar timing attacks
  return validaciones.every((v) => v === true)
}
