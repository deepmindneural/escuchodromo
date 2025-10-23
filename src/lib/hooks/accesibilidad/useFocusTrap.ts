/**
 * Hook: useFocusTrap
 *
 * Implementa un "focus trap" (trampa de foco) para modales y overlays.
 * Mantiene el foco dentro del elemento mientras está abierto y restaura
 * el foco al elemento que lo activó cuando se cierra.
 *
 * Cumple con WCAG 2.1.2 (Sin trampas de teclado)
 *
 * @param {boolean} isActive - Si el trap está activo
 * @param {() => void} onClose - Callback al cerrar (ESC key)
 * @returns {React.RefObject} - Ref para aplicar al contenedor del trap
 *
 * @example
 * const trapRef = useFocusTrap(modalAbierto, () => setModalAbierto(false));
 *
 * <div ref={trapRef} role="dialog" aria-modal="true">
 *   Contenido del modal
 * </div>
 */

'use client';

import { useEffect, useRef } from 'react';

const SELECTORES_FOCUSEABLES = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(
  isActive: boolean,
  onClose?: () => void
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    // Guardar el elemento activo actual
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Obtener todos los elementos focuseables dentro del contenedor
    const obtenerElementosFocuseables = (): HTMLElement[] => {
      if (!containerRef.current) return [];

      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(SELECTORES_FOCUSEABLES)
      ).filter(elemento => {
        // Filtrar elementos que no sean visibles
        return (
          elemento.offsetWidth > 0 &&
          elemento.offsetHeight > 0 &&
          !elemento.hasAttribute('disabled')
        );
      });
    };

    // Enfocar el primer elemento focuseable
    const elementosFocuseables = obtenerElementosFocuseables();
    if (elementosFocuseables.length > 0) {
      elementosFocuseables[0].focus();
    }

    // Handler para navegación con Tab
    const handleTabKey = (event: KeyboardEvent) => {
      const elementosFocuseables = obtenerElementosFocuseables();

      if (elementosFocuseables.length === 0) return;

      const primerElemento = elementosFocuseables[0];
      const ultimoElemento = elementosFocuseables[elementosFocuseables.length - 1];

      // Tab sin Shift: si estamos en el último, ir al primero
      if (!event.shiftKey && document.activeElement === ultimoElemento) {
        event.preventDefault();
        primerElemento.focus();
      }

      // Shift + Tab: si estamos en el primero, ir al último
      if (event.shiftKey && document.activeElement === primerElemento) {
        event.preventDefault();
        ultimoElemento.focus();
      }
    };

    // Handler para tecla Escape
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
      }
    };

    // Handler general de teclado
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        handleTabKey(event);
      } else if (event.key === 'Escape') {
        handleEscapeKey(event);
      }
    };

    // Agregar event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restaurar foco al cerrar
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restaurar foco al elemento previo si aún existe en el DOM
      if (previousActiveElementRef.current && document.contains(previousActiveElementRef.current)) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive, onClose]);

  return containerRef;
}

/**
 * Utilidad: Deshabilitar scroll del body mientras el trap está activo
 */
export function useDisableBodyScroll(isActive: boolean) {
  useEffect(() => {
    if (isActive) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isActive]);
}
