/**
 * Edge Function: Listar Citas del Usuario
 *
 * Endpoint: GET /functions/v1/listar-citas-usuario
 *
 * Query params:
 * - estado: 'todas' | 'proximas' | 'pasadas' | 'canceladas' (default: 'todas')
 * - limite: número de resultados (default: 50)
 * - pagina: número de página (default: 1)
 *
 * Funcionalidad:
 * - Validación JWT completa
 * - Lista citas del usuario autenticado
 * - Incluye información del profesional
 * - Filtrado por estado
 * - Paginación
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface CitaConProfesional {
  id: string
  fecha_hora: string
  duracion: number
  estado: string
  modalidad: string
  motivo_consulta?: string
  link_videollamada?: string
  creado_en: string
  profesional: {
    id: string
    nombre: string
    apellido: string
    email: string
    avatar_url?: string
  }
  perfil_profesional?: {
    especialidades?: string[]
    tarifa_por_sesion?: number
  }
}

serve(async (req) => {
  // ✅ Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ✅ 1. VALIDAR JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado: token faltante' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Error de autenticación:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido o expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 2. OBTENER DATOS DEL USUARIO
    const { data: usuario, error: usuarioError } = await supabase
      .from('Usuario')
      .select('id, rol')
      .eq('auth_id', user.id)
      .single()

    if (usuarioError || !usuario) {
      console.error('Error obteniendo usuario:', usuarioError)
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ 3. OBTENER PARÁMETROS DE QUERY
    const url = new URL(req.url)
    const estadoParam = url.searchParams.get('estado') || 'todas'
    const limite = parseInt(url.searchParams.get('limite') || '50')
    const pagina = parseInt(url.searchParams.get('pagina') || '1')
    const offset = (pagina - 1) * limite

    // ✅ 4. USAR SELECT CON FOREIGN KEY RELATIONSHIP
    const ahora = new Date().toISOString()

    // Query base
    let query = supabase
      .from('Cita')
      .select(`
        *,
        Usuario!Cita_profesional_id_fkey(
          id,
          nombre,
          apellido,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('paciente_id', usuario.id)

    // Filtrar por estado
    switch (estadoParam) {
      case 'proximas':
        query = query
          .gte('fecha_hora', ahora)
          .in('estado', ['pendiente', 'confirmada'])
        break
      case 'pasadas':
        query = query
          .lt('fecha_hora', ahora)
          .eq('estado', 'completada')
        break
      case 'canceladas':
        query = query.eq('estado', 'cancelada')
        break
    }

    // Ordenar y paginar
    query = query
      .order('fecha_hora', { ascending: false })
      .range(offset, offset + limite - 1)

    const { data: citas, error: citasError, count } = await query

    if (citasError) {
      console.error('Error obteniendo citas:', citasError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error al obtener citas', details: citasError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener perfiles profesionales
    const profesionalesIds = citas?.map((c: any) => c.profesional_id).filter(Boolean) || []
    let perfilesProfesionales: any[] = []

    if (profesionalesIds.length > 0) {
      const { data: perfiles } = await supabase
        .from('PerfilProfesional')
        .select('usuario_id, especialidades, tarifa_por_sesion')
        .in('usuario_id', profesionalesIds)

      perfilesProfesionales = perfiles || []
    }

    // ✅ 8. FORMATEAR DATOS
    const citasConDatos: CitaConProfesional[] = (citas || []).map((cita: any) => {
      const usuarioData = cita.Usuario
      const perfilProf = perfilesProfesionales.find(p => p.usuario_id === cita.profesional_id)

      return {
        id: cita.id,
        fecha_hora: cita.fecha_hora,
        duracion: cita.duracion,
        estado: cita.estado,
        modalidad: cita.modalidad,
        motivo_consulta: cita.motivo_consulta,
        link_videollamada: cita.link_videollamada,
        creado_en: cita.creado_en,
        profesional: usuarioData ? {
          id: usuarioData.id,
          nombre: usuarioData.nombre,
          apellido: usuarioData.apellido,
          email: usuarioData.email,
          avatar_url: usuarioData.avatar_url
        } : {
          id: cita.profesional_id,
          nombre: 'Desconocido',
          apellido: '',
          email: '',
        },
        perfil_profesional: perfilProf ? {
          especialidades: perfilProf.especialidades,
          tarifa_por_sesion: perfilProf.tarifa_por_sesion
        } : undefined
      }
    })

    // ✅ 9. CALCULAR ESTADÍSTICAS
    const totalProximas = citasConDatos.filter(c =>
      new Date(c.fecha_hora) >= new Date() &&
      ['pendiente', 'confirmada'].includes(c.estado)
    ).length

    const totalPasadas = citasConDatos.filter(c =>
      new Date(c.fecha_hora) < new Date() &&
      c.estado === 'completada'
    ).length

    const totalCanceladas = citasConDatos.filter(c =>
      c.estado === 'cancelada'
    ).length

    // ✅ 10. RESPONSE
    return new Response(
      JSON.stringify({
        success: true,
        citas: citasConDatos,
        paginacion: {
          total: count || 0,
          pagina,
          limite,
          total_paginas: Math.ceil((count || 0) / limite)
        },
        estadisticas: {
          proximas: totalProximas,
          pasadas: totalPasadas,
          canceladas: totalCanceladas,
          total: count || 0
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error inesperado en listar-citas-usuario:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        message: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
