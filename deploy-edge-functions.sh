#!/bin/bash

# Script para desplegar todas las Edge Functions a Supabase
# Proyecto: Escuchodromo
# Fecha: 2025-10-20

set -e  # Exit on error

echo "🚀 Iniciando despliegue de Edge Functions..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -d "supabase/functions" ]; then
    echo "❌ Error: No se encuentra el directorio supabase/functions"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

echo "📦 Verificando conexión con Supabase..."
npx supabase projects list > /dev/null 2>&1 || {
    echo "⚠️  No estás logueado en Supabase"
    echo "Ejecutando: npx supabase login"
    npx supabase login
}

echo ""
echo "🔗 Verificando link al proyecto..."
npx supabase link --project-ref cvezncgcdsjntzrzztrj || {
    echo "❌ Error al linkear el proyecto"
    exit 1
}

echo ""
echo "=================================="
echo "  DESPLEGANDO EDGE FUNCTIONS"
echo "=================================="
echo ""

# Contador de funciones desplegadas
total=0
exitosas=0
fallidas=0

# Función auxiliar para desplegar
deploy_function() {
    local func_name=$1
    local description=$2

    total=$((total + 1))
    echo -e "${BLUE}[$total] Desplegando: $func_name${NC}"
    echo "    📝 $description"

    if npx supabase functions deploy "$func_name" --no-verify-jwt; then
        echo -e "${GREEN}    ✅ $func_name desplegada exitosamente${NC}"
        exitosas=$((exitosas + 1))
    else
        echo -e "${YELLOW}    ⚠️  Error desplegando $func_name${NC}"
        fallidas=$((fallidas + 1))
    fi
    echo ""
}

# ==========================================
# CATEGORÍA 1: SISTEMA DE RESERVAS (CORE)
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📅 SISTEMA DE RESERVAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

deploy_function "reservar-cita" "Reserva de citas con validación y encriptación"
deploy_function "disponibilidad-profesional" "Consulta de horarios disponibles"
deploy_function "progreso-paciente" "Tracking automático de progreso con alertas"
deploy_function "webhook-stripe" "Webhook de Stripe con idempotencia"

# ==========================================
# CATEGORÍA 2: GESTIÓN DE PROFESIONALES
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  👥 GESTIÓN DE PROFESIONALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

deploy_function "listar-profesionales" "Búsqueda y filtrado de profesionales"
deploy_function "registrar-profesional" "Registro completo con validaciones"
deploy_function "subir-documento-profesional" "Upload seguro de documentos"
deploy_function "configurar-disponibilidad" "Configuración de horarios"
deploy_function "obtener-disponibilidad" "Consulta de horarios configurados"

# ==========================================
# CATEGORÍA 3: SISTEMA DE INTELIGENCIA ARTIFICIAL
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🤖 INTELIGENCIA ARTIFICIAL (Gemini)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

deploy_function "chat-ia" "Chat con Gemini AI y análisis emocional"
deploy_function "analisis-post-chat" "Análisis post-sesión automático"
deploy_function "alerta-urgente" "Detección de crisis y alertas"
deploy_function "insights-dashboard" "Insights para dashboard profesional"
deploy_function "generar-reporte-clinico" "Reportes clínicos automáticos"
deploy_function "generar-reporte-pre-cita" "Resumen pre-cita para profesionales"
deploy_function "batch-reportes-semanales" "Generación batch de reportes"

# ==========================================
# CATEGORÍA 4: EVALUACIONES Y RECOMENDACIONES
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 EVALUACIONES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

deploy_function "procesar-evaluacion" "Procesamiento de PHQ-9 y GAD-7"
deploy_function "generar-recomendaciones" "Recomendaciones personalizadas con IA"

# ==========================================
# CATEGORÍA 5: PAGOS Y SUSCRIPCIONES
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💳 PAGOS Y SUSCRIPCIONES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

deploy_function "crear-checkout-stripe" "Creación de sesiones de checkout"
deploy_function "gestionar-suscripcion" "Gestión de suscripciones"

# ==========================================
# CATEGORÍA 6: UTILIDADES
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 UTILIDADES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

deploy_function "obtener-historial-usuario" "Historial completo del usuario"
deploy_function "enviar-contacto" "Formulario de contacto"

# ==========================================
# RESUMEN FINAL
# ==========================================
echo ""
echo "=================================="
echo "  📊 RESUMEN DEL DESPLIEGUE"
echo "=================================="
echo ""
echo "Total de funciones: $total"
echo -e "${GREEN}✅ Exitosas: $exitosas${NC}"
if [ $fallidas -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Fallidas: $fallidas${NC}"
fi
echo ""

if [ $fallidas -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todas las funciones se desplegaron exitosamente!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🔐 SIGUIENTE PASO: CONFIGURAR SECRETS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Ejecuta estos comandos para configurar los secrets necesarios:"
    echo ""
    echo "# 1. Clave de encriptación PHI (genera una nueva)"
    echo "npx supabase secrets set PHI_ENCRYPTION_KEY=\$(openssl rand -base64 32)"
    echo ""
    echo "# 2. Stripe Webhook Secret (obtener de Stripe Dashboard)"
    echo "# npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui"
    echo ""
    echo "# 3. Gemini API Key (para funciones de IA)"
    echo "# npx supabase secrets set GEMINI_API_KEY=tu_api_key_aqui"
    echo ""
    echo "# 4. Verificar secrets configurados"
    echo "npx supabase secrets list"
    echo ""
else
    echo -e "${YELLOW}⚠️  Algunas funciones fallaron. Revisa los errores arriba.${NC}"
    echo ""
    echo "💡 Tip: Puedes redesplegar funciones individuales con:"
    echo "   npx supabase functions deploy <nombre-funcion>"
    echo ""
fi

echo "=================================="
echo ""
