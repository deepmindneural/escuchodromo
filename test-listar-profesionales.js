/**
 * Script de prueba para la Edge Function listar-profesionales
 *
 * Este script invoca la Edge Function y muestra la respuesta completa
 * para diagnosticar por qué no se están mostrando profesionales
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testearEdgeFunction() {
  console.log('🔍 Probando Edge Function: listar-profesionales');
  console.log('━'.repeat(80));

  try {
    // Prueba 1: Sin filtros
    console.log('\n📋 PRUEBA 1: Sin filtros (todos los profesionales)');
    const { data: data1, error: error1 } = await supabase.functions.invoke(
      'listar-profesionales',
      { method: 'GET' }
    );

    if (error1) {
      console.error('❌ Error en la invocación:', error1);
    } else {
      console.log('✅ Respuesta exitosa:');
      console.log(JSON.stringify(data1, null, 2));
      console.log(`\n📊 Total profesionales: ${data1?.total || 0}`);
      console.log(`📊 Profesionales retornados: ${data1?.profesionales?.length || 0}`);
    }

    // Prueba 2: Consulta directa a la base de datos
    console.log('\n━'.repeat(80));
    console.log('📋 PRUEBA 2: Consulta directa a Usuario');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('Usuario')
      .select('id, nombre, apellido, email, rol, esta_activo')
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true);

    if (errorUsuarios) {
      console.error('❌ Error consultando usuarios:', errorUsuarios);
    } else {
      console.log(`✅ Usuarios con rol TERAPEUTA y activos: ${usuarios?.length || 0}`);
      if (usuarios && usuarios.length > 0) {
        usuarios.forEach(u => {
          console.log(`  - ${u.nombre} ${u.apellido} (${u.email})`);
        });
      }
    }

    // Prueba 3: Consulta PerfilProfesional
    console.log('\n━'.repeat(80));
    console.log('📋 PRUEBA 3: Consulta directa a PerfilProfesional');
    const { data: perfiles, error: errorPerfiles } = await supabase
      .from('PerfilProfesional')
      .select('*')
      .eq('perfil_aprobado', true)
      .eq('documentos_verificados', true);

    if (errorPerfiles) {
      console.error('❌ Error consultando PerfilProfesional:', errorPerfiles);
    } else {
      console.log(`✅ Perfiles aprobados y verificados: ${perfiles?.length || 0}`);
      if (perfiles && perfiles.length > 0) {
        perfiles.forEach(p => {
          console.log(`  - Usuario ID: ${p.usuario_id}`);
          console.log(`    Titulo: ${p.titulo_profesional || 'N/A'}`);
          console.log(`    Aprobado: ${p.perfil_aprobado}`);
          console.log(`    Verificado: ${p.documentos_verificados}`);
        });
      }
    }

    // Prueba 4: Consulta con JOIN (como en la Edge Function)
    console.log('\n━'.repeat(80));
    console.log('📋 PRUEBA 4: Consulta con JOIN (como en Edge Function)');
    const { data: profesionales, error: errorProfesionales } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
        email,
        rol,
        esta_activo,
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
        PerfilProfesional!inner (
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

    if (errorProfesionales) {
      console.error('❌ Error consultando con JOIN:', errorProfesionales);
      console.error('Detalles del error:', JSON.stringify(errorProfesionales, null, 2));
    } else {
      console.log(`✅ Profesionales encontrados con JOIN: ${profesionales?.length || 0}`);
      if (profesionales && profesionales.length > 0) {
        profesionales.forEach(p => {
          console.log(`\n  👤 ${p.nombre} ${p.apellido} (${p.email})`);
          console.log(`     Rol: ${p.rol}`);
          console.log(`     Activo: ${p.esta_activo}`);
          console.log(`     PerfilUsuario: ${p.PerfilUsuario ? 'SÍ' : 'NO'}`);
          console.log(`     PerfilProfesional: ${p.PerfilProfesional ? JSON.stringify(p.PerfilProfesional) : 'NO'}`);
        });
      }
    }

    // Prueba 5: Verificar usuario específico
    console.log('\n━'.repeat(80));
    console.log('📋 PRUEBA 5: Verificar usuario profesional@escuchodromo.com');
    const { data: usuarioEspecifico, error: errorEspecifico } = await supabase
      .from('Usuario')
      .select(`
        *,
        PerfilUsuario (*),
        PerfilProfesional (*)
      `)
      .eq('email', 'profesional@escuchodromo.com')
      .single();

    if (errorEspecifico) {
      console.error('❌ Error consultando usuario específico:', errorEspecifico);
    } else if (usuarioEspecifico) {
      console.log('✅ Usuario encontrado:');
      console.log(JSON.stringify(usuarioEspecifico, null, 2));
    } else {
      console.log('⚠️ Usuario no encontrado');
    }

  } catch (err) {
    console.error('💥 Error fatal:', err);
  }

  console.log('\n' + '━'.repeat(80));
  console.log('✅ Pruebas completadas\n');
}

// Ejecutar
testearEdgeFunction();
