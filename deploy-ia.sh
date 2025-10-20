#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO - SISTEMA IA
# ========================================

set -e  # Exit on error

echo "🚀 Iniciando despliegue del Sistema de IA..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========================================
# PASO 1: VERIFICAR ARCHIVOS
# ========================================
echo "📋 Verificando archivos..."

if [ ! -f "supabase/migrations/20250121000000_ia_analytics.sql" ]; then
  echo -e "${RED}❌ Error: Migración SQL no encontrada${NC}"
  exit 1
fi

if [ ! -d "supabase/functions/_shared" ]; then
  echo -e "${RED}❌ Error: Directorio _shared no encontrado${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Archivos verificados${NC}"
echo ""

# ========================================
# PASO 2: VERIFICAR GEMINI API KEY
# ========================================
echo "🔑 Verificando API Key de Gemini..."

# Leer desde .env.local si existe
if [ -f ".env.local" ]; then
  source .env.local
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  GEMINI_API_KEY no configurada${NC}"
  echo ""
  echo "Por favor, obtén tu API key gratuita en:"
  echo "https://aistudio.google.com/apikey"
  echo ""
  read -p "Ingresa tu GEMINI_API_KEY (o presiona Enter para continuar sin ella): " api_key

  if [ ! -z "$api_key" ]; then
    export GEMINI_API_KEY=$api_key
    echo "GEMINI_API_KEY=$api_key" >> .env.local
    echo -e "${GREEN}✅ API Key guardada en .env.local${NC}"

    # Configurar en Supabase
    echo "Configurando secret en Supabase..."
    npx supabase secrets set GEMINI_API_KEY=$api_key
  fi
else
  echo -e "${GREEN}✅ GEMINI_API_KEY encontrada${NC}"
fi
echo ""

# ========================================
# PASO 3: APLICAR MIGRACIÓN SQL
# ========================================
echo "📊 Aplicando migración SQL..."
echo -e "${YELLOW}⚠️  Abre manualmente el SQL Editor:${NC}"
echo "https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new"
echo ""
echo "Copiando SQL al portapapeles..."
cat supabase/migrations/20250121000000_ia_analytics.sql | pbcopy
echo -e "${GREEN}✅ SQL copiado al portapapeles${NC}"
echo ""
echo "Instrucciones:"
echo "1. Pega el SQL en el editor (Cmd+V)"
echo "2. Presiona 'Run' o F5"
echo "3. Espera el mensaje de éxito"
echo ""
read -p "Presiona Enter cuando hayas ejecutado el SQL..."
echo ""

# ========================================
# PASO 4: DESPLEGAR EDGE FUNCTIONS
# ========================================
echo "🔧 Desplegando Edge Functions..."
echo ""

functions=(
  "chat-ia"
  "analisis-post-chat"
  "alerta-urgente"
  "insights-dashboard"
  "generar-reporte-clinico"
  "generar-reporte-pre-cita"
  "batch-reportes-semanales"
)

success_count=0
fail_count=0

for func in "${functions[@]}"; do
  echo "Desplegando $func..."
  if npx supabase functions deploy $func; then
    echo -e "${GREEN}✅ $func desplegado${NC}"
    ((success_count++))
  else
    echo -e "${RED}❌ Error desplegando $func${NC}"
    ((fail_count++))
  fi
  echo ""
done

# ========================================
# PASO 5: VERIFICAR DESPLIEGUE
# ========================================
echo "🔍 Verificando despliegue..."
echo ""
npx supabase functions list
echo ""

# ========================================
# RESUMEN
# ========================================
echo "========================================="
echo "📊 RESUMEN DEL DESPLIEGUE"
echo "========================================="
echo -e "${GREEN}✅ Funciones desplegadas: $success_count${NC}"
if [ $fail_count -gt 0 ]; then
  echo -e "${RED}❌ Funciones fallidas: $fail_count${NC}"
fi
echo ""

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}🎉 ¡Despliegue completado exitosamente!${NC}"
  echo ""
  echo "Próximos pasos:"
  echo "1. Probar el chat: npx supabase functions logs chat-ia"
  echo "2. Ver documentación: cat supabase/functions/README_IA_SYSTEM.md"
  echo "3. Configurar Cron Jobs (opcional)"
else
  echo -e "${YELLOW}⚠️  Algunas funciones fallaron. Revisa los errores arriba.${NC}"
fi

echo ""
echo "Para más ayuda, ver: GUIA_DESPLIEGUE_IA.md"
