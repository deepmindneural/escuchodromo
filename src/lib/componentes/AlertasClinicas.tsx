'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

interface AlertasClinicasProps {
  phq9: number | null;
  gad7: number | null;
  fechaUltimaEvaluacion: string | null;
  tendencias: {
    phq9: 'mejorando' | 'empeorando' | 'estable' | null;
    gad7: 'mejorando' | 'empeorando' | 'estable' | null;
  };
}

interface Alerta {
  tipo: 'critico' | 'advertencia' | 'informacion' | 'positivo';
  titulo: string;
  mensaje: string;
  icono: React.ComponentType<{ className?: string }>;
}

/**
 * AlertasClinicas - Muestra alertas y notificaciones sobre el estado clínico del paciente
 *
 * Características:
 * - Alertas críticas para puntuaciones altas (PHQ-9 ≥ 15, GAD-7 ≥ 15)
 * - Advertencias para tendencias de empeoramiento
 * - Recordatorios para evaluaciones pendientes
 * - Mensajes positivos cuando todo está bien
 * - Totalmente accesible con ARIA
 */
export function AlertasClinicas({
  phq9,
  gad7,
  fechaUltimaEvaluacion,
  tendencias,
}: AlertasClinicasProps) {
  const alertas: Alerta[] = [];

  // Alerta crítica: Depresión moderadamente severa o severa
  if (phq9 !== null && phq9 >= 15) {
    alertas.push({
      tipo: 'critico',
      titulo: 'Depresión moderadamente severa o severa',
      mensaje: `Puntuación PHQ-9: ${phq9}/27. Se recomienda evaluación urgente y considerar ajuste de tratamiento.`,
      icono: AlertTriangle,
    });
  }

  // Alerta crítica: Ansiedad severa
  if (gad7 !== null && gad7 >= 15) {
    alertas.push({
      tipo: 'critico',
      titulo: 'Ansiedad severa',
      mensaje: `Puntuación GAD-7: ${gad7}/21. Se recomienda evaluación urgente y considerar intervención intensiva.`,
      icono: AlertTriangle,
    });
  }

  // Advertencia: Tendencia de empeoramiento
  if (tendencias.phq9 === 'empeorando' || tendencias.gad7 === 'empeorando') {
    const indicador = tendencias.phq9 === 'empeorando' ? 'síntomas depresivos' : 'síntomas de ansiedad';
    alertas.push({
      tipo: 'advertencia',
      titulo: 'Tendencia de empeoramiento',
      mensaje: `Se observa un aumento sostenido en ${indicador}. Considerar revisión del plan de tratamiento.`,
      icono: TrendingUp,
    });
  }

  // Información: Evaluación pendiente
  if (fechaUltimaEvaluacion) {
    const diasDesdeUltima = Math.floor(
      (Date.now() - new Date(fechaUltimaEvaluacion).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasDesdeUltima > 30) {
      alertas.push({
        tipo: 'informacion',
        titulo: 'Evaluación pendiente',
        mensaje: `Han pasado ${diasDesdeUltima} días desde la última evaluación. Se recomienda solicitar nueva evaluación para monitoreo continuo.`,
        icono: Clock,
      });
    }
  }

  // Mensaje positivo si todo está bien
  if (alertas.length === 0 && phq9 !== null && gad7 !== null) {
    alertas.push({
      tipo: 'positivo',
      titulo: 'Progreso favorable',
      mensaje: 'Los indicadores clínicos se encuentran en rangos controlados. Continuar con el plan de tratamiento actual.',
      icono: CheckCircle,
    });
  }

  if (alertas.length === 0) return null;

  return (
    <section
      role="region"
      aria-label="Alertas y notificaciones clínicas"
      className="space-y-3"
    >
      {alertas.map((alerta, index) => {
        const Icono = alerta.icono;

        // Configuración de colores según tipo de alerta
        const colores = {
          critico: 'bg-red-50 border-red-300 text-red-900',
          advertencia: 'bg-orange-50 border-orange-300 text-orange-900',
          informacion: 'bg-blue-50 border-blue-300 text-blue-900',
          positivo: 'bg-green-50 border-green-300 text-green-900',
        };

        const iconoColores = {
          critico: 'text-red-600',
          advertencia: 'text-orange-600',
          informacion: 'text-blue-600',
          positivo: 'text-green-600',
        };

        return (
          <div
            key={index}
            className={clsx(
              'flex items-start gap-4 p-4 rounded-lg border-2',
              colores[alerta.tipo]
            )}
            role="alert"
            aria-live={alerta.tipo === 'critico' ? 'assertive' : 'polite'}
          >
            <Icono
              className={clsx('w-6 h-6 flex-shrink-0 mt-0.5', iconoColores[alerta.tipo])}
              aria-hidden="true"
            />
            <div className="flex-1">
              <h4 className="font-semibold mb-1">{alerta.titulo}</h4>
              <p className="text-sm">{alerta.mensaje}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
