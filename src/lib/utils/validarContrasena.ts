/**
 * =====================================================
 * UTILIDAD: Validación Robusta de Contraseñas
 * =====================================================
 * Implementa políticas de seguridad estrictas para
 * contraseñas de usuarios, previniendo contraseñas débiles
 * que facilitan ataques de diccionario y fuerza bruta.
 *
 * VULNERABILIDAD CORREGIDA: ALTO #1
 * Antes: Solo se requerían 6 caracteres mínimos
 * Ahora: 8+ caracteres con mayúsculas, minúsculas, números,
 *        caracteres especiales, y validación contra lista de
 *        contraseñas comunes.
 * =====================================================
 */

/**
 * Resultado de la validación de contraseña
 */
export interface ResultadoValidacionContrasena {
  valida: boolean
  errores: string[]
  fortaleza: 'muy_debil' | 'debil' | 'media' | 'fuerte' | 'muy_fuerte'
  puntuacion: number // 0-100
}

/**
 * Lista de contraseñas comunes que deben ser rechazadas
 * Basada en listas de contraseñas más usadas globalmente
 */
const CONTRASENAS_COMUNES = [
  'password',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'abc123',
  'password123',
  '12345',
  '1234567',
  'password1',
  'qwerty123',
  '123123',
  '111111',
  'iloveyou',
  'admin',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'sunshine',
  'princess',
  'letmein',
  'starwars',
  'superman',
  'batman',
  'trustno1',
  'freedom',
  'whatever',
  'michael',
  'football',
  'shadow',
  '123qwe',
  'qwe123',
  'abc123',
  '1q2w3e4r',
  '1qaz2wsx',
  'admin123',
  'root',
  'toor',
  'pass',
  'test',
  'guest',
  'oracle',
  'demo',
]

/**
 * Requisitos mínimos de contraseña
 */
