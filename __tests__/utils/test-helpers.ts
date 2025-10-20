/**
 * Utilidades y helpers para testing
 *
 * Funciones reutilizables para simplificar tests
 * y mejorar la legibilidad del código de prueba
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';

/**
 * Renderiza un componente con configuración por defecto
 * Incluye providers necesarios (si se requieren en el futuro)
 */
export const renderizarComponente = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  };
};

/**
 * Espera a que un elemento aparezca en el DOM
 */
export const esperarElemento = async (
  getByText: any,
  texto: string,
  timeout: number = 3000
) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      try {
        const elemento = getByText(texto);
        clearInterval(interval);
        resolve(elemento);
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`Elemento con texto "${texto}" no encontrado después de ${timeout}ms`));
        }
      }
    }, 100);
  });
};

/**
 * Simula un click en un elemento
 */
export const clickearElemento = async (user: any, elemento: HTMLElement) => {
  await user.click(elemento);
};

/**
 * Simula escribir en un campo de texto
 */
export const escribirEnCampo = async (
  user: any,
  elemento: HTMLElement,
  texto: string
) => {
  await user.clear(elemento);
  await user.type(elemento, texto);
};

/**
 * Simula navegación por teclado
 */
export const presionarTecla = async (user: any, tecla: string) => {
  await user.keyboard(`{${tecla}}`);
};

/**
 * Espera un tiempo determinado (para testing de animaciones)
 */
export const esperar = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Verifica accesibilidad de un elemento
 */
export const verificarAccesibilidad = (elemento: HTMLElement) => {
  // Verificar que tenga role o aria-label
  const tieneRole = elemento.hasAttribute('role');
  const tieneAriaLabel = elemento.hasAttribute('aria-label');
  const tieneAriaLabelledby = elemento.hasAttribute('aria-labelledby');

  return tieneRole || tieneAriaLabel || tieneAriaLabelledby;
};

/**
 * Obtener todos los elementos con un rol específico
 */
export const obtenerPorRol = (container: HTMLElement, rol: string) => {
  return container.querySelectorAll(`[role="${rol}"]`);
};

/**
 * Verificar si un elemento es visible (no display:none ni visibility:hidden)
 */
export const esVisible = (elemento: HTMLElement) => {
  const estilos = window.getComputedStyle(elemento);
  return (
    estilos.display !== 'none' &&
    estilos.visibility !== 'hidden' &&
    estilos.opacity !== '0'
  );
};

/**
 * Verificar si un elemento tiene focus
 */
export const tieneFocus = (elemento: HTMLElement) => {
  return document.activeElement === elemento;
};

/**
 * Crear una fecha de prueba (evita problemas de timezone)
 */
export const crearFechaPrueba = (
  año: number,
  mes: number, // 0-11
  dia: number,
  hora: number = 0,
  minuto: number = 0
) => {
  return new Date(año, mes, dia, hora, minuto, 0, 0);
};

/**
 * Formatear fecha para comparaciones en tests
 */
export const formatearFechaPrueba = (fecha: Date) => {
  return fecha.toISOString().split('T')[0];
};

/**
 * Crear array de fechas consecutivas
 */
export const crearRangoFechas = (inicio: Date, dias: number): Date[] => {
  const fechas: Date[] = [];
  for (let i = 0; i < dias; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + i);
    fechas.push(fecha);
  }
  return fechas;
};

/**
 * Mock de console.error para tests
 * Útil para evitar ruido en tests que esperan errores
 */
export const silenciarConsolError = () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
};

/**
 * Mock de console.warn para tests
 */
export const silenciarConsolWarn = () => {
  const originalWarn = console.warn;
  beforeAll(() => {
    console.warn = jest.fn();
  });
  afterAll(() => {
    console.warn = originalWarn;
  });
};

/**
 * Verificar que un elemento cumple con WCAG contraste mínimo
 * (Simplificado - en producción usar herramientas especializadas)
 */
export const verificarContraste = (elemento: HTMLElement) => {
  const estilos = window.getComputedStyle(elemento);
  const color = estilos.color;
  const backgroundColor = estilos.backgroundColor;

  // Aquí podrías implementar cálculo real de contraste
  // Por ahora, solo verificamos que ambos estén definidos
  return color !== '' && backgroundColor !== '';
};

/**
 * Simular prefers-reduced-motion
 */
export const simularReducedMotion = (reducido: boolean = true) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)' && reducido,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Simular viewport móvil
 */
export const simularViewportMovil = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  });
};

/**
 * Simular viewport desktop
 */
export const simularViewportDesktop = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
  });
};

/**
 * Cleanup helper para resetear mocks después de cada test
 */
export const limpiarMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};
