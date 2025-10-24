#!/bin/bash

###############################################################################
# Script de Ejecución de Tests E2E - Dashboard y Evaluaciones
#
# Este script ejecuta la suite completa de tests y genera un reporte detallado
###############################################################################

set -e

echo "=========================================="
echo "  TESTING EXHAUSTIVO - DASHBOARD USUARIO"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio de proyecto
PROJECT_DIR="/Volumes/StarkT7/Proyectos/CLIENETS/proyectos/ESCUCHODROMO/Escuchodromo 2/escuchodromo"
cd "$PROJECT_DIR"

echo "📁 Directorio: $PROJECT_DIR"
echo ""

# Verificar que la app esté corriendo
echo "🔍 Verificando que la aplicación esté corriendo..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: La aplicación no está corriendo en http://localhost:3000${NC}"
    echo ""
    echo "Por favor ejecuta en otra terminal:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Aplicación corriendo${NC}"
echo ""

# Crear directorio para reportes
REPORTS_DIR="$PROJECT_DIR/test-reports"
mkdir -p "$REPORTS_DIR"

echo "📊 Directorio de reportes: $REPORTS_DIR"
echo ""

# Ejecutar tests
echo "=========================================="
echo "  EJECUTANDO TESTS E2E"
echo "=========================================="
echo ""

# Test 1: Dashboard
echo "🧪 Test Suite 1: Dashboard de Usuario"
echo "--------------------------------------"
npx playwright test e2e/dashboard-usuario.spec.ts --project=chromium --reporter=list || true
echo ""

# Test 2: Evaluaciones
echo "🧪 Test Suite 2: Evaluaciones Psicológicas"
echo "--------------------------------------"
npx playwright test e2e/evaluaciones.spec.ts --project=chromium --reporter=list || true
echo ""

# Test 3: Navegación
echo "🧪 Test Suite 3: Navegación"
echo "--------------------------------------"
npx playwright test e2e/navegacion.spec.ts --project=chromium --reporter=list || true
echo ""

# Generar reporte HTML
echo "=========================================="
echo "  GENERANDO REPORTE HTML"
echo "=========================================="
echo ""

npx playwright show-report || echo "No se pudo abrir el reporte automáticamente"

echo ""
echo "=========================================="
echo "  TESTS COMPLETADOS"
echo "=========================================="
echo ""
echo "📊 Reporte HTML disponible en:"
echo "   $PROJECT_DIR/playwright-report/index.html"
echo ""
echo "📸 Screenshots de errores en:"
echo "   $PROJECT_DIR/test-results/"
echo ""
echo "Para ver el reporte ejecuta:"
echo "   npx playwright show-report"
echo ""
