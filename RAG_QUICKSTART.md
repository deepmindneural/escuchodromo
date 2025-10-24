# Quick Start: Sistema RAG con pgvector

## Resumen

Se han creado **3 migraciones SQL** para implementar un sistema RAG (Retrieval-Augmented Generation) con pgvector en Supabase.

## Migraciones Creadas

### 1. `20251025000004_habilitar_pgvector_rag.sql`
- Habilita extensión pgvector
- Crea tabla `ConocimientoClinico` (base de conocimiento vectorizada)
- Crea tabla `HistorialRAG` (registro de búsquedas)
- Índices HNSW para búsqueda vectorial rápida

### 2. `20251025000005_funciones_rag.sql`
- `buscar_conocimiento_similar()` - Búsqueda semántica
- `registrar_uso_conocimiento()` - Actualizar métricas
- `registrar_busqueda_rag()` - Auditoría de búsquedas
- `actualizar_feedback_rag()` - Feedback de usuarios
- `obtener_estadisticas_conocimiento()` - Dashboard de análisis
- `buscar_conocimiento_por_sintomas()` - Búsqueda por síntomas
- `obtener_conocimientos_recomendados()` - Sistema de recomendaciones

### 3. `20251025000006_seed_conocimiento_y_rls.sql`
- Políticas RLS para seguridad HIPAA-compliant
- Seed inicial con 5 conocimientos clínicos:
  1. Respiración 4-7-8 (técnica de ansiedad)
  2. Grounding 5-4-3-2-1 (técnica de ansiedad)
  3. Activación Conductual (técnica de depresión)
  4. Entendiendo la Ansiedad (psicoeducación)
  5. La Depresión No Es Tristeza (psicoeducación)

## Aplicar Migraciones

### Opción 1: Supabase CLI (Recomendado)

```bash
# Aplicar todas las migraciones pendientes
supabase db push

# O aplicar migraciones específicas
supabase migration up
```

### Opción 2: Dashboard de Supabase

1. Ve a tu proyecto en https://app.supabase.com
2. SQL Editor
3. Copia y pega el contenido de cada migración en orden:
   - Primero: `20251025000004_habilitar_pgvector_rag.sql`
   - Segundo: `20251025000005_funciones_rag.sql`
   - Tercero: `20251025000006_seed_conocimiento_y_rls.sql`
4. Ejecuta cada una con "Run"

### Opción 3: psql (PostgreSQL directo)

```bash
# Conectar a la base de datos
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Ejecutar migraciones
\i supabase/migrations/20251025000004_habilitar_pgvector_rag.sql
\i supabase/migrations/20251025000005_funciones_rag.sql
\i supabase/migrations/20251025000006_seed_conocimiento_y_rls.sql
```

## Verificar Instalación

```sql
-- 1. Verificar que pgvector está habilitado
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 2. Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('ConocimientoClinico', 'HistorialRAG');

-- 3. Verificar funciones RPC
SELECT proname FROM pg_proc
WHERE proname LIKE '%conocimiento%' OR proname LIKE '%rag%';

-- 4. Verificar seed (debe haber 5 registros)
SELECT id, titulo, categoria FROM "ConocimientoClinico";

-- 5. Verificar índice vectorial
SELECT indexname FROM pg_indexes
WHERE tablename = 'ConocimientoClinico' AND indexname = 'idx_conocimiento_embedding';
```

## Siguiente Paso: Generar Embeddings

Los 5 conocimientos iniciales **NO tienen embeddings** todavía (columna `embedding` es NULL).

### Script para generar embeddings

Crea `scripts/generar-embeddings.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function generarEmbeddings() {
  // Obtener conocimientos sin embedding
  const { data: conocimientos } = await supabase
    .from('ConocimientoClinico')
    .select('*')
    .is('embedding', null);

  console.log(`Generando embeddings para ${conocimientos.length} conocimientos...`);

  for (const conocimiento of conocimientos) {
    try {
      // Concatenar contenido relevante
      const textoCompleto = `${conocimiento.titulo}\n\n${conocimiento.descripcion_corta}\n\n${conocimiento.contenido}`;

      // Generar embedding
      const result = await model.embedContent(textoCompleto);
      const embedding = result.embedding.values;

      // Actualizar en BD
      const { error } = await supabase
        .from('ConocimientoClinico')
        .update({ embedding })
        .eq('id', conocimiento.id);

      if (error) throw error;

      console.log(`✓ Embedding generado para: ${conocimiento.titulo}`);
    } catch (error) {
      console.error(`✗ Error en ${conocimiento.titulo}:`, error);
    }
  }

  console.log('¡Embeddings generados!');
}

generarEmbeddings();
```

