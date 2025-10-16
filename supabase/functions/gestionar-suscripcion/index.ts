import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

interface RequestBody {
  accion: 'obtener' | 'cancelar' | 'reactivar'
  suscripcion_id?: string
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
      throw new Error('STRIPE_SECRET_KEY no configurada')
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

    // Obtener usuario
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('Usuario')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (usuarioError || !usuarioData) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const body: RequestBody = await req.json()
    const { accion, suscripcion_id } = body

    console.log('[gestionar-suscripcion] Acción:', accion, 'Usuario:', usuarioData.id)

    switch (accion) {
      case 'obtener': {
        // Obtener suscripción activa del usuario
        const { data: suscripcion, error } = await supabase
          .from('Suscripcion')
          .select('*')
          .eq('usuario_id', usuarioData.id)
          .in('estado', ['activa', 'vencida'])
          .order('creado_en', { ascending: false })
          .limit(1)
          .single()

        if (error || !suscripcion) {
          return new Response(
            JSON.stringify({
              suscripcion: null,
              tiene_suscripcion: false
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          )
        }

        // Si tiene stripe_suscripcion_id, obtener datos actualizados de Stripe
        let datoStripe = null
        if (suscripcion.stripe_suscripcion_id) {
          try {
            const stripeSuscripcion = await stripe.subscriptions.retrieve(
              suscripcion.stripe_suscripcion_id
            )
            datoStripe = {
              estado_stripe: stripeSuscripcion.status,
              proxima_factura: stripeSuscripcion.current_period_end * 1000,
              cancelar_al_final: stripeSuscripcion.cancel_at_period_end
            }
          } catch (err) {
            console.error('[gestionar-suscripcion] Error obteniendo datos de Stripe:', err)
          }
        }

        return new Response(
          JSON.stringify({
            suscripcion: {
              ...suscripcion,
              ...datoStripe
            },
            tiene_suscripcion: true
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      case 'cancelar': {
        if (!suscripcion_id) {
          return new Response(
            JSON.stringify({ error: 'suscripcion_id requerido' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // Verificar que la suscripción pertenece al usuario
        const { data: suscripcion, error } = await supabase
          .from('Suscripcion')
          .select('stripe_suscripcion_id, estado')
          .eq('id', suscripcion_id)
          .eq('usuario_id', usuarioData.id)
          .single()

        if (error || !suscripcion) {
          return new Response(
            JSON.stringify({ error: 'Suscripción no encontrada' }),
            { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        if (suscripcion.estado === 'cancelada') {
          return new Response(
            JSON.stringify({ error: 'La suscripción ya está cancelada' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // Cancelar en Stripe
        if (suscripcion.stripe_suscripcion_id) {
          await stripe.subscriptions.update(suscripcion.stripe_suscripcion_id, {
            cancel_at_period_end: true
          })
        }

        // Actualizar en base de datos (mantiene activa hasta el final del período)
        await supabase
          .from('Suscripcion')
          .update({
            cancelada_en: new Date().toISOString()
          })
          .eq('id', suscripcion_id)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Suscripción cancelada. Tendrás acceso hasta el final del período de facturación.'
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      case 'reactivar': {
        if (!suscripcion_id) {
          return new Response(
            JSON.stringify({ error: 'suscripcion_id requerido' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // Verificar suscripción
        const { data: suscripcion, error } = await supabase
          .from('Suscripcion')
          .select('stripe_suscripcion_id, cancelada_en')
          .eq('id', suscripcion_id)
          .eq('usuario_id', usuarioData.id)
          .single()

        if (error || !suscripcion) {
          return new Response(
            JSON.stringify({ error: 'Suscripción no encontrada' }),
            { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        if (!suscripcion.cancelada_en) {
          return new Response(
            JSON.stringify({ error: 'La suscripción no está cancelada' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // Reactivar en Stripe
        if (suscripcion.stripe_suscripcion_id) {
          await stripe.subscriptions.update(suscripcion.stripe_suscripcion_id, {
            cancel_at_period_end: false
          })
        }

        // Actualizar en base de datos
        await supabase
          .from('Suscripcion')
          .update({
            cancelada_en: null
          })
          .eq('id', suscripcion_id)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Suscripción reactivada exitosamente'
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Acción inválida' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
    }

  } catch (error) {
    console.error('[gestionar-suscripcion] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error gestionando suscripción',
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
