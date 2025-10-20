/**
 * Script para verificar foreign keys y queries de Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  console.log('🔍 Testing different query approaches...\n');

  const profesionalId = '3ad0329a-3505-4c0c-a0d3-9cc55a719023';

  // ==========================================
  // TEST 1: Sin especificar FK (ambiguo)
  // ==========================================
  console.log('📋 TEST 1: Query sin especificar FK');
  try {
    const { data, error } = await supabase
      .from('Usuario')
      .select('id, nombre, apellido, PerfilUsuario(*)')
      .eq('id', profesionalId)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success:', data);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }

  console.log('\n' + '━'.repeat(80) + '\n');

  // ==========================================
  // TEST 2: Con FK especificado
  // ==========================================
  console.log('📋 TEST 2: Query con FK PerfilUsuario_usuario_id_fkey');
  try {
    const { data, error } = await supabase
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
      .eq('id', profesionalId)
      .eq('rol', 'TERAPEUTA')
      .eq('esta_activo', true)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success:', data);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }

  console.log('\n' + '━'.repeat(80) + '\n');

  // ==========================================
  // TEST 3: Query inversa (desde PerfilUsuario)
  // ==========================================
  console.log('📋 TEST 3: Query inversa desde PerfilUsuario');
  try {
    const { data, error } = await supabase
      .from('PerfilUsuario')
      .select(`
        *,
        Usuario!PerfilUsuario_usuario_id_fkey (
          id,
          nombre,
          apellido,
          rol,
          esta_activo
        )
      `)
      .eq('usuario_id', profesionalId);

    if (error) {
      console.error('❌ Error:', error);
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success:', data);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }

  console.log('\n' + '━'.repeat(80) + '\n');

  // ==========================================
  // TEST 4: Sin filtros de rol/activo
  // ==========================================
  console.log('📋 TEST 4: Query básica sin filtros extra');
  try {
    const { data, error } = await supabase
      .from('Usuario')
      .select(`
        id,
        nombre,
        apellido,
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
        )
      `)
      .eq('id', profesionalId)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success:', data);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }

  console.log('\n' + '━'.repeat(80) + '\n');

  // ==========================================
  // TEST 5: Verificar si PerfilUsuario existe
  // ==========================================
  console.log('📋 TEST 5: Verificar si PerfilUsuario existe para este usuario');
  try {
    const { data, error, count } = await supabase
      .from('PerfilUsuario')
      .select('*', { count: 'exact' })
      .eq('usuario_id', profesionalId);

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log(`✅ PerfilUsuario encontrados: ${count}`);
      console.log('Datos:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }

  console.log('\n' + '━'.repeat(80) + '\n');

  // ==========================================
  // TEST 6: Verificar Usuario
  // ==========================================
  console.log('📋 TEST 6: Verificar datos del Usuario');
  try {
    const { data, error } = await supabase
      .from('Usuario')
      .select('*')
      .eq('id', profesionalId)
      .single();

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Usuario encontrado:');
      console.log('   ID:', data.id);
      console.log('   Nombre:', data.nombre, data.apellido);
      console.log('   Email:', data.email);
      console.log('   Rol:', data.rol);
      console.log('   Activo:', data.esta_activo);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }
}

// Ejecutar
testQueries().catch(console.error);
