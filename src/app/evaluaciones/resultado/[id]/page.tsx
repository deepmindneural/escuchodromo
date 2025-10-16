'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaChartLine, FaDownload, FaCalendarAlt, FaLightbulb,
  FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaHeart,
  FaArrowUp, FaArrowDown, FaEquals, FaPrint, FaShare
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../../../lib/componentes/layout/Navegacion';
import { obtenerClienteNavegador } from '../../../../lib/supabase/cliente';

interface ResultadoEvaluacion {
  id: string;
  pruebaId: string;
  pruebaCodigo: string;
  pruebaNombre: string;
  puntuacion: number;
  severidad: string;
  interpretacion: string;
  recomendaciones: string[];
  fecha: string;
  respuestas: any;
  progreso?: {
    evaluacionesAnteriores: {
      fecha: string;
      puntuacion: number;
    }[];
    tendencia: 'mejoria' | 'estable' | 'empeoramiento';
    cambio: number;
  };
  rangos: {
    minimo: number;
    leve: number;
    moderado: number;
    severo: number;
    maximo: number;
  };
}

export default function PaginaResultadoEvaluacion() {
  const router = useRouter();
  const params = useParams();
  const [resultado, setResultado] = useState<ResultadoEvaluacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    if (params.id) {
      cargarResultado(params.id as string);
    }
  }, [params.id]);

  const verificarAutenticacion = async () => {
    const supabase = obtenerClienteNavegador();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarResultado = async (id: string) => {
    try {
      const supabase = obtenerClienteNavegador();

      // Obtener la evaluación con los datos del test
      const { data: evaluacion, error: errorEvaluacion } = await supabase
        .from('Evaluacion')
        .select(`
          id,
          usuario_id,
          test_id,
          puntuacion,
          severidad,
          interpretacion,
          recomendaciones,
          respuestas,
          creado_en,
          Test (
            id,
            codigo,
            nombre,
            rangos
          )
        `)
        .eq('id', id)
        .single();

      if (errorEvaluacion || !evaluacion) {
        console.error('Error al cargar evaluación:', errorEvaluacion);
        setError(true);
        setCargando(false);
        return;
      }

      // Obtener evaluaciones anteriores del mismo test para calcular progreso
      const { data: evaluacionesAnteriores } = await supabase
        .from('Evaluacion')
        .select('puntuacion, creado_en')
        .eq('usuario_id', evaluacion.usuario_id)
        .eq('test_id', evaluacion.test_id)
        .lt('creado_en', evaluacion.creado_en)
        .order('creado_en', { ascending: false })
        .limit(5);

      // Calcular tendencia y cambio
      let progreso = undefined;
      if (evaluacionesAnteriores && evaluacionesAnteriores.length > 0) {
        const ultimaEvaluacion = evaluacionesAnteriores[0];
        const cambio = evaluacion.puntuacion - ultimaEvaluacion.puntuacion;

        let tendencia: 'mejoria' | 'estable' | 'empeoramiento';
        if (cambio < -2) {
          tendencia = 'mejoria';
        } else if (cambio > 2) {
          tendencia = 'empeoramiento';
        } else {
          tendencia = 'estable';
        }

        progreso = {
          evaluacionesAnteriores: evaluacionesAnteriores.map((e: any) => ({
            fecha: e.creado_en,
            puntuacion: e.puntuacion,
          })).reverse(),
          tendencia,
          cambio: Math.abs(cambio),
        };
      }

      // Formatear resultado
      const resultado: ResultadoEvaluacion = {
        id: evaluacion.id,
        pruebaId: evaluacion.Test.id,
        pruebaCodigo: evaluacion.Test.codigo,
        pruebaNombre: evaluacion.Test.nombre,
        puntuacion: evaluacion.puntuacion,
        severidad: evaluacion.severidad,
        interpretacion: evaluacion.interpretacion,
        recomendaciones: evaluacion.recomendaciones || [],
        fecha: evaluacion.creado_en,
        respuestas: evaluacion.respuestas || {},
        progreso,
        rangos: evaluacion.Test.rangos || {
          minimo: 0,
          leve: 4,
          moderado: 9,
          severo: 14,
          maximo: 27,
        },
      };

      setResultado(resultado);
    } catch (error) {
      console.error('Error:', error);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  const obtenerColorSeveridad = (severidad: string, puntuacion: number, rangos: any) => {
    if (puntuacion <= rangos.leve) return 'bg-green-100 text-green-800 border-green-200';
    if (puntuacion <= rangos.moderado) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (puntuacion <= rangos.severo) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const obtenerIconoTendencia = (tendencia?: string) => {
    switch (tendencia) {
      case 'mejoria': return <FaArrowUp className="text-green-500" />;
      case 'empeoramiento': return <FaArrowDown className="text-red-500" />;
      default: return <FaEquals className="text-blue-500" />;
    }
  };

  const obtenerMensajeTendencia = (tendencia?: string, cambio?: number) => {
    if (!tendencia || !cambio) return 'Primera evaluación';
    
    if (tendencia === 'mejoria') {
      return `Mejora de ${Math.abs(cambio)} puntos desde la última evaluación`;
    } else if (tendencia === 'empeoramiento') {
      return `Aumento de ${Math.abs(cambio)} puntos desde la última evaluación`;
    }
    return 'Sin cambios significativos';
  };

  const descargarReporte = () => {
    toast.success('Descargando reporte en PDF...');
    // Aquí iría la lógica de descarga
  };

  const compartirResultado = () => {
    if (navigator.share) {
      navigator.share({
        title: `Resultado ${resultado?.pruebaNombre}`,
        text: `Mi resultado en ${resultado?.pruebaNombre}: ${resultado?.severidad}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando resultado...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resultado no encontrado</h2>
            <p className="text-gray-600 mb-6">No pudimos encontrar el resultado de esta evaluación</p>
            <Link href="/evaluaciones">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-teal-500 text-white font-bold rounded-xl"
              >
                Volver a Evaluaciones
              </motion.button>
            </Link>
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/evaluaciones">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaArrowLeft className="text-teal-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Resultado de Evaluación</h1>
                <p className="text-gray-600 text-lg">{resultado.pruebaNombre}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={compartirResultado}
                className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaShare className="inline mr-2" />
                Compartir
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaPrint className="inline mr-2" />
                Imprimir
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={descargarReporte}
                className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaDownload className="inline mr-2" />
                Descargar PDF
              </motion.button>
            </div>
          </div>

          {/* Resultado Principal */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl font-bold text-white">{resultado.puntuacion}</span>
              </div>
              
              <span className={`inline-flex px-6 py-3 text-lg font-bold rounded-full border-2 ${obtenerColorSeveridad(resultado.severidad, resultado.puntuacion, resultado.rangos)}`}>
                {resultado.severidad}
              </span>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                <FaCalendarAlt />
                <span>
                  Evaluado el {new Date(resultado.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Escala Visual */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Escala de Puntuación</h3>
              <div className="relative">
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div className="bg-green-400 flex-1"></div>
                  <div className="bg-yellow-400 flex-1"></div>
                  <div className="bg-orange-400 flex-1"></div>
                  <div className="bg-red-400 flex-1"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>Mínimo (0-{resultado.rangos.leve})</span>
                  <span>Leve ({resultado.rangos.leve + 1}-{resultado.rangos.moderado})</span>
                  <span>Moderado ({resultado.rangos.moderado + 1}-{resultado.rangos.severo})</span>
                  <span>Severo ({resultado.rangos.severo + 1}+)</span>
                </div>
                {/* Indicador de posición */}
                <div 
                  className="absolute top-0 w-2 h-4 bg-gray-800 transform -translate-x-1"
                  style={{ 
                    left: `${(resultado.puntuacion / resultado.rangos.maximo) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Progreso histórico */}
            {resultado.progreso && resultado.progreso.evaluacionesAnteriores.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <FaChartLine className="text-blue-600 text-xl" />
                  <h3 className="text-lg font-semibold text-gray-900">Tu Progreso</h3>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {obtenerIconoTendencia(resultado.progreso.tendencia)}
                    <span className="font-medium text-gray-800">
                      {obtenerMensajeTendencia(resultado.progreso.tendencia, resultado.progreso.cambio)}
                    </span>
                  </div>
                </div>

                {/* Mini gráfico de progreso */}
                <div className="flex items-end gap-2 h-20">
                  {resultado.progreso.evaluacionesAnteriores.slice(-5).map((evaluacion, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-blue-400 rounded-t min-w-8 flex items-end justify-center text-white text-xs font-bold pb-1"
                        style={{ 
                          height: `${(evaluacion.puntuacion / resultado.rangos.maximo) * 60 + 20}px` 
                        }}
                      >
                        {evaluacion.puntuacion}
                      </div>
                      <span className="text-xs text-gray-600 mt-1">
                        {new Date(evaluacion.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                  {/* Evaluación actual */}
                  <div className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-teal-500 rounded-t min-w-8 flex items-end justify-center text-white text-xs font-bold pb-1 shadow-lg"
                      style={{ 
                        height: `${(resultado.puntuacion / resultado.rangos.maximo) * 60 + 20}px` 
                      }}
                    >
                      {resultado.puntuacion}
                    </div>
                    <span className="text-xs text-teal-700 font-medium mt-1">Hoy</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interpretación */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FaInfoCircle className="text-teal-600 text-xl" />
              <h3 className="text-2xl font-bold text-gray-900">Interpretación de Resultados</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {resultado.interpretacion}
            </p>
          </div>

          {/* Recomendaciones */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FaLightbulb className="text-yellow-500 text-xl" />
              <h3 className="text-2xl font-bold text-gray-900">Recomendaciones Personalizadas</h3>
            </div>
            <div className="space-y-4">
              {resultado.recomendaciones.map((recomendacion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg border border-teal-100"
                >
                  <FaCheckCircle className="text-teal-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-800 font-medium">{recomendacion}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Acciones siguientes */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <FaHeart className="text-2xl" />
              <h3 className="text-2xl font-bold">Próximos Pasos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-lg mb-2">Continúa tu progreso</h4>
                <p className="text-white/90 mb-4">
                  Mantén un seguimiento regular de tu bienestar emocional para ver tu evolución.
                </p>
                <Link href="/recomendaciones">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-white text-teal-600 font-bold rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Ver Recomendaciones
                  </motion.button>
                </Link>
              </div>
              
              <div>
                <h4 className="font-bold text-lg mb-2">Habla con nosotros</h4>
                <p className="text-white/90 mb-4">
                  Si necesitas apoyo adicional, nuestro chat de IA está disponible 24/7.
                </p>
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-white/20 backdrop-blur text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-200"
                  >
                    Iniciar Chat
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recordatorio */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-yellow-600 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Importante Recordar</h4>
                <p className="text-yellow-700 text-sm">
                  Esta evaluación es una herramienta de autoconocimiento y no sustituye el diagnóstico 
                  profesional. Si tienes preocupaciones serias sobre tu salud mental, te recomendamos 
                  consultar con un profesional de la salud mental calificado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Datos mock para desarrollo
const resultadoMock: ResultadoEvaluacion = {
  id: '1',
  pruebaId: '1',
  pruebaCodigo: 'PHQ-9',
  pruebaNombre: 'Cuestionario de Salud del Paciente (PHQ-9)',
  puntuacion: 12,
  severidad: 'Moderada',
  interpretacion: 'Tu puntuación indica síntomas de depresión moderada. Esto significa que experimentas varios síntomas que pueden estar afectando tu vida diaria, trabajo, relaciones o actividades habituales. Es importante que sepas que la depresión es tratable y que buscar ayuda es un signo de fortaleza, no de debilidad. Los síntomas que has reportado sugieren que podrías beneficiarte de apoyo profesional y estrategias de manejo específicas.',
  recomendaciones: [
    'Considera hablar con un profesional de salud mental para una evaluación más detallada',
    'Mantén una rutina diaria estructurada con horarios regulares de sueño y comidas',
    'Incorpora actividad física regular, incluso caminar 20-30 minutos al día puede ayudar',
    'Practica técnicas de relajación como respiración profunda o meditación mindfulness',
    'Mantén conexión social con amigos y familiares, no te aísles',
    'Considera llevar un diario de emociones para identificar patrones y desencadenantes',
    'Evita el alcohol y las drogas, ya que pueden empeorar los síntomas'
  ],
  fecha: '2024-01-15T10:30:00Z',
  respuestas: {},
  progreso: {
    evaluacionesAnteriores: [
      { fecha: '2023-12-15T10:30:00Z', puntuacion: 18 },
      { fecha: '2023-12-01T10:30:00Z', puntuacion: 16 },
      { fecha: '2023-11-15T10:30:00Z', puntuacion: 20 },
      { fecha: '2023-11-01T10:30:00Z', puntuacion: 19 },
      { fecha: '2023-10-15T10:30:00Z', puntuacion: 22 }
    ],
    tendencia: 'mejoria',
    cambio: -6
  },
  rangos: {
    minimo: 0,
    leve: 4,
    moderado: 9,
    severo: 14,
    maximo: 27
  }
};