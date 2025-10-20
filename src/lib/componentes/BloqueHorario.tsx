'use client';

import React from 'react';
import { PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

export interface Horario {
  id: string;
  hora_inicio: string; // "09:00"
  hora_fin: string; // "18:00"
  activo: boolean;
}

interface BloqueHorarioProps {
  horario: Horario;
  onEditar: () => void;
  onEliminar: () => void;
  onToggleActivo: () => void;
  editando?: boolean;
  disabled?: boolean;
}

/**
 * Componente BloqueHorario
 *
 * Muestra un bloque de horario configurado con opciones para editar,
 * eliminar y activar/desactivar.
 *
 * @example
 * <BloqueHorario
 *   horario={{ id: '1', hora_inicio: '09:00', hora_fin: '12:00', activo: true }}
 *   onEditar={handleEditar}
 *   onEliminar={handleEliminar}
 *   onToggleActivo={handleToggle}
 * />
 */
export function BloqueHorario({
  horario,
  onEditar,
  onEliminar,
  onToggleActivo,
  editando = false,
  disabled = false,
}: BloqueHorarioProps) {
  // Calcular duración en horas y minutos
  const calcularDuracion = (): { horas: number; minutos: number; total: number } => {
    const [horaInicioH, horaInicioM] = horario.hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horario.hora_fin.split(':').map(Number);

    const minutosInicio = horaInicioH * 60 + horaInicioM;
    const minutosFin = horaFinH * 60 + horaFinM;

    const totalMinutos = minutosFin - minutosInicio;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    return { horas, minutos, total: totalMinutos };
  };

  const { horas, minutos, total } = calcularDuracion();

  return (
    <div
      className={`
        border rounded-lg p-4 transition-all
        ${editando ? 'ring-2 ring-calma-500 border-calma-500 bg-calma-50' : 'border-gray-200 bg-white'}
        ${!horario.activo ? 'opacity-60 bg-gray-50' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Información del horario */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon
              className={`h-5 w-5 flex-shrink-0 ${horario.activo ? 'text-calma-600' : 'text-gray-400'}`}
              aria-hidden="true"
            />
            <span className="text-lg font-semibold text-gray-900">
              {horario.hora_inicio} - {horario.hora_fin}
            </span>
            {!horario.activo && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Inactivo
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600">
            {horas > 0 && <span>{horas} {horas === 1 ? 'hora' : 'horas'}</span>}
            {horas > 0 && minutos > 0 && <span> y </span>}
            {minutos > 0 && <span>{minutos} {minutos === 1 ? 'minuto' : 'minutos'}</span>}
            {' disponibles'}
          </p>

          {/* Información adicional: cantidad de sesiones posibles */}
          <p className="text-xs text-gray-500 mt-1">
            Permite hasta {Math.floor(total / 30)} sesiones de 30 min o {Math.floor(total / 60)} sesiones de 60 min
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {/* Toggle activo/inactivo */}
          <button
            type="button"
            onClick={onToggleActivo}
            disabled={disabled}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2
              ${horario.activo ? 'bg-calma-600' : 'bg-gray-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            role="switch"
            aria-checked={horario.activo}
            aria-label={horario.activo ? 'Desactivar horario' : 'Activar horario'}
          >
            <span
              aria-hidden="true"
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                transition duration-200 ease-in-out
                ${horario.activo ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>

          {/* Botón editar */}
          <button
            type="button"
            onClick={onEditar}
            disabled={disabled}
            className="p-2 text-gray-600 hover:text-calma-600 hover:bg-calma-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-1"
            aria-label="Editar horario"
            title="Editar horario"
          >
            <PencilIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Botón eliminar */}
          <button
            type="button"
            onClick={onEliminar}
            disabled={disabled}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            aria-label="Eliminar horario"
            title="Eliminar horario"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
