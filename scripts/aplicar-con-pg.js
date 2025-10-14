require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function aplicarMigracion() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando a PostgreSQL...\n');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../supabase/migracion-final-corregida.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Ejecutando migración...');
    console.log(`   Tamaño: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // Ejecutar el SQL
    await client.query(sql);

    console.log('✅ Migración aplicada exitosamente!\n');

    // Verificar tablas creadas
    console.log('🔍 Verificando tablas creadas...\n');

    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📊 Tablas en la base de datos:\n');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.tablename}`);
    });

    console.log(`\n📈 Total: ${result.rows.length} tablas creadas\n`);

    // Verificar tests insertados
    const tests = await client.query('SELECT codigo, nombre FROM "Test"');
    console.log('📝 Tests psicológicos:\n');
    tests.rows.forEach(test => {
      console.log(`   ✅ ${test.codigo}: ${test.nombre}`);
    });

    console.log('\n🎉 Proceso completado exitosamente!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetalles completos:');
    console.error(error);
  } finally {
    await client.end();
  }
}

aplicarMigracion();
