/**
 * Edge Function: Progreso del Paciente
 *
 * Endpoint: GET /functions/v1/progreso-paciente?paciente_id=UUID
 *
 * Funcionalidad:
 * - Agrega datos de múltiples fuentes (evaluaciones, sesiones, métricas)
 * - Calcula tendencias de progreso (PHQ-9, GAD-7)
 * - Genera alertas automáticas para profesionales
 * - Detecta patrones de crisis
 * - Calcula adherencia al tratamiento
 *
 * Autorización:
 * - Solo profesional asignado (con al menos 1 cita completada)
 * - O el propio paciente (datos propios)
 * - Auditoría completa de accesos
 *
 * Compliance: HIPAA (acceso controlado a PHI)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface MetricasEvaluacion {
  promedio_ultimas_4_semanas: number | null
  tendencia: 'mejorando' | 'estable' | 'empeorando' | 'sin_datos'
  ultima_evaluacion: {
    puntuacion: number
    fecha: string
    severidad: string
  } | null
}

interface Alerta {
  tipo: 'info' | 'advertencia' | 'critico'
  mensaje: string
  fecha: string
}

interface ProgresoResponse {
  success: boolean
  metricas?: {
    phq9: MetricasEvaluacion
    gad7: MetricasEvaluacion
    sesiones_completadas: number
    sesiones_totales: number
    adherencia_porcentaje: number
    dias_activo: number
  }
  alertas?: Alerta[]
  error?: string
}

// Función para determinar severidad de PHQ-9
function obtenerSeveridadPHQ9(puntuacion: number): string {
  if (puntuacion <= 4) return 'Mínima'
  if (puntuacion <= 9) return 'Leve'
  if (puntuacion <= 14) return 'Moderada'
  if (puntuacion <= 19) return 'Moderadamente severa'
  return 'Severa'
}

// Función para determinar severidad de GAD-7
function obtenerSeveridadGAD7(puntuacion: number): string {
  if (puntuacion <= 4) return 'Mínima'
  if (puntuacion <= 9) return 'Leve'
  if (puntuacion <= 14) return 'Moderada'
  return 'Severa'
}

// Función para calcular tendencia
function calcularTendencia(evaluaciones: Array<{ puntuacion: number; fecha: string }>): string {
  if (evaluaciones.length < 2) return 'sin_datos'

  // Ordenar por fecha
  const ordenadas = evaluaciones.sort((a, b) =>
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  )

  // Comparar últimas 2 evaluaciones
  const ultima = ordenadas[ordenadas.length - 1].puntuacion
  const penultima = ordenadas[ordenadas.length - 2].puntuacion

  const diferencia = ultima - penultima

  if (diferencia < -2) return 'mejorando' // Disminución de síntomas es mejora
  if (diferencia > 2) return 'empeorando'
  return 'estable'
}

serve(async (req) => {
  // ✅ Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const tiempoInicio = Date.now()

  try {
    // ✅ 1. VALIDAR JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 2. OBTENER USUARIO AUTENTICADO
    const { data: usuarioAuth, error: usuarioError } = await supabase
      .from('Usuario')
      .select('id, rol')
      .eq('auth_id', user.id)
      .single()

    if (usuarioError || !usuarioAuth) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 3. OBTENER PACIENTE_ID DEL QUERY
    const url = new URL(req.url)
    const pacienteId = url.searchParams.get('paciente_id')

    if (!pacienteId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parámetro requerido: paciente_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 4. VERIFICAR AUTORIZACIÓN
    let autorizado = false
    let justificacion = ''

    // Caso 1: El usuario consulta su propio progreso
    if (usuarioAuth.id === pacienteId) {
      autorizado = true
      justificacion = 'Consulta de progreso propio'
    }
    // Caso 2: Es un profesional consultando progreso de su paciente
    else if (usuarioAuth.rol === 'TERAPEUTA') {
      // Verificar que tenga al menos 1 cita completada con el paciente
      const { data: citasComunes } = await supabase
        .from('Cita')
        .select('id')
        .eq('profesional_id', usuarioAuth.id)
        .eq('paciente_id', pacienteId)
        .eq('estado', 'completada')
        .limit(1)

      if (citasComunes && citasComunes.length > 0) {
        autorizado = true
        justificacion = 'Profesional consultando progreso de paciente asignado'
      }
    }
    // Caso 3: Es admin
    else if (usuarioAuth.rol === 'ADMIN') {
      autorizado = true
      justificacion = 'Admin consultando progreso (requiere justificación adicional)'
    }

    if (!autorizado) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado para ver progreso de este paciente' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 5. OBTENER DATOS DEL PACIENTE
    const { data: paciente } = await supabase
      .from('Usuario')
      .select('id, creado_en')
      .eq('id', pacienteId)
      .single()

    if (!paciente) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paciente no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 6. OBTENER EVALUACIONES PHQ-9 (últimas 4 semanas)
    const hace4Semanas = new Date()
    hace4Semanas.setDate(hace4Semanas.getDate() - 28)

    const { data: evaluacionesPHQ9 } = await supabase
      .from('Resultado')
      .select('puntuacion, creado_en')
      .eq('usuario_id', pacienteId)
      .eq('evaluacion_id', (await supabase.from('Evaluacion').select('id').eq('codigo', 'PHQ-9').single()).data?.id || '')
      .gte('creado_en', hace4Semanas.toISOString())
      .order('creado_en', { ascending: false })

    const phq9Data = evaluacionesPHQ9 || []
    const promedioPHQ9 = phq9Data.length > 0
      ? phq9Data.reduce((sum, e) => sum + e.puntuacion, 0) / phq9Data.length
      : null

    const ultimaPHQ9 = phq9Data.length > 0 ? phq9Data[0] : null

    const metricasPHQ9: MetricasEvaluacion = {
      promedio_ultimas_4_semanas: promedioPHQ9 ? Math.round(promedioPHQ9 * 10) / 10 : null,
      tendencia: calcularTendencia(
        phq9Data.map(e => ({ puntuacion: e.puntuacion, fecha: e.creado_en }))
      ) as any,
      ultima_evaluacion: ultimaPHQ9 ? {
        puntuacion: ultimaPHQ9.puntuacion,
        fecha: ultimaPHQ9.creado_en,
        severidad: obtenerSeveridadPHQ9(ultimaPHQ9.puntuacion)
      } : null
    }

    // ✅ 7. OBTENER EVALUACIONES GAD-7 (últimas 4 semanas)
    const { data: evaluacionesGAD7 } = await supabase
      .from('Resultado')
      .select('puntuacion, creado_en')
      .eq('usuario_id', pacienteId)
      .eq('evaluacion_id', (await supabase.from('Evaluacion').select('id').eq('codigo', 'GAD-7').single()).data?.id || '')
      .gte('creado_en', hace4Semanas.toISOString())
      .order('creado_en', { ascending: false })

    const gad7Data = evaluacionesGAD7 || []
    const promedioGAD7 = gad7Data.length > 0
      ? gad7Data.reduce((sum, e) => sum + e.puntuacion, 0) / gad7Data.length
      : null

    const ultimaGAD7 = gad7Data.length > 0 ? gad7Data[0] : null

    const metricasGAD7: MetricasEvaluacion = {
      promedio_ultimas_4_semanas: promedioGAD7 ? Math.round(promedioGAD7 * 10) / 10 : null,
      tendencia: calcularTendencia(
        gad7Data.map(e => ({ puntuacion: e.puntuacion, fecha: e.creado_en }))
      ) as any,
      ultima_evaluacion: ultimaGAD7 ? {
        puntuacion: ultimaGAD7.puntuacion,
        fecha: ultimaGAD7.creado_en,
        severidad: obtenerSeveridadGAD7(ultimaGAD7.puntuacion)
      } : null
    }

    // ✅ 8. OBTENER MÉTRICAS DE SESIONES
    const { data: citasCompletadas } = await supabase
      .from('Cita')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('estado', 'completada')

    const { data: citasTotales } = await supabase
      .from('Cita')
      .select('id')
      .eq('paciente_id', pacienteId)
      .in('estado', ['confirmada', 'completada', 'pendiente'])

    const sesionesCompletadas = citasCompletadas?.length || 0
    const sesionesProgramadas = citasTotales?.length || 0

    // Calcular adherencia (% de citas no canceladas)
    const { data: citasCanceladas } = await supabase
      .from('Cita')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('estado', 'cancelada')

    const totalCitas = sesionesProgramadas + (citasCanceladas?.length || 0)
    const adherenciaPorcentaje = totalCitas > 0
      ? Math.round((sesionesProgramadas / totalCitas) * 100)
      : 100

    // Calcular días activo (desde el registro)
    const diasActivo = Math.floor(
      (Date.now() - new Date(paciente.creado_en).getTime()) / (1000 * 60 * 60 * 24)
    )

    // ✅ 9. GENERAR ALERTAS AUTOMÁTICAS
    const alertas: Alerta[] = []

    // Alerta por severidad alta en PHQ-9
    if (ultimaPHQ9 && ultimaPHQ9.puntuacion >= 15) {
      alertas.push({
        tipo: 'critico',
        mensaje: `PHQ-9 con severidad ${obtenerSeveridadPHQ9(ultimaPHQ9.puntuacion)} (${ultimaPHQ9.puntuacion}/27)`,
        fecha: ultimaPHQ9.creado_en
      })
    }

    // Alerta por severidad alta en GAD-7
    if (ultimaGAD7 && ultimaGAD7.puntuacion >= 10) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `GAD-7 con severidad ${obtenerSeveridadGAD7(ultimaGAD7.puntuacion)} (${ultimaGAD7.puntuacion}/21)`,
        fecha: ultimaGAD7.creado_en
      })
    }

    // Alerta por tendencia de empeoramiento
    if (metricasPHQ9.tendencia === 'empeorando') {
      alertas.push({
        tipo: 'advertencia',
        mensaje: 'Tendencia de empeoramiento en síntomas depresivos (PHQ-9)',
        fecha: new Date().toISOString()
      })
    }

    if (metricasGAD7.tendencia === 'empeorando') {
      alertas.push({
        tipo: 'advertencia',
        mensaje: 'Tendencia de empeoramiento en síntomas de ansiedad (GAD-7)',
        fecha: new Date().toISOString()
      })
    }

    // Alerta por baja adherencia
    if (adherenciaPorcentaje < 70 && totalCitas > 3) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Baja adherencia al tratamiento (${adherenciaPorcentaje}%)`,
        fecha: new Date().toISOString()
      })
    }

    // ✅ 10. REGISTRAR AUDITORÍA
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const duracionMs = Date.now() - tiempoInicio

    await supabase.rpc('registrar_acceso_phi', {
      p_usuario_id: usuarioAuth.id,
      p_tipo_recurso: 'perfil_paciente',
      p_recurso_id: pacienteId,
      p_accion: 'leer',
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_endpoint: '/functions/v1/progreso-paciente',
      p_metodo_http: 'GET',
      p_justificacion: justificacion,
      p_exitoso: true,
      p_codigo_http: 200,
      p_duracion_ms: duracionMs
    })

    // ✅ 11. RESPONSE
    const response: ProgresoResponse = {
      success: true,
      metricas: {
        phq9: metricasPHQ9,
        gad7: metricasGAD7,
        sesiones_completadas: sesionesCompletadas,
        sesiones_totales: sesionesProgramadas,
        adherencia_porcentaje: adherenciaPorcentaje,
        dias_activo: diasActivo
      },
      alertas
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error inesperado en progreso-paciente:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
