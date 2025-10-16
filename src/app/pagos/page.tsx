'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaSpinner, FaCheckCircle, FaExclamationCircle,
  FaTimesCircle, FaClock, FaDownload, FaCreditCard, FaPaypal,
  FaMoneyBillWave, FaFilter, FaTimes
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { useUsuario, usePerfilUsuario } from '../../lib/supabase/hooks';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface Pago {
  id: string;
  usuario_id: string;
  monto: number;
  moneda: 'COP' | 'USD';
  estado: 'pendiente' | 'completado' | 'fallido' | 'cancelado';
  metodo: 'stripe' | 'paypal' | 'transferencia';
  id_transaccion_externa: string | null;
  descripcion: string | null;
  creado_en: string;
}

export default function PaginaHistorialPagos() {
  const router = useRouter();
  const { usuario: authUsuario, cargando: cargandoAuth } = useUsuario();
  const { perfil } = usePerfilUsuario();
  const supabase = obtenerClienteNavegador();

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosFiltrados, setPagosFiltrados] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    if (!cargandoAuth && !authUsuario) {
      router.push('/iniciar-sesion');
    }
  }, [authUsuario, cargandoAuth, router]);

  useEffect(() => {
    if (perfil?.id) {
      cargarHistorial();
    }
  }, [perfil?.id]);

  useEffect(() => {
    aplicarFiltros();
  }, [pagos, filtroEstado, filtroMetodo]);

  const cargarHistorial = async () => {
    if (!perfil?.id) return;

    try {
      setCargando(true);

      const { data, error } = await supabase
        .from('Pago')
        .select('*')
        .eq('usuario_id', perfil.id)
        .order('creado_en', { ascending: false });

      if (error) throw error;

      setPagos(data || []);
    } catch (error) {
      console.error('Error al cargar historial de pagos:', error);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...pagos];

    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter(p => p.estado === filtroEstado);
    }

    if (filtroMetodo !== 'todos') {
      filtrados = filtrados.filter(p => p.metodo === filtroMetodo);
    }

    setPagosFiltrados(filtrados);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroMetodo('todos');
  };

  const formatearPrecio = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  const obtenerColorEstado = (estado: string) => {
    const colores = {
      'completado': 'bg-green-100 text-green-800 border-green-200',
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'fallido': 'bg-red-100 text-red-800 border-red-200',
      'cancelado': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colores[estado as keyof typeof colores] || colores.pendiente;
  };

  const obtenerIconoEstado = (estado: string) => {
    const iconos = {
      'completado': <FaCheckCircle className="text-green-600" />,
      'pendiente': <FaClock className="text-yellow-600" />,
      'fallido': <FaTimesCircle className="text-red-600" />,
      'cancelado': <FaExclamationCircle className="text-gray-600" />,
    };
    return iconos[estado as keyof typeof iconos] || iconos.pendiente;
  };

  const obtenerIconoMetodo = (metodo: string) => {
    const iconos = {
      'stripe': <FaCreditCard className="text-blue-600" />,
      'paypal': <FaPaypal className="text-blue-800" />,
      'transferencia': <FaMoneyBillWave className="text-green-600" />,
    };
    return iconos[metodo as keyof typeof iconos] || iconos.stripe;
  };

  const obtenerTextoEstado = (estado: string) => {
    const textos = {
      'completado': 'Completado',
      'pendiente': 'Pendiente',
      'fallido': 'Fallido',
      'cancelado': 'Cancelado',
    };
    return textos[estado as keyof typeof textos] || estado;
  };

  const obtenerTextoMetodo = (metodo: string) => {
    const textos = {
      'stripe': 'Tarjeta de crédito/débito',
      'paypal': 'PayPal',
      'transferencia': 'Transferencia bancaria',
    };
    return textos[metodo as keyof typeof textos] || metodo;
  };

  const calcularTotal = (estado?: string) => {
    const pagosRelevantes = estado
      ? pagos.filter(p => p.estado === estado)
      : pagos.filter(p => p.estado === 'completado');

    const totalCOP = pagosRelevantes
      .filter(p => p.moneda === 'COP')
      .reduce((sum, p) => sum + p.monto, 0);

    const totalUSD = pagosRelevantes
      .filter(p => p.moneda === 'USD')
      .reduce((sum, p) => sum + p.monto, 0);

    return { totalCOP, totalUSD };
  };

  const tienesFiltrosActivos = filtroEstado !== 'todos' || filtroMetodo !== 'todos';
  const { totalCOP, totalUSD } = calcularTotal();

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="h-16 w-16 text-teal-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando historial de pagos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Navegacion />

      <div className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaArrowLeft className="text-teal-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Historial de Pagos</h1>
                <p className="text-gray-600 text-lg">
                  {pagos.length} transacción{pagos.length !== 1 ? 'es' : ''} registrada{pagos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`px-6 py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 ${
                tienesFiltrosActivos
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              <FaFilter />
              Filtros
              {tienesFiltrosActivos && (
                <span className="bg-white text-teal-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {(filtroEstado !== 'todos' ? 1 : 0) + (filtroMetodo !== 'todos' ? 1 : 0)}
                </span>
              )}
            </motion.button>
          </div>

          {/* Estadísticas Rápidas */}
          {pagos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Total Pagado (COP)</span>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearPrecio(totalCOP, 'COP')}
                </p>
              </div>

              {totalUSD > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Total Pagado (USD)</span>
                    <span className="text-2xl">💵</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearPrecio(totalUSD, 'USD')}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Pagos Completados</span>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {pagos.filter(p => p.estado === 'completado').length}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Último Pago</span>
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(pagos[0].creado_en).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Panel de Filtros */}
          {mostrarFiltros && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
                {tienesFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2"
                  >
                    <FaTimes />
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="completado">Completado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="fallido">Fallido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de pago
                  </label>
                  <select
                    value={filtroMetodo}
                    onChange={(e) => setFiltroMetodo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los métodos</option>
                    <option value="stripe">Tarjeta de crédito/débito</option>
                    <option value="paypal">PayPal</option>
                    <option value="transferencia">Transferencia bancaria</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lista de Pagos */}
          {pagosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <FaMoneyBillWave className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {pagos.length === 0 ? 'No hay pagos registrados' : 'No se encontraron pagos'}
              </h3>
              <p className="text-gray-600 mb-6">
                {pagos.length === 0
                  ? 'Cuando realices pagos, aparecerán aquí'
                  : 'Intenta ajustar los filtros para ver más resultados'
                }
              </p>
              {pagos.length === 0 && (
                <Link href="/precios">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Ver Planes
                  </motion.button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pagosFiltrados.map((pago, index) => (
                <motion.div
                  key={pago.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">
                          {obtenerIconoMetodo(pago.metodo)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {formatearPrecio(pago.monto, pago.moneda)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {obtenerTextoMetodo(pago.metodo)}
                          </p>
                        </div>
                      </div>

                      {pago.descripcion && (
                        <p className="text-gray-700 mb-3">
                          {pago.descripcion}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          {new Date(pago.creado_en).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {pago.id_transaccion_externa && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            ID: {pago.id_transaccion_externa.substring(0, 12)}...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-6">
                      <div className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${obtenerColorEstado(pago.estado)}`}>
                        {obtenerIconoEstado(pago.estado)}
                        <span className="font-medium text-sm">
                          {obtenerTextoEstado(pago.estado)}
                        </span>
                      </div>

                      {pago.estado === 'completado' && (
                        <button
                          className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-2"
                          onClick={() => {
                            // TODO: Implementar descarga de factura
                            alert('Función de descarga de factura próximamente');
                          }}
                        >
                          <FaDownload />
                          Descargar factura
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Tienes preguntas sobre tus pagos?
            </h3>
            <p className="text-gray-700 mb-4">
              Todos los pagos son procesados de forma segura. Si tienes algún problema o duda, no dudes en contactarnos.
            </p>
            <Link href="/contacto">
              <button className="text-teal-600 hover:text-teal-700 font-medium">
                Contactar soporte →
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
