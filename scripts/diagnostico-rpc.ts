/**
 * Script de diagnóstico para verificar funciones RPC de Supabase
 * Ejecutar con: npx tsx scripts/diagnostico-rpc.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('DEBUG - Variables cargadas:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Presente' : '❌ No presente');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO DE FUNCIONES RPC DE SUPABASE\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey?.substring(0, 20) + '...\n');

  // Lista de funciones RPC a verificar
  const funcionesRPC = [
    {
      nombre: 'obtener_usuarios_con_estadisticas',
      params: {
        p_limit: 5,
        p_offset: 0,
        p_busqueda: null,
        p_rol_filtro: null,
        p_estado_filtro: null,
      },
    },
    {
      nombre: 'contar_usuarios_filtrados',
      params: {
        p_busqueda: null,
        p_rol_filtro: null,
        p_estado_filtro: null,
      },
    },
    {
      nombre: 'obtener_estadisticas_dashboard',
      params: {},
    },
    {
      nombre: 'obtener_llamadas_gemini_hoy',
      params: {},
    },
  ];

  for (const funcion of funcionesRPC) {
    console.log(`\n📦 Probando función: ${funcion.nombre}`);
    console.log(`   Parámetros:`, JSON.stringify(funcion.params, null, 2));

    try {
      const { data, error } = await supabase.rpc(funcion.nombre, funcion.params);

      if (error) {
        console.log(`   ❌ ERROR:`, error);
        console.log(`      Código: ${error.code}`);
        console.log(`      Mensaje: ${error.message}`);
        console.log(`      Detalles: ${error.details}`);
        console.log(`      Hint: ${error.hint}`);
      } else {
        console.log(`   ✅ ÉXITO`);
        console.log(`   Datos retornados:`, data);

        if (Array.isArray(data)) {
          console.log(`   Total de registros: ${data.length}`);
        }
      }
    } catch (err: any) {
      console.log(`   ❌ EXCEPCIÓN:`, err.message);
    }
  }

  // Verificar conexión básica
  console.log('\n\n🔗 Verificando conexión básica a Supabase...');
  try {
    const { data, error } = await supabase.from('Usuario').select('count').limit(1);

    if (error) {
      console.log('❌ Error al conectar:', error);
    } else {
      console.log('✅ Conexión exitosa a Supabase');
    }
  } catch (err: any) {
    console.log('❌ Excepción al conectar:', err.message);
  }

  console.log('\n\n✨ Diagnóstico completado\n');
}

diagnosticar().catch(console.error);
