# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Escuchodromo is an emotional wellbeing platform using affective AI to provide personalized support. It's a monorepo using Nx with Next.js frontend and NestJS backend, all code and variables are in Spanish.

## Key Commands

### Development
```bash
# Install dependencies
npm install

# Database setup and migrations
npm run db:push
npm run db:seed

# Run applications
npm run dev         # Both backend and frontend in parallel
npm run dev:backend # Backend only at http://localhost:3333
npm run dev:web     # Frontend only at http://localhost:3000

# Database management
npm run db:studio   # GUI to view/edit database
npm run db:generate # Generate Prisma client after schema changes
```

### Testing and Quality
```bash
# Run tests
npm run test

# Linting
npm run lint

# Type checking (individual projects)
nx run backend:typecheck
nx run web:typecheck
```

### Building
```bash
# Production builds
npm run build          # Both projects
npm run build:web      # Frontend only
npm run build:backend  # Backend only

# Build specific library
nx build shared
```

## Architecture

### Monorepo Structure
- **apps/web**: Next.js 15 frontend with App Router
- **apps/backend**: NestJS backend with modular architecture
- **libs/shared**: Shared types, constants, and utilities
- **prisma**: Database schema and migrations

### Backend Modules (all in Spanish)
- **autenticacion**: JWT authentication with Passport strategies
- **usuarios**: User and profile management
- **chat**: Real-time chat with Socket.io WebSocket
- **voz**: Voice transcription (STT), synthesis (TTS), and emotion analysis
- **evaluaciones**: Psychological assessments (PHQ-9, GAD-7)
- **recomendaciones**: AI-powered personalized recommendations
- **notificaciones**: Email, push, and SMS notifications
- **pagos**: Payment system with Stripe/PayPal integration (COP/USD)
- **administracion**: Admin panel with analytics and user management
- **prisma**: Global database service

### Frontend Structure
- App Router pages in `apps/web/src/app/`
- Reusable UI components in `apps/web/src/lib/componentes/`
- All component names and variables in Spanish

### Database
- Development: SQLite with file-based database
- Production: PostgreSQL (configured via DATABASE_URL)
- Schema uses Spanish field names throughout

### Authentication Flow
1. Backend uses JWT with separate access tokens
2. Frontend stores token in localStorage
3. WebSocket authentication via handshake auth token
4. Role-based guards: USUARIO, TERAPEUTA, ADMIN

### Key Design Patterns
- All modules export their main module class
- Services handle business logic
- Controllers handle HTTP/WebSocket endpoints
- DTOs for validation using class-validator
- Prisma service is globally available

### Environment Variables
Required in `.env`:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Test Credentials
- User: usuario@escuchodromo.com / 123456
- Admin: admin@escuchodromo.com / 123456

## Important Notes
- All code, comments, and variables must be in Spanish
- The project uses emotional AI for mental health support
- Psychological tests follow validated clinical standards
- WebSocket Gateway is at `/chat` namespace
- Voice WebSocket Gateway is at `/voz` namespace
- Shared library is imported as `@escuchodromo/shared`
- Voice features use Web Speech API for STT and require external services for TTS
- Internationalization (i18n) with next-intl for ES/EN support
- Payment integration ready for Stripe/PayPal (implementation requires API keys)