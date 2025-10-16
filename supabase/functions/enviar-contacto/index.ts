import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  nombre: string
  email: string
  asunto: string
  mensaje: string
  tipo: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parsear request
    const body: RequestBody = await req.json()
    const { nombre, email, asunto, mensaje, tipo } = body

    console.log('[enviar-contacto] Request recibido:', {
      email,
      tipo,
      timestamp: new Date().toISOString()
    })

    // Validar datos
    if (!nombre || !email || !asunto || !mensaje) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Guardar en la base de datos (opcional - para registro)
    const { error: dbError } = await supabase
      .from('Contacto')
      .insert({
        nombre,
        email,
        asunto,
        mensaje,
        tipo,
        estado: 'pendiente',
        creado_en: new Date().toISOString()
      })

    if (dbError) {
      console.error('[enviar-contacto] Error al guardar en BD:', dbError)
      // No falla si no se puede guardar en BD, continúa con el envío del email
    }

    // TODO: Integrar con servicio de email (Resend, SendGrid, etc.)
    // Por ahora solo guardamos en BD y retornamos éxito

    // Ejemplo con Resend (descomentar cuando tengas la API key):
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Escuchodromo <contacto@escuchodromo.com>',
          to: ['soporte@escuchodromo.com'],
          subject: `[${tipo.toUpperCase()}] ${asunto}`,
          html: `
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Tipo:</strong> ${tipo}</p>
            <p><strong>Asunto:</strong> ${asunto}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${mensaje.replace(/\n/g, '<br>')}</p>
          `
        })
      })

      if (!emailResponse.ok) {
        console.error('[enviar-contacto] Error al enviar email')
      }
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensaje enviado correctamente. Te contactaremos pronto.'
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
    console.error('[enviar-contacto] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error al enviar el mensaje',
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
