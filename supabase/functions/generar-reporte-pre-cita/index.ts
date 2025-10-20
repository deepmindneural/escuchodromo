/**
 * Edge Function: Generar Reportes Pre-Cita (Automático)
 *
 * Función programada para ejecutarse diariamente.
 * Genera reportes para citas que ocurrirán en las próximas 24 horas.
 *
 * Funcionalidad:
 * - Busca citas programadas para las próximas 24 horas
 * - Genera reporte pre-cita para cada una
 * - Notifica al terapeuta con resumen
 *
 * Configuración recomendada:
 * - Ejecutar diariamente a las 8:00 AM
 * - Cron: 0 8 * * *
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { CORS_HEADERS } from '../_shared/config.ts'

// ==========================================
// TIPOS
// ==========================================

interface GenerarReportesPreCitaResponse {
  citas_procesadas: number
  reportes_generados: number
  reportes_fallidos: number
  citas: Array<{
    cita_id: string
    usuario_nombre: string
    terapeuta_nombre: string
    fecha_cita: string
    reporte_generado: boolean
    error?: string
  }>
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

    console.log('[generar-reporte-pre-cita] Iniciando generación de reportes pre-cita')

    // ==========================================
    // 1. BUSCAR CITAS EN LAS PRÓXIMAS 24 HORAS
    // ==========================================

    const ahora = new Date()
    const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)

    const { data: citasProximas, error: errorCitas } = await supabase
      .from('Cita')
      .select(`
        id,
        fecha,
        usuario_id,
        terapeuta_id,
        Usuario!Cita_usuario_id_fkey (nombre, email),
        Terapeuta:Usuario!Cita_terapeuta_id_fkey (nombre, email)
      `)
      .gte('fecha', ahora.toISOString())
      .lte('fecha', en24Horas.toISOString())
      .eq('estado', 'confirmada')
      .order('fecha', { ascending: true })

    if (errorCitas) {
      throw new Error(`Error al obtener citas: ${errorCitas.message}`)
    }

    if (!citasProximas || citasProximas.length === 0) {
      console.log('[generar-reporte-pre-cita] No hay citas próximas')
      return new Response(
        JSON.stringify({
          citas_procesadas: 0,
          reportes_generados: 0,
          reportes_fallidos: 0,
          citas: []
        }),
        { status: 200, headers: CORS_HEADERS }
      )
    }

    console.log(`[generar-reporte-pre-cita] Encontradas ${citasProximas.length} citas`)

    // ==========================================
    // 2. GENERAR REPORTES PARA CADA CITA
    // ==========================================

    let reportes_generados = 0
    let reportes_fallidos = 0
    const resultado_citas: Array<any> = []

    for (const cita of citasProximas) {
      try {
        console.log(`[generar-reporte-pre-cita] Procesando cita ${cita.id}`)

        // Verificar si ya existe reporte para esta cita
        const { data: reporteExistente } = await supabase
          .from('ReporteSemanal')
          .select('id')
          .eq('cita_id', cita.id)
          .single()

        if (reporteExistente) {
          console.log(`[generar-reporte-pre-cita] Reporte ya existe para cita ${cita.id}`)
          resultado_citas.push({
            cita_id: cita.id,
            usuario_nombre: cita.Usuario.nombre,
            terapeuta_nombre: cita.Terapeuta.nombre,
            fecha_cita: cita.fecha,
            reporte_generado: false,
            error: 'Reporte ya existe'
          })
          continue
        }

        // Llamar a la función generar-reporte-clinico
        const responseReporte = await fetch(
          `${supabaseUrl}/functions/v1/generar-reporte-clinico`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              usuario_id: cita.usuario_id,
              tipo_reporte: 'pre_cita',
              cita_id: cita.id
            })
          }
        )

        if (!responseReporte.ok) {
          const errorText = await responseReporte.text()
          throw new Error(`Error generando reporte: ${errorText}`)
        }

        const dataReporte = await responseReporte.json()

        console.log(`[generar-reporte-pre-cita] Reporte generado para cita ${cita.id}`)

        resultado_citas.push({
          cita_id: cita.id,
          usuario_nombre: cita.Usuario.nombre,
          terapeuta_nombre: cita.Terapeuta.nombre,
          fecha_cita: cita.fecha,
          reporte_generado: true,
          reporte_id: dataReporte.reporte?.id
        })

        reportes_generados++

        // Esperar 2 segundos entre reportes para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`[generar-reporte-pre-cita] Error procesando cita ${cita.id}:`, error)

        resultado_citas.push({
          cita_id: cita.id,
          usuario_nombre: cita.Usuario?.nombre || 'Desconocido',
          terapeuta_nombre: cita.Terapeuta?.nombre || 'Desconocido',
          fecha_cita: cita.fecha,
          reporte_generado: false,
          error: error.message
        })

        reportes_fallidos++
      }
    }

    // ==========================================
    // 3. RESPUESTA
    // ==========================================

    const response: GenerarReportesPreCitaResponse = {
      citas_procesadas: citasProximas.length,
      reportes_generados,
      reportes_fallidos,
      citas: resultado_citas
    }

    console.log(`[generar-reporte-pre-cita] Procesamiento completado: ${reportes_generados} generados, ${reportes_fallidos} fallidos`)

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: CORS_HEADERS }
    )

  } catch (error) {
    console.error('[generar-reporte-pre-cita] Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Error procesando reportes pre-cita',
        citas_procesadas: 0,
        reportes_generados: 0,
        reportes_fallidos: 0,
        citas: []
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
