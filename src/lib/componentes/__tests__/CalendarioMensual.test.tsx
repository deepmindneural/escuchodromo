/**
 * Tests Unitarios: CalendarioMensual
 *
 * Componente CRÍTICO para selección de fechas de citas.
 * La precisión en la selección de fechas y disponibilidad es esencial
 * para evitar frustración del paciente y errores de reserva.
 *
 * Cobertura objetivo: 90%
 *
 * Casos de prueba:
 * - Renderizado de calendario correcto
 * - Navegación entre meses
 * - Selección de fechas válidas
 * - Prevención de selección de fechas pasadas
 * - Indicadores de disponibilidad
 * - Navegación por teclado (Tab, flechas, Enter, Space)
 * - ARIA labels y accesibilidad
 * - Respeto a prefers-reduced-motion
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarioMensual } from '../CalendarioMensual';

// Mock del hook de prefers-reduced-motion
jest.mock('../hooks/useMediaQuery', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));

// ==========================================
// HELPERS DE TESTING
// ==========================================

/**
 * Helper: Crear fecha sin horas/minutos para comparaciones
 */
const crearFecha = (year: number, month: number, day: number): Date => {
  const fecha = new Date(year, month, day);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
};

/**
 * Helper: Obtener días del mes
 */
const obtenerDiasDelMes = (fecha: Date): Date[] => {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);

  const dias: Date[] = [];
  for (let d = primerDia.getDate(); d <= ultimoDia.getDate(); d++) {
    dias.push(new Date(year, month, d));
  }
  return dias;
};

// ==========================================
// DATOS DE PRUEBA
// ==========================================

const HOY = crearFecha(2025, 9, 20); // 20 de Octubre 2025 (mes 9 = Octubre)
const MANANA = crearFecha(2025, 9, 21);
const EN_UNA_SEMANA = crearFecha(2025, 9, 27);
const MES_SIGUIENTE = crearFecha(2025, 10, 5); // 5 de Noviembre

// Fechas con disponibilidad (simulando horarios de profesional)
const FECHAS_DISPONIBLES = [
  crearFecha(2025, 9, 22), // Miércoles 22
  crearFecha(2025, 9, 23), // Jueves 23
  crearFecha(2025, 9, 24), // Viernes 24
  crearFecha(2025, 9, 27), // Lunes 27
  crearFecha(2025, 9, 29), // Miércoles 29
];

// ==========================================
// SUITE DE TESTS
// ==========================================

