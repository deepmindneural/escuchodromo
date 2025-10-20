'use client';

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

export type EstadoEmocional = 'ESTABLE' | 'ALERTA' | 'CRITICO';

interface IndicadorEmocionalProps {
  /** Estado emocional del paciente */
  estado: EstadoEmocional;
  /** Texto descriptivo adicional */
  descripcion?: string;
  /** Mostrar tooltip informativo */
  mostrarTooltip?: boolean;
  /** Tamaño del indicador */
  tamanio?: 'sm' | 'md' | 'lg';
}

/**
 * IndicadorEmocional - Indicador visual accesible de estado emocional
 *
 * Características de accesibilidad:
 * - NO depende solo de color (usa forma + icono + texto)
 * - Contraste WCAG AA
 * - Tooltip accesible (Radix UI)
 * - Screen reader friendly
 */
export function IndicadorEmocional({
  estado,
  descripcion,
  mostrarTooltip = true,
  tamanio = 'md',
}: IndicadorEmocionalProps) {
  const configuraciones: Record<
    EstadoEmocional,
    {
      color: string;
      bgColor: string;
      borderColor: string;
      icono: React.ComponentType<{ className?: string }>;
      texto: string;
      forma: 'circle' | 'triangle' | 'square';
      explicacion: string;
    }
  > = {
    ESTABLE: {
      color: 'text-esperanza-700',
      bgColor: 'bg-esperanza-100',
      borderColor: 'border-esperanza-600',
      icono: CheckCircleIcon,
      texto: 'Estable',
      forma: 'circle',
      explicacion:
        'El paciente muestra indicadores emocionales dentro del rango esperado. Continúa con el tratamiento actual.',
    },
    ALERTA: {
      color: 'text-calidez-700',
      bgColor: 'bg-calidez-100',
      borderColor: 'border-calidez-600',
      icono: ExclamationTriangleIcon,
      texto: 'Alerta',
      forma: 'triangle',
      explicacion:
        'El paciente presenta cambios que requieren atención. Considera ajustar la frecuencia de sesiones o el plan de tratamiento.',
    },
    CRITICO: {
      color: 'text-alerta-700',
      bgColor: 'bg-alerta-100',
      borderColor: 'border-alerta-600',
      icono: ExclamationCircleIcon,
      texto: 'Crítico',
      forma: 'square',
      explicacion:
        'El paciente presenta indicadores de riesgo elevado. Se recomienda contacto prioritario y evaluación inmediata.',
    },
  };

  const config = configuraciones[estado];
  const Icono = config.icono;

  const tamanios = {
    sm: {
      icono: 'w-3 h-3',
      texto: 'text-xs',
      padding: 'px-2 py-1',
      gap: 'gap-1',
    },
    md: {
      icono: 'w-4 h-4',
      texto: 'text-sm',
      padding: 'px-3 py-1.5',
      gap: 'gap-2',
    },
    lg: {
      icono: 'w-5 h-5',
      texto: 'text-base',
      padding: 'px-4 py-2',
      gap: 'gap-2',
    },
  };

  const tamanioConfig = tamanios[tamanio];

  const indicador = (
    <div
      className={clsx(
        'inline-flex items-center rounded-full font-medium border-2',
        config.color,
        config.bgColor,
        config.borderColor,
        tamanioConfig.padding,
        tamanioConfig.gap
      )}
      role="status"
      aria-label={`Estado emocional: ${config.texto}. ${descripcion || config.explicacion}`}
    >
      {/* Icono */}
      <Icono className={tamanioConfig.icono} aria-hidden="true" />

      {/* Texto */}
      <span className={tamanioConfig.texto}>{config.texto}</span>

      {/* Forma visual adicional (oculta para screen readers) */}
      <div
        className={clsx('w-2 h-2', config.bgColor, {
          'rounded-full': config.forma === 'circle',
          'rotate-45': config.forma === 'square',
          'clip-triangle': config.forma === 'triangle',
        })}
        aria-hidden="true"
      />
    </div>
  );

  // Si no se requiere tooltip, devolver solo el indicador
  if (!mostrarTooltip) {
    return indicador;
  }

  // Con tooltip
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="inline-block cursor-help">{indicador}</div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={clsx(
              'max-w-xs rounded-lg shadow-lg p-3 text-sm z-50',
              'bg-gray-900 text-white',
              'animate-fade-in'
            )}
            sideOffset={5}
          >
            <p className="font-medium mb-1">{config.texto}</p>
            <p className="text-gray-300 text-xs leading-relaxed">
              {descripcion || config.explicacion}
            </p>
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/**
 * Versión compacta solo con icono (para tablas densas)
 */
export function IndicadorEmocionalIcono({
  estado,
  descripcion,
}: {
  estado: EstadoEmocional;
  descripcion?: string;
}) {
  const configuraciones: Record<
    EstadoEmocional,
    {
      color: string;
      icono: React.ComponentType<{ className?: string }>;
      texto: string;
      explicacion: string;
    }
  > = {
    ESTABLE: {
      color: 'text-esperanza-600',
      icono: CheckCircleIcon,
      texto: 'Estable',
      explicacion: 'Indicadores emocionales dentro del rango esperado',
    },
    ALERTA: {
      color: 'text-calidez-600',
      icono: ExclamationTriangleIcon,
      texto: 'Alerta',
      explicacion: 'Cambios que requieren atención',
    },
    CRITICO: {
      color: 'text-alerta-600',
      icono: ExclamationCircleIcon,
      texto: 'Crítico',
      explicacion: 'Indicadores de riesgo elevado',
    },
  };

  const config = configuraciones[estado];
  const Icono = config.icono;

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="inline-block cursor-help">
            <Icono
              className={clsx('w-6 h-6', config.color)}
              aria-label={`${config.texto}: ${descripcion || config.explicacion}`}
            />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-xs rounded-lg shadow-lg p-3 text-sm z-50 bg-gray-900 text-white"
            sideOffset={5}
          >
            <p className="font-medium mb-1">{config.texto}</p>
            <p className="text-gray-300 text-xs">
              {descripcion || config.explicacion}
            </p>
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
