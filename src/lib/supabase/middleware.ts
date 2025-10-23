/**
 * Cliente Supabase para Middleware
 * Se ejecuta en Edge Runtime antes de cada request
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './tipos'

export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refrescar sesión si existe
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Obtener rol del usuario si está autenticado
  let rol: string | null = null
  if (user) {
    try {
      // Usar el cliente supabase normal (ANON_KEY) con RLS habilitado
      // La política RLS "select_propio_perfil" permite que cada usuario
      // autenticado lea su propio registro (auth.uid() = auth_id)
      const { data: usuario, error: usuarioError } = await supabase
        .from('Usuario')
        .select('rol')
        .eq('auth_id', user.id)
        .single()

      if (usuarioError) {
        console.error('❌ [Middleware] Error obteniendo rol:', {
          message: usuarioError.message,
          code: usuarioError.code,
          hint: usuarioError.hint,
          details: usuarioError.details,
          auth_id: user.id,
        })

        // Si el error es por RLS, dar más información
        if (usuarioError.code === 'PGRST116' || usuarioError.message.includes('0 rows')) {
          console.error('⚠️ [Middleware] No se encontró usuario en tabla Usuario para auth_id:', user.id)
          console.error('💡 [Middleware] Verifica que el usuario tenga un registro en la tabla Usuario')
        }
      } else if (usuario) {
        rol = usuario.rol
        console.log('✅ [Middleware] Rol obtenido:', rol, '- Usuario:', user.id)
      } else {
        console.warn('⚠️ [Middleware] Query exitosa pero sin datos para auth_id:', user.id)
      }
    } catch (error) {
      console.error('❌ [Middleware] Error inesperado al obtener rol:', error)
      // En caso de error crítico, permitir continuar con rol null
      // El componente de página manejará la falta de datos
    }
  }

  return { response, user, rol }
}
