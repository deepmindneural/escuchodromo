# Guía de Migración a PostgreSQL

## Pasos para migrar de SQLite a PostgreSQL

### 1. Preparar PostgreSQL

```bash
# Instalar PostgreSQL (macOS con Homebrew)
brew install postgresql
brew services start postgresql

# Crear base de datos
createdb escuchodromo

# O usando Docker
docker run --name postgres-escuchodromo \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=escuchodromo \
  -p 5432:5432 \
  -d postgres:15

# Para acceder al contenedor
docker exec -it postgres-escuchodromo psql -U postgres -d escuchodromo
```

### 2. Actualizar configuración

```bash
# Actualizar .env con la nueva conexión
DATABASE_URL="postgresql://usuario:password@localhost:5432/escuchodromo?schema=public"

# O para producción (ejemplo)
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?schema=public"
```

### 3. Cambiar schema de Prisma

```bash
# Copiar schema de PostgreSQL
cp prisma/schema.postgres.prisma prisma/schema.prisma

# O editar manualmente prisma/schema.prisma
# Cambiar: provider = "sqlite" 
# Por:     provider = "postgresql"
```

### 4. Ejecutar migración

```bash
# Generar migración inicial
npm run db:generate

# Aplicar schema a PostgreSQL
npm run db:push

# O crear migración formal
npx prisma migrate dev --name init

# Ejecutar seed para datos de prueba
npm run db:seed
```

### 5. Verificar migración

```bash
# Verificar conexión
npx prisma studio

# Probar aplicación
npm run dev
```

## Diferencias importantes SQLite vs PostgreSQL

### Tipos de datos
- **SQLite**: Tipos dinámicos, más flexible
- **PostgreSQL**: Tipos estrictos, mejor para producción

### Funciones específicas
- **SQLite**: `datetime('now')` → **PostgreSQL**: `NOW()`
- **SQLite**: `AUTOINCREMENT` → **PostgreSQL**: `SERIAL` o `IDENTITY`

### Conexiones concurrentes
- **SQLite**: Una escritura a la vez
- **PostgreSQL**: Múltiples conexiones concurrentes

## Configuración de producción

### Variables de entorno recomendadas
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
JWT_SECRET="clave-secreta-muy-segura-cambiar-en-produccion"
NEXTAUTH_SECRET="otra-clave-secreta-para-nextauth"
```

### Optimizaciones PostgreSQL
```sql
-- Configuraciones recomendadas para PostgreSQL
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

## Comandos útiles

```bash
# Backup de PostgreSQL
pg_dump escuchodromo > backup.sql

# Restaurar backup
psql escuchodromo < backup.sql

# Ver conexiones activas
SELECT * FROM pg_stat_activity WHERE datname = 'escuchodromo';

# Tamaño de la base de datos
SELECT pg_size_pretty(pg_database_size('escuchodromo'));
```

## Servicios en la nube recomendados

### Heroku Postgres
```bash
# Agregar addon
heroku addons:create heroku-postgresql:mini

# Obtener URL
heroku config:get DATABASE_URL
```

### Railway
```bash
# Crear servicio PostgreSQL
railway add postgresql

# Variables se configuran automáticamente
```

### Neon (serverless PostgreSQL)
```bash
# Crear proyecto en https://neon.tech
# Copiar connection string
DATABASE_URL="postgres://user:pass@hostname.neon.tech/dbname?sslmode=require"
```

### Supabase
```bash
# Crear proyecto en https://supabase.com
# Obtener connection string desde settings
DATABASE_URL="postgresql://postgres:pass@hostname.supabase.co:5432/postgres"
```

## Verificación post-migración

1. **Funcionalidad completa**: Todas las operaciones CRUD funcionan
2. **Rendimiento**: Queries complejas son más rápidas
3. **Escalabilidad**: Múltiples usuarios concurrentes
4. **Backup/Restore**: Procesos automatizados
5. **Monitoreo**: Logs y métricas de performance

## Rollback si es necesario

```bash
# Volver a SQLite
cp prisma/schema.prisma prisma/schema.sqlite.backup
DATABASE_URL="file:./dev.db"

# Restaurar schema original
git checkout HEAD -- prisma/schema.prisma
npm run db:generate
```