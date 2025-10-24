#!/bin/bash

###############################################################################
# Script de Automatización de Tests de Stripe
#
# Ejecuta todas las suites de tests del sistema de pagos con Stripe
# y genera reportes de cobertura y resultados.
#
# Uso:
#   ./run-tests.sh [opción]
#
# Opciones:
#   all          - Ejecuta todos los tests (por defecto)
#   unit         - Solo tests unitarios
#   integration  - Solo tests de integración (requiere claves de Stripe)
#   e2e          - Solo tests E2E
#   security     - Solo tests de seguridad
#   errors       - Solo tests de manejo de errores
#   watch        - Ejecuta tests en modo watch
#   coverage     - Genera reporte de cobertura
#
# Autor: Escuchodromo QA Team
# Fecha: 2024
###############################################################################

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Función para imprimir headers
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Función para imprimir éxito
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Función para imprimir error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Función para imprimir advertencia
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Función para verificar prerequisitos
check_prerequisites() {
    print_header "Verificando Prerequisitos"

    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado"
        exit 1
    fi
    print_success "Node.js $(node --version)"

    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi
    print_success "npm $(npm --version)"

    # Verificar que estamos en el directorio correcto
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "No se encuentra package.json. Ejecuta este script desde el directorio de tests."
        exit 1
    fi
    print_success "Directorio de proyecto encontrado"

    # Verificar instalación de dependencias
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        print_warning "Dependencias no instaladas. Instalando..."
        cd "$PROJECT_ROOT"
        npm install
    fi
    print_success "Dependencias instaladas"
}

# Función para verificar claves de Stripe para tests de integración
check_stripe_keys() {
    if [ -z "$STRIPE_TEST_SECRET_KEY" ]; then
        print_warning "STRIPE_TEST_SECRET_KEY no configurada"
        print_warning "Tests de integración con Stripe serán omitidos"
        return 1
    fi

    if [[ ! "$STRIPE_TEST_SECRET_KEY" =~ ^sk_test_ ]]; then
        print_error "STRIPE_TEST_SECRET_KEY debe comenzar con 'sk_test_'"
        print_error "NUNCA uses claves de producción en tests"
        exit 1
    fi

    print_success "Claves de Stripe Test Mode configuradas"
    return 0
}

# Función para ejecutar tests unitarios
run_unit_tests() {
    print_header "Ejecutando Tests Unitarios"

    cd "$PROJECT_ROOT"

    jest tests/stripe/crear-checkout-stripe.spec.ts \
         tests/stripe/webhook-stripe.spec.ts \
         --verbose \
         --colors \
         --coverage=false

    if [ $? -eq 0 ]; then
        print_success "Tests unitarios completados"
    else
        print_error "Tests unitarios fallaron"
        exit 1
    fi
}

# Función para ejecutar tests de integración
run_integration_tests() {
    print_header "Ejecutando Tests de Integración con Stripe API"

    if ! check_stripe_keys; then
        print_warning "Omitiendo tests de integración (requieren claves de Stripe)"
        return 0
    fi

    cd "$PROJECT_ROOT"

    jest tests/stripe/integracion-stripe.spec.ts \
         --verbose \
         --colors \
         --coverage=false \
         --testTimeout=30000

    if [ $? -eq 0 ]; then
        print_success "Tests de integración completados"
    else
        print_error "Tests de integración fallaron"
        exit 1
    fi
}

# Función para ejecutar tests E2E
run_e2e_tests() {
    print_header "Ejecutando Tests E2E"

    cd "$PROJECT_ROOT"

    jest tests/stripe/e2e-flujo-pago.spec.ts \
         --verbose \
         --colors \
         --coverage=false

    if [ $? -eq 0 ]; then
        print_success "Tests E2E completados"
    else
        print_error "Tests E2E fallaron"
        exit 1
    fi
}

# Función para ejecutar tests de seguridad
run_security_tests() {
    print_header "Ejecutando Tests de Seguridad"

    cd "$PROJECT_ROOT"

    jest tests/stripe/seguridad-stripe.spec.ts \
         --verbose \
         --colors \
         --coverage=false

    if [ $? -eq 0 ]; then
        print_success "Tests de seguridad completados"
    else
        print_error "Tests de seguridad fallaron - CRÍTICO"
        exit 1
    fi
}

# Función para ejecutar tests de manejo de errores
run_error_tests() {
    print_header "Ejecutando Tests de Manejo de Errores"

    cd "$PROJECT_ROOT"

    jest tests/stripe/manejo-errores-stripe.spec.ts \
         --verbose \
         --colors \
         --coverage=false

    if [ $? -eq 0 ]; then
        print_success "Tests de manejo de errores completados"
    else
        print_error "Tests de manejo de errores fallaron"
        exit 1
    fi
}

# Función para ejecutar todos los tests
run_all_tests() {
    print_header "Ejecutando Suite Completa de Tests de Stripe"

    run_unit_tests
    run_integration_tests
    run_e2e_tests
    run_security_tests
    run_error_tests

    print_header "Resumen de Tests"
    print_success "Todos los tests completados exitosamente"
}

# Función para ejecutar tests con cobertura
run_coverage() {
    print_header "Generando Reporte de Cobertura"

    cd "$PROJECT_ROOT"

    jest tests/stripe/ \
         --coverage \
         --coverageDirectory=coverage/stripe \
         --coverageReporters=html \
         --coverageReporters=text \
         --coverageReporters=lcov \
         --colors

    if [ $? -eq 0 ]; then
        print_success "Reporte de cobertura generado en coverage/stripe/"

        # Abrir reporte en navegador si está disponible
        if command -v open &> /dev/null; then
            open coverage/stripe/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open coverage/stripe/index.html
        fi
    else
        print_error "Generación de cobertura falló"
        exit 1
    fi
}

# Función para ejecutar tests en modo watch
run_watch() {
    print_header "Ejecutando Tests en Modo Watch"

    cd "$PROJECT_ROOT"

    jest tests/stripe/ \
         --watch \
         --verbose \
         --colors
}

# Función principal
main() {
    local mode="${1:-all}"

    check_prerequisites

    case "$mode" in
        all)
            run_all_tests
            ;;
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        security)
            run_security_tests
            ;;
        errors)
            run_error_tests
            ;;
        watch)
            run_watch
            ;;
        coverage)
            run_coverage
            ;;
        *)
            echo "Uso: $0 [all|unit|integration|e2e|security|errors|watch|coverage]"
            exit 1
            ;;
    esac
}

# Ejecutar script
main "$@"
