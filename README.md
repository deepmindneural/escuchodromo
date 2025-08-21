# Escuchodromo

Plataforma de bienestar emocional que utiliza inteligencia artificial afectiva para brindar apoyo personalizado.

## Características

- 🤖 **IA Afectiva**: Chat y voz con comprensión emocional
- 📊 **Evaluaciones Psicológicas**: PHQ-9, GAD-7 y más pruebas validadas
- 🎯 **Recomendaciones Personalizadas**: Basadas en tu estado emocional
- 🌐 **Multiidioma**: Español e Inglés
- 💳 **Pagos**: Soporte para COP y USD

## Tecnologías

### Frontend
- **Next.js 15** con App Router
- **React 19**
- **Tailwind CSS** para estilos
- **GSAP** para animaciones profesionales
- **Framer Motion** para micro-interacciones
- **Radix UI** para componentes accesibles
- **Recharts** para gráficos y visualizaciones
- **React Table** para tablas avanzadas
- **React Hook Form** para formularios
- **Zod** para validación de esquemas

### Backend
- **NestJS** con arquitectura modular
- **Prisma** ORM con SQLite (desarrollo) / PostgreSQL (producción)
- **JWT** para autenticación
- **Socket.io** para chat en tiempo real

### Monorepo
- **Nx** para gestión del monorepo
- Código compartido entre web, backend y futuras apps móviles

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/escuchodromo.git
cd escuchodromo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Configurar base de datos
npm run db:push      # Crear tablas
npm run db:generate  # Generar cliente Prisma
npm run db:seed      # Poblar con datos de prueba

# Iniciar desarrollo
npm run dev
```

## Scripts disponibles

### Desarrollo
```bash
# Ejecutar ambos servidores (frontend y backend)
npm run dev

# Ejecutar individualmente
npm run dev:web       # Frontend en http://localhost:3000
npm run dev:backend   # Backend en http://localhost:3333
```

### Base de Datos - Comandos Prisma
```bash
# Configurar base de datos inicial y crear tablas
npm run db:push

# Interfaz gráfica para ver/editar datos
npm run db:studio

# Generar cliente Prisma después de cambios en schema
npm run db:generate

# Poblar base de datos con datos de prueba
npm run db:seed

# Crear migración (producción)
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Resetear base de datos (¡CUIDADO! Borra todos los datos)
npx prisma db push --force-reset
```

### Producción
```bash
# Construir ambos proyectos
npm run build

# Construir individualmente
npm run build:web
npm run build:backend
```

### Testing y Calidad
```bash
# Ejecutar tests
npm run test

# Linting
npm run lint

# Type checking
nx run backend:typecheck
nx run web:typecheck
```

## Variables de entorno

Crear archivo `.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-clave-secreta"
NEXTAUTH_SECRET="tu-clave-secreta"
NEXTAUTH_URL="http://localhost:3000"
```

## Estructura del proyecto

```
escuchodromo/
├── apps/
│   ├── web/            # Frontend Next.js
│   └── backend/        # Backend NestJS
├── libs/
│   └── shared/         # Código compartido
├── prisma/
│   └── schema.prisma   # Esquema de base de datos
└── nx.json            # Configuración Nx
```

## Módulos del Backend

- **Autenticación**: JWT, registro, login
- **Usuarios**: Gestión de perfiles
- **Chat**: Conversaciones en tiempo real
- **Voz**: Transcripción y síntesis
- **Evaluaciones**: Tests psicológicos
- **Recomendaciones**: IA personalizada
- **Pagos**: Stripe/PayPal
- **Notificaciones**: Email, Push, SMS

## Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Proyecto privado - Todos los derechos reservados