#!/bin/bash

# Test rápido del chat-ia mejorado

echo "🧪 Probando chat-ia mejorado..."
echo ""

curl -X POST https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/chat-ia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1Nzc3ODMsImV4cCI6MjA0NDE1Mzc4M30.XLxiU7PNBbFdIcYhI3l7Dq77QVPZNgjyJRvgLW8qPKM" \
  -d '{
    "mensaje": "Hola, me siento muy triste hoy",
    "sesion_id": "test-'.$(date +%s)'",
    "historial": []
  }' | jq '.'

echo ""
echo "✅ Si ves una respuesta con 'respuesta', 'modelo' y 'tokens_usados', funciona!"
