/**
 * Edge Function: Batch Reportes Semanales (Automático)
 *
 * Función programada para ejecutarse cada lunes a las 6:00 AM.
 * Genera reportes semanales para todos los usuarios activos.
 *
 * Funcionalidad:
 * - Identifica usuarios activos (con conversaciones en últimos 7 días)
 * - Genera reporte semanal para cada uno
 * - Rate limiting: máximo 10 reportes en paralelo
 * - Logging de progreso y errores
 * - Notifica a profesionales asignados
 *
 * Configuración recomendada:
 * - Ejecutar todos los lunes a las 6:00 AM
 * - Cron: 0 6 * * 1
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { CORS_HEADERS } from '../_shared/config.ts'

// ==========================================
// CONFIGURACIÓN
// ==========================================

const MAX_PARALELO = 10 // Máximo de reportes generándose simultáneamente
const DELAY_ENTRE_LOTES = 3000 // 3 segundos entre lotes

// ==========================================
// TIPOS
// ==========================================

interface BatchReportesResponse {
  total_usuarios_activos: number
  reportes_generados: number
  reportes_fallidos: number
  reportes_omitidos: number
  tiempo_ejecucion_ms: number
  usuarios: Array<{
    usuario_id: string
    nombre: string
    reporte_generado: boolean
    reporte_id?: string
    error?: string
    razon_omision?: string
  }>
}

// ==========================================
// SERVIDOR
// ==========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const tiempoInicio = Date.now()

  try {
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[batch-reportes-semanales] Iniciando generación de reportes semanales')

    // ==========================================
    // 1. IDENTIFICAR USUARIOS ACTIVOS
    // ==========================================

    const hace7Dias = new Date()
    hace7Dias.setDate(hace7Dias.getDate() - 7)

    // Obtener conversaciones de los últimos 7 días
    const { data: conversacionesRecientes } = await supabase
      .from('Conversacion')
      .select('usuario_id')
      .gte('creado_en', hace7Dias.toISOString())
      .order('creado_en', { ascending: false })

    if (!conversacionesRecientes || conversacionesRecientes.length === 0) {
      console.log('[batch-reportes-semanales] No hay usuarios activos en la última semana')
      return new Response(
        JSON.stringify({
          total_usuarios_activos: 0,
          reportes_generados: 0,
          reportes_fallidos: 0,
          reportes_omitidos: 0,
          tiempo_ejecucion_ms: Date.now() - tiempoInicio,
          usuarios: []
        }),
        { status: 200, headers: CORS_HEADERS }
      )
    }

    // Obtener IDs únicos de usuarios activos
    const usuariosActivosIds = [...new Set(conversacionesRecientes.map(c => c.usuario_id))]

    console.log(`[batch-reportes-semanales] ${usuariosActivosIds.length} usuarios activos encontrados`)

    // Obtener datos de usuarios
    const { data: usuariosActivos } = await supabase
      .from('Usuario')
      .select('id, nombre, email, activo')
      .in('id', usuariosActivosIds)
      .eq('activo', true)

    if (!usuariosActivos || usuariosActivos.length === 0) {
      console.log('[batch-reportes-semanales] No hay usuarios activos válidos')
      return new Response(
        JSON.stringify({
          total_usuarios_activos: 0,
          reportes_generados: 0,
          reportes_fallidos: 0,
          reportes_omitidos: 0,
          tiempo_ejecucion_ms: Date.now() - tiempoInicio,
          usuarios: []
        }),
        { status: 200, headers: CORS_HEADERS }
      )
    }

    console.log(`[batch-reportes-semanales] Generando reportes para ${usuariosActivos.length} usuarios`)

    // ==========================================
    // 2. GENERAR REPORTES EN LOTES
    // ==========================================

    let reportes_generados = 0
    let reportes_fallidos = 0
    let reportes_omitidos = 0
    const resultado_usuarios: Array<any> = []

    // Procesar en lotes de MAX_PARALELO usuarios
    for (let i = 0; i < usuariosActivos.length; i += MAX_PARALELO) {
      const lote = usuariosActivos.slice(i, i + MAX_PARALELO)

      console.log(
        `[batch-reportes-semanales] Procesando lote ${Math.floor(i / MAX_PARALELO) + 1}/${Math.ceil(usuariosActivos.length / MAX_PARALELO)}`
      )

      // Generar reportes en paralelo para este lote
      const promesas = lote.map(async (usuario) => {
        try {
          // Verificar si ya existe reporte semanal para esta semana
          const inicioSemana = new Date(hace7Dias)
          inicioSemana.setHours(0, 0, 0, 0)

          const { data: reporteExistente } = await supabase
            .from('ReporteSemanal')
            .select('id')
            .eq('usuario_id', usuario.id)
            .gte('semana_inicio', inicioSemana.toISOString())
            .single()

          if (reporteExistente) {
            console.log(`[batch-reportes-semanales] Reporte ya existe para usuario ${usuario.id}`)
            return {
              usuario_id: usuario.id,
              nombre: usuario.nombre,
              reporte_generado: false,
              razon_omision: 'Reporte ya existe para esta semana'
            }
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
                usuario_id: usuario.id,
                tipo_reporte: 'semanal'
              })
            }
          )

          if (!responseReporte.ok) {
            const errorText = await responseReporte.text()
            throw new Error(`Error generando reporte: ${errorText}`)
          }

          const dataReporte = await responseReporte.json()

          console.log(`[batch-reportes-semanales] Reporte generado para usuario ${usuario.id}`)

          return {
            usuario_id: usuario.id,
            nombre: usuario.nombre,
            reporte_generado: true,
            reporte_id: dataReporte.reporte?.id
          }

        } catch (error) {
          console.error(`[batch-reportes-semanales] Error procesando usuario ${usuario.id}:`, error)

          return {
            usuario_id: usuario.id,
            nombre: usuario.nombre,
            reporte_generado: false,
            error: error.message
          }
        }
      })

      // Esperar a que se completen todos los reportes del lote
      const resultadosLote = await Promise.all(promesas)

      // Contar resultados
      resultadosLote.forEach(resultado => {
        resultado_usuarios.push(resultado)

        if (resultado.reporte_generado) {
          reportes_generados++
        } else if (resultado.razon_omision) {
          reportes_omitidos++
        } else {
          reportes_fallidos++
        }
      })

      // Esperar antes del siguiente lote (excepto en el último)
      if (i + MAX_PARALELO < usuariosActivos.length) {
        console.log(`[batch-reportes-semanales] Esperando ${DELAY_ENTRE_LOTES}ms antes del siguiente lote...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_LOTES))
      }
    }

    // ==========================================
    // 3. CREAR NOTIFICACIÓN RESUMEN PARA ADMINS
    // ==========================================

    try {
      const { data: admins } = await supabase
        .from('Usuario')
        .select('id')
        .eq('rol', 'ADMIN')
        .eq('activo', true)

      if (admins && admins.length > 0) {
        const notificaciones = admins.map(admin => ({
          usuario_id: admin.id,
          tipo: 'push',
          titulo: 'Reportes semanales generados',
          contenido: `Generación completada:\n✅ ${reportes_generados} exitosos\n❌ ${reportes_fallidos} fallidos\n⏭️ ${reportes_omitidos} omitidos`,
          metadata: {
            total_usuarios: usuariosActivos.length,
            reportes_generados,
            reportes_fallidos,
            reportes_omitidos
          },
          leida: false,
          enviada: false
        }))

        await supabase
          .from('Notificacion')
          .insert(notificaciones)
      }
    } catch (error) {
      console.error('[batch-reportes-semanales] Error creando notificación admin:', error)
    }

    // ==========================================
    // 4. RESPUESTA
    // ==========================================

    const tiempoTotal = Date.now() - tiempoInicio

    const response: BatchReportesResponse = {
      total_usuarios_activos: usuariosActivos.length,
      reportes_generados,
      reportes_fallidos,
      reportes_omitidos,
      tiempo_ejecucion_ms: tiempoTotal,
      usuarios: resultado_usuarios
    }

    console.log(
      `[batch-reportes-semanales] Completado en ${tiempoTotal}ms: ${reportes_generados} generados, ${reportes_fallidos} fallidos, ${reportes_omitidos} omitidos`
    )

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: CORS_HEADERS }
    )

  } catch (error) {
    console.error('[batch-reportes-semanales] Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Error procesando reportes semanales',
        total_usuarios_activos: 0,
        reportes_generados: 0,
        reportes_fallidos: 0,
        reportes_omitidos: 0,
        tiempo_ejecucion_ms: Date.now() - tiempoInicio,
        usuarios: []
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
