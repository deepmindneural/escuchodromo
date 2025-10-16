'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaCalendarAlt, FaChartLine, FaSpinner,
  FaExclamationTriangle, FaCheckCircle, FaExclamationCircle,
  FaTimesCircle, FaFilter, FaTimes
} from 'react-icons/fa';
import Navegacion from '../../../lib/componentes/layout/Navegacion';
import Footer from '../../../lib/componentes/layout/Footer';
import { useUsuario, usePerfilUsuario } from '../../../lib/supabase/hooks';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';

interface Resultado {
  id: string;
  usuario_id: string;
  prueba_id: string;
  respuestas: any;
  puntuacion: number;
  severidad: 'minima' | 'leve' | 'moderada' | 'moderadamente_severa' | 'severa';
  interpretacion: string | null;
  creado_en: string;
  Test?: {
    id: string;
    codigo: string;
    nombre: string;
    nombre_en: string | null;
    descripcion: string | null;
    categoria: string;
  };
}

export default function PaginaHistorialEvaluaciones() {
  const router = useRouter();
  const { usuario: authUsuario, cargando: cargandoAuth } = useUsuario();
  const { perfil } = usePerfilUsuario();
  const supabase = obtenerClienteNavegador();

  const [evaluaciones, setEvaluaciones] = useState<Resultado[]>([]);
  const [evaluacionesFiltradas, setEvaluacionesFiltradas] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('todas');
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
  }, [evaluaciones, filtroCategoria, filtroSeveridad]);

  const cargarHistorial = async () => {
    if (!perfil?.id) return;

    try {
      setCargando(true);

      const { data, error } = await supabase
        .from('Resultado')
        .select(`
          *,
          Test (
            id,
            codigo,
            nombre,
            nombre_en,
            descripcion,
            categoria
          )
        `)
        .eq('usuario_id', perfil.id)
        .order('creado_en', { ascending: false });

      if (error) throw error;

      setEvaluaciones(data || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let filtradas = [...evaluaciones];

    if (filtroCategoria !== 'todas') {
      filtradas = filtradas.filter(e => e.Test?.categoria === filtroCategoria);
    }

    if (filtroSeveridad !== 'todas') {
      filtradas = filtradas.filter(e => e.severidad === filtroSeveridad);
    }

    setEvaluacionesFiltradas(filtradas);
  };

  const limpiarFiltros = () => {
    setFiltroCategoria('todas');
    setFiltroSeveridad('todas');
  };

  const obtenerColorSeveridad = (severidad: string) => {
    const colores = {
      'minima': 'bg-green-100 text-green-800 border-green-200',
      'leve': 'bg-blue-100 text-blue-800 border-blue-200',
      'moderada': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'moderadamente_severa': 'bg-orange-100 text-orange-800 border-orange-200',
      'severa': 'bg-red-100 text-red-800 border-red-200',
    };
    return colores[severidad as keyof typeof colores] || colores.leve;
  };

  const obtenerIconoSeveridad = (severidad: string) => {
    const iconos = {
      'minima': <FaCheckCircle className="text-green-600" />,
      'leve': <FaCheckCircle className="text-blue-600" />,
      'moderada': <FaExclamationCircle className="text-yellow-600" />,
      'moderadamente_severa': <FaExclamationTriangle className="text-orange-600" />,
      'severa': <FaTimesCircle className="text-red-600" />,
    };
    return iconos[severidad as keyof typeof iconos] || iconos.leve;
  };

  const obtenerTextoSeveridad = (severidad: string) => {
    const textos = {
      'minima': 'Mínima',
      'leve': 'Leve',
      'moderada': 'Moderada',
      'moderadamente_severa': 'Moderadamente Severa',
      'severa': 'Severa',
    };
    return textos[severidad as keyof typeof textos] || severidad;
  };

  const categorias = Array.from(new Set(evaluaciones.map(e => e.Test?.categoria).filter(Boolean)));
  const tienesFiltrosActivos = filtroCategoria !== 'todas' || filtroSeveridad !== 'todas';

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="h-16 w-16 text-teal-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando historial...</p>
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
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Historial de Evaluaciones</h1>
                <p className="text-gray-600 text-lg">
                  {evaluaciones.length} evaluacion{evaluaciones.length !== 1 ? 'es' : ''} realizada{evaluaciones.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
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
                    {(filtroCategoria !== 'todas' ? 1 : 0) + (filtroSeveridad !== 'todas' ? 1 : 0)}
                  </span>
                )}
              </motion.button>

              <Link href="/evaluaciones">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Nueva Evaluación
                </motion.button>
              </Link>
            </div>
          </div>

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
                    Categoría
                  </label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severidad
                  </label>
                  <select
                    value={filtroSeveridad}
                    onChange={(e) => setFiltroSeveridad(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="todas">Todas las severidades</option>
                    <option value="minima">Mínima</option>
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="moderadamente_severa">Moderadamente Severa</option>
                    <option value="severa">Severa</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lista de Evaluaciones */}
          {evaluacionesFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <FaChartLine className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {evaluaciones.length === 0 ? 'No hay evaluaciones aún' : 'No se encontraron evaluaciones'}
              </h3>
              <p className="text-gray-600 mb-6">
                {evaluaciones.length === 0
                  ? 'Realiza tu primera evaluación para comenzar a ver tu progreso'
                  : 'Intenta ajustar los filtros para ver más resultados'
                }
              </p>
              {evaluaciones.length === 0 && (
                <Link href="/evaluaciones">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Realizar Evaluación
                  </motion.button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {evaluacionesFiltradas.map((evaluacion, index) => (
                <motion.div
                  key={evaluacion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">📊</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {evaluacion.Test?.nombre || 'Evaluación'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {evaluacion.Test?.codigo} • {evaluacion.Test?.categoria}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt />
                          <span>
                            {new Date(evaluacion.creado_en).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {evaluacion.interpretacion && (
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {evaluacion.interpretacion}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Puntuación</p>
                        <p className="text-3xl font-bold text-teal-600">
                          {evaluacion.puntuacion}
                        </p>
                      </div>

                      <div className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${obtenerColorSeveridad(evaluacion.severidad)}`}>
                        {obtenerIconoSeveridad(evaluacion.severidad)}
                        <span className="font-medium text-sm">
                          {obtenerTextoSeveridad(evaluacion.severidad)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Estadísticas Rápidas */}
          {evaluaciones.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Total Evaluaciones</span>
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{evaluaciones.length}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Última Evaluación</span>
                  <span className="text-3xl">📅</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(evaluaciones[0].creado_en).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Categorías</span>
                  <span className="text-3xl">🏷️</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{categorias.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
