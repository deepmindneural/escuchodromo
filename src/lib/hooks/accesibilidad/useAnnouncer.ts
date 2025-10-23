/**
 * Hook: useAnnouncer
 *
 * Proporciona una forma de anunciar mensajes a lectores de pantalla
 * usando regiones ARIA live. Útil para notificaciones, cambios de estado,
 * actualizaciones dinámicas, etc.
 *
 * Cumple con WCAG 4.1.3 (Mensajes de estado)
 *
 * @returns {{ announce: (mensaje: string, prioridad?: 'polite' | 'assertive') => void }}
 *
 * @example
 * const { announce } = useAnnouncer();
 *
 * const guardarDatos = async () => {
 *   await api.guardar();
 *   announce('Datos guardados correctamente');
 * };
 *
 * const errorCritico = () => {
 *   announce('Error crítico, revise los datos', 'assertive');
 * };
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

type Prioridad = 'polite' | 'assertive';

export function useAnnouncer() {
  const regionPoliteRef = useRef<HTMLDivElement | null>(null);
  const regionAssertiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Crear regiones ARIA live si no existen
    if (!regionPoliteRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('role', 'status');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
      regionPoliteRef.current = politeRegion;
    }

    if (!regionAssertiveRef.current) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('role', 'alert');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
      regionAssertiveRef.current = assertiveRegion;
    }

    // Cleanup: NO remover las regiones ya que son compartidas
    // Solo se remueven cuando el componente raíz se desmonta
    return () => {
      // Limpiar contenido pero mantener el elemento
      if (regionPoliteRef.current) {
        regionPoliteRef.current.textContent = '';
      }
      if (regionAssertiveRef.current) {
        regionAssertiveRef.current.textContent = '';
      }
    };
  }, []);

  const announce = useCallback((mensaje: string, prioridad: Prioridad = 'polite') => {
    const region = prioridad === 'assertive'
      ? regionAssertiveRef.current
      : regionPoliteRef.current;

    if (!region) return;

    // Limpiar primero para forzar re-anuncio si es el mismo mensaje
    region.textContent = '';

    // Usar setTimeout para asegurar que el lector de pantalla detecte el cambio
    setTimeout(() => {
      region.textContent = mensaje;

      // Limpiar después de 1 segundo para que no se acumulen
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }, 100);
  }, []);

  return { announce };
}

/**
 * Hook: useAnnouncerWithQueue
 *
 * Versión avanzada que maneja una cola de mensajes para evitar
 * que múltiples anuncios se superpongan.
 */
export function useAnnouncerWithQueue() {
  const { announce: announceBase } = useAnnouncer();
  const queueRef = useRef<Array<{ mensaje: string; prioridad: Prioridad }>>([]);
  const processingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const { mensaje, prioridad } = queueRef.current.shift()!;

    announceBase(mensaje, prioridad);

    // Esperar antes de procesar el siguiente mensaje
    setTimeout(() => {
      processingRef.current = false;
      processQueue();
    }, 1500);
  }, [announceBase]);

  const announce = useCallback((mensaje: string, prioridad: Prioridad = 'polite') => {
    queueRef.current.push({ mensaje, prioridad });
    processQueue();
  }, [processQueue]);

  return { announce };
}

/**
 * Componente: AriaLiveRegion
 *
 * Componente de utilidad para crear regiones ARIA live explícitas
 *
 * @example
 * <AriaLiveRegion politeness="polite">
 *   {mensaje}
 * </AriaLiveRegion>
 */
export function AriaLiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: string;
}) {
  return (
    <div
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}
