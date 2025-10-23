'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Video,
  Building2,
  Filter,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';

interface Cita {
  id: string;
  fecha_hora: string;
  duracion: number;
  modalidad: 'VIRTUAL' | 'PRESENCIAL';
  estado: string;
  paciente: {
    nombre: string;
    apellido: string;
  };
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ESTADOS_CITA = [
  { value: 'TODOS', label: 'Todos los estados', color: 'gray' },
  { value: 'PENDIENTE', label: 'Pendiente', color: 'yellow' },
  { value: 'CONFIRMADA', label: 'Confirmada', color: 'green' },
  { value: 'COMPLETADA', label: 'Completada', color: 'blue' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'red' },
];

/**
 * Página de Calendario del Profesional
 *
 * Vista de calendario mensual con todas las citas agendadas
 * Permite al profesional ver su agenda completa y los detalles de cada cita
 */
export default function PaginaCalendarioProfesional() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const [fechaActual, setFechaActual] = useState(new Date());
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasFiltradas, setCitasFiltradas] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [cargando, setCargando] = useState(true);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroModalidad, setFiltroModalidad] = useState<'TODAS' | 'VIRTUAL' | 'PRESENCIAL'>('TODAS');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  useEffect(() => {
    if (profesionalId) {
      cargarCitas();
    }
  }, [profesionalId, fechaActual]);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, filtroEstado, filtroModalidad]);

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

  const cargarCitas = async () => {
    if (!profesionalId) return;

    try {
      setCargando(true);

      // Obtener primer y último día del mes actual
      const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('Cita')
        .select(`
          id,
          fecha_hora,
          duracion,
          modalidad,
          estado,
          paciente_id,
          paciente:paciente_id (
            nombre,
            apellido
          )
        `)
        .eq('profesional_id', profesionalId)
        .gte('fecha_hora', primerDia.toISOString())
        .lte('fecha_hora', ultimoDia.toISOString())
        .order('fecha_hora', { ascending: true });

      if (error) throw error;

      const citasFormateadas = (data || []).map((cita: any) => ({
        id: cita.id,
        fecha_hora: cita.fecha_hora,
        duracion: cita.duracion,
        modalidad: cita.modalidad,
        estado: cita.estado,
        paciente: {
          nombre: cita.paciente?.nombre || 'Desconocido',
          apellido: cita.paciente?.apellido || '',
        },
      }));

      setCitas(citasFormateadas);
    } catch (error: any) {
      console.error('Error cargando citas:', error);
      toast.error('No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...citas];

    if (filtroEstado !== 'TODOS') {
      resultado = resultado.filter((cita) => cita.estado === filtroEstado);
    }

    if (filtroModalidad !== 'TODAS') {
      resultado = resultado.filter((cita) => cita.modalidad === filtroModalidad);
    }

    setCitasFiltradas(resultado);
  };

  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  };

  const hoy = () => {
    setFechaActual(new Date());
  };

  const obtenerDiasDelMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);

    const diasAnteriores = primerDia.getDay();
    const diasMes = ultimoDia.getDate();

    const dias: (Date | null)[] = [];

    // Días del mes anterior
    for (let i = 0; i < diasAnteriores; i++) {
      dias.push(null);
    }

    // Días del mes actual
    for (let i = 1; i <= diasMes; i++) {
      dias.push(new Date(año, mes, i));
    }

    return dias;
  };

  const obtenerCitasPorDia = (fecha: Date | null) => {
    if (!fecha) return [];

    return citasFiltradas.filter((cita) => {
      const fechaCita = new Date(cita.fecha_hora);
      return (
        fechaCita.getDate() === fecha.getDate() &&
        fechaCita.getMonth() === fecha.getMonth() &&
        fechaCita.getFullYear() === fecha.getFullYear()
      );
    });
  };

  const formatearHora = (fechaHora: string) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const esHoy = (fecha: Date | null) => {
    if (!fecha) return false;
    const hoy = new Date();
    return (
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()
    );
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-500';
      case 'CONFIRMADA':
        return 'bg-green-500';
      case 'COMPLETADA':
        return 'bg-blue-500';
      case 'CANCELADA':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Clock className="w-4 h-4" />;
      case 'CONFIRMADA':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'COMPLETADA':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'CANCELADA':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const dias = obtenerDiasDelMes();

  // Calcular estadísticas
  const totalCitas = citasFiltradas.length;
  const citasHoy = citasFiltradas.filter((cita) => {
    const fecha = new Date(cita.fecha_hora);
    const hoy = new Date();
    return (
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()
    );
  }).length;
  const citasPendientes = citasFiltradas.filter((c) => c.estado === 'PENDIENTE').length;
  const citasVirtuales = citasFiltradas.filter((c) => c.modalidad === 'VIRTUAL').length;

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
            <CalendarIcon className="w-8 h-8 text-calma-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-gray-700 text-lg font-medium">Cargando calendario...</p>
          <p className="text-gray-500 text-sm mt-2">Preparando tus citas</p>
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
                  <CalendarIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold tracking-tight"
                  >
                    Mi Calendario
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-base md:text-lg mt-1"
                  >
                    Gestiona tus citas y disponibilidad
                  </motion.p>
                </div>
              </div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="px-6 py-3.5 bg-white text-calma-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-white/50 flex items-center gap-2 group"
            >
              <Filter className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Filtros</span>
            </motion.button>
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
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Citas</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCitas}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-esperanza-500 to-esperanza-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{citasHoy}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{citasPendientes}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-serenidad-500 to-serenidad-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Virtuales</p>
                  <p className="text-2xl font-bold text-gray-900">{citasVirtuales}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filtros expandibles */}
          <AnimatePresence>
            {mostrarFiltros && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
                  <button
                    onClick={() => setMostrarFiltros(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estado de la cita
                    </label>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                    >
                      {ESTADOS_CITA.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Modalidad
                    </label>
                    <select
                      value={filtroModalidad}
                      onChange={(e) => setFiltroModalidad(e.target.value as any)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                    >
                      <option value="TODAS">Todas las modalidades</option>
                      <option value="VIRTUAL">Virtual</option>
                      <option value="PRESENCIAL">Presencial</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selector de mes */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <motion.button
                onClick={mesAnterior}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-calma-50 rounded-xl transition-all"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </motion.button>

              <div className="flex items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {MESES[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                </h2>
                <motion.button
                  onClick={hoy}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-calma-600 text-white rounded-xl hover:bg-calma-700 font-semibold text-sm transition-all"
                >
                  Hoy
                </motion.button>
              </div>

              <motion.button
                onClick={mesSiguiente}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-calma-50 rounded-xl transition-all"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </motion.button>
            </div>
          </motion.div>

          {/* Calendario */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
          >
            {/* Encabezado de días */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={dia}
                  className="text-center font-bold text-gray-700 text-sm py-3 bg-gradient-to-br from-calma-50 to-esperanza-50 rounded-xl"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-2">
              {dias.map((fecha, index) => {
                const citasDelDia = obtenerCitasPorDia(fecha);
                const esHoyDia = esHoy(fecha);

                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className={clsx(
                      'min-h-[120px] p-3 rounded-xl border-2 transition-all cursor-pointer',
                      fecha
                        ? esHoyDia
                          ? 'bg-gradient-to-br from-calma-50 to-esperanza-50 border-calma-600 shadow-lg'
                          : 'bg-white border-gray-200 hover:border-calma-300 hover:shadow-md'
                        : 'bg-gray-50 border-transparent'
                    )}
                  >
                    {fecha && (
                      <>
                        {/* Número del día */}
                        <div
                          className={clsx(
                            'text-sm font-bold mb-2 flex items-center justify-between',
                            esHoyDia ? 'text-calma-700' : 'text-gray-700'
                          )}
                        >
                          <span>{fecha.getDate()}</span>
                          {citasDelDia.length > 0 && (
                            <span className="text-xs bg-calma-600 text-white px-2 py-1 rounded-full">
                              {citasDelDia.length}
                            </span>
                          )}
                        </div>

                        {/* Citas del día */}
                        <div className="space-y-1">
                          {citasDelDia.slice(0, 2).map((cita) => (
                            <motion.button
                              key={cita.id}
                              onClick={() => setCitaSeleccionada(cita)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-full text-left px-2 py-1.5 ${obtenerColorEstado(cita.estado)} text-white text-xs rounded-lg shadow-md truncate flex items-center gap-1`}
                            >
                              {cita.modalidad === 'VIRTUAL' ? (
                                <Video className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {formatearHora(cita.fecha_hora)} {cita.paciente.nombre}
                              </span>
                            </motion.button>
                          ))}
                          {citasDelDia.length > 2 && (
                            <div className="text-xs text-gray-600 text-center font-medium">
                              +{citasDelDia.length - 2} más
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Leyenda */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
          >
            <h3 className="font-bold text-gray-900 mb-4">Leyenda</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ESTADOS_CITA.filter((e) => e.value !== 'TODOS').map((estado) => (
                <div key={estado.value} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${obtenerColorEstado(estado.value)} rounded`} />
                  <span className="text-sm text-gray-700">{estado.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Modal de detalle de cita */}
      <AnimatePresence>
        {citaSeleccionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setCitaSeleccionada(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Detalle de Cita</h3>
                <button
                  onClick={() => setCitaSeleccionada(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-calma-50 rounded-xl">
                  <User className="w-5 h-5 text-calma-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Paciente</p>
                    <p className="font-bold text-gray-900">
                      {citaSeleccionada.paciente.nombre} {citaSeleccionada.paciente.apellido}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-esperanza-50 rounded-xl">
                  <CalendarIcon className="w-5 h-5 text-esperanza-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Fecha y hora</p>
                    <p className="font-bold text-gray-900">
                      {new Date(citaSeleccionada.fecha_hora).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="font-bold text-gray-900">
                      {formatearHora(citaSeleccionada.fecha_hora)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Duración</p>
                    <p className="font-bold text-gray-900">{citaSeleccionada.duracion} minutos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-serenidad-50 rounded-xl">
                  {citaSeleccionada.modalidad === 'VIRTUAL' ? (
                    <Video className="w-5 h-5 text-serenidad-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Building2 className="w-5 h-5 text-serenidad-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Modalidad</p>
                    <p className="font-bold text-gray-900">
                      {citaSeleccionada.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
                  {obtenerIconoEstado(citaSeleccionada.estado)}
                  <span className="font-bold text-gray-900">
                    Estado: {citaSeleccionada.estado}
                  </span>
                </div>
              </div>

              <motion.button
                onClick={() => setCitaSeleccionada(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-calma-600 to-esperanza-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Cerrar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
