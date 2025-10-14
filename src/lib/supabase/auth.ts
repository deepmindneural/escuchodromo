/**
 * Helpers de autenticación para Supabase
 */

'use client'

import { obtenerClienteNavegador } from './cliente'

interface CredencialesRegistro {
  email: string
  password: string
  nombre?: string
}

interface CredencialesLogin {
  email: string
  password: string
}

/**
 * Registrar un nuevo usuario
 */
export async function registrarUsuario({ email, password, nombre }: CredencialesRegistro) {
  const supabase = obtenerClienteNavegador()

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre: nombre || email.split('@')[0],
      },
    },
  })

  if (authError) {
    throw new Error(`Error al registrar: ${authError.message}`)
  }

  if (!authData.user) {
    throw new Error('No se pudo crear el usuario')
  }

  // 2. Crear perfil en tabla Usuario
  const { error: perfilError } = await supabase.from('Usuario').insert({
    auth_id: authData.user.id,
    email,
    nombre: nombre || email.split('@')[0],
    rol: 'USUARIO',
  })

  if (perfilError) {
    console.error('Error al crear perfil:', perfilError)
    throw new Error(`Error al crear perfil: ${perfilError.message}`)
  }

  // 3. Crear PerfilUsuario
  const { data: usuarioData } = await supabase
    .from('Usuario')
    .select('id')
    .eq('auth_id', authData.user.id)
    .single()

  if (usuarioData) {
    await supabase.from('PerfilUsuario').insert({
      usuario_id: usuarioData.id,
      idioma_preferido: 'es',
      moneda: 'COP',
      zona_horaria: 'America/Bogota',
      consentimiento_datos: true,
    })
  }

  return authData
}

/**
 * Iniciar sesión
 */
export async function iniciarSesion({ email, password }: CredencialesLogin) {
  const supabase = obtenerClienteNavegador()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(`Error al iniciar sesión: ${error.message}`)
  }

  return data
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {
  const supabase = obtenerClienteNavegador()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(`Error al cerrar sesión: ${error.message}`)
  }
}

/**
 * Obtener usuario actual
 */
export async function obtenerUsuarioActual() {
  const supabase = obtenerClienteNavegador()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Verificar si el usuario es admin
 */
export async function esAdmin() {
  const supabase = obtenerClienteNavegador()
  const user = await obtenerUsuarioActual()

  if (!user) return false

  const { data } = await supabase
    .from('Usuario')
    .select('rol')
    .eq('auth_id', user.id)
    .single()

  return data?.rol === 'ADMIN'
}

/**
 * Verificar si el usuario es terapeuta
 */
export async function esTerapeuta() {
  const supabase = obtenerClienteNavegador()
  const user = await obtenerUsuarioActual()

  if (!user) return false

  const { data } = await supabase
    .from('Usuario')
    .select('rol')
    .eq('auth_id', user.id)
    .single()

  return data?.rol === 'TERAPEUTA'
}

/**
 * Resetear contraseña
 */
export async function resetearContrasena(email: string) {
  const supabase = obtenerClienteNavegador()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/actualizar-contrasena`,
  })

  if (error) {
    throw new Error(`Error al resetear contraseña: ${error.message}`)
  }
}

/**
 * Actualizar contraseña
 */
export async function actualizarContrasena(nuevaContrasena: string) {
  const supabase = obtenerClienteNavegador()

  const { error } = await supabase.auth.updateUser({
    password: nuevaContrasena,
  })

  if (error) {
    throw new Error(`Error al actualizar contraseña: ${error.message}`)
  }
}
