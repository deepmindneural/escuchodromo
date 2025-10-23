/**
 * Middleware de Next.js para autenticación con Supabase
 * REFORZADO: Bloquea navegación entre roles sin cerrar sesión
 */

import { type NextRequest, NextResponse } from 'next/server'
import { actualizarSesion } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user, rol } = await actualizarSesion(request)
  const pathname = request.nextUrl.pathname

  console.log('🔒 Middleware - Ruta:', pathname, '- Usuario:', user?.id, '- Rol:', rol);

  // ==========================================
  // 1. RUTAS PÚBLICAS (acceso sin autenticación)
  // ==========================================
  const rutasPublicas = [
    '/',
    '/iniciar-sesion',
    '/registrar',
    '/registrar-profesional',
    '/recuperar-contrasena',
    '/chat-publico',
    '/como-funciona',
    '/servicios',
    '/contacto',
    '/precios',
    '/profesionales', // Lista pública de profesionales
    '/ayuda',
    '/terminos',
    '/privacidad',
    '/confirmar-email',
  ]

  const esRutaPublica = rutasPublicas.some(ruta => pathname === ruta || pathname.startsWith(ruta))

  // Si es ruta pública pero el usuario está autenticado, redirigir a su dashboard
  if (esRutaPublica && user) {
    // Permitir solo ciertas rutas públicas incluso autenticado
    const rutasPermitidasAutenticado = ['/confirmar-email', '/profesionales']
    const permitida = rutasPermitidasAutenticado.some(ruta => pathname.startsWith(ruta))

    if (!permitida) {
      console.log('🚫 Usuario autenticado intentando acceder a ruta pública:', pathname);
      const url = request.nextUrl.clone()
      url.pathname = rol === 'ADMIN' ? '/admin' : rol === 'TERAPEUTA' ? '/profesional/dashboard' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (esRutaPublica) {
    return response
  }

  // ==========================================
  // 2. VERIFICAR AUTENTICACIÓN
  // ==========================================
  if (!user) {
    console.log('❌ No autenticado, redirigiendo a login');
    const url = request.nextUrl.clone()
    url.pathname = '/iniciar-sesion'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ==========================================
  // 3. RUTAS POR ROL (bloqueo estricto)
  // ==========================================

  // 3.1 ADMIN - Solo puede acceder a /admin/*
  if (rol === 'ADMIN') {
    const rutasPermitidas = ['/admin']
    const tieneAcceso = rutasPermitidas.some(ruta => pathname.startsWith(ruta))

    if (!tieneAcceso) {
      console.log('🚫 ADMIN intentando acceder a:', pathname, '- Bloqueado');
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      url.searchParams.set('error', 'acceso_denegado')
      return NextResponse.redirect(url)
    }
  }

  // 3.2 TERAPEUTA - Solo puede acceder a /profesional/*
  if (rol === 'TERAPEUTA') {
    const rutasPermitidas = ['/profesional', '/pacientes'] // Pacientes para ver progreso
    const tieneAcceso = rutasPermitidas.some(ruta => pathname.startsWith(ruta))

    if (!tieneAcceso) {
      console.log('🚫 TERAPEUTA intentando acceder a:', pathname, '- Bloqueado');
      const url = request.nextUrl.clone()
      url.pathname = '/profesional/dashboard'
      url.searchParams.set('error', 'acceso_denegado')
      return NextResponse.redirect(url)
    }
  }

  // 3.3 USUARIO - Puede acceder a sus rutas específicas
  if (rol === 'USUARIO') {
    const rutasPermitidas = [
      '/dashboard',
      '/perfil',
      '/chat',
      '/voz',
      '/evaluaciones',
      '/animo',
      '/recomendaciones',
      '/progreso',
      '/plan-accion',
      '/pagos',
      '/pago',
      '/suscripcion',
    ]

    const tieneAcceso = rutasPermitidas.some(ruta => pathname.startsWith(ruta))

    if (!tieneAcceso) {
      console.log('🚫 USUARIO intentando acceder a:', pathname, '- Bloqueado');
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.set('error', 'acceso_denegado')
      return NextResponse.redirect(url)
    }
  }

  // ==========================================
  // 4. BLOQUEAR RUTAS DE OTROS ROLES
  // ==========================================

  // Bloquear /admin para no-ADMIN
  if (pathname.startsWith('/admin') && rol !== 'ADMIN') {
    console.log('🚫 Acceso denegado a /admin para rol:', rol);
    const url = request.nextUrl.clone()
    url.pathname = rol === 'TERAPEUTA' ? '/profesional/dashboard' : '/dashboard'
    url.searchParams.set('error', 'no_autorizado')
    return NextResponse.redirect(url)
  }

  // Bloquear /profesional para no-TERAPEUTA
  if (pathname.startsWith('/profesional') && rol !== 'TERAPEUTA' && rol !== 'ADMIN') {
    console.log('🚫 Acceso denegado a /profesional para rol:', rol);
    const url = request.nextUrl.clone()
    url.pathname = rol === 'ADMIN' ? '/admin' : '/dashboard'
    url.searchParams.set('error', 'no_autorizado')
    return NextResponse.redirect(url)
  }

  console.log('✅ Acceso permitido a:', pathname, 'para rol:', rol);
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
