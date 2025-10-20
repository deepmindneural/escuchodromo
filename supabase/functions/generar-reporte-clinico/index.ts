/**
 * Edge Function: Generar Reporte Clínico
 *
 * Genera reportes clínicos automáticos usando Gemini:
 * - Reportes semanales (últimos 7 días)
 * - Reportes mensuales (últimos 30 días)
 * - Reportes pre-cita (desde última cita)
 *
 * Incluye:
 * - Resumen de conversaciones
 * - Evolución emocional
 * - Cambios en evaluaciones
 * - Recomendaciones para profesional
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { GeminiClient } from '../_shared/gemini-client.ts'
import { construirPromptReporteSemanal, construirPromptReportePreCita } from '../_shared/prompts.ts'
import { CORS_HEADERS, EVALUACIONES_CONFIG } from '../_shared/config.ts'

// ==========================================
// TIPOS
// ==========================================

interface GenerarReporteRequest {
  usuario_id: string
  tipo_reporte: 'semanal' | 'mensual' | 'pre_cita'
  cita_id?: string // Requerido para tipo pre_cita
  dias_atras?: number // Opcional, sobrescribe el período por defecto
}

interface GenerarReporteResponse {
  reporte: any
  tipo: string
  generado_en: string
  notificacion_creada: boolean
}

interface ReporteGemini {
  resumen_ejecutivo: string
  conversaciones_analizadas: number
  total_mensajes: number
  estado_emocional_actual: string
  cambios_significativos: string[]
  evaluaciones_resumen: {
    phq9?: {
      puntuacion_actual: number
      cambio: string
    }
    gad7?: {
      puntuacion_actual: number
      cambio: string
    }
  }
  temas_principales: string[]
  recomendaciones_clinicas: string[]
  proximos_pasos: string[]
  nivel_atencion_requerida: 'bajo' | 'medio' | 'alto'
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
      tipo_reporte,
      cita_id,
      dias_atras
    }: GenerarReporteRequest = await req.json()

    if (!usuario_id || !tipo_reporte) {
      return new Response(
        JSON.stringify({ error: 'usuario_id y tipo_reporte son requeridos' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    if (tipo_reporte === 'pre_cita' && !cita_id) {
      return new Response(
        JSON.stringify({ error: 'cita_id requerido para reportes pre-cita' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    console.log(`[generar-reporte-clinico] Generando reporte ${tipo_reporte} para usuario ${usuario_id}`)

    // Determinar período
    let periodo_dias = dias_atras || (tipo_reporte === 'semanal' ? 7 : 30)
    let fecha_inicio = new Date()
    fecha_inicio.setDate(fecha_inicio.getDate() - periodo_dias)

    // Si es pre-cita, obtener fecha de última cita
    if (tipo_reporte === 'pre_cita' && cita_id) {
      const { data: cita } = await supabase
        .from('Cita')
        .select('fecha, terapeuta_id')
        .eq('id', cita_id)
        .single()

      if (cita) {
        // Buscar cita anterior
        const { data: citaAnterior } = await supabase
          .from('Cita')
          .select('fecha')
          .eq('usuario_id', usuario_id)
          .eq('terapeuta_id', cita.terapeuta_id)
          .lt('fecha', cita.fecha)
          .order('fecha', { ascending: false })
          .limit(1)
          .single()

        if (citaAnterior) {
          fecha_inicio = new Date(citaAnterior.fecha)
        }
      }
    }

    // ==========================================
    // 1. OBTENER DATOS DEL USUARIO
    // ==========================================

    const { data: usuario } = await supabase
      .from('Usuario')
      .select('nombre, email, rol')
      .eq('id', usuario_id)
      .single()

    // ==========================================
    // 2. OBTENER CONVERSACIONES DEL PERÍODO
    // ==========================================

    const { data: conversaciones } = await supabase
      .from('Conversacion')
      .select('id, creado_en, actualizado_en')
      .eq('usuario_id', usuario_id)
      .gte('creado_en', fecha_inicio.toISOString())
      .order('creado_en', { ascending: true })

    if (!conversaciones || conversaciones.length === 0) {
      return new Response(
        JSON.stringify({
          error: `No hay conversaciones en el período de ${periodo_dias} días`
        }),
        { status: 404, headers: CORS_HEADERS }
      )
    }

    // ==========================================
    // 3. OBTENER ANÁLISIS DE CONVERSACIONES
    // ==========================================

    const { data: analisisConversaciones } = await supabase
      .from('AnalisisConversacion')
      .select('*')
      .in('conversacion_id', conversaciones.map(c => c.id))
      .order('creado_en', { ascending: true })

    // ==========================================
    // 4. OBTENER EVALUACIONES DEL PERÍODO
    // ==========================================

    const { data: evaluaciones } = await supabase
      .from('Resultado')
      .select(`
        id,
        prueba_id,
        puntuacion,
        severidad,
        creado_en,
        Prueba!inner (codigo, nombre)
      `)
      .eq('usuario_id', usuario_id)
      .gte('creado_en', fecha_inicio.toISOString())
      .order('creado_en', { ascending: true })

    // Separar PHQ-9 y GAD-7
    const evaluacionesPHQ9 = evaluaciones?.filter(
      e => e.Prueba.codigo === EVALUACIONES_CONFIG.codigoPHQ9
    ) || []

    const evaluacionesGAD7 = evaluaciones?.filter(
      e => e.Prueba.codigo === EVALUACIONES_CONFIG.codigoGAD7
    ) || []

    // ==========================================
    // 5. OBTENER ALERTAS DEL PERÍODO
    // ==========================================

    const { data: alertas } = await supabase
      .from('AlertaUrgente')
      .select('*')
      .eq('usuario_id', usuario_id)
      .gte('creado_en', fecha_inicio.toISOString())
      .order('creado_en', { ascending: false })

    // ==========================================
    // 6. CONSTRUIR DATOS PARA PROMPT
    // ==========================================

    const datosReporte = {
      usuario: {
        nombre: usuario?.nombre || 'Usuario',
        periodo_dias
      },
      conversaciones: {
        total: conversaciones.length,
        analisis: analisisConversaciones || []
      },
      evaluaciones: {
        phq9: evaluacionesPHQ9,
        gad7: evaluacionesGAD7
      },
      alertas: alertas || [],
      fecha_inicio: fecha_inicio.toISOString(),
      fecha_fin: new Date().toISOString()
    }

    // ==========================================
    // 7. GENERAR REPORTE CON GEMINI
    // ==========================================

    const geminiCliente = new GeminiClient()

    let prompt = ''
    if (tipo_reporte === 'pre_cita') {
      prompt = construirPromptReportePreCita(datosReporte)
    } else {
      prompt = construirPromptReporteSemanal(datosReporte)
    }

    const respuestaGemini = await geminiCliente.llamar({
      prompt,
      tipo: 'reporte',
      usuario_id,
      funcion_origen: 'generar-reporte-clinico'
    })

    if (!respuestaGemini.exitoso) {
      throw new Error(respuestaGemini.error || 'Error al generar reporte')
    }

    // Parsear respuesta JSON
    const reporteIA = geminiCliente.parsearJSON<ReporteGemini>(respuestaGemini.respuesta)

    if (!reporteIA) {
      throw new Error('No se pudo parsear respuesta de Gemini')
    }

    // ==========================================
    // 8. GUARDAR REPORTE EN BASE DE DATOS
    // ==========================================

    let reporteGuardado: any = null

    if (tipo_reporte === 'mensual') {
      const { data } = await supabase
        .from('ReporteMensual')
        .insert({
          usuario_id,
          mes: new Date().getMonth() + 1,
          anio: new Date().getFullYear(),
          resumen_ejecutivo: reporteIA.resumen_ejecutivo,
          estado_emocional_promedio: reporteIA.estado_emocional_actual,
          cambios_significativos: reporteIA.cambios_significativos,
          temas_principales: reporteIA.temas_principales,
          evaluaciones_resumen: reporteIA.evaluaciones_resumen,
          recomendaciones_clinicas: reporteIA.recomendaciones_clinicas,
          proximos_pasos: reporteIA.proximos_pasos,
          nivel_atencion_requerida: reporteIA.nivel_atencion_requerida,
          total_conversaciones: conversaciones.length,
          total_mensajes: reporteIA.total_mensajes,
          total_alertas: alertas?.length || 0,
          generado_con_ia: true,
          modelo_usado: 'gemini-2.0-flash-exp',
          tokens_consumidos: respuestaGemini.tokens_usados
        })
        .select()
        .single()

      reporteGuardado = data
    } else {
      // Semanal o pre-cita
      const { data } = await supabase
        .from('ReporteSemanal')
        .insert({
          usuario_id,
          semana_inicio: fecha_inicio.toISOString(),
          semana_fin: new Date().toISOString(),
          resumen_ejecutivo: reporteIA.resumen_ejecutivo,
          estado_emocional_promedio: reporteIA.estado_emocional_actual,
          cambios_significativos: reporteIA.cambios_significativos,
          temas_principales: reporteIA.temas_principales,
          evaluaciones_resumen: reporteIA.evaluaciones_resumen,
          recomendaciones_clinicas: reporteIA.recomendaciones_clinicas,
          proximos_pasos: reporteIA.proximos_pasos,
          nivel_atencion_requerida: reporteIA.nivel_atencion_requerida,
          total_conversaciones: conversaciones.length,
          total_mensajes: reporteIA.total_mensajes,
          total_alertas: alertas?.length || 0,
          cita_id: tipo_reporte === 'pre_cita' ? cita_id : undefined,
          generado_con_ia: true,
          modelo_usado: 'gemini-2.0-flash-exp',
          tokens_consumidos: respuestaGemini.tokens_usados
        })
        .select()
        .single()

      reporteGuardado = data
    }

    console.log('[generar-reporte-clinico] Reporte guardado exitosamente')

    // ==========================================
    // 9. CREAR NOTIFICACIÓN PARA PROFESIONAL
    // ==========================================

    let notificacion_creada = false

    // Si es pre-cita, notificar al terapeuta
    if (tipo_reporte === 'pre_cita' && cita_id) {
      const { data: cita } = await supabase
        .from('Cita')
        .select('terapeuta_id')
        .eq('id', cita_id)
        .single()

      if (cita?.terapeuta_id) {
        await supabase
          .from('Notificacion')
          .insert({
            usuario_id: cita.terapeuta_id,
            tipo: 'push',
            titulo: 'Reporte pre-cita generado',
            contenido: `Reporte preparado para cita con ${usuario?.nombre}.\n\nNivel de atención: ${reporteIA.nivel_atencion_requerida}`,
            metadata: {
              reporte_id: reporteGuardado?.id,
              tipo_reporte,
              usuario_paciente_id: usuario_id,
              cita_id
            },
            leida: false,
            enviada: false
          })

        notificacion_creada = true
      }
    } else {
      // Para reportes semanales/mensuales, notificar a todos los profesionales asignados
      const { data: asignaciones } = await supabase
        .from('AsignacionUsuarioProfesional')
        .select('profesional_id')
        .eq('usuario_id', usuario_id)
        .eq('activo', true)

      if (asignaciones && asignaciones.length > 0) {
        const notificaciones = asignaciones.map(asig => ({
          usuario_id: asig.profesional_id,
          tipo: 'push',
          titulo: `Reporte ${tipo_reporte} disponible`,
          contenido: `Nuevo reporte ${tipo_reporte} de ${usuario?.nombre}.\n\nNivel de atención: ${reporteIA.nivel_atencion_requerida}`,
          metadata: {
            reporte_id: reporteGuardado?.id,
            tipo_reporte,
            usuario_paciente_id: usuario_id
          },
          leida: false,
          enviada: false
        }))

        await supabase
          .from('Notificacion')
          .insert(notificaciones)

        notificacion_creada = true
      }
    }

    // ==========================================
    // 10. RESPUESTA
    // ==========================================

    const response: GenerarReporteResponse = {
      reporte: reporteGuardado,
      tipo: tipo_reporte,
      generado_en: new Date().toISOString(),
      notificacion_creada
    }

    console.log(`[generar-reporte-clinico] Reporte ${tipo_reporte} completado`)

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: CORS_HEADERS }
    )

  } catch (error) {
    console.error('[generar-reporte-clinico] Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Error generando reporte',
        reporte: null,
        tipo: '',
        generado_en: new Date().toISOString(),
        notificacion_creada: false
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
