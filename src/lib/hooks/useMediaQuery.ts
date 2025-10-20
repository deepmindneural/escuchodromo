'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar media queries
 * Útil para respetar preferencias de usuario como prefers-reduced-motion
 *
 * @param query - String de media query (ej: '(prefers-reduced-motion: reduce)')
 * @returns boolean indicando si la media query coincide
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificar si window está disponible (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Establecer el valor inicial
    setMatches(mediaQuery.matches);

    // Definir el handler para cambios
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Agregar el listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Hook especializado para detectar preferencia de movimiento reducido
 * Fundamental para accesibilidad en aplicaciones de salud mental
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
