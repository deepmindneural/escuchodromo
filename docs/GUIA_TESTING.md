# Guía de Testing - Escuchodromo

Guía completa para ejecutar, mantener y extender los tests del sistema de profesionales de Escuchodromo.

## Tabla de Contenidos

1. [Instalación y Setup](#instalación-y-setup)
2. [Ejecutar Tests](#ejecutar-tests)
3. [Estructura de Tests](#estructura-de-tests)
4. [Escribir Nuevos Tests](#escribir-nuevos-tests)
5. [Debugging de Tests](#debugging-de-tests)
6. [CI/CD](#cicd)
7. [FAQs y Troubleshooting](#faqs-y-troubleshooting)

---

## Instalación y Setup

### 1. Instalar Dependencias

```bash
# Instalar todas las dependencias (incluye dependencias de testing)
npm install
```

Dependencias de testing instaladas:
- `jest` - Framework de testing
- `@testing-library/react` - Testing de componentes React
- `@testing-library/user-event` - Simulación de eventos de usuario
- `@testing-library/jest-dom` - Matchers personalizados de DOM
- `@playwright/test` - Framework E2E
- `jest-axe` - Testing de accesibilidad

### 2. Configurar Variables de Entorno

Crear archivo `.env.test` en la raíz del proyecto:

```bash
# Base de datos de test (SQLite en memoria)
DATABASE_URL="file::memory:?cache=shared"

# Supabase (test)
NEXT_PUBLIC_SUPABASE_URL="https://test.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="test-anon-key"
SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"

# JWT
JWT_SECRET="test-jwt-secret-change-in-production"
NEXTAUTH_SECRET="test-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Playwright
PLAYWRIGHT_TEST_BASE_URL="http://localhost:3000"
```

### 3. Inicializar Base de Datos de Test

```bash
# Aplicar migraciones
npm run db:push

# Seed con datos de prueba
npm run db:seed
```

---

## Ejecutar Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests (unit + integration)
npm run test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ejecutar solo tests unitarios
npm run test:unit

# Ejecutar solo tests de integración
npm run test:integration

# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests de accesibilidad
npm run test:a11y

# Generar reporte de cobertura
npm run test:coverage

# Ver reporte HTML de cobertura
npm run test:coverage:html
```

### Ejecutar Tests Específicos

```bash
# Ejecutar tests de un archivo específico
npm run test CardProfesional.test.tsx

# Ejecutar tests que matchean un patrón
npm run test -- --testNamePattern="debe renderizar"

# Ejecutar tests de un componente
npm run test -- CardProfesional

# Ejecutar tests en modo verbose (más detalles)
npm run test -- --verbose

# Ejecutar tests con bail (detenerse en primer fallo)
npm run test -- --bail
```

### Tests E2E con Playwright

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar tests E2E en modo UI (interfaz gráfica)
npm run test:e2e:ui

# Ejecutar tests E2E en modo debug
npm run test:e2e:debug

# Ejecutar tests E2E en navegador específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Ejecutar test específico
npx playwright test e2e/reservar-cita.spec.ts

# Generar reporte HTML
npx playwright show-report
```

---

## Estructura de Tests

### Organización de Archivos

```
escuchodromo/
├── src/
│   └── lib/
│       └── componentes/
│           ├── CardProfesional.tsx
│           └── __tests__/
│               ├── CardProfesional.test.tsx         # Tests unitarios
│               ├── CalendarioMensual.test.tsx
│               └── accesibilidad.test.tsx           # Suite de a11y
│
├── supabase/
│   └── functions/
│       ├── reservar-cita/
│       │   └── index.ts
│       └── __tests__/
│           └── reservar-cita.test.ts                # Tests de integración
│
├── e2e/
│   ├── reservar-cita.spec.ts                        # Tests E2E
│   └── buscar-profesionales.spec.ts
│
├── jest.config.js                                   # Configuración Jest
├── jest.setup.js                                    # Setup de Jest
└── playwright.config.ts                             # Configuración Playwright
```

### Convenciones de Nombres

- **Tests unitarios**: `*.test.tsx` o `*.spec.tsx`
- **Tests de integración**: `*.integration.test.ts`
- **Tests E2E**: `*.spec.ts` en carpeta `e2e/`
- **Tests de accesibilidad**: `accesibilidad.test.tsx`

### Estructura de un Test

```typescript
/**
 * Descripción del componente/función testeada
 * Importancia: Alta/Media/Baja
 * Cobertura objetivo: X%
 */

import { render, screen } from '@testing-library/react';
import { ComponenteATestear } from '../ComponenteATestear';

describe('ComponenteATestear', () => {
  // Setup común (si es necesario)
  beforeEach(() => {
    // Configuración antes de cada test
  });

  // Grupo lógico de tests
  describe('Renderizado básico', () => {
    it('debe renderizar con props mínimas', () => {
      // Arrange (preparar)
      const props = { /* ... */ };

      // Act (ejecutar)
      render(<ComponenteATestear {...props} />);

      // Assert (verificar)
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('Interacciones de usuario', () => {
    it('debe llamar callback al hacer click', async () => {
      const user = userEvent.setup();
      const mockCallback = jest.fn();

      render(<ComponenteATestear onClick={mockCallback} />);

      const boton = screen.getByRole('button');
      await user.click(boton);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('debe manejar props nulas sin crash', () => {
      expect(() => render(<ComponenteATestear data={null} />)).not.toThrow();
    });
  });
});
```

---

## Escribir Nuevos Tests

### 1. Tests Unitarios de Componentes

**Qué testear**:
- Renderizado con diferentes props
- Eventos de usuario (clicks, inputs, keyboard)
- Estados (loading, error, success)
- Lógica condicional
- Edge cases

**Ejemplo**:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MiComponente } from '../MiComponente';

describe('MiComponente', () => {
  it('debe mostrar texto personalizado', () => {
    render(<MiComponente texto="Hola Mundo" />);
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
  });

  it('debe manejar click en botón', async () => {
    const user = userEvent.setup();
    const mockClick = jest.fn();

    render(<MiComponente onClick={mockClick} />);

    await user.click(screen.getByRole('button'));

    expect(mockClick).toHaveBeenCalled();
  });
});
```

### 2. Tests de Integración (Edge Functions)

**Qué testear**:
- Autenticación y autorización
- Validación de payload
- Lógica de negocio
- Manejo de errores
- Respuestas correctas

**Ejemplo**:

```typescript
describe('POST /api/reservar-cita', () => {
  it('debe crear cita con datos válidos', async () => {
    const payload = {
      profesional_id: 'prof-123',
      fecha_hora: '2025-10-27T14:00:00.000Z',
      duracion: 60,
      modalidad: 'virtual',
    };

    const response = await request(app)
      .post('/api/reservar-cita')
      .set('Authorization', 'Bearer valid-token')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.cita).toBeDefined();
  });

  it('debe rechazar request sin autenticación', async () => {
    const response = await request(app)
      .post('/api/reservar-cita')
      .send({});

    expect(response.status).toBe(401);
  });
});
```

### 3. Tests E2E con Playwright

**Qué testear**:
- Flujos completos de usuario
- Integración entre múltiples páginas
- Funcionalidad crítica end-to-end

**Ejemplo**:

```typescript
import { test, expect } from '@playwright/test';

test('Flujo de reserva de cita', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@test.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 2. Buscar profesional
  await page.goto('/profesionales');
  await page.fill('input[placeholder*="Buscar"]', 'ansiedad');

  // 3. Seleccionar profesional
  const profesional = page.locator('[data-testid="card-profesional"]').first();
  await profesional.click();

  // 4. Reservar cita
  await page.click('button:has-text("Reservar")');

  // 5. Verificar confirmación
  await expect(page.locator('[data-testid="mensaje-confirmacion"]')).toBeVisible();
});
```

### 4. Tests de Accesibilidad

**Qué testear**:
- Cumplimiento WCAG 2.1 AA
- Navegación por teclado
- ARIA labels y roles
- Contraste de colores

**Ejemplo**:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accesibilidad', () => {
  it('NO debe tener violaciones automáticas', async () => {
    const { container } = render(<MiComponente />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('debe ser navegable por teclado', async () => {
    render(<MiComponente />);
    const boton = screen.getByRole('button');

    // Simular Tab
    boton.focus();
    expect(boton).toHaveFocus();

    // Simular Enter
    await userEvent.keyboard('{Enter}');
    // Verificar acción
  });
});
```

---

## Debugging de Tests

### Debugging de Tests Unitarios

**1. Usar `debug()` de Testing Library**:

```typescript
import { render, screen } from '@testing-library/react';

it('test de debug', () => {
  const { debug } = render(<MiComponente />);

  // Imprime todo el DOM renderizado
  debug();

  // Imprime un elemento específico
  debug(screen.getByRole('button'));
});
```

**2. Ver queries disponibles**:

```typescript
it('test de debug queries', () => {
  render(<MiComponente />);

  // Muestra todas las queries disponibles
  screen.logTestingPlaygroundURL();
});
```

**3. Ejecutar test específico en modo debug**:

```bash
# Usar node --inspect-brk
node --inspect-brk node_modules/.bin/jest CardProfesional.test.tsx

# Abrir Chrome DevTools en chrome://inspect
```

### Debugging de Tests E2E (Playwright)

**1. Modo UI (recomendado)**:

```bash
npm run test:e2e:ui
```

**2. Modo Debug**:

```bash
npm run test:e2e:debug
```

**3. Headed mode (ver navegador)**:

```bash
npx playwright test --headed
```

**4. Slow motion**:

```bash
npx playwright test --headed --slow-mo=1000
```

**5. Capturar screenshots**:

```typescript
test('mi test', async ({ page }) => {
  await page.goto('/profesionales');

  // Capturar screenshot
  await page.screenshot({ path: 'debug.png' });

  // Capturar screenshot de elemento específico
  const element = page.locator('.card');
  await element.screenshot({ path: 'element.png' });
});
```

---

## CI/CD

### GitHub Actions Workflow

El proyecto incluye un workflow de GitHub Actions que ejecuta tests automáticamente en cada PR y push a `main`.

**Archivo**: `.github/workflows/tests.yml`

**Jobs ejecutados**:
1. Tests unitarios e integración
2. Tests E2E (Playwright)
3. Tests de accesibilidad
4. Linting y type checking
5. Reporte de cobertura

### Ver Resultados en GitHub

1. **En PRs**: Comentario automático con cobertura
2. **En Actions tab**: Logs detallados de cada job
3. **Artifacts**: Reportes HTML descargables

### Configurar Codecov (opcional)

1. Crear cuenta en [codecov.io](https://codecov.io)
2. Agregar `CODECOV_TOKEN` en GitHub Secrets
3. El workflow subirá cobertura automáticamente

---

## FAQs y Troubleshooting

### Tests Fallando

**Q: Tests pasan localmente pero fallan en CI**
```
A: Verificar:
- Variables de entorno en CI
- Timezone (tests de fechas)
- Timeouts (aumentar en CI)
- Dependencias instaladas correctamente
```

**Q: Error "Cannot find module 'next/jest'"**
```bash
# Solución: Instalar dependencias
npm install
```

**Q: Tests E2E fallan con timeout**
```bash
# Solución: Aumentar timeout
# playwright.config.ts
timeout: 60 * 1000, // 60 segundos
```

### Cobertura

**Q: Cobertura baja en componente**
```
A: Verificar:
- ¿Hay casos edge sin testear?
- ¿Faltan tests de error handling?
- ¿Hay código muerto (dead code)?
```

**Q: ¿Cómo excluir archivos de cobertura?**
```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.stories.tsx', // Excluir Storybook
]
```

### Performance

**Q: Tests muy lentos**
```bash
# Solución 1: Ejecutar en paralelo
npm run test -- --maxWorkers=4

# Solución 2: Solo changed files
npm run test -- --onlyChanged

# Solución 3: Caché
npm run test -- --cache
```

**Q: Tests E2E muy lentos**
```bash
# Ejecutar solo en un navegador
npx playwright test --project=chromium
```

### Mocks

**Q: ¿Cómo mockear Supabase client?**
```typescript
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));
```

**Q: ¿Cómo mockear Next.js router?**
```typescript
// Ya está mockeado en jest.setup.js
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

---

## Recursos Adicionales

### Documentación Oficial

- [Jest](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [jest-axe](https://github.com/nickcolley/jest-axe)

### Guías Recomendadas

- [Testing Trophy by Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Contacto

Si tienes dudas o encuentras problemas:
1. Revisar esta guía
2. Buscar en documentación oficial
3. Preguntar al equipo de QA

---

**Última actualización**: 2025-10-20
**Mantenedor**: Equipo de QA - Escuchodromo
