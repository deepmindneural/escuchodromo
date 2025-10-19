/**
 * =====================================================
 * SERVER ACTIONS: Autenticación Segura
 * =====================================================
 * Server Actions de Next.js 15 para autenticación con:
 * - ✅ Protección CSRF automática
 * - ✅ Rate limiting integrado
 * - ✅ Validación robusta de contraseñas
 * - ✅ Manejo de errores seguros
 * - ✅ Auditoría de eventos
 *
 * VULNERABILIDADES CORREGIDAS:
 * - CRÍTICO #4: Rate limiting
 * - ALTO #1: Contraseñas débiles
 * - ALTO #3: Protección CSRF
 * - ALTO #5: Manejo de errores
 * =====================================================
 */

'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { verificarRateLimit, registrarIntento } from '@/lib/utils/rateLimiting'
import { validarContrasena, validarContrasenaSimple } from '@/lib/utils/validarContrasena'
import {
  mapearErrorSupabase,
  crearErrorAuth,
  CodigoErrorAuth,
  validarEmailSeguro,
  registrarErrorAuth,
} from '@/lib/utils/authErrors'

/**
 * Resultado de las Server Actions
 */
interface ResultadoAuth {
  success?: boolean
  error?: string
  tiempoEspera?: number
}

/**
 * Obtiene la IP del cliente de manera segura
 */
async function obtenerIPCliente(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIp || 'unknown'
}

/**
 * =====================================================
 * SERVER ACTION: Login
 * =====================================================
 */
export async function loginAction(formData: FormData): Promise<ResultadoAuth> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validación básica
  if (!email || !password) {
    return {
      error: 'Email y contraseña son requeridos',
    }
  }

  // Validar formato de email
  if (!validarEmailSeguro(email)) {
    return {
      error: 'Formato de email inválido',
    }
  }

  // ✅ RATE LIMITING
  const ip = await obtenerIPCliente()
  const limite = await verificarRateLimit(email, 'login')

  if (!limite.permitido) {
    await registrarErrorAuth(
      crearErrorAuth(CodigoErrorAuth.DEMASIADOS_INTENTOS, `Email: ${email}, IP: ${ip}`),
      { email, ip, accion: 'login' }
    )

    return {
      error: limite.mensaje,
      tiempoEspera: limite.tiempoEsperaSegundos,
    }
  }

  try {
    const supabase = await crearClienteServidor()

    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // ✅ REGISTRAR INTENTO FALLIDO
      await registrarIntento(email, 'login', false, { ip })

      // ✅ MAPEAR ERROR SEGURO (no revela información)
      const errorSeguro = mapearErrorSupabase(error)
      await registrarErrorAuth(errorSeguro, { email, ip, accion: 'login' })

      return {
        error: errorSeguro.mensaje,
      }
    }

    // ✅ REGISTRAR INTENTO EXITOSO
    await registrarIntento(email, 'login', true, { ip, usuario_id: data.user?.id })

    // TODO: Registrar en tabla de auditoría (ver tarea pendiente)

  } catch (error) {
    console.error('Error en loginAction:', error)
    return {
      error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    }
  }

  // Redirigir a dashboard
  redirect('/dashboard')
}

/**
 * =====================================================
 * SERVER ACTION: Registro
 * =====================================================
 */
export async function registrarAction(formData: FormData): Promise<ResultadoAuth> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string

  // Validación básica
  if (!email || !password || !nombre) {
    return {
      error: 'Todos los campos son requeridos',
    }
  }

  // Validar email
  if (!validarEmailSeguro(email)) {
    return {
      error: 'Formato de email inválido',
    }
  }

  // ✅ VALIDACIÓN ROBUSTA DE CONTRASEÑA
  const errorContrasena = validarContrasenaSimple(password)
  if (errorContrasena) {
    return {
      error: errorContrasena,
    }
  }

  // ✅ RATE LIMITING
  const ip = await obtenerIPCliente()
  const limite = await verificarRateLimit(email, 'register')

  if (!limite.permitido) {
    return {
      error: limite.mensaje,
      tiempoEspera: limite.tiempoEsperaSegundos,
    }
  }

  try {
    const supabase = await crearClienteServidor()

    // Intentar registro
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre,
        },
        // ✅ CONFIGURAR REDIRECT PARA CONFIRMACIÓN DE EMAIL
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/confirmar-email/confirmado`,
      },
    })

    if (error) {
      await registrarIntento(email, 'register', false, { ip })

      const errorSeguro = mapearErrorSupabase(error)
      await registrarErrorAuth(errorSeguro, { email, ip, accion: 'register' })

      return {
        error: errorSeguro.mensaje,
      }
    }

    await registrarIntento(email, 'register', true, { ip, usuario_id: data.user?.id })

    // NOTA: El trigger de base de datos creará automáticamente
    // el registro en Usuario y PerfilUsuario

  } catch (error) {
    console.error('Error en registrarAction:', error)
    return {
      error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    }
  }

  // Redirigir a página de confirmación de email
  redirect('/confirmar-email')
}

/**
 * =====================================================
 * SERVER ACTION: Logout
 * =====================================================
 */
export async function logoutAction(): Promise<void> {
  try {
    const supabase = await crearClienteServidor()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error en logoutAction:', error)
  }

  redirect('/iniciar-sesion')
}

/**
 * =====================================================
 * SERVER ACTION: Recuperar Contraseña
 * =====================================================
 */
export async function recuperarContrasenaAction(formData: FormData): Promise<ResultadoAuth> {
  const email = formData.get('email') as string

  if (!email) {
    return {
      error: 'Email es requerido',
    }
  }

  if (!validarEmailSeguro(email)) {
    return {
      error: 'Formato de email inválido',
    }
  }

  // ✅ RATE LIMITING
  const ip = await obtenerIPCliente()
  const limite = await verificarRateLimit(email, 'reset_password')

  if (!limite.permitido) {
    return {
      error: limite.mensaje,
      tiempoEspera: limite.tiempoEsperaSegundos,
    }
  }

  try {
    const supabase = await crearClienteServidor()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/actualizar-contrasena`,
    })

    await registrarIntento(email, 'reset_password', !error, { ip })

    // ✅ IMPORTANTE: Siempre devolver el mismo mensaje
    // para no revelar si el email existe o no
    return {
      success: true,
      error: undefined,
    }
  } catch (error) {
    console.error('Error en recuperarContrasenaAction:', error)

    // ✅ Aún en caso de error, no revelar información
    return {
      success: true,
      error: undefined,
    }
  }
}

/**
 * =====================================================
 * SERVER ACTION: Actualizar Contraseña
 * =====================================================
 */
export async function actualizarContrasenaAction(formData: FormData): Promise<ResultadoAuth> {
  const newPassword = formData.get('newPassword') as string

  if (!newPassword) {
    return {
      error: 'Nueva contraseña es requerida',
    }
  }

  // ✅ VALIDACIÓN ROBUSTA
  const errorContrasena = validarContrasenaSimple(newPassword)
  if (errorContrasena) {
    return {
      error: errorContrasena,
    }
  }

  try {
    const supabase = await crearClienteServidor()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      const errorSeguro = mapearErrorSupabase(error)
      return {
        error: errorSeguro.mensaje,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error en actualizarContrasenaAction:', error)
    return {
      error: 'Ocurrió un error al actualizar la contraseña.',
    }
  }
}
