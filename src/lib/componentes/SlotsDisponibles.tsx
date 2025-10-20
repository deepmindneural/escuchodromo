'use client';

import React from 'react';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

export interface SlotHorario {
  hora_inicio: string; // Formato HH:mm
  hora_fin: string; // Formato HH:mm
  disponible: boolean;
  duracion_disponible: number; // minutos disponibles
}

interface SlotsDisponiblesProps {
  /** Array de slots de horario disponibles */
  slots: SlotHorario[];
  /** Slot seleccionado actualmente */
  slotSeleccionado: SlotHorario | null;
  /** Callback cuando se selecciona un slot */
  onSeleccionarSlot: (slot: SlotHorario) => void;
  /** Duración de sesión seleccionada (para validar disponibilidad) */
  duracionSesion: number;
  /** Mensaje cuando no hay slots */
  mensajeSinSlots?: string;
}

/**
 * SlotsDisponibles - Muestra horarios disponibles para reserva
 *
 * Características de accesibilidad:
 * - Estados visuales claros (disponible/ocupado/seleccionado)
 * - No depende solo de color (usa iconos y texto)
 * - Navegación por teclado completa
 * - ARIA labels descriptivos
 * - Touch targets de 44x44px mínimo
 */
export function SlotsDisponibles({
  slots,
  slotSeleccionado,
  onSeleccionarSlot,
  duracionSesion,
  mensajeSinSlots = 'No hay horarios disponibles para esta fecha',
}: SlotsDisponiblesProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Verificar si un slot tiene suficiente duración
  const tieneDuracionSuficiente = (slot: SlotHorario): boolean => {
    return slot.duracion_disponible >= duracionSesion;
  };

  // Si no hay slots disponibles
  if (!slots || slots.length === 0) {
    return (
      <div
        className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300"
        role="status"
        aria-live="polite"
      >
        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
        <p className="text-gray-600 font-medium">{mensajeSinSlots}</p>
        <p className="text-sm text-gray-500 mt-2">
          Por favor, selecciona otra fecha
        </p>
      </div>
    );
  }

  // Filtrar slots disponibles
  const slotsDisponibles = slots.filter((slot) => slot.disponible);
  const slotsOcupados = slots.filter((slot) => !slot.disponible);

  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Horarios disponibles"
    >
      {/* Título y contador */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Horarios disponibles
        </h3>
        <span
          className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
          aria-live="polite"
        >
          {slotsDisponibles.length} {slotsDisponibles.length === 1 ? 'horario' : 'horarios'}
        </span>
      </div>

      {/* Grid de slots disponibles */}
      {slotsDisponibles.length > 0 && (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          role="radiogroup"
          aria-label="Seleccionar horario"
        >
          {slotsDisponibles.map((slot) => {
            const esSeleccionado =
              slotSeleccionado?.hora_inicio === slot.hora_inicio &&
              slotSeleccionado?.hora_fin === slot.hora_fin;
            const tieneDuracion = tieneDuracionSuficiente(slot);

            return (
              <button
                key={`${slot.hora_inicio}-${slot.hora_fin}`}
                onClick={() => tieneDuracion && onSeleccionarSlot(slot)}
                disabled={!tieneDuracion}
                className={clsx(
                  'min-h-[44px] rounded-lg p-3 flex flex-col items-center justify-center',
                  'border-2 transition-all text-center',
                  'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                  // Estados
                  {
                    // Seleccionado
                    'bg-calma-600 border-calma-600 text-white shadow-md': esSeleccionado,
                    // Disponible con duración suficiente
                    'bg-white border-esperanza-300 text-gray-700 hover:bg-esperanza-50 hover:border-esperanza-500':
                      !esSeleccionado && tieneDuracion,
                    // Disponible pero sin duración suficiente
                    'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed':
                      !esSeleccionado && !tieneDuracion,
                  },
                  // Animación
                  !prefersReducedMotion && tieneDuracion && 'hover:scale-105'
                )}
                aria-label={`${slot.hora_inicio} a ${slot.hora_fin}${
                  tieneDuracion
                    ? ''
                    : `, no disponible para sesión de ${duracionSesion} minutos`
                }${esSeleccionado ? ', seleccionado' : ''}`}
                aria-checked={esSeleccionado}
                role="radio"
                type="button"
              >
                {/* Icono */}
                {esSeleccionado ? (
                  <CheckCircleIcon className="w-5 h-5 mb-1" aria-hidden="true" />
                ) : (
                  <ClockIcon className="w-5 h-5 mb-1" aria-hidden="true" />
                )}

                {/* Hora */}
                <span className="text-sm font-medium">{slot.hora_inicio}</span>

                {/* Duración disponible (si es limitada) */}
                {slot.duracion_disponible < 60 && (
                  <span className="text-xs mt-1 opacity-75">
                    {slot.duracion_disponible} min
                  </span>
                )}

                {/* Indicador de no suficiente duración */}
                {!tieneDuracion && (
                  <span className="sr-only">
                    Duración insuficiente para sesión de {duracionSesion} minutos
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Slots ocupados (opcional, solo para mostrar contexto) */}
      {slotsOcupados.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-calma-500 rounded px-2 py-1">
            Ver horarios no disponibles ({slotsOcupados.length})
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
            {slotsOcupados.map((slot) => (
              <div
                key={`ocupado-${slot.hora_inicio}-${slot.hora_fin}`}
                className="min-h-[44px] rounded-lg p-3 flex flex-col items-center justify-center bg-gray-100 border-2 border-gray-200 text-gray-400"
                aria-label={`${slot.hora_inicio} a ${slot.hora_fin}, no disponible`}
              >
                <ClockIcon className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-sm font-medium">{slot.hora_inicio}</span>
                <span className="text-xs mt-1">Ocupado</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Nota informativa */}
      {duracionSesion > 0 && (
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
          <p className="text-calma-800">
            Los horarios mostrados son para sesiones de <strong>{duracionSesion} minutos</strong>.
            {duracionSesion === 60 && ' Algunos horarios solo permiten sesiones de 30 minutos.'}
          </p>
        </div>
      )}
    </div>
  );
}
