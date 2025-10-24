import { NextRequest, NextResponse } from 'next/server';
import { crearClienteServidor } from '../../../../../lib/supabase/servidor';

/**
 * PUT /api/admin/usuarios/editar
 * Actualiza los datos de un usuario existente
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
    const { usuarioId, nombre, apellido, rol, esta_activo } = body;

    // Validaciones
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    if (rol && !['USUARIO', 'TERAPEUTA', 'ADMIN'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Preparar datos a actualizar (solo incluir campos que se proporcionaron)
    const datosActualizar: any = {};

    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (apellido !== undefined) datosActualizar.apellido = apellido;
    if (rol !== undefined) datosActualizar.rol = rol;
    if (esta_activo !== undefined) datosActualizar.esta_activo = esta_activo;

    // Actualizar usuario
    const { data: usuario, error: actualizarError } = await supabase
      .from('Usuario')
      .update(datosActualizar)
      .eq('id', usuarioId)
      .select()
      .single();

    if (actualizarError) {
      console.error('Error al actualizar usuario:', actualizarError);
      return NextResponse.json(
        { error: `Error al actualizar usuario: ${actualizarError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario,
    });
  } catch (error) {
    console.error('Error en PUT /api/admin/usuarios/editar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
