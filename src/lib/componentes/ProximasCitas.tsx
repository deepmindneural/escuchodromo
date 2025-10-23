'use client';

import React from 'react';
import {
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import { formatearFechaHora, formatearHora } from '../utils/fechas';

export interface Cita {
  id: string;
  paciente: {
    nombre: string;
    apellido: string;
    foto?: string;
  };
  fecha: Date;
  duracion: number; // minutos
  modalidad: 'VIRTUAL' | 'PRESENCIAL';
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';
}

interface ProximasCitasProps {
  /** Array de citas */
  citas: Cita[];
  /** Callback para cancelar cita */
  onCancelar?: (citaId: string) => void;
  /** Callback para reprogramar cita */
  onReprogramar?: (citaId: string) => void;
  /** Callback para iniciar sesión */
  onIniciarSesion?: (citaId: string) => void;
  /** Callback para confirmar cita */
  onConfirmar?: (citaId: string) => void;
  /** Callback para completar cita */
  onCompletar?: (citaId: string) => void;
  /** Callback para marcar como no asistió */
  onMarcarNoAsistio?: (citaId: string) => void;
  /** Callback para agregar notas */
  onAgregarNotas?: (citaId: string) => void;
  /** Estado de carga */
  cargando?: boolean;
  /** Límite de citas a mostrar */
  limite?: number;
}

/**
 * ProximasCitas - Lista de próximas citas del profesional
 *
 * Características de accesibilidad:
 * - Lista semántica con ARIA
 * - Acciones accesibles con dropdown (Radix UI)
 * - Indicadores visuales claros
 * - Touch targets adecuados
 */
export function ProximasCitas({
  citas,
  onCancelar,
  onReprogramar,
  onIniciarSesion,
  onConfirmar,
  onCompletar,
  onMarcarNoAsistio,
  onAgregarNotas,
  cargando = false,
  limite = 5,
}: ProximasCitasProps) {
  const citasLimitadas = citas.slice(0, limite);

  // Verificar si una cita puede iniciarse (dentro de los próximos 15 minutos)
  const puedeIniciar = (fecha: Date): boolean => {
    const ahora = new Date();
    const diferencia = fecha.getTime() - ahora.getTime();
    const minutos = diferencia / (1000 * 60);
    return minutos >= -5 && minutos <= 15; // 5 min antes a 15 min después
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximas citas</h3>
        <div className="flex items-center justify-center py-8">
          <div className="w-12 h-12 border-4 border-calma-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Próximas citas</h3>
        <span className="text-sm text-gray-500">({citasLimitadas.length})</span>
      </div>

      {/* Lista de citas */}
      {citasLimitadas.length > 0 ? (
        <ul className="divide-y divide-gray-200" role="list">
          {citasLimitadas.map((cita) => {
            const puedIniciar = puedeIniciar(cita.fecha);

            return (
              <li
                key={cita.id}
                className="p-4 hover:bg-gray-50 transition-colors"
                role="listitem"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar del paciente */}
                  {cita.paciente.foto ? (
                    <img
                      src={cita.paciente.foto}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-semibold flex-shrink-0">
                      {cita.paciente.nombre.charAt(0)}
                      {cita.paciente.apellido.charAt(0)}
                    </div>
                  )}

                  {/* Información de la cita */}
                  <div className="flex-1 min-w-0">
                    {/* Nombre del paciente */}
                    <p className="font-medium text-gray-900 truncate">
                      {cita.paciente.nombre} {cita.paciente.apellido}
                    </p>

                    {/* Fecha y hora */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <CalendarIcon className="w-4 h-4" aria-hidden="true" />
                      <span>{formatearFechaHora(cita.fecha)}</span>
                    </div>

                    {/* Duración y modalidad */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" aria-hidden="true" />
                        <span>{cita.duracion} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {cita.modalidad === 'VIRTUAL' ? (
                          <>
                            <VideoCameraIcon className="w-4 h-4" aria-hidden="true" />
                            <span>Virtual</span>
                          </>
                        ) : (
                          <>
                            <MapPinIcon className="w-4 h-4" aria-hidden="true" />
                            <span>Presencial</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Estado de la cita */}
                    <div className="mt-2">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          {
                            'bg-esperanza-100 text-esperanza-700':
                              cita.estado === 'CONFIRMADA',
                            'bg-calidez-100 text-calidez-700': cita.estado === 'PENDIENTE',
                            'bg-gray-100 text-gray-700': cita.estado === 'CANCELADA',
                            'bg-calma-100 text-calma-700': cita.estado === 'COMPLETADA',
                            'bg-alerta-100 text-alerta-700': cita.estado === 'NO_ASISTIO',
                          }
                        )}
                      >
                        {cita.estado === 'CONFIRMADA' && 'Confirmada'}
                        {cita.estado === 'PENDIENTE' && 'Pendiente'}
                        {cita.estado === 'CANCELADA' && 'Cancelada'}
                        {cita.estado === 'COMPLETADA' && 'Completada'}
                        {cita.estado === 'NO_ASISTIO' && 'No asistió'}
                      </span>
                    </div>

                    {/* Botón de iniciar sesión (si es el momento) */}
                    {puedIniciar && cita.estado === 'CONFIRMADA' && onIniciarSesion && (
                      <button
                        onClick={() => onIniciarSesion(cita.id)}
                        className="mt-3 w-full sm:w-auto px-4 py-2 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
                      >
                        Iniciar sesión
                      </button>
                    )}
                  </div>

                  {/* Menú de acciones */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500"
                        aria-label="Más opciones"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
                        align="end"
                        sideOffset={5}
                      >
                        {/* Confirmar cita (solo si está pendiente) */}
                        {onConfirmar && cita.estado === 'PENDIENTE' && (
                          <DropdownMenu.Item
                            className="px-3 py-2 text-sm text-esperanza-700 hover:bg-esperanza-50 rounded cursor-pointer focus:outline-none focus:bg-esperanza-50"
                            onSelect={() => onConfirmar(cita.id)}
                          >
                            ✓ Confirmar cita
                          </DropdownMenu.Item>
                        )}

                        {/* Completar cita (solo si está confirmada y ha pasado) */}
                        {onCompletar && cita.estado === 'CONFIRMADA' && (
                          <DropdownMenu.Item
                            className="px-3 py-2 text-sm text-calma-700 hover:bg-calma-50 rounded cursor-pointer focus:outline-none focus:bg-calma-50"
                            onSelect={() => onCompletar(cita.id)}
                          >
                            ✓ Marcar completada
                          </DropdownMenu.Item>
                        )}

                        {/* Marcar no asistió (solo si está confirmada) */}
                        {onMarcarNoAsistio && cita.estado === 'CONFIRMADA' && (
                          <DropdownMenu.Item
                            className="px-3 py-2 text-sm text-alerta-700 hover:bg-alerta-50 rounded cursor-pointer focus:outline-none focus:bg-alerta-50"
                            onSelect={() => onMarcarNoAsistio(cita.id)}
                          >
                            ✗ No asistió
                          </DropdownMenu.Item>
                        )}

                        {/* Agregar notas */}
                        {onAgregarNotas && cita.estado === 'COMPLETADA' && (
                          <DropdownMenu.Item
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer focus:outline-none focus:bg-gray-100"
                            onSelect={() => onAgregarNotas(cita.id)}
                          >
                            📝 Agregar notas
                          </DropdownMenu.Item>
                        )}

                        {/* Separador */}
                        {((onConfirmar && cita.estado === 'PENDIENTE') ||
                          (onCompletar && cita.estado === 'CONFIRMADA') ||
                          (onMarcarNoAsistio && cita.estado === 'CONFIRMADA') ||
                          (onAgregarNotas && cita.estado === 'COMPLETADA')) &&
                          (onReprogramar || onCancelar) &&
                          cita.estado !== 'CANCELADA' && (
                            <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                          )}

                        {/* Reprogramar */}
                        {onReprogramar &&
                          cita.estado !== 'CANCELADA' &&
                          cita.estado !== 'COMPLETADA' && (
                            <DropdownMenu.Item
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer focus:outline-none focus:bg-gray-100"
                              onSelect={() => onReprogramar(cita.id)}
                            >
                              Reprogramar
                            </DropdownMenu.Item>
                          )}

                        {/* Cancelar */}
                        {onCancelar &&
                          cita.estado !== 'CANCELADA' &&
                          cita.estado !== 'COMPLETADA' && (
                            <DropdownMenu.Item
                              className="px-3 py-2 text-sm text-alerta-700 hover:bg-alerta-50 rounded cursor-pointer focus:outline-none focus:bg-alerta-50"
                              onSelect={() => onCancelar(cita.id)}
                            >
                              Cancelar cita
                            </DropdownMenu.Item>
                          )}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-8 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-600">No tienes citas programadas</p>
          <p className="text-sm text-gray-500 mt-1">
            Las próximas citas aparecerán aquí
          </p>
        </div>
      )}

      {/* Link para ver todas */}
      {citas.length > limite && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-sm text-calma-600 hover:text-calma-700 font-medium focus:outline-none focus:ring-2 focus:ring-calma-500 rounded px-2 py-1">
            Ver todas las citas ({citas.length})
          </button>
        </div>
      )}
    </div>
  );
}
