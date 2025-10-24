/**
 * Edge Function: cambiar-plan-stripe
 *
 * Permite a usuarios con suscripción activa cambiar su plan de Stripe
 * Maneja upgrade (prorrateo inmediato) y downgrade (al final del período)
 *
 * @requires STRIPE_SECRET_KEY - API key de Stripe
 * @requires SUPABASE_URL - URL del proyecto Supabase
 * @requires SUPABASE_SERVICE_ROLE_KEY - Service key de Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

// ==========================================
// TIPOS
// ==========================================

interface RequestBody {
  nuevo_plan_codigo: 'basico' | 'premium' | 'profesional'
  nuevo_periodo: 'mensual' | 'anual'
}

interface SuscripcionActual {
  id: string
  usuario_id: string
  plan: string
  periodo: string
  precio: number
  moneda: string
  estado: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  fecha_inicio: string
  fecha_fin: string
  fecha_proximo_pago: string | null
}

interface PlanInfo {
  codigo: string
  nombre: string
  precio_mensual: number
  precio_anual: number
  activo: boolean
}

// ==========================================
// CONSTANTES
// ==========================================

const PRECIOS = {
  basico: {
    mensual: { COP: 0, USD: 0 },
    anual: { COP: 0, USD: 0 }
  },
  premium: {
    mensual: { COP: 49900, USD: 12 },
    anual: { COP: 479000, USD: 115 }
  },
  profesional: {
    mensual: { COP: 99900, USD: 24 },
    anual: { COP: 959000, USD: 230 }
  }
} as const

const ESTADOS_ACTIVOS = ['activa', 'cancelar_al_final']

// ==========================================
// HEADERS CORS
// ==========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Crea respuesta JSON con headers CORS
 */
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  })
}

/**
 * Crea respuesta de error con logging
 */
function errorResponse(mensaje: string, status = 400, detalles?: unknown) {
  console.error('[cambiar-plan-stripe] Error:', { mensaje, status, detalles })
  return jsonResponse({
    error: mensaje,
    detalles: detalles instanceof Error ? detalles.message : detalles
  }, status)
}

/**
 * Determina si el cambio es upgrade (precio mayor) o downgrade
 */
function esUpgrade(precioActual: number, precioNuevo: number): boolean {
  return precioNuevo > precioActual
}

/**
 * Valida que el plan existe y está activo
 */
function validarPlan(plan: string, periodo: string, moneda: 'COP' | 'USD'): {
  valido: boolean
  precio?: number
} {
  if (!['basico', 'premium', 'profesional'].includes(plan)) {
    return { valido: false }
  }

  if (!['mensual', 'anual'].includes(periodo)) {
    return { valido: false }
  }

  const precio = PRECIOS[plan as keyof typeof PRECIOS][periodo as 'mensual' | 'anual'][moneda]
  return { valido: true, precio }
}

/**
 * Registra el cambio de plan en auditoría
 */
