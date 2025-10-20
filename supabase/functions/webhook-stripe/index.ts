import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

serve(async (req) => {
  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe keys no configuradas')
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ✅ Verificar firma del webhook (SEGURIDAD CRÍTICA)
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('[webhook-stripe] Sin firma de Stripe')
      return new Response('Sin firma', { status: 400 })
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('[webhook-stripe] Error verificando webhook:', err)
      return new Response('Firma inválida', { status: 400 })
    }

    console.log('[webhook-stripe] Evento recibido:', event.type, event.id)

    // ✅ IDEMPOTENCIA: Registrar evento para evitar procesamiento duplicado
    try {
      await supabase.rpc('registrar_stripe_evento', {
        p_stripe_event_id: event.id,
        p_tipo_evento: event.type,
        p_datos_evento: event as any
      })
    } catch (err: any) {
      if (err.message && err.message.includes('ya procesado')) {
        console.log('[webhook-stripe] Evento ya procesado previamente:', event.id)
        return new Response(
          JSON.stringify({ received: true, message: 'Evento ya procesado' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      // Si es otro error, continuar (el evento se registrará de todos modos)
    }

    console.log('[webhook-stripe] Procesando evento:', event.type)

    // Procesar eventos
    let procesadoExitoso = true
    let errorMensaje: string | null = null

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          console.log('[webhook-stripe] Checkout completado:', session.id)

          const usuarioId = session.metadata?.usuario_id
          const tipoPago = session.metadata?.tipo // 'suscripcion' o 'cita'
          const moneda = session.metadata?.moneda || 'COP'

          if (!usuarioId) {
            console.error('[webhook-stripe] Metadata incompleta: falta usuario_id')
            errorMensaje = 'Metadata incompleta: falta usuario_id'
            procesadoExitoso = false
            break
          }

          // ✅ CASO 1: Pago de cita individual
          if (tipoPago === 'cita') {
            const citaId = session.metadata?.cita_id
            if (!citaId) {
              console.error('[webhook-stripe] Falta cita_id en metadata')
              errorMensaje = 'Falta cita_id en metadata'
              procesadoExitoso = false
              break
            }

            const paymentIntentId = session.payment_intent as string

            // Procesar pago de cita
            const { error: pagoCitaError } = await supabase.rpc('procesar_pago_cita', {
              p_cita_id: citaId,
              p_usuario_id: usuarioId,
              p_stripe_payment_intent_id: paymentIntentId,
              p_stripe_sesion_id: session.id,
              p_monto: session.amount_total! / 100,
              p_moneda: moneda,
              p_estado: 'completado'
            })

            if (pagoCitaError) {
              console.error('[webhook-stripe] Error procesando pago de cita:', pagoCitaError)
              errorMensaje = `Error procesando pago de cita: ${pagoCitaError.message}`
              procesadoExitoso = false
            } else {
              console.log('[webhook-stripe] Pago de cita procesado exitosamente:', citaId)
            }

            break
          }

          // ✅ CASO 2: Pago de suscripción (lógica original)
          const plan = session.metadata?.plan
          const periodo = session.metadata?.periodo

          if (!plan || !periodo) {
            console.error('[webhook-stripe] Metadata de suscripción incompleta')
            errorMensaje = 'Metadata de suscripción incompleta'
            procesadoExitoso = false
            break
          }

          // Obtener detalles de la suscripción
          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          // Crear o actualizar suscripción
          const { error: suscripcionError } = await supabase
            .from('Suscripcion')
            .insert({
              usuario_id: usuarioId,
              stripe_suscripcion_id: subscriptionId,
              stripe_cliente_id: session.customer as string,
              plan,
              estado: 'activa',
              precio: session.amount_total! / 100,
              moneda,
              periodo,
              fecha_inicio: new Date(subscription.current_period_start * 1000).toISOString(),
              fecha_renovacion: new Date(subscription.current_period_end * 1000).toISOString()
            })

          if (suscripcionError) {
            console.error('[webhook-stripe] Error creando suscripción:', suscripcionError)
            errorMensaje = `Error creando suscripción: ${suscripcionError.message}`
            procesadoExitoso = false
          }

          // Actualizar pago a completado
          await supabase
            .from('Pago')
            .update({
              estado: 'completado',
              fecha_pago: new Date().toISOString(),
              metadata: { stripe_subscription_id: subscriptionId }
            })
            .eq('stripe_sesion_id', session.id)

          console.log('[webhook-stripe] Suscripción creada exitosamente')
          break
        }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[webhook-stripe] Suscripción actualizada:', subscription.id)

        await supabase
          .from('Suscripcion')
          .update({
            estado: subscription.status === 'active' ? 'activa' :
                   subscription.status === 'canceled' ? 'cancelada' :
                   subscription.status === 'past_due' ? 'vencida' : 'pausada',
            fecha_renovacion: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_suscripcion_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[webhook-stripe] Suscripción cancelada:', subscription.id)

        await supabase
          .from('Suscripcion')
          .update({
            estado: 'cancelada',
            cancelada_en: new Date().toISOString(),
            fecha_fin: new Date().toISOString()
          })
          .eq('stripe_suscripcion_id', subscription.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[webhook-stripe] Pago de factura exitoso:', invoice.id)

        // Registrar pago recurrente
        const subscriptionId = invoice.subscription as string

        const { data: suscripcion } = await supabase
          .from('Suscripcion')
          .select('usuario_id, plan, periodo, moneda')
          .eq('stripe_suscripcion_id', subscriptionId)
          .single()

        if (suscripcion) {
          await supabase
            .from('Pago')
            .insert({
              usuario_id: suscripcion.usuario_id,
              stripe_pago_id: invoice.payment_intent as string,
              monto: invoice.amount_paid / 100,
              moneda: invoice.currency.toUpperCase(),
              estado: 'completado',
              metodo_pago: 'tarjeta',
              descripcion: `Renovación de suscripción ${suscripcion.plan}`,
              fecha_pago: new Date().toISOString(),
              metadata: {
                invoice_id: invoice.id,
                subscription_id: subscriptionId
              }
            })
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[webhook-stripe] Pago de factura fallido:', invoice.id)

        const subscriptionId = invoice.subscription as string

        await supabase
          .from('Suscripcion')
          .update({
            estado: 'vencida'
          })
          .eq('stripe_suscripcion_id', subscriptionId)

        break
      }

        default:
          console.log('[webhook-stripe] Evento no manejado:', event.type)
      }
    } catch (processingError: any) {
      console.error('[webhook-stripe] Error procesando evento:', processingError)
      procesadoExitoso = false
      errorMensaje = processingError.message || 'Error desconocido al procesar evento'
    }

    // ✅ Marcar evento como procesado en la base de datos
    await supabase.rpc('marcar_stripe_evento_procesado', {
      p_stripe_event_id: event.id,
      p_exitoso: procesadoExitoso,
      p_error_mensaje: errorMensaje
    })

    return new Response(
      JSON.stringify({ received: true, procesado: procesadoExitoso }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[webhook-stripe] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error procesando webhook',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
