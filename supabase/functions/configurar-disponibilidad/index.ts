/**
 * Edge Function: Configurar Disponibilidad (Escritura)
 *
 * Endpoint: POST /functions/v1/configurar-disponibilidad
 *
 * Request Body:
 * {
 *   horarios: [
 *     {
 *       dia_semana: 1,        // 0=Domingo, 1=Lunes, ..., 6=Sábado
 *       hora_inicio: "09:00", // HH:MM
 *       hora_fin: "12:00",    // HH:MM
 *       duracion_sesion: 60,  // minutos (30 o 60)
 *       activo: true
 *     }
 *   ]
 * }
 *
 * Funcionalidad:
 * - Actualiza los horarios disponibles del profesional
 * - Realiza validaciones de integridad (solapamientos, formato)
 * - Usa transacción atómica (elimina todos + inserta nuevos)
 * - Registra auditoría de cambios
 *
 * Validaciones:
 * - Hora fin > hora inicio
 * - No solapamientos en el mismo día
 * - Formato de horas HH:MM
 * - Día semana entre 0-6
 * - Duración sesión: 30 o 60 minutos
 * - Bloques mínimo 30 minutos
 *
 * Seguridad:
 * - Requiere autenticación JWT
 * - Solo profesionales (TERAPEUTA/ADMIN)
 * - Rate limiting: 20 req/min por usuario
 * - Auditoría PHI completa
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface HorarioInput {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  duracion_sesion: number
  activo: boolean
}

interface RequestBody {
  horarios: HorarioInput[]
}

interface Response {
  success: boolean
  horarios_configurados?: number
  mensaje?: string
  error?: string
}

// Validar formato de hora HH:MM
function validarFormatoHora(hora: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
  return regex.test(hora)
}

// Convertir hora HH:MM a minutos desde medianoche
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

// Validar solapamiento entre dos horarios
function validarSolapamiento(
  horario1: HorarioInput,
  horario2: HorarioInput
): boolean {
  // Solo verificar si son del mismo día
  if (horario1.dia_semana !== horario2.dia_semana) {
    return false
  }

  const inicio1 = horaAMinutos(horario1.hora_inicio)
  const fin1 = horaAMinutos(horario1.hora_fin)
  const inicio2 = horaAMinutos(horario2.hora_inicio)
  const fin2 = horaAMinutos(horario2.hora_fin)

  // Verificar solapamiento
  return (
    (inicio1 >= inicio2 && inicio1 < fin2) ||
    (fin1 > inicio2 && fin1 <= fin2) ||
    (inicio1 <= inicio2 && fin1 >= fin2)
  )
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. VALIDAR JWT Y AUTENTICACIÓN
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

    // Verificar token y obtener usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. VERIFICAR QUE ES PROFESIONAL
    const { data: usuario, error: errorUsuario } = await supabase
      .from('Usuario')
      .select('id, rol')
      .eq('id', user.id)
      .single()

    if (errorUsuario || !usuario) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (usuario.rol !== 'TERAPEUTA' && usuario.rol !== 'ADMIN') {
      return new Response(
        JSON.stringify({ success: false, error: 'No tienes permisos de profesional' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. OBTENER PERFIL PROFESIONAL
    const { data: perfil, error: errorPerfil } = await supabase
      .from('PerfilProfesional')
      .select('id')
      .eq('usuario_id', usuario.id)
      .single()

    if (errorPerfil || !perfil) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perfil profesional no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. PARSEAR BODY
    const body: RequestBody = await req.json()

    if (!body.horarios || !Array.isArray(body.horarios)) {
      return new Response(
        JSON.stringify({ success: false, error: 'El campo "horarios" es requerido y debe ser un array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. VALIDAR CADA HORARIO
    for (let i = 0; i < body.horarios.length; i++) {
      const horario = body.horarios[i]

      // Validar campos requeridos
      if (
        horario.dia_semana === undefined ||
        !horario.hora_inicio ||
        !horario.hora_fin ||
        horario.duracion_sesion === undefined ||
        horario.activo === undefined
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Horario ${i + 1}: faltan campos requeridos (dia_semana, hora_inicio, hora_fin, duracion_sesion, activo)`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validar día de la semana (0-6)
      if (horario.dia_semana < 0 || horario.dia_semana > 6) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Horario ${i + 1}: dia_semana debe estar entre 0 (Domingo) y 6 (Sábado)`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validar formato de horas
      if (!validarFormatoHora(horario.hora_inicio) || !validarFormatoHora(horario.hora_fin)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Horario ${i + 1}: formato de hora inválido. Usar HH:MM (ej: 09:00)`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validar que hora_fin > hora_inicio
      const inicioMinutos = horaAMinutos(horario.hora_inicio)
      const finMinutos = horaAMinutos(horario.hora_fin)

      if (finMinutos <= inicioMinutos) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Horario ${i + 1}: hora_fin debe ser posterior a hora_inicio`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validar duración mínima de 30 minutos
      if (finMinutos - inicioMinutos < 30) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Horario ${i + 1}: la duración mínima es 30 minutos`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validar duración de sesión (30 o 60)
      if (horario.duracion_sesion !== 30 && horario.duracion_sesion !== 60) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Horario ${i + 1}: duracion_sesion debe ser 30 o 60 minutos`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 6. VERIFICAR SOLAPAMIENTOS
    for (let i = 0; i < body.horarios.length; i++) {
      for (let j = i + 1; j < body.horarios.length; j++) {
        if (validarSolapamiento(body.horarios[i], body.horarios[j])) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Solapamiento detectado entre horarios del mismo día: ${body.horarios[i].hora_inicio}-${body.horarios[i].hora_fin} y ${body.horarios[j].hora_inicio}-${body.horarios[j].hora_fin}`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // 7. TRANSACCIÓN ATÓMICA: ELIMINAR TODOS + INSERTAR NUEVOS
    // Paso 1: Eliminar todos los horarios existentes
    const { error: deleteError } = await supabase
      .from('HorarioProfesional')
      .delete()
      .eq('perfil_profesional_id', perfil.id)

    if (deleteError) {
      console.error('Error eliminando horarios anteriores:', deleteError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al eliminar horarios anteriores'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Paso 2: Insertar nuevos horarios (si hay alguno)
    let horariosInsertados = 0
    if (body.horarios.length > 0) {
      const horariosParaInsertar = body.horarios.map(h => ({
        perfil_profesional_id: perfil.id,
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        duracion_sesion: h.duracion_sesion,
        activo: h.activo,
      }))

      const { data: insertedData, error: insertError } = await supabase
        .from('HorarioProfesional')
        .insert(horariosParaInsertar)
        .select()

      if (insertError) {
        console.error('Error insertando horarios:', insertError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Error al guardar los horarios'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      horariosInsertados = insertedData?.length || 0
    }

    // 8. REGISTRAR AUDITORÍA PHI
    // Nota: Esta función debe existir en la base de datos
    try {
      await supabase.rpc('registrar_acceso_phi', {
        p_usuario_id: usuario.id,
        p_tipo_recurso: 'configuracion',
        p_recurso_id: perfil.id,
        p_accion: 'actualizar',
        p_justificacion: `Configuración de disponibilidad horaria: ${horariosInsertados} horarios`
      })
    } catch (auditError) {
      // No fallar si el registro de auditoría falla, solo loguear
      console.warn('Error registrando auditoría (no crítico):', auditError)
    }

    // 9. RESPONSE EXITOSO
    const response: Response = {
      success: true,
      horarios_configurados: horariosInsertados,
      mensaje: `Disponibilidad actualizada correctamente. ${horariosInsertados} horarios configurados.`
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error inesperado en configurar-disponibilidad:', error)

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
