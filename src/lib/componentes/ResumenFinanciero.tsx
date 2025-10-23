'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import clsx from 'clsx';
import type { ResumenFinanciero as ResumenFinancieroType } from '@/lib/supabase/queries/profesional';

interface ResumenFinancieroProps {
  resumen: ResumenFinancieroType;
  cargando?: boolean;
  moneda?: string;
}

/**
 * ResumenFinanciero - Muestra resumen financiero completo del profesional
 *
 * Características:
 * - Cards de métricas principales
 * - Gráfico de tendencia de ingresos
 * - Top 5 pacientes por pago
 * - Comparativas mensuales
 * - Diseño accesible con ARIA
 */
export function ResumenFinanciero({ resumen, cargando = false, moneda = 'COP' }: ResumenFinancieroProps) {
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
    }).format(valor);
  };

  if (cargando) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-12 bg-gray-100 rounded mb-4"></div>
              <div className="h-8 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
        {/* Gráfico skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos mes actual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border-2 border-green-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Ingresos del Mes</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatearMoneda(resumen.ingresosMesActual)}
          </p>
          {resumen.cambioMensual.tipo !== 'neutro' && (
            <div className="flex items-center gap-1 text-sm">
              {resumen.cambioMensual.tipo === 'positivo' ? (
                <>
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" aria-hidden="true" />
                  <span className="text-green-600 font-semibold">
                    +{resumen.cambioMensual.porcentaje}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" aria-hidden="true" />
                  <span className="text-red-600 font-semibold">
                    -{resumen.cambioMensual.porcentaje}%
                  </span>
                </>
              )}
              <span className="text-gray-600">vs mes anterior</span>
            </div>
          )}
        </motion.div>

        {/* Pagos completados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm border-2 border-blue-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Pagos Completados</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{resumen.pagosCompletados}</p>
          <p className="text-sm text-gray-600">de {resumen.totalPagos} pagos totales</p>
        </motion.div>

        {/* Pagos pendientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm border-2 border-orange-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Pagos Pendientes</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{resumen.pagosPendientes}</p>
          <p className="text-sm text-gray-600">
            {resumen.totalPagos > 0
              ? `${Math.round((resumen.pagosPendientes / resumen.totalPagos) * 100)}% del total`
              : 'Sin pagos este mes'}
          </p>
        </motion.div>

        {/* Ingresos mes anterior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl shadow-sm border-2 border-purple-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Mes Anterior</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatearMoneda(resumen.ingresosMesAnterior)}
          </p>
          <p className="text-sm text-gray-600">
            {resumen.cambioMensual.tipo === 'positivo'
              ? 'Mejoramos este mes'
              : resumen.cambioMensual.tipo === 'negativo'
                ? 'Bajamos este mes'
                : 'Sin cambios'}
          </p>
        </motion.div>
      </div>

      {/* Gráfico de tendencia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-calma-600" aria-hidden="true" />
          Tendencia de Ingresos - Últimos 6 Meses
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resumen.tendenciaUltimos6Meses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                formatter={(value: number) => [formatearMoneda(value), 'Ingresos']}
              />
              <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '16px' }} />
              <Bar
                dataKey="ingresos"
                fill="#14B8A6"
                radius={[8, 8, 0, 0]}
                name="Ingresos"
                aria-label="Gráfico de barras de ingresos mensuales"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top 5 pacientes */}
      {resumen.topPacientes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6 text-esperanza-600" aria-hidden="true" />
            Top 5 Pacientes por Ingresos
          </h3>
          <div className="space-y-3">
            {resumen.topPacientes.map((top, index) => (
              <div
                key={top.paciente.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white',
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                            ? 'bg-orange-600'
                            : 'bg-gray-300'
                    )}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {top.paciente.nombre} {top.paciente.apellido || ''}
                    </p>
                    <p className="text-sm text-gray-600">{top.numeroPagos} pagos realizados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{formatearMoneda(top.totalPagado)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
