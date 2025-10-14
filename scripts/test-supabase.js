require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔐 Usando credenciales:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey?.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Verificando conexión a Supabase...\n');

  try {
    // Primero, intentar hacer una query simple para ver si la conexión funciona
    console.log('🔌 Probando conexión básica...');

    // Listar todas las tablas disponibles
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');

    // Si no hay RPC, intento con una consulta directa
    console.log('📋 Intentando consultar tablas conocidas...\n');

    const tablesToTest = [
      'Usuario',
      'PerfilUsuario',
      'Conversacion',
      'Mensaje',
      'SesionPublica',
      'MensajePublico',
      'Test',
      'Pregunta',
      'Evaluacion',
      'Recomendacion',
      'RegistroAnimo',
      'Notificacion',
      'Pago',
      'ConfiguracionIA'
    ];

    for (const tableName of tablesToTest) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Existe`);
      }
    }

    // Intentar obtener usuarios con service role
    console.log('\n👥 Probando consulta de usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('Usuario')
      .select('*')
      .limit(1);

    if (usuariosError) {
      console.log(`❌ Error: ${usuariosError.message}`);
      console.log(`   Código: ${usuariosError.code}`);
      console.log(`   Detalles: ${usuariosError.details}`);
    } else {
      console.log(`✅ Usuarios consultados: ${usuarios?.length || 0}`);
    }

    console.log('\n✨ Verificación completada!\n');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testSupabase();
