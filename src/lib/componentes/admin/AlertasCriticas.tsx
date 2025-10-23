'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  ExclamationCircle,
  Phone,
  UserPlus,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import { toast } from 'react-hot-toast';

interface AlertaCritica {
  id: string;
  tipo: 'riesgo_suicidio' | 'depresion_severa' | 'ansiedad_severa' | 'moderadamente_severa';
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  evaluacion: {
    id: string;
    tipo: string; // PHQ-9, GAD-7, etc.
    codigo: string;
    puntuacion: number;
    severidad: string;
    fecha: string;
  };
  diasDesdeEvaluacion: number;
  accionRecomendada: string;
  revisada: boolean;
}

interface AlertasCriticasProps {
  onAlertaRevisada?: (alertaId: string) => void;
}

/**
 * Componente AlertasCriticas
 *
 * Muestra un panel de alertas críticas para casos de alto riesgo en salud mental.
 * Detecta automáticamente:
 * - PHQ-9 >= 20 (riesgo de suicidio)
 * - PHQ-9 >= 15 (depresión severa/moderadamente severa)
 * - GAD-7 >= 15 (ansiedad severa)
 *
 * Accesibilidad:
 * - ARIA labels completos
 * - Navegación por teclado
 * - Indicadores visuales múltiples (no solo color)
 * - Live region para anuncios
 */
