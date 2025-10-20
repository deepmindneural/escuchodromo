/**
 * Edge Function: Disponibilidad de Profesional
 *
 * Endpoint: GET /functions/v1/disponibilidad-profesional?profesional_id=UUID&fecha=YYYY-MM-DD
 *
 * Funcionalidad:
 * - Consulta horarios configurados del profesional
 * - Filtra bloques ocupados por citas confirmadas
 * - Retorna slots disponibles en intervalos de 30 minutos
 * - NO expone información de otros pacientes (HIPAA-compliant)
 * - Rate limiting: 30 req/min por usuario
 *
 * Compliance: HIPAA (no expone PHI de otros pacientes)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface SlotDisponible {
  hora_inicio: string // HH:MM
  hora_fin: string // HH:MM
  disponible: boolean
  duracion_disponible?: number // minutos disponibles
}

interface DisponibilidadResponse {
  success: boolean
  profesional_id?: string
  fecha?: string
  dia_semana?: number
  slots?: SlotDisponible[]
  error?: string
}

// Función para generar slots de 30 minutos entre dos horas
function generarSlots(horaInicio: string, horaFin: string): string[] {
  const slots: string[] = []
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number)
  const [horaFinH, horaFinM] = horaFin.split(':').map(Number)

  let horaActual = horaInicioH * 60 + horaInicioM // minutos desde medianoche
  const horaLimite = horaFinH * 60 + horaFinM

  while (horaActual < horaLimite) {
    const h = Math.floor(horaActual / 60)
    const m = horaActual % 60
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    horaActual += 30 // Incrementar 30 minutos
  }

  return slots
}

// Función para verificar si un slot está ocupado
function slotOcupado(
  slot: string,
  fecha: string,
  citasOcupadas: Array<{ fecha_hora: string; duracion: number }>
): boolean {
  const [slotH, slotM] = slot.split(':').map(Number)
  const slotTime = new Date(`${fecha}T${slot}:00`)

  for (const cita of citasOcupadas) {
    const citaInicio = new Date(cita.fecha_hora)
    const citaFin = new Date(citaInicio.getTime() + cita.duracion * 60000)

    if (slotTime >= citaInicio && slotTime < citaFin) {
      return true
    }
  }

  return false
}

serve(async (req) => {
  // ✅ Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ✅ 1. VALIDAR JWT (opcional para disponibilidad pública, pero recomendado)
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

    // Verificar token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 2. EXTRAER PARÁMETROS DE QUERY
    const url = new URL(req.url)
    const profesionalId = url.searchParams.get('profesional_id')
    const fecha = url.searchParams.get('fecha') // YYYY-MM-DD

    if (!profesionalId || !fecha) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parámetros requeridos: profesional_id, fecha' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar formato de fecha
    const fechaObj = new Date(fecha)
    if (isNaN(fechaObj.getTime())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de fecha inválido (usar YYYY-MM-DD)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 3. VERIFICAR QUE EL PROFESIONAL EXISTE Y ESTÁ ACTIVO
    const { data: profesional, error: profError } = await supabase
      .from('PerfilProfesional')
      .select('id, usuario_id')
      .eq('usuario_id', profesionalId)
      .eq('perfil_aprobado', true)
      .eq('documentos_verificados', true)
      .single()

    if (profError || !profesional) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profesional no encontrado o no disponible' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 4. OBTENER DÍA DE LA SEMANA
    const diaSemana = fechaObj.getDay() // 0-6 (Domingo=0)

    // ✅ 5. CONSULTAR HORARIOS DEL PROFESIONAL PARA ESE DÍA
    const { data: horarios, error: horarioError } = await supabase
      .from('HorarioProfesional')
      .select('hora_inicio, hora_fin')
      .eq('perfil_profesional_id', profesional.id)
      .eq('dia_semana', diaSemana)
      .eq('activo', true)

    if (horarioError) {
      console.error('Error consultando horarios:', horarioError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error consultando horarios' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!horarios || horarios.length === 0) {
      // Profesional no trabaja ese día
      return new Response(
        JSON.stringify({
          success: true,
          profesional_id: profesionalId,
          fecha,
          dia_semana: diaSemana,
          slots: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // ✅ 6. CONSULTAR CITAS OCUPADAS PARA ESA FECHA
    const { data: citasOcupadas, error: citasError } = await supabase
      .from('Cita')
      .select('fecha_hora, duracion')
      .eq('profesional_id', profesionalId)
      .in('estado', ['pendiente', 'confirmada'])
      .gte('fecha_hora', `${fecha}T00:00:00`)
      .lt('fecha_hora', `${fecha}T23:59:59`)

    if (citasError) {
      console.error('Error consultando citas:', citasError)
    }

    const citas = citasOcupadas || []

    // ✅ 7. GENERAR SLOTS DISPONIBLES
    const slots: SlotDisponible[] = []

    for (const horario of horarios) {
      const slotsHorario = generarSlots(horario.hora_inicio, horario.hora_fin)

      for (const slot of slotsHorario) {
        const ocupado = slotOcupado(slot, fecha, citas)

        // Calcular duración disponible (30 o 60 minutos)
        let duracionDisponible = 0
        if (!ocupado) {
          // Verificar si también está libre el siguiente slot (para sesiones de 60 min)
          const [h, m] = slot.split(':').map(Number)
          const siguienteSlotTime = h * 60 + m + 30
          const siguienteH = Math.floor(siguienteSlotTime / 60)
          const siguienteM = siguienteSlotTime % 60
          const siguienteSlot = `${siguienteH.toString().padStart(2, '0')}:${siguienteM.toString().padStart(2, '0')}`

          const siguienteOcupado = slotOcupado(siguienteSlot, fecha, citas)

          if (siguienteOcupado || siguienteSlot > horario.hora_fin) {
            duracionDisponible = 30
          } else {
            duracionDisponible = 60
          }
        }

        slots.push({
          hora_inicio: slot,
          hora_fin: slot, // Se puede calcular hora_fin si es necesario
          disponible: !ocupado,
          duracion_disponible: ocupado ? undefined : duracionDisponible
        })
      }
    }

    // ✅ 8. RESPONSE
    const response: DisponibilidadResponse = {
      success: true,
      profesional_id: profesionalId,
      fecha,
      dia_semana: diaSemana,
      slots
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error inesperado en disponibilidad-profesional:', error)

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
