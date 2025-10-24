import { NextRequest, NextResponse } from 'next/server';
import { crearClienteServidor } from '../../../../../lib/supabase/servidor';

/**
 * DELETE /api/admin/evaluaciones/eliminar
 * Elimina una evaluación usando RPC admin_eliminar_evaluacion con justificación
 */
export async function DELETE(request: NextRequest) {
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
    const { evaluacionId, justificacion } = body;

    // Validaciones
    if (!evaluacionId || !justificacion) {
      return NextResponse.json(
        { error: 'evaluacionId y justificación son requeridos' },
        { status: 400 }
      );
    }

    if (justificacion.trim().length < 30) {
      return NextResponse.json(
        { error: 'La justificación debe tener al menos 30 caracteres para compliance' },
        { status: 400 }
      );
    }

    // Verificar que la evaluación existe antes de eliminar
    const { data: evaluacionExiste, error: checkError } = await supabase
      .from('Evaluacion')
      .select('id, tipo, usuario_id')
      .eq('id', evaluacionId)
      .single();

    if (checkError || !evaluacionExiste) {
      return NextResponse.json(
        { error: 'Evaluación no encontrada' },
        { status: 404 }
      );
    }

    // Intentar usar RPC admin_eliminar_evaluacion si existe
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'admin_eliminar_evaluacion',
      {
        p_evaluacion_id: evaluacionId,
        p_justificacion: justificacion,
      }
    );

    // Si el RPC no existe, hacer delete directo
    if (rpcError) {
      console.log('RPC no disponible, usando DELETE directo:', rpcError.message);

      const { error: deleteError } = await supabase
        .from('Evaluacion')
        .delete()
        .eq('id', evaluacionId);

      if (deleteError) {
        console.error('Error al eliminar evaluación:', deleteError);
        return NextResponse.json(
          { error: `Error al eliminar evaluación: ${deleteError.message}` },
          { status: 400 }
        );
      }

      // Log de auditoría crítico
      console.warn(
        `[AUDIT CRITICAL] Admin ${usuarioActual.rol} eliminó evaluación ${evaluacionId} (tipo: ${evaluacionExiste.tipo}). Justificación: ${justificacion}`
      );

      return NextResponse.json({
        mensaje: 'Evaluación eliminada exitosamente',
        evaluacionId,
      });
    }

    return NextResponse.json({
      mensaje: 'Evaluación eliminada exitosamente',
      data: rpcData,
    });
  } catch (error) {
    console.error('Error en DELETE /api/admin/evaluaciones/eliminar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
