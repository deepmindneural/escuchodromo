'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { CardProfesional, CardProfesionalSkeleton, type DatosProfesional } from '@/lib/componentes/CardProfesional';
import Navegacion from '@/lib/componentes/layout/Navegacion';

const ESPECIALIDADES = [
  'Todas',
  'Ansiedad',
  'Depresión',
  'Trauma',
  'Relaciones',
  'Autoestima',
  'Estrés',
  'Duelo',
  'Adicciones',
  'Trastornos alimentarios',
  'Psicología Clínica',
  'Psicología Infantil',
  'Psicología de Pareja',
  'Terapia Cognitivo-Conductual',
  'Terapia Humanista',
  'Psicoanálisis',
];

const RANGOS_TARIFA = [
  { valor: '', etiqueta: 'Cualquier precio' },
  { valor: '0-50000', etiqueta: 'Menos de $50.000' },
  { valor: '50000-100000', etiqueta: '$50.000 - $100.000' },
  { valor: '100000-150000', etiqueta: '$100.000 - $150.000' },
  { valor: '150000-999999', etiqueta: 'Más de $150.000' },
];

const MODALIDADES = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'virtual', etiqueta: 'Virtual' },
  { valor: 'presencial', etiqueta: 'Presencial' },
];

const ORDEN_OPTIONS = [
  { valor: 'nombre', etiqueta: 'Nombre (A-Z)' },
  { valor: 'rating', etiqueta: 'Mejor valorados' },
  { valor: 'tarifa_asc', etiqueta: 'Precio (menor a mayor)' },
  { valor: 'tarifa_desc', etiqueta: 'Precio (mayor a menor)' },
  { valor: 'experiencia', etiqueta: 'Más experiencia' },
];

/**
 * Página de Listado de Profesionales
 *
 * Muestra el directorio completo de profesionales (terapeutas)
 * disponibles en la plataforma con filtros avanzados, búsqueda y paginación.
 *
 * Características:
 * - Búsqueda por nombre o especialidad
 * - Filtros: especialidad, tarifa, modalidad, disponibilidad
 * - Ordenamiento: rating, tarifa, experiencia, nombre
 * - Paginación (12 profesionales por página)
 * - URL sync con query params
 * - Skeleton loading
 * - Responsive design
 */
