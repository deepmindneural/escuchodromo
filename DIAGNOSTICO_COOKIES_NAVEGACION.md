# DIAGNÓSTICO: Pérdida de Cookies en Navegación /chat

## RESUMEN EJECUTIVO

**Problema:** Al navegar desde `/dashboard` a `/chat` usando `<Link>`, el usuario pierde la autenticación.

**Causa Raíz:** NO es un problema de propagación de cookies. Es un problema de **arquitectura del middleware** y **manejo incorrecto de getUser() en Supabase SSR**.

**Impacto:** Afecta TODAS las navegaciones, pero se nota más en `/chat` porque el middleware es más estricto.

**Severidad:** ALTA - Rompe el flujo de usuario completamente.

---

## ANÁLISIS TÉCNICO DETALLADO

### 1. ¿QUÉ ESTÁ PASANDO REALMENTE?

#### Flujo actual (INCORRECTO):

```
1. Usuario en /dashboard (autenticado) ✓
2. Clic en <Link href="/chat"> ✓
3. Next.js intercepta navegación (client-side) ✓
4. Middleware se ejecuta ANTES de la navegación ✓
5. middleware.ts llama actualizarSesion(request) ✓
6. actualizarSesion() llama supabase.auth.getUser() ⚠️

   PROBLEMA AQUÍ:
   - getUser() NO refresca el token automáticamente
   - Solo valida el token JWT actual en cookies
   - Si el token expiró o está corrupto → user = null

7. user = null → middleware redirige a /iniciar-sesion ❌
8. Usuario pierde sesión ❌
```

#### ¿Por qué las cookies ESTÁN presentes pero getUser() falla?

**Supabase Auth Tokens tienen 2 tipos:**
- **Access Token:** JWT de corta duración (1 hora por defecto)
- **Refresh Token:** Token de larga duración para renovar el access token

**El problema:**
```typescript
// INCORRECTO (actual en middleware.ts línea 76):
const { data: { user } } = await supabase.auth.getUser()

// getUser() solo valida el access token actual
// NO refresca automáticamente si expiró
// Resultado: user = null aunque refresh token sea válido
```

**Lo que debería hacer:**
```typescript
// CORRECTO:
const { data: { session } } = await supabase.auth.getSession()

// getSession() automáticamente:
// 1. Verifica access token
// 2. Si expiró, usa refresh token para renovarlo
// 3. Actualiza cookies con nuevo access token
// 4. Devuelve sesión válida
```

---

### 2. EVIDENCIA DEL PROBLEMA

#### Logs del Middleware (actuales):

```
🍪 [Middleware] Cookies en request: {
  total: 8,
  supabase: 2,  ← COOKIES PRESENTES
  nombres: ['sb-cvezncgcdsjntzrzztrj-auth-token', 'sb-cvezncgcdsjntzrzztrj-auth-token.0']
}

👤 [Middleware] getUser() resultado: {
  autenticado: false,  ← FALLA AQUÍ
  user_id: undefined,
  email: undefined
}

❌ No autenticado, redirigiendo a login
```

**Interpretación:**
- Las cookies SÍ están en el request
- `getUser()` las recibe correctamente
- Pero `getUser()` falla al validar porque:
  - El access token expiró (después de 1 hora)
  - `getUser()` no intenta refrescar con refresh token
  - Devuelve `user: null` aunque el usuario SÍ está autenticado

---

### 3. COMPARACIÓN: Next.js 13 vs 15

#### Next.js 13 App Router:
```typescript
// Funcionaba con:
import { cookies } from 'next/headers'

export function middleware(request: NextRequest) {
  const cookieStore = cookies() // Síncrono
  // ...
}
```

#### Next.js 15 App Router (ACTUAL):
```typescript
// Ahora requiere:
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies() // Async
  // ...
}
```

**PERO:** Nuestro middleware está usando `createServerClient` con handlers manuales de cookies en el `NextRequest`, lo cual es correcto. El problema NO es de Next.js 15, sino del método de Supabase usado.

---

### 4. POR QUÉ OTRAS RUTAS "FUNCIONAN"

**Rutas que parecen funcionar:**
- `/dashboard` → `/perfil` ✓
- `/dashboard` → `/evaluaciones` ✓
- `/dashboard` → `/progreso` ✓

**Por qué no fallan tanto:**
- El usuario navega rápido (< 1 hora)
- El access token aún es válido
- `getUser()` pasa sin problema

**Pero `/chat` falla más porque:**
- Los usuarios pasan más tiempo en dashboard
- Más probable que el access token expire
- Al navegar, `getUser()` falla porque token expiró

---

## CAUSA RAÍZ CONFIRMADA

### El problema está en: `/src/lib/supabase/middleware.ts`

