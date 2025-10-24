/**
 * Script simple para generar embeddings de conocimiento clínico
 * Usa Gemini text-embedding-004 directamente
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBqW-iBEP51fG6tUJpXHFz3UhI2YxOlWuI';
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

async function main() {
  console.log('🚀 Generando embeddings para conocimiento clínico...\n');

  // Obtener conocimientos sin embedding
  const respuesta = await fetch(
    `${SUPABASE_URL}/rest/v1/ConocimientoClinico?select=id,titulo,contenido&embedding=is.null`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );

  const conocimientos = await respuesta.json();
  console.log(`📚 Encontrados ${conocimientos.length} conocimientos sin embedding\n`);

  for (const conocimiento of conocimientos) {
    console.log(`⚙️  Procesando: ${conocimiento.titulo}`);

    try {
      // Generar embedding del contenido completo
      const embedding = await generarEmbedding(conocimiento.contenido);

      if (!embedding || embedding.length !== 768) {
        console.error(`   ❌ Error: embedding inválido (longitud: ${embedding?.length})`);
        continue;
      }

      // Actualizar en Supabase
      const updateResp = await fetch(
        `${SUPABASE_URL}/rest/v1/ConocimientoClinico?id=eq.${conocimiento.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            embedding: `[${embedding.join(',')}]`
          })
        }
      );

      if (updateResp.ok) {
        console.log(`   ✅ Embedding generado y guardado (768 dimensiones)\n`);
      } else {
        console.error(`   ❌ Error al guardar: ${updateResp.status}`);
      }

      // Esperar 500ms entre llamadas (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✨ ¡Proceso completado!');
}

main().catch(console.error);
