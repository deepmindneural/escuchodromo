/**
 * Middleware de Next.js para autenticación con Supabase
 * Se ejecuta antes de cada request para verificar y refrescar sesiones
 */

import { type NextRequest, NextResponse } from 'next/server'
import { actualizarSesion } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user, rol } = await actualizarSesion(request)

  // Rutas públicas (no requieren autenticación)
  const rutasPublicas = [
    '/',
    '/iniciar-sesion',
    '/registrar',
    '/chat-publico',
  ]

  // Rutas de admin
  const rutasAdmin = [
    '/admin',
  ]

  // Rutas protegidas (requieren autenticación)
  const rutasProtegidas = [
    '/dashboard',
    '/chat',
    '/evaluaciones',
    '/perfil',
    '/animo',
    '/recomendaciones',
    '/pago',
  ]

  const pathname = request.nextUrl.pathname

  // Verificar si es una ruta pública
  const esRutaPublica = rutasPublicas.some(ruta => pathname === ruta || pathname.startsWith(ruta))

  // Si es ruta pública, permitir acceso
  if (esRutaPublica) {
    return response
  }

  // Verificar si es ruta de admin
  const esRutaAdmin = rutasAdmin.some(ruta => pathname.startsWith(ruta))

  if (esRutaAdmin) {
    if (!user) {
      // Redirigir a login si no está autenticado
      const url = request.nextUrl.clone()
      url.pathname = '/iniciar-sesion'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // ✅ VULNERABILIDAD CRÍTICA #3 CORREGIDA
    // Verificar que el usuario tiene rol de ADMIN
    if (rol !== 'ADMIN') {
      // Usuario autenticado pero sin privilegios de admin
      // Redirigir a dashboard con mensaje
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.set('error', 'no_autorizado')
      return NextResponse.redirect(url)
    }

    // Usuario es ADMIN, permitir acceso
    return response
  }

  // Verificar si es ruta protegida
  const esRutaProtegida = rutasProtegidas.some(ruta => pathname.startsWith(ruta))

  if (esRutaProtegida && !user) {
    // Redirigir a login si no está autenticado
    const url = request.nextUrl.clone()
    url.pathname = '/iniciar-sesion'
    url.searchParams.set('redirect', pathname)
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
