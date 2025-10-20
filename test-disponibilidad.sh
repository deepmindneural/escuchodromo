#!/bin/bash

# Script de prueba para el sistema de configuración de disponibilidad
# Uso: ./test-disponibilidad.sh <JWT_TOKEN>

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que se proporcionó el token
if [ -z "$1" ]; then
  echo -e "${RED}Error: Debes proporcionar un JWT token${NC}"
  echo "Uso: ./test-disponibilidad.sh <JWT_TOKEN>"
  echo ""
  echo "Para obtener el token:"
  echo "1. Inicia sesión en la app como profesional"
  echo "2. Abre DevTools > Application > Local Storage"
  echo "3. Busca 'supabase.auth.token'"
  exit 1
fi

TOKEN="$1"
BASE_URL="http://localhost:54321/functions/v1"

echo -e "${YELLOW}=== Test Sistema de Disponibilidad Horaria ===${NC}\n"

# Test 1: Obtener disponibilidad actual
echo -e "${YELLOW}Test 1: Obtener disponibilidad actual${NC}"
echo "GET $BASE_URL/obtener-disponibilidad"

RESPONSE=$(curl -s -X GET \
  "$BASE_URL/obtener-disponibilidad" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 1 PASSED${NC}\n"
else
  echo -e "${RED}✗ Test 1 FAILED${NC}\n"
  exit 1
fi

# Test 2: Configurar disponibilidad (horario válido)
echo -e "${YELLOW}Test 2: Configurar disponibilidad - Horario válido${NC}"
echo "POST $BASE_URL/configurar-disponibilidad"

HORARIOS_VALIDOS='{
  "horarios": [
    {
      "dia_semana": 1,
      "hora_inicio": "09:00",
      "hora_fin": "12:00",
      "duracion_sesion": 60,
      "activo": true
    },
    {
      "dia_semana": 1,
      "hora_inicio": "14:00",
      "hora_fin": "18:00",
      "duracion_sesion": 60,
      "activo": true
    },
    {
      "dia_semana": 2,
      "hora_inicio": "10:00",
      "hora_fin": "13:00",
      "duracion_sesion": 60,
      "activo": true
    }
  ]
}'

RESPONSE=$(curl -s -X POST \
  "$BASE_URL/configurar-disponibilidad" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$HORARIOS_VALIDOS")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 2 PASSED${NC}\n"
else
  echo -e "${RED}✗ Test 2 FAILED${NC}\n"
  exit 1
fi

# Test 3: Validar solapamiento (debe fallar)
echo -e "${YELLOW}Test 3: Validar solapamiento - Debe rechazar${NC}"

HORARIOS_SOLAPADOS='{
  "horarios": [
    {
      "dia_semana": 1,
      "hora_inicio": "09:00",
      "hora_fin": "12:00",
      "duracion_sesion": 60,
      "activo": true
    },
    {
      "dia_semana": 1,
      "hora_inicio": "10:00",
      "hora_fin": "13:00",
      "duracion_sesion": 60,
      "activo": true
    }
  ]
}'

RESPONSE=$(curl -s -X POST \
  "$BASE_URL/configurar-disponibilidad" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$HORARIOS_SOLAPADOS")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.error' | grep -q "solapa"; then
  echo -e "${GREEN}✓ Test 3 PASSED (rechazó correctamente)${NC}\n"
else
  echo -e "${RED}✗ Test 3 FAILED (debió rechazar)${NC}\n"
  exit 1
fi

# Test 4: Validar formato inválido (debe fallar)
echo -e "${YELLOW}Test 4: Validar formato inválido - Debe rechazar${NC}"

HORARIOS_INVALIDOS='{
  "horarios": [
    {
      "dia_semana": 1,
      "hora_inicio": "25:00",
      "hora_fin": "12:00",
      "duracion_sesion": 60,
      "activo": true
    }
  ]
}'

RESPONSE=$(curl -s -X POST \
  "$BASE_URL/configurar-disponibilidad" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$HORARIOS_INVALIDOS")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.error' | grep -q "formato"; then
  echo -e "${GREEN}✓ Test 4 PASSED (rechazó correctamente)${NC}\n"
else
  echo -e "${RED}✗ Test 4 FAILED (debió rechazar)${NC}\n"
  exit 1
fi

# Test 5: Validar hora_fin <= hora_inicio (debe fallar)
echo -e "${YELLOW}Test 5: Validar hora_fin <= hora_inicio - Debe rechazar${NC}"

HORARIOS_INVERTIDOS='{
  "horarios": [
    {
      "dia_semana": 1,
      "hora_inicio": "14:00",
      "hora_fin": "12:00",
      "duracion_sesion": 60,
      "activo": true
    }
  ]
}'

RESPONSE=$(curl -s -X POST \
  "$BASE_URL/configurar-disponibilidad" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$HORARIOS_INVERTIDOS")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.error' | grep -q "posterior"; then
  echo -e "${GREEN}✓ Test 5 PASSED (rechazó correctamente)${NC}\n"
else
  echo -e "${RED}✗ Test 5 FAILED (debió rechazar)${NC}\n"
  exit 1
fi

# Test 6: Obtener disponibilidad actualizada
echo -e "${YELLOW}Test 6: Obtener disponibilidad actualizada${NC}"

RESPONSE=$(curl -s -X GET \
  "$BASE_URL/obtener-disponibilidad" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | jq '.'

HORARIOS_COUNT=$(echo "$RESPONSE" | jq '.horarios | length')
echo -e "Total horarios configurados: ${GREEN}$HORARIOS_COUNT${NC}"

if [ "$HORARIOS_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Test 6 PASSED${NC}\n"
else
  echo -e "${RED}✗ Test 6 FAILED${NC}\n"
  exit 1
fi

# Test 7: Limpiar (configurar array vacío)
echo -e "${YELLOW}Test 7: Limpiar disponibilidad${NC}"

HORARIOS_VACIOS='{
  "horarios": []
}'

RESPONSE=$(curl -s -X POST \
  "$BASE_URL/configurar-disponibilidad" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$HORARIOS_VACIOS")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 7 PASSED${NC}\n"
else
  echo -e "${RED}✗ Test 7 FAILED${NC}\n"
  exit 1
fi

# Resumen
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ TODOS LOS TESTS PASARON EXITOSAMENTE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "El sistema de configuración de disponibilidad está funcionando correctamente."
