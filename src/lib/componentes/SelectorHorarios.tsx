'use client';

import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface SelectorHorariosProps {
  horaInicio: string; // "09:00"
  horaFin: string; // "18:00"
  onHoraInicioChange: (hora: string) => void;
  onHoraFinChange: (hora: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Componente SelectorHorarios
 *
 * Selector de rango de horas con validación en tiempo real.
 * Genera opciones cada 30 minutos y valida que hora_fin > hora_inicio.
 *
 * @example
 * <SelectorHorarios
 *   horaInicio="09:00"
 *   horaFin="12:00"
 *   onHoraInicioChange={setHoraInicio}
 *   onHoraFinChange={setHoraFin}
 *   error={errorHorario}
 * />
 */
export function SelectorHorarios({
  horaInicio,
  horaFin,
  onHoraInicioChange,
  onHoraFinChange,
  error,
  disabled = false,
}: SelectorHorariosProps) {
  // Generar opciones de horas cada 30 minutos (06:00 - 22:00)
  const generarOpcionesHoras = (): string[] => {
    const opciones: string[] = [];
    for (let hora = 6; hora <= 22; hora++) {
      opciones.push(`${hora.toString().padStart(2, '0')}:00`);
      if (hora < 22) {
        opciones.push(`${hora.toString().padStart(2, '0')}:30`);
      }
    }
    return opciones;
  };

  const opcionesHoras = generarOpcionesHoras();

  // Calcular duración del bloque en minutos
  const calcularDuracion = (): number | null => {
    if (!horaInicio || !horaFin) return null;

    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);

    const minutosInicio = horaInicioH * 60 + horaInicioM;
    const minutosFin = horaFinH * 60 + horaFinM;

    const duracion = minutosFin - minutosInicio;
    return duracion > 0 ? duracion : null;
  };

  const duracion = calcularDuracion();

  return (
    <div className="space-y-3">
      {/* Selectores de hora */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hora de inicio */}
        <div>
          <label
            htmlFor="hora-inicio"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Hora de inicio
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="hora-inicio"
              value={horaInicio}
              onChange={(e) => onHoraInicioChange(e.target.value)}
              disabled={disabled}
              className={`
                block w-full pl-10 pr-3 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${
                  error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-calma-500 focus:ring-calma-500'
                }
              `}
              aria-invalid={!!error}
              aria-describedby={error ? 'error-horario' : undefined}
            >
              <option value="">Seleccionar</option>
              {opcionesHoras.map((hora) => (
                <option key={`inicio-${hora}`} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hora de fin */}
        <div>
          <label
            htmlFor="hora-fin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Hora de fin
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="hora-fin"
              value={horaFin}
              onChange={(e) => onHoraFinChange(e.target.value)}
              disabled={disabled}
              className={`
                block w-full pl-10 pr-3 py-2.5 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${
                  error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-calma-500 focus:ring-calma-500'
                }
              `}
              aria-invalid={!!error}
              aria-describedby={error ? 'error-horario' : undefined}
            >
              <option value="">Seleccionar</option>
              {opcionesHoras.map((hora) => (
                <option key={`fin-${hora}`} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Información de duración */}
      {duracion !== null && duracion > 0 && !error && (
        <div className="flex items-center text-sm text-gray-600 bg-calma-50 border border-calma-200 rounded-lg px-3 py-2">
          <ClockIcon className="h-4 w-4 mr-2 text-calma-600" aria-hidden="true" />
          <span>
            Duración: <strong>{duracion} minutos</strong>
            {duracion >= 60 && (
              <span className="ml-1">
                ({Math.floor(duracion / 60)}h {duracion % 60 > 0 ? `${duracion % 60}m` : ''})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div
          id="error-horario"
          className="flex items-start text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
          role="alert"
        >
          <svg
            className="h-5 w-5 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
