#!/bin/bash

# Script de inicio para VPS - Escuchodromo
echo "🚀 Iniciando Escuchodromo..."

# Crear .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="clave-secreta-temporal-123"
NEXTAUTH_SECRET="nextauth-secreta-temporal-456"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
PORT=3333
EOF
fi

# Generar cliente Prisma
echo "🗄️ Generando cliente Prisma..."
npx prisma generate

# Crear base de datos si no existe
echo "📊 Configurando base de datos..."
npx prisma db push

# Construir aplicaciones
echo "🔨 Construyendo aplicaciones..."
npm run build

# Iniciar backend en background
echo "🚀 Iniciando backend en puerto 3333..."
npm run start:backend &
BACKEND_PID=$!

# Esperar un poco para que el backend inicie
sleep 5

# Iniciar frontend
echo "🌐 Iniciando frontend en puerto 3000..."
npm run start:web &
FRONTEND_PID=$!

echo "✅ Aplicaciones iniciadas:"
echo "   - Backend: http://localhost:3333"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"
echo ""
echo "Para detener: kill $BACKEND_PID $FRONTEND_PID"

# Mantener script activo
wait