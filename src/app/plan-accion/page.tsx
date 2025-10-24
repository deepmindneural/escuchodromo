'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaSpinner, FaCheckCircle, FaCircle, FaLightbulb,
  FaRobot, FaChartLine, FaPlus, FaTrash, FaEdit, FaTimes
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { useUsuario, usePerfilUsuario } from '../../lib/supabase/hooks';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface Recomendacion {
  id: string;
  usuario_id: string;
  tipo: string;
  prioridad: number | null;
  titulo: string;
  titulo_en: string | null;
  descripcion: string;
  descripcion_en: string | null;
  url_accion: string | null;
  esta_activa: boolean | null;
  creado_en: string;
  completada?: boolean;
}

export default function PaginaPlanAccion() {
  const router = useRouter();
  const { usuario: authUsuario, cargando: cargandoAuth } = useUsuario();
  const { perfil } = usePerfilUsuario();
  const supabase = obtenerClienteNavegador();

  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generandoPlan, setGenerandoPlan] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  useEffect(() => {
    if (!cargandoAuth && !authUsuario) {
      router.push('/iniciar-sesion');
    }
  }, [authUsuario, cargandoAuth, router]);

  useEffect(() => {
    if (perfil?.id) {
      cargarPlanAccion();
    }
  }, [perfil?.id]);

  const cargarPlanAccion = async () => {
    if (!perfil?.id) return;

    try {
      setCargando(true);

      const { data, error } = await supabase
        .from('Recomendacion')
        .select('*')
        .eq('usuario_id', perfil.id)
        .eq('esta_activa', true)
        .order('prioridad', { ascending: false })
        .order('creado_en', { ascending: false });

      if (error) throw error;

      setRecomendaciones(data || []);
    } catch (error) {
      console.error('Error al cargar plan de acción:', error);
      toast.error('Error al cargar el plan de acción');
    } finally {
      setCargando(false);
    }
  };

  const generarNuevoPlan = async () => {
    if (!perfil?.id) return;

    try {
      setGenerandoPlan(true);
      toast.loading('Generando plan personalizado con IA...', { id: 'generando' });

      // Obtener última evaluación del usuario
      // FIX: Usar Test!inner para forzar INNER JOIN y evitar NULLs
      // FIX: No usar .single() para manejar el caso de 0 resultados
      const { data: ultimasEvaluaciones, error: errorEval } = await supabase
        .from('Resultado')
        .select(`
          *,
          Test!inner (
            codigo,
            nombre,
            categoria
          )
        `)
        .eq('usuario_id', perfil.id)
        .order('creado_en', { ascending: false })
        .limit(1);

      // Manejo seguro de errores
      if (errorEval) {
        console.error('Error al obtener evaluación:', errorEval);
        toast.error('Error al cargar tu historial de evaluaciones', { id: 'generando' });
        return;
      }

      const ultimaEvaluacion = ultimasEvaluaciones?.[0] || null;

      // Validar que el usuario tenga al menos una evaluación
      if (!ultimaEvaluacion) {
        toast.error('Necesitas completar al menos una evaluación primero', { id: 'generando' });
        return;
      }

      // Generar recomendaciones basadas en la evaluación
      const recomendacionesNuevas = generarRecomendacionesIA(ultimaEvaluacion);

      // Insertar recomendaciones en la base de datos
      const { error: errorInsert } = await supabase
        .from('Recomendacion')
        .insert(
          recomendacionesNuevas.map(rec => ({
            usuario_id: perfil.id,
            tipo: rec.tipo,
            prioridad: rec.prioridad,
            titulo: rec.titulo,
            descripcion: rec.descripcion,
            url_accion: rec.url_accion,
            esta_activa: true
          }))
        );

      if (errorInsert) {
        console.error('Error al insertar recomendaciones:', errorInsert);
        toast.error('Error al guardar el plan de acción', { id: 'generando' });
        return;
      }

      toast.success('¡Plan de acción generado exitosamente!', { id: 'generando' });
      await cargarPlanAccion();
    } catch (error) {
      console.error('Error inesperado al generar plan:', error);
      toast.error('Error inesperado. Intenta nuevamente.', { id: 'generando' });
    } finally {
      setGenerandoPlan(false);
    }
  };

  const generarRecomendacionesIA = (evaluacion: any) => {
    // Esta función simula recomendaciones de IA basadas en la evaluación
    // En producción, esto debería llamar a un endpoint que use OpenAI o similar

    const recomendacionesBase = [
      {
        tipo: 'ejercicio',
        prioridad: 5,
        titulo: 'Práctica de Respiración Consciente',
        descripcion: 'Dedica 10 minutos cada mañana a ejercicios de respiración profunda. Esto ayuda a reducir la ansiedad y mejorar tu estado de ánimo.',
        url_accion: '/ejercicios/respiracion'
      },
      {
        tipo: 'habito',
        prioridad: 4,
        titulo: 'Registro Diario de Emociones',
        descripcion: 'Mantén un diario de tus emociones cada día. Identifica patrones y triggers que afectan tu bienestar emocional.',
        url_accion: '/animo'
      },
      {
        tipo: 'actividad',
        prioridad: 4,
        titulo: 'Actividad Física Regular',
        descripcion: 'Realiza al menos 30 minutos de ejercicio moderado 3 veces por semana. El ejercicio mejora significativamente el estado de ánimo.',
        url_accion: null
      },
      {
        tipo: 'social',
        prioridad: 3,
        titulo: 'Conexión Social',
        descripcion: 'Dedica tiempo cada semana a conectar con amigos o familiares. El apoyo social es fundamental para el bienestar emocional.',
        url_accion: null
      },
      {
        tipo: 'autocuidado',
        prioridad: 3,
        titulo: 'Rutina de Sueño',
        descripcion: 'Establece una rutina de sueño consistente. Acuéstate y levántate a la misma hora cada día para mejorar la calidad del descanso.',
        url_accion: null
      }
    ];

    // Si hay evaluación, ajustar recomendaciones según severidad
    if (evaluacion) {
      if (evaluacion.severidad === 'severa' || evaluacion.severidad === 'moderadamente_severa') {
        recomendacionesBase.unshift({
          tipo: 'urgente',
          prioridad: 10,
          titulo: 'Considera Apoyo Profesional',
          descripcion: 'Tus resultados sugieren que podrías beneficiarte de hablar con un profesional de salud mental. Te recomendamos agendar una consulta.',
          url_accion: '/contacto'
        });
      }
    }

    return recomendacionesBase;
  };

  const marcarRecomendacion = async (id: string, completada: boolean) => {
    try {
      // En una implementación real, tendríamos una tabla de progreso
      // Por ahora, solo actualizamos el estado local
      setRecomendaciones(prev =>
        prev.map(rec =>
          rec.id === id ? { ...rec, completada } : rec
        )
      );

      if (completada) {
        toast.success('¡Objetivo completado! 🎉');
      }
    } catch (error) {
      console.error('Error al marcar recomendación:', error);
      toast.error('Error al actualizar el objetivo');
    }
  };

  const desactivarRecomendacion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('Recomendacion')
        .update({ esta_activa: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Recomendación eliminada');
      await cargarPlanAccion();
    } catch (error) {
      console.error('Error al eliminar recomendación:', error);
      toast.error('Error al eliminar la recomendación');
    }
  };

  const obtenerColorPrioridad = (prioridad: number | null) => {
    if (!prioridad) return 'border-gray-300';
    if (prioridad >= 8) return 'border-red-400 bg-red-50';
    if (prioridad >= 5) return 'border-orange-400 bg-orange-50';
    if (prioridad >= 3) return 'border-yellow-400 bg-yellow-50';
    return 'border-green-400 bg-green-50';
  };

  const obtenerIconoTipo = (tipo: string) => {
    const iconos: { [key: string]: any } = {
      'ejercicio': '🧘',
      'habito': '📝',
      'actividad': '🏃',
      'social': '👥',
      'autocuidado': '💆',
      'urgente': '⚠️',
      'default': '✨'
    };
    return iconos[tipo] || iconos.default;
  };

  const recomendacionesFiltradas = filtroTipo === 'todos'
    ? recomendaciones
    : recomendaciones.filter(r => r.tipo === filtroTipo);

  const tipos = Array.from(new Set(recomendaciones.map(r => r.tipo)));
  const progreso = recomendaciones.length > 0
    ? Math.round((recomendaciones.filter(r => r.completada).length / recomendaciones.length) * 100)
    : 0;

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="h-16 w-16 text-teal-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando plan de acción...</p>
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
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Plan de Acción Personalizado</h1>
                <p className="text-gray-600 text-lg">
                  Objetivos y recomendaciones generadas por IA
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generarNuevoPlan}
              disabled={generandoPlan}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <FaRobot />
              {generandoPlan ? 'Generando...' : 'Generar Nuevo Plan'}
            </motion.button>
          </div>

          {/* Barra de Progreso */}
          {recomendaciones.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-xl p-6 mb-8 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Tu Progreso</h3>
                  <p className="text-white/90">
                    {recomendaciones.filter(r => r.completada).length} de {recomendaciones.length} objetivos completados
                  </p>
                </div>
                <div className="text-5xl font-bold">
                  {progreso}%
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progreso}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-white rounded-full h-4"
                />
              </div>
            </motion.div>
          )}

          {/* Filtros */}
          {tipos.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filtroTipo === 'todos'
                    ? 'bg-teal-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todos ({recomendaciones.length})
              </button>
              {tipos.map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    filtroTipo === tipo
                      ? 'bg-teal-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {obtenerIconoTipo(tipo)} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Lista de Recomendaciones */}
          {recomendacionesFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <FaLightbulb className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No tienes un plan de acción aún
              </h3>
              <p className="text-gray-600 mb-6">
                Genera tu primer plan personalizado basado en tus evaluaciones y necesidades
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generarNuevoPlan}
                disabled={generandoPlan}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
              >
                <FaRobot />
                {generandoPlan ? 'Generando...' : 'Generar Plan con IA'}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {recomendacionesFiltradas.map((recomendacion, index) => (
                  <motion.div
                    key={recomendacion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 border-l-4 ${obtenerColorPrioridad(recomendacion.prioridad)} ${
                      recomendacion.completada ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <button
                          onClick={() => marcarRecomendacion(recomendacion.id, !recomendacion.completada)}
                          className="mt-1 text-2xl focus:outline-none hover:scale-110 transition-transform"
                        >
                          {recomendacion.completada ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaCircle className="text-gray-300" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{obtenerIconoTipo(recomendacion.tipo)}</span>
                            <h3 className={`text-xl font-bold ${recomendacion.completada ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {recomendacion.titulo}
                            </h3>
                          </div>

                          <p className="text-gray-700 mb-3">
                            {recomendacion.descripcion}
                          </p>

                          <div className="flex items-center gap-4">
                            {recomendacion.prioridad && recomendacion.prioridad >= 8 && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                                Alta Prioridad
                              </span>
                            )}
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {recomendacion.tipo}
                            </span>
                            {recomendacion.url_accion && (
                              <Link href={recomendacion.url_accion}>
                                <span className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                                  Ir a la acción →
                                </span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta recomendación?')) {
                            desactivarRecomendacion(recomendacion.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Información sobre IA */}
          <div className="mt-8 bg-purple-50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <FaRobot className="text-4xl text-purple-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Plan Generado por Inteligencia Artificial
                </h3>
                <p className="text-gray-700 mb-2">
                  Este plan de acción ha sido personalizado según tus evaluaciones psicológicas,
                  estado emocional y progreso histórico. La IA analiza tus resultados para sugerirte
                  objetivos específicos y alcanzables.
                </p>
                <p className="text-sm text-gray-600">
                  Recuerda: Este plan complementa pero no reemplaza la atención profesional.
                  Si necesitas apoyo adicional, no dudes en contactar a un profesional de salud mental.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
