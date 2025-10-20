/**
 * Script para listar todos los profesionales que existen
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listarProfesionales() {
  console.log('🔍 Buscando profesionales en la base de datos...\n');

  // ==========================================
  // 1. Listar TODOS los usuarios con rol TERAPEUTA
  // ==========================================
  console.log('📋 USUARIOS con rol TERAPEUTA:\n');
  const { data: usuarios, error: usuariosError } = await supabase
    .from('Usuario')
    .select('id, nombre, apellido, email, rol, esta_activo')
    .eq('rol', 'TERAPEUTA');

  if (usuariosError) {
    console.error('❌ Error:', usuariosError);
    return;
  }

  if (!usuarios || usuarios.length === 0) {
    console.log('⚠️ NO hay usuarios con rol TERAPEUTA\n');
  } else {
    console.log(`✅ Encontrados ${usuarios.length} usuarios con rol TERAPEUTA:\n`);
    usuarios.forEach((u, i) => {
      console.log(`${i + 1}. ${u.nombre} ${u.apellido || ''} (${u.email})`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Activo: ${u.esta_activo}`);
      console.log('');
    });
  }

  // ==========================================
  // 2. Listar TODOS los PerfilUsuario
  // ==========================================
  console.log('━'.repeat(80));
  console.log('\n📋 PERFILES DE USUARIO:\n');
  const { data: perfiles, error: perfilesError } = await supabase
    .from('PerfilUsuario')
    .select('*');

  if (perfilesError) {
    console.error('❌ Error:', perfilesError);
    return;
  }

  if (!perfiles || perfiles.length === 0) {
    console.log('⚠️ NO hay perfiles de usuario en la base de datos\n');
  } else {
    console.log(`✅ Encontrados ${perfiles.length} perfiles:\n`);
    perfiles.forEach((p, i) => {
      console.log(`${i + 1}. Perfil para usuario_id: ${p.usuario_id}`);
      console.log(`   Especialidad: ${p.especialidad || 'N/A'}`);
      console.log(`   Experiencia: ${p.experiencia_anos || 0} años`);
      console.log(`   Tarifa 30min: ${p.tarifa_30min || 'N/A'}`);
      console.log(`   Tarifa 60min: ${p.tarifa_60min || 'N/A'}`);
      console.log(`   Disponible: ${p.disponible ?? true}`);
      console.log('');
    });
  }

  // ==========================================
  // 3. Listar PERFILES PROFESIONALES
  // ==========================================
  console.log('━'.repeat(80));
  console.log('\n📋 PERFILES PROFESIONALES:\n');
  const { data: profProfiles, error: profError } = await supabase
    .from('PerfilProfesional')
    .select('*');

  if (profError) {
    console.error('❌ Error:', profError);
    return;
  }

  if (!profProfiles || profProfiles.length === 0) {
    console.log('⚠️ NO hay perfiles profesionales en la base de datos\n');
  } else {
    console.log(`✅ Encontrados ${profProfiles.length} perfiles profesionales:\n`);
    profProfiles.forEach((p, i) => {
      console.log(`${i + 1}. Perfil para usuario_id: ${p.usuario_id}`);
      console.log(`   Aprobado: ${p.perfil_aprobado}`);
      console.log(`   Documentos verificados: ${p.documentos_verificados}`);
      console.log(`   Tarifa por sesión: ${p.tarifa_por_sesion || 'N/A'}`);
      console.log('');
    });
  }

  // ==========================================
  // 4. JOIN: Usuarios + PerfilUsuario
  // ==========================================
  console.log('━'.repeat(80));
  console.log('\n📋 PROFESIONALES COMPLETOS (Usuario + PerfilUsuario):\n');

  for (const usuario of usuarios || []) {
    const perfil = perfiles?.find(p => p.usuario_id === usuario.id);
    const perfilProf = profProfiles?.find(p => p.usuario_id === usuario.id);

    console.log(`\n👤 ${usuario.nombre} ${usuario.apellido || ''}`);
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Activo: ${usuario.esta_activo ? '✅' : '❌'}`);
    console.log(`   PerfilUsuario: ${perfil ? '✅ Existe' : '❌ NO existe'}`);
    if (perfil) {
      console.log(`      - Especialidad: ${perfil.especialidad || 'N/A'}`);
      console.log(`      - Tarifa 60min: ${perfil.tarifa_60min || 'N/A'}`);
    }
    console.log(`   PerfilProfesional: ${perfilProf ? '✅ Existe' : '❌ NO existe'}`);
    if (perfilProf) {
      console.log(`      - Aprobado: ${perfilProf.perfil_aprobado ? '✅' : '❌'}`);
      console.log(`      - Verificado: ${perfilProf.documentos_verificados ? '✅' : '❌'}`);
    }
  }

  // ==========================================
  // 5. SQL para crear profesional de prueba
  // ==========================================
  console.log('\n' + '━'.repeat(80));
  console.log('\n📝 SOLUCIÓN: Si no hay profesionales, ejecuta este SQL:\n');
  console.log(`
-- 1. Crear usuario terapeuta
INSERT INTO "Usuario" (id, nombre, apellido, email, rol, esta_activo)
VALUES (
  gen_random_uuid(),
  'María',
  'González',
  'maria.gonzalez@escuchodromo.com',
  'TERAPEUTA',
  true
) RETURNING id;

-- Guarda el ID retornado, lo necesitarás para los siguientes pasos
-- Ejemplo: 'abc123...'

-- 2. Crear PerfilUsuario (reemplaza 'TU_ID_AQUI' con el ID del paso 1)
INSERT INTO "PerfilUsuario" (usuario_id, especialidad, experiencia_anos, tarifa_30min, tarifa_60min, disponible)
VALUES (
  'TU_ID_AQUI',
  'Psicología Clínica',
  8,
  80000,
  150000,
  true
);

-- 3. Crear PerfilProfesional (reemplaza 'TU_ID_AQUI')
INSERT INTO "PerfilProfesional" (usuario_id, perfil_aprobado, documentos_verificados, tarifa_por_sesion)
VALUES (
  'TU_ID_AQUI',
  true,
  true,
  150000
);

-- 4. Crear horarios (reemplaza 'PERFIL_PROFESIONAL_ID' con el ID del perfil profesional)
-- Primero obtén el ID del perfil profesional:
-- SELECT id FROM "PerfilProfesional" WHERE usuario_id = 'TU_ID_AQUI';

INSERT INTO "HorarioProfesional" (perfil_profesional_id, dia_semana, hora_inicio, hora_fin, activo)
VALUES
  ('PERFIL_PROFESIONAL_ID', 1, '09:00', '17:00', true),  -- Lunes
  ('PERFIL_PROFESIONAL_ID', 2, '09:00', '17:00', true),  -- Martes
  ('PERFIL_PROFESIONAL_ID', 3, '09:00', '17:00', true),  -- Miércoles
  ('PERFIL_PROFESIONAL_ID', 4, '09:00', '17:00', true),  -- Jueves
  ('PERFIL_PROFESIONAL_ID', 5, '09:00', '17:00', true);  -- Viernes
  `);
}

listarProfesionales().catch(console.error);