describe('CalendarioMensual', () => {
  beforeEach(() => {
    // Mockear fecha actual
    jest.useFakeTimers();
    jest.setSystemTime(HOY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==========================================
  // GRUPO: Renderizado Básico
  // ==========================================

  describe('Renderizado básico', () => {
    it('debe renderizar el calendario con el mes actual', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Header debe mostrar "octubre 2025"
      expect(screen.getByText(/octubre 2025/i)).toBeInTheDocument();
    });

    it('debe renderizar todos los días de la semana', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByLabelText('Dom')).toBeInTheDocument();
      expect(screen.getByLabelText('Lun')).toBeInTheDocument();
      expect(screen.getByLabelText('Mar')).toBeInTheDocument();
      expect(screen.getByLabelText('Mié')).toBeInTheDocument();
      expect(screen.getByLabelText('Jue')).toBeInTheDocument();
      expect(screen.getByLabelText('Vie')).toBeInTheDocument();
      expect(screen.getByLabelText('Sáb')).toBeInTheDocument();
    });

    it('debe renderizar todos los días del mes actual', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Octubre 2025 tiene 31 días
      for (let dia = 1; dia <= 31; dia++) {
        // Buscar botón con el número del día
        const botonDia = screen.getByRole('gridcell', {
          name: new RegExp(`^${dia}\\b`, 'i'),
        });
        expect(botonDia).toBeInTheDocument();
      }
    });

    it('debe renderizar botones de navegación de mes', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByLabelText('Ir al mes anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir al mes siguiente')).toBeInTheDocument();
    });

    it('debe renderizar leyenda de estados', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByText('Con disponibilidad')).toBeInTheDocument();
      expect(screen.getByText('Seleccionado')).toBeInTheDocument();
      expect(screen.getByText('Hoy')).toBeInTheDocument();
    });
  });

  // ==========================================
  // GRUPO: Navegación de Meses
  // ==========================================

  describe('Navegación de meses', () => {
    it('debe navegar al mes anterior al hacer click en flecha izquierda', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Actualmente en Octubre 2025
      expect(screen.getByText(/octubre 2025/i)).toBeInTheDocument();

      // Click en mes anterior
      const botonAnterior = screen.getByLabelText('Ir al mes anterior');
      await user.click(botonAnterior);

      // Debe cambiar a Septiembre 2025
      expect(screen.getByText(/septiembre 2025/i)).toBeInTheDocument();
    });

    it('debe navegar al mes siguiente al hacer click en flecha derecha', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Actualmente en Octubre 2025
      expect(screen.getByText(/octubre 2025/i)).toBeInTheDocument();

      // Click en mes siguiente
      const botonSiguiente = screen.getByLabelText('Ir al mes siguiente');
      await user.click(botonSiguiente);

      // Debe cambiar a Noviembre 2025
      expect(screen.getByText(/noviembre 2025/i)).toBeInTheDocument();
    });

    it('debe poder navegar múltiples meses hacia adelante', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const botonSiguiente = screen.getByLabelText('Ir al mes siguiente');

      // Navegar 3 meses hacia adelante
      await user.click(botonSiguiente);
      await user.click(botonSiguiente);
      await user.click(botonSiguiente);

      // Debe estar en Enero 2026
      expect(screen.getByText(/enero 2026/i)).toBeInTheDocument();
    });

    it('debe anunciar cambio de mes con aria-live', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const header = screen.getByText(/octubre 2025/i);
      expect(header).toHaveAttribute('aria-live', 'polite');
      expect(header).toHaveAttribute('aria-atomic', 'true');
    });
  });

  // ==========================================
  // GRUPO: Selección de Fechas
  // ==========================================

  describe('Selección de fechas', () => {
    it('debe llamar onSeleccionarFecha al hacer click en un día válido', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Seleccionar día 25 (futuro)
      const dia25 = screen.getByRole('gridcell', {
        name: /^25\b/i,
      });
      await user.click(dia25);

      expect(mockOnSeleccionar).toHaveBeenCalledTimes(1);
      const fechaSeleccionada = mockOnSeleccionar.mock.calls[0][0];
      expect(fechaSeleccionada.getDate()).toBe(25);
    });

    it('debe marcar visualmente el día seleccionado', () => {
      const mockOnSeleccionar = jest.fn();
      const fechaSeleccionada = crearFecha(2025, 9, 25);

      render(
        <CalendarioMensual
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const dia25 = screen.getByRole('gridcell', {
        name: /25.*seleccionado/i,
      });

      expect(dia25).toHaveClass('bg-calma-600', 'text-white');
      expect(dia25).toHaveAttribute('aria-pressed', 'true');
    });

    it('NO debe permitir seleccionar fechas pasadas', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechaMinima={HOY} // 20 de Octubre
        />
      );

      // Intentar seleccionar día 15 (pasado)
      const dia15 = screen.getByRole('gridcell', {
        name: /^15\b.*no disponible/i,
      });

      expect(dia15).toBeDisabled();
      await user.click(dia15);

      // No debe llamar al callback
      expect(mockOnSeleccionar).not.toHaveBeenCalled();
    });

    it('debe permitir seleccionar solo fechas dentro del rango (fechaMinima, fechaMaxima)', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      const fechaMaxima = crearFecha(2025, 9, 25); // Hasta el 25

      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechaMinima={HOY}
          fechaMaxima={fechaMaxima}
        />
      );

      // Día 30 debe estar deshabilitado (fuera de rango)
      const dia30 = screen.getByRole('gridcell', {
        name: /^30\b.*no disponible/i,
      });
      expect(dia30).toBeDisabled();

      // Día 24 debe estar habilitado
      const dia24 = screen.getByRole('gridcell', {
        name: /^24\b/i,
      });
      expect(dia24).not.toBeDisabled();
    });
  });

  // ==========================================
  // GRUPO: Indicadores de Disponibilidad
  // ==========================================

  describe('Indicadores de disponibilidad', () => {
    it('debe mostrar indicador visual en fechas con disponibilidad', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={FECHAS_DISPONIBLES}
        />
      );

      // Día 22 tiene disponibilidad
      const dia22 = screen.getByRole('gridcell', {
        name: /22.*tiene disponibilidad/i,
      });

      expect(dia22).toHaveClass('bg-esperanza-50', 'text-esperanza-700');
    });

    it('debe mostrar texto "Disponible" en screen readers', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={FECHAS_DISPONIBLES}
        />
      );

      // Día 22 debe tener texto oculto para screen readers
      const dia22 = screen.getByRole('gridcell', {
        name: /22.*tiene disponibilidad/i,
      });

      const textoOculto = within(dia22).getByText('Disponible');
      expect(textoOculto).toHaveClass('sr-only');
    });

    it('debe mostrar icono de check en fechas con disponibilidad', () => {
      const mockOnSeleccionar = jest.fn();
      const { container } = render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={FECHAS_DISPONIBLES}
        />
      );

      // Día 22 debe tener icono CheckCircleIcon
      const dia22Button = screen.getByRole('gridcell', {
        name: /22.*tiene disponibilidad/i,
      });

      const icono = within(dia22Button).getByRole('img', { hidden: true });
      expect(icono).toHaveClass('text-esperanza-600');
    });

    it('NO debe mostrar indicador en fechas sin disponibilidad', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={FECHAS_DISPONIBLES}
        />
      );

      // Día 26 NO tiene disponibilidad
      const dia26 = screen.getByRole('gridcell', {
        name: /^26\b/i,
      });

      expect(dia26).not.toHaveClass('bg-esperanza-50');
      expect(within(dia26).queryByText('Disponible')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // GRUPO: Día Actual (Hoy)
  // ==========================================

  describe('Día actual (hoy)', () => {
    it('debe resaltar el día actual con estilo especial', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Día 20 es hoy
      const dia20 = screen.getByRole('gridcell', {
        name: /20.*hoy/i,
      });

      expect(dia20).toHaveClass('bg-calma-50', 'text-calma-700', 'ring-2', 'ring-calma-500');
    });

    it('debe incluir "hoy" en el aria-label', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const diaHoy = screen.getByRole('gridcell', {
        name: /20.*hoy/i,
      });

      expect(diaHoy).toBeInTheDocument();
    });
  });

  // ==========================================
  // GRUPO: Navegación por Teclado (Accesibilidad)
  // ==========================================

  describe('Navegación por teclado (Accesibilidad)', () => {
    it('debe seleccionar fecha al presionar Enter', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const dia25 = screen.getByRole('gridcell', {
        name: /^25\b/i,
      });

      dia25.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSeleccionar).toHaveBeenCalledTimes(1);
    });

    it('debe seleccionar fecha al presionar Space', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const dia25 = screen.getByRole('gridcell', {
        name: /^25\b/i,
      });

      dia25.focus();
      await user.keyboard(' ');

      expect(mockOnSeleccionar).toHaveBeenCalledTimes(1);
    });

    it('NO debe seleccionar fecha deshabilitada al presionar Enter', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechaMinima={HOY}
        />
      );

      const dia15 = screen.getByRole('gridcell', {
        name: /^15\b.*no disponible/i,
      });

      dia15.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSeleccionar).not.toHaveBeenCalled();
    });

    it('debe tener focus ring visible al enfocar con Tab', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const dia25 = screen.getByRole('gridcell', {
        name: /^25\b/i,
      });

      expect(dia25).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-calma-500');
    });
  });

  // ==========================================
  // GRUPO: ARIA y Semántica
  // ==========================================

  describe('ARIA y semántica', () => {
    it('debe tener role="region" con aria-label', () => {
      const mockOnSeleccionar = jest.fn();
      const { container } = render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Calendario de reservas');
    });

    it('debe tener role="grid" para los días', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const grid = screen.getByRole('grid', { name: /días del mes/i });
      expect(grid).toBeInTheDocument();
    });

    it('debe tener role="gridcell" en cada día', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const dia25 = screen.getByRole('gridcell', {
        name: /^25\b/i,
      });

      expect(dia25).toHaveAttribute('role', 'gridcell');
    });

    it('debe tener aria-pressed en día seleccionado', () => {
      const mockOnSeleccionar = jest.fn();
      const fechaSeleccionada = crearFecha(2025, 9, 25);

      render(
        <CalendarioMensual
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      const dia25 = screen.getByRole('gridcell', {
        name: /25.*seleccionado/i,
      });

      expect(dia25).toHaveAttribute('aria-pressed', 'true');
    });

    it('debe tener aria-disabled en días no seleccionables', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechaMinima={HOY}
        />
      );

      const dia15 = screen.getByRole('gridcell', {
        name: /^15\b.*no disponible/i,
      });

      expect(dia15).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // ==========================================
  // GRUPO: Edge Cases
  // ==========================================

  describe('Edge cases', () => {
    it('debe manejar mes con 31 días correctamente', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Octubre tiene 31 días
      expect(screen.getByRole('gridcell', { name: /^31\b/i })).toBeInTheDocument();
      expect(screen.queryByRole('gridcell', { name: /^32\b/i })).not.toBeInTheDocument();
    });

    it('debe manejar febrero en año bisiesto', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();

      // Establecer fecha en febrero de año bisiesto (2024)
      const fechaFebrero = crearFecha(2024, 1, 15); // Mes 1 = Febrero
      jest.setSystemTime(fechaFebrero);

      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // 2024 es bisiesto, febrero tiene 29 días
      expect(screen.getByRole('gridcell', { name: /^29\b/i })).toBeInTheDocument();
      expect(screen.queryByRole('gridcell', { name: /^30\b/i })).not.toBeInTheDocument();
    });

    it('debe manejar transición de año correctamente', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnSeleccionar = jest.fn();

      // Diciembre 2025
      const fechaDiciembre = crearFecha(2025, 11, 15);
      jest.setSystemTime(fechaDiciembre);

      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      expect(screen.getByText(/diciembre 2025/i)).toBeInTheDocument();

      // Navegar al mes siguiente
      const botonSiguiente = screen.getByLabelText('Ir al mes siguiente');
      await user.click(botonSiguiente);

      // Debe mostrar Enero 2026
      expect(screen.getByText(/enero 2026/i)).toBeInTheDocument();
    });

    it('debe manejar fechasConDisponibilidad vacío sin errores', () => {
      const mockOnSeleccionar = jest.fn();
      render(
        <CalendarioMensual
          fechaSeleccionada={null}
          onSeleccionarFecha={mockOnSeleccionar}
          fechasConDisponibilidad={[]}
        />
      );

      // No debe mostrar ningún día con disponibilidad
      expect(screen.queryByText('Disponible')).not.toBeInTheDocument();
    });

    it('debe manejar fechaSeleccionada de otro mes sin errores', () => {
      const mockOnSeleccionar = jest.fn();
      const fechaOtroMes = crearFecha(2025, 10, 15); // Noviembre

      render(
        <CalendarioMensual
          fechaSeleccionada={fechaOtroMes}
          onSeleccionarFecha={mockOnSeleccionar}
        />
      );

      // Debe mostrar Octubre (mes actual)
      expect(screen.getByText(/octubre 2025/i)).toBeInTheDocument();
    });
  });
});
