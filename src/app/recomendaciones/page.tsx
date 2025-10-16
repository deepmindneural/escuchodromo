'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHeart, FaBrain, FaLeaf, FaDumbbell, FaMusic, FaBook,
  FaArrowLeft, FaPlay, FaCheckCircle, FaExternalLinkAlt,
  FaStar, FaClock, FaFilter, FaRandom, FaUserMd, FaLightbulb
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface Recomendacion {
  id: string;
  tipo: string;
  prioridad: number;
  titulo: string;
  descripcion: string;
  url_accion?: string;
  duracion?: string;
  dificultad?: string;
  categoria: string;
  esta_activa: boolean;
}

export default function PaginaRecomendaciones() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/iniciar-sesion');
      return;
    }

    // Buscar el usuario en la tabla Usuario
    const { data: usuario } = await supabase
      .from('Usuario')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (usuario) {
      setUsuarioId(usuario.id);
      cargarRecomendaciones(usuario.id);
    }
  };

  const cargarRecomendaciones = async (userId: string) => {
    try {
      setCargando(true);

      // Cargar recomendaciones activas del usuario
      const { data, error } = await supabase
        .from('Recomendacion')
        .select('*')
        .eq('usuario_id', userId)
        .eq('esta_activa', true)
        .order('prioridad', { ascending: false })
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error al cargar recomendaciones:', error);
        toast.error('Error al cargar recomendaciones');
        return;
      }

      if (!data || data.length === 0) {
        // Si no hay recomendaciones, ofrecer generarlas
        toast.info('No tienes recomendaciones aún. ¡Genera algunas!');
        setRecomendaciones([]);
      } else {
        // Mapear el tipo a categoría para compatibilidad con la UI
        const recomendacionesMapeadas = data.map(rec => ({
          ...rec,
          categoria: rec.tipo
        }));
        setRecomendaciones(recomendacionesMapeadas);
      }
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error);
      toast.error('Error al cargar recomendaciones');
    } finally {
      setCargando(false);
    }
  };

  const generarNuevasRecomendaciones = async () => {
    if (!usuarioId) return;

    setGenerando(true);
    toast.loading('Generando recomendaciones personalizadas...', { id: 'generando' });

    try {
      const { data, error } = await supabase.functions.invoke('generar-recomendaciones', {
        body: { usuario_id: usuarioId }
      });

      if (error) {
        console.error('Error al generar recomendaciones:', error);
        toast.error('Error al generar recomendaciones', { id: 'generando' });
        return;
      }

      toast.success(`¡${data.total} recomendaciones generadas!`, { id: 'generando' });

      // Recargar recomendaciones
      await cargarRecomendaciones(usuarioId);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar recomendaciones', { id: 'generando' });
    } finally {
      setGenerando(false);
    }
  };

  const desactivarRecomendacion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('Recomendacion')
        .update({ esta_activa: false })
        .eq('id', id);

      if (error) {
        console.error('Error al desactivar recomendación:', error);
        return;
      }

      setRecomendaciones(prev => prev.filter(rec => rec.id !== id));
      toast.success('¡Recomendación completada! 🎉');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al completar recomendación');
    }
  };

  const obtenerIconoCategoria = (categoria: string) => {
    const iconos = {
      'actividad': <FaDumbbell className="text-blue-500" />,
      'recurso': <FaBook className="text-indigo-500" />,
      'habito': <FaLeaf className="text-green-500" />,
      'profesional': <FaUserMd className="text-red-500" />,
      'emergencia': <FaHeart className="text-red-600" />,
      'respiracion': <FaLeaf className="text-green-500" />,
      'meditacion': <FaBrain className="text-purple-500" />,
      'ejercicio': <FaDumbbell className="text-blue-500" />,
      'musica': <FaMusic className="text-pink-500" />,
      'lectura': <FaBook className="text-indigo-500" />,
      'bienestar': <FaHeart className="text-teal-500" />
    };
    return iconos[categoria as keyof typeof iconos] || <FaLightbulb className="text-yellow-500" />;
  };

  const obtenerColorPrioridad = (prioridad: number) => {
    if (prioridad >= 5) return 'border-red-400 bg-red-50';
    if (prioridad >= 4) return 'border-orange-300 bg-orange-50';
    if (prioridad >= 3) return 'border-yellow-300 bg-yellow-50';
    return 'border-green-300 bg-green-50';
  };

  const recomendacionesFiltradas = recomendaciones.filter(rec => {
    return filtroTipo === 'todos' || rec.tipo === filtroTipo;
  });

  const tipos = ['todos', 'actividad', 'recurso', 'habito', 'profesional'];

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando recomendaciones personalizadas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Toaster position="top-center" />
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
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Recomendaciones Personalizadas</h1>
                <p className="text-gray-600 text-lg">Actividades diseñadas especialmente para ti</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generarNuevasRecomendaciones}
              disabled={generando}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <FaRandom className="inline mr-2" />
              {generando ? 'Generando...' : 'Generar Recomendaciones'}
            </motion.button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-teal-600 mb-1">{recomendaciones.length}</div>
              <div className="text-sm text-gray-600">Total Recomendaciones</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {recomendaciones.filter(r => r.prioridad >= 4).length}
              </div>
              <div className="text-sm text-gray-600">Alta Prioridad</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {recomendaciones.filter(r => r.tipo === 'profesional').length}
              </div>
              <div className="text-sm text-gray-600">Consultas Profesionales</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-600" />
                <span className="font-medium text-gray-700">Filtros:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {tipos.map(tipo => (
                  <motion.button
                    key={tipo}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                      filtroTipo === tipo
                        ? 'bg-teal-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de recomendaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {recomendacionesFiltradas.map((recomendacion, index) => (
                <motion.div
                  key={recomendacion.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 ${obtenerColorPrioridad(recomendacion.prioridad)}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {obtenerIconoCategoria(recomendacion.categoria)}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {recomendacion.categoria}
                          </span>
                          {recomendacion.prioridad >= 4 && (
                            <div className="flex items-center gap-1 mt-1">
                              <FaStar className="text-red-500 text-xs" />
                              <span className="text-xs text-red-600 font-medium">Alta Prioridad</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {recomendacion.titulo}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {recomendacion.descripcion}
                    </p>
                    
                    {(recomendacion.duracion || recomendacion.dificultad) && (
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                        {recomendacion.duracion && (
                          <div className="flex items-center gap-1">
                            <FaClock />
                            <span>{recomendacion.duracion}</span>
                          </div>
                        )}
                        {recomendacion.dificultad && (
                          <div className="flex items-center gap-1">
                            <FaStar />
                            <span>{recomendacion.dificultad}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {recomendacion.esta_activa && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => desactivarRecomendacion(recomendacion.id)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                          <FaCheckCircle className="inline mr-2" />
                          Marcar Completada
                        </motion.button>
                      )}

                      {recomendacion.url_accion && (
                        <motion.a
                          href={recomendacion.url_accion}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 text-center"
                        >
                          <FaExternalLinkAlt className="inline mr-2" />
                          Ver Más
                        </motion.a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {recomendacionesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <FaHeart className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No hay recomendaciones disponibles
              </h3>
              <p className="text-gray-500 mb-6">
                Ajusta los filtros o completa más evaluaciones para recibir recomendaciones personalizadas
              </p>
              <Link href="/evaluaciones">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl"
                >
                  Realizar Evaluación
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}