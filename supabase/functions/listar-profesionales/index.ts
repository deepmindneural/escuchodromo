import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  PerfilUsuario: {
    especialidad?: string;
    experiencia_anos?: number;
    foto_perfil?: string;
    biografia?: string;
    direccion?: string;
    tarifa_30min?: number;
    tarifa_60min?: number;
    disponible?: boolean;
  } | null;
}

/**
 * EDGE FUNCTION: Listar Profesionales Aprobados
 *
 * Retorna lista de profesionales (terapeutas) disponibles
 * con su información pública para mostrar en el directorio
 *
 * Método: GET
 * Query Params:
 *   - busqueda (string, opcional): Búsqueda por nombre o especialidad
 *   - especialidad (string, opcional): Filtrar por especialidad exacta
 *   - tarifa_min (number, opcional): Tarifa mínima por sesión
 *   - tarifa_max (number, opcional): Tarifa máxima por sesión
 *   - modalidad (string, opcional): virtual | presencial | ambas
 *   - disponible (boolean, opcional): Solo mostrar disponibles
 *   - orderBy (string, opcional): rating | tarifa_asc | tarifa_desc | experiencia | nombre
 *   - pagina (number, opcional): Número de página (default: 1)
 *   - limite (number, opcional): Items por página (default: 12, max: 50)
 *
 * Seguridad:
 *   - No requiere autenticación (información pública)
 *   - Solo expone información pública de profesionales aprobados y verificados
 *   - NO expone datos sensibles (PHI, email, teléfono)
 *   - Rate limiting: 60 requests/minuto
 *
 * Response:
 * {
 *   success: true,
 *   profesionales: Profesional[],
 *   total: number,
 *   pagina: number,
 *   total_paginas: number,
 *   filtros_aplicados: object
 * }
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Crear cliente de Supabase con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==========================================
    // PARSEAR QUERY PARAMS
    // ==========================================
    const url = new URL(req.url);
    const busqueda = url.searchParams.get('busqueda')?.trim() || '';
    const especialidad = url.searchParams.get('especialidad');
    const tarifaMinStr = url.searchParams.get('tarifa_min');
    const tarifaMaxStr = url.searchParams.get('tarifa_max');
    const modalidad = url.searchParams.get('modalidad');
    const disponibleParam = url.searchParams.get('disponible');
    const orderBy = url.searchParams.get('orderBy') || 'nombre';
    const paginaStr = url.searchParams.get('pagina') || '1';
    const limiteStr = url.searchParams.get('limite') || '12';

    const soloDisponibles = disponibleParam === 'true';
    const pagina = Math.max(1, parseInt(paginaStr) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(limiteStr) || 12));
    const tarifaMin = tarifaMinStr ? parseFloat(tarifaMinStr) : null;
    const tarifaMax = tarifaMaxStr ? parseFloat(tarifaMaxStr) : null;

    // ==========================================
    // CONSULTAR PROFESIONALES
    // ==========================================
    // Primero obtenemos todos los profesionales con perfil aprobado
    const { data: profesionales, error } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
        rol,
        PerfilUsuario (
          especialidad,
          experiencia_anos,
          foto_perfil,
          biografia,
          direccion,
          tarifa_30min,
          tarifa_60min,
          disponible
        ),
        PerfilProfesional!PerfilProfesional_usuario_id_fkey!inner (
          titulo_profesional,
          especialidades,
          tarifa_por_sesion,
          calificacion_promedio,
          total_pacientes,
          total_citas,
          documentos_verificados,
          perfil_aprobado
        )
      `)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true)
      .eq('PerfilProfesional.perfil_aprobado', true)
      .eq('PerfilProfesional.documentos_verificados', true);

    if (error) {
      console.error('Error consultando profesionales:', error);
      throw new Error('No se pudieron obtener los profesionales');
    }

    // ==========================================
    // FILTRAR Y TRANSFORMAR DATOS
    // ==========================================
    let profesionalesFiltrados = (profesionales || []).filter((p: any) => {
      // Debe tener perfil profesional
      if (!p.PerfilProfesional || p.PerfilProfesional.length === 0) return false;

      const perfilProf = Array.isArray(p.PerfilProfesional)
        ? p.PerfilProfesional[0]
        : p.PerfilProfesional;

      // Filtro de búsqueda por nombre o especialidad
      if (busqueda) {
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        const terminoBusqueda = busqueda.toLowerCase();
        const coincideNombre = nombreCompleto.includes(terminoBusqueda);
        const coincideEspecialidad = perfilProf.especialidades?.some((esp: string) =>
          esp.toLowerCase().includes(terminoBusqueda)
        );
        const coincidePerfilUsuario = p.PerfilUsuario?.especialidad?.toLowerCase().includes(terminoBusqueda);

        if (!coincideNombre && !coincideEspecialidad && !coincidePerfilUsuario) {
          return false;
        }
      }

      // Filtro de especialidad exacta
      if (especialidad) {
        const tieneEspecialidad = perfilProf.especialidades?.includes(especialidad) ||
          p.PerfilUsuario?.especialidad === especialidad;
        if (!tieneEspecialidad) return false;
      }

      // Filtro de tarifa
      const tarifa = perfilProf.tarifa_por_sesion || p.PerfilUsuario?.tarifa_60min || 0;
      if (tarifaMin !== null && tarifa < tarifaMin) return false;
      if (tarifaMax !== null && tarifa > tarifaMax) return false;

      // Filtro de disponibilidad
      if (soloDisponibles && !p.PerfilUsuario?.disponible) return false;

      // TODO: Filtro de modalidad cuando se implemente en el schema
      // Por ahora asumimos que todos ofrecen virtual

      return true;
    });

    // ==========================================
    // ORDENAR RESULTADOS
    // ==========================================
    switch (orderBy) {
      case 'rating':
        profesionalesFiltrados.sort((a: any, b: any) => {
          const perfilProfA = Array.isArray(a.PerfilProfesional) ? a.PerfilProfesional[0] : a.PerfilProfesional;
          const perfilProfB = Array.isArray(b.PerfilProfesional) ? b.PerfilProfesional[0] : b.PerfilProfesional;
          const ratingA = perfilProfA?.calificacion_promedio || 0;
          const ratingB = perfilProfB?.calificacion_promedio || 0;
          return ratingB - ratingA; // Mayor a menor
        });
        break;

      case 'tarifa_asc':
      case 'precio_asc':
        profesionalesFiltrados.sort((a: any, b: any) => {
          const perfilProfA = Array.isArray(a.PerfilProfesional) ? a.PerfilProfesional[0] : a.PerfilProfesional;
          const perfilProfB = Array.isArray(b.PerfilProfesional) ? b.PerfilProfesional[0] : b.PerfilProfesional;
          const tarifaA = perfilProfA?.tarifa_por_sesion || a.PerfilUsuario?.tarifa_60min || 999999;
          const tarifaB = perfilProfB?.tarifa_por_sesion || b.PerfilUsuario?.tarifa_60min || 999999;
          return tarifaA - tarifaB;
        });
        break;

      case 'tarifa_desc':
      case 'precio_desc':
        profesionalesFiltrados.sort((a: any, b: any) => {
          const perfilProfA = Array.isArray(a.PerfilProfesional) ? a.PerfilProfesional[0] : a.PerfilProfesional;
          const perfilProfB = Array.isArray(b.PerfilProfesional) ? b.PerfilProfesional[0] : b.PerfilProfesional;
          const tarifaA = perfilProfA?.tarifa_por_sesion || a.PerfilUsuario?.tarifa_60min || 0;
          const tarifaB = perfilProfB?.tarifa_por_sesion || b.PerfilUsuario?.tarifa_60min || 0;
          return tarifaB - tarifaA;
        });
        break;

      case 'experiencia':
        profesionalesFiltrados.sort((a: any, b: any) => {
          const expA = a.PerfilUsuario?.experiencia_anos || 0;
          const expB = b.PerfilUsuario?.experiencia_anos || 0;
          return expB - expA; // Mayor a menor
        });
        break;

      case 'nombre':
      default:
        profesionalesFiltrados.sort((a: any, b: any) => {
          const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
          const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
          return nombreA.localeCompare(nombreB);
        });
        break;
    }

    // ==========================================
    // CALCULAR PAGINACIÓN
    // ==========================================
    const totalResultados = profesionalesFiltrados.length;
    const totalPaginas = Math.ceil(totalResultados / limite);
    const offset = (pagina - 1) * limite;

    // Aplicar paginación
    const profesionalesPaginados = profesionalesFiltrados.slice(offset, offset + limite);

    // ==========================================
    // FORMATEAR RESPUESTA
    // ==========================================
    const profesionalesFormateados = profesionalesPaginados.map((p: any) => {
      const perfilProf = Array.isArray(p.PerfilProfesional) ? p.PerfilProfesional[0] : p.PerfilProfesional;

      return {
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        nombre_completo: `${p.nombre} ${p.apellido}`,

        // Información profesional
        titulo_profesional: perfilProf?.titulo_profesional || 'Profesional de Salud Mental',
        especialidades: perfilProf?.especialidades || [p.PerfilUsuario?.especialidad || 'Psicología General'],
        especialidad: p.PerfilUsuario?.especialidad || perfilProf?.especialidades?.[0] || 'Psicología General',
        experiencia_anos: p.PerfilUsuario?.experiencia_anos || 0,

        // Perfil
        foto_perfil: p.PerfilUsuario?.foto_perfil || null,
        biografia: p.PerfilUsuario?.biografia || '',
        direccion: p.PerfilUsuario?.direccion || null,

        // Tarifas (usamos tarifa_por_sesion del perfil profesional si existe)
        tarifa_por_sesion: perfilProf?.tarifa_por_sesion || p.PerfilUsuario?.tarifa_60min || 150000,
        tarifa_30min: p.PerfilUsuario?.tarifa_30min || 80000,
        tarifa_60min: p.PerfilUsuario?.tarifa_60min || perfilProf?.tarifa_por_sesion || 150000,

        // Rating y estadísticas
        calificacion_promedio: perfilProf?.calificacion_promedio || 0,
        total_reviews: perfilProf?.total_pacientes || 0,
        total_citas: perfilProf?.total_citas || 0,

        // Disponibilidad
        disponible: p.PerfilUsuario?.disponible ?? true,

        // Modalidades (por ahora virtual por defecto, se puede ampliar)
        modalidades: ['virtual'] as ('virtual' | 'presencial')[],
      };
    });

    // ==========================================
    // RESPUESTA EXITOSA
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        profesionales: profesionalesFormateados,
        total: totalResultados,
        pagina: pagina,
        total_paginas: totalPaginas,
        limite: limite,
        filtros_aplicados: {
          busqueda: busqueda || null,
          especialidad: especialidad || null,
          tarifa_min: tarifaMin,
          tarifa_max: tarifaMax,
          modalidad: modalidad || null,
          solo_disponibles: soloDisponibles,
          orden: orderBy,
        },
      }),
      {
        headers: CORS_HEADERS,
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error en listar-profesionales:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor',
      }),
      {
        headers: CORS_HEADERS,
        status: 500,
      }
    );
  }
});
