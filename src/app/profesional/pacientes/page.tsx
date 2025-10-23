'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowUpDown,
  Calendar,
  Activity,
  TrendingUp,
  Grid3x3,
  List,
  User,
  Eye,
  BarChart3,
} from 'lucide-react';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import { obtenerPacientesProfesional, type PacienteConDatos } from '@/lib/supabase/queries/profesional';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';

type FiltroEstado = 'TODOS' | 'ESTABLE' | 'ALERTA' | 'CRITICO';
type OrdenarPor = 'nombre' | 'ultimaCita' | 'progreso' | 'totalCitas';
type VistaType = 'cards' | 'tabla';

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
  const [vista, setVista] = useState<VistaType>('cards');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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
      const { data: { user } } = await supabase.auth.getUser();

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

      if (error || !userData || (userData.rol !== 'TERAPEUTA' && userData.rol !== 'ADMIN')) {
        toast.error('No tienes permisos para acceder a esta página');
        router.push('/dashboard');
        return;
      }

      setProfesionalId(userData.id);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      toast.error('Error de autenticación');
      router.push('/iniciar-sesion');
    }
  };

  const cargarPacientes = async () => {
    if (!profesionalId) return;

    try {
      setCargando(true);
      const { data, error } = await obtenerPacientesProfesional(profesionalId);

      if (error) {
        console.error('Error obteniendo pacientes:', error);
        toast.error('Error al cargar los pacientes');
        return;
      }

      setPacientes(data || []);
    } catch (error) {
      console.error('Error inesperado:', error);
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
        return <CheckCircle className="w-4 h-4" />;
      case 'ALERTA':
        return <AlertTriangle className="w-4 h-4" />;
      case 'CRITICO':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
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

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calma-50/50 via-white to-esperanza-50/50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 border-4 border-calma-200 border-t-calma-600 rounded-full animate-spin" />
            <Users className="w-8 h-8 text-calma-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-gray-700 text-lg font-medium">Cargando pacientes...</p>
          <p className="text-gray-500 text-sm mt-2">Preparando información</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calma-50/50 via-white to-esperanza-50/50">
      <Toaster position="top-right" />

      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-r from-calma-600 via-calma-500 to-esperanza-500 text-white shadow-2xl overflow-hidden"
      >
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Users className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold tracking-tight"
                  >
                    Mis Pacientes
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-base md:text-lg mt-1"
                  >
                    Gestiona y monitorea a tus pacientes
                  </motion.p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setVista(vista === 'cards' ? 'tabla' : 'cards')}
                className="px-6 py-3.5 bg-white text-calma-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-white/50 flex items-center gap-2 group"
              >
                {vista === 'cards' ? (
                  <List className="w-5 h-5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Grid3x3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                <span>{vista === 'cards' ? 'Tabla' : 'Cards'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-calma-500 to-calma-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Pacientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-green-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Estables</p>
                  <p className="text-2xl font-bold text-green-900">{stats.estables}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-yellow-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-yellow-700 font-medium">En Alerta</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.alertas}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-700 font-medium">Críticos</p>
                  <p className="text-2xl font-bold text-red-900">{stats.criticos}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filtros y búsqueda */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                  />
                </div>
              </div>

              {/* Filtro por estado */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="ESTABLE">Estables</option>
                  <option value="ALERTA">En alerta</option>
                  <option value="CRITICO">Críticos</option>
                </select>
              </div>

              {/* Ordenar */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-gray-400" />
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value as OrdenarPor)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                >
                  <option value="ultimaCita">Última cita</option>
                  <option value="nombre">Nombre</option>
                  <option value="progreso">Progreso</option>
                  <option value="totalCitas">Total de citas</option>
                </select>
                <motion.button
                  onClick={() => setOrdenAscendente(!ordenAscendente)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 hover:bg-calma-50 rounded-xl transition-all"
                  title={ordenAscendente ? 'Orden ascendente' : 'Orden descendente'}
                >
                  <ArrowUpDown className={clsx('w-5 h-5 transition-transform', ordenAscendente && 'rotate-180')} />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Lista de pacientes */}
          {pacientesFiltrados.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center"
            >
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron pacientes</h3>
              <p className="text-gray-600">
                {busqueda || filtroEstado !== 'TODOS'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no tienes pacientes asignados'}
              </p>
            </motion.div>
          ) : vista === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {pacientesFiltrados.map((paciente) => (
                  <motion.div
                    key={paciente.id}
                    variants={itemVariants}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    onClick={() => router.push(`/pacientes/${paciente.id}/progreso`)}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl hover:border-calma-300 transition-all cursor-pointer group"
                  >
                    {/* Header del paciente */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-calma-500 to-esperanza-600 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-calma-100 group-hover:ring-calma-200 transition-all shadow-lg">
                        {paciente.foto_perfil ? (
                          <img
                            src={paciente.foto_perfil}
                            alt={paciente.nombre}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {paciente.nombre.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Nombre y badge */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-lg">
                          {paciente.nombre} {paciente.apellido || ''}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{paciente.email}</p>
                        {paciente.estado_emocional && (
                          <div className="mt-2">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border-2 shadow-sm',
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
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 font-medium flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Progreso
                          </span>
                          <span className="font-bold text-gray-900">{paciente.progreso}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${paciente.progreso}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="bg-gradient-to-r from-calma-500 to-esperanza-500 h-full rounded-full shadow-inner"
                          />
                        </div>
                      </div>
                    )}

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Total citas</p>
                        <p className="text-lg font-bold text-gray-900">{paciente.total_citas}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Completadas</p>
                        <p className="text-lg font-bold text-gray-900">{paciente.citas_completadas}</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Última cita
                        </p>
                        <p className="text-sm font-bold text-gray-900">{formatearFecha(paciente.ultima_cita)}</p>
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-calma-600 to-esperanza-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalle
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Vista de tabla */
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-calma-50 to-esperanza-50 border-b-2 border-calma-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Paciente</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Progreso</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Citas</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Última cita</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <AnimatePresence mode="popLayout">
                      {pacientesFiltrados.map((paciente, index) => (
                        <motion.tr
                          key={paciente.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-calma-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-calma-500 to-esperanza-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                                {paciente.foto_perfil ? (
                                  <img
                                    src={paciente.foto_perfil}
                                    alt={paciente.nombre}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-semibold text-sm">
                                    {paciente.nombre.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {paciente.nombre} {paciente.apellido || ''}
                                </p>
                                <p className="text-sm text-gray-600">{paciente.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {paciente.estado_emocional && (
                              <span
                                className={clsx(
                                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border-2',
                                  obtenerColorEstado(paciente.estado_emocional)
                                )}
                              >
                                {obtenerIconoEstado(paciente.estado_emocional)}
                                {paciente.estado_emocional === 'ESTABLE' && 'Estable'}
                                {paciente.estado_emocional === 'ALERTA' && 'En alerta'}
                                {paciente.estado_emocional === 'CRITICO' && 'Crítico'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-32">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Progreso</span>
                                <span className="font-semibold text-gray-900">{paciente.progreso || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-calma-500 to-esperanza-500 h-full rounded-full"
                                  style={{ width: `${paciente.progreso || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-semibold text-gray-900">{paciente.citas_completadas}/{paciente.total_citas}</p>
                              <p className="text-gray-600">completadas</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{formatearFecha(paciente.ultima_cita)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push(`/pacientes/${paciente.id}/progreso`)}
                              className="px-4 py-2 bg-gradient-to-r from-calma-600 to-esperanza-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
