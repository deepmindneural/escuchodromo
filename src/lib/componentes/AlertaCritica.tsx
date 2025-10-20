'use client';

import React from 'react';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

export type TipoAlerta = 'info' | 'advertencia' | 'critico';

interface AlertaCriticaProps {
  /** Tipo de alerta */
  tipo: TipoAlerta;
  /** Mensaje principal de la alerta */
  mensaje: string;
  /** Descripción adicional (opcional) */
  descripcion?: string;
  /** Acción opcional */
  accion?: {
    texto: string;
    onClick: () => void;
  };
  /** Mostrar botón de cerrar */
  onCerrar?: () => void;
}

/**
 * AlertaCritica - Alerta accesible para información importante
 *
 * Características de accesibilidad:
 * - No depende solo de color (icono + borde + texto)
 * - Iconos descriptivos distintos por nivel
 * - role="alert" para contenido crítico
 * - Contraste WCAG AA
 */
export function AlertaCritica({
  tipo,
  mensaje,
  descripcion,
  accion,
  onCerrar,
}: AlertaCriticaProps) {
  const configuraciones = {
    info: {
      icono: InformationCircleIcon,
      colorTexto: 'text-calma-900',
      colorFondo: 'bg-calma-50',
      colorBorde: 'border-calma-300',
      colorIcono: 'text-calma-600',
      colorBoton: 'bg-calma-600 hover:bg-calma-700 text-white',
      ariaLabel: 'Información',
    },
    advertencia: {
      icono: ExclamationTriangleIcon,
      colorTexto: 'text-calidez-900',
      colorFondo: 'bg-calidez-50',
      colorBorde: 'border-calidez-400',
      colorIcono: 'text-calidez-600',
      colorBoton: 'bg-calidez-600 hover:bg-calidez-700 text-white',
      ariaLabel: 'Advertencia',
    },
    critico: {
      icono: ExclamationCircleIcon,
      colorTexto: 'text-alerta-900',
      colorFondo: 'bg-alerta-50',
      colorBorde: 'border-alerta-500',
      colorIcono: 'text-alerta-600',
      colorBoton: 'bg-alerta-600 hover:bg-alerta-700 text-white',
      ariaLabel: 'Crítico',
    },
  };

  const config = configuraciones[tipo];
  const Icono = config.icono;

  return (
    <div
      className={clsx(
        'rounded-lg border-2 p-4',
        config.colorFondo,
        config.colorBorde,
        config.colorTexto
      )}
      role={tipo === 'critico' ? 'alert' : 'status'}
      aria-live={tipo === 'critico' ? 'assertive' : 'polite'}
      aria-label={config.ariaLabel}
    >
      <div className="flex gap-3">
        {/* Icono */}
        <div className="flex-shrink-0">
          <Icono className={clsx('w-6 h-6', config.colorIcono)} aria-hidden="true" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Mensaje principal */}
          <h4 className="font-semibold mb-1">{mensaje}</h4>

          {/* Descripción adicional */}
          {descripcion && (
            <p className="text-sm opacity-90 leading-relaxed">{descripcion}</p>
          )}

          {/* Acción */}
          {accion && (
            <button
              onClick={accion.onClick}
              className={clsx(
                'mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                config.colorBoton,
                tipo === 'info' && 'focus:ring-calma-500',
                tipo === 'advertencia' && 'focus:ring-calidez-500',
                tipo === 'critico' && 'focus:ring-alerta-500'
              )}
            >
              {accion.texto}
            </button>
          )}
        </div>

        {/* Botón de cerrar (opcional) */}
        {onCerrar && (
          <button
            onClick={onCerrar}
            className={clsx(
              'flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              config.colorIcono,
              tipo === 'info' && 'focus:ring-calma-500',
              tipo === 'advertencia' && 'focus:ring-calidez-500',
              tipo === 'critico' && 'focus:ring-alerta-500'
            )}
            aria-label="Cerrar alerta"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Lista de alertas apiladas
 */
interface ListaAlertasProps {
  alertas: Array<{
    id: string;
    tipo: TipoAlerta;
    mensaje: string;
    descripcion?: string;
    fecha?: Date;
  }>;
}

export function ListaAlertas({ alertas }: ListaAlertasProps) {
  if (alertas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" role="region" aria-label="Alertas del paciente">
      {alertas.map((alerta) => (
        <AlertaCritica
          key={alerta.id}
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          descripcion={alerta.descripcion}
        />
      ))}
    </div>
  );
}
