# Scripts RAG - Gestión de Base de Conocimiento Clínico

Este directorio contiene scripts de utilidad para gestionar el sistema RAG (Retrieval-Augmented Generation) con pgvector.

## Scripts Disponibles

### 1. `generar-embeddings.ts`

**Descripción:** Genera embeddings vectoriales para todos los conocimientos clínicos que no los tienen usando Gemini text-embedding-004.

**Uso:**
```bash
npx tsx scripts/rag/generar-embeddings.ts
```

**Qué hace:**
1. Busca todos los conocimientos con `embedding IS NULL`
2. Para cada conocimiento:
   - Concatena título + descripción + contenido
   - Llama a Gemini text-embedding-004
   - Genera vector de 768 dimensiones
   - Actualiza el registro en la BD
3. Muestra resumen de éxito/errores

**Requisitos:**
- Variables de entorno configuradas (`.env`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
- Migraciones RAG aplicadas
- Conocimientos insertados en la tabla

**Tiempo estimado:**
- ~1-2 segundos por conocimiento
- Seed inicial (5 conocimientos): ~10 segundos

**Output esperado:**
```
╔════════════════════════════════════════════════════════════╗
║  Generador de Embeddings para Conocimiento Clínico        ║
║  Modelo: Gemini text-embedding-004 (768 dimensiones)      ║
╚════════════════════════════════════════════════════════════╝

📋 Buscando conocimientos sin embedding...

✓ Encontrados 5 conocimientos sin embedding

Detalles:
  1. [tecnica_ansiedad] Respiración 4-7-8 (Técnica de Weil)
  2. [tecnica_ansiedad] Grounding 5-4-3-2-1 (Técnica de Anclaje Sensorial)
  ...

🚀 Iniciando generación de embeddings...

[1/5] Procesando: Respiración 4-7-8 (Técnica de Weil)
   Categoría: tecnica_ansiedad
   Longitud del texto: 4523 caracteres
   Generando embedding con Gemini...
   ✓ Embedding generado (768 dimensiones) en 1234ms
   Actualizando en Supabase...
   ✓ Actualizado exitosamente
   Esperando 500ms antes del siguiente...

...

╔════════════════════════════════════════════════════════════╗
║                    RESUMEN FINAL                           ║
╚════════════════════════════════════════════════════════════╝

✓ Procesados: 5/5

🎉 Todos los embeddings generados exitosamente!

📊 Verificando estado final...

Estado de la base de conocimiento:
  - Total conocimientos activos: 5
  - Con embeddings: 5
  - Sin embeddings: 0

✅ Base de conocimiento 100% vectorizada
   El sistema RAG está listo para usar!
```

---

### 2. `verificar-rag.ts`

**Descripción:** Script de verificación completo que comprueba que el sistema RAG esté correctamente instalado y configurado.

**Uso:**
```bash
npx tsx scripts/rag/verificar-rag.ts
```

**Qué verifica:**
- ✓ Extensión pgvector habilitada
- ✓ Tablas creadas (ConocimientoClinico, HistorialRAG)
- ✓ Funciones RPC disponibles (7 funciones)
- ✓ Seed de conocimiento (mínimo 5 registros)
- ✓ Embeddings generados
- ✓ Políticas RLS configuradas
- ✓ Índices vectoriales (HNSW)
- ✓ Búsqueda semántica funcional

**Output esperado:**
```
╔════════════════════════════════════════════════════════════╗
║     Verificación del Sistema RAG - Supabase + pgvector    ║
╚════════════════════════════════════════════════════════════╝

📦 Verificando extensión pgvector...
✓ pgvector: Extensión habilitada correctamente

📊 Verificando tablas...
✓ Tabla ConocimientoClinico: Existe y es accesible
✓ Tabla HistorialRAG: Existe y es accesible

⚙️  Verificando funciones RPC...
✓ Función buscar_conocimiento_similar: Existe y está disponible
✓ Función registrar_uso_conocimiento: Existe y está disponible
✓ Función registrar_busqueda_rag: Existe y está disponible
✓ Función actualizar_feedback_rag: Existe y está disponible
✓ Función obtener_estadisticas_conocimiento: Existe y está disponible
✓ Función buscar_conocimiento_por_sintomas: Existe y está disponible
✓ Función obtener_conocimientos_recomendados: Existe y está disponible

🌱 Verificando seed de conocimiento...
✓ Seed inicial: 5 conocimientos encontrados
   Distribución por categoría: { tecnica_ansiedad: 2, tecnica_depresion: 1, psicoeducacion: 2 }
✓ Embeddings: Todos los conocimientos tienen embedding

   Conocimientos disponibles:
   1. 🔷 [tecnica_ansiedad] Respiración 4-7-8 (Técnica de Weil)
   2. 🔷 [tecnica_ansiedad] Grounding 5-4-3-2-1 (Técnica de Anclaje Sensorial)
   3. 🔷 [tecnica_depresion] Activación Conductual (Behavioral Activation)
   4. 🔷 [psicoeducacion] Entendiendo la Ansiedad: Tu Sistema de Supervivencia Sobreactivado
   5. 🔷 [psicoeducacion] La Depresión No Es Tristeza: Entendiendo la Depresión Clínica

🔒 Verificando políticas RLS...
✓ RLS ConocimientoClinico: Tabla con RLS configurado
✓ RLS HistorialRAG: Tabla con RLS configurado
✓ Permisos service_role: Service role tiene acceso completo

📈 Verificando índices vectoriales...
✓ Índice HNSW: No se puede verificar programáticamente (requiere permisos de sistema)

🔍 Prueba integral de búsqueda...
✓ Búsqueda semántica: Devolvió 3 resultados
   Resultados:
   1. Respiración 4-7-8 (Técnica de Weil) (similitud: 100.0%)
   2. Grounding 5-4-3-2-1 (Técnica de Anclaje Sensorial) (similitud: 78.3%)
   3. Entendiendo la Ansiedad: Tu Sistema de Supervivencia Sobreactivado (similitud: 72.1%)

╔════════════════════════════════════════════════════════════╗
║                     RESUMEN FINAL                          ║
╚════════════════════════════════════════════════════════════╝

Tests ejecutados: 18
✓ Pasados: 18
✗ Fallados: 0

Éxito: 100.0%

🎉 ¡Sistema RAG completamente funcional!
```

---

## Flujo de Instalación Recomendado

### Paso 1: Aplicar migraciones

```bash
# Desde la raíz del proyecto
supabase db push

# O manualmente desde el dashboard de Supabase
# Ejecutar en orden:
# 1. 20251025000004_habilitar_pgvector_rag.sql
# 2. 20251025000005_funciones_rag.sql
# 3. 20251025000006_seed_conocimiento_y_rls.sql
```

### Paso 2: Verificar instalación

```bash
npx tsx scripts/rag/verificar-rag.ts
```

Si hay errores, revisa que:
- Las migraciones se ejecutaron completamente
- Tienes permisos de `service_role` en Supabase
- Las variables de entorno están correctamente configuradas

### Paso 3: Generar embeddings

```bash
npx tsx scripts/rag/generar-embeddings.ts
```

Esto tomará ~10 segundos para los 5 conocimientos iniciales.

### Paso 4: Verificar nuevamente

```bash
npx tsx scripts/rag/verificar-rag.ts
```

Deberías ver 100% de tests pasados.

---

## Variables de Entorno Requeridas

Crea o actualiza tu archivo `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-privada

# Gemini AI
GEMINI_API_KEY=tu-gemini-api-key
```

**Dónde obtener las keys:**

1. **Supabase Keys:** Dashboard → Project Settings → API
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key (pública)
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (privada, NO compartir)

2. **Gemini API Key:** https://makersuite.google.com/app/apikey
   - Crea un proyecto en Google AI Studio
   - Genera una API key
   - Habilita "Generative Language API"

---

## Dependencias Necesarias

Instala las dependencias de Node.js si no las tienes:

```bash
npm install @supabase/supabase-js @google/generative-ai dotenv
npm install -D tsx @types/node
```

---

## Troubleshooting

### Error: "extension 'vector' does not exist"

**Causa:** pgvector no está instalado en tu instancia de PostgreSQL.

**Solución:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Si sigues teniendo el error, verifica que tu instancia de Supabase soporte pgvector (todas las instancias nuevas lo soportan).

### Error: "relation 'ConocimientoClinico' does not exist"

**Causa:** Las migraciones no se han aplicado o fallaron.

**Solución:**
1. Verifica que las 3 migraciones existen en `supabase/migrations/`
2. Aplícalas manualmente desde el dashboard de Supabase (SQL Editor)
3. Ejecuta en orden: 004 → 005 → 006

### Error: "Invalid API key" (Gemini)

**Causa:** La API key de Gemini es inválida o no está configurada.

**Solución:**
1. Verifica que `GEMINI_API_KEY` esté en tu `.env`
2. Genera una nueva key en https://makersuite.google.com/app/apikey
3. Habilita "Generative Language API" en tu proyecto de Google Cloud

### Error: "Row Level Security" al ejecutar scripts

**Causa:** Estás usando `anon_key` en lugar de `service_role_key`.

**Solución:**
Los scripts deben usar `SUPABASE_SERVICE_ROLE_KEY` (no la anon key) para bypass RLS.

### Error: "rate limit exceeded" (Gemini)

**Causa:** Has excedido el límite de requests de la API de Gemini.

**Solución:**
1. El script tiene un delay de 500ms entre requests
2. Si tienes muchos conocimientos (50+), considera aumentar el delay a 1000ms
3. O ejecuta en batches de 10-20 conocimientos

---

## Mantenimiento

### Agregar nuevos conocimientos

1. **Opción 1: SQL directo**

```sql
INSERT INTO "ConocimientoClinico" (
  categoria, titulo, contenido, descripcion_corta,
  sintomas_objetivo, cuando_usar, evidencia_cientifica,
  nivel_evidencia, keywords, dificultad, duracion_minutos
) VALUES (
  'tecnica_ansiedad',
  'Respiración Cuadrada (Box Breathing)',
  'Técnica de respiración 4-4-4-4...',
  'Respiración usada por Navy SEALs',
  ARRAY['ansiedad', 'estrés'],
  'Situaciones de alto estrés',
  'Usada por militares...',
  'media',
  ARRAY['respiración', 'box breathing'],
  'facil',
  5
);
```

2. **Generar embedding**

```bash
npx tsx scripts/rag/generar-embeddings.ts
```

### Actualizar conocimientos existentes

Si actualizas el contenido de un conocimiento, debes regenerar su embedding:

```sql
-- Marcar embedding como NULL
UPDATE "ConocimientoClinico"
SET embedding = NULL
WHERE id = 'uuid-del-conocimiento';

-- Regenerar con el script
-- npx tsx scripts/rag/generar-embeddings.ts
```

### Monitorear uso

```sql
-- Conocimientos más usados
SELECT titulo, veces_usada, promedio_utilidad
FROM "ConocimientoClinico"
ORDER BY veces_usada DESC
LIMIT 10;

-- Búsquedas recientes
SELECT query_original, fue_util, creado_en
FROM "HistorialRAG"
ORDER BY creado_en DESC
LIMIT 20;
```

---

## Scripts Futuros (Roadmap)

Posibles scripts adicionales a desarrollar:

- `scripts/rag/limpiar-embeddings.ts` - Eliminar embeddings y regenerarlos
- `scripts/rag/analizar-gaps.ts` - Identificar queries sin resultados (gaps de conocimiento)
- `scripts/rag/validar-conocimiento.ts` - Validar formato y calidad de conocimientos
- `scripts/rag/exportar-conocimiento.ts` - Exportar a JSON/CSV para backup
- `scripts/rag/importar-conocimiento.ts` - Importar desde JSON/CSV

---

## Documentación Adicional

- **Documentación completa:** `/docs/RAG_SISTEMA_CONOCIMIENTO_CLINICO.md`
- **Quick Start:** `/RAG_QUICKSTART.md`
- **Migraciones:** `/supabase/migrations/202510250000[04-06]_*.sql`

---

**Autor:** Agente de Base de Datos
**Fecha:** 2025-10-25
**Versión:** 1.0.0
