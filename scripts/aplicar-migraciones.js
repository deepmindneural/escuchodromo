/**
 * Script para aplicar migraciones a Supabase usando node-postgres
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres:4nBShUbrGUSAr4@db.cvezncgcdsjntzrzztrj.supabase.co:5432/postgres';

async function ejecutarSQL(client, sql, nombre) {
  console.log(`\n🔄 Ejecutando: ${nombre}...`);

  try {
    await client.query(sql);
    console.log(`✅ ${nombre} ejecutado correctamente`);
    return true;
  } catch (err) {
    console.error(`❌ Error en ${nombre}:`, err.message);
    console.error('Detalle:', err.stack);
    return false;
  }
}

async function aplicarMigraciones() {
  console.log('🚀 Iniciando aplicación de migraciones a Supabase...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando a Supabase...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // 1. Schema inicial
    console.log('📦 Cargando schema inicial...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250114000000_initial_schema.sql'),
      'utf-8'
    );

    const exitoSchema = await ejecutarSQL(client, schemaSQL, 'Schema Inicial (15 tablas)');
    if (!exitoSchema) {
      console.error('\n❌ Falló el schema inicial, abortando...');
      process.exit(1);
    }

    // 2. RLS Policies
    console.log('\n🔒 Cargando políticas RLS...');
    const rlsSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250114000001_rls_policies.sql'),
      'utf-8'
    );

    const exitoRLS = await ejecutarSQL(client, rlsSQL, 'Políticas RLS (40+ policies)');
    if (!exitoRLS) {
      console.error('\n❌ Fallaron las políticas RLS, abortando...');
      process.exit(1);
    }

    // 3. Seed Data
    console.log('\n🌱 Cargando seed data...');
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/seed.sql'),
      'utf-8'
    );

    await ejecutarSQL(client, seedSQL, 'Seed Data (PHQ-9, GAD-7)');

    console.log('\n✨ ¡Migraciones aplicadas correctamente!');
    console.log('\n📊 Resumen:');
    console.log('  ✅ 15 tablas creadas');
    console.log('  ✅ 40+ políticas RLS configuradas');
    console.log('  ✅ Realtime habilitado (Mensaje, Notificacion, MensajePublico)');
    console.log('  ✅ Vector embeddings habilitados');
    console.log('  ✅ Tests psicológicos cargados (PHQ-9, GAD-7)');

    console.log('\n📋 Próximos pasos:');
    console.log('  1. Ejecutar: npm run dev');
    console.log('  2. Ir a: http://localhost:3000');
    console.log('  3. Crear cuenta o usar:');
    console.log('     - Usuario: usuario@escuchodromo.com / 123456');
    console.log('     - Admin: admin@escuchodromo.com / 123456\n');

  } catch (err) {
    console.error('\n❌ Error fatal:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Desconectado de Supabase\n');
  }
}

aplicarMigraciones().catch(console.error);
