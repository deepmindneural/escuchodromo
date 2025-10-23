'use client';

import React from 'react';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { formatearFechaCorta } from '../utils/fechas';
import clsx from 'clsx';

export interface EvaluacionTabla {
  id: string;
  tipo_evaluacion: 'PHQ-9' | 'GAD-7' | 'Otro';
  puntuacion_total: number;
  nivel_severidad: string;
  fecha_evaluacion: Date;
}

interface TablaEvaluacionesProps {
  evaluaciones: EvaluacionTabla[];
  /** Título opcional */
  titulo?: string;
}

/**
 * Obtiene el rango y color según el tipo de evaluación y puntaje
 */
function obtenerRangoYColor(
  tipo: string,
  puntaje: number
): { rango: string; color: string; bgColor: string } {
  if (tipo === 'PHQ-9') {
    if (puntaje <= 4)
      return { rango: 'Mínima', color: 'text-green-700', bgColor: 'bg-green-50' };
    if (puntaje <= 9)
      return { rango: 'Leve', color: 'text-blue-700', bgColor: 'bg-blue-50' };
    if (puntaje <= 14)
      return { rango: 'Moderada', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    if (puntaje <= 19)
      return {
        rango: 'Moderadamente severa',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
      };
    return { rango: 'Severa', color: 'text-red-700', bgColor: 'bg-red-50' };
  } else if (tipo === 'GAD-7') {
    if (puntaje <= 4)
      return { rango: 'Mínima', color: 'text-green-700', bgColor: 'bg-green-50' };
    if (puntaje <= 9)
      return { rango: 'Leve', color: 'text-blue-700', bgColor: 'bg-blue-50' };
    if (puntaje <= 14)
      return { rango: 'Moderada', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    return { rango: 'Severa', color: 'text-red-700', bgColor: 'bg-red-50' };
  }

  return { rango: 'N/A', color: 'text-gray-700', bgColor: 'bg-gray-50' };
}

/**
 * Calcula la tendencia comparando con la evaluación anterior del mismo tipo
 */
function calcularTendencia(
  evaluaciones: EvaluacionTabla[],
  evaluacionActual: EvaluacionTabla
): 'mejorando' | 'empeorando' | 'estable' | null {
  // Encontrar evaluaciones del mismo tipo anteriores a esta
  const evaluacionesDelMismoTipo = evaluaciones.filter(
    (e) =>
      e.tipo_evaluacion === evaluacionActual.tipo_evaluacion &&
      e.fecha_evaluacion < evaluacionActual.fecha_evaluacion
  );

  if (evaluacionesDelMismoTipo.length === 0) return null;

  // Ordenar por fecha descendente y tomar la más reciente
  evaluacionesDelMismoTipo.sort(
    (a, b) => b.fecha_evaluacion.getTime() - a.fecha_evaluacion.getTime()
  );

  const evaluacionAnterior = evaluacionesDelMismoTipo[0];
  const diff = evaluacionActual.puntuacion_total - evaluacionAnterior.puntuacion_total;

  if (diff < -2) return 'mejorando'; // Puntaje bajó (mejor)
  if (diff > 2) return 'empeorando'; // Puntaje subió (peor)
  return 'estable';
}

/**
 * Componente TablaEvaluaciones
 *
 * Muestra el historial de evaluaciones psicológicas (PHQ-9, GAD-7)
 * de un paciente en formato tabla con colores según severidad.
 */
export function TablaEvaluaciones({
  evaluaciones,
  titulo = 'Historial de Evaluaciones',
}: TablaEvaluacionesProps) {
  if (evaluaciones.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{titulo}</h3>
          <p className="text-gray-600">No hay evaluaciones registradas aún</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          {titulo}
        </h3>
      </div>

      {/* Tabla para desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evaluación
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puntaje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nivel
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tendencia
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {evaluaciones.map((evaluacion) => {
              const { rango, color, bgColor } = obtenerRangoYColor(
                evaluacion.tipo_evaluacion,
                evaluacion.puntuacion_total
              );
              const tendencia = calcularTendencia(evaluaciones, evaluacion);

              return (
                <tr
                  key={evaluacion.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFechaCorta(evaluacion.fecha_evaluacion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {evaluacion.tipo_evaluacion}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {evaluacion.puntuacion_total}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        color,
                        bgColor
                      )}
                    >
                      {rango}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {tendencia === 'mejorando' && (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <TrendingDown className="h-5 w-5" />
                        <span className="text-sm font-medium">Mejorando</span>
                      </div>
                    )}
                    {tendencia === 'empeorando' && (
                      <div className="flex items-center justify-center gap-1 text-red-600">
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-sm font-medium">Empeorando</span>
                      </div>
                    )}
                    {tendencia === 'estable' && (
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <Minus className="h-5 w-5" />
                        <span className="text-sm font-medium">Estable</span>
                      </div>
                    )}
                    {tendencia === null && (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista móvil (tarjetas) */}
      <div className="md:hidden divide-y divide-gray-200">
        {evaluaciones.map((evaluacion) => {
          const { rango, color, bgColor } = obtenerRangoYColor(
            evaluacion.tipo_evaluacion,
            evaluacion.puntuacion_total
          );
          const tendencia = calcularTendencia(evaluaciones, evaluacion);

          return (
            <div key={evaluacion.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {evaluacion.tipo_evaluacion}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatearFechaCorta(evaluacion.fecha_evaluacion)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {evaluacion.puntuacion_total}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    color,
                    bgColor
                  )}
                >
                  {rango}
                </span>

                {tendencia === 'mejorando' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-medium">Mejorando</span>
                  </div>
                )}
                {tendencia === 'empeorando' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Empeorando</span>
                  </div>
                )}
                {tendencia === 'estable' && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Minus className="h-4 w-4" />
                    <span className="text-xs font-medium">Estable</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer con leyenda */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>PHQ-9: Depresión</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span>GAD-7: Ansiedad</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span>Mejorando (puntaje bajó &gt;2)</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <span>Empeorando (puntaje subió &gt;2)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