export const REQUISITOS_CONTRASENA = {
  longitudMinima: 8,
  longitudMaxima: 128,
  requiereMayusculas: true,
  requiereMinusculas: true,
  requiereNumeros: true,
  requiereEspeciales: true,
  caracteresEspeciales: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

/**
 * Valida una contraseña según las políticas de seguridad
 *
 * @param contrasena - Contraseña a validar
 * @param datosUsuario - Datos opcionales del usuario para evitar contraseñas relacionadas
 * @returns Resultado con errores y nivel de fortaleza
 *
 * @example
 * ```typescript
 * const resultado = validarContrasena('MiPass123!', { email: 'user@example.com' })
 * if (!resultado.valida) {
 *   console.log('Errores:', resultado.errores)
 * }
 * ```
 */
export function validarContrasena(
  contrasena: string,
  datosUsuario?: {
    nombre?: string
    email?: string
    apellido?: string
  }
): ResultadoValidacionContrasena {
  const errores: string[] = []
  let puntuacion = 0

  // Validación 1: Longitud mínima
  if (contrasena.length < REQUISITOS_CONTRASENA.longitudMinima) {
    errores.push(
      `La contraseña debe tener al menos ${REQUISITOS_CONTRASENA.longitudMinima} caracteres`
    )
  } else {
    puntuacion += 10
    // Bonificación por longitud extra
    if (contrasena.length >= 12) puntuacion += 10
    if (contrasena.length >= 16) puntuacion += 10
  }

  // Validación 2: Longitud máxima
  if (contrasena.length > REQUISITOS_CONTRASENA.longitudMaxima) {
    errores.push(
      `La contraseña no debe exceder ${REQUISITOS_CONTRASENA.longitudMaxima} caracteres`
    )
  }

  // Validación 3: Debe contener al menos una mayúscula
  if (REQUISITOS_CONTRASENA.requiereMayusculas && !/[A-Z]/.test(contrasena)) {
    errores.push('Debe contener al menos una letra mayúscula (A-Z)')
  } else {
    puntuacion += 15
  }

  // Validación 4: Debe contener al menos una minúscula
  if (REQUISITOS_CONTRASENA.requiereMinusculas && !/[a-z]/.test(contrasena)) {
    errores.push('Debe contener al menos una letra minúscula (a-z)')
  } else {
    puntuacion += 15
  }

  // Validación 5: Debe contener al menos un número
  if (REQUISITOS_CONTRASENA.requiereNumeros && !/[0-9]/.test(contrasena)) {
    errores.push('Debe contener al menos un número (0-9)')
  } else {
    puntuacion += 15
  }

  // Validación 6: Debe contener al menos un carácter especial
  const regexEspecial = new RegExp(
    `[${REQUISITOS_CONTRASENA.caracteresEspeciales.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`
  )
  if (REQUISITOS_CONTRASENA.requiereEspeciales && !regexEspecial.test(contrasena)) {
    errores.push(
      `Debe contener al menos un carácter especial (${REQUISITOS_CONTRASENA.caracteresEspeciales})`
    )
  } else {
    puntuacion += 15
  }

  // Validación 7: No debe ser una contraseña común
  const contrasenaLower = contrasena.toLowerCase()
  if (CONTRASENAS_COMUNES.includes(contrasenaLower)) {
    errores.push('Esta contraseña es demasiado común. Por favor, elige una más segura.')
    puntuacion -= 30
  } else {
    puntuacion += 10
  }

  // Validación 8: No debe contener partes del nombre o email del usuario
  if (datosUsuario) {
    const { nombre, email, apellido } = datosUsuario

    if (nombre && contrasenaLower.includes(nombre.toLowerCase())) {
      errores.push('La contraseña no debe contener tu nombre')
      puntuacion -= 15
    }

    if (apellido && contrasenaLower.includes(apellido.toLowerCase())) {
      errores.push('La contraseña no debe contener tu apellido')
      puntuacion -= 15
    }

    if (email) {
      const emailUsuario = email.split('@')[0].toLowerCase()
      if (contrasenaLower.includes(emailUsuario)) {
        errores.push('La contraseña no debe contener partes de tu email')
        puntuacion -= 15
      }
    }
  }

  // Validación 9: No debe tener caracteres repetidos consecutivos
  if (/(.)\1{2,}/.test(contrasena)) {
    errores.push('Evita usar el mismo carácter 3 o más veces seguidas')
    puntuacion -= 10
  }

  // Validación 10: No debe ser una secuencia simple (abc, 123, etc.)
  const secuenciasComunes = ['abc', '123', '456', '789', 'qwe', 'asd', 'zxc']
  for (const secuencia of secuenciasComunes) {
    if (contrasenaLower.includes(secuencia)) {
      errores.push('Evita usar secuencias simples de caracteres')
      puntuacion -= 10
      break
    }
  }

  // Bonificación por variedad de caracteres
  const tiposUsados =
    [
      /[a-z]/.test(contrasena),
      /[A-Z]/.test(contrasena),
      /[0-9]/.test(contrasena),
      regexEspecial.test(contrasena),
    ].filter(Boolean).length

  puntuacion += tiposUsados * 5

  // Normalizar puntuación
  puntuacion = Math.max(0, Math.min(100, puntuacion))

  // Determinar nivel de fortaleza
  let fortaleza: ResultadoValidacionContrasena['fortaleza']
  if (puntuacion < 30) {
    fortaleza = 'muy_debil'
  } else if (puntuacion < 50) {
    fortaleza = 'debil'
  } else if (puntuacion < 70) {
    fortaleza = 'media'
  } else if (puntuacion < 90) {
    fortaleza = 'fuerte'
  } else {
    fortaleza = 'muy_fuerte'
  }

  return {
    valida: errores.length === 0,
    errores,
    fortaleza,
    puntuacion,
  }
}

/**
 * Valida solo si la contraseña cumple los requisitos mínimos
 * (versión simplificada sin puntuación)
 *
 * @param contrasena - Contraseña a validar
 * @returns String con error o null si es válida
 */
export function validarContrasenaSimple(contrasena: string): string | null {
  const resultado = validarContrasena(contrasena)
  return resultado.valida ? null : resultado.errores[0]
}

/**
 * Genera mensaje descriptivo del nivel de fortaleza
 *
 * @param fortaleza - Nivel de fortaleza
 * @returns Mensaje descriptivo
 */
export function mensajeFortaleza(fortaleza: ResultadoValidacionContrasena['fortaleza']): string {
  const mensajes = {
    muy_debil: 'Muy débil - Necesita mejoras importantes',
    debil: 'Débil - Agrega más caracteres variados',
    media: 'Media - Aceptable pero podría ser mejor',
    fuerte: 'Fuerte - Buena contraseña',
    muy_fuerte: 'Muy fuerte - Excelente contraseña',
  }
  return mensajes[fortaleza]
}

/**
 * Obtiene el color correspondiente al nivel de fortaleza
 * (útil para UI)
 *
 * @param fortaleza - Nivel de fortaleza
 * @returns Color en formato Tailwind CSS
 */
export function colorFortaleza(fortaleza: ResultadoValidacionContrasena['fortaleza']): string {
  const colores = {
    muy_debil: 'text-red-600',
    debil: 'text-orange-600',
    media: 'text-yellow-600',
    fuerte: 'text-green-600',
    muy_fuerte: 'text-emerald-600',
  }
  return colores[fortaleza]
}

/**
 * Obtiene el color de fondo para la barra de progreso
 *
 * @param fortaleza - Nivel de fortaleza
 * @returns Color en formato Tailwind CSS
 */
export function colorBarraFortaleza(fortaleza: ResultadoValidacionContrasena['fortaleza']): string {
  const colores = {
    muy_debil: 'bg-red-500',
    debil: 'bg-orange-500',
    media: 'bg-yellow-500',
    fuerte: 'bg-green-500',
    muy_fuerte: 'bg-emerald-500',
  }
  return colores[fortaleza]
}
