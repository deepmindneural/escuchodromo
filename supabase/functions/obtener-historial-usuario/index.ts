import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  usuario_id: string
  tipo?: 'evaluaciones' | 'conversaciones' | 'recomendaciones' | 'completo'
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
    // 1. Obtener credenciales
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 2. Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Verificar autenticación y rol admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Extraer token del header
    const token = authHeader.replace('Bearer ', '')

    // Verificar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Verificar rol de administrador
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('Usuario')
      .select('id, rol')
      .eq('auth_id', user.id)
      .single()

    if (usuarioError || !usuarioData || usuarioData.rol !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Se requiere rol de administrador.' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 4. Parsear request
    const body: RequestBody = await req.json()
    const { usuario_id, tipo = 'completo' } = body

    console.log('[obtener-historial-usuario] Request recibido:', {
      usuario_id,
      tipo,
      solicitado_por: usuarioData.id,
      timestamp: new Date().toISOString()
    })

    if (!usuario_id) {
      return new Response(
        JSON.stringify({ error: 'usuario_id es requerido' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 5. Verificar que el usuario existe
    const { data: usuarioObjetivo, error: usuarioObjetivoError } = await supabase
      .from('Usuario')
      .select('id, nombre, email, creado_en, actualizado_en')
      .eq('id', usuario_id)
      .single()

    if (usuarioObjetivoError || !usuarioObjetivo) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 6. Obtener historial según el tipo solicitado
    const resultado: any = {
      usuario: usuarioObjetivo
    }

    // Obtener evaluaciones (resultados de pruebas)
    if (tipo === 'evaluaciones' || tipo === 'completo') {
      const { data: evaluaciones, error: evaluacionesError } = await supabase
        .from('Resultado')
        .select(`
          id,
          puntuacion,
          severidad,
          interpretacion,
          creado_en,
          prueba_id,
          Prueba:prueba_id (codigo, nombre, categoria)
        `)
        .eq('usuario_id', usuario_id)
        .order('creado_en', { ascending: false })
        .limit(50)

      if (evaluacionesError) {
        console.error('[obtener-historial-usuario] Error al obtener evaluaciones:', evaluacionesError)
      }

      resultado.evaluaciones = evaluaciones || []
      resultado.total_evaluaciones = evaluaciones?.length || 0

      // Calcular estadísticas de evaluaciones
      if (evaluaciones && evaluaciones.length > 0) {
        const severidadesCount = evaluaciones.reduce((acc, ev) => {
          acc[ev.severidad] = (acc[ev.severidad] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        resultado.estadisticas_evaluaciones = {
          severidades: severidadesCount,
          puntuacion_promedio: evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / evaluaciones.length,
          ultima_evaluacion: evaluaciones[0]?.creado_en
        }
      }
    }

    // Obtener conversaciones
    if (tipo === 'conversaciones' || tipo === 'completo') {
      const { data: conversaciones, error: conversacionesError } = await supabase
        .from('Conversacion')
        .select(`
          id,
          titulo,
          creado_en,
          actualizado_en,
          Mensaje (
            id,
            contenido,
            rol,
            emociones,
            sentimiento,
            creado_en
          )
        `)
        .eq('usuario_id', usuario_id)
        .order('creado_en', { ascending: false })
        .limit(20)

      if (conversacionesError) {
        console.error('[obtener-historial-usuario] Error al obtener conversaciones:', conversacionesError)
      }

      resultado.conversaciones = conversaciones || []
      resultado.total_conversaciones = conversaciones?.length || 0

      // Calcular estadísticas de conversaciones
      if (conversaciones && conversaciones.length > 0) {
        let totalMensajes = 0
        let sentimientoPromedio = 0
        let contadorSentimiento = 0
        const emocionesAgregadas: Record<string, number> = {}

        conversaciones.forEach((conv: any) => {
          if (conv.Mensaje && Array.isArray(conv.Mensaje)) {
            totalMensajes += conv.Mensaje.length

            conv.Mensaje.forEach((msg: any) => {
              if (msg.sentimiento !== null && msg.sentimiento !== undefined) {
                sentimientoPromedio += msg.sentimiento
                contadorSentimiento++
              }

              if (msg.emociones) {
                Object.entries(msg.emociones).forEach(([emocion, valor]) => {
                  emocionesAgregadas[emocion] = (emocionesAgregadas[emocion] || 0) + (valor as number)
                })
              }
            })
          }
        })

        resultado.estadisticas_conversaciones = {
          total_mensajes: totalMensajes,
          sentimiento_promedio: contadorSentimiento > 0 ? sentimientoPromedio / contadorSentimiento : null,
          emociones_predominantes: Object.entries(emocionesAgregadas)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([emocion, valor]) => ({ emocion, valor })),
          ultima_conversacion: conversaciones[0]?.creado_en
        }
      }
    }

    // Obtener recomendaciones
    if (tipo === 'recomendaciones' || tipo === 'completo') {
      const { data: recomendaciones, error: recomendacionesError } = await supabase
        .from('Recomendacion')
        .select('*')
        .eq('usuario_id', usuario_id)
        .order('creado_en', { ascending: false })
        .limit(50)

      if (recomendacionesError) {
        console.error('[obtener-historial-usuario] Error al obtener recomendaciones:', recomendacionesError)
      }

      resultado.recomendaciones = recomendaciones || []
      resultado.total_recomendaciones = recomendaciones?.length || 0

      // Calcular estadísticas de recomendaciones
      if (recomendaciones && recomendaciones.length > 0) {
        const tiposCount = recomendaciones.reduce((acc, rec) => {
          acc[rec.tipo] = (acc[rec.tipo] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const activas = recomendaciones.filter(r => r.esta_activa).length
        const completadas = recomendaciones.filter(r => !r.esta_activa).length

        resultado.estadisticas_recomendaciones = {
          tipos: tiposCount,
          activas,
          completadas,
          tasa_completado: recomendaciones.length > 0 ? (completadas / recomendaciones.length) * 100 : 0,
          ultima_recomendacion: recomendaciones[0]?.creado_en
        }
      }
    }

    // 7. Retornar resultado
    return new Response(
      JSON.stringify(resultado),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('[obtener-historial-usuario] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error al obtener historial',
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
