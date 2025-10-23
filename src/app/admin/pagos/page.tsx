'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaMoneyBillWave, FaFilter, FaSearch, FaTimes, FaEye,
  FaCheckCircle, FaTimesCircle, FaClock, FaCreditCard,
  FaPaypal, FaExchangeAlt, FaChevronLeft, FaChevronRight,
  FaDownload, FaUser, FaCalendarAlt, FaExclamationTriangle,
  FaUndo
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import Link from 'next/link';
import CountUp from 'react-countup';

// Tipos
interface Pago {
  id: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'completado' | 'fallido' | 'reembolsado';
  metodo_pago: 'tarjeta' | 'paypal' | 'transferencia';
  descripcion?: string;
  fecha_pago?: string;
  creado_en: string;
  stripe_pago_id?: string;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  suscripcion?: {
    id: string;
    plan: string;
  };
}

const ESTADOS_PAGO = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
  completado: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
  fallido: { label: 'Fallido', color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
  reembolsado: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800', icon: FaUndo }
};

const METODOS_PAGO = {
  tarjeta: { label: 'Tarjeta', icon: FaCreditCard },
  paypal: { label: 'PayPal', icon: FaPaypal },
  transferencia: { label: 'Transferencia', icon: FaExchangeAlt }
};

export default function PaginaPagos() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosFiltrados, setPagosFiltrados] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const pagosPorPagina = 10;

  // Modal
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalIngresos: 0,
    totalPendientes: 0,
    totalCompletados: 0,
    totalFallidos: 0,
    totalReembolsados: 0,
    cantidadPagos: 0
  });

  useEffect(() => {
    verificarAdmin();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [pagos, filtroEstado, filtroMetodo, filtroBusqueda, filtroFechaInicio, filtroFechaFin]);

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
      await cargarPagos();
    } catch (error) {
      console.error('Error al verificar admin:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarPagos = async () => {
    const supabase = obtenerClienteNavegador();
    setCargando(true);

    try {
      const { data: pagosData, error } = await supabase
        .from('Pago')
        .select(`
          id,
          monto,
          moneda,
          estado,
          metodo_pago,
          descripcion,
          fecha_pago,
          creado_en,
          stripe_pago_id,
          usuario:usuario_id (
            id,
            nombre,
            apellido,
            email
          ),
          suscripcion:suscripcion_id (
            id,
            plan
          )
        `)
        .order('creado_en', { ascending: false });

      if (error) throw error;

      const pagosFormateados = pagosData?.map((pago: any) => ({
        id: pago.id,
        monto: parseFloat(pago.monto),
        moneda: pago.moneda,
        estado: pago.estado,
        metodo_pago: pago.metodo_pago,
        descripcion: pago.descripcion,
        fecha_pago: pago.fecha_pago,
        creado_en: pago.creado_en,
        stripe_pago_id: pago.stripe_pago_id,
        usuario: Array.isArray(pago.usuario) ? pago.usuario[0] : pago.usuario,
        suscripcion: Array.isArray(pago.suscripcion) ? pago.suscripcion[0] : pago.suscripcion
      })) || [];

      setPagos(pagosFormateados);
      calcularEstadisticas(pagosFormateados);
    } catch (error: any) {
      console.error('Error cargando pagos:', error);
      toast.error(`Error al cargar pagos: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticas = (pagosData: Pago[]) => {
    const completados = pagosData.filter(p => p.estado === 'completado');
    const pendientes = pagosData.filter(p => p.estado === 'pendiente');
    const fallidos = pagosData.filter(p => p.estado === 'fallido');
    const reembolsados = pagosData.filter(p => p.estado === 'reembolsado');

    setEstadisticas({
      totalIngresos: completados.reduce((sum, p) => sum + p.monto, 0),
      totalPendientes: pendientes.reduce((sum, p) => sum + p.monto, 0),
      totalCompletados: completados.length,
      totalFallidos: fallidos.length,
      totalReembolsados: reembolsados.length,
      cantidadPagos: pagosData.length
    });
  };

  const aplicarFiltros = () => {
    let filtrados = [...pagos];

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter(p => p.estado === filtroEstado);
    }

    // Filtro por método de pago
    if (filtroMetodo !== 'todos') {
      filtrados = filtrados.filter(p => p.metodo_pago === filtroMetodo);
    }

    // Filtro por búsqueda (nombre usuario o email)
    if (filtroBusqueda) {
      const busquedaLower = filtroBusqueda.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.usuario?.nombre?.toLowerCase().includes(busquedaLower) ||
        p.usuario?.apellido?.toLowerCase().includes(busquedaLower) ||
        p.usuario?.email?.toLowerCase().includes(busquedaLower) ||
        p.descripcion?.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por rango de fechas
    if (filtroFechaInicio) {
      filtrados = filtrados.filter(p => new Date(p.creado_en) >= new Date(filtroFechaInicio));
    }
    if (filtroFechaFin) {
      filtrados = filtrados.filter(p => new Date(p.creado_en) <= new Date(filtroFechaFin));
    }

    setPagosFiltrados(filtrados);
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroMetodo('todos');
    setFiltroBusqueda('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  const abrirDetallePago = (pago: Pago) => {
    setPagoSeleccionado(pago);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setPagoSeleccionado(null);
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

  const formatearMonto = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'COP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const exportarPagos = () => {
    // Crear CSV con los datos filtrados
    const headers = ['Fecha', 'Usuario', 'Email', 'Monto', 'Moneda', 'Estado', 'Método', 'Descripción'];
    const rows = pagosFiltrados.map(p => [
      formatearFecha(p.creado_en),
      `${p.usuario?.nombre} ${p.usuario?.apellido}`,
      p.usuario?.email,
      p.monto,
      p.moneda,
      ESTADOS_PAGO[p.estado].label,
      METODOS_PAGO[p.metodo_pago].label,
      p.descripcion || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Pagos exportados exitosamente');
  };

  // Paginación
  const indiceUltimoPago = paginaActual * pagosPorPagina;
  const indicePrimerPago = indiceUltimoPago - pagosPorPagina;
  const pagosActuales = pagosFiltrados.slice(indicePrimerPago, indiceUltimoPago);
  const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Cargando pagos...</p>
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
                    <FaMoneyBillWave className="text-green-600" aria-hidden="true" />
                    Gestión de Pagos
                  </h1>
                </div>
                <p className="text-gray-600 mt-1">
                  Administra todos los pagos y facturación del sistema
                </p>
              </div>
              <button
                onClick={exportarPagos}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                aria-label="Exportar pagos a CSV"
              >
                <FaDownload aria-hidden="true" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              {
                label: 'Ingresos Totales',
                valor: estadisticas.totalIngresos,
                tipo: 'monto',
                color: 'from-green-500 to-green-600',
                icono: FaMoneyBillWave
              },
              {
                label: 'Total Pagos',
                valor: estadisticas.cantidadPagos,
                tipo: 'numero',
                color: 'from-blue-500 to-blue-600',
                icono: FaCalendarAlt
              },
              {
                label: 'Completados',
                valor: estadisticas.totalCompletados,
                tipo: 'numero',
                color: 'from-teal-500 to-teal-600',
                icono: FaCheckCircle
              },
              {
                label: 'Pendientes',
                valor: estadisticas.totalPendientes,
                tipo: 'monto',
                color: 'from-yellow-500 to-yellow-600',
                icono: FaClock
              },
              {
                label: 'Fallidos',
                valor: estadisticas.totalFallidos,
                tipo: 'numero',
                color: 'from-red-500 to-red-600',
                icono: FaTimesCircle
              }
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
                <p className="text-2xl font-bold text-gray-900">
                  {stat.tipo === 'monto' ? (
                    formatearMonto(stat.valor, 'COP')
                  ) : (
                    <CountUp end={stat.valor} duration={2} />
                  )}
                </p>
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
                  Buscar usuario/descripción
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    id="busqueda"
                    type="text"
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                    placeholder="Buscar..."
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
                  <option value="completado">Completado</option>
                  <option value="fallido">Fallido</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>

              {/* Método de pago */}
              <div>
                <label htmlFor="filtro-metodo" className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  id="filtro-metodo"
                  value={filtroMetodo}
                  onChange={(e) => setFiltroMetodo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="paypal">PayPal</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              {/* Fecha Inicio */}
              <div>
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
              <div>
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

          {/* Tabla de pagos */}
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
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
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
                  {pagosActuales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron pagos con los filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    pagosActuales.map((pago, index) => (
                      <motion.tr
                        key={pago.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(pago.creado_en)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaUser className="text-gray-400 mr-2" aria-hidden="true" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {pago.usuario?.nombre} {pago.usuario?.apellido}
                              </div>
                              <div className="text-sm text-gray-500">{pago.usuario?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatearMonto(pago.monto, pago.moneda)}
                          </div>
                          <div className="text-xs text-gray-500">{pago.moneda}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            <METODOS_PAGO[pago.metodo_pago].icon className="text-xs" aria-hidden="true" />
                            {METODOS_PAGO[pago.metodo_pago].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${ESTADOS_PAGO[pago.estado].color}`}>
                            <ESTADOS_PAGO[pago.estado].icon className="text-xs" aria-hidden="true" />
                            {ESTADOS_PAGO[pago.estado].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => abrirDetallePago(pago)}
                            className="text-teal-600 hover:text-teal-900 transition-colors flex items-center gap-1"
                            aria-label={`Ver detalles del pago de ${pago.usuario?.nombre}`}
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
                  Mostrando <span className="font-medium">{indicePrimerPago + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(indiceUltimoPago, pagosFiltrados.length)}</span> de{' '}
                  <span className="font-medium">{pagosFiltrados.length}</span> pagos
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
        {mostrarModal && pagoSeleccionado && (
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
                    Detalles del Pago
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
                  {/* ID del pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID del Pago</label>
                    <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">{pagoSeleccionado.id}</p>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${ESTADOS_PAGO[pagoSeleccionado.estado].color}`}>
                      <ESTADOS_PAGO[pagoSeleccionado.estado].icon aria-hidden="true" />
                      {ESTADOS_PAGO[pagoSeleccionado.estado].label}
                    </span>
                  </div>

                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                    <p className="text-3xl font-bold text-green-600">
                      {formatearMonto(pagoSeleccionado.monto, pagoSeleccionado.moneda)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Moneda: {pagoSeleccionado.moneda}</p>
                  </div>

                  {/* Usuario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                      <FaUser className="text-gray-400" aria-hidden="true" />
                      <div>
                        <p className="text-gray-900 font-medium">
                          {pagoSeleccionado.usuario?.nombre} {pagoSeleccionado.usuario?.apellido}
                        </p>
                        <p className="text-sm text-gray-500">{pagoSeleccionado.usuario?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Método de pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800">
                      <METODOS_PAGO[pagoSeleccionado.metodo_pago].icon aria-hidden="true" />
                      {METODOS_PAGO[pagoSeleccionado.metodo_pago].label}
                    </span>
                  </div>

                  {/* Stripe ID */}
                  {pagoSeleccionado.stripe_pago_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Payment ID</label>
                      <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded break-all">
                        {pagoSeleccionado.stripe_pago_id}
                      </p>
                    </div>
                  )}

                  {/* Suscripción */}
                  {pagoSeleccionado.suscripcion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Suscripción</label>
                      <p className="text-gray-900">Plan: <span className="font-medium capitalize">{pagoSeleccionado.suscripcion.plan}</span></p>
                    </div>
                  )}

                  {/* Descripción */}
                  {pagoSeleccionado.descripcion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{pagoSeleccionado.descripcion}</p>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                      <p className="text-gray-900 text-sm">{formatearFecha(pagoSeleccionado.creado_en)}</p>
                    </div>
                    {pagoSeleccionado.fecha_pago && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
                        <p className="text-gray-900 text-sm">{formatearFecha(pagoSeleccionado.fecha_pago)}</p>
                      </div>
                    )}
                  </div>
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
