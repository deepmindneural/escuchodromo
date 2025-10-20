'use client';

import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import * as RadioGroup from '@radix-ui/react-radio-group';
import clsx from 'clsx';

interface OpcionDuracion {
  valor: number; // minutos
  precio: number; // en la moneda local
  etiqueta?: string;
}

interface SelectorDuracionProps {
  /** Duración seleccionada actualmente */
  duracionSeleccionada: number;
  /** Callback cuando cambia la duración */
  onCambiarDuracion: (duracion: number) => void;
  /** Opciones de duración disponibles */
  opciones?: OpcionDuracion[];
  /** Símbolo de moneda */
  moneda?: string;
}

const opcionesPorDefecto: OpcionDuracion[] = [
  { valor: 30, precio: 80000, etiqueta: 'Sesión corta' },
  { valor: 60, precio: 150000, etiqueta: 'Sesión completa' },
];

/**
 * SelectorDuracion - Selector accesible para duración de sesión
 *
 * Características de accesibilidad:
 * - Usa Radix UI RadioGroup (totalmente accesible)
 * - Indicadores visuales claros
 * - Touch targets de 44x44px mínimo
 * - Contraste WCAG AA
 * - Navegación por teclado (flechas, Tab)
 */
export function SelectorDuracion({
  duracionSeleccionada,
  onCambiarDuracion,
  opciones = opcionesPorDefecto,
  moneda = 'COP',
}: SelectorDuracionProps) {
  const formatearPrecio = (precio: number): string => {
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
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-800" id="duracion-label">
        Duración de la sesión
      </label>

      <RadioGroup.Root
        value={duracionSeleccionada.toString()}
        onValueChange={(valor) => onCambiarDuracion(parseInt(valor, 10))}
        aria-labelledby="duracion-label"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {opciones.map((opcion) => {
          const esSeleccionada = duracionSeleccionada === opcion.valor;

          return (
            <RadioGroup.Item
              key={opcion.valor}
              value={opcion.valor.toString()}
              className={clsx(
                'min-h-[44px] rounded-lg p-4 border-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                'cursor-pointer group',
                {
                  'bg-calma-600 border-calma-600 text-white shadow-md': esSeleccionada,
                  'bg-white border-gray-200 hover:border-calma-400 hover:bg-calma-50':
                    !esSeleccionada,
                }
              )}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Contenido principal */}
                <div className="flex items-start gap-3 flex-1">
                  {/* Icono */}
                  <ClockIcon
                    className={clsx('w-6 h-6 flex-shrink-0 mt-0.5', {
                      'text-white': esSeleccionada,
                      'text-calma-600 group-hover:text-calma-700': !esSeleccionada,
                    })}
                    aria-hidden="true"
                  />

                  {/* Información */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {opcion.valor}
                      </span>
                      <span className="text-sm font-medium opacity-90">
                        minutos
                      </span>
                    </div>

                    {opcion.etiqueta && (
                      <p
                        className={clsx('text-sm mt-1', {
                          'text-white/90': esSeleccionada,
                          'text-gray-600': !esSeleccionada,
                        })}
                      >
                        {opcion.etiqueta}
                      </p>
                    )}
                  </div>
                </div>

                {/* Precio */}
                <div className="text-right flex-shrink-0">
                  <div
                    className={clsx('text-lg font-bold', {
                      'text-white': esSeleccionada,
                      'text-gray-800': !esSeleccionada,
                    })}
                  >
                    {formatearPrecio(opcion.precio)}
                  </div>
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

      {/* Nota informativa */}
      <div
        className="bg-esperanza-50 rounded-lg p-3 flex items-start gap-2 text-sm"
        role="note"
      >
        <svg
          className="w-5 h-5 text-esperanza-600 flex-shrink-0 mt-0.5"
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
        <p className="text-esperanza-900">
          El precio puede variar según el profesional. Los valores mostrados son tarifas de referencia.
        </p>
      </div>
    </div>
  );
}
