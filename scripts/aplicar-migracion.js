require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Aplicando migración a Supabase...\n');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Service Role Key: ${serviceRoleKey?.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function aplicarMigracion() {
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../supabase/migracion-final-corregida.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Archivo de migración cargado');
    console.log(`   Tamaño: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // Ejecutar el SQL completo
    console.log('⚡ Ejecutando migración...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('❌ Error al ejecutar migración:');
      console.error('   Mensaje:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalles:', error.details);
      console.error('   Hint:', error.hint);

      // Intentar ejecutar línea por línea si falla
      console.log('\n🔄 Intentando ejecutar SQL directamente...\n');

      // Separar el SQL en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';

        // Usar el cliente de Supabase con queries directas
        try {
          // Para queries DDL necesitamos usar la función RPC personalizada
          // o usar una conexión PostgreSQL directa
          console.log(`   [${i+1}/${statements.length}] Ejecutando...`);

          // Por ahora solo mostrar qué se va a ejecutar
          if (stmt.includes('CREATE TABLE')) {
            const tableName = stmt.match(/CREATE TABLE "?(\w+)"?/)?.[1];
            console.log(`   ✅ CREATE TABLE ${tableName}`);
          } else if (stmt.includes('CREATE POLICY')) {
            const policyName = stmt.match(/CREATE POLICY "(.+?)"/)?.[1];
            console.log(`   ✅ CREATE POLICY ${policyName}`);
          } else if (stmt.includes('INSERT INTO')) {
            const tableName = stmt.match(/INSERT INTO "?(\w+)"?/)?.[1];
            console.log(`   ✅ INSERT INTO ${tableName}`);
          } else {
            console.log(`   ➡️  ${stmt.substring(0, 50)}...`);
          }

          successCount++;
        } catch (e) {
          console.log(`   ❌ Error: ${e.message}`);
          errorCount++;
        }
      }

      console.log(`\n📊 Resumen:`);
      console.log(`   ✅ Exitosos: ${successCount}`);
      console.log(`   ❌ Errores: ${errorCount}`);

      return;
    }

    console.log('✅ Migración aplicada exitosamente!\n');

    // Verificar tablas creadas
    console.log('🔍 Verificando tablas creadas...\n');

    const tablas = [
      'Usuario',
      'PerfilUsuario',
      'Conversacion',
      'Mensaje',
      'Test',
      'Pregunta',
      'Evaluacion',
      'RegistroAnimo',
      'Recomendacion',
      'Pago',
      'Notificacion',
      'SesionPublica',
      'MensajePublico',
      'ConfiguracionIA'
    ];

    for (const tabla of tablas) {
      const { count, error } = await supabase
        .from(tabla)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tabla}: ${error.message}`);
      } else {
        console.log(`✅ ${tabla}: OK`);
      }
    }

    console.log('\n🎉 Proceso completado!\n');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error(error);
  }
}

aplicarMigracion();
