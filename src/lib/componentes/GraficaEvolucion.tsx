'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { formatearFechaCorta } from '../utils/fechas';
import clsx from 'clsx';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

export interface PuntoEvolucion {
  fecha: Date;
  phq9?: number;
  gad7?: number;
}

interface GraficaEvolucionProps {
  /** Datos de evolución */
  datos: PuntoEvolucion[];
  /** Título de la gráfica */
  titulo?: string;
  /** Descripción para accesibilidad */
  descripcion: string;
  /** Altura de la gráfica */
  altura?: number;
}

/**
 * GraficaEvolucion - Gráfica de líneas accesible para progreso de paciente
 *
 * Características de accesibilidad:
 * - Tabla de datos alternativa (oculta visualmente)
 * - Rangos de severidad coloreados
 * - Tooltips descriptivos
 * - Contraste WCAG AA
 * - Respeta prefers-reduced-motion
 */
export function GraficaEvolucion({
  datos,
  titulo = 'Evolución de indicadores clínicos',
  descripcion,
  altura = 400,
}: GraficaEvolucionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mostrarTabla, setMostrarTabla] = useState(false);

  // Transformar datos para recharts
  const datosFormateados = datos.map((punto) => ({
    fecha: formatearFechaCorta(punto.fecha),
    fechaCompleta: punto.fecha.toISOString(),
    PHQ9: punto.phq9,
    GAD7: punto.gad7,
  }));

  // Rangos de severidad para PHQ-9 y GAD-7
  const rangosSeveridad = {
    phq9: [
      { nivel: 'Mínimo', min: 0, max: 4, color: '#DCFCE7' },
      { nivel: 'Leve', min: 5, max: 9, color: '#FEF3C7' },
      { nivel: 'Moderado', min: 10, max: 14, color: '#FED7AA' },
      { nivel: 'Moderadamente severo', min: 15, max: 19, color: '#FEE2E2' },
      { nivel: 'Severo', min: 20, max: 27, color: '#FECACA' },
    ],
    gad7: [
      { nivel: 'Mínimo', min: 0, max: 4, color: '#DCFCE7' },
      { nivel: 'Leve', min: 5, max: 9, color: '#FEF3C7' },
      { nivel: 'Moderado', min: 10, max: 14, color: '#FED7AA' },
      { nivel: 'Severo', min: 15, max: 21, color: '#FEE2E2' },
    ],
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.fecha}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-gray-700">
                {entry.name}: <strong>{entry.value}</strong>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
          <p className="text-sm text-gray-600 mt-1">{descripcion}</p>
        </div>

        {/* Toggle para mostrar tabla de datos */}
        <button
          onClick={() => setMostrarTabla(!mostrarTabla)}
          className="px-3 py-2 text-sm text-calma-600 hover:text-calma-700 hover:bg-calma-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500"
          aria-expanded={mostrarTabla}
          aria-controls="tabla-datos"
        >
          {mostrarTabla ? 'Ver gráfica' : 'Ver datos'}
        </button>
      </div>

      {/* Gráfica */}
      {!mostrarTabla && (
        <div aria-label={descripcion} role="img">
          <ResponsiveContainer width="100%" height={altura}>
            <LineChart
              data={datosFormateados}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {/* Grid de fondo */}
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

              {/* Rangos de severidad (áreas coloreadas de fondo) */}
              {rangosSeveridad.phq9.map((rango, index) => (
                <ReferenceArea
                  key={`rango-${index}`}
                  y1={rango.min}
                  y2={rango.max}
                  fill={rango.color}
                  fillOpacity={0.1}
                  aria-label={`Rango ${rango.nivel}: ${rango.min} a ${rango.max}`}
                />
              ))}

              {/* Ejes */}
              <XAxis
                dataKey="fecha"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                aria-label="Fechas de evaluación"
              />
              <YAxis
                domain={[0, 27]}
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                aria-label="Puntuación"
              />

              {/* Tooltip */}
              <Tooltip content={<CustomTooltip />} />

              {/* Leyenda */}
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={(value) => (
                  <span className="text-sm text-gray-700">{value}</span>
                )}
              />

              {/* Líneas de datos */}
              <Line
                type="monotone"
                dataKey="PHQ9"
                stroke="#0EA5E9"
                strokeWidth={3}
                dot={{ fill: '#0EA5E9', r: 5 }}
                activeDot={{ r: 7 }}
                name="PHQ-9 (Depresión)"
                isAnimationActive={!prefersReducedMotion}
              />
              <Line
                type="monotone"
                dataKey="GAD7"
                stroke="#A855F7"
                strokeWidth={3}
                dot={{ fill: '#A855F7', r: 5 }}
                activeDot={{ r: 7 }}
                name="GAD-7 (Ansiedad)"
                isAnimationActive={!prefersReducedMotion}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Leyenda de rangos */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Rangos de severidad
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {rangosSeveridad.phq9.map((rango, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: rango.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-gray-700">{rango.nivel}</p>
                    <p className="text-gray-500">
                      {rango.min}-{rango.max}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de datos alternativa (accesible) */}
      {mostrarTabla && (
        <div id="tabla-datos" className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <caption className="sr-only">{descripcion}</caption>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700" scope="col">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700" scope="col">
                  PHQ-9 (Depresión)
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700" scope="col">
                  GAD-7 (Ansiedad)
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700" scope="col">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {datosFormateados.map((punto, index) => {
                const anterior = index > 0 ? datosFormateados[index - 1] : null;
                const tendenciaPHQ9 = anterior
                  ? (punto.PHQ9 || 0) - (anterior.PHQ9 || 0)
                  : 0;
                const tendenciaGAD7 = anterior
                  ? (punto.GAD7 || 0) - (anterior.GAD7 || 0)
                  : 0;

                return (
                  <tr key={punto.fechaCompleta} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {punto.fecha}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {punto.PHQ9 !== undefined ? punto.PHQ9 : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {punto.GAD7 !== undefined ? punto.GAD7 : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {index > 0 && (
                        <div className="flex flex-col gap-1 text-xs">
                          {tendenciaPHQ9 !== 0 && (
                            <span
                              className={clsx(
                                'flex items-center gap-1',
                                tendenciaPHQ9 < 0
                                  ? 'text-esperanza-700'
                                  : 'text-alerta-700'
                              )}
                            >
                              {tendenciaPHQ9 < 0 ? '↓' : '↑'}
                              PHQ-9: {Math.abs(tendenciaPHQ9)}
                            </span>
                          )}
                          {tendenciaGAD7 !== 0 && (
                            <span
                              className={clsx(
                                'flex items-center gap-1',
                                tendenciaGAD7 < 0
                                  ? 'text-esperanza-700'
                                  : 'text-alerta-700'
                              )}
                            >
                              {tendenciaGAD7 < 0 ? '↓' : '↑'}
                              GAD-7: {Math.abs(tendenciaGAD7)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
