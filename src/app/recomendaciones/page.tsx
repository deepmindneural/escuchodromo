'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, FaBrain, FaLeaf, FaDumbbell, FaMusic, FaBook,
  FaArrowLeft, FaPlay, FaCheckCircle, FaExternalLinkAlt,
  FaStar, FaClock, FaFilter, FaRandom
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';

interface Recomendacion {
  id: string;
  tipo: string;
  prioridad: number;
  titulo: string;
  descripcion: string;
  urlAccion?: string;
  duracion?: string;
  dificultad?: string;
  categoria: string;
  completada?: boolean;
}

export default function PaginaRecomendaciones() {
  const router = useRouter();
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    cargarRecomendaciones();
  }, []);

  const verificarAutenticacion = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarRecomendaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/recomendaciones', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecomendaciones(data);
      } else {
        // Si no hay recomendaciones del backend, usar datos mock
        setRecomendaciones(recomendacionesMock);
      }
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error);
      // Usar datos mock como fallback
      setRecomendaciones(recomendacionesMock);
    } finally {
      setCargando(false);
    }
  };

  const marcarCompletada = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3333/api/recomendaciones/${id}/completar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setRecomendaciones(prev => 
        prev.map(rec => 
          rec.id === id ? { ...rec, completada: true } : rec
        )
      );
      toast.success('¡Recomendación completada! 🎉');
    } catch (error) {
      // Actualizar localmente aunque falle la API
      setRecomendaciones(prev => 
        prev.map(rec => 
          rec.id === id ? { ...rec, completada: true } : rec
        )
      );
      toast.success('¡Recomendación completada! 🎉');
    }
  };

  const obtenerIconoCategoria = (categoria: string) => {
    const iconos = {
      'respiracion': <FaLeaf className="text-green-500" />,
      'meditacion': <FaBrain className="text-purple-500" />,
      'ejercicio': <FaDumbbell className="text-blue-500" />,
      'musica': <FaMusic className="text-pink-500" />,
      'lectura': <FaBook className="text-indigo-500" />,
      'bienestar': <FaHeart className="text-red-500" />
    };
    return iconos[categoria as keyof typeof iconos] || <FaHeart className="text-teal-500" />;
  };

  const obtenerColorPrioridad = (prioridad: number) => {
    if (prioridad >= 4) return 'border-red-300 bg-red-50';
    if (prioridad >= 3) return 'border-yellow-300 bg-yellow-50';
    return 'border-green-300 bg-green-50';
  };

  const recomendacionesFiltradas = recomendaciones.filter(rec => {
    const cumpleFiltroCategoria = filtroCategoria === 'todas' || rec.categoria === filtroCategoria;
    const cumpleFiltroCompletada = mostrarCompletadas || !rec.completada;
    return cumpleFiltroCategoria && cumpleFiltroCompletada;
  });

  const categorias = ['todas', 'respiracion', 'meditacion', 'ejercicio', 'musica', 'lectura', 'bienestar'];

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
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaRandom className="inline mr-2" />
              Nuevas Sugerencias
            </motion.button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-teal-600 mb-1">{recomendaciones.length}</div>
              <div className="text-sm text-gray-600">Total Recomendaciones</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {recomendaciones.filter(r => r.completada).length}
              </div>
              <div className="text-sm text-gray-600">Completadas</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {recomendaciones.filter(r => r.prioridad >= 4).length}
              </div>
              <div className="text-sm text-gray-600">Alta Prioridad</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {Math.round((recomendaciones.filter(r => r.completada).length / recomendaciones.length) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Progreso</div>
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
                {categorias.map(categoria => (
                  <motion.button
                    key={categoria}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFiltroCategoria(categoria)}
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                      filtroCategoria === categoria
                        ? 'bg-teal-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                  </motion.button>
                ))}
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mostrarCompletadas"
                  checked={mostrarCompletadas}
                  onChange={(e) => setMostrarCompletadas(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="mostrarCompletadas" className="text-sm text-gray-700">
                  Mostrar completadas
                </label>
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
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 ${
                    recomendacion.completada ? 'opacity-75' : ''
                  } ${obtenerColorPrioridad(recomendacion.prioridad)}`}
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
                      
                      {recomendacion.completada && (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          <FaCheckCircle />
                          Completada
                        </div>
                      )}
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
                      {!recomendacion.completada && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => marcarCompletada(recomendacion.id)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                          <FaPlay className="inline mr-2" />
                          Comenzar
                        </motion.button>
                      )}
                      
                      {recomendacion.urlAccion && (
                        <motion.a
                          href={recomendacion.urlAccion}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`${recomendacion.completada ? 'flex-1' : ''} px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 text-center`}
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
    </div>
  );
}

// Datos mock para cuando no hay conexión con el backend
const recomendacionesMock: Recomendacion[] = [
  {
    id: '1',
    tipo: 'respiracion',
    prioridad: 5,
    titulo: 'Ejercicio de Respiración 4-7-8',
    descripcion: 'Una técnica simple pero poderosa para reducir la ansiedad y promover la relajación profunda.',
    categoria: 'respiracion',
    duracion: '5-10 min',
    dificultad: 'Fácil'
  },
  {
    id: '2',
    tipo: 'meditacion',
    prioridad: 4,
    titulo: 'Meditación Mindfulness Matutina',
    descripcion: 'Comienza tu día con claridad mental y tranquilidad interior a través de esta meditación guiada.',
    categoria: 'meditacion',
    duracion: '15 min',
    dificultad: 'Principiante',
    urlAccion: 'https://www.youtube.com/watch?v=meditation'
  },
  {
    id: '3',
    tipo: 'ejercicio',
    prioridad: 3,
    titulo: 'Caminata Consciente al Aire Libre',
    descripcion: 'Conecta con la naturaleza mientras ejercitas tu cuerpo y calmas tu mente.',
    categoria: 'ejercicio',
    duracion: '30 min',
    dificultad: 'Fácil'
  },
  {
    id: '4',
    tipo: 'musica',
    prioridad: 2,
    titulo: 'Playlist de Relajación Personalizada',
    descripcion: 'Música cuidadosamente seleccionada para reducir el estrés y mejorar tu estado de ánimo.',
    categoria: 'musica',
    duracion: '20-60 min',
    dificultad: 'Fácil',
    urlAccion: 'https://open.spotify.com/playlist/relaxation'
  },
  {
    id: '5',
    tipo: 'lectura',
    prioridad: 3,
    titulo: 'Diario de Gratitud',
    descripcion: 'Escribe tres cosas por las que te sientes agradecido cada día para mejorar tu bienestar emocional.',
    categoria: 'lectura',
    duracion: '10 min',
    dificultad: 'Fácil'
  },
  {
    id: '6',
    tipo: 'bienestar',
    prioridad: 4,
    titulo: 'Rutina de Autocuidado Nocturna',
    descripcion: 'Crea un ritual relajante antes de dormir para mejorar la calidad de tu descanso.',
    categoria: 'bienestar',
    duracion: '45 min',
    dificultad: 'Medio'
  }
];