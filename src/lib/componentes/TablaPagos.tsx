'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { PagoConDetalles } from '@/lib/supabase/queries/profesional';

interface TablaPagosProps {
  pagos: PagoConDetalles[];
  cargando?: boolean;
  onVerDetalle?: (pagoId: string) => void;
  onVerPaciente?: (pacienteId: string) => void;
}

/**
 * TablaPagos - Muestra tabla de pagos del profesional
 *
 * Características:
 * - Tabla responsive con información completa
 * - Badges de estado con colores
 * - Formateo de moneda
 * - Acciones por pago
 * - Diseño accesible con ARIA
 */
export function TablaPagos({ pagos, cargando = false, onVerDetalle, onVerPaciente }: TablaPagosProps) {
  const formatearMoneda = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
    }).format(monto);
  };

  const formatearFecha = (fecha: Date | null) => {
    if (!fecha) return 'Pendiente';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatearFechaHora = (fecha: Date) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerBadgeEstado = (estado: PagoConDetalles['estado']) => {
    switch (estado) {
      case 'completado':
        return {
          bg: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircleIcon className="w-4 h-4" aria-hidden="true" />,
          texto: 'Completado',
        };
      case 'pendiente':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <ClockIcon className="w-4 h-4" aria-hidden="true" />,
          texto: 'Pendiente',
        };
      case 'procesando':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <ArrowPathIcon className="w-4 h-4 animate-spin" aria-hidden="true" />,
          texto: 'Procesando',
        };
      case 'fallido':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircleIcon className="w-4 h-4" aria-hidden="true" />,
          texto: 'Fallido',
        };
      case 'reembolsado':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />,
          texto: 'Reembolsado',
        };
      case 'cancelado':
        return {
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <XCircleIcon className="w-4 h-4" aria-hidden="true" />,
          texto: 'Cancelado',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <ClockIcon className="w-4 h-4" aria-hidden="true" />,
          texto: estado,
        };
    }
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" role="status">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4" colSpan={6}>
                    <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (pagos.length === 0) {
    return (
      <div
        className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center"
        role="status"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BanknotesIcon className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos registrados</h3>
        <p className="text-gray-600">
          Los pagos de tus citas aparecerán aquí una vez que los pacientes realicen el pago.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabla desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Fecha de Pago
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Paciente
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Cita Asociada
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Monto
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagos.map((pago, index) => {
              const badge = obtenerBadgeEstado(pago.estado);

              return (
                <motion.tr
                  key={pago.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Fecha de pago */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{formatearFecha(pago.fecha_pago)}</div>
                        {pago.fecha_pago && (
                          <div className="text-gray-500">
                            {new Date(pago.fecha_pago).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Paciente */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {pago.paciente.foto_perfil ? (
                        <img
                          src={pago.paciente.foto_perfil}
                          alt={`Foto de ${pago.paciente.nombre}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {pago.paciente.nombre} {pago.paciente.apellido || ''}
                        </div>
                        <div className="text-xs text-gray-500">{pago.paciente.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Cita asociada */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {formatearFechaHora(pago.cita.fecha_hora)}
                      </div>
                      <div className="text-gray-500 flex items-center gap-1">
                        {pago.cita.modalidad === 'virtual' ? '💻' : '🏢'} {pago.cita.duracion} min
                      </div>
                    </div>
                  </td>

                  {/* Monto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {formatearMoneda(pago.monto, pago.moneda)}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                        badge.bg
                      )}
                    >
                      {badge.icon}
                      {badge.texto}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onVerPaciente && (
                        <button
                          onClick={() => onVerPaciente(pago.paciente.id)}
                          className="text-calma-600 hover:text-calma-800 font-medium"
                          aria-label={`Ver perfil de ${pago.paciente.nombre}`}
                        >
                          Ver paciente
                        </button>
                      )}
                      {onVerDetalle && (
                        <button
                          onClick={() => onVerDetalle(pago.id)}
                          className="text-esperanza-600 hover:text-esperanza-800 font-medium"
                          aria-label={`Ver detalles del pago`}
                        >
                          Detalles
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="lg:hidden divide-y divide-gray-200">
        {pagos.map((pago, index) => {
          const badge = obtenerBadgeEstado(pago.estado);

          return (
            <motion.div
              key={pago.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {pago.paciente.foto_perfil ? (
                    <img
                      src={pago.paciente.foto_perfil}
                      alt={`Foto de ${pago.paciente.nombre}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-500" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {pago.paciente.nombre} {pago.paciente.apellido || ''}
                    </div>
                    <div className="text-sm text-gray-500">{formatearFecha(pago.fecha_pago)}</div>
                  </div>
                </div>
                <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border', badge.bg)}>
                  {badge.icon}
                  {badge.texto}
                </span>
              </div>

              {/* Detalles */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cita:</span>
                  <span className="text-gray-900 font-medium">
                    {formatearFechaHora(pago.cita.fecha_hora)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monto:</span>
                  <span className="text-gray-900 font-bold">{formatearMoneda(pago.monto, pago.moneda)}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                {onVerPaciente && (
                  <button
                    onClick={() => onVerPaciente(pago.paciente.id)}
                    className="flex-1 px-3 py-2 bg-calma-600 text-white rounded-lg text-sm font-medium hover:bg-calma-700"
                  >
                    Ver paciente
                  </button>
                )}
                {onVerDetalle && (
                  <button
                    onClick={() => onVerDetalle(pago.id)}
                    className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Detalles
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
