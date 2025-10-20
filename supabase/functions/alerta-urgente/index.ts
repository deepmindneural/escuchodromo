/**
 * Edge Function: Gestión de Alertas Urgentes
 *
 * Funcionalidades:
 * - Crear notificaciones para profesionales y admins
 * - Enviar email/SMS si está configurado
 * - Actualizar estado de alertas
 * - Registrar acciones tomadas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { CORS_HEADERS } from '../_shared/config.ts'

// ==========================================
// TIPOS
// ==========================================

interface AlertaUrgenteRequest {
  alerta_id?: string
  accion?: 'notificar' | 'actualizar_estado' | 'asignar_profesional'
  nuevo_estado?: 'pendiente' | 'en_revision' | 'gestionada' | 'cerrada'
  profesional_asignado_id?: string
  notas?: string
}

interface AlertaUrgenteResponse {
  alerta: any
  notificaciones_creadas: number
  emails_enviados: number
  sms_enviados: number
  acciones: string[]
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
      alerta_id,
      accion = 'notificar',
      nuevo_estado,
      profesional_asignado_id,
      notas
    }: AlertaUrgenteRequest = await req.json()

    if (!alerta_id) {
      return new Response(
        JSON.stringify({ error: 'alerta_id requerido' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    console.log(`[alerta-urgente] Procesando alerta ${alerta_id} - Acción: ${accion}`)

    // Obtener datos de la alerta
    const { data: alerta, error: errorAlerta } = await supabase
      .from('AlertaUrgente')
      .select(`
        *,
        Usuario (id, nombre, email, telefono),
        AnalisisConversacion (
          emociones_dominantes,
          score_bienestar,
          resumen_clinico
        )
      `)
      .eq('id', alerta_id)
      .single()

    if (errorAlerta || !alerta) {
      return new Response(
        JSON.stringify({ error: 'Alerta no encontrada' }),
        { status: 404, headers: CORS_HEADERS }
      )
    }

    let notificaciones_creadas = 0
    let emails_enviados = 0
    let sms_enviados = 0
    const acciones: string[] = []

    // ==========================================
    // ACCIÓN: NOTIFICAR
    // ==========================================

    if (accion === 'notificar') {
      // Obtener todos los profesionales y admins
      const { data: profesionales } = await supabase
        .from('Usuario')
        .select('id, nombre, email, telefono, preferencias_notificacion')
        .in('rol', ['TERAPEUTA', 'ADMIN'])
        .eq('activo', true)

      if (profesionales && profesionales.length > 0) {
        // Crear notificaciones en la base de datos
        const notificaciones = profesionales.map(profesional => ({
          usuario_id: profesional.id,
          tipo: 'push',
          titulo: `⚠️ Alerta Urgente - ${alerta.nivel_urgencia.toUpperCase()}`,
          contenido: `${alerta.titulo}\n\nNivel: ${alerta.nivel_urgencia}\nUsuario: ${alerta.Usuario?.nombre || 'Anónimo'}\n\n${alerta.descripcion}`,
          metadata: {
            alerta_id: alerta.id,
            tipo_alerta: alerta.tipo_alerta,
            nivel_urgencia: alerta.nivel_urgencia,
            usuario_afectado_id: alerta.usuario_id,
            score_bienestar: alerta.AnalisisConversacion?.[0]?.score_bienestar
          },
          leida: false,
          enviada: false
        }))

        const { data: notificacionesCreadas, error: errorNotificaciones } = await supabase
          .from('Notificacion')
          .insert(notificaciones)
          .select()

        if (!errorNotificaciones && notificacionesCreadas) {
          notificaciones_creadas = notificacionesCreadas.length
          acciones.push(`Creadas ${notificaciones_creadas} notificaciones push`)
        }

        // Enviar emails si está habilitado
        for (const profesional of profesionales) {
          const preferencias = profesional.preferencias_notificacion || {}

          if (preferencias.email_alertas_criticas && profesional.email) {
            try {
              // Aquí se integraría con servicio de email (Resend, SendGrid, etc.)
              // Por ahora, solo registramos la intención
              console.log(`[alerta-urgente] Email programado para: ${profesional.email}`)

              // Crear notificación de email
              await supabase
                .from('Notificacion')
                .insert({
                  usuario_id: profesional.id,
                  tipo: 'email',
                  titulo: `Alerta Urgente - ${alerta.nivel_urgencia}`,
                  contenido: generarContenidoEmail(alerta),
                  leida: false,
                  enviada: false
                })

              emails_enviados++
            } catch (error) {
              console.error(`[alerta-urgente] Error al enviar email:`, error)
            }
          }

          // Enviar SMS si está habilitado y es crítico
          if (
            preferencias.sms_alertas_criticas &&
            alerta.nivel_urgencia === 'critico' &&
            profesional.telefono
          ) {
            try {
              // Aquí se integraría con servicio de SMS (Twilio, etc.)
              console.log(`[alerta-urgente] SMS programado para: ${profesional.telefono}`)

              // Crear notificación de SMS
              await supabase
                .from('Notificacion')
                .insert({
                  usuario_id: profesional.id,
                  tipo: 'sms',
                  titulo: 'Alerta Crítica',
                  contenido: `ALERTA CRÍTICA - ${alerta.titulo}. Revisar dashboard inmediatamente.`,
                  leida: false,
                  enviada: false
                })

              sms_enviados++
            } catch (error) {
              console.error(`[alerta-urgente] Error al enviar SMS:`, error)
            }
          }
        }

        if (emails_enviados > 0) {
          acciones.push(`Programados ${emails_enviados} emails`)
        }
        if (sms_enviados > 0) {
          acciones.push(`Programados ${sms_enviados} SMS`)
        }
      }

      // Actualizar alerta con timestamp de notificación
      await supabase
        .from('AlertaUrgente')
        .update({
          notificada_en: new Date().toISOString(),
          estado: 'en_revision'
        })
        .eq('id', alerta_id)

      acciones.push('Alerta marcada como notificada')
    }

    // ==========================================
    // ACCIÓN: ACTUALIZAR ESTADO
    // ==========================================

    if (accion === 'actualizar_estado' && nuevo_estado) {
      const actualizacion: any = {
        estado: nuevo_estado
      }

      if (nuevo_estado === 'gestionada') {
        actualizacion.gestionada_en = new Date().toISOString()
      }

      if (notas) {
        actualizacion.notas_gestion = notas
      }

      await supabase
        .from('AlertaUrgente')
        .update(actualizacion)
        .eq('id', alerta_id)

      acciones.push(`Estado actualizado a: ${nuevo_estado}`)

      // Si se cerró la alerta, crear notificación de confirmación
      if (nuevo_estado === 'cerrada' && alerta.usuario_id) {
        await supabase
          .from('Notificacion')
          .insert({
            usuario_id: alerta.usuario_id,
            tipo: 'push',
            titulo: 'Seguimiento completado',
            contenido: 'El equipo de profesionales ha completado el seguimiento de tu alerta. Estamos aquí para apoyarte.',
            leida: false,
            enviada: false
          })

        acciones.push('Notificación de cierre enviada al usuario')
      }
    }

    // ==========================================
    // ACCIÓN: ASIGNAR PROFESIONAL
    // ==========================================

    if (accion === 'asignar_profesional' && profesional_asignado_id) {
      await supabase
        .from('AlertaUrgente')
        .update({
          profesional_asignado_id,
          estado: 'en_revision'
        })
        .eq('id', alerta_id)

      // Notificar al profesional asignado
      await supabase
        .from('Notificacion')
        .insert({
          usuario_id: profesional_asignado_id,
          tipo: 'push',
          titulo: 'Alerta asignada a ti',
          contenido: `Se te ha asignado la alerta: ${alerta.titulo}\n\nNivel: ${alerta.nivel_urgencia}\nUsuario: ${alerta.Usuario?.nombre || 'Anónimo'}`,
          metadata: {
            alerta_id: alerta.id
          },
          leida: false,
          enviada: false
        })

      acciones.push(`Alerta asignada al profesional ID: ${profesional_asignado_id}`)
    }

    // ==========================================
    // OBTENER ALERTA ACTUALIZADA
    // ==========================================

    const { data: alertaActualizada } = await supabase
      .from('AlertaUrgente')
      .select(`
        *,
        Usuario (id, nombre, email),
        AnalisisConversacion (
          emociones_dominantes,
          score_bienestar,
          resumen_clinico
        )
      `)
      .eq('id', alerta_id)
      .single()

    // ==========================================
    // RESPUESTA
    // ==========================================

    const response: AlertaUrgenteResponse = {
      alerta: alertaActualizada || alerta,
      notificaciones_creadas,
      emails_enviados,
      sms_enviados,
      acciones
    }

    console.log(`[alerta-urgente] Procesamiento completado. Acciones: ${acciones.join(', ')}`)

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: CORS_HEADERS }
    )

  } catch (error) {
    console.error('[alerta-urgente] Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Error procesando alerta',
        alerta: null,
        notificaciones_creadas: 0,
        emails_enviados: 0,
        sms_enviados: 0,
        acciones: []
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function generarContenidoEmail(alerta: any): string {
  const usuario = alerta.Usuario?.nombre || 'Usuario anónimo'
  const analisis = alerta.AnalisisConversacion?.[0]

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .alert-info { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Alerta Urgente - ${alerta.nivel_urgencia.toUpperCase()}</h1>
  </div>

  <div class="content">
    <h2>${alerta.titulo}</h2>

    <div class="alert-info">
      <p><strong>Usuario:</strong> ${usuario}</p>
      <p><strong>Tipo de alerta:</strong> ${alerta.tipo_alerta}</p>
      <p><strong>Nivel de urgencia:</strong> ${alerta.nivel_urgencia}</p>
      <p><strong>Fecha:</strong> ${new Date(alerta.creado_en).toLocaleString('es-ES')}</p>
    </div>

    <h3>Descripción</h3>
    <p>${alerta.descripcion}</p>

    ${alerta.senales_detectadas && alerta.senales_detectadas.length > 0 ? `
    <h3>Señales detectadas</h3>
    <ul>
      ${alerta.senales_detectadas.map((senal: string) => `<li>${senal}</li>`).join('')}
    </ul>
    ` : ''}

    ${analisis ? `
    <h3>Análisis de IA</h3>
    <p><strong>Score de bienestar:</strong> ${analisis.score_bienestar}/100</p>
    <p><strong>Resumen clínico:</strong></p>
    <p>${analisis.resumen_clinico}</p>
    ` : ''}

    <p style="margin-top: 30px;">
      <strong>Acción requerida:</strong> Por favor, revisa esta alerta en el dashboard lo antes posible y toma las acciones necesarias.
    </p>
  </div>

  <div class="footer">
    <p>Este es un correo automático del sistema de alertas de Escuchodromo.</p>
    <p>No respondas a este correo. Accede al dashboard para gestionar la alerta.</p>
  </div>
</body>
</html>
  `.trim()
}
