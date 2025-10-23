'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import { obtenerPacientesProfesional, type PacienteConDatos } from '@/lib/supabase/queries/profesional';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type FiltroEstado = 'TODOS' | 'ESTABLE' | 'ALERTA' | 'CRITICO';
type OrdenarPor = 'nombre' | 'ultimaCita' | 'progreso' | 'totalCitas';

/**
 * Página: Gestión de Pacientes del Profesional
 *
 * Permite al profesional ver y gestionar todos sus pacientes
 * con búsqueda, filtros y ordenamiento
 */
export default function PaginaPacientesProfesional() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const [cargando, setCargando] = useState(true);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<PacienteConDatos[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<PacienteConDatos[]>([]);

  // Estados de filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>('ultimaCita');
  const [ordenAscendente, setOrdenAscendente] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  useEffect(() => {
    if (profesionalId) {
      cargarPacientes();
    }
  }, [profesionalId]);

  useEffect(() => {
    aplicarFiltrosYOrdenamiento();
  }, [pacientes, busqueda, filtroEstado, ordenarPor, ordenAscendente]);

  const verificarAutenticacion = async () => {
    try {
      console.log('🔐 [verificarAutenticacion] Iniciando verificación...');
      const { data: { user } } = await supabase.auth.getUser();

      console.log('👤 [verificarAutenticacion] Usuario autenticado:', user?.id);

      if (!user) {
        toast.error('Debes iniciar sesión');
        router.push('/iniciar-sesion');
        return;
      }

      // Verificar que sea profesional
      const { data: userData, error } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('auth_id', user.id)
        .single();

      console.log('📋 [verificarAutenticacion] Datos del usuario:', userData);
      console.log('⚠️ [verificarAutenticacion] Error en query:', error);

      if (error || !userData || (userData.rol !== 'TERAPEUTA' && userData.rol !== 'ADMIN')) {
        toast.error('No tienes permisos para acceder a esta página');
        router.push('/dashboard');
        return;
      }

      console.log('✅ [verificarAutenticacion] Estableciendo profesionalId:', userData.id);
      setProfesionalId(userData.id);
    } catch (error) {
      console.error('❌ [verificarAutenticacion] Error:', error);
      toast.error('Error de autenticación');
      router.push('/iniciar-sesion');
    }
  };

  const cargarPacientes = async () => {
    console.log('🏥 [cargarPacientes] Ejecutando con profesionalId:', profesionalId);

    if (!profesionalId) {
      console.log('⚠️ [cargarPacientes] No hay profesionalId, saliendo...');
      return;
    }

    try {
      setCargando(true);
      console.log('📞 [cargarPacientes] Llamando a obtenerPacientesProfesional...');

      const { data, error } = await obtenerPacientesProfesional(profesionalId);

      console.log('📦 [cargarPacientes] Respuesta recibida - data:', data);
      console.log('⚠️ [cargarPacientes] Respuesta recibida - error:', error);

      if (error) {
        console.error('❌ [cargarPacientes] Error obteniendo pacientes:', error);
        toast.error('Error al cargar los pacientes');
        return;
      }

      console.log('✅ [cargarPacientes] Estableciendo pacientes, cantidad:', data?.length || 0);
      setPacientes(data || []);
    } catch (error) {
      console.error('❌ [cargarPacientes] Error inesperado:', error);
      toast.error('Error inesperado al cargar pacientes');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltrosYOrdenamiento = () => {
    let resultado = [...pacientes];

    // Aplicar búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.nombre.toLowerCase().includes(termino) ||
          (p.apellido && p.apellido.toLowerCase().includes(termino)) ||
          p.email.toLowerCase().includes(termino)
      );
    }

    // Aplicar filtro de estado
    if (filtroEstado !== 'TODOS') {
      resultado = resultado.filter((p) => p.estado_emocional === filtroEstado);
    }

    // Ordenar
    resultado.sort((a, b) => {
      let comparacion = 0;

      switch (ordenarPor) {
        case 'nombre':
          comparacion = a.nombre.localeCompare(b.nombre);
          break;
        case 'ultimaCita':
          const fechaA = a.ultima_cita ? new Date(a.ultima_cita).getTime() : 0;
          const fechaB = b.ultima_cita ? new Date(b.ultima_cita).getTime() : 0;
          comparacion = fechaB - fechaA; // Más reciente primero por defecto
          break;
        case 'progreso':
          comparacion = (b.progreso || 0) - (a.progreso || 0);
          break;
        case 'totalCitas':
          comparacion = b.total_citas - a.total_citas;
          break;
      }

      return ordenAscendente ? -comparacion : comparacion;
    });

    setPacientesFiltrados(resultado);
  };

  const calcularEstadisticas = () => {
    const total = pacientes.length;
    const estables = pacientes.filter((p) => p.estado_emocional === 'ESTABLE').length;
    const alertas = pacientes.filter((p) => p.estado_emocional === 'ALERTA').length;
    const criticos = pacientes.filter((p) => p.estado_emocional === 'CRITICO').length;

    return { total, estables, alertas, criticos };
  };

  const obtenerColorEstado = (estado?: 'ESTABLE' | 'ALERTA' | 'CRITICO') => {
    switch (estado) {
      case 'ESTABLE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ALERTA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CRITICO':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const obtenerIconoEstado = (estado?: 'ESTABLE' | 'ALERTA' | 'CRITICO') => {
    switch (estado) {
      case 'ESTABLE':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'ALERTA':
      case 'CRITICO':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatearFecha = (fecha?: Date | null) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const stats = calcularEstadisticas();

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-calma-600 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Pacientes</h1>
                <p className="text-gray-600">Gestiona y monitorea a tus pacientes</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/profesional/dashboard')}
              className="px-4 py-2 text-calma-600 hover:text-calma-700 font-medium"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Estables</p>
                <p className="text-2xl font-bold text-green-900">{stats.estables}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">En Alerta</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.alertas}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Críticos</p>
                <p className="text-2xl font-bold text-red-900">{stats.criticos}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ESTABLE">Estables</option>
                <option value="ALERTA">En alerta</option>
                <option value="CRITICO">Críticos</option>
              </select>
            </div>

            {/* Ordenar */}
            <div className="flex items-center gap-2">
              <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value as OrdenarPor)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
              >
                <option value="ultimaCita">Última cita</option>
                <option value="nombre">Nombre</option>
                <option value="progreso">Progreso</option>
                <option value="totalCitas">Total de citas</option>
              </select>
              <button
                onClick={() => setOrdenAscendente(!ordenAscendente)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={ordenAscendente ? 'Orden ascendente' : 'Orden descendente'}
              >
                <ArrowsUpDownIcon className={clsx('w-5 h-5', ordenAscendente ? 'rotate-180' : '')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pacientes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {pacientesFiltrados.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron pacientes</h3>
            <p className="text-gray-600">
              {busqueda || filtroEstado !== 'TODOS'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no tienes pacientes asignados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pacientesFiltrados.map((paciente) => (
              <div
                key={paciente.id}
                onClick={() => router.push(`/pacientes/${paciente.id}/progreso`)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-calma-500 transition-all cursor-pointer"
              >
                {/* Header del paciente */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-calma-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {paciente.foto_perfil ? (
                      <img
                        src={paciente.foto_perfil}
                        alt={paciente.nombre}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-calma-600 font-semibold text-lg">
                        {paciente.nombre.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Nombre y badge */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {paciente.nombre} {paciente.apellido || ''}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{paciente.email}</p>
                    {paciente.estado_emocional && (
                      <div className="mt-2">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
                            obtenerColorEstado(paciente.estado_emocional)
                          )}
                        >
                          {obtenerIconoEstado(paciente.estado_emocional)}
                          {paciente.estado_emocional === 'ESTABLE' && 'Estable'}
                          {paciente.estado_emocional === 'ALERTA' && 'En alerta'}
                          {paciente.estado_emocional === 'CRITICO' && 'Crítico'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progreso */}
                {paciente.progreso !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium text-gray-900">{paciente.progreso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-calma-600 h-2 rounded-full transition-all"
                        style={{ width: `${paciente.progreso}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total citas</p>
                    <p className="font-semibold text-gray-900">{paciente.total_citas}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completadas</p>
                    <p className="font-semibold text-gray-900">{paciente.citas_completadas}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Última cita</p>
                    <p className="font-semibold text-gray-900">{formatearFecha(paciente.ultima_cita)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