async function registrarAuditoria(
  supabase: ReturnType<typeof createClient>,
  data: {
    usuario_id: string
    suscripcion_id: string
    plan_anterior: string
    plan_nuevo: string
    periodo_anterior: string
    periodo_nuevo: string
    precio_anterior: number
    precio_nuevo: number
    tipo_cambio: 'upgrade' | 'downgrade'
    exitoso: boolean
    error?: string
  }
) {
  try {
    await supabase.from('AuditoriaSuscripcion').insert({
      usuario_id: data.usuario_id,
      suscripcion_id: data.suscripcion_id,
      accion: 'cambio_plan',
      datos_anteriores: {
        plan: data.plan_anterior,
        periodo: data.periodo_anterior,
        precio: data.precio_anterior
      },
      datos_nuevos: {
        plan: data.plan_nuevo,
        periodo: data.periodo_nuevo,
        precio: data.precio_nuevo
      },
      metadata: {
        tipo_cambio: data.tipo_cambio,
        exitoso: data.exitoso,
        error: data.error
      }
    })
  } catch (error) {
    console.error('[cambiar-plan-stripe] Error al registrar auditoría:', error)
    // No lanzar error, es log opcional
  }
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================

serve(async (req) => {
  // Manejar OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return errorResponse('Método no permitido', 405)
  }

  let auditoria = {
    usuario_id: '',
    suscripcion_id: '',
    plan_anterior: '',
    plan_nuevo: '',
    periodo_anterior: '',
    periodo_nuevo: '',
    precio_anterior: 0,
    precio_nuevo: 0,
    tipo_cambio: 'upgrade' as 'upgrade' | 'downgrade',
    exitoso: false,
    error: ''
  }

  try {
    // ==========================================
    // 1. VALIDAR VARIABLES DE ENTORNO
    // ==========================================

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!STRIPE_SECRET_KEY) {
      return errorResponse('STRIPE_SECRET_KEY no configurada', 500)
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return errorResponse('Variables de Supabase no configuradas', 500)
    }

    // ==========================================
    // 2. INICIALIZAR CLIENTES
    // ==========================================

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ==========================================
    // 3. AUTENTICAR USUARIO
    // ==========================================

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('No autorizado - Token requerido', 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return errorResponse('Token inválido o expirado', 401, authError)
    }

    console.log('[cambiar-plan-stripe] Usuario autenticado:', user.id)

    // ==========================================
    // 4. PARSEAR Y VALIDAR REQUEST
    // ==========================================

    let body: RequestBody
    try {
      body = await req.json()
    } catch (error) {
      return errorResponse('Body JSON inválido', 400, error)
    }

    const { nuevo_plan_codigo, nuevo_periodo } = body

    if (!nuevo_plan_codigo || !nuevo_periodo) {
      return errorResponse('Parámetros requeridos: nuevo_plan_codigo, nuevo_periodo', 400)
    }

    console.log('[cambiar-plan-stripe] Solicitud de cambio:', {
      user_id: user.id,
      nuevo_plan_codigo,
      nuevo_periodo
    })

    // ==========================================
    // 5. OBTENER USUARIO DE BD
    // ==========================================

    const { data: usuarioData, error: usuarioError } = await supabase
      .from('Usuario')
      .select('id, email, nombre')
      .eq('auth_id', user.id)
      .single()

    if (usuarioError || !usuarioData) {
      return errorResponse('Usuario no encontrado en base de datos', 404, usuarioError)
    }

    auditoria.usuario_id = usuarioData.id

    // ==========================================
    // 6. OBTENER SUSCRIPCIÓN ACTUAL
    // ==========================================

    const { data: suscripcionActual, error: suscripcionError } = await supabase
      .from('Suscripcion')
      .select('*')
      .eq('usuario_id', usuarioData.id)
      .in('estado', ESTADOS_ACTIVOS)
      .single()

    if (suscripcionError || !suscripcionActual) {
      return errorResponse(
        'No tienes una suscripción activa. Por favor crea una suscripción primero.',
        404,
        suscripcionError
      )
    }

    const susc = suscripcionActual as SuscripcionActual

    // Guardar datos para auditoría
    auditoria.suscripcion_id = susc.id
    auditoria.plan_anterior = susc.plan
    auditoria.periodo_anterior = susc.periodo
    auditoria.precio_anterior = susc.precio

    console.log('[cambiar-plan-stripe] Suscripción actual:', {
      id: susc.id,
      plan: susc.plan,
      periodo: susc.periodo,
      precio: susc.precio,
      estado: susc.estado,
      stripe_subscription_id: susc.stripe_subscription_id
    })

    // ==========================================
    // 7. VALIDAR QUE TENGA STRIPE SUBSCRIPTION ID
    // ==========================================

    if (!susc.stripe_subscription_id) {
      return errorResponse(
        'Suscripción sin ID de Stripe. Contacta soporte.',
        400
      )
    }

    // ==========================================
    // 8. VALIDAR QUE NO SEA EL MISMO PLAN
    // ==========================================

    if (susc.plan === nuevo_plan_codigo && susc.periodo === nuevo_periodo) {
      return errorResponse(
        `Ya tienes el plan ${nuevo_plan_codigo} ${nuevo_periodo}. No hay cambios que aplicar.`,
        400
      )
    }

    // ==========================================
    // 9. VALIDAR NUEVO PLAN
    // ==========================================

    const moneda = susc.moneda as 'COP' | 'USD'
    const validacion = validarPlan(nuevo_plan_codigo, nuevo_periodo, moneda)

    if (!validacion.valido || validacion.precio === undefined) {
      return errorResponse('Plan o período inválido', 400)
    }

    const precioNuevo = validacion.precio

    auditoria.plan_nuevo = nuevo_plan_codigo
    auditoria.periodo_nuevo = nuevo_periodo
    auditoria.precio_nuevo = precioNuevo

    // ==========================================
    // 10. VALIDAR PLAN BÁSICO
    // ==========================================

    if (nuevo_plan_codigo === 'basico') {
      return errorResponse(
        'No puedes cambiar a plan básico. Para cancelar tu suscripción, usa la opción de cancelar.',
        400
      )
    }

    // ==========================================
    // 11. DETERMINAR TIPO DE CAMBIO
    // ==========================================

    const cambioEsUpgrade = esUpgrade(susc.precio, precioNuevo)
    auditoria.tipo_cambio = cambioEsUpgrade ? 'upgrade' : 'downgrade'

    console.log('[cambiar-plan-stripe] Tipo de cambio:', {
      tipo: auditoria.tipo_cambio,
      precio_actual: susc.precio,
      precio_nuevo: precioNuevo,
      diferencia: precioNuevo - susc.precio
    })

    // ==========================================
    // 12. OBTENER SUSCRIPCIÓN DE STRIPE
    // ==========================================

    let stripeSubscription: Stripe.Subscription
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(susc.stripe_subscription_id)
    } catch (error) {
      return errorResponse(
        'Error al obtener suscripción de Stripe. Verifica que esté activa.',
        500,
        error
      )
    }

    if (!stripeSubscription || stripeSubscription.status === 'canceled') {
      return errorResponse('La suscripción de Stripe está cancelada', 400)
    }

    if (stripeSubscription.items.data.length === 0) {
      return errorResponse('La suscripción de Stripe no tiene items', 400)
    }

    const subscriptionItemId = stripeSubscription.items.data[0].id

    console.log('[cambiar-plan-stripe] Stripe subscription:', {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
    })

    // ==========================================
    // 13. ACTUALIZAR SUSCRIPCIÓN EN STRIPE
    // ==========================================

    let updatedSubscription: Stripe.Subscription
    try {
      updatedSubscription = await stripe.subscriptions.update(
        susc.stripe_subscription_id,
        {
          items: [{
            id: subscriptionItemId,
            price_data: {
              currency: moneda.toLowerCase(),
              product_data: {
                name: `Plan ${nuevo_plan_codigo.charAt(0).toUpperCase() + nuevo_plan_codigo.slice(1)}`,
                description: `Suscripción ${nuevo_periodo} a Escuchodromo`
              },
              unit_amount: Math.round(precioNuevo * 100), // Stripe usa centavos
              recurring: {
                interval: nuevo_periodo === 'mensual' ? 'month' : 'year',
                interval_count: 1
              }
            }
          }],
          // UPGRADE: Prorrateo inmediato y nuevo período comienza ahora
          // DOWNGRADE: Sin prorrateo, cambio al final del período actual
          proration_behavior: cambioEsUpgrade ? 'create_prorations' : 'none',
          billing_cycle_anchor: cambioEsUpgrade ? 'now' : 'unchanged'
        }
      )

      console.log('[cambiar-plan-stripe] Suscripción actualizada en Stripe:', {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString()
      })

    } catch (error) {
      auditoria.exitoso = false
      auditoria.error = error instanceof Error ? error.message : 'Error desconocido en Stripe'
      await registrarAuditoria(supabase, auditoria)

      return errorResponse(
        'Error al actualizar suscripción en Stripe',
        500,
        error
      )
    }

    // ==========================================
    // 14. ACTUALIZAR SUSCRIPCIÓN EN BD
    // ==========================================

    const fechaFinNueva = new Date(updatedSubscription.current_period_end * 1000).toISOString()
    const fechaProximoPago = updatedSubscription.current_period_end
      ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
      : null

    const datosActualizacion: Record<string, unknown> = {
      plan: nuevo_plan_codigo,
      periodo: nuevo_periodo,
      precio: precioNuevo,
      fecha_fin: fechaFinNueva,
      fecha_proximo_pago: fechaProximoPago,
      actualizado_en: new Date().toISOString()
    }

    // Si es upgrade, el cambio es inmediato
    // Si es downgrade, marcar para cambiar al final del período
    if (!cambioEsUpgrade) {
      datosActualizacion.estado = 'cancelar_al_final'
      datosActualizacion.plan_pendiente = nuevo_plan_codigo
      datosActualizacion.periodo_pendiente = nuevo_periodo
    } else {
      // En upgrade, el cambio es inmediato
      datosActualizacion.estado = 'activa'
    }

    const { error: updateError } = await supabase
      .from('Suscripcion')
      .update(datosActualizacion)
      .eq('id', susc.id)

    if (updateError) {
      console.error('[cambiar-plan-stripe] Error al actualizar BD:', updateError)

      // Intentar revertir cambio en Stripe
      try {
        await stripe.subscriptions.update(susc.stripe_subscription_id, {
          items: [{
            id: subscriptionItemId,
            price_data: {
              currency: moneda.toLowerCase(),
              product_data: {
                name: `Plan ${susc.plan.charAt(0).toUpperCase() + susc.plan.slice(1)}`
              },
              unit_amount: Math.round(susc.precio * 100),
              recurring: {
                interval: susc.periodo === 'mensual' ? 'month' : 'year'
              }
            }
          }]
        })
        console.log('[cambiar-plan-stripe] Revertido cambio en Stripe')
      } catch (revertError) {
        console.error('[cambiar-plan-stripe] ERROR CRÍTICO: No se pudo revertir Stripe:', revertError)
      }

      auditoria.exitoso = false
      auditoria.error = updateError.message
      await registrarAuditoria(supabase, auditoria)

      return errorResponse(
        'Error al actualizar base de datos. El cambio fue revertido.',
        500,
        updateError
      )
    }

    // ==========================================
    // 15. REGISTRAR AUDITORÍA EXITOSA
    // ==========================================

    auditoria.exitoso = true
    await registrarAuditoria(supabase, auditoria)

    console.log('[cambiar-plan-stripe] Cambio exitoso:', {
      usuario_id: usuarioData.id,
      plan_anterior: susc.plan,
      plan_nuevo: nuevo_plan_codigo,
      tipo_cambio: auditoria.tipo_cambio,
      aplicacion: cambioEsUpgrade ? 'inmediata' : 'fin_periodo'
    })

    // ==========================================
    // 16. RESPUESTA EXITOSA
    // ==========================================

    return jsonResponse({
      success: true,
      mensaje: cambioEsUpgrade
        ? `Plan actualizado a ${nuevo_plan_codigo} ${nuevo_periodo}. El cambio es efectivo inmediatamente.`
        : `Plan cambiará a ${nuevo_plan_codigo} ${nuevo_periodo} al final del período actual (${new Date(fechaFinNueva).toLocaleDateString('es-CO')}).`,
      datos: {
        plan_anterior: susc.plan,
        periodo_anterior: susc.periodo,
        plan_nuevo: nuevo_plan_codigo,
        periodo_nuevo: nuevo_periodo,
        precio_nuevo: precioNuevo,
        moneda: moneda,
        tipo_cambio: auditoria.tipo_cambio,
        aplicacion: cambioEsUpgrade ? 'inmediata' : 'fin_periodo',
        fecha_efectiva: cambioEsUpgrade ? new Date().toISOString() : fechaFinNueva,
        fecha_proximo_pago: fechaProximoPago
      }
    }, 200)

  } catch (error) {
    console.error('[cambiar-plan-stripe] Error no controlado:', error)

    auditoria.exitoso = false
    auditoria.error = error instanceof Error ? error.message : 'Error desconocido'

    // Intentar registrar auditoría de error (puede fallar también)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await registrarAuditoria(supabase, auditoria)
    } catch (auditError) {
      console.error('[cambiar-plan-stripe] No se pudo registrar auditoría de error:', auditError)
    }

    return errorResponse(
      'Error inesperado al cambiar plan',
      500,
      error
    )
  }
})
