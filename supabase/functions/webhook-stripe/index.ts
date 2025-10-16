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

    // Verificar firma del webhook
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
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
      console.error('Error verificando webhook:', err)
      return new Response('Firma inválida', { status: 400 })
    }

    console.log('[webhook-stripe] Evento recibido:', event.type)

    // Procesar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[webhook-stripe] Checkout completado:', session.id)

        const usuarioId = session.metadata?.usuario_id
        const plan = session.metadata?.plan
        const periodo = session.metadata?.periodo
        const moneda = session.metadata?.moneda || 'COP'

        if (!usuarioId || !plan || !periodo) {
          console.error('[webhook-stripe] Metadata incompleta')
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

    return new Response(
      JSON.stringify({ received: true }),
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
