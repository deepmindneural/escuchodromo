'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';
import clsx from 'clsx';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

export interface DatosComparativos {
  periodo: string;
  phq9: number;
  gad7: number;
}

interface VistaComparativaProps {
  /** Datos semanales */
  datosSemanales: DatosComparativos[];
  /** Datos mensuales */
  datosMensuales: DatosComparativos[];
  /** Título */
  titulo?: string;
  /** Descripción */
  descripcion?: string;
}

/**
 * VistaComparativa - Gráficas comparativas con toggle semanal/mensual
 *
 * Características de accesibilidad:
 * - Tabs accesibles (Radix UI)
 * - Leyenda clara
 * - Contraste WCAG AA
 * - Tooltips descriptivos
 */
export function VistaComparativa({
  datosSemanales,
  datosMensuales,
  titulo = 'Comparativa de indicadores',
  descripcion,
}: VistaComparativaProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [vistaActiva, setVistaActiva] = useState<'semanal' | 'mensual'>('semanal');

  const datosActuales = vistaActiva === 'semanal' ? datosSemanales : datosMensuales;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.fill }}
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
        {descripcion && <p className="text-sm text-gray-600 mt-1">{descripcion}</p>}
      </div>

      {/* Tabs */}
      <Tabs.Root
        value={vistaActiva}
        onValueChange={(valor) => setVistaActiva(valor as 'semanal' | 'mensual')}
      >
        {/* Lista de tabs */}
        <Tabs.List
          className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6"
          aria-label="Seleccionar vista temporal"
        >
          <Tabs.Trigger
            value="semanal"
            className={clsx(
              'flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-calma-500',
              vistaActiva === 'semanal'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Semanal
          </Tabs.Trigger>
          <Tabs.Trigger
            value="mensual"
            className={clsx(
              'flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-calma-500',
              vistaActiva === 'mensual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Mensual
          </Tabs.Trigger>
        </Tabs.List>

        {/* Contenido de tabs */}
        <Tabs.Content value="semanal" className="focus:outline-none">
          <GraficaBarras datos={datosActuales} prefersReducedMotion={prefersReducedMotion} />
        </Tabs.Content>

        <Tabs.Content value="mensual" className="focus:outline-none">
          <GraficaBarras datos={datosActuales} prefersReducedMotion={prefersReducedMotion} />
        </Tabs.Content>
      </Tabs.Root>

      {/* Nota interpretativa */}
      <div className="mt-6 p-4 bg-calma-50 rounded-lg" role="note">
        <p className="text-sm text-calma-900">
          <strong>Interpretación:</strong> Los valores más bajos indican mejor estado emocional.
          Una disminución en las puntuaciones sugiere progreso positivo en el tratamiento.
        </p>
      </div>
    </div>
  );
}

// Componente interno para la gráfica de barras
function GraficaBarras({
  datos,
  prefersReducedMotion,
}: {
  datos: DatosComparativos[];
  prefersReducedMotion: boolean;
}) {
  return (
    <div role="img" aria-label="Gráfica comparativa de indicadores clínicos">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={datos}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="periodo"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 27]}
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{
              value: 'Puntuación',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6B7280', fontSize: '12px' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />
          <Bar
            dataKey="phq9"
            fill="#0EA5E9"
            name="PHQ-9 (Depresión)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!prefersReducedMotion}
          />
          <Bar
            dataKey="gad7"
            fill="#A855F7"
            name="GAD-7 (Ansiedad)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!prefersReducedMotion}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Tabla de datos alternativa (oculta visualmente, accesible) */}
      <table className="sr-only" role="table">
        <caption>Datos comparativos de indicadores clínicos</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            <th scope="col">PHQ-9</th>
            <th scope="col">GAD-7</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((dato, index) => (
            <tr key={index}>
              <td>{dato.periodo}</td>
              <td>{dato.phq9}</td>
              <td>{dato.gad7}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
