/**
 * Script para agregar foto de perfil al profesional de prueba
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvezncgcdsjntzrzztrj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjY2NjcsImV4cCI6MjA3NjA0MjY2N30.CddHpq9maykqCT9AfBAGRzidelWwdcYcWQ7pKm_81Q4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// URLs de fotos de perfil profesionales (avatares de ejemplo)
const FOTOS_EJEMPLO = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&q=80',
  'https://ui-avatars.com/api/?name=Carlos+Rodriguez&size=400&background=6366f1&color=fff&bold=true',
];

async function agregarFotoProfesional() {
  console.log('🖼️  Agregando foto de perfil al profesional...\n');

  try {
    // 1. Obtener el profesional actual
    console.log('📋 Buscando profesional sin foto...');
    const { data: profesionales, error: errorBuscar } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
        PerfilUsuario (
          id,
          usuario_id,
          foto_perfil
        )
      `)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true)
      .limit(10);

    if (errorBuscar) {
      console.error('❌ Error buscando profesionales:', errorBuscar.message);
      return false;
    }

    if (!profesionales || profesionales.length === 0) {
      console.log('⚠️  No se encontraron profesionales');
      return false;
    }

    console.log(`✅ Encontrados ${profesionales.length} profesionales\n`);

    // 2. Filtrar profesionales sin foto
    const profesionalesSinFoto = profesionales.filter(p => !p.PerfilUsuario?.foto_perfil);

    if (profesionalesSinFoto.length === 0) {
      console.log('✅ Todos los profesionales ya tienen foto de perfil');
      return true;
    }

    console.log(`📸 Profesionales sin foto: ${profesionalesSinFoto.length}`);

    // 3. Agregar foto a cada profesional sin foto
    for (let i = 0; i < profesionalesSinFoto.length; i++) {
      const profesional = profesionalesSinFoto[i];
      const fotoUrl = FOTOS_EJEMPLO[i % FOTOS_EJEMPLO.length];

      console.log(`\n${i + 1}. Actualizando: ${profesional.nombre} ${profesional.apellido}`);

      if (!profesional.PerfilUsuario) {
        console.log('   ⚠️  No tiene PerfilUsuario, creando...');

        // Crear PerfilUsuario si no existe
        const { data: nuevoPerfil, error: errorCrear } = await supabase
          .from('PerfilUsuario')
          .insert({
            usuario_id: profesional.id,
            foto_perfil: fotoUrl,
            disponible: true,
          })
          .select()
          .single();

        if (errorCrear) {
          console.error('   ❌ Error creando perfil:', errorCrear.message);
        } else {
          console.log('   ✅ Perfil creado con foto:', fotoUrl);
        }
      } else {
        // Actualizar PerfilUsuario existente
        const { data: perfilActualizado, error: errorActualizar } = await supabase
          .from('PerfilUsuario')
          .update({
            foto_perfil: fotoUrl,
            disponible: true,
          })
          .eq('usuario_id', profesional.id)
          .select()
          .single();

        if (errorActualizar) {
          console.error('   ❌ Error actualizando perfil:', errorActualizar.message);
          console.error('   Error detalles:', errorActualizar);
        } else {
          console.log('   ✅ Foto agregada:', fotoUrl);
        }
      }
    }

    // 4. Verificar que se agregaron las fotos
    console.log('\n🔍 Verificando resultados...');
    const { data: verificacion, error: errorVerificar } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
        PerfilUsuario (
          foto_perfil
        )
      `)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true);

    if (errorVerificar) {
      console.error('❌ Error verificando:', errorVerificar.message);
      return false;
    }

    const conFoto = verificacion?.filter(p => p.PerfilUsuario?.foto_perfil).length || 0;
    const total = verificacion?.length || 0;

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Profesionales totales: ${total}`);
    console.log(`   Con foto de perfil: ${conFoto}`);
    console.log(`   Sin foto: ${total - conFoto}`);

    if (conFoto === total) {
      console.log('\n✅ TODOS los profesionales tienen foto de perfil');
      return true;
    } else {
      console.log('\n⚠️  Algunos profesionales aún no tienen foto');
      return false;
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    return false;
  }
}

// Ejecutar
agregarFotoProfesional().then(success => {
  process.exit(success ? 0 : 1);
});
