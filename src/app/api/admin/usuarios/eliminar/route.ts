import { NextRequest, NextResponse } from 'next/server';
import { crearClienteServidor } from '../../../../../lib/supabase/servidor';

/**
 * DELETE /api/admin/usuarios/eliminar
 * Desactiva un usuario (soft delete)
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
    const { usuarioId } = body;

    // Validaciones
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // Prevenir auto-eliminación
    const { data: usuarioAEliminar } = await supabase
      .from('Usuario')
      .select('auth_id')
      .eq('id', usuarioId)
      .single();

    if (usuarioAEliminar && usuarioAEliminar.auth_id === user.id) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Soft delete: desactivar usuario
    const { data: usuario, error: eliminarError } = await supabase
      .from('Usuario')
      .update({ esta_activo: false })
      .eq('id', usuarioId)
      .select()
      .single();

    if (eliminarError) {
      console.error('Error al desactivar usuario:', eliminarError);
      return NextResponse.json(
        { error: `Error al desactivar usuario: ${eliminarError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mensaje: 'Usuario desactivado exitosamente',
      usuario,
    });
  } catch (error) {
    console.error('Error en DELETE /api/admin/usuarios/eliminar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
