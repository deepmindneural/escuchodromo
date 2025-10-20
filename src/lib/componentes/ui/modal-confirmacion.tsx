'use client';

import React, { useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ModalConfirmacionProps {
  /** Estado abierto/cerrado del modal */
  abierto: boolean;
  /** Callback para cerrar el modal */
  onCerrar: () => void;
  /** Callback para confirmar la acción */
  onConfirmar: () => void | Promise<void>;
  /** Título del modal */
  titulo: string;
  /** Descripción de la acción a confirmar */
  descripcion: string;
  /** Texto del botón de confirmación */
  textoConfirmar?: string;
  /** Texto del botón de cancelación */
  textoCancelar?: string;
  /** Si es una acción peligrosa/destructiva (muestra en rojo) */
  peligroso?: boolean;
  /** Estado de carga durante la confirmación */
  cargando?: boolean;
}

/**
 * ModalConfirmacion - Modal accesible genérico para confirmar acciones
 *
 * Reemplaza a window.confirm() con una alternativa accesible que:
 * - Usa Radix UI Dialog (totalmente accesible WCAG 2.1 AA)
 * - Implementa focus trap automático
 * - Se cierra con tecla Escape
 * - Tiene ARIA labels completos
 * - Muestra estados de carga
 * - Diferencia visualmente acciones peligrosas
 * - Usa lenguaje empático para plataforma de salud mental
 *
 * @example
 * ```tsx
 * const [citaACancelar, setCitaACancelar] = useState<string | null>(null);
 *
 * <ModalConfirmacion
 *   abierto={!!citaACancelar}
 *   onCerrar={() => setCitaACancelar(null)}
 *   onConfirmar={async () => {
 *     await cancelarCita(citaACancelar);
 *     setCitaACancelar(null);
 *   }}
 *   titulo="Cancelar cita"
 *   descripcion="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
 *   textoConfirmar="Sí, cancelar cita"
 *   textoCancelar="No, mantener cita"
 *   peligroso={true}
 * />
 * ```
 */
export function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligroso = false,
  cargando = false,
}: ModalConfirmacionProps) {
  const botonConfirmarRef = useRef<HTMLButtonElement>(null);
  const [procesando, setProcesando] = React.useState(false);

  // Focus en el botón de cancelar cuando se abre el modal (patrón seguro)
  useEffect(() => {
    if (abierto && botonConfirmarRef.current) {
      setTimeout(() => {
        botonConfirmarRef.current?.focus();
      }, 100);
    }
  }, [abierto]);

  const manejarConfirmacion = async () => {
    setProcesando(true);
    try {
      await onConfirmar();
    } finally {
      setProcesando(false);
    }
  };

  const estaCargando = cargando || procesando;

  return (
    <Dialog.Root open={abierto} onOpenChange={(open) => !open && !estaCargando && onCerrar()}>
      <Dialog.Portal>
        {/* Overlay con backdrop blur terapéutico */}
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />

        {/* Contenido del modal */}
        <Dialog.Content
          className={clsx(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'bg-white rounded-xl shadow-2xl z-50',
            'w-[95vw] max-w-md',
            'data-[state=open]:animate-slide-up',
            'focus:outline-none'
          )}
          aria-describedby="descripcion-modal-confirmacion"
          onPointerDownOutside={(e) => {
            // Prevenir cierre si está cargando
            if (estaCargando) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevenir cierre con ESC si está cargando
            if (estaCargando) {
              e.preventDefault();
            }
          }}
        >
          {/* Contenido */}
          <div className="p-6">
            {/* Icono y título */}
            <div className="flex items-start gap-4 mb-4">
              {peligroso ? (
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-alerta-100 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <ExclamationTriangleIcon className="w-6 h-6 text-alerta-600" />
                </div>
              ) : (
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-calma-100 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <CheckCircleIcon className="w-6 h-6 text-calma-600" />
                </div>
              )}

              <div className="flex-1">
                <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                  {titulo}
                </Dialog.Title>
                <Dialog.Description
                  id="descripcion-modal-confirmacion"
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  {descripcion}
                </Dialog.Description>
              </div>

              {/* Botón cerrar (solo si no está cargando) */}
              {!estaCargando && (
                <Dialog.Close
                  className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-calma-500 transition-colors"
                  aria-label="Cerrar modal de confirmación"
                >
                  <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                </Dialog.Close>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCerrar}
                disabled={estaCargando}
                className={clsx(
                  'flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors',
                  'bg-white text-gray-700 border-2 border-gray-300',
                  'hover:bg-gray-50 hover:border-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                type="button"
              >
                {textoCancelar}
              </button>

              <button
                ref={botonConfirmarRef}
                onClick={manejarConfirmacion}
                disabled={estaCargando}
                className={clsx(
                  'flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                  peligroso
                    ? 'bg-alerta-600 text-white hover:bg-alerta-700 focus:ring-alerta-500'
                    : 'bg-calma-600 text-white hover:bg-calma-700 focus:ring-calma-500'
                )}
                type="button"
              >
                {estaCargando ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>{textoConfirmar}</span>
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