### Ejecutar script

```bash
# Instalar dependencias
npm install @google/generative-ai @supabase/supabase-js

# Configurar variables de entorno (.env)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
GEMINI_API_KEY=tu-gemini-api-key

# Ejecutar
npx tsx scripts/generar-embeddings.ts
```

## Probar el Sistema

### Test de búsqueda semántica (SQL)

```sql
-- Primero necesitas un embedding de prueba
-- (Genera uno con Gemini para el query "cómo controlar la ansiedad")

-- Ejemplo de búsqueda
SELECT
  titulo,
  categoria,
  descripcion_corta,
  similitud
FROM buscar_conocimiento_similar(
  '[0.123, 0.456, ...]'::vector(768), -- Embedding del query
  limite => 3,
  umbral_similitud => 0.7
);
```

### Test desde Edge Function

Ver `/docs/RAG_SISTEMA_CONOCIMIENTO_CLINICO.md` sección "Flujo de Uso"

## Estructura de Archivos

```
supabase/migrations/
├── 20251025000004_habilitar_pgvector_rag.sql   (Tablas + Índices)
├── 20251025000005_funciones_rag.sql            (Funciones RPC)
└── 20251025000006_seed_conocimiento_y_rls.sql  (Seed + RLS)

docs/
└── RAG_SISTEMA_CONOCIMIENTO_CLINICO.md         (Documentación completa)

scripts/
└── generar-embeddings.ts                        (Script de embeddings)
```

## Seguridad Implementada

✅ **Row Level Security (RLS)** habilitado en ambas tablas
✅ Usuarios solo ven su propio historial de búsquedas
✅ Conocimiento clínico es público para usuarios autenticados
✅ Solo service_role y admins pueden modificar conocimientos
✅ Auditoría completa de accesos (cumplimiento HIPAA)

## Métricas y Monitoreo

### Queries útiles para dashboard admin

```sql
-- Top 10 conocimientos más útiles
SELECT titulo, promedio_utilidad, veces_usada
FROM "ConocimientoClinico"
ORDER BY promedio_utilidad DESC
LIMIT 10;

-- Tasa de utilidad de RAG
SELECT
  COUNT(*) as total_busquedas,
  COUNT(CASE WHEN fue_util = true THEN 1 END) as busquedas_utiles,
  ROUND(COUNT(CASE WHEN fue_util = true THEN 1 END)::numeric / COUNT(*) * 100, 2) as tasa_utilidad
FROM "HistorialRAG"
WHERE fue_util IS NOT NULL;

-- Queries sin resultados (gaps de conocimiento)
SELECT query_original, COUNT(*) as veces
FROM "HistorialRAG"
WHERE cantidad_resultados = 0
GROUP BY query_original
ORDER BY veces DESC
LIMIT 20;
```

## Expansión Futura

Actualmente hay **5 conocimientos** en la base. Plan de expansión:

**Objetivo:** 80-100 conocimientos cubriendo:
- Técnicas de ansiedad (15-20)
- Técnicas de depresión (10-15)
- Psicoeducación (15-20)
- Mindfulness (10-12)
- Habilidades DBT (10-12)
- Manejo de crisis (5-8)

Ver `/docs/RAG_SISTEMA_CONOCIMIENTO_CLINICO.md` sección "Expansión de Conocimiento"

## Troubleshooting

### Error: "extension 'vector' does not exist"
**Solución:** Ejecuta `CREATE EXTENSION vector;` manualmente o verifica que tu instancia de PostgreSQL soporta pgvector.

### Error: "relation 'ConocimientoClinico' does not exist"
**Solución:** Asegúrate de ejecutar las migraciones en orden (004 → 005 → 006).

### Búsquedas devuelven 0 resultados
**Solución:** Verifica que los embeddings estén generados (`embedding IS NOT NULL`). Si no, ejecuta el script de generación.

### Performance lento en búsquedas
**Solución:**
1. Verifica que el índice HNSW esté creado: `SELECT * FROM pg_indexes WHERE indexname = 'idx_conocimiento_embedding';`
2. Considera aumentar `maintenance_work_mem` para construcción de índice más rápida
3. Si hay >10,000 registros, considera particionar por categoría

## Contacto y Soporte

Para preguntas sobre la implementación:
- Ver documentación completa: `/docs/RAG_SISTEMA_CONOCIMIENTO_CLINICO.md`
- Revisar código de ejemplo en la documentación
- Consultar logs de Supabase para errores de RLS o funciones

---

**Estado:** ✅ Migraciones creadas, listas para aplicar
**Próximo paso:** Aplicar migraciones y generar embeddings iniciales
**Versión:** 1.0.0
**Fecha:** 2025-10-25