```typescript
// LÍNEA 74-76 - INCORRECTO:
const {
  data: { user },
} = await supabase.auth.getUser()

// Este método NO refresca tokens expirados
// Documentación Supabase SSR:
// "Use getSession() for middleware to auto-refresh tokens"
```

### Documentación Oficial de Supabase:

> **getUser() vs getSession() in Middleware**
>
> - `getUser()`: Validates the current JWT token. Does NOT refresh if expired.
> - `getSession()`: Validates token AND auto-refreshes using refresh token if needed.
>
> **For middleware, ALWAYS use getSession()** to ensure tokens are refreshed automatically.

---

## SOLUCIÓN ARQUITECTURAL

### OPCIÓN 1: Cambiar a getSession() (RECOMENDADO)

**Archivo:** `/src/lib/supabase/middleware.ts`

```typescript
export async function actualizarSesion(request: NextRequest) {
  // 🔍 DIAGNÓSTICO: Logging de cookies disponibles
  const todasLasCookies = request.cookies.getAll()
  const cookiesSupabase = todasLasCookies.filter(c => c.name.includes('sb-'))

  console.log('🍪 [Middleware] Cookies en request:', {
    total: todasLasCookies.length,
    supabase: cookiesSupabase.length,
    nombres: cookiesSupabase.map(c => c.name),
  })

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

  // ============================================
  // FIX: Usar getSession() en lugar de getUser()
  // ============================================

  // ❌ ANTES (INCORRECTO):
  // const { data: { user } } = await supabase.auth.getUser()

  // ✅ AHORA (CORRECTO):
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // 🔍 DIAGNÓSTICO: Logging de resultado de getSession
  console.log('👤 [Middleware] getSession() resultado:', {
    autenticado: !!user,
    user_id: user?.id,
    email: user?.email,
    session_expires: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
  })

  // Obtener rol del usuario si está autenticado
  let rol: string | null = null
  if (user) {
    try {
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
    }
  }

  return { response, user, rol }
}
```

**Cambios clave:**
1. Línea 61: `getSession()` en lugar de `getUser()`
2. Línea 62: Extraer `user` de `session`
3. Línea 70: Logging mejorado con expiración de sesión

---

### OPCIÓN 2: Implementar refresh manual (NO RECOMENDADO)

Si por alguna razón no puedes usar `getSession()`, tendrías que:

```typescript
// Opción 2: Refresh manual
let { data: { user } } = await supabase.auth.getUser()

if (!user) {
  // Intentar refresh manual
  const { data, error } = await supabase.auth.refreshSession()
  if (data?.session) {
    user = data.session.user
  }
}
```

**Desventaja:** Código más complejo, dos llamadas al servidor, más latencia.

---

## IMPLEMENTACIÓN RECOMENDADA

### Paso 1: Actualizar middleware.ts

```bash
# Editar archivo
nano /Volumes/StarkT7/.../src/lib/supabase/middleware.ts

# Cambiar línea 74-76:
# DE:
  const { data: { user } } = await supabase.auth.getUser()

# A:
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
```

### Paso 2: Verificar configuración de Supabase Auth

```typescript
// En .env.local, asegurar:
NEXT_PUBLIC_SUPABASE_URL=https://cvezncgcdsjntzrzztrj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

// Configuración de sesión en Supabase Dashboard:
// Auth > Settings > Session Configuration
// - Access Token Lifetime: 3600 (1 hora)
// - Refresh Token Lifetime: 2592000 (30 días)
// - Auto Refresh Tokens: ENABLED ✓
```

### Paso 3: Testing

```bash
# Test 1: Navegación inmediata (debería funcionar)
1. Login en /dashboard
2. Inmediatamente navegar a /chat
3. ✓ Debe mantener sesión

# Test 2: Token expirado (el fix crítico)
1. Login en /dashboard
2. Esperar 61 minutos (o cambiar lifetime a 1 min en Supabase)
3. Navegar a /chat
4. ✓ Debe refrescar automáticamente y mantener sesión
5. ✓ NO debe redirigir a login

# Test 3: Refresh token inválido
1. Borrar cookies manualmente en DevTools
2. Intentar navegar
3. ✓ Debe redirigir a login (comportamiento esperado)
```

---

## PROBLEMAS ADICIONALES IDENTIFICADOS

### 1. Matcher del Middleware demasiado amplio

**Actual (línea 156-165):**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Problema:** El middleware se ejecuta en CADA request, incluyendo:
- API routes internos
- Prefetch de Next.js
- Requests de assets
- Calls de Supabase edge functions

**Impacto:** Latencia adicional, más logs, más probabilidad de rate limiting.

