'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaChartLine, FaComments, FaCrown, FaTrophy, FaRobot, FaMicrophone,
  FaClipboardList, FaChartBar, FaBullseye, FaUser, FaTasks, FaCreditCard,
  FaHistory, FaUserMd, FaCalendar, FaFileAlt, FaUsers, FaHeart,
  FaExclamationTriangle, FaArrowUp, FaCheckCircle, FaInfinity, FaLock
} from 'react-icons/fa';
import { Boton } from '../../lib/componentes/ui/boton';
import { Progress } from '../../lib/componentes/ui/progress';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { useUsuario, usePerfilUsuario } from '../../lib/supabase/hooks';
import { cerrarSesion as cerrarSesionSupabase } from '../../lib/supabase/auth';

// Interfaces para tipar los datos del plan
interface CaracteristicaPlan {
  nombre: string;
  incluido: boolean;
}

interface PlanDetalle {
  codigo: string;
  nombre: string;
  descripcion: string;
  limite_conversaciones: number | null;
  limite_evaluaciones: number | null;
  caracteristicas: CaracteristicaPlan[];
}

interface SuscripcionDetalle {
  plan: string;
  periodo: string;
  estado: string;
  fecha_fin: string;
  Plan?: PlanDetalle;
}

interface UsoActual {
  mensajesUsados: number;
  evaluacionesUsadas: number;
}

// Configuración de funcionalidades: qué requiere plan premium
const FUNCIONALIDADES_CONFIG = {
  // Funcionalidades FREE (siempre disponibles)
  free: [
    'chat', 'evaluaciones', 'perfil', 'animo', 'progreso'
  ],
  // Funcionalidades que requieren límites/plan
  limitadas: [
    'voz', 'mis-citas', 'recomendaciones', 'plan-accion'
  ],
  // Funcionalidades Premium
  premium: [
    'pagos', 'evaluaciones/historial'
  ]
};

