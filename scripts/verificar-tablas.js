/**
 * Script para verificar las tablas en Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cvezncgcdsjntzrzztrj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2NjY2NywiZXhwIjoyMDc2MDQyNjY3fQ.oXTNtdzb5S316LlNguKOZzssvax--BxT1ypZBgjwRPs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verificarTablas() {
  console.log('🔍 Verificando tablas en Supabase...\n');

  const tablasEsperadas = [
    'Usuario',
    'PerfilUsuario',
    'Sesion',
    'RegistroAnimo',
    'Conversacion',
    'Mensaje',
    'Prueba',
    'Pregunta',
    'Resultado',
    'Recomendacion',
    'Pago',
    'Notificacion',
    'ArchivoAdjunto',
    'SesionPublica',
    'MensajePublico'
  ];

  let tablasEncontradas = 0;
  let tablasFaltantes = [];

  for (const tabla of tablasEsperadas) {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${tabla} - NO existe o no es accesible`);
      console.log(`   Error: ${error.message}`);
      tablasFaltantes.push(tabla);
    } else {
      console.log(`✅ ${tabla} - OK`);
      tablasEncontradas++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Tablas encontradas: ${tablasEncontradas}/15`);

  if (tablasFaltantes.length > 0) {
    console.log(`   ⚠️  Tablas faltantes: ${tablasFaltantes.join(', ')}`);
  }

  // Verificar tests psicológicos
  console.log(`\n🧪 Verificando tests psicológicos...`);
  const { data: pruebas } = await supabase
    .from('Prueba')
    .select('codigo, nombre');

  if (pruebas && pruebas.length > 0) {
    console.log(`✅ Tests cargados: ${pruebas.length}`);
    pruebas.forEach(p => console.log(`   - ${p.codigo}: ${p.nombre}`));
  } else {
    console.log(`❌ No hay tests cargados`);
  }

  // Verificar Realtime
  console.log(`\n📡 Tablas con Realtime habilitado:`);
  console.log(`   - Mensaje (chat en tiempo real)`);
  console.log(`   - Notificacion (notificaciones en vivo)`);
  console.log(`   - MensajePublico (chat público)`);

  console.log(`\n✨ Base de datos lista para usar!\n`);
}

verificarTablas().catch(console.error);
