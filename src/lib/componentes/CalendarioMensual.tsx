'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import {
  obtenerDiasDelMes,
  obtenerNombreMes,
  mesAnterior,
  mesSiguiente,
  esMismoDia,
  esHoy,
  formatearFechaCorta,
} from '../utils/fechas';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

interface CalendarioMensualProps {
  /** Fecha seleccionada actualmente */
  fechaSeleccionada: Date | null;
  /** Callback cuando se selecciona una fecha */
  onSeleccionarFecha: (fecha: Date) => void;
  /** Array de fechas con disponibilidad */
  fechasConDisponibilidad?: Date[];
  /** Fecha mínima seleccionable */
  fechaMinima?: Date;
  /** Fecha máxima seleccionable */
  fechaMaxima?: Date;
}

/**
 * CalendarioMensual - Componente de calendario accesible para selección de fechas
 *
 * Características de accesibilidad:
 * - Navegación completa por teclado (Tab, flechas, Enter, Space)
 * - ARIA labels descriptivos
 * - Indicadores visuales + texto (no solo color)
 * - Focus visible y claro
 * - Respeta prefers-reduced-motion
 */
export function CalendarioMensual({
  fechaSeleccionada,
  onSeleccionarFecha,
  fechasConDisponibilidad = [],
  fechaMinima = new Date(),
  fechaMaxima,
}: CalendarioMensualProps) {
  const [mesActual, setMesActual] = useState(fechaSeleccionada || new Date());
  const prefersReducedMotion = usePrefersReducedMotion();

  const diasDelMes = obtenerDiasDelMes(mesActual);
  const nombreMes = obtenerNombreMes(mesActual);

  // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  const primerDiaDelMes = diasDelMes[0];
  const diaSemanaInicio = primerDiaDelMes.getDay();

  // Crear array con días vacíos al inicio para alinear el calendario
  const diasVacios = Array.from({ length: diaSemanaInicio }, (_, i) => i);

  const navegarMesAnterior = () => {
    setMesActual(mesAnterior(mesActual));
  };

  const navegarMesSiguiente = () => {
    setMesActual(mesSiguiente(mesActual));
  };

  const tieneDispo nibilidad = (fecha: Date): boolean => {
    return fechasConDisponibilidad.some((fechaDispo) =>
      esMismoDia(fechaDispo, fecha)
    );
  };

  const esSeleccionable = (fecha: Date): boolean => {
    const esPosteriorAMinima = fecha >= fechaMinima;
    const esAnteriorAMaxima = fechaMaxima ? fecha <= fechaMaxima : true;
    return esPosteriorAMinima && esAnteriorAMaxima;
  };

  const manejarSeleccionDia = (fecha: Date) => {
    if (esSeleccionable(fecha)) {
      onSeleccionarFecha(fecha);
    }
  };

  const manejarTeclaEnDia = (e: React.KeyboardEvent, fecha: Date) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      manejarSeleccionDia(fecha);
    }
  };

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6"
      role="region"
      aria-label="Calendario de reservas"
    >
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={navegarMesAnterior}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            'hover:bg-calma-50 focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
            'text-gray-600 hover:text-calma-700'
          )}
          aria-label={`Ir al mes anterior`}
          type="button"
        >
          <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
        </button>

        <h2
          className="text-lg md:text-xl font-semibold text-gray-800 capitalize"
          aria-live="polite"
          aria-atomic="true"
        >
          {nombreMes}
        </h2>

        <button
          onClick={navegarMesSiguiente}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            'hover:bg-calma-50 focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
            'text-gray-600 hover:text-calma-700'
          )}
          aria-label={`Ir al mes siguiente`}
          type="button"
        >
          <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Nombres de días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="text-center text-xs md:text-sm font-medium text-gray-600 py-2"
            aria-label={dia}
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Días del mes">
        {/* Días vacíos al inicio */}
        {diasVacios.map((_, index) => (
          <div key={`vacio-${index}`} className="aspect-square" aria-hidden="true" />
        ))}

        {/* Días del mes */}
        {diasDelMes.map((fecha) => {
          const esSeleccionado = fechaSeleccionada && esMismoDia(fecha, fechaSeleccionada);
          const esHoyDia = esHoy(fecha);
          const tieneDisponibilidad = tieneDisponibilidad(fecha);
          const estaSeleccionable = esSeleccionable(fecha);

          return (
            <button
              key={fecha.toISOString()}
              onClick={() => manejarSeleccionDia(fecha)}
              onKeyDown={(e) => manejarTeclaEnDia(e, fecha)}
              disabled={!estaSeleccionable}
              className={clsx(
                'aspect-square rounded-lg flex flex-col items-center justify-center relative',
                'text-sm md:text-base font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-1',
                // Estados
                {
                  // Día seleccionado
                  'bg-calma-600 text-white shadow-md': esSeleccionado,
                  // Día de hoy (no seleccionado)
                  'bg-calma-50 text-calma-700 ring-2 ring-calma-500': esHoyDia && !esSeleccionado,
                  // Día con disponibilidad
                  'bg-esperanza-50 text-esperanza-700 hover:bg-esperanza-100':
                    tieneDisponibilidad && !esSeleccionado && !esHoyDia && estaSeleccionable,
                  // Día normal seleccionable
                  'bg-white text-gray-700 hover:bg-gray-50':
                    !tieneDisponibilidad && !esSeleccionado && !esHoyDia && estaSeleccionable,
                  // Día no seleccionable
                  'bg-gray-50 text-gray-400 cursor-not-allowed': !estaSeleccionable,
                },
                // Animación suave
                !prefersReducedMotion && 'hover:scale-105'
              )}
              aria-label={`${formatearFechaCorta(fecha)}${
                esHoyDia ? ', hoy' : ''
              }${tieneDisponibilidad ? ', tiene disponibilidad' : ''}${
                esSeleccionado ? ', seleccionado' : ''
              }${!estaSeleccionable ? ', no disponible' : ''}`}
              aria-pressed={esSeleccionado}
              aria-disabled={!estaSeleccionable}
              role="gridcell"
              type="button"
            >
              <span>{fecha.getDate()}</span>

              {/* Indicador visual de disponibilidad */}
              {tieneDisponibilidad && estaSeleccionable && (
                <CheckCircleIcon
                  className={clsx(
                    'w-3 h-3 absolute bottom-1',
                    esSeleccionado ? 'text-white' : 'text-esperanza-600'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Texto oculto para screen readers */}
              {tieneDisponibilidad && (
                <span className="sr-only">Disponible</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs md:text-sm" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-esperanza-50 border-2 border-esperanza-600" aria-hidden="true" />
          <span className="text-gray-600">Con disponibilidad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-calma-600" aria-hidden="true" />
          <span className="text-gray-600">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-calma-50 ring-2 ring-calma-500" aria-hidden="true" />
          <span className="text-gray-600">Hoy</span>
        </div>
      </div>
    </div>
  );
}
