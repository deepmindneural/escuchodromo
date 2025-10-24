import { NextRequest, NextResponse } from 'next/server';
import { crearClienteServidor } from '../../../../../lib/supabase/servidor';

/**
 * POST /api/admin/evaluaciones/crear
 * Crea una nueva evaluación para un usuario
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario actual es admin
    const supabase = await crearClienteServidor();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar rol de admin
    const { data: usuarioActual, error: rolError } = await supabase
      .from('Usuario')
      .select('rol')
      .eq('auth_id', user.id)
      .single();

    if (rolError || !usuarioActual || usuarioActual.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { usuarioId, tipo, respuestas, puntaje_total, severidad } = body;

    // Validaciones
    if (!usuarioId || !tipo || !respuestas || puntaje_total === undefined || !severidad) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    if (!['PHQ-9', 'GAD-7'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de evaluación inválido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const { data: usuarioExiste, error: usuarioError } = await supabase
      .from('Usuario')
      .select('id')
      .eq('id', usuarioId)
      .single();

    if (usuarioError || !usuarioExiste) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Crear evaluación
    const { data: evaluacion, error: crearError } = await supabase
      .from('Evaluacion')
      .insert({
        usuario_id: usuarioId,
        tipo,
        respuestas: JSON.stringify(respuestas),
        puntaje_total,
        severidad,
        completado: true,
      })
      .select()
      .single();

    if (crearError) {
      console.error('Error al crear evaluación:', crearError);
      return NextResponse.json(
        { error: `Error al crear evaluación: ${crearError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mensaje: 'Evaluación creada exitosamente',
      evaluacion,
    });
  } catch (error) {
    console.error('Error en POST /api/admin/evaluaciones/crear:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
