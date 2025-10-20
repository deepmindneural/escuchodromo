'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MiniGraficaProps {
  /** Datos para la sparkline (últimas 4 semanas) */
  datos: number[];
  /** Color de la línea */
  color?: string;
  /** Texto alternativo para accesibilidad */
  descripcion: string;
  /** Tendencia: positiva, negativa, neutral */
  tendencia?: 'positiva' | 'negativa' | 'neutral';
}

/**
 * MiniGrafica - Sparkline minimalista para dashboards
 *
 * Características de accesibilidad:
 * - Texto alternativo descriptivo
 * - No esencial para comprensión (complementa métricas)
 * - Indicador de tendencia adicional
 */
export function MiniGrafica({
  datos,
  color = '#0EA5E9', // calma-500
  descripcion,
  tendencia,
}: MiniGraficaProps) {
  // Transformar datos para recharts
  const datosFormateados = datos.map((valor, index) => ({
    index,
    valor,
  }));

  // Calcular tendencia si no se proporciona
  const calcularTendencia = (): 'positiva' | 'negativa' | 'neutral' => {
    if (tendencia) return tendencia;

    if (datos.length < 2) return 'neutral';

    const primerValor = datos[0];
    const ultimoValor = datos[datos.length - 1];
    const diferencia = ultimoValor - primerValor;
    const porcentajeCambio = (diferencia / primerValor) * 100;

    if (Math.abs(porcentajeCambio) < 5) return 'neutral';
    return porcentajeCambio > 0 ? 'positiva' : 'negativa';
  };

  const tendenciaCalculada = calcularTendencia();

  const iconosTendencia = {
    positiva: (
      <svg
        className="w-4 h-4 text-esperanza-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
    negativa: (
      <svg
        className="w-4 h-4 text-alerta-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      </svg>
    ),
    neutral: (
      <svg
        className="w-4 h-4 text-gray-400"
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
    ),
  };

  const textosTendencia = {
    positiva: 'Tendencia al alza',
    negativa: 'Tendencia a la baja',
    neutral: 'Tendencia estable',
  };

  return (
    <div className="flex items-center gap-2">
      {/* Gráfica */}
      <div className="flex-1 h-8" role="img" aria-label={descripcion}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datosFormateados}>
            <Line
              type="monotone"
              dataKey="valor"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Indicador de tendencia */}
      <div
        title={textosTendencia[tendenciaCalculada]}
        aria-label={textosTendencia[tendenciaCalculada]}
      >
        {iconosTendencia[tendenciaCalculada]}
      </div>

      {/* Texto descriptivo oculto para screen readers */}
      <span className="sr-only">{descripcion}</span>
    </div>
  );
}
