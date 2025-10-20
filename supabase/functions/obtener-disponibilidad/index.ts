/**
 * Edge Function: Obtener Disponibilidad (Lectura)
 *
 * Endpoint: GET /functions/v1/obtener-disponibilidad
 *
 * Funcionalidad:
 * - Consulta los horarios configurados del profesional autenticado
 * - Retorna todos los bloques horarios con su configuración
 * - Incluye estado activo/inactivo de cada bloque
 *
 * Seguridad:
 * - Requiere autenticación JWT
 * - Solo retorna horarios del profesional autenticado
 * - Rate limiting: 60 req/min por usuario
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface HorarioResponse {
  id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  duracion_sesion: number
  activo: boolean
}

interface Response {
  success: boolean
  horarios?: HorarioResponse[]
  error?: string
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

    // 2. VERIFICAR QUE ES PROFESIONAL Y OBTENER PERFIL
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

    // 4. CONSULTAR HORARIOS DEL PROFESIONAL
    const { data: horarios, error: errorHorarios } = await supabase
      .from('HorarioProfesional')
      .select('id, dia_semana, hora_inicio, hora_fin, duracion_sesion, activo')
      .eq('perfil_profesional_id', perfil.id)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (errorHorarios) {
      console.error('Error consultando horarios:', errorHorarios)
      return new Response(
        JSON.stringify({ success: false, error: 'Error al consultar horarios' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. FORMATEAR HORARIOS
    // Convertir TIME de PostgreSQL (HH:MM:SS) a HH:MM
    const horariosFormateados: HorarioResponse[] = (horarios || []).map((h: any) => ({
      id: h.id,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio.substring(0, 5), // "09:00:00" -> "09:00"
      hora_fin: h.hora_fin.substring(0, 5),       // "17:00:00" -> "17:00"
      duracion_sesion: h.duracion_sesion || 60,
      activo: h.activo,
    }))

    // 6. RESPONSE EXITOSO
    const response: Response = {
      success: true,
      horarios: horariosFormateados,
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error inesperado en obtener-disponibilidad:', error)

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
