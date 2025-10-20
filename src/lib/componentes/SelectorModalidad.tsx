'use client';

import React from 'react';
import { VideoCameraIcon, MapPinIcon } from '@heroicons/react/24/outline';
import * as RadioGroup from '@radix-ui/react-radio-group';
import clsx from 'clsx';

export type Modalidad = 'VIRTUAL' | 'PRESENCIAL';

interface SelectorModalidadProps {
  /** Modalidad seleccionada actualmente */
  modalidadSeleccionada: Modalidad;
  /** Callback cuando cambia la modalidad */
  onCambiarModalidad: (modalidad: Modalidad) => void;
  /** Dirección para sesiones presenciales */
  direccionPresencial?: string;
}

/**
 * SelectorModalidad - Selector accesible para modalidad de sesión
 *
 * Características de accesibilidad:
 * - Usa Radix UI RadioGroup (totalmente accesible)
 * - Iconos descriptivos + texto
 * - Touch targets de 44x44px mínimo
 * - Contraste WCAG AA
 * - Navegación por teclado completa
 */
export function SelectorModalidad({
  modalidadSeleccionada,
  onCambiarModalidad,
  direccionPresencial,
}: SelectorModalidadProps) {
  const opciones: Array<{
    valor: Modalidad;
    icono: React.ComponentType<{ className?: string }>;
    titulo: string;
    descripcion: string;
  }> = [
    {
      valor: 'VIRTUAL',
      icono: VideoCameraIcon,
      titulo: 'Sesión virtual',
      descripcion: 'Videollamada desde la comodidad de tu hogar',
    },
    {
      valor: 'PRESENCIAL',
      icono: MapPinIcon,
      titulo: 'Sesión presencial',
      descripcion: direccionPresencial || 'En el consultorio del profesional',
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-800" id="modalidad-label">
        Modalidad de atención
      </label>

      <RadioGroup.Root
        value={modalidadSeleccionada}
        onValueChange={(valor) => onCambiarModalidad(valor as Modalidad)}
        aria-labelledby="modalidad-label"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {opciones.map((opcion) => {
          const esSeleccionada = modalidadSeleccionada === opcion.valor;
          const Icono = opcion.icono;

          return (
            <RadioGroup.Item
              key={opcion.valor}
              value={opcion.valor}
              className={clsx(
                'min-h-[44px] rounded-lg p-4 border-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                'cursor-pointer group text-left',
                {
                  'bg-calma-600 border-calma-600 text-white shadow-md': esSeleccionada,
                  'bg-white border-gray-200 hover:border-calma-400 hover:bg-calma-50':
                    !esSeleccionada,
                }
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icono */}
                <Icono
                  className={clsx('w-6 h-6 flex-shrink-0 mt-0.5', {
                    'text-white': esSeleccionada,
                    'text-calma-600 group-hover:text-calma-700': !esSeleccionada,
                  })}
                  aria-hidden="true"
                />

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base mb-1">
                    {opcion.titulo}
                  </div>
                  <p
                    className={clsx('text-sm', {
                      'text-white/90': esSeleccionada,
                      'text-gray-600': !esSeleccionada,
                    })}
                  >
                    {opcion.descripcion}
                  </p>
                </div>

                {/* Indicador visual de selección */}
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    {
                      'border-white bg-white': esSeleccionada,
                      'border-gray-300 bg-white': !esSeleccionada,
                    }
                  )}
                  aria-hidden="true"
                >
                  {esSeleccionada && (
                    <div className="w-3 h-3 rounded-full bg-calma-600" />
                  )}
                </div>
              </div>

              {/* Indicador de radio (oculto visualmente, accesible) */}
              <RadioGroup.Indicator className="sr-only">
                Seleccionado
              </RadioGroup.Indicator>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>

      {/* Nota para sesiones virtuales */}
      {modalidadSeleccionada === 'VIRTUAL' && (
        <div
          className="bg-calma-50 rounded-lg p-3 flex items-start gap-2 text-sm"
          role="note"
        >
          <svg
            className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5"
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
          <p className="text-calma-900">
            Recibirás el enlace de la videollamada por correo electrónico antes de la sesión.
            Asegúrate de tener una conexión estable a internet.
          </p>
        </div>
      )}

      {/* Nota para sesiones presenciales */}
      {modalidadSeleccionada === 'PRESENCIAL' && direccionPresencial && (
        <div
          className="bg-calma-50 rounded-lg p-3 flex items-start gap-2 text-sm"
          role="note"
        >
          <MapPinIcon
            className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-calma-900 font-medium mb-1">Dirección del consultorio:</p>
            <p className="text-calma-800">{direccionPresencial}</p>
          </div>
        </div>
      )}
    </div>
  );
}
