/**
 * Script de verificación: Probar que podemos consultar profesionales
 * después de arreglar las políticas RLS
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvezncgcdsjntzrzztrj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjY2NjcsImV4cCI6MjA3NjA0MjY2N30.CddHpq9maykqCT9AfBAGRzidelWwdcYcWQ7pKm_81Q4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verificarProfesionales() {
  console.log('🔍 Verificando consulta de profesionales...\n');

  try {
    // Test 1: Consulta simple de profesionales (sin autenticación)
    console.log('📋 Test 1: Listar profesionales (público)');
    const { data: profesionales, error: errorProfesionales } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
        email,
        rol
      `)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true)
      .limit(5);

    if (errorProfesionales) {
      console.error('❌ Error:', errorProfesionales.message);
      if (errorProfesionales.message.includes('infinite recursion')) {
        console.log('\n⚠️  PROBLEMA: Aún hay recursión infinita en las políticas');
        return false;
      }
    } else {
      console.log(`✅ Profesionales encontrados: ${profesionales?.length || 0}`);
      if (profesionales && profesionales.length > 0) {
        console.log('   Ejemplo:', profesionales[0].nombre, profesionales[0].apellido);
      }
    }

    // Test 2: Consulta con PerfilUsuario (incluye foto_perfil)
    console.log('\n📋 Test 2: Listar profesionales CON PerfilUsuario (foto, biografía, etc.)');
    const { data: profesionalesConPerfil, error: errorPerfil } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
        PerfilUsuario!PerfilUsuario_usuario_id_fkey (
          especialidad,
          experiencia_anos,
          foto_perfil,
          biografia,
          direccion,
          tarifa_30min,
          tarifa_60min,
          disponible
        )
      `)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true)
      .limit(5);

    if (errorPerfil) {
      console.error('❌ Error:', errorPerfil.message);
    } else {
      console.log(`✅ Profesionales con perfil: ${profesionalesConPerfil?.length || 0}`);
      if (profesionalesConPerfil && profesionalesConPerfil.length > 0) {
        const ejemplo = profesionalesConPerfil[0];
        console.log('   Ejemplo:');
        console.log('   -', ejemplo.nombre, ejemplo.apellido);
        console.log('   - Especialidad:', ejemplo.PerfilUsuario?.especialidad || 'Sin especificar');
        console.log('   - Foto perfil:', ejemplo.PerfilUsuario?.foto_perfil ? '✅ Tiene foto' : '❌ Sin foto');
        console.log('   - Biografía:', ejemplo.PerfilUsuario?.biografia ? `"${ejemplo.PerfilUsuario.biografia.substring(0, 50)}..."` : 'Sin biografía');
      }
    }

    // Test 3: Consulta con PerfilProfesional (sistema de citas)
    console.log('\n📋 Test 3: Listar profesionales CON PerfilProfesional (aprobados)');
    const { data: profesionalesAprobados, error: errorAprobados } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
        PerfilUsuario (
          foto_perfil,
          especialidad
        ),
        PerfilProfesional!PerfilProfesional_usuario_id_fkey (
          titulo_profesional,
          especialidades,
          tarifa_por_sesion,
          calificacion_promedio,
          perfil_aprobado,
          documentos_verificados
        )
      `)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true)
      .eq('PerfilProfesional.perfil_aprobado', true)
      .eq('PerfilProfesional.documentos_verificados', true)
      .limit(5);

    if (errorAprobados) {
      console.error('❌ Error:', errorAprobados.message);
    } else {
      console.log(`✅ Profesionales aprobados: ${profesionalesAprobados?.length || 0}`);
      if (profesionalesAprobados && profesionalesAprobados.length > 0) {
        const ejemplo = profesionalesAprobados[0];
        const perfilProf = Array.isArray(ejemplo.PerfilProfesional)
          ? ejemplo.PerfilProfesional[0]
          : ejemplo.PerfilProfesional;

        console.log('   Ejemplo:');
        console.log('   -', ejemplo.nombre, ejemplo.apellido);
        console.log('   - Título:', perfilProf?.titulo_profesional || 'Sin especificar');
        console.log('   - Especialidades:', perfilProf?.especialidades?.join(', ') || 'Sin especificar');
        console.log('   - Tarifa:', perfilProf?.tarifa_por_sesion ? `$${perfilProf.tarifa_por_sesion}` : 'No especificada');
        console.log('   - Rating:', perfilProf?.calificacion_promedio || 0);
      }
    }

    // Test 4: Llamar a la edge function listar-profesionales
    console.log('\n📋 Test 4: Edge Function listar-profesionales');
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
      'listar-profesionales?limite=5',
      { method: 'GET' }
    );

    if (edgeFunctionError) {
      console.error('❌ Error en edge function:', edgeFunctionError.message);
    } else {
      if (edgeFunctionData?.success) {
        console.log(`✅ Edge function funcionando: ${edgeFunctionData.profesionales?.length || 0} profesionales`);
        console.log(`   Total en base de datos: ${edgeFunctionData.total || 0}`);

        if (edgeFunctionData.profesionales && edgeFunctionData.profesionales.length > 0) {
          const ejemplo = edgeFunctionData.profesionales[0];
          console.log('   Ejemplo:');
          console.log('   -', ejemplo.nombre_completo);
          console.log('   - Foto:', ejemplo.foto_perfil ? '✅ Tiene foto' : '❌ Sin foto');
          console.log('   - Especialidades:', ejemplo.especialidades?.join(', '));
          console.log('   - Tarifa:', `$${ejemplo.tarifa_por_sesion || 0}`);
        }
      } else {
        console.error('❌ Edge function retornó error:', edgeFunctionData?.error);
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));

    const todosOk = !errorProfesionales && !errorPerfil && !errorAprobados && !edgeFunctionError;

    if (todosOk) {
      console.log('✅ TODAS LAS CONSULTAS FUNCIONAN CORRECTAMENTE');
      console.log('✅ Las políticas RLS están correctamente configuradas');
      console.log('✅ El sistema de profesionales está operativo');
      console.log('\n🎯 Próximo paso: Verificar la interfaz web en /profesionales');
    } else {
      console.log('⚠️  Algunos tests fallaron. Revisa los errores arriba.');
    }

    return todosOk;

  } catch (error) {
    console.error('❌ Error general:', error.message);
    return false;
  }
}

// Ejecutar verificación
verificarProfesionales().then(success => {
  process.exit(success ? 0 : 1);
});
