import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

interface RequestBody {
  plan: 'basico' | 'premium' | 'profesional'
  periodo: 'mensual' | 'anual'
  moneda?: 'COP' | 'USD'
}

// Precios por plan
const PRECIOS = {
  basico: {
    mensual: { COP: 0, USD: 0 },
    anual: { COP: 0, USD: 0 }
  },
  premium: {
    mensual: { COP: 49900, USD: 12 },
    anual: { COP: 479000, USD: 115 } // 20% descuento
  },
  profesional: {
    mensual: { COP: 99900, USD: 24 },
    anual: { COP: 959000, USD: 230 } // 20% descuento
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no configurada. Por favor configura la variable de entorno en Supabase.')
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Obtener usuario de la base de datos
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('Usuario')
      .select('id, email, nombre')
      .eq('auth_id', user.id)
      .single()

    if (usuarioError || !usuarioData) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Parsear request
    const body: RequestBody = await req.json()
    const { plan, periodo, moneda = 'COP' } = body

    console.log('[crear-checkout-stripe] Creando sesión:', {
      usuario_id: usuarioData.id,
      plan,
      periodo,
      moneda
    })

    // Validar plan
    if (!['basico', 'premium', 'profesional'].includes(plan)) {
      return new Response(
        JSON.stringify({ error: 'Plan inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Plan básico es gratis
    if (plan === 'basico') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'El plan básico es gratuito',
          redirect_url: '/dashboard'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Obtener precio
    const precio = PRECIOS[plan][periodo][moneda]

    // Crear o recuperar cliente de Stripe
    let stripeClienteId: string

    const { data: suscripcionExistente } = await supabase
      .from('Suscripcion')
      .select('stripe_cliente_id')
      .eq('usuario_id', usuarioData.id)
      .not('stripe_cliente_id', 'is', null)
      .limit(1)
      .single()

    if (suscripcionExistente?.stripe_cliente_id) {
      stripeClienteId = suscripcionExistente.stripe_cliente_id
    } else {
      const customer = await stripe.customers.create({
        email: usuarioData.email,
        name: usuarioData.nombre,
        metadata: {
          usuario_id: usuarioData.id
        }
      })
      stripeClienteId = customer.id
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeClienteId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: moneda.toLowerCase(),
            product_data: {
              name: `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
              description: `Suscripción ${periodo} a Escuchodromo`,
            },
            unit_amount: precio * 100, // Stripe usa centavos
            recurring: {
              interval: periodo === 'mensual' ? 'month' : 'year',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/pago/confirmacion?sesion_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/precios`,
      metadata: {
        usuario_id: usuarioData.id,
        plan,
        periodo,
        moneda
      }
    })

    // Guardar registro pendiente en la base de datos
    await supabase
      .from('Pago')
      .insert({
        usuario_id: usuarioData.id,
        stripe_sesion_id: session.id,
        monto: precio,
        moneda,
        estado: 'pendiente',
        metodo_pago: 'tarjeta',
        descripcion: `Pago de suscripción ${plan} ${periodo}`
      })

    console.log('[crear-checkout-stripe] Sesión creada:', session.id)

    return new Response(
      JSON.stringify({
        session_id: session.id,
        checkout_url: session.url
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('[crear-checkout-stripe] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error al crear sesión de pago',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
