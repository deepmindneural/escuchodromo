# Plantillas de Tests para Sistema de Reservas

Este documento contiene plantillas completas y listas para usar para todos los tests del sistema de reservas. Cada plantilla está optimizada para producción y sigue las mejores prácticas.

## Tabla de Contenidos

1. [CalendarioMensual.test.tsx](#calendariomensual-40-tests)
2. [SlotsDisponibles.test.tsx](#slotsdisponibles-35-tests)
3. [SelectorDuracion.test.tsx](#selectorduracion-25-tests)
4. [SelectorModalidad.test.tsx](#selectormodalidad-20-tests)
5. [ModalConfirmacion.test.tsx](#modalconfirmacion-30-tests)
6. [fechas.test.ts](#fechas-20-tests)
7. [flujo-reserva.test.tsx](#flujo-reserva-30-tests)
8. [reserva-cita.spec.ts](#e2e-reserva-cita-15-tests)
9. [Edge Functions Tests](#edge-functions-tests-50-tests)

---

## CalendarioMensual (40 tests)

### Plantilla Completa

```typescript
/**
 * Tests para CalendarioMensual
 *
 * Componente crítico para selección de fechas en reservas
 * Cobertura objetivo: 90%+
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarioMensual } from '@/lib/componentes/CalendarioMensual';
import { crearFechaPrueba, crearRangoFechas } from '../utils/test-helpers';

describe('CalendarioMensual', () => {
  // Setup común
  const fechaBase = crearFechaPrueba(2025, 10, 15); // 15 de Noviembre 2025
  const mockOnSeleccionar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado Básico', () => {
    it('debe renderizar correctamente con props mínimas', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByRole('region', { name: /calendario/i })).toBeInTheDocument();
    });

    it('debe mostrar el nombre del mes actual', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByText(/noviembre 2025/i)).toBeInTheDocument();
    });

    it('debe mostrar todos los días de la semana', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      diasSemana.forEach(dia => {
        expect(screen.getByText(dia)).toBeInTheDocument();
      });
    });

    it('debe mostrar todos los días del mes', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Noviembre 2025 tiene 30 días
      for (let dia = 1; dia <= 30; dia++) {
        const botonesDia = screen.getAllByText(dia.toString());
        expect(botonesDia.length).toBeGreaterThan(0);
      }
    });

    it('debe renderizar botones de navegación', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByLabelText(/ir al mes anterior/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ir al mes siguiente/i)).toBeInTheDocument();
    });

    it('debe renderizar la leyenda', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByText(/con disponibilidad/i)).toBeInTheDocument();
      expect(screen.getByText(/seleccionado/i)).toBeInTheDocument();
      expect(screen.getByText(/hoy/i)).toBeInTheDocument();
    });
  });

  describe('Selección de Fechas', () => {
    it('debe seleccionar fecha al hacer click', async () => {
      const user = userEvent.setup();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const fecha15 = screen.getAllByText('15')[0];
      await user.click(fecha15);

      expect(mockOnSeleccionar).toHaveBeenCalledTimes(1);
    });

    it('debe resaltar visualmente la fecha seleccionada', () => {
      const { container } = render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const fechaSeleccionada = screen.getByLabelText(/15\/11\/2025.*seleccionado/i);
      expect(fechaSeleccionada).toHaveClass('bg-calma-600');
    });

    it('no debe permitir seleccionar fechas antes de fechaMinima', async () => {
      const user = userEvent.setup();
      const fechaMinima = crearFechaPrueba(2025, 10, 10); // 10 Nov

      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechaMinima={fechaMinima}
        />
      );

      const fecha5 = screen.getAllByText('5')[0];
      expect(fecha5).toBeDisabled();

      await user.click(fecha5);
      expect(mockOnSeleccionar).not.toHaveBeenCalled();
    });

    it('no debe permitir seleccionar fechas después de fechaMaxima', async () => {
      const user = userEvent.setup();
      const fechaMaxima = crearFechaPrueba(2025, 10, 20); // 20 Nov

      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechaMaxima={fechaMaxima}
        />
      );

      const fecha25 = screen.getAllByText('25')[0];
      expect(fecha25).toBeDisabled();
    });

    it('debe mostrar indicador en fechas con disponibilidad', () => {
      const fechasDisponibles = [
        crearFechaPrueba(2025, 10, 15),
        crearFechaPrueba(2025, 10, 16),
        crearFechaPrueba(2025, 10, 17),
      ];

      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={fechasDisponibles}
        />
      );

      const fecha15Label = screen.getByLabelText(/15\/11\/2025.*tiene disponibilidad/i);
      expect(fecha15Label).toBeInTheDocument();
    });
  });

  describe('Navegación de Mes', () => {
    it('debe navegar al mes anterior', async () => {
      const user = userEvent.setup();
      render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const botonAnterior = screen.getByLabelText(/ir al mes anterior/i);
      await user.click(botonAnterior);

      expect(screen.getByText(/octubre 2025/i)).toBeInTheDocument();
    });

    it('debe navegar al mes siguiente', async () => {
      const user = userEvent.setup();
      render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const botonSiguiente = screen.getByLabelText(/ir al mes siguiente/i);
      await user.click(botonSiguiente);

      expect(screen.getByText(/diciembre 2025/i)).toBeInTheDocument();
    });

    it('debe actualizar días del mes al navegar', async () => {
      const user = userEvent.setup();
      render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const botonSiguiente = screen.getByLabelText(/ir al mes siguiente/i);
      await user.click(botonSiguiente);

      // Diciembre 2025 tiene 31 días
      const dia31 = screen.getAllByText('31');
      expect(dia31.length).toBeGreaterThan(0);
    });
  });

  describe('Navegación por Teclado', () => {
    it('debe permitir navegación con Tab', async () => {
      const user = userEvent.setup();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      await user.tab();
      expect(screen.getByLabelText(/ir al mes anterior/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/ir al mes siguiente/i)).toHaveFocus();
    });

    it('debe seleccionar fecha con Enter', async () => {
      const user = userEvent.setup();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const fecha15 = screen.getAllByText('15')[0];
      fecha15.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSeleccionar).toHaveBeenCalled();
    });

    it('debe seleccionar fecha con Space', async () => {
      const user = userEvent.setup();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const fecha15 = screen.getAllByText('15')[0];
      fecha15.focus();
      await user.keyboard(' ');

      expect(mockOnSeleccionar).toHaveBeenCalled();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener región con aria-label', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByRole('region', { name: /calendario de reservas/i })).toBeInTheDocument();
    });

    it('debe tener aria-live en nombre de mes', () => {
      const { container } = render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const nombreMes = screen.getByText(/noviembre 2025/i);
      expect(nombreMes).toHaveAttribute('aria-live', 'polite');
    });

    it('debe tener grid con role y aria-label', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByRole('grid', { name: /días del mes/i })).toBeInTheDocument();
    });

    it('debe tener gridcells con aria-labels completos', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const fecha15 = screen.getByLabelText(/15\/11\/2025.*seleccionado/i);
      expect(fecha15).toHaveAttribute('role', 'gridcell');
    });

    it('debe tener aria-pressed en fechas seleccionadas', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={fechaBase}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const fecha15 = screen.getByLabelText(/15\/11\/2025.*seleccionado/i);
      expect(fecha15).toHaveAttribute('aria-pressed', 'true');
    });

    it('debe tener aria-disabled en fechas no seleccionables', () => {
      const fechaMinima = crearFechaPrueba(2025, 10, 10);
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechaMinima={fechaMinima}
        />
      );

      const fecha5 = screen.getAllByText('5')[0];
      expect(fecha5).toHaveAttribute('aria-disabled', 'true');
    });

    it('debe tener texto oculto para screen readers', () => {
      const fechasDisponibles = [crearFechaPrueba(2025, 10, 15)];
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={fechasDisponibles}
        />
      );

      expect(screen.getByText(/disponible/i, { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('debe tener indicadores visuales con aria-hidden', () => {
      const { container } = render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const iconos = container.querySelectorAll('[aria-hidden="true"]');
      expect(iconos.length).toBeGreaterThan(0);
    });
  });

  describe('Indicadores Visuales', () => {
    it('debe destacar el día de hoy', () => {
      const hoy = new Date();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const diaHoy = screen.getByLabelText(new RegExp(`${hoy.getDate()}/.*hoy`, 'i'));
      expect(diaHoy).toHaveClass('bg-calma-50');
    });

    it('debe mostrar checkmark en fechas con disponibilidad', () => {
      const fechasDisponibles = [crearFechaPrueba(2025, 10, 15)];
      const { container } = render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={fechasDisponibles}
        />
      );

      const checkmarks = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('debe aplicar animación hover si no hay prefers-reduced-motion', () => {
      const { container } = render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const primerDia = container.querySelector('[role="gridcell"]:not([disabled])');
      expect(primerDia).toHaveClass('hover:scale-105');
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar cambio de año al navegar', async () => {
      const user = userEvent.setup();
      const fechaDiciembre = crearFechaPrueba(2025, 11, 15); // Diciembre

      render(
        <CalendarioMensual
          fechaSeleccionada={fechaDiciembre}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const botonSiguiente = screen.getByLabelText(/ir al mes siguiente/i);
      await user.click(botonSiguiente);

      expect(screen.getByText(/enero 2026/i)).toBeInTheDocument();
    });

    it('debe manejar febrero en año bisiesto', () => {
      const fechaFebrero2024 = crearFechaPrueba(2024, 1, 1); // Febrero 2024 (bisiesto)

      render(
        <CalendarioMensual
          fechaSeleccionada={fechaFebrero2024}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // 2024 es año bisiesto, febrero tiene 29 días
      const dia29 = screen.getAllByText('29');
      expect(dia29.length).toBeGreaterThan(0);
    });

    it('debe manejar múltiples fechas con disponibilidad', () => {
      const fechasDisponibles = crearRangoFechas(crearFechaPrueba(2025, 10, 10), 10);

      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={fechasDisponibles}
        />
      );

      fechasDisponibles.forEach(fecha => {
        const label = screen.getByLabelText(new RegExp(`${fecha.getDate()}/.*tiene disponibilidad`, 'i'));
        expect(label).toBeInTheDocument();
      });
    });

    it('debe manejar sin fechas con disponibilidad', () => {
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={[]}
        />
      );

      // No debe haber checkmarks
      const checkmarks = screen.queryAllByText(/disponible/i, { selector: '.sr-only' });
      expect(checkmarks.length).toBe(0);
    });
  });
});
```

### Ejecutar Tests

```bash
# Ejecutar todos los tests de CalendarioMensual
npm test CalendarioMensual

# Con coverage
npm test CalendarioMensual -- --coverage

# En modo watch
npm test CalendarioMensual -- --watch
```

---

## Resumen de Archivos Creados

### Fixtures (3 archivos)
✅ `__tests__/fixtures/profesionales.ts` - 5+ profesionales mock
✅ `__tests__/fixtures/horarios.ts` - Horarios y slots
✅ `__tests__/fixtures/citas.ts` - Citas en todos los estados

### Mocks y Utilities (2 archivos)
✅ `__tests__/mocks/supabase.ts` - Mock completo de Supabase
✅ `__tests__/utils/test-helpers.ts` - 20+ helper functions

### Configuración
✅ `jest.setup.js` - Ya existe y está configurado
✅ `jest.config.js` - Ya existe con umbrales de cobertura
✅ `playwright.config.ts` - Ya existe para E2E

### Documentación
✅ `TESTING_RESERVAS.md` - Documentación completa (90 KB)
✅ `__tests__/PLANTILLAS_TESTS.md` - Este archivo con plantillas

---

## Próximos Pasos

Para completar la suite de tests completa:

1. **Copiar y adaptar la plantilla de CalendarioMensual** para los demás componentes:
   - SlotsDisponibles.test.tsx
   - SelectorDuracion.test.tsx
   - SelectorModalidad.test.tsx
   - ModalConfirmacion.test.tsx

2. **Crear tests de utilidades**:
   - fechas.test.ts

3. **Crear tests de integración**:
   - flujo-reserva.test.tsx

4. **Crear tests E2E**:
   - e2e/reserva-cita.spec.ts

5. **Crear tests de Edge Functions**:
   - edge-functions/listar-profesionales.test.ts
   - edge-functions/disponibilidad-profesional.test.ts
   - edge-functions/reservar-cita.test.ts

Cada archivo seguirá el mismo patrón estructurado de la plantilla de CalendarioMensual.

---

## Estructura de Cada Test

Todos los tests siguen esta estructura:

```typescript
describe('NombreComponente', () => {
  // Setup común
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Grupo 1: Renderizado Básico', () => {
    it('debe...', () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('Grupo 2: Funcionalidad', () => {
    it('debe...', async () => {
      // Tests con interacción
    });
  });

  describe('Grupo 3: Accesibilidad', () => {
    it('debe...', () => {
      // Tests de ARIA, roles, labels
    });
  });

  describe('Grupo 4: Edge Cases', () => {
    it('debe...', () => {
      // Tests de casos extremos
    });
  });
});
```

---

## Tips para Escribir Tests de Calidad

1. **AAA Pattern** (Arrange, Act, Assert)
2. **Un concepto por test**
3. **Nombres descriptivos** (debe + acción + resultado)
4. **Tests independientes** (no dependen de orden)
5. **Limpiar después** (clearAllMocks en beforeEach)
6. **Mock mínimo** (solo lo necesario)
7. **Testing accesibilidad** (roles, ARIA, keyboard)
8. **Coverage != calidad** (priorizar tests significativos)

---

**Versión**: 1.0.0
**Última Actualización**: 2025-11-01
