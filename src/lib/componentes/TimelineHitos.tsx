'use client';

import React from 'react';
import {
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { formatearFechaHora } from '../utils/fechas';

export type TipoHito = 'evaluacion' | 'sesion' | 'cambio_tratamiento';

export interface Hito {
  id: string;
  tipo: TipoHito;
  fecha: Date;
  titulo: string;
  descripcion?: string;
}

interface TimelineHitosProps {
  /** Array de hitos cronológicos */
  hitos: Hito[];
  /** Título de la sección */
  titulo?: string;
}

/**
 * TimelineHitos - Línea de tiempo de eventos importantes
 *
 * Características de accesibilidad:
 * - Lista ordenada semántica
 * - Iconos descriptivos por tipo
 * - Alternancia visual (izquierda/derecha en desktop)
 * - Touch targets adecuados
 */
export function TimelineHitos({
  hitos,
  titulo = 'Historial de eventos',
}: TimelineHitosProps) {
  const configuracionesHito: Record<
    TipoHito,
    {
      icono: React.ComponentType<{ className?: string }>;
      color: string;
      bgColor: string;
      etiqueta: string;
    }
  > = {
    evaluacion: {
      icono: ClipboardDocumentCheckIcon,
      color: 'text-calma-700',
      bgColor: 'bg-calma-100',
      etiqueta: 'Evaluación',
    },
    sesion: {
      icono: ChatBubbleLeftRightIcon,
      color: 'text-esperanza-700',
      bgColor: 'bg-esperanza-100',
      etiqueta: 'Sesión',
    },
    cambio_tratamiento: {
      icono: SparklesIcon,
      color: 'text-serenidad-700',
      bgColor: 'bg-serenidad-100',
      etiqueta: 'Cambio de tratamiento',
    },
  };

  if (hitos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No hay eventos registrados aún</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{titulo}</h3>

      {/* Timeline */}
      <ol className="relative border-l-2 border-gray-200 ml-3 space-y-8" role="list">
        {hitos.map((hito, index) => {
          const config = configuracionesHito[hito.tipo];
          const Icono = config.icono;
          const esUltimo = index === hitos.length - 1;

          return (
            <li key={hito.id} className="ml-6 relative" role="listitem">
              {/* Punto en la línea */}
              <div
                className={clsx(
                  'absolute -left-9 flex items-center justify-center w-6 h-6 rounded-full border-4 border-white',
                  config.bgColor
                )}
                aria-hidden="true"
              >
                <div className={clsx('w-2 h-2 rounded-full', config.color.replace('text-', 'bg-'))} />
              </div>

              {/* Contenido del hito */}
              <div
                className={clsx(
                  'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                  esUltimo ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'
                )}
              >
                {/* Header del card */}
                <div className="flex items-start gap-3 mb-2">
                  {/* Icono */}
                  <div
                    className={clsx(
                      'flex-shrink-0 p-2 rounded-lg',
                      config.bgColor,
                      config.color
                    )}
                  >
                    <Icono className="w-5 h-5" aria-hidden="true" />
                  </div>

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    {/* Etiqueta de tipo */}
                    <span
                      className={clsx(
                        'inline-block text-xs font-medium px-2 py-1 rounded-full mb-2',
                        config.bgColor,
                        config.color
                      )}
                    >
                      {config.etiqueta}
                    </span>

                    {/* Fecha */}
                    <p className="text-sm text-gray-600 mb-1">
                      {formatearFechaHora(hito.fecha)}
                    </p>

                    {/* Título */}
                    <h4 className="font-semibold text-gray-900">{hito.titulo}</h4>

                    {/* Descripción */}
                    {hito.descripcion && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {hito.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
