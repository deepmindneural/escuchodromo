/**
 * Script para ejecutar el fix de RLS en Supabase
 * Este script usa el Service Role Key para ejecutar el SQL directamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer el script SQL
const sqlScript = fs.readFileSync(
  path.join(__dirname, 'FIX_RLS_RECURSION.sql'),
  'utf8'
);

// Crear cliente con Service Role Key (tiene permisos para modificar RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvezncgcdsjntzrzztrj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no está configurada');
  console.log('Por favor, ejecuta el script en el SQL Editor de Supabase manualmente');
  console.log('Ya abrimos el editor en tu navegador.');
  console.log('\nCopia y pega el contenido de FIX_RLS_RECURSION.sql');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ejecutarFix() {
  try {
    console.log('🔧 Ejecutando fix de políticas RLS...\n');

    // Dividir el script en statements individuales
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let errorCount = 0;
    let successCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Saltar comentarios
      if (statement.trim().startsWith('--')) continue;

      try {
        console.log(`Ejecutando statement ${i + 1}/${statements.length}...`);

        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          console.error(`❌ Error en statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error ejecutando statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Completado: ${successCount} statements ejecutados correctamente`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} statements fallaron`);
    }

    // Verificar el resultado
    console.log('\n🔍 Verificando políticas...');
    await verificarPoliticas();

  } catch (error) {
    console.error('❌ Error ejecutando el fix:', error);
    console.log('\n📝 Solución alternativa:');
    console.log('1. Ve al SQL Editor que se abrió en tu navegador');
    console.log('2. Copia y pega el contenido de FIX_RLS_RECURSION.sql');
    console.log('3. Haz click en "Run" para ejecutarlo');
  }
}

async function verificarPoliticas() {
  const { data, error } = await supabase
    .from('Usuario')
    .select('id, nombre, rol')
    .eq('rol', 'TERAPEUTA')
    .limit(1);

  if (error) {
    console.error('❌ Error verificando políticas:', error.message);
    if (error.message.includes('infinite recursion')) {
      console.log('\n⚠️  La recursión infinita AÚN EXISTE');
      console.log('Por favor, ejecuta el script manualmente en el SQL Editor');
    }
  } else {
    console.log('✅ Las políticas funcionan correctamente!');
    console.log(`   Profesionales encontrados: ${data?.length || 0}`);
  }
}

// Ejecutar
ejecutarFix();
