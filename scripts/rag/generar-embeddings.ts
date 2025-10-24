/**
 * Script para generar embeddings de conocimientos clínicos
 * usando Gemini text-embedding-004
 *
 * Uso:
 *   npx tsx scripts/rag/generar-embeddings.ts
 *
 * Requisitos:
 *   - Variables de entorno configuradas (.env)
 *   - Migraciones RAG aplicadas
 *   - API key de Gemini válida
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.error('Necesitas configurar:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - GEMINI_API_KEY');
  process.exit(1);
}

// Inicializar clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

interface ConocimientoClinico {
  id: string;
  titulo: string;
  descripcion_corta: string;
  contenido: string;
  categoria: string;
  embedding: number[] | null;
}

/**
 * Genera embedding para un texto usando Gemini
 */
async function generarEmbedding(texto: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(texto);
    return result.embedding.values;
  } catch (error) {
    console.error('Error al generar embedding:', error);
    throw error;
  }
}

/**
 * Construye el texto completo para embeddings
 * (combinando título, descripción y contenido)
 */
function construirTextoParaEmbed(conocimiento: ConocimientoClinico): string {
  return `
Título: ${conocimiento.titulo}

Descripción: ${conocimiento.descripcion_corta}

Categoría: ${conocimiento.categoria}

Contenido completo:
${conocimiento.contenido}
  `.trim();
}

/**
 * Procesa un conocimiento: genera embedding y actualiza en BD
 */
async function procesarConocimiento(
  conocimiento: ConocimientoClinico,
  index: number,
  total: number
): Promise<void> {
  try {
    console.log(`\n[${index + 1}/${total}] Procesando: ${conocimiento.titulo}`);
    console.log(`   Categoría: ${conocimiento.categoria}`);

    // Construir texto para embedding
    const textoCompleto = construirTextoParaEmbed(conocimiento);
    console.log(`   Longitud del texto: ${textoCompleto.length} caracteres`);

    // Generar embedding
    console.log('   Generando embedding con Gemini...');
    const tiempoInicio = Date.now();
    const embedding = await generarEmbedding(textoCompleto);
    const tiempoTranscurrido = Date.now() - tiempoInicio;

    console.log(`   ✓ Embedding generado (${embedding.length} dimensiones) en ${tiempoTranscurrido}ms`);

    // Actualizar en base de datos
    console.log('   Actualizando en Supabase...');
    const { error } = await supabase
      .from('ConocimientoClinico')
      .update({ embedding })
      .eq('id', conocimiento.id);

    if (error) {
      throw new Error(`Error al actualizar en BD: ${error.message}`);
    }

    console.log('   ✓ Actualizado exitosamente');
  } catch (error) {
    console.error(`   ✗ Error procesando "${conocimiento.titulo}":`, error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Generador de Embeddings para Conocimiento Clínico        ║');
  console.log('║  Modelo: Gemini text-embedding-004 (768 dimensiones)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // 1. Obtener conocimientos sin embedding
    console.log('\n📋 Buscando conocimientos sin embedding...');
    const { data: conocimientosSinEmbed, error: errorFetch } = await supabase
      .from('ConocimientoClinico')
      .select('id, titulo, descripcion_corta, contenido, categoria, embedding')
      .is('embedding', null)
      .eq('activo', true);

    if (errorFetch) {
      throw new Error(`Error al obtener conocimientos: ${errorFetch.message}`);
    }

    if (!conocimientosSinEmbed || conocimientosSinEmbed.length === 0) {
      console.log('✓ No hay conocimientos sin embedding. Todos están actualizados.');
      console.log('\nVerificando total de conocimientos...');

      const { count, error: errorCount } = await supabase
        .from('ConocimientoClinico')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      if (!errorCount && count) {
        console.log(`✓ Total de conocimientos activos: ${count}`);

        const { count: countConEmbed, error: errorCountEmbed } = await supabase
          .from('ConocimientoClinico')
          .select('*', { count: 'exact', head: true })
          .not('embedding', 'is', null)
          .eq('activo', true);

        if (!errorCountEmbed && countConEmbed) {
          console.log(`✓ Conocimientos con embedding: ${countConEmbed}`);
        }
      }

      return;
    }

    console.log(`\n✓ Encontrados ${conocimientosSinEmbed.length} conocimientos sin embedding`);
    console.log('\nDetalles:');
    conocimientosSinEmbed.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.categoria}] ${c.titulo}`);
    });

    // 2. Confirmar antes de proceder
    console.log('\n⚠️  Este proceso consumirá tokens de la API de Gemini');
    console.log('   Estimado: ~1-2 segundos por conocimiento');
    console.log(`   Tiempo total estimado: ~${conocimientosSinEmbed.length * 2} segundos\n`);

    // 3. Procesar cada conocimiento
    console.log('🚀 Iniciando generación de embeddings...\n');
    const errores: string[] = [];

    for (let i = 0; i < conocimientosSinEmbed.length; i++) {
      try {
        await procesarConocimiento(conocimientosSinEmbed[i], i, conocimientosSinEmbed.length);

        // Delay entre requests para no saturar API
        if (i < conocimientosSinEmbed.length - 1) {
          console.log('   Esperando 500ms antes del siguiente...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        errores.push(`${conocimientosSinEmbed[i].titulo}: ${error}`);
        console.error(`\n⚠️  Continuando con el siguiente conocimiento...\n`);
      }
    }

    // 4. Resumen final
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN FINAL                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✓ Procesados: ${conocimientosSinEmbed.length - errores.length}/${conocimientosSinEmbed.length}`);

    if (errores.length > 0) {
      console.log(`\n✗ Errores: ${errores.length}`);
      errores.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    } else {
      console.log('\n🎉 Todos los embeddings generados exitosamente!');
    }

    // 5. Verificar estado final
    console.log('\n📊 Verificando estado final...');
    const { count: totalActivos } = await supabase
      .from('ConocimientoClinico')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    const { count: totalConEmbed } = await supabase
      .from('ConocimientoClinico')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)
      .eq('activo', true);

    console.log(`\nEstado de la base de conocimiento:`);
    console.log(`  - Total conocimientos activos: ${totalActivos || 0}`);
    console.log(`  - Con embeddings: ${totalConEmbed || 0}`);
    console.log(`  - Sin embeddings: ${(totalActivos || 0) - (totalConEmbed || 0)}`);

    if (totalActivos === totalConEmbed) {
      console.log('\n✅ Base de conocimiento 100% vectorizada');
      console.log('   El sistema RAG está listo para usar!\n');
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
main()
  .then(() => {
    console.log('\n✓ Script completado exitosamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
