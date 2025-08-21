#!/bin/bash

# Script de instalación para VPS - Escuchodromo
echo "🚀 Instalando Escuchodromo en VPS..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ Node.js $(node --version) y npm $(npm --version) disponibles"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production=false

# Generar cliente Prisma
echo "🗄️ Generando cliente Prisma..."
npx prisma generate

# Construir aplicaciones
echo "🔨 Construyendo aplicaciones..."
npm run build

# Configurar base de datos
echo "🗄️ Configurando base de datos..."
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
fi

# Aplicar migraciones si es PostgreSQL
if [[ $DATABASE_URL == postgresql* ]]; then
    echo "🔄 Aplicando migraciones..."
    npx prisma migrate deploy
else
    echo "📊 Empujando esquema a SQLite..."
    npx prisma db push
fi

# Poblar base de datos
echo "🌱 Poblando base de datos con datos iniciales..."
npm run db:seed

echo "✅ Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configurar variables de entorno en .env.production"
echo "2. Configurar servidor web (Nginx/Apache)"
echo "3. Configurar proceso manager (PM2)"
echo "4. Ejecutar: npm run start:production"