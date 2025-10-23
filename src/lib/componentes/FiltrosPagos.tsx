'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  BanknotesIcon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { FiltrosPagos as FiltrosPagosType } from '@/lib/supabase/queries/profesional';

interface FiltrosPagosProps {
  onAplicarFiltros: (filtros: FiltrosPagosType) => void;
  cargando?: boolean;
  pacientes?: Array<{ id: string; nombre: string; apellido: string | null }>;
}

/**
 * FiltrosPagos - Componente de filtros avanzados para pagos
 *
 * Características:
 * - Filtro por rango de fechas
 * - Filtro por estado de pago
 * - Filtro por paciente
 * - Filtro por rango de monto
 * - Botón para limpiar filtros
 * - Diseño accesible con ARIA
 */
export function FiltrosPagos({ onAplicarFiltros, cargando = false, pacientes = [] }: FiltrosPagosProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState<FiltrosPagosType['estado'] | ''>('');
  const [pacienteId, setPacienteId] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');

  const handleAplicar = () => {
    const filtros: FiltrosPagosType = {};

    if (fechaInicio) filtros.fechaInicio = new Date(fechaInicio);
    if (fechaFin) filtros.fechaFin = new Date(fechaFin);
    if (estado) filtros.estado = estado;
    if (pacienteId) filtros.pacienteId = pacienteId;
    if (montoMin) filtros.montoMin = parseFloat(montoMin);
    if (montoMax) filtros.montoMax = parseFloat(montoMax);

    onAplicarFiltros(filtros);
    setMostrarFiltros(false);
  };

  const handleLimpiar = () => {
    setFechaInicio('');
    setFechaFin('');
    setEstado('');
    setPacienteId('');
    setMontoMin('');
    setMontoMax('');
    onAplicarFiltros({});
  };

  const filtrosActivos =
    !!fechaInicio || !!fechaFin || !!estado || !!pacienteId || !!montoMin || !!montoMax;

  return (
    <div className="relative">
      {/* Botón para mostrar/ocultar filtros */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
            mostrarFiltros
              ? 'bg-calma-600 text-white hover:bg-calma-700'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-calma-500 hover:text-calma-700'
          )}
          aria-label="Mostrar filtros"
          aria-expanded={mostrarFiltros}
        >
          <FunnelIcon className="w-5 h-5" aria-hidden="true" />
          Filtros
          {filtrosActivos && (
            <span className="w-2 h-2 bg-esperanza-500 rounded-full animate-pulse" aria-label="Filtros activos" />
          )}
        </button>

        {filtrosActivos && (
          <button
            onClick={handleLimpiar}
            className="px-4 py-2 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg font-medium text-sm hover:bg-red-100 transition-all flex items-center gap-2"
            aria-label="Limpiar filtros"
          >
            <XMarkIcon className="w-5 h-5" aria-hidden="true" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-6 z-10"
          role="region"
          aria-label="Panel de filtros de pagos"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por fecha inicio */}
            <div>
              <label htmlFor="fecha-inicio" className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                Fecha inicio
              </label>
              <input
                id="fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-calma-500 focus:ring-2 focus:ring-calma-200 transition-all"
                aria-describedby="fecha-inicio-ayuda"
              />
              <p id="fecha-inicio-ayuda" className="text-xs text-gray-500 mt-1">
                Desde esta fecha
              </p>
            </div>

            {/* Filtro por fecha fin */}
            <div>
              <label htmlFor="fecha-fin" className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                Fecha fin
              </label>
              <input
                id="fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-calma-500 focus:ring-2 focus:ring-calma-200 transition-all"
                aria-describedby="fecha-fin-ayuda"
              />
              <p id="fecha-fin-ayuda" className="text-xs text-gray-500 mt-1">
                Hasta esta fecha
              </p>
            </div>

            {/* Filtro por estado */}
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircleIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                Estado del pago
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as FiltrosPagosType['estado'] | '')}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-calma-500 focus:ring-2 focus:ring-calma-200 transition-all"
              >
                <option value="">Todos los estados</option>
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
                <option value="procesando">Procesando</option>
                <option value="fallido">Fallido</option>
                <option value="reembolsado">Reembolsado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Filtro por paciente */}
            {pacientes.length > 0 && (
              <div>
                <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Paciente
                </label>
                <select
                  id="paciente"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-calma-500 focus:ring-2 focus:ring-calma-200 transition-all"
                >
                  <option value="">Todos los pacientes</option>
                  {pacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nombre} {paciente.apellido || ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por monto mínimo */}
            <div>
              <label htmlFor="monto-min" className="block text-sm font-medium text-gray-700 mb-2">
                <BanknotesIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                Monto mínimo
              </label>
              <input
                id="monto-min"
                type="number"
                min="0"
                step="1000"
                value={montoMin}
                onChange={(e) => setMontoMin(e.target.value)}
                placeholder="Ej: 50000"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-calma-500 focus:ring-2 focus:ring-calma-200 transition-all"
              />
            </div>

            {/* Filtro por monto máximo */}
            <div>
              <label htmlFor="monto-max" className="block text-sm font-medium text-gray-700 mb-2">
                <BanknotesIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                Monto máximo
              </label>
              <input
                id="monto-max"
                type="number"
                min="0"
                step="1000"
                value={montoMax}
                onChange={(e) => setMontoMax(e.target.value)}
                placeholder="Ej: 200000"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-calma-500 focus:ring-2 focus:ring-calma-200 transition-all"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setMostrarFiltros(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              onClick={handleAplicar}
              disabled={cargando}
              className="px-6 py-2 bg-calma-600 text-white rounded-lg font-medium hover:bg-calma-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {cargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <FunnelIcon className="w-5 h-5" aria-hidden="true" />
                  Aplicar filtros
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