export default function PaginaDashboard() {
  const router = useRouter();
  const { usuario: authUsuario, cargando: cargandoAuth } = useUsuario();
  const { perfil, cargando: cargandoPerfil } = usePerfilUsuario();
  const [estadisticas, setEstadisticas] = useState({
    totalEvaluaciones: 0,
    totalConversaciones: 0,
    ultimaEvaluacion: null as any,
    planActual: 'Gratis' as string,
  });

  // Estado para datos del plan
  const [suscripcionDetalle, setSuscripcionDetalle] = useState<SuscripcionDetalle | null>(null);
  const [usoActual, setUsoActual] = useState<UsoActual>({ mensajesUsados: 0, evaluacionesUsadas: 0 });
  const [cargandoPlan, setCargandoPlan] = useState(true);
  const [errorCargaPlan, setErrorCargaPlan] = useState(false);
  const [esPlanFree, setEsPlanFree] = useState(true);

  const cargando = cargandoAuth || cargandoPerfil;
  const usuario = perfil;

  useEffect(() => {
    if (usuario?.id) {
      cargarEstadisticas();
      cargarDatosPlan();
    }
  }, [usuario?.id]);

  const cargarEstadisticas = async () => {
    if (!usuario?.id || !authUsuario?.id) return;

    try {
      const { obtenerClienteNavegador } = await import('../../lib/supabase/cliente');
      const supabase = obtenerClienteNavegador();

      // Contar evaluaciones
      const { count: totalEvaluaciones } = await supabase
        .from('Resultado')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id);

      // Contar conversaciones
      const { count: totalConversaciones } = await supabase
        .from('Conversacion')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id);

      // Obtener plan actual usando función RPC para evitar error 406
      const { data: suscripcionData } = await supabase
        .rpc('obtener_suscripcion_usuario', {
          p_auth_id: authUsuario.id
        });

      const suscripcion = suscripcionData && suscripcionData.length > 0 ? suscripcionData[0] : null;

      setEstadisticas({
        totalEvaluaciones: totalEvaluaciones || 0,
        totalConversaciones: totalConversaciones || 0,
        ultimaEvaluacion: null,
        planActual: suscripcion?.plan || 'Gratis',
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const cargarDatosPlan = async () => {
    if (!usuario?.id || !authUsuario?.id) return;

    setCargandoPlan(true);
    setErrorCargaPlan(false);

    try {
      const { obtenerClienteNavegador } = await import('../../lib/supabase/cliente');
      const supabase = obtenerClienteNavegador();

      // 1. Obtener suscripción activa del usuario usando RPC (evita error 406)
      const { data: suscripcionArray, error: errorSuscripcion } = await supabase
        .rpc('obtener_suscripcion_usuario');

      if (errorSuscripcion) {
        console.error('Error al obtener suscripción:', errorSuscripcion);
      }

      // La función RPC retorna un array, tomamos el primer elemento o null
      const suscripcion = suscripcionArray && suscripcionArray.length > 0 ? suscripcionArray[0] : null;

      // 2. Obtener detalles del plan basado en el código de la suscripción usando RPC
      let codigoPlan = suscripcion?.plan || 'basico';

      // Determinar si es plan FREE
      setEsPlanFree(!suscripcion || codigoPlan === 'basico' || codigoPlan === 'gratis');

      // Usar la función RPC para obtener planes (evita problemas de RLS)
      const { data: planesDisponibles, error: errorPlanes } = await supabase
        .rpc('obtener_planes_publico', {
          p_tipo_usuario: 'paciente',
          p_moneda: 'COP'
        });

      if (errorPlanes) {
        console.error('Error al obtener planes:', errorPlanes);
        setErrorCargaPlan(true);
      }

      // Si no hay planes disponibles, crear un plan básico de fallback
      if (!planesDisponibles || planesDisponibles.length === 0) {
        console.warn('No hay planes disponibles en la base de datos');
        setSuscripcionDetalle({
          plan: 'basico',
          periodo: 'mensual',
          estado: 'activa',
          fecha_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          Plan: {
            codigo: 'basico',
            nombre: 'Plan Básico',
            descripcion: 'Acceso a funcionalidades básicas de la plataforma',
            limite_conversaciones: 20,
            limite_evaluaciones: 3,
            caracteristicas: [
              { nombre: 'Chat con IA (20 mensajes/mes)', incluido: true },
              { nombre: 'Evaluaciones básicas (3/mes)', incluido: true },
              { nombre: 'Registro de ánimo', incluido: true }
            ]
          }
        });
        setCargandoPlan(false);
        return;
      }

      // Buscar el plan específico del usuario en los planes disponibles
      const planDetalle = planesDisponibles?.find((p: any) => p.codigo === codigoPlan);

      if (!planDetalle) {
        console.error('Plan no encontrado:', codigoPlan);
        // Si falla, usar plan básico como fallback
        const planBasico = planesDisponibles?.find((p: any) => p.codigo === 'basico' || p.codigo === 'gratis');

        if (planBasico) {
          setSuscripcionDetalle({
            plan: planBasico.codigo,
            periodo: 'mensual',
            estado: 'activa',
            fecha_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            Plan: planBasico as PlanDetalle
          });
        } else {
          // Fallback completo si no existe plan básico
          setErrorCargaPlan(true);
        }
      } else if (planDetalle) {
        // Combinar datos de suscripción y plan
        setSuscripcionDetalle({
          plan: suscripcion?.plan || planDetalle.codigo,
          periodo: suscripcion?.periodo || 'mensual',
          estado: suscripcion?.estado || 'activa',
          fecha_fin: suscripcion?.fecha_fin || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          Plan: planDetalle as PlanDetalle
        });
      }

      // 3. Calcular uso del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      // Contar mensajes del mes (rol 'usuario')
      // Primero obtenemos las IDs de las conversaciones del usuario
      const { data: conversaciones } = await supabase
        .from('Conversacion')
        .select('id')
        .eq('usuario_id', usuario.id);

      const conversacionIds = conversaciones?.map(c => c.id) || [];

      // Luego contamos los mensajes del usuario en esas conversaciones
      const { count: mensajesUsados } = await supabase
        .from('Mensaje')
        .select('id', { count: 'exact', head: true })
        .in('conversacion_id', conversacionIds.length > 0 ? conversacionIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('rol', 'usuario')
        .gte('creado_en', inicioMes.toISOString());

      // Contar evaluaciones completadas del mes
      const { count: evaluacionesUsadas } = await supabase
        .from('Resultado')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id)
        .gte('creado_en', inicioMes.toISOString());

      setUsoActual({
        mensajesUsados: mensajesUsados || 0,
        evaluacionesUsadas: evaluacionesUsadas || 0
      });

    } catch (error) {
      console.error('Error al cargar datos del plan:', error);
      setErrorCargaPlan(true);
    } finally {
      setCargandoPlan(false);
    }
  };

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesionSupabase();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Cálculos para alertas de límite
  const calcularPorcentajeUso = (usado: number, limite: number | null): number => {
    if (limite === null || limite === 0) return 0;
    return Math.min((usado / limite) * 100, 100);
  };

  const estaProximoAlLimite = (usado: number, limite: number | null): boolean => {
    if (limite === null) return false;
    return calcularPorcentajeUso(usado, limite) >= 80;
  };

  // Función para determinar si una funcionalidad requiere upgrade
  const requiereUpgrade = (ruta: string): boolean => {
    if (!esPlanFree) return false;
    return FUNCIONALIDADES_CONFIG.premium.includes(ruta);
  };

  // Función para determinar badge de funcionalidad
  const obtenerBadgeFuncionalidad = (ruta: string): { texto: string; color: string } | null => {
    if (FUNCIONALIDADES_CONFIG.free.includes(ruta)) {
      return { texto: 'Gratis', color: 'bg-green-100 text-green-700' };
    }
    if (FUNCIONALIDADES_CONFIG.limitadas.includes(ruta)) {
      return { texto: 'Limitado', color: 'bg-yellow-100 text-yellow-700' };
    }
    if (FUNCIONALIDADES_CONFIG.premium.includes(ruta)) {
      return { texto: 'Premium', color: 'bg-purple-100 text-purple-700' };
    }
    return null;
  };

  // Mostrar loading mientras carga O si no hay usuario (el middleware redirigirá)
  if (cargando || !usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  // Solo renderizar si es USUARIO (el middleware ya bloqueó otros roles)
  if (usuario.rol !== 'USUARIO') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  const planDetalle = suscripcionDetalle?.Plan;
  const limiteMensajes = planDetalle?.limite_conversaciones;
  const limiteEvaluaciones = planDetalle?.limite_evaluaciones;
  const porcentajeMensajes = calcularPorcentajeUso(usoActual.mensajesUsados, limiteMensajes);
  const porcentajeEvaluaciones = calcularPorcentajeUso(usoActual.evaluacionesUsadas, limiteEvaluaciones);
  const proximoLimiteMensajes = estaProximoAlLimite(usoActual.mensajesUsados, limiteMensajes);
  const proximoLimiteEvaluaciones = estaProximoAlLimite(usoActual.evaluacionesUsadas, limiteEvaluaciones);
  const algunLimiteProximo = proximoLimiteMensajes || proximoLimiteEvaluaciones;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Header con información del usuario */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Hola, {usuario?.nombre || 'Usuario'}! 👋
              </h1>
              <p className="text-white/90 text-lg">
                Bienvenido a tu espacio de bienestar emocional
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Plan: {estadisticas.planActual}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {usuario?.email}
                </span>
              </div>
            </div>
            <Link href="/perfil">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white text-teal-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Ver mi perfil completo
              </motion.button>
            </Link>
          </div>
        </div>

        {/* BANNER DE BIENVENIDA PARA USUARIO FREE */}
        {esPlanFree && !cargandoPlan && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg"
            role="region"
            aria-label="Mensaje de bienvenida para usuario gratuito"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaHeart className="text-2xl text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-blue-900 mb-2">
                  Estás usando el Plan Gratuito
                </h2>
                <p className="text-blue-800 text-sm mb-3">
                  Tienes acceso a funcionalidades básicas para comenzar tu viaje de bienestar emocional.
                  Todas las secciones están disponibles, pero algunas tienen límites de uso mensuales.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/precios" className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <FaTrophy aria-hidden="true" />
                      Ver Planes Premium
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECCIÓN: MI PLAN ACTUAL */}
        {!cargandoPlan && planDetalle && !errorCargaPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 shadow-lg"
            role="region"
            aria-label="Información de tu plan actual"
          >
            {/* Header del Plan */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-green-900 mb-1 flex items-center gap-2">
                  <FaCrown className="text-yellow-500" aria-hidden="true" />
                  Mi Plan: {planDetalle.nombre}
                </h2>
                <p className="text-sm text-green-700">
                  {suscripcionDetalle?.periodo === 'mensual'
                    ? 'Facturación mensual'
                    : 'Facturación anual (20% de descuento)'
                  }
                </p>
              </div>
              <Link href="/precios" className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-xl">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  aria-label="Cambiar o mejorar plan de suscripción"
                >
                  <FaArrowUp aria-hidden="true" />
                  {planDetalle.codigo === 'basico' ? 'Actualizar Plan' : 'Cambiar Plan'}
                </motion.button>
              </Link>
            </div>

            {/* Descripción del Plan */}
            <p className="text-green-800 mb-6 text-sm leading-relaxed">
              {planDetalle.descripcion}
            </p>

            {/* Límites de Uso */}
            <div className="space-y-6">
              {/* Mensajes con IA */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-green-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <FaComments className="text-green-700 text-xl" aria-hidden="true" />
                    <span className="text-base font-semibold text-green-900">
                      Mensajes con IA
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-800" aria-live="polite">
                    {usoActual.mensajesUsados}
                    <span className="text-green-600 mx-1">/</span>
                    {limiteMensajes !== null ? limiteMensajes.toLocaleString() : (
                      <FaInfinity className="inline-block ml-1 text-green-600" aria-label="ilimitado" />
                    )}
                  </span>
                </div>

                {limiteMensajes !== null ? (
                  <>
                    <Progress
                      value={porcentajeMensajes}
                      className="h-3 bg-green-100"
                      aria-label={`Has usado ${porcentajeMensajes.toFixed(0)}% de tus mensajes disponibles`}
                      aria-valuenow={porcentajeMensajes}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                    <p className="text-xs text-green-700 mt-2">
                      {limiteMensajes - usoActual.mensajesUsados > 0
                        ? `Te quedan ${limiteMensajes - usoActual.mensajesUsados} mensajes este mes`
                        : 'Has alcanzado el límite de mensajes'
                      }
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-lg">
                    <FaCheckCircle aria-hidden="true" />
                    <span className="text-sm font-medium">Mensajes ilimitados</span>
                  </div>
                )}
              </div>

              {/* Evaluaciones Psicológicas */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-green-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <FaClipboardList className="text-green-700 text-xl" aria-hidden="true" />
                    <span className="text-base font-semibold text-green-900">
                      Evaluaciones psicológicas
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-800" aria-live="polite">
                    {usoActual.evaluacionesUsadas}
                    <span className="text-green-600 mx-1">/</span>
                    {limiteEvaluaciones !== null ? limiteEvaluaciones : (
                      <FaInfinity className="inline-block ml-1 text-green-600" aria-label="ilimitado" />
                    )}
                  </span>
                </div>

                {limiteEvaluaciones !== null ? (
                  <>
                    <Progress
                      value={porcentajeEvaluaciones}
                      className="h-3 bg-green-100"
                      aria-label={`Has usado ${porcentajeEvaluaciones.toFixed(0)}% de tus evaluaciones disponibles`}
                      aria-valuenow={porcentajeEvaluaciones}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                    <p className="text-xs text-green-700 mt-2">
                      {limiteEvaluaciones - usoActual.evaluacionesUsadas > 0
                        ? `Te quedan ${limiteEvaluaciones - usoActual.evaluacionesUsadas} evaluaciones este mes`
                        : 'Has alcanzado el límite de evaluaciones'
                      }
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-lg">
                    <FaCheckCircle aria-hidden="true" />
                    <span className="text-sm font-medium">Evaluaciones ilimitadas</span>
                  </div>
                )}
              </div>
            </div>

            {/* Banner de upgrade si está cerca del límite */}
            {algunLimiteProximo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-5 shadow-md"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle
                    className="text-orange-600 text-2xl mt-1 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-900 mb-1">
                      Estás cerca del límite
                    </h3>
                    <p className="text-orange-800 text-sm mb-3">
                      Has usado más del 80% de {proximoLimiteMensajes && proximoLimiteEvaluaciones
                        ? 'tus mensajes y evaluaciones'
                        : proximoLimiteMensajes
                          ? 'tus mensajes'
                          : 'tus evaluaciones'
                      }.
                      {' '}Considera actualizar tu plan para seguir disfrutando sin interrupciones.
                    </p>
                    <Link href="/precios" className="focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                      >
                        <FaTrophy aria-hidden="true" />
                        Actualizar ahora
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Mensaje de error si falla la carga del plan */}
        {!cargandoPlan && errorCargaPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-6"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 text-xl mt-1" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                  No pudimos cargar tu información de plan
                </h3>
                <p className="text-yellow-800 text-sm mb-3">
                  Puedes seguir usando todas las funcionalidades básicas del dashboard. Si el problema persiste, contáctanos.
                </p>
                <Link href="/precios">
                  <span className="text-yellow-700 hover:text-yellow-900 font-medium text-sm underline">
                    Ver planes disponibles
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaClipboardList className="text-3xl" />
              </div>
              <span className="text-4xl font-bold">{estadisticas.totalEvaluaciones}</span>
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Evaluaciones</p>
            <Link href="/evaluaciones/historial" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Ver historial <FaChartLine />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaComments className="text-3xl" />
              </div>
              <span className="text-4xl font-bold">{estadisticas.totalConversaciones}</span>
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Conversaciones</p>
            <Link href="/chat" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Iniciar chat <FaRobot />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaCrown className="text-3xl" />
              </div>
              <span className="text-2xl font-bold">{estadisticas.planActual}</span>
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Mi Plan</p>
            <Link href="/precios" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Mejorar plan <FaTrophy />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaChartBar className="text-3xl" />
              </div>
              <FaHeart className="text-4xl animate-pulse" />
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Progreso</p>
            <Link href="/progreso" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Ver métricas <FaChartLine />
            </Link>
          </motion.div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Accesos Rápidos</h2>
          {esPlanFree && (
            <span className="text-sm text-gray-600">
              <FaHeart className="inline-block mr-1 text-red-500" aria-hidden="true" />
              Todas las funciones están disponibles
            </span>
          )}
        </div>

        {/* Dashboard para USUARIO - TODAS LAS TARJETAS VISIBLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/chat">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-teal-200 relative"
              >
                {obtenerBadgeFuncionalidad('chat') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('chat')!.color}`}>
                    {obtenerBadgeFuncionalidad('chat')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <FaRobot className="text-3xl text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Chat con IA
                </h3>
                <p className="text-gray-600 text-sm">
                  Habla con nuestra IA sobre cómo te sientes
                </p>
              </motion.div>
            </Link>

            <Link href="/voz">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-200 relative"
              >
                {obtenerBadgeFuncionalidad('voz') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('voz')!.color}`}>
                    {obtenerBadgeFuncionalidad('voz')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <FaMicrophone className="text-3xl text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Hablar por Voz
                </h3>
                <p className="text-gray-600 text-sm">
                  Expresa tus emociones hablando con la IA
                </p>
              </motion.div>
            </Link>

            <Link href="/evaluaciones">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-200 relative"
              >
                {obtenerBadgeFuncionalidad('evaluaciones') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('evaluaciones')!.color}`}>
                    {obtenerBadgeFuncionalidad('evaluaciones')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                  <FaClipboardList className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Evaluaciones
                </h3>
                <p className="text-gray-600 text-sm">
                  Realiza pruebas psicológicas validadas
                </p>
              </motion.div>
            </Link>

            <Link href="/mis-citas">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-rose-200 relative"
              >
                {obtenerBadgeFuncionalidad('mis-citas') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('mis-citas')!.color}`}>
                    {obtenerBadgeFuncionalidad('mis-citas')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <FaCalendar className="text-3xl text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mis Citas
                </h3>
                <p className="text-gray-600 text-sm">
                  Gestiona tus citas con profesionales
                </p>
              </motion.div>
            </Link>

            <Link href="/animo">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-green-200 relative"
              >
                {obtenerBadgeFuncionalidad('animo') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('animo')!.color}`}>
                    {obtenerBadgeFuncionalidad('animo')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                  <FaChartLine className="text-3xl text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Registro de Ánimo
                </h3>
                <p className="text-gray-600 text-sm">
                  Registra y monitorea tu estado emocional
                </p>
              </motion.div>
            </Link>

            <Link href="/recomendaciones">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-yellow-200 relative"
              >
                {obtenerBadgeFuncionalidad('recomendaciones') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('recomendaciones')!.color}`}>
                    {obtenerBadgeFuncionalidad('recomendaciones')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <FaBullseye className="text-3xl text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Recomendaciones
                </h3>
                <p className="text-gray-600 text-sm">
                  Recibe sugerencias personalizadas
                </p>
              </motion.div>
            </Link>

            <Link href="/perfil">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-gray-200 relative"
              >
                {obtenerBadgeFuncionalidad('perfil') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('perfil')!.color}`}>
                    {obtenerBadgeFuncionalidad('perfil')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <FaUser className="text-3xl text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mi Perfil
                </h3>
                <p className="text-gray-600 text-sm">
                  Gestiona tu información personal
                </p>
              </motion.div>
            </Link>

            <Link href="/progreso">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-indigo-200 relative"
              >
                {obtenerBadgeFuncionalidad('progreso') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('progreso')!.color}`}>
                    {obtenerBadgeFuncionalidad('progreso')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-4">
                  <FaChartBar className="text-3xl text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mi Progreso
                </h3>
                <p className="text-gray-600 text-sm">
                  Visualiza tu evolución y métricas
                </p>
              </motion.div>
            </Link>

            <Link href="/plan-accion">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-pink-200 relative"
              >
                {obtenerBadgeFuncionalidad('plan-accion') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('plan-accion')!.color}`}>
                    {obtenerBadgeFuncionalidad('plan-accion')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mb-4">
                  <FaTasks className="text-3xl text-pink-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Plan de Acción
                </h3>
                <p className="text-gray-600 text-sm">
                  Objetivos personalizados por la IA
                </p>
              </motion.div>
            </Link>

            <Link href="/pagos">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-200 relative"
              >
                {obtenerBadgeFuncionalidad('pagos') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('pagos')!.color}`}>
                    {obtenerBadgeFuncionalidad('pagos')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-4">
                  <FaCreditCard className="text-3xl text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mis Pagos
                </h3>
                <p className="text-gray-600 text-sm">
                  Historial de transacciones y facturas
                </p>
              </motion.div>
            </Link>

            <Link href="/evaluaciones/historial">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-violet-200 relative"
              >
                {obtenerBadgeFuncionalidad('evaluaciones/historial') && (
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${obtenerBadgeFuncionalidad('evaluaciones/historial')!.color}`}>
                    {obtenerBadgeFuncionalidad('evaluaciones/historial')!.texto}
                  </span>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <FaHistory className="text-3xl text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Historial de Evaluaciones
                </h3>
                <p className="text-gray-600 text-sm">
                  Revisa tus evaluaciones anteriores
                </p>
              </motion.div>
            </Link>
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda inmediata?
          </h3>
          <p className="text-gray-700 mb-4">
            Si estás pasando por una crisis o necesitas apoyo urgente, aquí hay recursos disponibles:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Línea Nacional de Prevención del Suicidio: 106 (Colombia)</li>
            <li>• Chat de Crisis: Disponible 24/7</li>
            <li>• Encuentra un profesional cerca de ti</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