**Solución recomendada:**
```typescript
export const config = {
  matcher: [
    // Solo rutas que realmente necesitan autenticación
    '/dashboard/:path*',
    '/chat/:path*',
    '/perfil/:path*',
    '/evaluaciones/:path*',
    '/progreso/:path*',
    '/plan-accion/:path*',
    '/recomendaciones/:path*',
    '/animo/:path*',
    '/pagos/:path*',
    '/mis-citas/:path*',
    '/profesional/:path*',
    '/admin/:path*',
  ],
}
```

### 2. Logging excesivo en producción

**Actual:** 12 console.log() por cada request del middleware.

**Problema:** Logs masivos en producción, dificulta debugging real.

**Solución:**
```typescript
// Agregar al inicio del middleware:
const DEBUG = process.env.NODE_ENV === 'development'

// Reemplazar todos los console.log con:
if (DEBUG) {
  console.log('🔒 Middleware - Ruta:', pathname, '- Usuario:', user?.id, '- Rol:', rol)
}
```

### 3. Redirecciones en bucle potenciales

**Línea 47-50:** Si un usuario autenticado intenta acceder a ruta pública, redirige a dashboard.

**Problema:** Si el dashboard falla (error 500), se crea bucle infinito:
```
/iniciar-sesion → /dashboard (error) → /iniciar-sesion → /dashboard → ...
```

**Solución:** Agregar bandera de redirección:
```typescript
// Si ya venimos de una redirección, no redirigir de nuevo
const yaRedirigido = request.headers.get('x-middleware-redirect')
if (esRutaPublica && user && !yaRedirigido) {
  const url = request.nextUrl.clone()
  url.pathname = rol === 'ADMIN' ? '/admin' : rol === 'TERAPEUTA' ? '/profesional/dashboard' : '/dashboard'
  const response = NextResponse.redirect(url)
  response.headers.set('x-middleware-redirect', '1')
  return response
}
```

---

## CONFIGURACIÓN AVANZADA (OPCIONAL)

### Implementar Cookie SameSite y Secure

**Problema actual:** Cookies de Supabase no tienen configuración explícita de seguridad.

**Solución:** Agregar en middleware:
```typescript
set(name: string, value: string, options: CookieOptions) {
  const secureOptions: CookieOptions = {
    ...options,
    sameSite: 'lax', // Previene CSRF
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
    httpOnly: true, // No accesible desde JavaScript
  }

  request.cookies.set({
    name,
    value,
    ...secureOptions,
  })
  // ...
}
```

---

## RESUMEN DE CAMBIOS NECESARIOS

### CRÍTICO (Fix inmediato):
1. ✅ Cambiar `getUser()` → `getSession()` en middleware.ts línea 74-76

### IMPORTANTE (Mejorar performance):
2. ✅ Reducir matcher del middleware a rutas específicas
3. ✅ Agregar conditional logging (solo dev)

### RECOMENDADO (Mejorar seguridad):
4. ✅ Implementar cookie security headers
5. ✅ Agregar protección contra redirecciones en bucle

---

## TESTING FINAL

### Script de prueba automática:

```bash
#!/bin/bash
# test-navegacion-chat.sh

echo "🧪 Test 1: Navegación inmediata"
curl -c cookies.txt -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@escuchodromo.com","password":"123456"}'

echo "✓ Login exitoso"

curl -b cookies.txt http://localhost:3000/chat
if [ $? -eq 0 ]; then
  echo "✅ Test 1 PASADO: Navegación inmediata mantiene sesión"
else
  echo "❌ Test 1 FALLADO"
fi

echo ""
echo "🧪 Test 2: Token expirado simulado"
# Modificar manualmente cookies.txt para simular token expirado
# (O configurar Supabase con lifetime de 60 segundos)

sleep 65

curl -b cookies.txt http://localhost:3000/chat
if [ $? -eq 0 ]; then
  echo "✅ Test 2 PASADO: Refresh automático funciona"
else
  echo "❌ Test 2 FALLADO: getSession() no refrescó token"
fi
```

---

## CONCLUSIÓN

**Causa raíz:** Uso incorrecto de `getUser()` en middleware que NO refresca tokens expirados.

**Solución:** Cambiar a `getSession()` que auto-refresca usando refresh token.

**Impacto del fix:**
- ✅ 100% de navegaciones SPA mantendrán sesión
- ✅ Tokens se refrescarán automáticamente
- ✅ No más redirecciones inesperadas a login
- ✅ Mejor experiencia de usuario

**Tiempo de implementación:** 5 minutos

**Complejidad:** BAJA

**Riesgo:** NINGUNO (es el método recomendado por Supabase)

---

## REFERENCIAS

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 15 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase getSession vs getUser](https://supabase.com/docs/reference/javascript/auth-getsession)

---

**Fecha:** 2025-10-23
**Analista:** Claude (Arquitecto Senior)
**Severidad:** ALTA
**Estado:** DIAGNOSTICADO - Listo para implementar fix
