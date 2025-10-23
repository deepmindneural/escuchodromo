/**
 * Índice de hooks de accesibilidad
 *
 * Centraliza todos los hooks relacionados con accesibilidad WCAG 2.1 AA
 * para facilitar su importación y uso en toda la aplicación.
 */

export { usePrefersReducedMotion, variantesAnimacion } from './usePrefersReducedMotion';
export { useFocusTrap, useDisableBodyScroll } from './useFocusTrap';
export { useAnnouncer, useAnnouncerWithQueue, AriaLiveRegion } from './useAnnouncer';
export {
  useKeyboardNavigation,
  useRovingTabIndex,
  useSkipLink
} from './useKeyboardNavigation';
