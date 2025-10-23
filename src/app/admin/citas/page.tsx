'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalendarAlt, FaFilter, FaSearch, FaTimes, FaEye,
  FaCheckCircle, FaTimesCircle, FaClock, FaVideo,
  FaMapMarkerAlt, FaUserMd, FaUser, FaChevronLeft,
  FaChevronRight, FaDownload, FaEdit
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import Link from 'next/link';

// Tipos
interface Cita {
  id: string;
  fecha_hora: string;
  duracion: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  modalidad: 'virtual' | 'presencial';
  link_videollamada?: string;
  motivo_consulta?: string;
  notas_paciente?: string;
  notas_profesional?: string;
  cancelada_en?: string;
  motivo_cancelacion?: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  profesional: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
}

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800', icon: FaCheckCircle },
  completada: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
  no_asistio: { label: 'No asistió', color: 'bg-gray-100 text-gray-800', icon: FaTimes }
};

export default function PaginaCitas() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasFiltradas, setCitasFiltradas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'calendario'>('tabla');

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const citasPorPagina = 10;

  // Modal
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0,
    noAsistio: 0
  });

  useEffect(() => {
    verificarAdmin();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, filtroEstado, filtroModalidad, filtroBusqueda, filtroFechaInicio, filtroFechaFin]);

  const verificarAdmin = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      const { data: usuarioData, error } = await supabase
        .from('Usuario')
        .select('id, email, nombre, rol')
        .eq('auth_id', session.user.id)
        .single();

      if (error || !usuarioData || usuarioData.rol !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setUsuario(usuarioData);
      await cargarCitas();
    } catch (error) {
      console.error('Error al verificar admin:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarCitas = async () => {
    const supabase = obtenerClienteNavegador();
    setCargando(true);

    try {
      const { data: citasData, error } = await supabase
        .from('Cita')
        .select(`
          id,
          fecha_hora,
          duracion,
          estado,
          modalidad,
          link_videollamada,
          motivo_consulta,
          notas_paciente,
          notas_profesional,
          cancelada_en,
          motivo_cancelacion,
          paciente:paciente_id (
            id,
            nombre,
            apellido,
            email
          ),
          profesional:profesional_id (
            id,
            nombre,
            apellido,
            email
          )
        `)
        .order('fecha_hora', { ascending: false });

      if (error) throw error;

      const citasFormateadas = citasData?.map((cita: any) => ({
        id: cita.id,
        fecha_hora: cita.fecha_hora,
        duracion: cita.duracion,
        estado: cita.estado,
        modalidad: cita.modalidad,
        link_videollamada: cita.link_videollamada,
        motivo_consulta: cita.motivo_consulta,
        notas_paciente: cita.notas_paciente,
        notas_profesional: cita.notas_profesional,
        cancelada_en: cita.cancelada_en,
        motivo_cancelacion: cita.motivo_cancelacion,
        paciente: Array.isArray(cita.paciente) ? cita.paciente[0] : cita.paciente,
        profesional: Array.isArray(cita.profesional) ? cita.profesional[0] : cita.profesional
      })) || [];

      setCitas(citasFormateadas);
      calcularEstadisticas(citasFormateadas);
    } catch (error: any) {
      console.error('Error cargando citas:', error);
      toast.error(`Error al cargar citas: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticas = (citasData: Cita[]) => {
    setEstadisticas({
      total: citasData.length,
      pendientes: citasData.filter(c => c.estado === 'pendiente').length,
      confirmadas: citasData.filter(c => c.estado === 'confirmada').length,
      completadas: citasData.filter(c => c.estado === 'completada').length,
      canceladas: citasData.filter(c => c.estado === 'cancelada').length,
      noAsistio: citasData.filter(c => c.estado === 'no_asistio').length
    });
  };

  const aplicarFiltros = () => {
    let filtradas = [...citas];

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(c => c.estado === filtroEstado);
    }

    // Filtro por modalidad
    if (filtroModalidad !== 'todos') {
      filtradas = filtradas.filter(c => c.modalidad === filtroModalidad);
    }

    // Filtro por búsqueda (nombre paciente/profesional)
    if (filtroBusqueda) {
      const busquedaLower = filtroBusqueda.toLowerCase();
      filtradas = filtradas.filter(c =>
        c.paciente.nombre.toLowerCase().includes(busquedaLower) ||
        c.paciente.apellido.toLowerCase().includes(busquedaLower) ||
        c.profesional.nombre.toLowerCase().includes(busquedaLower) ||
        c.profesional.apellido.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por rango de fechas
    if (filtroFechaInicio) {
      filtradas = filtradas.filter(c => new Date(c.fecha_hora) >= new Date(filtroFechaInicio));
    }
    if (filtroFechaFin) {
      filtradas = filtradas.filter(c => new Date(c.fecha_hora) <= new Date(filtroFechaFin));
    }

    setCitasFiltradas(filtradas);
    setPaginaActual(1); // Reset a primera página cuando se filtran
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroModalidad('todos');
    setFiltroBusqueda('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  const abrirDetalleCita = (cita: Cita) => {
    setCitaSeleccionada(cita);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setCitaSeleccionada(null);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Paginación
  const indiceUltimaCita = paginaActual * citasPorPagina;
  const indicePrimeraCita = indiceUltimaCita - citasPorPagina;
  const citasActuales = citasFiltradas.slice(indicePrimeraCita, indiceUltimaCita);
  const totalPaginas = Math.ceil(citasFiltradas.length / citasPorPagina);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Cargando citas...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Volver al dashboard"
                  >
                    <FaChevronLeft className="text-xl" />
                  </Link>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FaCalendarAlt className="text-teal-600" aria-hidden="true" />
                    Gestión de Citas
                  </h1>
                </div>
                <p className="text-gray-600 mt-1">
                  Administra todas las citas entre pacientes y profesionales
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total', valor: estadisticas.total, color: 'from-gray-500 to-gray-600', icono: FaCalendarAlt },
              { label: 'Pendientes', valor: estadisticas.pendientes, color: 'from-yellow-500 to-yellow-600', icono: FaClock },
              { label: 'Confirmadas', valor: estadisticas.confirmadas, color: 'from-blue-500 to-blue-600', icono: FaCheckCircle },
              { label: 'Completadas', valor: estadisticas.completadas, color: 'from-green-500 to-green-600', icono: FaCheckCircle },
              { label: 'Canceladas', valor: estadisticas.canceladas, color: 'from-red-500 to-red-600', icono: FaTimesCircle },
              { label: 'No asistieron', valor: estadisticas.noAsistio, color: 'from-gray-400 to-gray-500', icono: FaTimes }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} w-fit mb-2`}>
                  <stat.icono className="text-white text-xl" aria-hidden="true" />
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.valor}</p>
              </motion.div>
            ))}
          </div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaFilter className="text-teal-600" aria-hidden="true" />
                Filtros
              </h2>
              <button
                onClick={limpiarFiltros}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                aria-label="Limpiar todos los filtros"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Búsqueda */}
              <div className="lg:col-span-2">
                <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar paciente/profesional
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    id="busqueda"
                    type="text"
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="filtro-estado" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="filtro-estado"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="no_asistio">No asistió</option>
                </select>
              </div>

              {/* Modalidad */}
              <div>
                <label htmlFor="filtro-modalidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidad
                </label>
                <select
                  id="filtro-modalidad"
                  value={filtroModalidad}
                  onChange={(e) => setFiltroModalidad(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="todos">Todas</option>
                  <option value="virtual">Virtual</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>

              {/* Fecha Inicio */}
              <div className="lg:col-span-1">
                <label htmlFor="fecha-inicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  id="fecha-inicio"
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Fecha Fin */}
              <div className="lg:col-span-1">
                <label htmlFor="fecha-fin" className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  id="fecha-fin"
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Tabla de citas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profesional
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modalidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {citasActuales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron citas con los filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    citasActuales.map((cita, index) => (
                      <motion.tr
                        key={cita.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(cita.fecha_hora)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaUser className="text-gray-400 mr-2" aria-hidden="true" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {cita.paciente.nombre} {cita.paciente.apellido}
                              </div>
                              <div className="text-sm text-gray-500">{cita.paciente.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaUserMd className="text-teal-600 mr-2" aria-hidden="true" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {cita.profesional.nombre} {cita.profesional.apellido}
                              </div>
                              <div className="text-sm text-gray-500">{cita.profesional.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {cita.modalidad === 'virtual' ? (
                              <>
                                <FaVideo aria-hidden="true" />
                                Virtual
                              </>
                            ) : (
                              <>
                                <FaMapMarkerAlt aria-hidden="true" />
                                Presencial
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${ESTADOS[cita.estado].color}`}>
                            <ESTADOS[cita.estado].icon className="text-xs" aria-hidden="true" />
                            {ESTADOS[cita.estado].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => abrirDetalleCita(cita)}
                            className="text-teal-600 hover:text-teal-900 transition-colors flex items-center gap-1"
                            aria-label={`Ver detalles de la cita de ${cita.paciente.nombre} ${cita.paciente.apellido}`}
                          >
                            <FaEye aria-hidden="true" />
                            Ver detalles
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{indicePrimeraCita + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(indiceUltimaCita, citasFiltradas.length)}</span> de{' '}
                  <span className="font-medium">{citasFiltradas.length}</span> citas
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modal de Detalle */}
      <AnimatePresence>
        {mostrarModal && citaSeleccionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={cerrarModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-labelledby="modal-titulo"
              aria-modal="true"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 id="modal-titulo" className="text-2xl font-bold text-gray-900">
                    Detalles de la Cita
                  </h2>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Cerrar modal"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${ESTADOS[citaSeleccionada.estado].color}`}>
                      <ESTADOS[citaSeleccionada.estado].icon aria-hidden="true" />
                      {ESTADOS[citaSeleccionada.estado].label}
                    </span>
                  </div>

                  {/* Fecha y hora */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                    <p className="text-gray-900">{formatearFecha(citaSeleccionada.fecha_hora)}</p>
                    <p className="text-sm text-gray-500">Duración: {citaSeleccionada.duracion} minutos</p>
                  </div>

                  {/* Paciente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-400" aria-hidden="true" />
                      <div>
                        <p className="text-gray-900 font-medium">
                          {citaSeleccionada.paciente.nombre} {citaSeleccionada.paciente.apellido}
                        </p>
                        <p className="text-sm text-gray-500">{citaSeleccionada.paciente.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profesional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                    <div className="flex items-center gap-2">
                      <FaUserMd className="text-teal-600" aria-hidden="true" />
                      <div>
                        <p className="text-gray-900 font-medium">
                          {citaSeleccionada.profesional.nombre} {citaSeleccionada.profesional.apellido}
                        </p>
                        <p className="text-sm text-gray-500">{citaSeleccionada.profesional.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Modalidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800">
                      {citaSeleccionada.modalidad === 'virtual' ? (
                        <>
                          <FaVideo aria-hidden="true" />
                          Virtual
                        </>
                      ) : (
                        <>
                          <FaMapMarkerAlt aria-hidden="true" />
                          Presencial
                        </>
                      )}
                    </span>
                  </div>

                  {/* Link de videollamada */}
                  {citaSeleccionada.link_videollamada && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link de Videollamada</label>
                      <a
                        href={citaSeleccionada.link_videollamada}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 underline break-all"
                      >
                        {citaSeleccionada.link_videollamada}
                      </a>
                    </div>
                  )}

                  {/* Motivo */}
                  {citaSeleccionada.motivo_consulta && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Consulta</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{citaSeleccionada.motivo_consulta}</p>
                    </div>
                  )}

                  {/* Notas del paciente */}
                  {citaSeleccionada.notas_paciente && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notas del Paciente</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{citaSeleccionada.notas_paciente}</p>
                    </div>
                  )}

                  {/* Notas del profesional */}
                  {citaSeleccionada.notas_profesional && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notas del Profesional</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{citaSeleccionada.notas_profesional}</p>
                    </div>
                  )}

                  {/* Cancelación */}
                  {citaSeleccionada.estado === 'cancelada' && citaSeleccionada.motivo_cancelacion && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-red-700 mb-1">Motivo de Cancelación</label>
                      <p className="text-red-900">{citaSeleccionada.motivo_cancelacion}</p>
                      {citaSeleccionada.cancelada_en && (
                        <p className="text-sm text-red-600 mt-1">
                          Cancelada el {formatearFecha(citaSeleccionada.cancelada_en)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={cerrarModal}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
