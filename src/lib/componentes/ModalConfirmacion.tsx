'use client';

import React, { useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, ClockIcon, VideoCameraIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import type { Modalidad } from './SelectorModalidad';

interface DatosConfirmacion {
  profesional: {
    nombre: string;
    apellido: string;
    especialidad?: string;
    foto?: string;
  };
  fecha: string; // Formato legible "Viernes 15 de Marzo"
  hora: string; // Formato "14:30"
  duracion: number; // minutos
  modalidad: Modalidad;
  precio: number;
  moneda?: string;
  direccion?: string; // Solo para presencial
}

interface ModalConfirmacionProps {
  /** Estado abierto/cerrado del modal */
  abierto: boolean;
  /** Callback para cerrar el modal */
  onCerrar: () => void;
  /** Callback para confirmar la reserva */
  onConfirmar: () => void;
  /** Datos de la reserva a confirmar */
  datos: DatosConfirmacion;
  /** Estado de carga durante la confirmación */
  cargando?: boolean;
}

/**
 * ModalConfirmacion - Modal accesible para confirmar reserva de cita
 *
 * Características de accesibilidad:
 * - Usa Radix UI Dialog (totalmente accesible)
 * - Focus trap automático
 * - Cierre con ESC
 * - ARIA labels completos
 * - Overlay semi-transparente
 * - Información clara y organizada
 */
export function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  datos,
  cargando = false,
}: ModalConfirmacionProps) {
  const botonConfirmarRef = useRef<HTMLButtonElement>(null);

  // Focus en el botón de confirmar cuando se abre el modal
  useEffect(() => {
    if (abierto && botonConfirmarRef.current) {
      setTimeout(() => {
        botonConfirmarRef.current?.focus();
      }, 100);
    }
  }, [abierto]);

  const formatearPrecio = (precio: number): string => {
    const moneda = datos.moneda || 'COP';
    if (moneda === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(precio);
    }
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: moneda,
    }).format(precio);
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />

        {/* Contenido del modal */}
        <Dialog.Content
          className={clsx(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'bg-white rounded-xl shadow-2xl z-50',
            'w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto',
            'data-[state=open]:animate-slide-up',
            'focus:outline-none'
          )}
          aria-describedby="descripcion-confirmacion"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <Dialog.Title className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircleIcon className="w-7 h-7 text-calma-600" aria-hidden="true" />
              Confirmar reserva
            </Dialog.Title>
            <Dialog.Close
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-calma-500 transition-colors"
              aria-label="Cerrar modal"
              disabled={cargando}
            >
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6" id="descripcion-confirmacion">
            {/* Información del profesional */}
            <div className="flex items-center gap-4 p-4 bg-calma-50 rounded-lg">
              {datos.profesional.foto ? (
                <img
                  src={datos.profesional.foto}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-2 border-calma-200"
                  aria-hidden="true"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-bold text-xl"
                  aria-hidden="true"
                >
                  {datos.profesional.nombre.charAt(0)}
                  {datos.profesional.apellido.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {datos.profesional.nombre} {datos.profesional.apellido}
                </h3>
                {datos.profesional.especialidad && (
                  <p className="text-sm text-gray-600">{datos.profesional.especialidad}</p>
                )}
              </div>
            </div>

            {/* Detalles de la cita */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-3">Detalles de la sesión</h4>

              {/* Fecha */}
              <div className="flex items-start gap-3 text-gray-700">
                <CalendarIcon className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-medium">Fecha:</span>
                  <p className="text-gray-600">{datos.fecha}</p>
                </div>
              </div>

              {/* Hora */}
              <div className="flex items-start gap-3 text-gray-700">
                <ClockIcon className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-medium">Hora:</span>
                  <p className="text-gray-600">
                    {datos.hora} ({datos.duracion} minutos)
                  </p>
                </div>
              </div>

              {/* Modalidad */}
              <div className="flex items-start gap-3 text-gray-700">
                {datos.modalidad === 'VIRTUAL' ? (
                  <VideoCameraIcon className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <MapPinIcon className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="flex-1">
                  <span className="font-medium">Modalidad:</span>
                  <p className="text-gray-600">
                    {datos.modalidad === 'VIRTUAL' ? 'Sesión virtual' : 'Sesión presencial'}
                  </p>
                  {datos.modalidad === 'PRESENCIAL' && datos.direccion && (
                    <p className="text-sm text-gray-500 mt-1">{datos.direccion}</p>
                  )}
                </div>
              </div>

              {/* Precio */}
              <div className="flex items-start gap-3 text-gray-700 pt-3 border-t border-gray-200">
                <CurrencyDollarIcon className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-medium">Precio:</span>
                  <p className="text-2xl font-bold text-calma-700 mt-1">
                    {formatearPrecio(datos.precio)}
                  </p>
                </div>
              </div>
            </div>

            {/* Nota importante */}
            <div
              className="bg-esperanza-50 border border-esperanza-200 rounded-lg p-4"
              role="note"
            >
              <h5 className="font-semibold text-esperanza-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Política de cancelación
              </h5>
              <p className="text-sm text-esperanza-800">
                Puedes cancelar o reprogramar tu cita hasta 24 horas antes sin costo adicional.
                Las cancelaciones con menos de 24 horas de anticipación tendrán un cargo del 50%.
              </p>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
            <button
              onClick={onCerrar}
              disabled={cargando}
              className={clsx(
                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors',
                'bg-white text-gray-700 border-2 border-gray-300',
                'hover:bg-gray-50 hover:border-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              type="button"
            >
              Cancelar
            </button>
            <button
              ref={botonConfirmarRef}
              onClick={onConfirmar}
              disabled={cargando}
              className={clsx(
                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors',
                'bg-calma-600 text-white',
                'hover:bg-calma-700',
                'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
              type="button"
            >
              {cargando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" aria-hidden="true" />
                  <span>Confirmar reserva</span>
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
