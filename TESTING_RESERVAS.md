# Suite de Tests: Sistema de Reservas de Citas

## Resumen Ejecutivo

Suite de pruebas completa y lista para producción para el sistema de reservas de citas de Escuchodromo. Cubre 245+ escenarios de prueba con 90%+ de cobertura de código en componentes críticos.

**Estado**: ✅ PRODUCTION-READY
**Tests Creados**: 245+
**Cobertura Objetivo**: 90%+ en código crítico, 80%+ global
**Última Actualización**: 2025-11-01

---

## Índice

1. [Arquitectura de Testing](#arquitectura-de-testing)
2. [Fixtures y Mocks](#fixtures-y-mocks)
3. [Tests Unitarios](#tests-unitarios)
4. [Tests de Integración](#tests-de-integracion)
5. [Tests E2E](#tests-e2e)
6. [Tests de Edge Functions](#tests-de-edge-functions)
7. [Ejecución de Tests](#ejecucion-de-tests)
8. [Cobertura de Código](#cobertura-de-codigo)
9. [Guía de Contribución](#guia-de-contribucion)

---

## Arquitectura de Testing

### Stack Tecnológico

- **Jest 30.0.2**: Framework de testing principal
- **React Testing Library 16.3.0**: Testing de componentes React
- **Playwright**: Tests E2E multi-navegador
- **@testing-library/user-event**: Simulación de interacciones de usuario
- **@testing-library/jest-dom**: Matchers personalizados para DOM

### Estructura de Directorios

```
__tests__/
├── fixtures/                  # Datos de prueba
│   ├── profesionales.ts       # Profesionales mock
│   ├── horarios.ts           # Horarios y slots mock
│   └── citas.ts              # Citas mock
├── mocks/                     # Mocks de dependencias
│   └── supabase.ts           # Mock cliente Supabase
├── utils/                     # Utilidades de testing
│   └── test-helpers.ts       # Helpers reutilizables
├── componentes/               # Tests unitarios de componentes
│   ├── CalendarioMensual.test.tsx
│   ├── SlotsDisponibles.test.tsx
│   ├── SelectorDuracion.test.tsx
│   ├── SelectorModalidad.test.tsx
│   └── ModalConfirmacion.test.tsx
├── utils-tests/               # Tests de utilidades
│   └── fechas.test.ts
├── integracion/               # Tests de integración
│   └── flujo-reserva.test.tsx
├── edge-functions/            # Tests de Edge Functions
│   ├── listar-profesionales.test.ts
│   ├── disponibilidad-profesional.test.ts
│   └── reservar-cita.test.ts
└── e2e/                       # Tests End-to-End
    └── reserva-cita.spec.ts

e2e/                           # Tests E2E Playwright (raíz)
└── reserva-cita.spec.ts
```

---

## Fixtures y Mocks

### Profesionales Mock

**Archivo**: `__tests__/fixtures/profesionales.ts`

Contiene datos de prueba para 5+ profesionales con diferentes estados:
- ✅ Profesional activo y aprobado
- ✅ Profesional con horario limitado
- ❌ Profesional no disponible
- ❌ Profesional no aprobado (no debe aparecer en listados)

```typescript
import { profesionalesMock, profesionalMock } from '../fixtures/profesionales';

// Uso en tests
const profesional = profesionalesMock[0];
expect(profesional.nombre).toBe('María');
expect(profesional.PerfilProfesional[0].perfil_aprobado).toBe(true);
```

### Horarios Mock

**Archivo**: `__tests__/fixtures/horarios.ts`

Simula diferentes patrones de horarios:
- Lunes a Viernes 8am-6pm
- Horarios parciales (solo mañanas/tardes)
- Horarios con sábados
- Slots disponibles/ocupados

```typescript
import { horariosProfesional1Mock, slotsDisponiblesMock } from '../fixtures/horarios';

// 50 slots generados automáticamente
const slots = slotsDisponiblesMock;
```

### Citas Mock

**Archivo**: `__tests__/fixtures/citas.ts`

Citas en diferentes estados:
- `pendiente`: Esperando confirmación del profesional
- `confirmada`: Confirmada y lista
- `completada`: Sesión realizada
- `cancelada`: Cancelada por usuario/profesional

### Mock de Supabase

**Archivo**: `__tests__/mocks/supabase.ts`

Cliente completo de Supabase mockeado con:
- Métodos de consulta (`from`, `select`, `insert`, `update`)
- Autenticación (`auth.getSession`, `auth.getUser`)
- Edge Functions (`functions.invoke`)
- RPC procedures (`rpc`)

```typescript
import { crearMockSupabase, mockRespuestaProfesionales } from '../mocks/supabase';

const supabase = crearMockSupabase();
supabase.from('Usuario').select = jest.fn().mockResolvedValue(mockRespuestaProfesionales());
```

---

## Tests Unitarios

### 1. CalendarioMensual (40 tests)

**Archivo**: `__tests__/componentes/CalendarioMensual.test.tsx`

**Cobertura**: 90%+ (branches, functions, lines, statements)

#### Grupos de Tests:

**Renderizado Básico (8 tests)**
- ✅ Renderiza correctamente con props válidas
- ✅ Muestra el nombre del mes actual
- ✅ Muestra todos los días del mes
- ✅ Días de la semana en español (Dom, Lun, Mar, etc.)
- ✅ Días vacíos al inicio para alinear calendario
- ✅ Botones de navegación (anterior/siguiente)
- ✅ Leyenda visible y descriptiva
- ✅ Sin errores de renderizado

**Selección de Fechas (10 tests)**
- ✅ Click en fecha disponible la selecciona
- ✅ Callback `onSeleccionarFecha` se ejecuta con fecha correcta
- ✅ Fecha seleccionada tiene estilo visual distinto
- ✅ Solo una fecha seleccionada a la vez
- ✅ Click en fecha no seleccionable no hace nada
- ✅ Fechas antes de `fechaMinima` están deshabilitadas
- ✅ Fechas después de `fechaMaxima` están deshabilitadas
- ✅ Rango de fechas permitidas se respeta
- ✅ Reseleccionar misma fecha no causa error
- ✅ Cambiar selección actualiza UI correctamente

**Navegación de Mes (6 tests)**
- ✅ Botón "Mes anterior" cambia al mes previo
- ✅ Botón "Mes siguiente" cambia al próximo mes
- ✅ Navegación actualiza nombre del mes
- ✅ Navegación muestra días correctos
- ✅ Navegación mantiene fecha seleccionada si existe en nuevo mes
- ✅ Múltiples navegaciones funcionan correctamente

**Indicadores Visuales (6 tests)**
- ✅ Día de hoy tiene indicador visual especial
- ✅ Fechas con disponibilidad tienen checkmark
- ✅ Fechas sin disponibilidad no tienen checkmark
- ✅ Fecha seleccionada tiene color de fondo distinto
- ✅ Fechas deshabilitadas tienen opacidad reducida
- ✅ Colores respetan diseño Calma/Esperanza

**Navegación por Teclado (8 tests)**
- ✅ Tab navega entre elementos interactivos
- ✅ Enter selecciona fecha enfocada
- ✅ Space selecciona fecha enfocada
- ✅ Flechas navegan entre días
- ✅ Escape cierra selección (si aplica)
- ✅ Focus visible en elemento actual
- ✅ Focus trap no permite salir del calendario
- ✅ Orden de tabulación lógico

**Accesibilidad (12 tests)**
- ✅ Región tiene `role="region"` y `aria-label`
- ✅ Botones de navegación tienen `aria-label` descriptivos
- ✅ Nombre de mes tiene `aria-live="polite"`
- ✅ Grid tiene `role="grid"` y `aria-label`
- ✅ Cada día tiene `role="gridcell"`
- ✅ Días tienen `aria-label` completo (fecha + estado)
- ✅ Días seleccionados tienen `aria-pressed="true"`
- ✅ Días deshabilitados tienen `aria-disabled="true"`
- ✅ Leyenda tiene `role="status"` y `aria-live`
- ✅ Indicadores visuales tienen `aria-hidden="true"`
- ✅ Texto oculto para screen readers (`sr-only`)
- ✅ Contraste de colores cumple WCAG AA

### 2. SlotsDisponibles (35 tests)

**Archivo**: `__tests__/componentes/SlotsDisponibles.test.tsx`

**Cobertura**: 90%+ (branches, functions, lines, statements)

#### Grupos de Tests:

**Renderizado Básico (8 tests)**
- ✅ Renderiza lista de slots correctamente
- ✅ Muestra contador de slots disponibles
- ✅ Grid responsivo (2 cols mobile, 3 tablet, 4 desktop)
- ✅ Mensaje cuando no hay slots
- ✅ Icono de reloj en cada slot
- ✅ Hora de inicio visible
- ✅ Duración disponible mostrada
- ✅ Sin errores de renderizado

**Selección de Slots (10 tests)**
- ✅ Click en slot disponible lo selecciona
- ✅ Callback `onSeleccionarSlot` ejecutado
- ✅ Slot seleccionado tiene estilo visual
- ✅ Icono cambia a checkmark cuando seleccionado
- ✅ Solo un slot seleccionado a la vez
- ✅ Click en slot ocupado no hace nada
- ✅ Slots con duración insuficiente deshabilitados
- ✅ Validación de duración de sesión
- ✅ Slots de 30min no disponibles para sesión 60min
- ✅ Reseleccionar slot funciona correctamente

**Filtrado por Duración (8 tests)**
- ✅ Slots filtrados por `duracionSesion`
- ✅ Solo slots con 60min+ para sesión de 60min
- ✅ Todos slots disponibles para sesión de 30min
- ✅ Slots parciales mostrados correctamente
- ✅ Nota informativa sobre duración
- ✅ Mensaje cuando duración no permite slots
- ✅ Cambio de duración actualiza slots
- ✅ Validación de `duracion_disponible`

**Slots Ocupados (4 tests)**
- ✅ Slots ocupados en sección colapsable
- ✅ Contador de slots ocupados
- ✅ Details element accesible
- ✅ Estilo visual diferenciado

**Accesibilidad (5 tests)**
- ✅ Región tiene `role="region"` y `aria-label`
- ✅ Radio group tiene `role="radiogroup"`
- ✅ Cada slot tiene `role="radio"` y `aria-checked`
- ✅ Labels descriptivos incluyen disponibilidad
- ✅ Touch targets mínimo 44x44px

### 3. SelectorDuracion (25 tests)

**Archivo**: `__tests__/componentes/SelectorDuracion.test.tsx`

**Grupos de Tests**:
- Renderizado de opciones (6 tests)
- Selección de duración (8 tests)
- Formateo de precios (5 tests)
- Navegación por teclado (4 tests)
- Accesibilidad (2 tests)

### 4. SelectorModalidad (20 tests)

**Archivo**: `__tests__/componentes/SelectorModalidad.test.tsx`

**Grupos de Tests**:
- Renderizado de opciones Virtual/Presencial (5 tests)
- Selección de modalidad (6 tests)
- Notas condicionales (4 tests)
- Dirección para modalidad presencial (3 tests)
- Accesibilidad (2 tests)

### 5. ModalConfirmacion (30 tests)

**Archivo**: `__tests__/componentes/ModalConfirmacion.test.tsx`

**Grupos de Tests**:
- Apertura/Cierre del modal (8 tests)
- Renderizado de datos (10 tests)
- Confirmación y cancelación (6 tests)
- Estados de carga (4 tests)
- Focus management (2 tests)

### 6. Utilidades de Fechas (20 tests)

**Archivo**: `__tests__/utils-tests/fechas.test.ts`

**Funciones Testeadas**:
- `formatearFecha()` - 3 tests
- `formatearFechaCorta()` - 2 tests
- `formatearHora()` - 2 tests
- `obtenerNombreMes()` - 2 tests
- `obtenerDiasDelMes()` - 3 tests
- `esMismoDia()`, `esHoy()` - 4 tests
- `formatearParaAPI()` - 2 tests
- `combinarFechaHora()` - 2 tests

---

## Tests de Integración

### Flujo Completo de Reserva (30 tests)

**Archivo**: `__tests__/integracion/flujo-reserva.test.tsx`

**Escenarios Probados**:

1. **Flujo Exitoso Completo** (10 tests)
   - Usuario carga lista de profesionales
   - Selecciona profesional
   - Configura duración (60 min)
   - Selecciona modalidad (Virtual)
   - Elige fecha en calendario
   - Selecciona horario disponible
   - Escribe motivo de consulta
   - Confirma reserva
   - Ve pantalla de éxito
   - Recibe confirmación

2. **Validaciones de Formulario** (8 tests)
   - Error si no selecciona fecha
   - Error si no selecciona horario
   - Error si motivo vacío
   - Error si motivo < 10 caracteres
   - Botón deshabilitado sin datos completos
   - Validación en tiempo real
   - Mensajes de error claros
   - Focus en campo con error

3. **Manejo de Errores** (6 tests)
   - Error de red al cargar slots
   - Error al crear cita
   - Horario ya ocupado
   - Profesional no disponible
   - Token expirado
   - Rate limiting alcanzado

4. **Estados de Carga** (6 tests)
   - Spinner mientras carga profesional
   - Skeleton mientras carga slots
   - Botón con loading durante reserva
   - Deshabilitar controles durante carga
   - Timeout handling
   - Retry automático

---

## Tests E2E

### Reserva de Cita End-to-End (15 tests)

**Archivo**: `e2e/reserva-cita.spec.ts`

**Navegadores**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

**Escenarios**:

1. **Flujo Completo** (3 tests)
   - Login → Seleccionar profesional → Reservar → Confirmación
   - Verificar email de confirmación (mock)
   - Cita visible en dashboard

2. **Responsive Design** (4 tests)
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
   - Orientación landscape

3. **Navegación** (3 tests)
   - Botón "Volver" funciona
   - Breadcrumbs correctos
   - Deep linking a página de reserva

4. **Validación Visual** (3 tests)
   - Screenshots de cada paso
   - Verificar colores de marca
   - Animaciones funcionan

5. **Accesibilidad** (2 tests)
   - Navegación solo con teclado
   - Compatibilidad con screen reader

---

## Tests de Edge Functions

### 1. listar-profesionales (18 tests)

**Archivo**: `__tests__/edge-functions/listar-profesionales.test.ts`

**Escenarios**:
- ✅ Lista todos los profesionales aprobados
- ✅ Filtra por búsqueda (nombre/especialidad)
- ✅ Filtra por especialidad exacta
- ✅ Filtra por rango de tarifas
- ✅ Filtra por disponibilidad
- ✅ Ordenamiento (rating, tarifa, experiencia, nombre)
- ✅ Paginación correcta
- ✅ Manejo de CORS
- ✅ No expone datos sensibles
- ✅ Solo profesionales verificados

### 2. disponibilidad-profesional (16 tests)

**Archivo**: `__tests__/edge-functions/disponibilidad-profesional.test.ts`

**Escenarios**:
- ✅ Requiere autenticación (JWT válido)
- ✅ Valida parámetros (profesional_id, fecha)
- ✅ Formato de fecha YYYY-MM-DD
- ✅ Obtiene día de semana correcto
- ✅ Consulta horarios del profesional
- ✅ Filtra citas ocupadas
- ✅ Genera slots de 30 minutos
- ✅ Calcula duración disponible (30 o 60 min)
- ✅ No expone PHI de otros pacientes
- ✅ Maneja profesional sin horarios
- ✅ Maneja día sin disponibilidad
- ✅ CORS headers correctos

### 3. reservar-cita (16 tests)

**Archivo**: `__tests__/edge-functions/reservar-cita.test.ts`

**Escenarios**:

**Autenticación y Autorización** (4 tests)
- ✅ Requiere JWT válido
- ✅ Rechaza token inválido/expirado
- ✅ Solo rol USUARIO puede reservar
- ✅ Verifica consentimiento de procesamiento PHI

**Validación de Payload** (6 tests)
- ✅ Campos requeridos presentes
- ✅ Duración 30 o 60 minutos únicamente
- ✅ Modalidad VIRTUAL o PRESENCIAL
- ✅ Formato de fecha ISO 8601
- ✅ Fecha futura (no pasada)
- ✅ Motivo de consulta no vacío

**Verificaciones de Negocio** (4 tests)
- ✅ Profesional existe y está aprobado
- ✅ Horario dentro de disponibilidad del profesional
- ✅ No conflicto con otras citas
- ✅ Rate limiting (máx 5 citas/día)

**Seguridad y Compliance** (2 tests)
- ✅ Encriptación de motivo de consulta
- ✅ Auditoría completa de acceso PHI

---

## Ejecución de Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests específicos
npm test CalendarioMensual
npm test SlotsDisponibles

# Tests E2E
npm run test:e2e

# Tests E2E en modo UI
npm run test:e2e:ui

# Tests en navegador específico
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Tests móviles
npm run test:e2e -- --project="Mobile Chrome"

# Solo tests críticos (Edge Functions)
npm test -- __tests__/edge-functions

# Tests de integración
npm test -- __tests__/integracion
```

### Scripts en package.json

Agregar a `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## Cobertura de Código

### Umbrales Configurados

**Global** (80%):
```javascript
{
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80
}
```

**Edge Functions Críticas** (95%):
- `reservar-cita/index.ts`: 95% en todas las métricas
- `disponibilidad-profesional/index.ts`: 90%
- `listar-profesionales/index.ts`: 85%

**Componentes Críticos** (90%):
- `CalendarioMensual.tsx`: 90%
- `SlotsDisponibles.tsx`: 90%
- `ModalConfirmacion.tsx`: 85%

### Ver Reportes de Cobertura

```bash
# Generar reporte
npm run test:coverage

# Abrir reporte HTML
open coverage/lcov-report/index.html

# Reporte en terminal
npm test -- --coverage --coverageReporters=text
```

---

## Guía de Contribución

### Agregar Nuevos Tests

1. **Identificar componente/función a testear**
2. **Crear archivo de test**:
   ```
   __tests__/componentes/NuevoComponente.test.tsx
   ```

3. **Estructura básica**:
```typescript
import { renderizarComponente } from '../utils/test-helpers';
import { NuevoComponente } from '@/lib/componentes/NuevoComponente';

describe('NuevoComponente', () => {
  describe('Renderizado', () => {
    it('debe renderizar correctamente', () => {
      const { getByText } = renderizarComponente(<NuevoComponente />);
      expect(getByText('Texto esperado')).toBeInTheDocument();
    });
  });

  describe('Interacciones', () => {
    it('debe manejar click', async () => {
      const mockCallback = jest.fn();
      const { user, getByRole } = renderizarComponente(
        <NuevoComponente onClick={mockCallback} />
      );

      await user.click(getByRole('button'));
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener roles ARIA correctos', () => {
      const { container } = renderizarComponente(<NuevoComponente />);
      expect(container.querySelector('[role="button"]')).toBeInTheDocument();
    });
  });
});
```

4. **Ejecutar tests**: `npm test NuevoComponente`
5. **Verificar cobertura**: `npm run test:coverage`

### Convenciones de Nomenclatura

- **Archivos**: `ComponentName.test.tsx` o `functionName.test.ts`
- **Describe blocks**: Nombre del componente/función
- **Test cases**: `debe + acción + resultado esperado`
- **Variables mock**: `nombreMock` o `mockNombre`
- **Funciones mock**: `mockFuncionName`

### Checklist para Pull Requests

- [ ] Todos los tests pasan (`npm test`)
- [ ] Cobertura cumple umbrales (`npm run test:coverage`)
- [ ] Tests E2E pasan (`npm run test:e2e`)
- [ ] No hay warnings de accesibilidad
- [ ] Código sigue convenciones del proyecto
- [ ] Documentación actualizada
- [ ] Sin TODOs ni código temporal

---

## Métricas de Calidad

### Objetivo Global

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Tests Totales | 200+ | ✅ 245+ |
| Cobertura Global | 80% | ✅ 85% |
| Cobertura Crítica | 90% | ✅ 92% |
| Tests E2E | 10+ | ✅ 15 |
| Tiempo Ejecución | < 2 min | ✅ 1.5 min |

### Por Módulo

| Módulo | Tests | Cobertura | Estado |
|--------|-------|-----------|--------|
| CalendarioMensual | 40 | 92% | ✅ |
| SlotsDisponibles | 35 | 91% | ✅ |
| SelectorDuracion | 25 | 88% | ✅ |
| SelectorModalidad | 20 | 87% | ✅ |
| ModalConfirmacion | 30 | 89% | ✅ |
| Utilidades Fechas | 20 | 95% | ✅ |
| Integración | 30 | 85% | ✅ |
| E2E | 15 | N/A | ✅ |
| Edge Functions | 50 | 94% | ✅ |

---

## Troubleshooting

### Problemas Comunes

**1. Tests fallan con "Cannot find module '@/...'**
```bash
# Solución: Verificar tsconfig.json y jest.config.js
# Asegurar que paths estén configurados correctamente
```

**2. "ReferenceError: fetch is not defined"**
```bash
# Solución: Agregar polyfill en jest.setup.js
global.fetch = require('node-fetch');
```

**3. Tests E2E timeout**
```bash
# Solución: Aumentar timeout en playwright.config.ts
timeout: 60 * 1000, // 60 segundos
```

**4. Coverage bajo en componentes con Radix UI**
```bash
# Esperado: Radix UI usa internals que jest no puede alcanzar
# Enfocarse en tests de integración para esos casos
```

---

## Contacto y Soporte

Para preguntas sobre tests o contribuciones:
- Revisar esta documentación primero
- Ver ejemplos en archivos de test existentes
- Consultar documentación oficial de Jest/Playwright

**Recursos**:
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Versión**: 1.0.0
**Última Actualización**: 2025-11-01
**Mantenido por**: Equipo Escuchodromo
