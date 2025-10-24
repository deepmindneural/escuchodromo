import { NextRequest, NextResponse } from 'next/server';
import { crearClienteServidor } from '../../../../../lib/supabase/servidor';

/**
 * GET /api/admin/usuarios/buscar
 * Busca usuarios por nombre o email para autocomplete
 */
export async function GET(request: NextRequest) {
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

    // Obtener parámetro de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ usuarios: [] });
    }

    // Buscar usuarios por nombre o email
    const { data: usuarios, error: buscarError } = await supabase
      .from('Usuario')
      .select('id, nombre, apellido, email')
      .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('esta_activo', true)
      .limit(10);

    if (buscarError) {
      console.error('Error al buscar usuarios:', buscarError);
      return NextResponse.json(
        { error: 'Error al buscar usuarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({ usuarios: usuarios || [] });
  } catch (error) {
    console.error('Error en GET /api/admin/usuarios/buscar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
