import { NextRequest, NextResponse } from 'next/server';
import { crearClienteServidor } from '../../../../../lib/supabase/servidor';

/**
 * PUT /api/admin/evaluaciones/editar
 * Actualiza una evaluación existente usando RPC admin_actualizar_evaluacion
 */
export async function PUT(request: NextRequest) {
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
    const { evaluacionId, respuestas, puntaje_total, severidad, justificacion } = body;

    // Validaciones
    if (!evaluacionId || !justificacion) {
      return NextResponse.json(
        { error: 'evaluacionId y justificación son requeridos' },
        { status: 400 }
      );
    }

    if (justificacion.trim().length < 20) {
      return NextResponse.json(
        { error: 'La justificación debe tener al menos 20 caracteres' },
        { status: 400 }
      );
    }

    // Intentar usar RPC admin_actualizar_evaluacion si existe
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'admin_actualizar_evaluacion',
      {
        p_evaluacion_id: evaluacionId,
        p_respuestas: respuestas ? JSON.stringify(respuestas) : null,
        p_puntaje_total: puntaje_total,
        p_severidad: severidad,
        p_justificacion: justificacion,
      }
    );

    // Si el RPC no existe, hacer update directo
    if (rpcError) {
      console.log('RPC no disponible, usando UPDATE directo:', rpcError.message);

      // Preparar campos a actualizar
      const camposActualizar: any = {};

      if (respuestas !== undefined) {
        camposActualizar.respuestas = JSON.stringify(respuestas);
      }
      if (puntaje_total !== undefined) {
        camposActualizar.puntaje_total = puntaje_total;
      }
      if (severidad !== undefined) {
        camposActualizar.severidad = severidad;
      }

      const { data: evaluacion, error: updateError } = await supabase
        .from('Evaluacion')
        .update(camposActualizar)
        .eq('id', evaluacionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error al actualizar evaluación:', updateError);
        return NextResponse.json(
          { error: `Error al actualizar evaluación: ${updateError.message}` },
          { status: 400 }
        );
      }

      // Log de auditoría manual
      console.log(`[AUDIT] Admin ${usuarioActual.rol} actualizó evaluación ${evaluacionId}. Justificación: ${justificacion}`);

      return NextResponse.json({
        mensaje: 'Evaluación actualizada exitosamente',
        evaluacion,
      });
    }

    return NextResponse.json({
      mensaje: 'Evaluación actualizada exitosamente',
      data: rpcData,
    });
  } catch (error) {
    console.error('Error en PUT /api/admin/evaluaciones/editar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
