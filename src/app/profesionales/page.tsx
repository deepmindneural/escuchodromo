'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  especialidad: string;
  experiencia_anos: number;
  foto_perfil: string | null;
  biografia: string;
  direccion: string | null;
  tarifa_30min: number;
  tarifa_60min: number;
  disponible: boolean;
}

const ESPECIALIDADES = [
  'Todas',
  'Psicología Clínica',
  'Psicología Infantil',
  'Psicología de Pareja',
  'Psicología Organizacional',
  'Psicoterapia Cognitiva',
  'Psicoterapia Humanista',
  'Psicoanálisis',
];

const ORDEN_OPTIONS = [
  { valor: 'nombre', etiqueta: 'Nombre (A-Z)' },
  { valor: 'precio_asc', etiqueta: 'Precio (menor a mayor)' },
  { valor: 'precio_desc', etiqueta: 'Precio (mayor a menor)' },
  { valor: 'experiencia', etiqueta: 'Más experiencia' },
];

/**
 * Página de Listado de Profesionales
 *
 * Muestra el directorio completo de profesionales (terapeutas)
 * disponibles en la plataforma con filtros y búsqueda
 *
 * Características:
 * - Búsqueda por nombre
 * - Filtro por especialidad
 * - Filtro de disponibilidad
 * - Ordenamiento múltiple
 * - Tarjetas con información clave
 * - Links a perfil detallado y reserva directa
 */
export default function PaginaProfesionales() {
  const router = useRouter();
  const supabase = createClient();

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('Todas');
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [ordenSeleccionado, setOrdenSeleccionado] = useState('nombre');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Cargar profesionales al montar
  useEffect(() => {
    cargarProfesionales();
  }, [ordenSeleccionado, soloDisponibles]);

  // Aplicar búsqueda y filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [busqueda, especialidadSeleccionada, profesionales]);

  const cargarProfesionales = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams({
        orderBy: ordenSeleccionado,
        disponible: soloDisponibles.toString(),
      });

      const { data, error } = await supabase.functions.invoke('listar-profesionales', {
        method: 'GET',
        // @ts-ignore
        body: null,
      });

      if (error) throw error;

      if (data?.success && data?.profesionales) {
        setProfesionales(data.profesionales);
        setProfesionalesFiltrados(data.profesionales);
      } else {
        setProfesionales([]);
        setProfesionalesFiltrados([]);
      }
    } catch (error: any) {
      console.error('Error cargando profesionales:', error);
      toast.error('No se pudieron cargar los profesionales');
      setProfesionales([]);
      setProfesionalesFiltrados([]);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...profesionales];

    // Filtrar por búsqueda (nombre o especialidad)
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.nombre_completo.toLowerCase().includes(terminoBusqueda) ||
          p.especialidad.toLowerCase().includes(terminoBusqueda)
      );
    }

    // Filtrar por especialidad
    if (especialidadSeleccionada !== 'Todas') {
      resultado = resultado.filter((p) => p.especialidad === especialidadSeleccionada);
    }

    setProfesionalesFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setEspecialidadSeleccionada('Todas');
    setSoloDisponibles(false);
    setOrdenSeleccionado('nombre');
  };

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando profesionales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500 focus:border-transparent"
                aria-label="Buscar profesionales"
              />
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors',
                mostrarFiltros
                  ? 'bg-calma-600 text-white border-calma-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
              aria-expanded={mostrarFiltros}
              aria-controls="panel-filtros"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Panel de filtros desplegable */}
          {mostrarFiltros && (
            <div id="panel-filtros" className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Especialidad */}
                <div>
                  <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad
                  </label>
                  <select
                    id="especialidad"
                    value={especialidadSeleccionada}
                    onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
                  >
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
                  >
                    {ORDEN_OPTIONS.map((opt) => (
                      <option key={opt.valor} value={opt.valor}>
                        {opt.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Disponibilidad */}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soloDisponibles}
                      onChange={(e) => setSoloDisponibles(e.target.checked)}
                      className="w-4 h-4 text-calma-600 border-gray-300 rounded focus:ring-calma-500"
                    />
                    <span className="text-sm text-gray-700">Solo disponibles ahora</span>
                  </label>
                </div>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="text-sm text-calma-600 hover:text-calma-700 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contador de resultados */}
        <div className="mb-6">
          <p className="text-gray-600">
            {profesionalesFiltrados.length === 0 ? (
              'No se encontraron profesionales'
            ) : (
              <>
                Mostrando <span className="font-semibold">{profesionalesFiltrados.length}</span>{' '}
                {profesionalesFiltrados.length === 1 ? 'profesional' : 'profesionales'}
              </>
            )}
          </p>
        </div>

        {/* Grid de tarjetas */}
        {profesionalesFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No hay profesionales que coincidan con tu búsqueda</p>
            <button
              onClick={limpiarFiltros}
              className="px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profesionalesFiltrados.map((profesional) => (
              <TarjetaProfesional key={profesional.id} profesional={profesional} router={router} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de Tarjeta de Profesional
 */
interface TarjetaProfesionalProps {
  profesional: Profesional;
  router: any;
}

function TarjetaProfesional({ profesional, router }: TarjetaProfesionalProps) {
  return (
    <article
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Imagen de perfil */}
      <div className="aspect-square bg-gradient-to-br from-calma-100 to-esperanza-100 relative">
        {profesional.foto_perfil ? (
          <img
            src={profesional.foto_perfil}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-bold text-4xl">
              {profesional.nombre.charAt(0)}
              {profesional.apellido.charAt(0)}
            </div>
          </div>
        )}

        {/* Badge de verificado */}
        <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
          <CheckBadgeIcon className="w-6 h-6 text-esperanza-600" aria-label="Profesional verificado" />
        </div>

        {/* Badge de disponibilidad */}
        {profesional.disponible && (
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-esperanza-500 text-white text-xs font-medium rounded-full">
            Disponible
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Nombre y especialidad */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {profesional.nombre_completo}
        </h2>
        <p className="text-calma-600 font-medium mb-3">{profesional.especialidad}</p>

        {/* Experiencia */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <ClockIcon className="w-4 h-4" />
          <span>{profesional.experiencia_anos} años de experiencia</span>
        </div>

        {/* Ubicación si existe */}
        {profesional.direccion && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <MapPinIcon className="w-4 h-4" />
            <span className="truncate">{profesional.direccion}</span>
          </div>
        )}

        {/* Biografía (preview) */}
        {profesional.biografia && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {profesional.biografia}
          </p>
        )}

        {/* Precio */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Desde</p>
          <p className="text-2xl font-bold text-calma-700">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            }).format(profesional.tarifa_30min)}
          </p>
          <p className="text-xs text-gray-500">por sesión de 30 minutos</p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/profesionales/${profesional.id}`)}
            className="flex-1 px-4 py-2 bg-white text-calma-600 border-2 border-calma-600 rounded-lg hover:bg-calma-50 font-medium transition-colors"
          >
            Ver perfil
          </button>
          <button
            onClick={() => router.push(`/profesionales/${profesional.id}/reservar`)}
            className="flex-1 px-4 py-2 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium transition-colors"
          >
            Reservar
          </button>
        </div>
      </div>
    </article>
  );
}
