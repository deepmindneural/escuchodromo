/**
 * Script de verificación del sistema RAG
 * Prueba búsqueda semántica de conocimiento clínico
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDgDUvZSVWz58pgBCTrgCA-uDLk0UZksYg';
const SUPABASE_URL = 'https://cvezncgcdsjntzrzztrj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function generarEmbedding(texto) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: texto }]
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Error al generar embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding?.values || null;
}

async function buscarConocimiento(query, limite = 3, umbral = 0.65) {
  // Generar embedding del query
  console.log(`🔍 Generando embedding para: "${query}"`);
  const embedding = await generarEmbedding(query);

  if (!embedding || embedding.length !== 768) {
    throw new Error('Embedding inválido');
  }

  console.log(`✅ Embedding generado (768 dimensiones)\n`);

  // Llamar a la función RPC de búsqueda
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/buscar_conocimiento_similar`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query_embedding: `[${embedding.join(',')}]`,
        limite,
        umbral_similitud: umbral
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error en búsqueda RAG: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('🧪 VERIFICACIÓN DEL SISTEMA RAG\n');
  console.log('='.repeat(60));
  console.log('\n');

  // Prueba 1: Búsqueda de técnicas de ansiedad
  console.log('📋 PRUEBA 1: Búsqueda de técnicas de ansiedad\n');
  try {
    const resultados1 = await buscarConocimiento(
      'Me siento muy ansioso y no puedo respirar bien, necesito ayuda para calmarme',
      3,
      0.65
    );

    console.log(`✅ Encontrados ${resultados1.length} resultados:\n`);
    resultados1.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo}`);
      console.log(`      Similitud: ${(r.similitud * 100).toFixed(1)}%`);
      console.log(`      Contenido: ${r.contenido.substring(0, 150)}...\n`);
    });
  } catch (error) {
    console.error('❌ Error en Prueba 1:', error.message);
  }

  console.log('='.repeat(60));
  console.log('\n');

  // Prueba 2: Búsqueda de técnicas de depresión
  console.log('📋 PRUEBA 2: Búsqueda de técnicas de depresión\n');
  try {
    const resultados2 = await buscarConocimiento(
      'Me siento sin energía, no tengo ganas de hacer nada, creo que tengo depresión',
      3,
      0.65
    );

    console.log(`✅ Encontrados ${resultados2.length} resultados:\n`);
    resultados2.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo}`);
      console.log(`      Similitud: ${(r.similitud * 100).toFixed(1)}%`);
      console.log(`      Contenido: ${r.contenido.substring(0, 150)}...\n`);
    });
  } catch (error) {
    console.error('❌ Error en Prueba 2:', error.message);
  }

  console.log('='.repeat(60));
  console.log('\n');

  // Prueba 3: Psicoeducación
  console.log('📋 PRUEBA 3: Búsqueda de psicoeducación\n');
  try {
    const resultados3 = await buscarConocimiento(
      '¿Por qué me siento así? ¿Qué es la ansiedad?',
      3,
      0.65
    );

    console.log(`✅ Encontrados ${resultados3.length} resultados:\n`);
    resultados3.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo}`);
      console.log(`      Similitud: ${(r.similitud * 100).toFixed(1)}%`);
      console.log(`      Contenido: ${r.contenido.substring(0, 150)}...\n`);
    });
  } catch (error) {
    console.error('❌ Error en Prueba 3:', error.message);
  }

  console.log('='.repeat(60));
  console.log('\n✨ Verificación completada!\n');
}

main().catch(console.error);
