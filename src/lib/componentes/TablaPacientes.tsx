'use client';

import React, { useState } from 'react';
import { IndicadorEmocionalIcono, type EstadoEmocional } from './IndicadorEmocional';
import { ChevronUpIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { formatearFechaCorta } from '../utils/fechas';

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  foto?: string;
  ultimoContacto: Date;
  estadoEmocional: EstadoEmocional;
  progreso: number; // 0-100
  sesionesCompletadas: number;
  sesionesProgramadas: number;
}

interface TablaPacientesProps {
  /** Array de pacientes */
  pacientes: Paciente[];
  /** Callback al hacer click en un paciente */
  onClickPaciente: (paciente: Paciente) => void;
  /** Estado de carga */
  cargando?: boolean;
}

type OrdenColumna = 'nombre' | 'ultimoContacto' | 'progreso' | null;
type DireccionOrden = 'asc' | 'desc';

/**
 * TablaPacientes - Tabla responsive y accesible de pacientes
 *
 * Características de accesibilidad:
 * - Tabla semántica con headers apropiados
 * - Stack en mobile (diseño de cards)
 * - Sorting por columna
 * - Filtros accesibles
 * - Navegación por teclado
 */
export function TablaPacientes({
  pacientes,
  onClickPaciente,
  cargando = false,
}: TablaPacientesProps) {
  const [ordenColumna, setOrdenColumna] = useState<OrdenColumna>(null);
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('asc');
  const [filtroEstado, setFiltroEstado] = useState<EstadoEmocional | 'TODOS'>('TODOS');

  // Manejar ordenamiento
  const manejarOrden = (columna: OrdenColumna) => {
    if (ordenColumna === columna) {
      setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenColumna(columna);
      setDireccionOrden('asc');
    }
  };

  // Filtrar pacientes
  const pacientesFiltrados =
    filtroEstado === 'TODOS'
      ? pacientes
      : pacientes.filter((p) => p.estadoEmocional === filtroEstado);

  // Ordenar pacientes
  const pacientesOrdenados = [...pacientesFiltrados].sort((a, b) => {
    if (!ordenColumna) return 0;

    const multiplicador = direccionOrden === 'asc' ? 1 : -1;

    switch (ordenColumna) {
      case 'nombre':
        return multiplicador * `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
      case 'ultimoContacto':
        return multiplicador * (a.ultimoContacto.getTime() - b.ultimoContacto.getTime());
      case 'progreso':
        return multiplicador * (a.progreso - b.progreso);
      default:
        return 0;
    }
  });

  // Renderizar indicador de orden
  const IconoOrden = ({ columna }: { columna: OrdenColumna }) => {
    if (ordenColumna !== columna) return null;
    return direccionOrden === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" aria-hidden="true" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
    );
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-calma-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header con filtros */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>Pacientes</span>
          <span className="text-sm font-normal text-gray-500">
            ({pacientesOrdenados.length})
          </span>
        </h3>

        {/* Filtro por estado emocional */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <label htmlFor="filtro-estado" className="sr-only">
            Filtrar por estado emocional
          </label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoEmocional | 'TODOS')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-calma-500"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ESTABLE">Estable</option>
            <option value="ALERTA">Alerta</option>
            <option value="CRITICO">Crítico</option>
          </select>
        </div>
      </div>

      {/* Vista Desktop: Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" role="table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrden('nombre')}
                role="columnheader"
                aria-sort={
                  ordenColumna === 'nombre'
                    ? direccionOrden === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <div className="flex items-center gap-2">
                  Paciente
                  <IconoOrden columna="nombre" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrden('ultimoContacto')}
                role="columnheader"
                aria-sort={
                  ordenColumna === 'ultimoContacto'
                    ? direccionOrden === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <div className="flex items-center gap-2">
                  Último contacto
                  <IconoOrden columna="ultimoContacto" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" role="columnheader">
                Estado emocional
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => manejarOrden('progreso')}
                role="columnheader"
                aria-sort={
                  ordenColumna === 'progreso'
                    ? direccionOrden === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <div className="flex items-center gap-2">
                  Progreso
                  <IconoOrden columna="progreso" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" role="columnheader">
                Sesiones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" role="columnheader">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pacientesOrdenados.map((paciente) => (
              <tr
                key={paciente.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onClickPaciente(paciente)}
                role="row"
              >
                {/* Paciente */}
                <td className="px-6 py-4 whitespace-nowrap" role="cell">
                  <div className="flex items-center gap-3">
                    {paciente.foto ? (
                      <img
                        src={paciente.foto}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-semibold">
                        {paciente.nombre.charAt(0)}
                        {paciente.apellido.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {paciente.nombre} {paciente.apellido}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Último contacto */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600" role="cell">
                  {formatearFechaCorta(paciente.ultimoContacto)}
                </td>

                {/* Estado emocional */}
                <td className="px-6 py-4 whitespace-nowrap" role="cell">
                  <IndicadorEmocionalIcono estado={paciente.estadoEmocional} />
                </td>

                {/* Progreso */}
                <td className="px-6 py-4 whitespace-nowrap" role="cell">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div
                        className={clsx('h-2 rounded-full transition-all', {
                          'bg-esperanza-600': paciente.progreso >= 70,
                          'bg-calma-600': paciente.progreso >= 40 && paciente.progreso < 70,
                          'bg-gray-400': paciente.progreso < 40,
                        })}
                        style={{ width: `${paciente.progreso}%` }}
                        role="progressbar"
                        aria-valuenow={paciente.progreso}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progreso: ${paciente.progreso}%`}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {paciente.progreso}%
                    </span>
                  </div>
                </td>

                {/* Sesiones */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600" role="cell">
                  {paciente.sesionesCompletadas} / {paciente.sesionesProgramadas}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 whitespace-nowrap" role="cell">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClickPaciente(paciente);
                    }}
                    className="text-calma-600 hover:text-calma-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-calma-500 rounded px-2 py-1"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile: Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {pacientesOrdenados.map((paciente) => (
          <button
            key={paciente.id}
            onClick={() => onClickPaciente(paciente)}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-calma-500"
          >
            {/* Header del card */}
            <div className="flex items-center gap-3 mb-3">
              {paciente.foto ? (
                <img
                  src={paciente.foto}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-semibold">
                  {paciente.nombre.charAt(0)}
                  {paciente.apellido.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </p>
                <p className="text-sm text-gray-600">
                  Última sesión: {formatearFechaCorta(paciente.ultimoContacto)}
                </p>
              </div>
              <IndicadorEmocionalIcono estado={paciente.estadoEmocional} />
            </div>

            {/* Progreso */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progreso</span>
                <span className="font-medium text-gray-900">{paciente.progreso}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className={clsx('h-2 rounded-full transition-all', {
                    'bg-esperanza-600': paciente.progreso >= 70,
                    'bg-calma-600': paciente.progreso >= 40 && paciente.progreso < 70,
                    'bg-gray-400': paciente.progreso < 40,
                  })}
                  style={{ width: `${paciente.progreso}%` }}
                  role="progressbar"
                  aria-valuenow={paciente.progreso}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {/* Sesiones */}
            <p className="text-sm text-gray-600">
              Sesiones: {paciente.sesionesCompletadas} / {paciente.sesionesProgramadas}
            </p>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {pacientesOrdenados.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-gray-600">No se encontraron pacientes con los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
}
