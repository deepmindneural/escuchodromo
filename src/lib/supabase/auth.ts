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
 *
 * NOTA: El perfil de usuario se crea automáticamente mediante un trigger de base de datos.
 * Ver: CREAR_TRIGGER_REGISTRO.sql
 */
export async function registrarUsuario({ email, password, nombre }: CredencialesRegistro) {
  const supabase = obtenerClienteNavegador()

  // Crear usuario en Supabase Auth
  // El trigger 'on_auth_user_created' creará automáticamente el perfil en Usuario y PerfilUsuario
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre: nombre || email.split('@')[0],
      },
      // Desactivar confirmación de email para desarrollo (opcional)
      // En producción, esto debe estar habilitado en Supabase Dashboard
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (authError) {
    throw new Error(`Error al registrar: ${authError.message}`)
  }

  if (!authData.user) {
    throw new Error('No se pudo crear el usuario')
  }

  // El perfil ya fue creado por el trigger, solo retornamos los datos
  return authData
}

/**
 * Iniciar sesión y obtener rol del usuario
 */
export async function iniciarSesion({ email, password }: CredencialesLogin) {
  const supabase = obtenerClienteNavegador()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Error completo de login:', error)
    console.error('Código:', error.status)
    console.error('Mensaje:', error.message)

    // Mensajes más claros según el error
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Email o contraseña incorrectos')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.')
    }

    throw new Error(`Error al iniciar sesión: ${error.message}`)
  }

  // Obtener rol del usuario desde la tabla Usuario
  let rol: string | null = null
  if (data.user) {
    console.log('🔍 iniciarSesion - Obteniendo rol para auth_id:', data.user.id);

    const { data: usuario, error: rolError } = await supabase
      .from('Usuario')
      .select('rol, email, nombre')
      .eq('auth_id', data.user.id)
      .single()

    if (rolError) {
      console.error('❌ Error al obtener rol:', rolError);
    } else {
      console.log('✅ Usuario encontrado:', {
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      });
    }

    rol = usuario?.rol || null
  }

  console.log('🚀 iniciarSesion completado - Rol:', rol);
  return { ...data, rol }
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {
  const supabase = obtenerClienteNavegador()

  // Logout global para cerrar sesión en todas las pestañas/dispositivos
  const { error } = await supabase.auth.signOut({ scope: 'global' })

  if (error) {
    throw new Error(`Error al cerrar sesión: ${error.message}`)
  }

  // Forzar recarga completa para limpiar el estado del middleware
  if (typeof window !== 'undefined') {
    window.location.href = '/'
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