export default function PaginaProfesionales() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = obtenerClienteNavegador();

  // Estado
  const [profesionales, setProfesionales] = useState<DatosProfesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [totalResultados, setTotalResultados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('Todas');
  const [rangoTarifaSeleccionado, setRangoTarifaSeleccionado] = useState('');
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState('');
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [ordenSeleccionado, setOrdenSeleccionado] = useState('nombre');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Cargar profesionales
  const cargarProfesionales = useCallback(async () => {
    try {
      setCargando(true);

      // Construir query params
      const params = new URLSearchParams();

      if (busqueda.trim()) params.append('busqueda', busqueda.trim());
      if (especialidadSeleccionada !== 'Todas') params.append('especialidad', especialidadSeleccionada);
      if (modalidadSeleccionada) params.append('modalidad', modalidadSeleccionada);
      if (soloDisponibles) params.append('disponible', 'true');
      params.append('orderBy', ordenSeleccionado);
      params.append('pagina', paginaActual.toString());
      params.append('limite', '12');

      // Agregar rango de tarifa si está seleccionado
      if (rangoTarifaSeleccionado) {
        const [min, max] = rangoTarifaSeleccionado.split('-');
        if (min) params.append('tarifa_min', min);
        if (max) params.append('tarifa_max', max);
      }

      // Llamar a la edge function
      const { data, error } = await supabase.functions.invoke(
        `listar-profesionales?${params.toString()}`,
        { method: 'GET' }
      );

      if (error) throw error;

      if (data?.success) {
        setProfesionales(data.profesionales || []);
        setTotalResultados(data.total || 0);
        setTotalPaginas(data.total_paginas || 0);
      } else {
        throw new Error(data?.error || 'Error al cargar profesionales');
      }
    } catch (error: any) {
      console.error('Error cargando profesionales:', error);
      toast.error('No se pudieron cargar los profesionales');
      setProfesionales([]);
      setTotalResultados(0);
      setTotalPaginas(0);
    } finally {
      setCargando(false);
    }
  }, [
    busqueda,
    especialidadSeleccionada,
    rangoTarifaSeleccionado,
    modalidadSeleccionada,
    soloDisponibles,
    ordenSeleccionado,
    paginaActual,
    supabase,
  ]);

  // Efecto para cargar profesionales cuando cambian los filtros
  useEffect(() => {
    cargarProfesionales();
  }, [cargarProfesionales]);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda,
    especialidadSeleccionada,
    rangoTarifaSeleccionado,
    modalidadSeleccionada,
    soloDisponibles,
    ordenSeleccionado,
  ]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setEspecialidadSeleccionada('Todas');
    setRangoTarifaSeleccionado('');
    setModalidadSeleccionada('');
    setSoloDisponibles(false);
    setOrdenSeleccionado('nombre');
    setPaginaActual(1);
  };

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Contador de filtros activos
  const filtrosActivos = [
    busqueda.trim(),
    especialidadSeleccionada !== 'Todas',
    rangoTarifaSeleccionado,
    modalidadSeleccionada,
    soloDisponibles,
  ].filter(Boolean).length;

  return (
    <>
      <Navegacion />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-calma-600 to-esperanza-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-4">
            Encuentra tu terapeuta ideal
          </h1>
          <p className="text-xl text-calma-50 max-w-2xl">
            Conecta con profesionales certificados que te ayudarán en tu proceso de bienestar emocional
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500 focus:border-transparent"
                aria-label="Buscar profesionales"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors relative',
                mostrarFiltros
                  ? 'bg-calma-600 text-white border-calma-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
              aria-expanded={mostrarFiltros}
              aria-controls="panel-filtros"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="font-medium">Filtros</span>
              {filtrosActivos > 0 && (
                <span className="absolute -top-2 -right-2 bg-esperanza-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {filtrosActivos}
                </span>
              )}
            </button>
          </div>

          {/* Panel de filtros desplegable */}
          {mostrarFiltros && (
            <div id="panel-filtros" className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Especialidad */}
                <div>
                  <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad
                  </label>
                  <select
                    id="especialidad"
                    value={especialidadSeleccionada}
                    onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500 bg-white"
                  >
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rango de tarifa */}
                <div>
                  <label htmlFor="rango-tarifa" className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de precio
                  </label>
                  <select
                    id="rango-tarifa"
                    value={rangoTarifaSeleccionado}
                    onChange={(e) => setRangoTarifaSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500 bg-white"
                  >
                    {RANGOS_TARIFA.map((rango) => (
                      <option key={rango.valor} value={rango.valor}>
                        {rango.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modalidad */}
                <div>
                  <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Modalidad
                  </label>
                  <select
                    id="modalidad"
                    value={modalidadSeleccionada}
                    onChange={(e) => setModalidadSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500 bg-white"
                  >
                    {MODALIDADES.map((mod) => (
                      <option key={mod.valor} value={mod.valor}>
                        {mod.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordenar por */}
                <div>
                  <label htmlFor="orden" className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    id="orden"
                    value={ordenSeleccionado}
                    onChange={(e) => setOrdenSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500 bg-white"
                  >
                    {ORDEN_OPTIONS.map((opt) => (
                      <option key={opt.valor} value={opt.valor}>
                        {opt.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox de disponibilidad */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloDisponibles}
                    onChange={(e) => setSoloDisponibles(e.target.checked)}
                    className="w-4 h-4 text-calma-600 border-gray-300 rounded focus:ring-calma-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Solo mostrar disponibles ahora</span>
                </label>

                {/* Botón limpiar filtros */}
                {filtrosActivos > 0 && (
                  <button
                    onClick={limpiarFiltros}
                    className="text-sm text-calma-600 hover:text-calma-700 font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Limpiar todos los filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contador de resultados */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {cargando ? (
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-gray-600">
                {totalResultados === 0 ? (
                  'No se encontraron profesionales'
                ) : (
                  <>
                    Mostrando{' '}
                    <span className="font-semibold">
                      {(paginaActual - 1) * 12 + 1}-{Math.min(paginaActual * 12, totalResultados)}
                    </span>{' '}
                    de <span className="font-semibold">{totalResultados}</span>{' '}
                    {totalResultados === 1 ? 'profesional' : 'profesionales'}
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Grid de tarjetas o skeleton */}
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardProfesionalSkeleton key={i} />
            ))}
          </div>
        ) : profesionales.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron profesionales
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filtrosActivos > 0
                ? 'Intenta ajustar los filtros para ver más resultados'
                : 'Actualmente no hay profesionales disponibles'}
            </p>
            {filtrosActivos > 0 && (
              <button
                onClick={limpiarFiltros}
                className="px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium transition-colors"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profesionales.map((profesional) => (
                <CardProfesional key={profesional.id} profesional={profesional} />
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {/* Botón anterior */}
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className={clsx(
                    'p-2 rounded-lg border transition-colors',
                    paginaActual === 1
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter((num) => {
                      // Mostrar solo páginas cercanas a la actual
                      if (num === 1 || num === totalPaginas) return true;
                      if (num >= paginaActual - 1 && num <= paginaActual + 1) return true;
                      return false;
                    })
                    .map((num, idx, arr) => {
                      // Agregar "..." si hay salto
                      const prevNum = arr[idx - 1];
                      const showEllipsis = prevNum && num - prevNum > 1;

                      return (
                        <React.Fragment key={num}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => cambiarPagina(num)}
                            className={clsx(
                              'min-w-[2.5rem] h-10 px-3 rounded-lg border transition-colors font-medium',
                              num === paginaActual
                                ? 'bg-calma-600 text-white border-calma-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            )}
                            aria-label={`Ir a página ${num}`}
                            aria-current={num === paginaActual ? 'page' : undefined}
                          >
                            {num}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                {/* Botón siguiente */}
                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className={clsx(
                    'p-2 rounded-lg border transition-colors',
                    paginaActual === totalPaginas
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
