import { NextRequest, NextResponse } from 'next/server';
import { crearClienteServidor, crearClienteServicioServidor } from '../../../../../lib/supabase/servidor';

/**
 * POST /api/admin/usuarios/crear
 * Crea un nuevo usuario con autenticación y registro en BD
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
    const { email, nombre, apellido, rol, password } = body;

    // Validaciones
    if (!email || !rol) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      );
    }

    if (!['USUARIO', 'TERAPEUTA', 'ADMIN'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Generar contraseña temporal si no se proporciona
    const passwordTemporal = password || generarPasswordTemporal();

    // Usar cliente con service role para crear usuario en Auth
    const supabaseAdmin = crearClienteServicioServidor();

    // 1. Crear usuario en Auth
    const { data: authData, error: crearAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellido,
      },
    });

    if (crearAuthError) {
      console.error('Error al crear usuario en Auth:', crearAuthError);
      return NextResponse.json(
        { error: `Error al crear usuario: ${crearAuthError.message}` },
        { status: 400 }
      );
    }

    // 2. Crear registro en tabla Usuario
    const { data: usuario, error: crearUsuarioError } = await supabaseAdmin
      .from('Usuario')
      .insert({
        auth_id: authData.user.id,
        email,
        nombre: nombre || null,
        apellido: apellido || null,
        rol,
        esta_activo: true,
      })
      .select()
      .single();

    if (crearUsuarioError) {
      console.error('Error al crear registro de usuario:', crearUsuarioError);

      // Rollback: eliminar usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: `Error al crear registro de usuario: ${crearUsuarioError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mensaje: 'Usuario creado exitosamente',
      usuario,
      passwordTemporal, // Enviar la contraseña temporal para que el admin la copie
    });
  } catch (error) {
    console.error('Error en POST /api/admin/usuarios/crear:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Genera una contraseña temporal aleatoria segura
 */
function generarPasswordTemporal(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}
