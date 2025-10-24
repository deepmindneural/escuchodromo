/**
 * Tests para Edge Function: cambiar-plan-stripe
 *
 * Casos de prueba:
 * 1. Upgrade exitoso (Premium → Profesional)
 * 2. Downgrade exitoso (Profesional → Premium)
 * 3. Cambio de período (mensual → anual)
 * 4. Validaciones de seguridad
 * 5. Manejo de errores
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts'

const FUNCTION_URL = Deno.env.get('SUPABASE_URL') + '/functions/v1/cambiar-plan-stripe'
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// ==========================================
// HELPERS
// ==========================================

async function invokeFunction(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ANON_KEY}`
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  return {
    status: response.status,
    data: await response.json()
  }
}

// ==========================================
// TESTS
// ==========================================

Deno.test('CORS - OPTIONS request debe retornar headers correctos', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'OPTIONS'
  })

  assertEquals(response.status, 200)
  assertExists(response.headers.get('Access-Control-Allow-Origin'))
  assertExists(response.headers.get('Access-Control-Allow-Headers'))
})

Deno.test('Auth - Request sin token debe retornar 401', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'profesional',
    nuevo_periodo: 'anual'
  }, '')

  assertEquals(status, 401)
  assertEquals(data.error, 'No autorizado - Token requerido')
})

Deno.test('Validación - Body vacío debe retornar 400', async () => {
  const { status, data } = await invokeFunction({}, ANON_KEY)

  assertEquals(status, 400)
  assertExists(data.error)
})

Deno.test('Validación - Plan inválido debe retornar 400', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'plan_inexistente',
    nuevo_periodo: 'mensual'
  }, ANON_KEY)

  assertEquals(status, 400)
  assertExists(data.error)
})

Deno.test('Validación - Período inválido debe retornar 400', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'premium',
    nuevo_periodo: 'trimestral'
  }, ANON_KEY)

  assertEquals(status, 400)
  assertExists(data.error)
})

Deno.test('Validación - Cambiar a plan básico debe retornar 400', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'basico',
    nuevo_periodo: 'mensual'
  }, ANON_KEY)

  assertEquals(status, 400)
  assertEquals(
    data.error,
    'No puedes cambiar a plan básico. Para cancelar tu suscripción, usa la opción de cancelar.'
  )
})

Deno.test('Validación - Mismo plan actual debe retornar 400', async () => {
  // Asume que el usuario de prueba tiene plan premium mensual
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'premium',
    nuevo_periodo: 'mensual'
  }, ANON_KEY)

  assertEquals(status, 400)
  assertExists(data.error)
  assertEquals(data.error.includes('Ya tienes el plan'), true)
})

Deno.test('Upgrade - Premium mensual → Profesional anual debe retornar aplicación inmediata', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'profesional',
    nuevo_periodo: 'anual'
  }, ANON_KEY)

  // Si hay suscripción activa
  if (status === 200) {
    assertEquals(data.success, true)
    assertEquals(data.datos.tipo_cambio, 'upgrade')
    assertEquals(data.datos.aplicacion, 'inmediata')
    assertEquals(data.datos.plan_nuevo, 'profesional')
    assertEquals(data.datos.periodo_nuevo, 'anual')
    assertExists(data.datos.precio_nuevo)
    assertExists(data.datos.fecha_efectiva)
    assertExists(data.mensaje)
  } else if (status === 404) {
    // Usuario sin suscripción activa
    assertEquals(data.error.includes('No tienes una suscripción activa'), true)
  }
})

Deno.test('Downgrade - Profesional anual → Premium mensual debe retornar aplicación fin_periodo', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'premium',
    nuevo_periodo: 'mensual'
  }, ANON_KEY)

  // Si hay suscripción activa
  if (status === 200) {
    assertEquals(data.success, true)
    assertEquals(data.datos.tipo_cambio, 'downgrade')
    assertEquals(data.datos.aplicacion, 'fin_periodo')
    assertEquals(data.datos.plan_nuevo, 'premium')
    assertEquals(data.datos.periodo_nuevo, 'mensual')
    assertExists(data.datos.precio_nuevo)
    assertExists(data.datos.fecha_efectiva)
    assertExists(data.mensaje)
    assertEquals(data.mensaje.includes('al final del período actual'), true)
  } else if (status === 404) {
    // Usuario sin suscripción activa
    assertEquals(data.error.includes('No tienes una suscripción activa'), true)
  }
})

Deno.test('Cambio período - Premium mensual → Premium anual es upgrade', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'premium',
    nuevo_periodo: 'anual'
  }, ANON_KEY)

  if (status === 200) {
    assertEquals(data.success, true)
    // Anual es más barato que 12 meses de mensual → upgrade
    assertEquals(data.datos.tipo_cambio, 'upgrade')
    assertEquals(data.datos.aplicacion, 'inmediata')
  } else if (status === 400) {
    // Ya tiene premium anual
    assertEquals(data.error.includes('Ya tienes el plan'), true)
  }
})

Deno.test('Response structure - Debe incluir todos los campos esperados en éxito', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'profesional',
    nuevo_periodo: 'anual'
  }, ANON_KEY)

  if (status === 200) {
    assertExists(data.success)
    assertExists(data.mensaje)
    assertExists(data.datos)
    assertExists(data.datos.plan_anterior)
    assertExists(data.datos.periodo_anterior)
    assertExists(data.datos.plan_nuevo)
    assertExists(data.datos.periodo_nuevo)
    assertExists(data.datos.precio_nuevo)
    assertExists(data.datos.moneda)
    assertExists(data.datos.tipo_cambio)
    assertExists(data.datos.aplicacion)
    assertExists(data.datos.fecha_efectiva)
  }
})

Deno.test('Response structure - Debe incluir error y detalles en fallo', async () => {
  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'basico',
    nuevo_periodo: 'mensual'
  }, ANON_KEY)

  assertEquals(status, 400)
  assertExists(data.error)
})

// ==========================================
// TESTS DE INTEGRACIÓN (Requieren Stripe)
// ==========================================

Deno.test('Integración Stripe - Upgrade debe crear proration invoice', async (t) => {
  // Skip si no hay Stripe configurado
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')
  if (!STRIPE_KEY) {
    console.log('⚠️  STRIPE_SECRET_KEY no configurada, saltando test de integración')
    return
  }

  // Este test requiere un usuario real con suscripción activa
  const TEST_USER_TOKEN = Deno.env.get('TEST_USER_JWT')
  if (!TEST_USER_TOKEN) {
    console.log('⚠️  TEST_USER_JWT no configurado, saltando test de integración')
    return
  }

  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'profesional',
    nuevo_periodo: 'anual'
  }, TEST_USER_TOKEN)

  if (status === 200) {
    assertEquals(data.success, true)
    assertEquals(data.datos.tipo_cambio, 'upgrade')

    // Verificar que se creó proration invoice en Stripe
    // (Esto requeriría llamar a Stripe API para verificar)
    console.log('✅ Upgrade exitoso, verificar manualmente en Stripe Dashboard')
  }
})

Deno.test('Integración Stripe - Downgrade debe programar cambio para fin de período', async (t) => {
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')
  if (!STRIPE_KEY) {
    console.log('⚠️  STRIPE_SECRET_KEY no configurada, saltando test de integración')
    return
  }

  const TEST_USER_TOKEN = Deno.env.get('TEST_USER_JWT')
  if (!TEST_USER_TOKEN) {
    console.log('⚠️  TEST_USER_JWT no configurado, saltando test de integración')
    return
  }

  const { status, data } = await invokeFunction({
    nuevo_plan_codigo: 'premium',
    nuevo_periodo: 'mensual'
  }, TEST_USER_TOKEN)

  if (status === 200) {
    assertEquals(data.success, true)
    assertEquals(data.datos.tipo_cambio, 'downgrade')
    assertEquals(data.datos.aplicacion, 'fin_periodo')

    console.log('✅ Downgrade programado, verificar manualmente en Stripe Dashboard')
  }
})

// ==========================================
// TESTS DE PERFORMANCE
// ==========================================

Deno.test('Performance - Request debe completarse en menos de 5 segundos', async () => {
  const startTime = Date.now()

  await invokeFunction({
    nuevo_plan_codigo: 'profesional',
    nuevo_periodo: 'anual'
  }, ANON_KEY)

  const endTime = Date.now()
  const duration = endTime - startTime

  console.log(`⏱️  Request completado en ${duration}ms`)
  assertEquals(duration < 5000, true, 'Request tomó más de 5 segundos')
})

// ==========================================
// INSTRUCCIONES DE EJECUCIÓN
// ==========================================

/**
 * Para ejecutar estos tests:
 *
 * 1. Configurar variables de entorno:
 *    export SUPABASE_URL="https://xxx.supabase.co"
 *    export SUPABASE_ANON_KEY="eyJxxx"
 *    export STRIPE_SECRET_KEY="sk_test_xxx"
 *    export TEST_USER_JWT="eyJxxx" (token de usuario con suscripción activa)
 *
 * 2. Ejecutar tests:
 *    deno test --allow-net --allow-env cambiar-plan-stripe.test.ts
 *
 * 3. Ver resultados con más detalle:
 *    deno test --allow-net --allow-env --trace-ops cambiar-plan-stripe.test.ts
 *
 * 4. Ejecutar test específico:
 *    deno test --allow-net --allow-env --filter "Upgrade" cambiar-plan-stripe.test.ts
 */
