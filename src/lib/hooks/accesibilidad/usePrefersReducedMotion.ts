/**
 * Hook: usePrefersReducedMotion
 *
 * Detecta si el usuario ha configurado su sistema para reducir movimiento/animaciones.
 * Respeta la preferencia del sistema "prefers-reduced-motion" para accesibilidad.
 *
 * @returns {boolean} true si el usuario prefiere movimiento reducido
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 *
 * <motion.div
 *   initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
 *   animate={{ opacity: 1, y: 0 }}
 *   transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
 * >
 *   Contenido
 * </motion.div>
 */

'use client';

import { useState, useEffect } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      return;
    }

    // Crear media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Establecer valor inicial
    setPrefersReducedMotion(mediaQuery.matches);

    // Handler para cambios en la preferencia
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Escuchar cambios (el usuario puede cambiar la preferencia sin recargar)
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Variantes predefinidas para Framer Motion que respetan prefers-reduced-motion
 */
export const variantesAnimacion = {
  /**
   * Fade in suave
   */
  fadeIn: (prefersReducedMotion: boolean) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }
  }),

  /**
   * Slide desde abajo
   */
  slideUp: (prefersReducedMotion: boolean) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }
  }),

  /**
   * Slide desde arriba
   */
  slideDown: (prefersReducedMotion: boolean) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }
  }),

  /**
   * Scale suave (crecimiento)
   */
  scaleIn: (prefersReducedMotion: boolean) => ({
    initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }
  }),

  /**
   * Stagger para listas (animación escalonada)
   */
  stagger: (prefersReducedMotion: boolean) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
      ease: 'easeOut'
    }
  })
};
