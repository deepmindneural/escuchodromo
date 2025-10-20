/**
 * Edge Function: Insights Dashboard
 *
 * Genera métricas en tiempo real para el dashboard del usuario:
 * - Evolución emocional
 * - Patrones de uso (horarios, frecuencia)
 * - Comparación de evaluaciones PHQ-9/GAD-7
 * - Temas recurrentes y palabras clave
 * - Tendencias de bienestar
 *
 * Cachea resultados con TTL de 1 hora
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { CORS_HEADERS, EVALUACIONES_CONFIG } from '../_shared/config.ts'

// ==========================================
// TIPOS
// ==========================================

interface InsightsDashboardRequest {
  usuario_id: string
  forzar_recalculo?: boolean
  periodo_dias?: number // Default: 30
}

interface InsightsDashboardResponse {
  usuario_id: string
  periodo_dias: number
  generado_en: string
  expira_en: string
  desde_cache: boolean

  // Métricas generales
  metricas_generales: {
    total_conversaciones: number
    total_mensajes: number
    promedio_mensajes_por_conversacion: number
    dias_activo: number
    ultima_actividad: string
  }

  // Evolución emocional
  evolucion_emocional: {
    emociones_dominantes: Record<string, number> // Promedio de cada emoción
    tendencia_bienestar: Array<{
      fecha: string
      score: number
    }>
    cambio_bienestar_porcentaje: number // Cambio desde inicio del período
  }

  // Evaluaciones psicológicas
  evaluaciones: {
    phq9: {
      ultima_puntuacion: number | null
      severidad: string | null
      fecha: string | null
      historial: Array<{
        fecha: string
        puntuacion: number
        severidad: string
      }>
      tendencia: 'mejorando' | 'estable' | 'empeorando' | 'sin_datos'
    }
    gad7: {
      ultima_puntuacion: number | null
      severidad: string | null
      fecha: string | null
      historial: Array<{
        fecha: string
        puntuacion: number
        severidad: string
      }>
      tendencia: 'mejorando' | 'estable' | 'empeorando' | 'sin_datos'
    }
  }

  // Patrones de uso
  patrones_uso: {
    horarios_mas_activos: Array<{
      hora: number
      cantidad_mensajes: number
    }>
    dias_semana_mas_activos: Array<{
      dia: string
      cantidad_conversaciones: number
    }>
    duracion_promedio_conversacion_minutos: number
  }

  // Temas y palabras clave
  temas_recurrentes: Array<{
    tema: string
    frecuencia: number
  }>
  palabras_clave: Array<{
    palabra: string
    frecuencia: number
  }>

  // Alertas y crisis
  alertas: {
    total_alertas: number
    alertas_criticas: number
    ultima_alerta: string | null
    estado_actual: 'seguro' | 'observacion' | 'atencion_requerida'
  }
}

// ==========================================
// SERVIDOR
// ==========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parsear request
    const {
      usuario_id,
      forzar_recalculo = false,
      periodo_dias = 30
    }: InsightsDashboardRequest = await req.json()

    if (!usuario_id) {
      return new Response(
        JSON.stringify({ error: 'usuario_id requerido' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    console.log(`[insights-dashboard] Generando insights para usuario ${usuario_id}`)

    // Verificar si hay cache válido
    if (!forzar_recalculo) {
      const { data: cacheExistente } = await supabase
        .from('InsightDashboard')
        .select('*')
        .eq('usuario_id', usuario_id)
        .eq('periodo_dias', periodo_dias)
        .gte('expira_en', new Date().toISOString())
        .order('generado_en', { ascending: false })
        .limit(1)
        .single()

      if (cacheExistente) {
        console.log('[insights-dashboard] Retornando desde cache')
        return new Response(
          JSON.stringify({
            ...cacheExistente.insights,
            desde_cache: true
          }),
          { status: 200, headers: CORS_HEADERS }
        )
      }
    }

    // Calcular fecha de inicio del período
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - periodo_dias)

    // ==========================================
    // 1. MÉTRICAS GENERALES
    // ==========================================

    const { data: conversaciones } = await supabase
      .from('Conversacion')
      .select('id, creado_en, actualizado_en')
      .eq('usuario_id', usuario_id)
      .gte('creado_en', fechaInicio.toISOString())

    const totalConversaciones = conversaciones?.length || 0

    const { count: totalMensajes } = await supabase
      .from('Mensaje')
      .select('id', { count: 'exact', head: true })
      .in('conversacion_id', conversaciones?.map(c => c.id) || [])

    const { data: usuario } = await supabase
      .from('Usuario')
      .select('creado_en')
      .eq('id', usuario_id)
      .single()

    const diasActivo = usuario
      ? Math.floor((Date.now() - new Date(usuario.creado_en).getTime()) / 86400000)
      : 0

    const metricas_generales = {
      total_conversaciones: totalConversaciones,
      total_mensajes: totalMensajes || 0,
      promedio_mensajes_por_conversacion: totalConversaciones > 0
        ? Math.round((totalMensajes || 0) / totalConversaciones)
        : 0,
      dias_activo: diasActivo,
      ultima_actividad: conversaciones?.[conversaciones.length - 1]?.actualizado_en || ''
    }

    // ==========================================
    // 2. EVOLUCIÓN EMOCIONAL
    // ==========================================

    const { data: analisisConversaciones } = await supabase
      .from('AnalisisConversacion')
      .select('emociones_dominantes, score_bienestar, creado_en')
      .eq('conversacion_id', conversaciones?.map(c => c.id) || [])
      .gte('creado_en', fechaInicio.toISOString())
      .order('creado_en', { ascending: true })

    // Calcular emociones dominantes promedio
    const emocionesAcumuladas: Record<string, number[]> = {}

    analisisConversaciones?.forEach(analisis => {
      if (analisis.emociones_dominantes) {
        Object.entries(analisis.emociones_dominantes).forEach(([emocion, valor]) => {
          if (!emocionesAcumuladas[emocion]) {
            emocionesAcumuladas[emocion] = []
          }
          emocionesAcumuladas[emocion].push(valor as number)
        })
      }
    })

    const emociones_dominantes: Record<string, number> = {}
    Object.entries(emocionesAcumuladas).forEach(([emocion, valores]) => {
      emociones_dominantes[emocion] = valores.reduce((a, b) => a + b, 0) / valores.length
    })

    // Tendencia de bienestar
    const tendencia_bienestar = analisisConversaciones
      ?.filter(a => a.score_bienestar !== null)
      .map(a => ({
        fecha: a.creado_en,
        score: a.score_bienestar
      })) || []

    // Calcular cambio de bienestar
    let cambio_bienestar_porcentaje = 0
    if (tendencia_bienestar.length >= 2) {
      const primerScore = tendencia_bienestar[0].score
      const ultimoScore = tendencia_bienestar[tendencia_bienestar.length - 1].score
      cambio_bienestar_porcentaje = ((ultimoScore - primerScore) / primerScore) * 100
    }

    const evolucion_emocional = {
      emociones_dominantes,
      tendencia_bienestar,
      cambio_bienestar_porcentaje: Math.round(cambio_bienestar_porcentaje)
    }

    // ==========================================
    // 3. EVALUACIONES PSICOLÓGICAS
    // ==========================================

    const { data: resultadosEvaluaciones } = await supabase
      .from('Resultado')
      .select(`
        id,
        prueba_id,
        puntuacion,
        severidad,
        creado_en,
        Prueba!inner (codigo)
      `)
      .eq('usuario_id', usuario_id)
      .gte('creado_en', fechaInicio.toISOString())
      .order('creado_en', { ascending: true })

    // PHQ-9
    const resultadosPHQ9 = resultadosEvaluaciones?.filter(
      r => r.Prueba.codigo === EVALUACIONES_CONFIG.codigoPHQ9
    ) || []

    const phq9_ultimo = resultadosPHQ9[resultadosPHQ9.length - 1]
    const phq9_historial = resultadosPHQ9.map(r => ({
      fecha: r.creado_en,
      puntuacion: r.puntuacion,
      severidad: r.severidad
    }))

    let phq9_tendencia: 'mejorando' | 'estable' | 'empeorando' | 'sin_datos' = 'sin_datos'
    if (resultadosPHQ9.length >= 2) {
      const primerPHQ9 = resultadosPHQ9[0].puntuacion
      const ultimoPHQ9 = resultadosPHQ9[resultadosPHQ9.length - 1].puntuacion
      const cambio = ultimoPHQ9 - primerPHQ9

      if (cambio < -2) phq9_tendencia = 'mejorando'
      else if (cambio > 2) phq9_tendencia = 'empeorando'
      else phq9_tendencia = 'estable'
    }

    // GAD-7
    const resultadosGAD7 = resultadosEvaluaciones?.filter(
      r => r.Prueba.codigo === EVALUACIONES_CONFIG.codigoGAD7
    ) || []

    const gad7_ultimo = resultadosGAD7[resultadosGAD7.length - 1]
    const gad7_historial = resultadosGAD7.map(r => ({
      fecha: r.creado_en,
      puntuacion: r.puntuacion,
      severidad: r.severidad
    }))

    let gad7_tendencia: 'mejorando' | 'estable' | 'empeorando' | 'sin_datos' = 'sin_datos'
    if (resultadosGAD7.length >= 2) {
      const primerGAD7 = resultadosGAD7[0].puntuacion
      const ultimoGAD7 = resultadosGAD7[resultadosGAD7.length - 1].puntuacion
      const cambio = ultimoGAD7 - primerGAD7

      if (cambio < -2) gad7_tendencia = 'mejorando'
      else if (cambio > 2) gad7_tendencia = 'empeorando'
      else gad7_tendencia = 'estable'
    }

    const evaluaciones = {
      phq9: {
        ultima_puntuacion: phq9_ultimo?.puntuacion || null,
        severidad: phq9_ultimo?.severidad || null,
        fecha: phq9_ultimo?.creado_en || null,
        historial: phq9_historial,
        tendencia: phq9_tendencia
      },
      gad7: {
        ultima_puntuacion: gad7_ultimo?.puntuacion || null,
        severidad: gad7_ultimo?.severidad || null,
        fecha: gad7_ultimo?.creado_en || null,
        historial: gad7_historial,
        tendencia: gad7_tendencia
      }
    }

    // ==========================================
    // 4. PATRONES DE USO
    // ==========================================

    // Obtener todos los mensajes para análisis de patrones
    const { data: mensajes } = await supabase
      .from('Mensaje')
      .select('creado_en, conversacion_id')
      .in('conversacion_id', conversaciones?.map(c => c.id) || [])

    // Horarios más activos
    const horariosContador: Record<number, number> = {}
    mensajes?.forEach(msg => {
      const hora = new Date(msg.creado_en).getHours()
      horariosContador[hora] = (horariosContador[hora] || 0) + 1
    })

    const horarios_mas_activos = Object.entries(horariosContador)
      .map(([hora, cantidad]) => ({
        hora: parseInt(hora),
        cantidad_mensajes: cantidad
      }))
      .sort((a, b) => b.cantidad_mensajes - a.cantidad_mensajes)
      .slice(0, 5)

    // Días de la semana más activos
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const diasContador: Record<string, number> = {}

    conversaciones?.forEach(conv => {
      const dia = diasSemana[new Date(conv.creado_en).getDay()]
      diasContador[dia] = (diasContador[dia] || 0) + 1
    })

    const dias_semana_mas_activos = Object.entries(diasContador)
      .map(([dia, cantidad]) => ({
        dia,
        cantidad_conversaciones: cantidad
      }))
      .sort((a, b) => b.cantidad_conversaciones - a.cantidad_conversaciones)

    // Duración promedio de conversación
    let duracion_promedio_conversacion_minutos = 0
    if (conversaciones && conversaciones.length > 0) {
      const duraciones = conversaciones
        .filter(c => c.actualizado_en !== c.creado_en)
        .map(c => {
          const inicio = new Date(c.creado_en).getTime()
          const fin = new Date(c.actualizado_en).getTime()
          return (fin - inicio) / 60000 // minutos
        })

      if (duraciones.length > 0) {
        duracion_promedio_conversacion_minutos = Math.round(
          duraciones.reduce((a, b) => a + b, 0) / duraciones.length
        )
      }
    }

    const patrones_uso = {
      horarios_mas_activos,
      dias_semana_mas_activos,
      duracion_promedio_conversacion_minutos
    }

    // ==========================================
    // 5. TEMAS Y PALABRAS CLAVE
    // ==========================================

    // Agregar todos los temas recurrentes de los análisis
    const temasContador: Record<string, number> = {}
    const palabrasContador: Record<string, number> = {}

    analisisConversaciones?.forEach(analisis => {
      if (analisis.temas_recurrentes) {
        analisis.temas_recurrentes.forEach((tema: string) => {
          temasContador[tema] = (temasContador[tema] || 0) + 1
        })
      }
      if (analisis.palabras_clave) {
        analisis.palabras_clave.forEach((palabra: string) => {
          palabrasContador[palabra] = (palabrasContador[palabra] || 0) + 1
        })
      }
    })

    const temas_recurrentes = Object.entries(temasContador)
      .map(([tema, frecuencia]) => ({ tema, frecuencia }))
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, 10)

    const palabras_clave = Object.entries(palabrasContador)
      .map(([palabra, frecuencia]) => ({ palabra, frecuencia }))
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, 20)

    // ==========================================
    // 6. ALERTAS Y CRISIS
    // ==========================================

    const { data: alertas } = await supabase
      .from('AlertaUrgente')
      .select('id, nivel_urgencia, creado_en')
      .eq('usuario_id', usuario_id)
      .gte('creado_en', fechaInicio.toISOString())
      .order('creado_en', { ascending: false })

    const total_alertas = alertas?.length || 0
    const alertas_criticas = alertas?.filter(a => a.nivel_urgencia === 'critico').length || 0
    const ultima_alerta = alertas?.[0]?.creado_en || null

    // Determinar estado actual basado en análisis reciente y alertas
    let estado_actual: 'seguro' | 'observacion' | 'atencion_requerida' = 'seguro'

    if (alertas_criticas > 0) {
      estado_actual = 'atencion_requerida'
    } else if (total_alertas > 0 || (phq9_ultimo && phq9_ultimo.puntuacion > 15)) {
      estado_actual = 'observacion'
    }

    const alertasInfo = {
      total_alertas,
      alertas_criticas,
      ultima_alerta,
      estado_actual
    }

    // ==========================================
    // 7. CONSTRUIR RESPUESTA
    // ==========================================

    const ahora = new Date()
    const expira = new Date(ahora.getTime() + 60 * 60 * 1000) // 1 hora

    const insights: InsightsDashboardResponse = {
      usuario_id,
      periodo_dias,
      generado_en: ahora.toISOString(),
      expira_en: expira.toISOString(),
      desde_cache: false,
      metricas_generales,
      evolucion_emocional,
      evaluaciones,
      patrones_uso,
      temas_recurrentes,
      palabras_clave,
      alertas: alertasInfo
    }

    // ==========================================
    // 8. GUARDAR EN CACHE
    // ==========================================

    await supabase
      .from('InsightDashboard')
      .insert({
        usuario_id,
        periodo_dias,
        insights,
        expira_en: expira.toISOString()
      })

    console.log('[insights-dashboard] Insights generados y cacheados exitosamente')

    return new Response(
      JSON.stringify(insights),
      { status: 200, headers: CORS_HEADERS }
    )

  } catch (error) {
    console.error('[insights-dashboard] Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Error generando insights',
        usuario_id: null,
        periodo_dias: 0,
        generado_en: new Date().toISOString(),
        expira_en: new Date().toISOString(),
        desde_cache: false
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
