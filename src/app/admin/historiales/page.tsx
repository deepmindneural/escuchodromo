'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaSearch, FaUser, FaChartLine, FaComments,
  FaClipboardCheck, FaLightbulb, FaCalendar, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../../lib/componentes/layout/Navegacion';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  fecha_registro: string;
  ultima_actividad: string | null;
}

interface Evaluacion {
  id: string;
  puntuacion: number;
  severidad: string;
  interpretacion: string;
  creado_en: string;
  Test: {
    codigo: string;
    nombre: string;
    categoria: string;
  };
}

interface Conversacion {
  id: string;
  titulo: string;
  creado_en: string;
  actualizado_en: string;
  Mensaje: Array<{
    id: string;
    contenido: string;
    rol: string;
    emociones: Record<string, number> | null;
    sentimiento: number | null;
    creado_en: string;
  }>;
}

interface Recomendacion {
  id: string;
  tipo: string;
  prioridad: number;
  titulo: string;
  descripcion: string;
  url_accion: string | null;
  esta_activa: boolean;
  creado_en: string;
}

interface HistorialUsuario {
  usuario: Usuario;
  evaluaciones?: Evaluacion[];
  total_evaluaciones?: number;
  estadisticas_evaluaciones?: {
    severidades: Record<string, number>;
    puntuacion_promedio: number;
    ultima_evaluacion: string;
  };
  conversaciones?: Conversacion[];
  total_conversaciones?: number;
  estadisticas_conversaciones?: {
    total_mensajes: number;
    sentimiento_promedio: number | null;
    emociones_predominantes: Array<{ emocion: string; valor: number }>;
    ultima_conversacion: string;
  };
  recomendaciones?: Recomendacion[];
  total_recomendaciones?: number;
  estadisticas_recomendaciones?: {
    tipos: Record<string, number>;
    activas: number;
    completadas: number;
    tasa_completado: number;
    ultima_recomendacion: string;
  };
}

