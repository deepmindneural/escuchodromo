/**
 * Hook: useKeyboardNavigation
 *
 * Facilita la navegación por teclado en listas, grids y otros componentes.
 * Maneja automáticamente las teclas de flecha, Home, End, etc.
 *
 * Cumple con WCAG 2.1.1 (Teclado)
 *
 * @param {number} totalItems - Total de elementos navegables
 * @param {Object} opciones - Configuración de navegación
 * @returns {Object} - Estado y handlers para navegación
 *
 * @example
 * const { indiceActivo, handlers } = useKeyboardNavigation(items.length, {
 *   orientacion: 'vertical',
 *   loop: true
 * });
 */

'use client';

import { useState, useCallback, KeyboardEvent } from 'react';

interface OpcionesNavegacion {
  /**
   * Orientación de navegación
   * - 'horizontal': izquierda/derecha
   * - 'vertical': arriba/abajo
   * - 'grid': ambas direcciones
   */
  orientacion?: 'horizontal' | 'vertical' | 'grid';

  /**
   * Si true, al llegar al final vuelve al inicio
   */
  loop?: boolean;

  /**
   * Número de columnas (solo para grid)
   */
  columnas?: number;

  /**
   * Callback al seleccionar un item (Enter/Space)
   */
  onSelect?: (indice: number) => void;

  /**
   * Callback al cambiar el índice activo
   */
  onChange?: (indice: number) => void;

  /**
   * Índice inicial
   */
  indiceInicial?: number;
}

export function useKeyboardNavigation(
  totalItems: number,
  opciones: OpcionesNavegacion = {}
) {
  const {
    orientacion = 'vertical',
    loop = false,
    columnas = 1,
    onSelect,
    onChange,
    indiceInicial = 0
  } = opciones;

  const [indiceActivo, setIndiceActivo] = useState(indiceInicial);

  const moverA = useCallback((nuevoIndice: number) => {
    let indiceCalculado = nuevoIndice;

    if (loop) {
      // Comportamiento circular
      if (nuevoIndice < 0) {
        indiceCalculado = totalItems - 1;
      } else if (nuevoIndice >= totalItems) {
        indiceCalculado = 0;
      }
    } else {
      // Comportamiento limitado
      indiceCalculado = Math.max(0, Math.min(totalItems - 1, nuevoIndice));
    }

    setIndiceActivo(indiceCalculado);
    onChange?.(indiceCalculado);
  }, [totalItems, loop, onChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    let handled = false;

    switch (event.key) {
      // Navegación vertical
      case 'ArrowUp':
        if (orientacion === 'vertical' || orientacion === 'grid') {
          event.preventDefault();
          moverA(indiceActivo - (orientacion === 'grid' ? columnas : 1));
          handled = true;
        }
        break;

      case 'ArrowDown':
        if (orientacion === 'vertical' || orientacion === 'grid') {
          event.preventDefault();
          moverA(indiceActivo + (orientacion === 'grid' ? columnas : 1));
          handled = true;
        }
        break;

      // Navegación horizontal
      case 'ArrowLeft':
        if (orientacion === 'horizontal' || orientacion === 'grid') {
          event.preventDefault();
          moverA(indiceActivo - 1);
          handled = true;
        }
        break;

      case 'ArrowRight':
        if (orientacion === 'horizontal' || orientacion === 'grid') {
          event.preventDefault();
          moverA(indiceActivo + 1);
          handled = true;
        }
        break;

      // Ir al inicio
      case 'Home':
        event.preventDefault();
        moverA(0);
        handled = true;
        break;

      // Ir al final
      case 'End':
        event.preventDefault();
        moverA(totalItems - 1);
        handled = true;
        break;

      // Selección
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect?.(indiceActivo);
        handled = true;
        break;
    }

    return handled;
  }, [indiceActivo, orientacion, columnas, moverA, onSelect]);

  return {
    indiceActivo,
    setIndiceActivo: moverA,
    handleKeyDown,
    getTabulacion: (indice: number) => (indice === indiceActivo ? 0 : -1),
  };
}

/**
 * Hook: useRovingTabIndex
 *
 * Implementa el patrón "roving tabindex" para navegación eficiente en componentes
 * complejos como toolbars, menús, etc.
 *
 * @example
 * const { focusedIndex, setFocusedIndex, getTabIndex } = useRovingTabIndex(items.length);
 *
 * items.map((item, idx) => (
 *   <button
 *     key={idx}
 *     tabIndex={getTabIndex(idx)}
 *     onFocus={() => setFocusedIndex(idx)}
 *   >
 *     {item}
 *   </button>
 * ))
 */
export function useRovingTabIndex(totalItems: number, indiceInicial = 0) {
  const [focusedIndex, setFocusedIndex] = useState(indiceInicial);

  const getTabIndex = useCallback((indice: number) => {
    return indice === focusedIndex ? 0 : -1;
  }, [focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    getTabIndex,
  };
}

/**
 * Hook: useSkipLink
 *
 * Crea un "skip link" accesible para saltar al contenido principal
 *
 * @example
 * const skipToContent = useSkipLink('main-content');
 *
 * <button onClick={skipToContent} className="sr-only focus:not-sr-only">
 *   Saltar al contenido principal
 * </button>
 *
 * <main id="main-content" tabIndex={-1}>
 *   ...
 * </main>
 */
export function useSkipLink(targetId: string) {
  return useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetId]);
}
