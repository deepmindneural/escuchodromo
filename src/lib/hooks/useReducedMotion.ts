/**
 * Hook para detectar la preferencia de movimiento reducido del usuario
 * Respeta prefers-reduced-motion para usuarios con sensibilidad al movimiento,
 * trastornos vestibulares, o condiciones que empeoran con animaciones.
 *
 * WCAG 2.1 SC 2.3.3 (Animation from Interactions) - Level AAA
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta la media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Establecer el estado inicial
    setPrefersReducedMotion(mediaQuery.matches);

    // Escuchar cambios en la preferencia
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Agregar listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Función helper para obtener propiedades de animación condicionales
 *
 * @example
 * const motionProps = getMotionProps(prefersReducedMotion, {
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 },
 *   transition: { duration: 0.5 }
 * });
 */
export function getMotionProps<T extends Record<string, any>>(
  prefersReducedMotion: boolean,
  props: T
): T | {} {
  return prefersReducedMotion ? {} : props;
}

/**
 * Función para obtener duración de transición ajustada
 * Si el usuario prefiere movimiento reducido, devuelve 0
 *
 * @param duration - Duración en segundos
 * @returns Duración ajustada o 0
 */
export function getTransitionDuration(
  prefersReducedMotion: boolean,
  duration: number
): number {
  return prefersReducedMotion ? 0 : duration;
}
