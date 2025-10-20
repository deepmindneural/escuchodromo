'use client';

import React from 'react';
import { MiniGrafica } from './MiniGrafica';
import clsx from 'clsx';

export interface Metrica {
  id: string;
  titulo: string;
  valor: number | string;
  cambio?: {
    valor: number;
    porcentaje: number;
    tipo: 'positivo' | 'negativo' | 'neutral';
  };
  icono?: React.ReactNode;
  datosGrafica?: number[];
  tendencia?: 'positiva' | 'negativa' | 'neutral';
  descripcionGrafica?: string;
  colorGrafica?: string;
}

interface GridMetricasProps {
  /** Array de métricas a mostrar */
  metricas: Metrica[];
  /** Número de columnas en desktop */
  columnas?: 2 | 3 | 4;
}

/**
 * GridMetricas - Grid responsive de tarjetas de métricas
 *
 * Características de accesibilidad:
 * - Cards con ARIA labels
 * - Indicadores visuales + texto
 * - Responsive (4 cols desktop, 2 tablet, 1 mobile)
 * - Touch targets adecuados
 */
export function GridMetricas({ metricas, columnas = 4 }: GridMetricasProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={clsx('grid gap-4 md:gap-6', gridCols[columnas])} role="list">
      {metricas.map((metrica) => (
        <div
          key={metrica.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          role="listitem"
          aria-label={`${metrica.titulo}: ${metrica.valor}`}
        >
          {/* Header con icono y título */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">{metrica.titulo}</h3>
            {metrica.icono && (
              <div className="text-calma-600" aria-hidden="true">
                {metrica.icono}
              </div>
            )}
          </div>

          {/* Valor principal */}
          <div className="mb-3">
            <p className="text-3xl font-bold text-gray-900">{metrica.valor}</p>
          </div>

          {/* Indicador de cambio */}
          {metrica.cambio && (
            <div className="flex items-center gap-2 mb-3">
              <div
                className={clsx('flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5', {
                  'bg-esperanza-100 text-esperanza-700': metrica.cambio.tipo === 'positivo',
                  'bg-alerta-100 text-alerta-700': metrica.cambio.tipo === 'negativo',
                  'bg-gray-100 text-gray-700': metrica.cambio.tipo === 'neutral',
                })}
              >
                {/* Icono de flecha */}
                {metrica.cambio.tipo === 'positivo' && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                )}
                {metrica.cambio.tipo === 'negativo' && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                )}
                {metrica.cambio.tipo === 'neutral' && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14"
                    />
                  </svg>
                )}
                <span>
                  {metrica.cambio.porcentaje > 0 ? '+' : ''}
                  {metrica.cambio.porcentaje}%
                </span>
              </div>
              <span className="text-xs text-gray-500">vs. mes anterior</span>
            </div>
          )}

          {/* Mini gráfica */}
          {metrica.datosGrafica && metrica.datosGrafica.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <MiniGrafica
                datos={metrica.datosGrafica}
                descripcion={
                  metrica.descripcionGrafica ||
                  `Tendencia de ${metrica.titulo} en las últimas 4 semanas`
                }
                tendencia={metrica.tendencia}
                color={metrica.colorGrafica}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
