'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  Circle,
  Ban,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatearFechaCorta } from '../utils/fechas';
import clsx from 'clsx';

export interface SesionTimeline {
  id: string;
  fecha_hora: Date;
  duracion: number;
  modalidad: 'virtual' | 'presencial';
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  motivo_consulta?: string | null;
  notas_profesional?: string | null;
  notas_paciente?: string | null;
}

interface TimelineSesionesProps {
  sesiones: SesionTimeline[];
  onAgregarNota?: (citaId: string, notas: string) => Promise<void>;
}

const ICONOS_ESTADO = {
  pendiente: Circle,
  confirmada: CheckCircle,
  completada: CheckCircle,
  cancelada: XCircle,
  no_asistio: Ban,
};

const COLORES_ESTADO = {
  pendiente: 'text-gray-400 bg-gray-50',
  confirmada: 'text-blue-500 bg-blue-50',
  completada: 'text-green-500 bg-green-50',
  cancelada: 'text-red-500 bg-red-50',
  no_asistio: 'text-orange-500 bg-orange-50',
};

const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

/**
 * Componente TimelineSesiones
 *
 * Muestra el historial de sesiones de un paciente en formato timeline vertical.
 * Cada sesión muestra fecha, modalidad, estado y notas.
 */
export function TimelineSesiones({ sesiones, onAgregarNota }: TimelineSesionesProps) {
  const [sesionesExpandidas, setSesionesExpandidas] = useState<Set<string>>(new Set());
  const [editandoNota, setEditandoNota] = useState<string | null>(null);
  const [notaTexto, setNotaTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const toggleExpansion = (id: string) => {
    const nuevasExpandidas = new Set(sesionesExpandidas);
    if (nuevasExpandidas.has(id)) {
      nuevasExpandidas.delete(id);
    } else {
      nuevasExpandidas.add(id);
    }
    setSesionesExpandidas(nuevasExpandidas);
  };

  const iniciarEdicionNota = (sesion: SesionTimeline) => {
    setEditandoNota(sesion.id);
    setNotaTexto(sesion.notas_profesional || '');
  };

  const cancelarEdicion = () => {
    setEditandoNota(null);
    setNotaTexto('');
  };

  const guardarNota = async (citaId: string) => {
    if (!onAgregarNota) return;

    setGuardando(true);
    try {
      await onAgregarNota(citaId, notaTexto);
      setEditandoNota(null);
      setNotaTexto('');
    } catch (error) {
      console.error('Error al guardar nota:', error);
    } finally {
      setGuardando(false);
    }
  };

  if (sesiones.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No hay sesiones registradas aún</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea vertical del timeline */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />

      {/* Lista de sesiones */}
      <div className="space-y-6">
        {sesiones.map((sesion, index) => {
          const IconoEstado = ICONOS_ESTADO[sesion.estado];
          const coloresEstado = COLORES_ESTADO[sesion.estado];
          const etiquetaEstado = ETIQUETAS_ESTADO[sesion.estado];
          const estaExpandida = sesionesExpandidas.has(sesion.id);
          const estaEditando = editandoNota === sesion.id;

          return (
            <div key={sesion.id} className="relative pl-16">
              {/* Icono de estado en el timeline */}
              <div
                className={clsx(
                  'absolute left-0 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white',
                  coloresEstado
                )}
              >
                <IconoEstado className="h-6 w-6" />
              </div>

              {/* Tarjeta de sesión */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                {/* Header de la tarjeta */}
                <button
                  onClick={() => toggleExpansion(sesion.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold">
                          {formatearFechaCorta(sesion.fecha_hora)}
                        </span>
                        <span className="text-gray-500">•</span>
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{sesion.duracion} min</span>
                      </div>

                      <span
                        className={clsx(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          coloresEstado
                        )}
                      >
                        {etiquetaEstado}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {sesion.modalidad === 'virtual' ? (
                        <>
                          <Video className="h-4 w-4" />
                          <span>Sesión Virtual</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4" />
                          <span>Sesión Presencial</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {estaExpandida ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Contenido expandible */}
                {estaExpandida && (
                  <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                    {/* Motivo de consulta */}
                    {sesion.motivo_consulta && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Motivo de Consulta
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                          {sesion.motivo_consulta}
                        </p>
                      </div>
                    )}

                    {/* Notas del paciente */}
                    {sesion.notas_paciente && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Notas del Paciente
                        </h4>
                        <p className="text-sm text-gray-600 bg-blue-50 rounded p-3">
                          {sesion.notas_paciente}
                        </p>
                      </div>
                    )}

                    {/* Notas del profesional */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Notas del Profesional
                        </h4>
                        {!estaEditando && onAgregarNota && (
                          <button
                            onClick={() => iniciarEdicionNota(sesion)}
                            className="text-sm text-calma-600 hover:text-calma-700 font-medium flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            {sesion.notas_profesional ? 'Editar' : 'Agregar nota'}
                          </button>
                        )}
                      </div>

                      {estaEditando ? (
                        <div className="space-y-3">
                          <textarea
                            value={notaTexto}
                            onChange={(e) => setNotaTexto(e.target.value)}
                            placeholder="Escribe tus notas sobre esta sesión..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent resize-none text-sm"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={cancelarEdicion}
                              disabled={guardando}
                              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => guardarNota(sesion.id)}
                              disabled={guardando}
                              className="px-4 py-2 text-sm bg-calma-600 text-white rounded-lg hover:bg-calma-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {guardando ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                  Guardando...
                                </>
                              ) : (
                                'Guardar'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : sesion.notas_profesional ? (
                        <p className="text-sm text-gray-600 bg-calma-50 rounded p-3 whitespace-pre-wrap">
                          {sesion.notas_profesional}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No hay notas registradas para esta sesión
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
