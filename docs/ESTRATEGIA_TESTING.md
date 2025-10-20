# Estrategia de Testing - Sistema de Profesionales Escuchodromo

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Alcance y Prioridades](#alcance-y-prioridades)
3. [Arquitectura de Testing](#arquitectura-de-testing)
4. [Casos de Prueba Críticos](#casos-de-prueba-críticos)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Métricas de Calidad](#métricas-de-calidad)
7. [Timeline de Implementación](#timeline-de-implementación)
8. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

---

## Resumen Ejecutivo

### Objetivo
Implementar una estrategia de testing integral para el sistema de profesionales de Escuchodromo, garantizando la fiabilidad, seguridad y accesibilidad de una plataforma de salud mental donde las fallas pueden afectar directamente el bienestar de usuarios vulnerables.

### Alcance
- **Edge Functions**: 3 funciones críticas (listar, reservar, disponibilidad)
- **Componentes UI**: 9 componentes React con enfoque en UX de salud mental
- **Páginas**: 5 páginas del flujo de profesionales
- **Flujos E2E**: 3 flujos completos de usuario
- **Accesibilidad**: Cumplimiento WCAG 2.1 AA

### Cobertura Objetivo
- **Código crítico**: 100% (funciones de reserva, validaciones de disponibilidad)
- **Componentes UI**: 85% (lógica de negocio y estados de error)
- **Edge Functions**: 90% (casos de éxito, error y edge cases)
- **Cobertura general**: 80% mínimo

---

## Alcance y Prioridades

### Prioridad P0 (Crítica - Bloqueante)
**Impacto**: Una falla puede impedir reservas o causar problemas de salud mental

1. **Edge Function: reservar-cita**
   - Validación de autenticación JWT
   - Verificación de disponibilidad de horarios
   - Prevención de solapamientos de citas
   - Encriptación de motivo de consulta (PHI)
   - Rate limiting (máx 5 citas/día)

2. **Componente: CalendarioMensual**
   - Selección correcta de fechas
   - Indicadores de disponibilidad precisos
   - Prevención de selección de fechas pasadas
   - Accesibilidad (navegación por teclado)

3. **Flujo E2E: Búsqueda y Reserva de Cita**
   - Usuario en crisis puede encontrar y reservar ayuda
   - Confirmación clara y reconfortante
   - Manejo de errores sin frustrar al usuario

### Prioridad P1 (Alta - Importante)
**Impacto**: Afecta experiencia pero no bloquea funcionalidad crítica

4. **Edge Function: listar-profesionales**
   - Filtros funcionan correctamente
   - Paginación eficiente
   - Ordenamiento por rating/precio/experiencia

5. **Componentes: CardProfesional, SlotsDisponibles**
   - Información completa y precisa
   - Estados de carga y error
   - Responsive design

6. **Accesibilidad: Suite axe-core**
   - WCAG 2.1 AA compliance
   - Navegación por teclado
   - Screen reader compatibility

### Prioridad P2 (Media - Deseable)
**Impacto**: Mejora calidad general pero no es crítica

7. **Edge Function: disponibilidad-profesional**
   - Cálculo correcto de slots disponibles
   - Consideración de zona horaria

8. **Componentes secundarios**: SelectorDuracion, SelectorModalidad
9. **Tests de performance**: Tiempo de carga, renderizado

### Prioridad P3 (Baja - Nice to have)
10. **Tests de integración visual** (Chromatic/Percy)
11. **Tests de carga** (Artillery/k6)
12. **Monitoreo en producción** (Sentry, Datadog)

---

## Arquitectura de Testing

### Pirámide de Testing Adaptada

```
                    /\
                   /  \
                  / E2E \          10% - Flujos críticos de usuario
                 /--------\
                /          \
               / INTEGRACIÓN \     30% - API + Base de datos
              /--------------\
             /                \
            /   UNIT TESTS     \   60% - Componentes + Lógica
           /--------------------\
```

### Niveles de Testing

#### 1. Unit Tests (60% del esfuerzo)
**Herramientas**: Jest + React Testing Library + Testing Library User Event

**Qué testear**:
- Renderizado de componentes con diferentes props
- Eventos de usuario (clicks, inputs, keyboard)
- Estados (loading, error, success)
- Validaciones de formularios
- Cálculos de disponibilidad
- Utilidades y helpers

**Ejemplo de cobertura para CardProfesional**:
```typescript
describe('CardProfesional', () => {
  // ✅ Renderizado
  it('debe renderizar información básica del profesional')
  it('debe renderizar foto de perfil o iniciales')
  it('debe renderizar estrellas de calificación correctamente')

  // ✅ Interacciones
  it('debe navegar a perfil al hacer click en "Ver perfil"')
  it('debe navegar a reserva al hacer click en "Reservar"')
  it('debe ser navegable por teclado (Enter/Space)')

  // ✅ Estados
  it('debe mostrar badge de "Disponible" cuando disponible=true')
  it('debe mostrar skeleton mientras carga')

  // ✅ Edge cases
  it('debe manejar profesional sin foto (mostrar iniciales)')
  it('debe limitar especialidades mostradas a 3')
  it('debe formatear correctamente precios en COP')
});
```

#### 2. Integration Tests (30% del esfuerzo)
**Herramientas**: Jest + Supertest (para Edge Functions) + Supabase Test Client

**Qué testear**:
- Respuestas de Edge Functions con datos válidos
- Manejo de errores con datos inválidos
- Autenticación y autorización
- Validación de parámetros
- Interacción con base de datos (mocks o test DB)

**Ejemplo para Edge Function reservar-cita**:
```typescript
describe('POST /reservar-cita', () => {
  // ✅ Happy path
  it('debe crear cita con datos válidos y token JWT')

  // ✅ Autenticación
  it('debe rechazar request sin token')
  it('debe rechazar token expirado')
  it('debe rechazar usuario con rol TERAPEUTA')

  // ✅ Validaciones
  it('debe rechazar duracion inválida (no 30 ni 60)')
  it('debe rechazar fecha pasada')
  it('debe rechazar modalidad inválida')

  // ✅ Lógica de negocio
  it('debe rechazar si no hay disponibilidad')
  it('debe rechazar si hay solapamiento con otra cita')
  it('debe aplicar rate limiting (máx 5 citas/día)')

  // ✅ Seguridad
  it('debe encriptar motivo_consulta (PHI)')
  it('debe registrar auditoría de acceso')
});
```

#### 3. E2E Tests (10% del esfuerzo)
**Herramientas**: Playwright (preferido) o Cypress

**Flujos críticos a testear**:

1. **Flujo: Búsqueda y Reserva de Cita (Paciente en Crisis)**
   ```gherkin
   Given un usuario autenticado con estado emocional de "crisis"
   When busca profesionales por "ansiedad"
   And filtra por modalidad "virtual" y disponibilidad "inmediata"
   And selecciona un profesional con rating alto
   And elige fecha de hoy + 2 horas
   And completa motivo de consulta "Crisis de ansiedad"
   And confirma reserva
   Then ve mensaje reconfortante "Tu cita está confirmada. No estás solo/a"
   And recibe email de confirmación
   And profesional recibe notificación
   ```

2. **Flujo: Configuración de Disponibilidad (Profesional)**
   ```gherkin
   Given un profesional autenticado
   When navega a "Mi Disponibilidad"
   And agrega horario: Lunes 9:00-17:00
   And aplica plantilla "Semana laboral estándar"
   And guarda cambios
   Then ve confirmación "Disponibilidad actualizada"
   And los horarios aparecen en su calendario
   And pacientes pueden reservar en esos slots
   ```

3. **Flujo: Gestión de Citas (Profesional)**
   ```gherkin
   Given un profesional con 3 citas pendientes
   When navega a "Mi Calendario"
   And filtra por mes actual
   And selecciona cita del día
   Then ve información completa del paciente
   And puede confirmar/cancelar cita
   And paciente recibe notificación
   ```

---

## Casos de Prueba Críticos

### Categoría: Salud Mental (Máxima Prioridad)

#### 1. Reserva de Cita en Situación de Crisis
**Objetivo**: Usuario en crisis puede reservar sin demoras ni confusión

| Test ID | Escenario | Entrada | Resultado Esperado | Prioridad |
|---------|-----------|---------|-------------------|-----------|
| CR-001 | Usuario busca ayuda inmediata | Buscar "crisis", filtro disponibilidad "hoy" | Muestra solo profesionales con slots disponibles hoy | P0 |
| CR-002 | Selección rápida de horario | Click en primer slot disponible | Reserva inmediata sin pasos adicionales | P0 |
| CR-003 | Confirmación clara | Después de reservar | Mensaje reconfortante + instrucciones claras | P0 |
| CR-004 | Falla en reserva | Error del servidor | Mensaje empático + alternativas de contacto | P0 |

#### 2. Protección de Datos Sensibles (PHI - HIPAA/GDPR)
| Test ID | Escenario | Entrada | Resultado Esperado | Prioridad |
|---------|-----------|---------|-------------------|-----------|
| SEC-001 | Encriptación de motivo | "Tengo ideación suicida" | Encriptado en BD, no visible en logs | P0 |
| SEC-002 | Acceso no autorizado | Usuario intenta ver cita de otro | 403 Forbidden | P0 |
| SEC-003 | Auditoría de accesos | Profesional ve cita | Registro en tabla de auditoría | P1 |
| SEC-004 | Rate limiting | 6 reservas en 1 día | 5ta funciona, 6ta rechazada | P0 |

#### 3. Disponibilidad Realista
| Test ID | Escenario | Entrada | Resultado Esperado | Prioridad |
|---------|-----------|---------|-------------------|-----------|
| DISP-001 | Solapamiento de citas | Reservar mismo slot dos veces | Segunda reserva rechazada | P0 |
| DISP-002 | Horario fuera de disponibilidad | Reservar a las 22:00 (profesional solo 9-17) | Rechazado con mensaje claro | P0 |
| DISP-003 | Actualización en tiempo real | Otro usuario reserva slot | Slot desaparece del calendario inmediatamente | P1 |
| DISP-004 | Zona horaria | Usuario en GMT-5, profesional en GMT-3 | Horarios ajustados correctamente | P1 |

#### 4. Búsqueda de Profesional Especializado
| Test ID | Escenario | Entrada | Resultado Esperado | Prioridad |
|---------|-----------|---------|-------------------|-----------|
| BUS-001 | Búsqueda por especialidad | "TDAH" | Solo profesionales con especialidad TDAH | P1 |
| BUS-002 | Filtro por precio | Tarifa máx $100,000 | Solo profesionales <= $100k | P1 |
| BUS-003 | Ordenar por rating | Order by "rating" | Profesionales de mayor a menor rating | P1 |
| BUS-004 | Búsqueda sin resultados | "Especialidad inexistente" | Mensaje amigable + sugerencias | P1 |

### Categoría: Accesibilidad (WCAG 2.1 AA)

| Test ID | Criterio WCAG | Componente | Prueba | Prioridad |
|---------|---------------|------------|--------|-----------|
| A11Y-001 | 2.1.1 Teclado | CalendarioMensual | Tab, flechas, Enter funcionan | P1 |
| A11Y-002 | 2.1.2 Sin trampa de teclado | Modal confirmación | Se puede salir con Esc | P1 |
| A11Y-003 | 1.4.3 Contraste | CardProfesional | Contraste mínimo 4.5:1 | P1 |
| A11Y-004 | 4.1.2 Nombre, Rol, Valor | Todos los botones | ARIA labels correctos | P1 |
| A11Y-005 | 2.4.7 Foco visible | Todos los interactivos | Anillo de foco visible | P1 |
| A11Y-006 | 1.3.1 Información y relaciones | Formularios | Labels asociados a inputs | P1 |

### Categoría: Performance

| Test ID | Métrica | Objetivo | Medición | Prioridad |
|---------|---------|----------|----------|-----------|
| PERF-001 | Listado de profesionales | < 1 segundo | Tiempo hasta First Contentful Paint | P2 |
| PERF-002 | Búsqueda/filtrado | < 300ms | Tiempo de respuesta de Edge Function | P2 |
| PERF-003 | Reserva de cita | < 500ms | Tiempo total del flujo | P1 |
| PERF-004 | Tamaño de bundle | < 200KB | Tamaño gzipped de página profesionales | P2 |

---

## Stack Tecnológico

### Testing Framework
```json
{
  "unit": {
    "framework": "Jest 30.0.2",
    "library": "@testing-library/react 16.3.0",
    "utils": "@testing-library/user-event 14.6.1",
    "dom": "@testing-library/jest-dom 6.6.4"
  },
  "integration": {
    "http": "supertest (para Edge Functions)",
    "db": "@supabase/supabase-js 2.75.0 (test client)"
  },
  "e2e": {
    "framework": "Playwright (recomendado) o Cypress",
    "visual": "Playwright visual comparisons"
  },
  "accessibility": {
    "core": "jest-axe",
    "runtime": "@axe-core/react"
  },
  "coverage": {
    "tool": "Jest coverage (built-in)",
    "reporter": "lcov, html, text"
  }
}
```

### Configuración Jest (Next.js 15 + TypeScript)
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'supabase/functions/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!**/node_modules/**',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/componentes/CardProfesional.tsx': {
      branches: 90,
      functions: 90,
      lines: 90,
    },
    './supabase/functions/reservar-cita/index.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

---

## Métricas de Calidad

### Cobertura de Código (Code Coverage)

| Módulo | Objetivo | Justificación |
|--------|----------|---------------|
| Edge Functions (reservar-cita) | 95% | Crítico: maneja PHI, autenticación, disponibilidad |
| Edge Functions (listar-profesionales) | 85% | Alta: búsqueda y filtros importantes |
| CalendarioMensual | 90% | Alta: selección de fechas crítica |
| CardProfesional | 85% | Alta: información precisa esencial |
| SlotsDisponibles | 90% | Alta: disponibilidad debe ser exacta |
| Componentes secundarios | 75% | Media: menos críticos |
| Utilities/Helpers | 90% | Alta: usados en múltiples lugares |

### Métricas de Accesibilidad

- **0 violaciones automáticas** detectadas por axe-core
- **100% navegación por teclado** en componentes interactivos
- **Contraste mínimo 4.5:1** en todos los textos
- **ARIA labels completos** en todos los elementos interactivos

### Métricas de Performance

- **Time to Interactive (TTI)**: < 2 segundos
- **First Contentful Paint (FCP)**: < 1 segundo
- **API Response Time**: < 300ms (p95)
- **Bundle Size**: < 200KB (gzipped)

### Métricas de Fiabilidad

- **Flaky tests**: 0% tolerancia
- **Test execution time**: < 30 segundos (unit), < 5 minutos (E2E)
- **Test success rate**: 100% en CI/CD

---

## Timeline de Implementación

### Fase 1: Fundación (Semana 1)
**Duración**: 5 días
**Objetivo**: Configurar infraestructura de testing

- ✅ Día 1-2: Configuración de Jest + React Testing Library
  - Crear `jest.config.js`
  - Crear `jest.setup.js` con matchers custom
  - Configurar módulos y paths
  - Crear helpers de testing comunes

- ✅ Día 3-4: Setup de Playwright para E2E
  - Instalar Playwright
  - Configurar navegadores (Chromium, Firefox, Safari)
  - Crear fixtures y helpers
  - Configurar CI/CD pipeline básico

- ✅ Día 5: Configuración de accesibilidad
  - Instalar jest-axe y @axe-core/react
  - Crear helpers de testing a11y
  - Documentar estándares

### Fase 2: Tests Críticos P0 (Semana 2-3)
**Duración**: 10 días
**Objetivo**: Testear funcionalidad crítica que afecta salud del usuario

- ✅ Día 6-8: Edge Function reservar-cita (Integration Tests)
  - Autenticación y autorización (6 tests)
  - Validaciones de payload (8 tests)
  - Lógica de disponibilidad (10 tests)
  - Rate limiting y seguridad (5 tests)
  - **Total: ~30 tests, cobertura 95%**

- ✅ Día 9-11: Componente CalendarioMensual (Unit Tests)
  - Renderizado y navegación (8 tests)
  - Selección de fechas (10 tests)
  - Disponibilidad (6 tests)
  - Accesibilidad (8 tests)
  - **Total: ~32 tests, cobertura 90%**

- ✅ Día 12-14: Flujo E2E Búsqueda y Reserva
  - Happy path completo (1 test)
  - Escenario de crisis (1 test)
  - Manejo de errores (2 tests)
  - **Total: 4 tests E2E**

- ✅ Día 15: Buffer para ajustes y fixes

### Fase 3: Tests P1 (Semana 4)
**Duración**: 5 días
**Objetivo**: Cobertura de funcionalidad importante

- ✅ Día 16-17: Edge Function listar-profesionales
  - Búsqueda y filtros (12 tests)
  - Ordenamiento (5 tests)
  - Paginación (4 tests)
  - **Total: ~21 tests, cobertura 85%**

- ✅ Día 18-19: Componentes CardProfesional y SlotsDisponibles
  - CardProfesional (20 tests)
  - SlotsDisponibles (15 tests)
  - **Total: ~35 tests**

- ✅ Día 20: Suite de accesibilidad con axe-core
  - Tests automáticos en todos los componentes
  - Tests manuales de navegación por teclado
  - Documentación de resultados

### Fase 4: CI/CD y Automatización (Semana 5)
**Duración**: 3 días
**Objetivo**: Integración continua y reportes

- ✅ Día 21: GitHub Actions workflow
  - Pipeline de tests en PRs
  - Pipeline de tests en main
  - Configuración de caché

- ✅ Día 22: Reportes de cobertura
  - Integración con Codecov o Coveralls
  - Configuración de thresholds
  - Badges en README

- ✅ Día 23: Documentación y handoff
  - Guía de testing para el equipo
  - Patrones y mejores prácticas
  - Troubleshooting común

### Fase 5: Tests P2 y Optimización (Semana 6)
**Duración**: 5 días
**Objetivo**: Completar cobertura y optimizar

- ✅ Día 24-26: Tests restantes (P2)
  - Edge Function disponibilidad-profesional
  - Componentes secundarios
  - Utilities y helpers

- ✅ Día 27-28: Optimización
  - Refactorizar tests lentos
  - Eliminar duplicación
  - Mejorar mensajes de error
  - Performance testing básico

**Total: 28 días (6 semanas)**

---

## Riesgos y Mitigaciones

### Riesgo 1: Flaky Tests (Probabilidad: Alta)
**Impacto**: Baja confianza en tests, CI/CD bloqueado

**Mitigaciones**:
- Usar `waitFor` y `screen.findBy*` en lugar de timeouts arbitrarios
- Evitar depender de timing exacto
- Usar mocks estables para fechas/tiempos (`jest.useFakeTimers()`)
- Implementar retries solo en E2E (max 2)
- Monitorear flakiness con herramientas como Flaky Test Detector

### Riesgo 2: Tests Lentos (Probabilidad: Media)
**Impacto**: Feedback loop lento, desarrolladores saltan tests

**Mitigaciones**:
- Paralelizar ejecución con `--maxWorkers=4`
- Usar `--onlyChanged` en desarrollo
- Optimizar setup/teardown de DB
- Implementar caché agresivo en CI
- Objetivo: < 30s unit tests, < 5min E2E

### Riesgo 3: Cobertura Artificial (Probabilidad: Media)
**Impacto**: Falsa sensación de seguridad, bugs en producción

**Mitigaciones**:
- Code review de tests, no solo código
- Enfocarse en casos edge y paths de error
- Mutation testing con Stryker (opcional)
- Tests de integración > solo unit tests
- Priorizar tests de valor (no solo %)

### Riesgo 4: Mantenimiento de Tests (Probabilidad: Alta)
**Impacto**: Tests obsoletos, rápidamente desactualizados

**Mitigaciones**:
- Tests agnósticos a implementación (testing-library best practices)
- Usar `screen.getByRole` en lugar de clases/IDs
- Refactorizar tests junto con código
- Documentar patrones de testing
- Revisión de tests en cada PR

### Riesgo 5: Datos de Prueba Sensibles (Probabilidad: Baja)
**Impacto**: Violación de privacidad, problemas legales

**Mitigaciones**:
- Nunca usar datos reales de pacientes
- Generar datos sintéticos con Faker.js
- Anonimizar cualquier dato real
- Encriptar datos de test con claves diferentes
- Auditoría de datos de test

### Riesgo 6: Falta de Expertise en Testing (Probabilidad: Media)
**Impacto**: Tests de baja calidad, anti-patterns

**Mitigaciones**:
- Training del equipo en testing best practices
- Documentación clara de patrones
- Pair programming en tests complejos
- Code review riguroso de tests
- Consultoría externa si es necesario

---

## Comandos de Testing

### Desarrollo Local
```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests de un archivo específico
npm run test CardProfesional.test.tsx

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar solo tests unitarios
npm run test:unit

# Ejecutar solo tests de integración
npm run test:integration

# Ejecutar tests E2E (Playwright)
npm run test:e2e

# Ejecutar tests E2E en modo UI
npm run test:e2e:ui

# Ejecutar tests de accesibilidad
npm run test:a11y

# Generar reporte de cobertura HTML
npm run test:coverage:html
```

### CI/CD
```bash
# Pipeline de PR (rápido, solo changed files)
npm run test:ci:pr

# Pipeline de main (completo con cobertura)
npm run test:ci:full

# Pipeline de E2E en staging
npm run test:e2e:staging

# Verificar umbrales de cobertura
npm run test:coverage:check
```

---

## Próximos Pasos

1. ✅ **Aprobación del equipo**: Revisar y aprobar estrategia
2. ✅ **Setup de proyecto**: Ejecutar Fase 1 (configuración)
3. ✅ **Priorizar tests P0**: Comenzar con reservar-cita
4. ✅ **Iteración continua**: Agregar tests en cada feature nueva
5. ✅ **Monitoreo**: Revisar métricas semanalmente

---

## Referencias

- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [HIPAA Compliance Testing](https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html)
- [Testing Trophy by Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

**Documento creado**: 2025-10-20
**Versión**: 1.0
**Autor**: QA Engineer - Escuchodromo
**Próxima revisión**: 2025-11-20
