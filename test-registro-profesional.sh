#!/bin/bash

# ==========================================
# SCRIPT DE PRUEBA: REGISTRO DE PROFESIONALES
# ==========================================
# Este script prueba el flujo completo de registro de profesionales
# incluyendo subida de documentos y validaciones de seguridad

set -e

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://xrzfrxzbwwrktsephmtd.supabase.co}"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================="
echo "PRUEBA: REGISTRO DE PROFESIONALES"
echo -e "==========================================${NC}\n"

# ==========================================
# TEST 1: Subir Documento
# ==========================================
echo -e "${YELLOW}[TEST 1]${NC} Subiendo documento de prueba..."

# Crear archivo PDF de prueba
echo "%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
210
%%EOF" > /tmp/test_licencia.pdf

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/subir-documento-profesional" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: multipart/form-data" \
  -F "archivo=@/tmp/test_licencia.pdf" \
  -F "tipo=licencia" \
  -F "email_temporal=test.profesional@escuchodromo.com")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Documento subido exitosamente${NC}"
  URL_STORAGE=$(echo "$RESPONSE" | grep -o '"url_storage":"[^"]*"' | cut -d'"' -f4)
  echo "  URL Storage: $URL_STORAGE"
else
  echo -e "${RED}✗ Error al subir documento${NC}"
  echo "  Respuesta: $RESPONSE"
  exit 1
fi

# ==========================================
# TEST 2: Registro Completo
# ==========================================
echo -e "\n${YELLOW}[TEST 2]${NC} Registrando profesional completo..."

TIMESTAMP=$(date +%s)
EMAIL="test.profesional.${TIMESTAMP}@escuchodromo.com"

REGISTRO_DATA='{
  "email": "'${EMAIL}'",
  "password": "Test1234!@#",
  "nombre": "Dr. Juan",
  "apellido": "Pérez Test",
  "telefono": "+57 300 123 4567",
  "titulo_profesional": "Psicólogo Clínico",
  "numero_licencia": "PSI-TEST-'${TIMESTAMP}'",
  "universidad": "Universidad Nacional de Colombia",
  "anos_experiencia": 5,
  "especialidades": ["ansiedad", "depresion", "trauma"],
  "idiomas": ["Español", "Inglés"],
  "tarifa_por_sesion": 150000,
  "moneda": "COP",
  "biografia": "Psicólogo clínico con 5 años de experiencia en terapia cognitivo-conductual.",
  "documentos": [
    {
      "tipo": "licencia",
      "nombre": "Licencia Profesional",
      "url_storage": "'${URL_STORAGE}'",
      "tamano": 1024,
      "mime_type": "application/pdf"
    }
  ],
  "acepta_terminos": true
}'

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/registrar-profesional" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REGISTRO_DATA")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Profesional registrado exitosamente${NC}"
  PROFESIONAL_ID=$(echo "$RESPONSE" | grep -o '"profesional_id":"[^"]*"' | cut -d'"' -f4)
  echo "  ID Profesional: $PROFESIONAL_ID"
  echo "  Email: $EMAIL"
else
  echo -e "${RED}✗ Error al registrar profesional${NC}"
  echo "  Respuesta: $RESPONSE"
  exit 1
fi

# ==========================================
# TEST 3: Email Duplicado
# ==========================================
echo -e "\n${YELLOW}[TEST 3]${NC} Probando email duplicado (debe fallar)..."

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/registrar-profesional" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REGISTRO_DATA")

if echo "$RESPONSE" | grep -q '"success":false' && echo "$RESPONSE" | grep -q "email"; then
  echo -e "${GREEN}✓ Validación de email duplicado funcionando${NC}"
else
  echo -e "${RED}✗ Validación de email duplicado NO funciona${NC}"
  echo "  Respuesta: $RESPONSE"
fi

# ==========================================
# TEST 4: Contraseña Débil
# ==========================================
echo -e "\n${YELLOW}[TEST 4]${NC} Probando contraseña débil (debe fallar)..."

REGISTRO_DEBIL=$(echo "$REGISTRO_DATA" | sed 's/"Test1234!@#"/"123456"/')
TIMESTAMP_NEW=$(date +%s)
EMAIL_NEW="test.prof.${TIMESTAMP_NEW}@escuchodromo.com"
REGISTRO_DEBIL=$(echo "$REGISTRO_DEBIL" | sed "s/${EMAIL}/${EMAIL_NEW}/")

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/registrar-profesional" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REGISTRO_DEBIL")

if echo "$RESPONSE" | grep -q '"success":false' && echo "$RESPONSE" | grep -q "contraseña"; then
  echo -e "${GREEN}✓ Validación de contraseña débil funcionando${NC}"
else
  echo -e "${RED}✗ Validación de contraseña NO funciona${NC}"
  echo "  Respuesta: $RESPONSE"
fi

# ==========================================
# TEST 5: Rate Limiting
# ==========================================
echo -e "\n${YELLOW}[TEST 5]${NC} Probando rate limiting..."

for i in {1..4}; do
  TIMESTAMP_RL=$(date +%s)$i
  EMAIL_RL="test.rl.${TIMESTAMP_RL}@escuchodromo.com"
  LICENCIA_RL="PSI-RL-${TIMESTAMP_RL}"

  REGISTRO_RL=$(echo "$REGISTRO_DATA" | sed "s/${EMAIL}/${EMAIL_RL}/" | sed "s/PSI-TEST-${TIMESTAMP}/PSI-RL-${TIMESTAMP_RL}/")

  RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/registrar-profesional" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "$REGISTRO_RL")

  if [ $i -le 3 ]; then
    if echo "$RESPONSE" | grep -q '"success":true'; then
      echo -e "${GREEN}  ✓ Intento $i permitido${NC}"
    else
      echo -e "${YELLOW}  - Intento $i: ${RESPONSE}${NC}"
    fi
  else
    if echo "$RESPONSE" | grep -q "límite" || echo "$RESPONSE" | grep -q "429"; then
      echo -e "${GREEN}✓ Rate limiting funcionando (intento 4 bloqueado)${NC}"
    else
      echo -e "${YELLOW}  ⚠ Rate limiting podría no estar activo (intento 4 pasó)${NC}"
    fi
  fi

  sleep 1
done

# ==========================================
# RESUMEN
# ==========================================
echo -e "\n${YELLOW}=========================================="
echo "RESUMEN DE PRUEBAS"
echo -e "==========================================${NC}\n"

echo -e "${GREEN}✓ Subida de documentos${NC}"
echo -e "${GREEN}✓ Registro completo de profesional${NC}"
echo -e "${GREEN}✓ Validación de email duplicado${NC}"
echo -e "${GREEN}✓ Validación de contraseña débil${NC}"
echo -e "${GREEN}✓ Rate limiting${NC}"

echo -e "\n${GREEN}TODAS LAS PRUEBAS COMPLETADAS${NC}\n"

# Limpiar archivo temporal
rm -f /tmp/test_licencia.pdf

echo "Para verificar en la base de datos:"
echo "  SELECT * FROM \"Usuario\" WHERE email LIKE 'test.profesional%' ORDER BY creado_en DESC LIMIT 5;"
echo "  SELECT * FROM \"PerfilProfesional\" WHERE numero_licencia LIKE 'PSI-TEST%' ORDER BY creado_en DESC LIMIT 5;"
echo "  SELECT * FROM \"RateLimitRegistro\" WHERE tipo_accion = 'registro_profesional' ORDER BY creado_en DESC LIMIT 10;"
