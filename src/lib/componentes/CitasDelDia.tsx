'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  UserIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon as PendingIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import type { CitaDelDia } from '@/lib/supabase/queries/profesional';

interface CitasDelDiaProps {
  citas: CitaDelDia[];
  cargando?: boolean;
  onIniciarSesion?: (citaId: string) => void;
  onVerPaciente?: (pacienteId: string) => void;
  onCancelar?: (citaId: string) => void;
}

/**
 * CitasDelDia - Muestra las citas del día actual del profesional
 *
 * Características:
 * - Indicadores de urgencia por tiempo (crítico, próximo, programado)
 * - Estado de pago (pagada, pendiente, sin pago)
 * - Modalidad visual (virtual/presencial)
 * - Acciones rápidas por cita
 * - Diseño accesible con ARIA
 */
export function CitasDelDia({
  citas,
  cargando = false,
  onIniciarSesion,
  onVerPaciente,
  onCancelar,
}: CitasDelDiaProps) {
  const formatearHora = (fecha: Date) => {
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearMinutos = (minutos: number) => {
    if (minutos < 0) return 'En curso';
    if (minutos === 0) return 'Ahora';
    if (minutos < 60) return `En ${minutos}min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `En ${horas}h ${mins}min` : `En ${horas}h`;
  };

  const obtenerColorUrgencia = (urgencia: CitaDelDia['urgencia']) => {
    switch (urgencia) {
      case 'critico':
        return {
          bg: 'bg-red-50 border-red-300',
          badge: 'bg-red-600 text-white',
          text: 'text-red-900',
          icon: 'text-red-600',
        };
      case 'proximo':
        return {
          bg: 'bg-orange-50 border-orange-300',
          badge: 'bg-orange-600 text-white',
          text: 'text-orange-900',
          icon: 'text-orange-600',
        };
      case 'programado':
        return {
          bg: 'bg-green-50 border-green-300',
          badge: 'bg-green-600 text-white',
          text: 'text-green-900',
          icon: 'text-green-600',
        };
    }
  };

  const obtenerIconoEstadoPago = (estado: CitaDelDia['pago']) => {
    if (!estado) {
      return <XCircleIcon className="w-4 h-4 text-gray-400" aria-label="Sin pago" />;
    }

    switch (estado.estado) {
      case 'completado':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" aria-label="Pagada" />;
      case 'pendiente':
      case 'procesando':
        return <PendingIcon className="w-4 h-4 text-orange-600" aria-label="Pago pendiente" />;
      case 'fallido':
      case 'cancelado':
        return <XCircleIcon className="w-4 h-4 text-red-600" aria-label="Pago fallido" />;
      default:
        return <PendingIcon className="w-4 h-4 text-gray-400" aria-label="Estado desconocido" />;
    }
  };

  const formatearMoneda = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
    }).format(monto);
  };

  if (cargando) {
    return (
      <div
        className="bg-white rounded-2xl shadow-lg border border-calma-200 p-6"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-calma-500 to-esperanza-500 rounded-xl flex items-center justify-center">
            <CalendarDaysIcon className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Citas de Hoy</h2>
            <p className="text-sm text-gray-600">Cargando...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (citas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-esperanza-50 to-calma-50 rounded-2xl shadow-lg border-2 border-esperanza-200 p-8"
        role="region"
        aria-label="Citas del día"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-esperanza-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDaysIcon className="w-9 h-9 text-esperanza-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sin citas programadas hoy</h2>
          <p className="text-gray-600">
            Disfruta de tu día libre o utiliza este tiempo para planificar futuras sesiones.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-calma-200 overflow-hidden"
      role="region"
      aria-label="Citas del día de hoy"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-calma-600 via-calma-500 to-esperanza-500 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Citas de Hoy</h2>
              <p className="text-white/90 text-sm">
                {citas.length} {citas.length === 1 ? 'cita programada' : 'citas programadas'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Hoy</p>
            <p className="text-white font-semibold">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="p-6 space-y-4">
        {citas.map((cita, index) => {
          const colores = obtenerColorUrgencia(cita.urgencia);

          return (
            <motion.article
              key={cita.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={clsx(
                'border-2 rounded-xl p-4 transition-all hover:shadow-md',
                colores.bg
              )}
              aria-label={`Cita con ${cita.paciente.nombre} ${cita.paciente.apellido || ''} a las ${formatearHora(cita.fecha_hora)}`}
            >
              {/* Header de la cita */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {/* Avatar del paciente */}
                  {cita.paciente.foto_perfil ? (
                    <img
                      src={cita.paciente.foto_perfil}
                      alt={`Foto de ${cita.paciente.nombre}`}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center ring-2 ring-white">
                      <UserIcon className="w-6 h-6 text-gray-500" aria-hidden="true" />
                    </div>
                  )}

                  {/* Información del paciente y cita */}
                  <div className="flex-1 min-w-0">
                    <h3 className={clsx('font-semibold text-base truncate', colores.text)}>
                      {cita.paciente.nombre} {cita.paciente.apellido || ''}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Hora */}
                      <div className="flex items-center gap-1 text-sm">
                        <ClockIcon className={clsx('w-4 h-4', colores.icon)} aria-hidden="true" />
                        <span className={colores.text}>{formatearHora(cita.fecha_hora)}</span>
                      </div>

                      {/* Modalidad */}
                      <div className="flex items-center gap-1 text-sm">
                        {cita.modalidad === 'virtual' ? (
                          <>
                            <VideoCameraIcon className={clsx('w-4 h-4', colores.icon)} aria-hidden="true" />
                            <span className={colores.text}>Virtual</span>
                          </>
                        ) : (
                          <>
                            <BuildingOfficeIcon className={clsx('w-4 h-4', colores.icon)} aria-hidden="true" />
                            <span className={colores.text}>Presencial</span>
                          </>
                        )}
                      </div>

                      {/* Duración */}
                      <span className={clsx('text-sm', colores.text)}>({cita.duracion} min)</span>
                    </div>
                  </div>
                </div>

                {/* Badge de urgencia */}
                <span
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                    colores.badge
                  )}
                  aria-label={`Urgencia: ${cita.urgencia}`}
                >
                  {formatearMinutos(cita.minutos_hasta_cita)}
                </span>
              </div>

              {/* Estado de pago */}
              <div className="flex items-center gap-2 mb-3 px-1">
                {obtenerIconoEstadoPago(cita.pago)}
                <span className="text-sm text-gray-700">
                  {cita.pago
                    ? cita.pago.estado === 'completado'
                      ? `Pagada: ${formatearMoneda(cita.pago.monto, cita.pago.moneda)}`
                      : `Pago pendiente: ${formatearMoneda(cita.pago.monto, cita.pago.moneda)}`
                    : 'Sin pago registrado'}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 flex-wrap">
                {onIniciarSesion && cita.modalidad === 'virtual' && (
                  <button
                    onClick={() => onIniciarSesion(cita.id)}
                    className={clsx(
                      'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                      cita.urgencia === 'critico'
                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                        : 'bg-calma-600 text-white hover:bg-calma-700'
                    )}
                    aria-label={`Iniciar sesión con ${cita.paciente.nombre}`}
                  >
                    <VideoCameraIcon className="w-4 h-4" aria-hidden="true" />
                    Iniciar sesión
                  </button>
                )}

                {onVerPaciente && (
                  <button
                    onClick={() => onVerPaciente(cita.paciente.id)}
                    className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all"
                    aria-label={`Ver perfil de ${cita.paciente.nombre}`}
                  >
                    Ver paciente
                  </button>
                )}

                {onCancelar && cita.estado !== 'completada' && cita.estado !== 'cancelada' && (
                  <button
                    onClick={() => onCancelar(cita.id)}
                    className="px-4 py-2 bg-white border-2 border-red-300 text-red-700 rounded-lg font-medium text-sm hover:bg-red-50 transition-all ml-auto"
                    aria-label={`Cancelar cita con ${cita.paciente.nombre}`}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
