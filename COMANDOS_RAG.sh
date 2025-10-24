#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# COMANDOS RÁPIDOS: Sistema RAG con pgvector
# ════════════════════════════════════════════════════════════════════

set -e  # Salir si hay error

echo "╔════════════════════════════════════════════════════════════════════════════════╗"
echo "║              INSTALACIÓN SISTEMA RAG - ESCUCHODROMO                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════════╝"

# ════════════════════════════════════════════════════════════════════
# PASO 1: Verificar dependencias
# ════════════════════════════════════════════════════════════════════

echo ""
echo "📦 Paso 1: Verificando dependencias..."
echo "────────────────────────────────────────────────────────────────"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Instálalo desde: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi
echo "✓ npm $(npm --version)"

# Verificar Supabase CLI (opcional)
if command -v supabase &> /dev/null; then
    echo "✓ Supabase CLI $(supabase --version)"
else
    echo "⚠️  Supabase CLI no instalado (opcional)"
    echo "   Instalar: npm install -g supabase"
fi

# ════════════════════════════════════════════════════════════════════
# PASO 2: Instalar dependencias de Node.js
# ════════════════════════════════════════════════════════════════════

echo ""
echo "📦 Paso 2: Instalando dependencias de Node.js..."
echo "────────────────────────────────────────────────────────────────"

# Verificar si ya están instaladas
if [ -f "package.json" ]; then
    # Verificar si las dependencias ya existen
    if grep -q "@google/generative-ai" package.json; then
        echo "✓ Dependencias ya están en package.json"
    else
        echo "Agregando dependencias..."
        npm install --save @google/generative-ai @supabase/supabase-js dotenv
        npm install --save-dev tsx @types/node
    fi
else
    echo "❌ package.json no encontrado"
    echo "   Asegúrate de estar en la raíz del proyecto"
    exit 1
fi

echo "✓ Dependencias instaladas"

# ════════════════════════════════════════════════════════════════════
# PASO 3: Verificar variables de entorno
# ════════════════════════════════════════════════════════════════════

echo ""
echo "🔐 Paso 3: Verificando variables de entorno..."
echo "────────────────────────────────────────────────────────────────"

# Cargar .env si existe
if [ -f ".env" ]; then
    source .env
fi

# Verificar variables requeridas
MISSING_VARS=0

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Falta: NEXT_PUBLIC_SUPABASE_URL"
    MISSING_VARS=1
else
    echo "✓ NEXT_PUBLIC_SUPABASE_URL configurado"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Falta: SUPABASE_SERVICE_ROLE_KEY"
    MISSING_VARS=1
else
    echo "✓ SUPABASE_SERVICE_ROLE_KEY configurado"
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Falta: GEMINI_API_KEY"
    MISSING_VARS=1
else
    echo "✓ GEMINI_API_KEY configurado"
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo "⚠️  Variables de entorno faltantes"
    echo "   Configúralas en tu archivo .env:"
    echo ""
    echo "   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co"
    echo "   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key"
    echo "   GEMINI_API_KEY=tu-gemini-api-key"
    echo ""
    echo "Presiona Enter para continuar de todas formas, o Ctrl+C para salir"
    read
fi

# ════════════════════════════════════════════════════════════════════
# PASO 4: Aplicar migraciones
# ════════════════════════════════════════════════════════════════════

echo ""
echo "🗄️  Paso 4: Aplicando migraciones..."
echo "────────────────────────────────────────────────────────────────"

# Verificar que las migraciones existen
MIGRATIONS=(
    "supabase/migrations/20251025000004_habilitar_pgvector_rag.sql"
    "supabase/migrations/20251025000005_funciones_rag.sql"
    "supabase/migrations/20251025000006_seed_conocimiento_y_rls.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ ! -f "$migration" ]; then
        echo "❌ Migración no encontrada: $migration"
        exit 1
    fi
done

echo "✓ Las 3 migraciones existen"

# Intentar aplicar con Supabase CLI
if command -v supabase &> /dev/null; then
    echo ""
    echo "Aplicando migraciones con Supabase CLI..."
    if supabase db push 2>/dev/null; then
        echo "✓ Migraciones aplicadas exitosamente"
    else
        echo "⚠️  Error al aplicar migraciones con CLI"
        echo "   Aplícalas manualmente desde el Dashboard de Supabase:"
        echo "   https://app.supabase.com → SQL Editor"
    fi
else
    echo ""
    echo "⚠️  Supabase CLI no disponible"
    echo "   Aplica las migraciones manualmente desde el Dashboard:"
    echo ""
    echo "   1. Ve a https://app.supabase.com"
    echo "   2. SQL Editor"
    echo "   3. Ejecuta en orden:"
    for migration in "${MIGRATIONS[@]}"; do
        echo "      - $migration"
    done
    echo ""
    echo "Presiona Enter cuando hayas aplicado las migraciones..."
    read
fi

# ════════════════════════════════════════════════════════════════════
# PASO 5: Verificar instalación
# ════════════════════════════════════════════════════════════════════

echo ""
echo "✅ Paso 5: Verificando instalación..."
echo "────────────────────────────────────────────────────────────────"

if [ -f "scripts/rag/verificar-rag.ts" ]; then
    echo "Ejecutando script de verificación..."
    npx tsx scripts/rag/verificar-rag.ts
else
    echo "⚠️  Script de verificación no encontrado"
fi

# ════════════════════════════════════════════════════════════════════
# PASO 6: Generar embeddings
# ════════════════════════════════════════════════════════════════════

echo ""
echo "🔷 Paso 6: Generando embeddings..."
echo "────────────────────────────────────────────────────────────────"

if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  No se puede generar embeddings sin GEMINI_API_KEY"
    echo "   Configúrala en .env y ejecuta manualmente:"
    echo "   npx tsx scripts/rag/generar-embeddings.ts"
else
    if [ -f "scripts/rag/generar-embeddings.ts" ]; then
        echo "Ejecutando generador de embeddings..."
        npx tsx scripts/rag/generar-embeddings.ts
    else
        echo "⚠️  Script de embeddings no encontrado"
    fi
fi

# ════════════════════════════════════════════════════════════════════
# PASO 7: Verificación final
# ════════════════════════════════════════════════════════════════════

echo ""
echo "🎯 Paso 7: Verificación final..."
echo "────────────────────────────────────────────────────────────────"

if [ -f "scripts/rag/verificar-rag.ts" ]; then
    echo "Ejecutando verificación final..."
    npx tsx scripts/rag/verificar-rag.ts
fi

# ════════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ════════════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════════╗"
echo "║                           INSTALACIÓN COMPLETADA                               ║"
echo "╚════════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Sistema RAG instalado correctamente"
echo ""
echo "📚 Documentación:"
echo "   - Documentación técnica: docs/RAG_SISTEMA_CONOCIMIENTO_CLINICO.md"
echo "   - Guía rápida: RAG_QUICKSTART.md"
echo "   - Resumen ejecutivo: RESUMEN_IMPLEMENTACION_RAG.md"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Revisar RESUMEN_IMPLEMENTACION_RAG.md"
echo "   2. Crear Edge Function para integración con chat"
echo "   3. Expandir conocimiento a 50-100 entradas"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
