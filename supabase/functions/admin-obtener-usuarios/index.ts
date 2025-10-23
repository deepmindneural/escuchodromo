/**
 * Edge Function: admin-obtener-usuarios
 * Descripción: Obtiene lista de usuarios con filtros, paginación y audit logging
 * Seguridad: Solo accesible por rol ADMIN
 * Compliance: HIPAA §164.312(b) - Audit Controls
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Tipos
interface FiltrosUsuarios {
  busqueda?: string;
  rol?: 'USUARIO' | 'TERAPEUTA' | 'ADMIN';
  estado?: 'activo' | 'inactivo';
  pagina?: number;
  limite?: number;
}

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: string;
  esta_activo: boolean;
  creado_en: string;
  estadisticas: {
    conversaciones: number;
    evaluaciones: number;
    pagos: number;
  };
}

serve(async (req: Request) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const tiempoInicio = Date.now();
  let auditExitoso = true;
  let codigoEstado = 200;
  let mensajeError: string | null = null;

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      throw new Error('Método no permitido. Use POST.');
    }

    // Crear cliente de Supabase con el token del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorización no proporcionado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      codigoEstado = 401;
      throw new Error('Usuario no autenticado');
    }

    // Verificar que sea admin
    const { data: usuarioData, error: usuarioError } = await supabaseClient
      .from('Usuario')
      .select('id, rol, email')
      .eq('auth_id', user.id)
      .single();

    if (usuarioError || !usuarioData || usuarioData.rol !== 'ADMIN') {
      codigoEstado = 403;
      throw new Error('Acceso denegado. Solo administradores pueden acceder a esta función.');
    }

    // Parsear body
    const body = await req.json();
    const filtros: FiltrosUsuarios = body.filtros || {};
    const pagina = filtros.pagina || 1;
    const limite = Math.min(filtros.limite || 10, 50); // Máximo 50 por página
    const offset = (pagina - 1) * limite;

    // Extraer IP y user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Construir query con filtros
    let query = supabaseClient
      .from('Usuario')
      .select('id, email, nombre, apellido, rol, esta_activo, creado_en', { count: 'exact' });

    // Aplicar filtros de búsqueda
    if (filtros.busqueda && filtros.busqueda.trim() !== '') {
      const busqueda = filtros.busqueda.trim();
      query = query.or(`email.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%`);
    }

    // Filtro por rol
    if (filtros.rol) {
      query = query.eq('rol', filtros.rol);
    }

    // Filtro por estado
    if (filtros.estado) {
      const estaActivo = filtros.estado === 'activo';
      query = query.eq('esta_activo', estaActivo);
    }

    // Paginación y ordenamiento
    const { data: usuarios, error: queryError, count } = await query
      .order('creado_en', { ascending: false })
      .range(offset, offset + limite - 1);

    if (queryError) {
      codigoEstado = 500;
      throw new Error(`Error al obtener usuarios: ${queryError.message}`);
    }

    // Obtener estadísticas para cada usuario (optimizado con Promise.all)
    const usuariosConEstadisticas: Usuario[] = await Promise.all(
      (usuarios || []).map(async (usuario) => {
        // Contar conversaciones
        const { count: conversaciones } = await supabaseClient
          .from('Conversacion')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', usuario.id);

        // Contar evaluaciones
        const { count: evaluaciones } = await supabaseClient
          .from('Evaluacion')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', usuario.id);

        // Contar pagos
        const { count: pagos } = await supabaseClient
          .from('Pago')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', usuario.id);

        return {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rol: usuario.rol,
          esta_activo: usuario.esta_activo,
          creado_en: usuario.creado_en,
          estadisticas: {
            conversaciones: conversaciones || 0,
            evaluaciones: evaluaciones || 0,
            pagos: pagos || 0,
          },
        };
      })
    );

    // Calcular metadata de paginación
    const totalPaginas = Math.ceil((count || 0) / limite);

    // Registrar acción en audit log
    const { error: auditError } = await supabaseClient.rpc('registrar_accion_admin', {
      p_accion: 'ver_usuarios',
      p_tabla_afectada: 'Usuario',
      p_registro_id: null,
      p_cambios_realizados: null,
      p_justificacion: 'Consulta de usuarios desde panel administrativo',
      p_es_acceso_phi: false, // Lista de usuarios no es PHI directamente
      p_filtros_aplicados: filtros,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_ruta_solicitud: '/admin-obtener-usuarios',
      p_metodo_http: 'POST',
    });

    if (auditError) {
      console.error('Error al registrar auditoría:', auditError);
      // No fallar la request por error de audit, pero loggear
    }

    const duracionMs = Date.now() - tiempoInicio;

    return new Response(
      JSON.stringify({
        usuarios: usuariosConEstadisticas,
        paginacion: {
          pagina,
          limite,
          total: count || 0,
          totalPaginas,
        },
        metadata: {
          duracion_ms: duracionMs,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    auditExitoso = false;
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    mensajeError = errorMessage;

    console.error('Error en admin-obtener-usuarios:', errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: codigoEstado,
      }
    );
  }
});
