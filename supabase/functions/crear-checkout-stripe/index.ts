import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

// ✅ SEGURIDAD: CORS restrictivo - Solo orígenes permitidos
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://escuchodromo.com',
  'https://www.escuchodromo.com',
  'https://escuchodromo.vercel.app'
]

// ✅ SEGURIDAD: Rate limiting
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 3   // 3 intentos por minuto

interface DatosFacturacion {
  nombre: string
  email: string
  telefono?: string
  pais: string
  ciudad: string
  direccion: string
  codigoPostal?: string
}

interface RequestBody {
  plan: string // Código del plan (basico, premium, terapeuta_inicial, etc.)
  periodo: 'mensual' | 'anual'
  moneda?: 'COP' | 'USD'
  tipo_usuario?: 'paciente' | 'profesional'
  datosFacturacion?: DatosFacturacion
}

serve(async (req) => {
  // ✅ SEGURIDAD: Validar origen permitido
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
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
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin } }
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
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin } }
      )
    }

    // ✅ SEGURIDAD: Rate limiting - Verificar intentos recientes de pago
    const { data: recentCheckouts, error: rateLimitError } = await supabase
      .from('Pago')
      .select('id, creado_en')
      .eq('usuario_id', usuarioData.id)
      .eq('estado', 'pendiente')
      .gte('creado_en', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())
      .order('creado_en', { ascending: false })

    if (!rateLimitError && recentCheckouts && recentCheckouts.length >= RATE_LIMIT_MAX_REQUESTS) {
      console.warn('[crear-checkout-stripe] Rate limit excedido:', {
        usuario_hash: usuarioData.id.substring(0, 8) + '***',
        intentos: recentCheckouts.length,
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({
          error: 'Demasiados intentos de pago. Por favor intenta en 1 minuto.',
          retry_after: 60,
          codigo: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString(),
            'Access-Control-Allow-Origin': allowedOrigin
          }
        }
      )
    }

    // Parsear request
    const body: RequestBody = await req.json()
    const { plan: planCodigo, periodo, moneda = 'COP', tipo_usuario = 'paciente', datosFacturacion } = body

    console.log('[crear-checkout-stripe] Creando sesión:', {
      usuario_id: usuarioData.id,
      plan: planCodigo,
      periodo,
      moneda,
      tipo_usuario,
      tiene_datos_facturacion: !!datosFacturacion
    })

    // Buscar plan en la base de datos
    const { data: planData, error: planError } = await supabase
      .from('Plan')
      .select('*')
      .eq('codigo', planCodigo)
      .eq('esta_activo', true)
      .single()

    if (planError || !planData) {
      console.error('[crear-checkout-stripe] Plan no encontrado:', planError)
      return new Response(
        JSON.stringify({
          error: 'Plan no encontrado',
          codigo: planCodigo,
          detalles: planError?.message
        }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin } }
      )
    }

    // Obtener precio según periodo
    const precio = periodo === 'mensual' ? planData.precio_mensual : planData.precio_anual

    // Plan gratuito
    if (precio === 0) {
      // Crear suscripción gratuita directamente
      const fechaInicio = new Date()
      const fechaFin = new Date()
      fechaFin.setFullYear(fechaFin.getFullYear() + 10) // 10 años de acceso

      await supabase.from('Suscripcion').insert({
        usuario_id: usuarioData.id,
        plan: planCodigo,
        periodo: periodo,
        estado: 'activa',
        precio: 0,
        moneda: moneda,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        cancelar_al_final: false,
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Plan gratuito activado',
          redirect_url: tipo_usuario === 'profesional' ? '/profesional/dashboard' : '/dashboard'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin } }
      )
    }

    // Verificar que el precio sea válido
    if (!precio || precio <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Precio inválido para el plan seleccionado',
          plan: planCodigo,
          periodo
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin } }
      )
    }

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
      // Crear cliente de Stripe con datos de facturación completos
      const customerData: Stripe.CustomerCreateParams = {
        email: datosFacturacion?.email || usuarioData.email,
        name: datosFacturacion?.nombre || usuarioData.nombre,
        metadata: {
          usuario_id: usuarioData.id
        }
      }

      // Agregar dirección de facturación si está disponible
      if (datosFacturacion) {
        customerData.address = {
          line1: datosFacturacion.direccion,
          city: datosFacturacion.ciudad,
          postal_code: datosFacturacion.codigoPostal || '',
          country: datosFacturacion.pais
        }
        if (datosFacturacion.telefono) {
          customerData.phone = datosFacturacion.telefono
        }
      }

      const customer = await stripe.customers.create(customerData)
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
              name: planData.nombre,
              description: `Suscripción ${periodo} - ${planData.descripcion || 'Escuchodromo'}`,
            },
            unit_amount: Math.round(precio * 100), // Stripe usa centavos
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
      cancel_url: `${req.headers.get('origin')}/${tipo_usuario === 'profesional' ? 'profesional/planes' : 'precios'}`,
      metadata: {
        usuario_id: usuarioData.id,
        plan: planCodigo,
        periodo,
        moneda,
        tipo_usuario
      }
    })

    // Guardar registro pendiente en la base de datos con datos de facturación
    await supabase
      .from('Pago')
      .insert({
        usuario_id: usuarioData.id,
        stripe_sesion_id: session.id,
        stripe_pago_id: null, // Se actualizará en el webhook
        monto: precio,
        moneda,
        estado: 'pendiente',
        metodo_pago: 'tarjeta',
        descripcion: `Pago de suscripción ${planData.nombre} ${periodo}`,
        metadata: {
          plan: planCodigo,
          periodo,
          tipo_usuario,
          stripe_customer_id: stripeClienteId,
          datos_facturacion: datosFacturacion || null
        }
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
          'Access-Control-Allow-Origin': allowedOrigin
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
          'Access-Control-Allow-Origin': allowedOrigin
        }
      }
    )
  }
})