export default function AlertasCriticas({ onAlertaRevisada }: AlertasCriticasProps) {
  const [alertas, setAlertas] = useState<AlertaCritica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(true);
  const [alertasRevisadas, setAlertasRevisadas] = useState<Set<string>>(new Set());
  const supabase = obtenerClienteNavegador();

  useEffect(() => {
    cargarAlertasCriticas();

    // Recargar cada 5 minutos para detectar nuevos casos
    const intervalo = setInterval(cargarAlertasCriticas, 5 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  const cargarAlertasCriticas = async () => {
    try {
      setCargando(true);

      // Consultar resultados con severidad alta de los últimos 7 días
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);

      const { data: resultados, error } = await supabase
        .from('Resultado')
        .select(`
          id,
          usuario_id,
          puntuacion,
          severidad,
          creado_en,
          Prueba:prueba_id (
            id,
            codigo,
            nombre,
            categoria
          ),
          Usuario:usuario_id (
            id,
            nombre,
            email
          )
        `)
        .in('severidad', ['moderadamente_severa', 'severa'])
        .gte('creado_en', hace7Dias.toISOString())
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error cargando alertas:', error);
        toast.error('Error al cargar alertas críticas');
        return;
      }

      // Procesar y clasificar alertas
      const alertasClasificadas: AlertaCritica[] = (resultados || []).map((resultado: any) => {
        const prueba = resultado.Prueba;
        const usuario = resultado.Usuario;
        const diasDesde = Math.floor(
          (Date.now() - new Date(resultado.creado_en).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determinar tipo de alerta y acción recomendada
        let tipo: AlertaCritica['tipo'] = 'moderadamente_severa';
        let accionRecomendada = 'Se recomienda seguimiento profesional';

        if (prueba.codigo === 'PHQ-9') {
          if (resultado.puntuacion >= 20) {
            tipo = 'riesgo_suicidio';
            accionRecomendada = 'URGENTE: Contacto inmediato requerido. Posible ideación suicida';
          } else if (resultado.puntuacion >= 15) {
            tipo = 'depresion_severa';
            accionRecomendada = 'Contactar al usuario y asignar terapeuta en las próximas 24 horas';
          }
        } else if (prueba.codigo === 'GAD-7') {
          if (resultado.puntuacion >= 15) {
            tipo = 'ansiedad_severa';
            accionRecomendada = 'Ansiedad severa detectada. Asignar terapeuta especializado en ansiedad';
          }
        }

        return {
          id: resultado.id,
          tipo,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre || 'Sin nombre',
            email: usuario.email,
          },
          evaluacion: {
            id: resultado.id,
            tipo: prueba.nombre,
            codigo: prueba.codigo,
            puntuacion: resultado.puntuacion,
            severidad: resultado.severidad,
            fecha: resultado.creado_en,
          },
          diasDesdeEvaluacion: diasDesde,
          accionRecomendada,
          revisada: false,
        };
      });

      // Ordenar por prioridad (riesgo suicidio primero)
      alertasClasificadas.sort((a, b) => {
        const prioridad = {
          riesgo_suicidio: 0,
          depresion_severa: 1,
          ansiedad_severa: 2,
          moderadamente_severa: 3,
        };
        return prioridad[a.tipo] - prioridad[b.tipo];
      });

      setAlertas(alertasClasificadas);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarComoRevisada = (alertaId: string) => {
    setAlertasRevisadas(prev => {
      const nuevo = new Set(prev);
      nuevo.add(alertaId);
      return nuevo;
    });

    toast.success('Alerta marcada como revisada');
    onAlertaRevisada?.(alertaId);
  };

  const obtenerColorAlerta = (tipo: AlertaCritica['tipo']) => {
    switch (tipo) {
      case 'riesgo_suicidio':
        return {
          bg: 'bg-red-50',
          border: 'border-red-600',
          text: 'text-red-900',
          badge: 'bg-red-600',
          icon: 'text-red-600',
        };
      case 'depresion_severa':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-900',
          badge: 'bg-orange-500',
          icon: 'text-orange-500',
        };
      case 'ansiedad_severa':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-900',
          badge: 'bg-yellow-500',
          icon: 'text-yellow-500',
        };
      default:
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-500',
          text: 'text-amber-900',
          badge: 'bg-amber-500',
          icon: 'text-amber-500',
        };
    }
  };

  const obtenerTextoTipo = (tipo: AlertaCritica['tipo']) => {
    switch (tipo) {
      case 'riesgo_suicidio':
        return 'Riesgo Alto - Posible Ideación Suicida';
      case 'depresion_severa':
        return 'Depresión Severa';
      case 'ansiedad_severa':
        return 'Ansiedad Severa';
      default:
        return 'Moderadamente Severa';
    }
  };

  const alertasNoRevisadas = alertas.filter(a => !alertasRevisadas.has(a.id));
  const cantidadCritica = alertasNoRevisadas.length;

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando alertas críticas"
        className="mb-8"
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Cargando alertas críticas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (cantidadCritica === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-green-900">
                Sin casos críticos urgentes
              </h2>
              <p className="text-sm text-green-700 mt-1">
                No hay evaluaciones con severidad alta en los últimos 7 días
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      role="region"
      aria-labelledby="alertas-criticas-heading"
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-l-4 border-red-600 rounded-lg shadow-md overflow-hidden">
        {/* Header colapsable */}
        <button
          onClick={() => setExpandido(!expandido)}
          aria-expanded={expandido}
          aria-controls="panel-alertas-criticas"
          className="w-full p-6 flex items-center justify-between hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className="h-6 w-6 text-red-700 animate-pulse"
              aria-hidden="true"
            />
            <div className="text-left">
              <h2
                id="alertas-criticas-heading"
                className="text-xl font-semibold text-gray-900"
              >
                Casos Críticos Urgentes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Requieren atención inmediata
              </p>
            </div>
            <div
              className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium"
              role="status"
              aria-live="polite"
            >
              {cantidadCritica} {cantidadCritica === 1 ? 'caso' : 'casos'}
            </div>
          </div>
          {expandido ? (
            <ChevronUp className="h-5 w-5 text-gray-600" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" aria-hidden="true" />
          )}
        </button>

        {/* Panel de alertas */}
        <AnimatePresence>
          {expandido && (
            <motion.div
              id="panel-alertas-criticas"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200"
            >
              <div className="p-6 space-y-3" role="list">
                {alertasNoRevisadas.map((alerta, index) => {
                  const colores = obtenerColorAlerta(alerta.tipo);

                  return (
                    <motion.div
                      key={alerta.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      role="listitem"
                      aria-label={`Alerta crítica: ${alerta.usuario.nombre}, ${alerta.evaluacion.tipo}: ${alerta.evaluacion.puntuacion} puntos`}
                      className={`${colores.bg} rounded-lg p-4 border-l-4 ${colores.border} shadow-sm`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Usuario y tipo de alerta */}
                          <div className="flex items-start gap-3 mb-3">
                            <ExclamationCircle
                              className={`h-5 w-5 ${colores.icon} flex-shrink-0 mt-0.5`}
                              aria-hidden="true"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-gray-900">
                                  {alerta.usuario.nombre}
                                </span>
                                <span
                                  className={`px-2 py-0.5 ${colores.badge} text-white rounded-full text-xs font-medium`}
                                  role="status"
                                >
                                  {obtenerTextoTipo(alerta.tipo)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{alerta.usuario.email}</p>
                            </div>
                          </div>

                          {/* Detalles de la evaluación */}
                          <div className="ml-8 space-y-1 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-700">
                                <strong>{alerta.evaluacion.tipo}:</strong>{' '}
                                <span className="text-lg font-bold text-gray-900">
                                  {alerta.evaluacion.puntuacion}
                                </span>{' '}
                                puntos
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" aria-hidden="true" />
                              <span>
                                Evaluación hace {alerta.diasDesdeEvaluacion}{' '}
                                {alerta.diasDesdeEvaluacion === 1 ? 'día' : 'días'}
                              </span>
                            </div>
                          </div>

                          {/* Acción recomendada */}
                          <div className={`ml-8 ${colores.bg} border ${colores.border} rounded p-3`}>
                            <p className={`text-sm ${colores.text}`}>
                              <strong>Acción recomendada:</strong>{' '}
                              {alerta.accionRecomendada}
                            </p>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link href={`/admin/historiales?usuario=${alerta.usuario.id}`}>
                            <button
                              className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                              aria-label={`Ver historial completo de ${alerta.usuario.nombre}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                              Ver Historial
                            </button>
                          </Link>

                          <button
                            onClick={() => marcarComoRevisada(alerta.id)}
                            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            aria-label={`Marcar como revisado el caso de ${alerta.usuario.nombre}`}
                          >
                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                            Marcar Revisado
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Anuncio para lectores de pantalla */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {cantidadCritica > 0 && (
          `Hay ${cantidadCritica} casos críticos que requieren atención urgente`
        )}
      </div>
    </motion.div>
  );
}