export default function PaginaHistoriales() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialUsuario | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'evaluaciones' | 'conversaciones' | 'recomendaciones'>('evaluaciones');

  useEffect(() => {
    verificarAdmin();
    cargarUsuarios();
  }, []);

  const verificarAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/iniciar-sesion');
      return;
    }

    // Verificar rol de administrador
    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select('id, rol')
      .eq('auth_id', user.id)
      .single();

    if (error || !usuario || usuario.rol !== 'ADMIN') {
      toast.error('Acceso denegado. Se requiere rol de administrador.');
      router.push('/dashboard');
      return;
    }
  };

  const cargarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('Usuario')
        .select('id, nombre, email, fecha_registro, ultima_actividad')
        .order('fecha_registro', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error al cargar usuarios:', error);
        toast.error('Error al cargar usuarios');
        return;
      }

      setUsuarios(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const cargarHistorialUsuario = async (usuarioId: string) => {
    setCargando(true);
    setUsuarioSeleccionado(usuarioId);
    setHistorial(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión no válida');
        return;
      }

      const { data, error } = await supabase.functions.invoke('obtener-historial-usuario', {
        body: { usuario_id: usuarioId, tipo: 'completo' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error al cargar historial:', error);
        toast.error('Error al cargar historial del usuario');
        return;
      }

      setHistorial(data);
      toast.success('Historial cargado correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar historial del usuario');
    } finally {
      setCargando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'minima': return 'bg-green-100 text-green-800 border-green-300';
      case 'leve': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'moderada': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderadamente_severa': return 'bg-red-100 text-red-800 border-red-300';
      case 'severa': return 'bg-red-200 text-red-900 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeveridadTexto = (severidad: string) => {
    return severidad.replace('_', ' ').charAt(0).toUpperCase() + severidad.replace('_', ' ').slice(1);
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

  if (cargandoUsuarios) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navegacion />
      <Toaster position="top-center" />

      {/* Header */}
      <div className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-gray-800 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-200"
              >
                <FaArrowLeft className="text-teal-400" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Historiales de Usuarios</h1>
              <p className="text-gray-400 text-lg">Consulta el historial completo de evaluaciones, conversaciones y recomendaciones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de búsqueda de usuarios */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FaSearch className="mr-2 text-teal-400" />
                  Buscar Usuario
                </h2>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <FaSearch className="absolute right-4 top-4 text-gray-400" />
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {usuariosFiltrados.map((usuario) => (
                    <motion.button
                      key={usuario.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => cargarHistorialUsuario(usuario.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                        usuarioSeleccionado === usuario.id
                          ? 'bg-teal-600 shadow-lg'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <FaUser className="text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{usuario.nombre}</p>
                          <p className="text-sm text-gray-400 truncate">{usuario.email}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}

                  {usuariosFiltrados.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No se encontraron usuarios
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de historial */}
            <div className="lg:col-span-2">
              {cargando && (
                <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Cargando historial...</p>
                </div>
              )}

              {!cargando && !historial && (
                <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                  <FaUser className="text-6xl text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Selecciona un usuario
                  </h3>
                  <p className="text-gray-500">
                    Elige un usuario de la lista para ver su historial completo
                  </p>
                </div>
              )}

              {!cargando && historial && (
                <div className="space-y-6">
                  {/* Información del usuario */}
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <FaUser className="text-3xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{historial.usuario.nombre}</h2>
                        <p className="text-teal-100">{historial.usuario.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-teal-100 text-sm">Registro</p>
                        <p className="font-semibold">{formatearFecha(historial.usuario.fecha_registro)}</p>
                      </div>
                      {historial.usuario.ultima_actividad && (
                        <div>
                          <p className="text-teal-100 text-sm">Última actividad</p>
                          <p className="font-semibold">{formatearFecha(historial.usuario.ultima_actividad)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumen de estadísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-xl p-6 text-center">
                      <FaClipboardCheck className="text-4xl text-blue-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-white">{historial.total_evaluaciones || 0}</div>
                      <div className="text-sm text-gray-400">Evaluaciones</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 text-center">
                      <FaComments className="text-4xl text-green-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-white">{historial.total_conversaciones || 0}</div>
                      <div className="text-sm text-gray-400">Conversaciones</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 text-center">
                      <FaLightbulb className="text-4xl text-purple-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-white">{historial.total_recomendaciones || 0}</div>
                      <div className="text-sm text-gray-400">Recomendaciones</div>
                    </div>
                  </div>

                  {/* Tabs de vistas */}
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
                    <div className="flex gap-2 mb-6 border-b border-gray-700">
                      {(['evaluaciones', 'conversaciones', 'recomendaciones'] as const).map((vista) => (
                        <button
                          key={vista}
                          onClick={() => setVistaActiva(vista)}
                          className={`px-6 py-3 font-medium transition-all duration-200 ${
                            vistaActiva === vista
                              ? 'text-teal-400 border-b-2 border-teal-400'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          {vista.charAt(0).toUpperCase() + vista.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Vista de evaluaciones */}
                    {vistaActiva === 'evaluaciones' && (
                      <div className="space-y-4">
                        {historial.estadisticas_evaluaciones && (
                          <div className="bg-gray-700 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-white mb-3">Estadísticas</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-400">Puntuación Promedio</p>
                                <p className="text-xl font-bold text-white">
                                  {historial.estadisticas_evaluaciones.puntuacion_promedio.toFixed(1)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Severidades</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {Object.entries(historial.estadisticas_evaluaciones.severidades).map(([sev, count]) => (
                                    <span key={sev} className={`px-2 py-1 rounded text-xs ${getSeveridadColor(sev)}`}>
                                      {count} {getSeveridadTexto(sev)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {historial.evaluaciones && historial.evaluaciones.length > 0 ? (
                          historial.evaluaciones.map((evaluacion) => (
                            <motion.div
                              key={evaluacion.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-700 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-white">{evaluacion.Test.nombre}</h4>
                                  <p className="text-sm text-gray-400">
                                    <FaCalendar className="inline mr-1" />
                                    {formatearFecha(evaluacion.creado_en)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-white">{evaluacion.puntuacion}</p>
                                    <p className="text-xs text-gray-400">puntos</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeveridadColor(evaluacion.severidad)}`}>
                                    {getSeveridadTexto(evaluacion.severidad)}
                                  </span>
                                </div>
                              </div>
                              {evaluacion.severidad === 'moderadamente_severa' || evaluacion.severidad === 'severa' ? (
                                <div className="bg-red-900/30 border border-red-700 rounded p-3 flex items-start gap-2">
                                  <FaExclamationTriangle className="text-red-400 mt-1" />
                                  <p className="text-sm text-red-200">
                                    Esta evaluación indica severidad alta. Se recomienda seguimiento profesional.
                                  </p>
                                </div>
                              ) : null}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No hay evaluaciones registradas
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vista de conversaciones */}
                    {vistaActiva === 'conversaciones' && (
                      <div className="space-y-4">
                        {historial.estadisticas_conversaciones && (
                          <div className="bg-gray-700 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-white mb-3">Estadísticas</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-400">Total Mensajes</p>
                                <p className="text-xl font-bold text-white">
                                  {historial.estadisticas_conversaciones.total_mensajes}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Sentimiento Promedio</p>
                                <p className="text-xl font-bold text-white">
                                  {historial.estadisticas_conversaciones.sentimiento_promedio?.toFixed(2) || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Emociones Top</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {historial.estadisticas_conversaciones.emociones_predominantes.slice(0, 3).map((emocion) => (
                                    <span key={emocion.emocion} className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
                                      {emocion.emocion}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {historial.conversaciones && historial.conversaciones.length > 0 ? (
                          historial.conversaciones.map((conversacion) => (
                            <motion.div
                              key={conversacion.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-700 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-white">{conversacion.titulo}</h4>
                                  <p className="text-sm text-gray-400">
                                    <FaCalendar className="inline mr-1" />
                                    {formatearFecha(conversacion.creado_en)}
                                  </p>
                                </div>
                                <div className="bg-gray-600 px-3 py-1 rounded-full">
                                  <span className="text-sm text-gray-300">
                                    {conversacion.Mensaje?.length || 0} mensajes
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No hay conversaciones registradas
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vista de recomendaciones */}
                    {vistaActiva === 'recomendaciones' && (
                      <div className="space-y-4">
                        {historial.estadisticas_recomendaciones && (
                          <div className="bg-gray-700 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-white mb-3">Estadísticas</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-400">Activas</p>
                                <p className="text-xl font-bold text-green-400">
                                  {historial.estadisticas_recomendaciones.activas}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Completadas</p>
                                <p className="text-xl font-bold text-gray-400">
                                  {historial.estadisticas_recomendaciones.completadas}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Tasa de Completado</p>
                                <p className="text-xl font-bold text-white">
                                  {historial.estadisticas_recomendaciones.tasa_completado.toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {historial.recomendaciones && historial.recomendaciones.length > 0 ? (
                          historial.recomendaciones.map((recomendacion) => (
                            <motion.div
                              key={recomendacion.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-700 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-white">{recomendacion.titulo}</h4>
                                    {recomendacion.esta_activa ? (
                                      <FaCheckCircle className="text-green-500" />
                                    ) : (
                                      <FaTimesCircle className="text-gray-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400">{recomendacion.descripcion}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    <FaCalendar className="inline mr-1" />
                                    {formatearFecha(recomendacion.creado_en)}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    recomendacion.prioridad >= 5 ? 'bg-red-900 text-red-200' :
                                    recomendacion.prioridad >= 4 ? 'bg-orange-900 text-orange-200' :
                                    recomendacion.prioridad >= 3 ? 'bg-yellow-900 text-yellow-200' :
                                    'bg-green-900 text-green-200'
                                  }`}>
                                    Prioridad {recomendacion.prioridad}
                                  </span>
                                  <span className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
                                    {recomendacion.tipo}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No hay recomendaciones registradas
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
