/**
 * Script para aplicar migraciones usando la REST API de Supabase
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cvezncgcdsjntzrzztrj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2NjY2NywiZXhwIjoyMDc2MDQyNjY3fQ.oXTNtdzb5S316LlNguKOZzssvax--BxT1ypZBgjwRPs';

async function ejecutarSQL(sql, nombre) {
  console.log(`\n🔄 Ejecutando: ${nombre}...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log(`✅ ${nombre} ejecutado correctamente`);
    return true;
  } catch (err) {
    console.error(`❌ Error en ${nombre}:`, err.message);

    // Si el RPC no existe, intentar con queries individuales
    if (err.message.includes('exec_sql') || err.message.includes('not found')) {
      console.log('⚠️  La función RPC exec_sql no está disponible');
      console.log('📋 Por favor, copia y pega este SQL en el SQL Editor de Supabase Dashboard:\n');
      console.log('='.repeat(80));
      console.log(sql.substring(0, 500) + '...');
      console.log('='.repeat(80));
      return false;
    }

    return false;
  }
}

async function aplicarMigraciones() {
  console.log('🚀 Iniciando aplicación de migraciones a Supabase...\n');
  console.log('🌐 URL:', SUPABASE_URL);
  console.log('🔑 Service Role configurado\n');

  // 1. Schema inicial
  const schemaSQL = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20250114000000_initial_schema.sql'),
    'utf-8'
  );

  const exitoSchema = await ejecutarSQL(schemaSQL, 'Schema Inicial');

  // 2. RLS Policies
  const rlsSQL = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20250114000001_rls_policies.sql'),
    'utf-8'
  );

  const exitoRLS = await ejecutarSQL(rlsSQL, 'Políticas RLS');

  // 3. Seed Data
  const seedSQL = fs.readFileSync(
    path.join(__dirname, '../supabase/seed.sql'),
    'utf-8'
  );

  const exitoSeed = await ejecutarSQL(seedSQL, 'Seed Data');

  if (!exitoSchema || !exitoRLS) {
    console.log('\n\n❌ No se pudo ejecutar automáticamente.\n');
    console.log('📋 SOLUCIÓN: Copia y pega manualmente en Supabase Dashboard:\n');
    console.log('1. Ve a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new');
    console.log('2. Copia el contenido de: supabase/migrations/20250114000000_initial_schema.sql');
    console.log('3. Pégalo y ejecuta con el botón "Run"');
    console.log('4. Repite con: supabase/migrations/20250114000001_rls_policies.sql');
    console.log('5. Repite con: supabase/seed.sql\n');
    process.exit(1);
  }

  console.log('\n✨ ¡Migraciones aplicadas correctamente!');
}

aplicarMigraciones().catch(console.error);
