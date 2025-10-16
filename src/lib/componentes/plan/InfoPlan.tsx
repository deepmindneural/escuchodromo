'use client';

import { FaCrown, FaCheck, FaTimes, FaArrowUp } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePlanUsuario } from '../../hooks/usePlanUsuario';
import { obtenerNombrePlan, obtenerDescripcionPlan } from '../../planes';

/**
 * Componente que muestra la información del plan actual del usuario
 */
export default function InfoPlan() {
  const { planInfo, cargando } = usePlanUsuario();

  if (cargando) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!planInfo) {
    return null;
  }

  const esGratis = planInfo.plan === null;
  const colorPlan = esGratis
    ? 'from-gray-400 to-gray-600'
    : planInfo.plan === 'basico'
    ? 'from-blue-400 to-blue-600'
    : planInfo.plan === 'premium'
    ? 'from-purple-400 to-purple-600'
    : 'from-yellow-400 to-yellow-600';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorPlan} rounded-full flex items-center justify-center`}>
            <FaCrown className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Plan {obtenerNombrePlan(planInfo.plan)}
            </h3>
            <p className="text-sm text-gray-600">
              {obtenerDescripcionPlan(planInfo.plan)}
            </p>
          </div>
        </div>

        {esGratis && (
          <Link href="/planes">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaArrowUp className="inline mr-2" />
              Mejorar Plan
            </motion.button>
          </Link>
        )}
      </div>

      {/* Características incluidas */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">Características incluidas:</h4>
        <div className="grid grid-cols-1 gap-2">
          {planInfo.caracteristicas.map((caracteristica, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <FaCheck className="text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{formatearCaracteristica(caracteristica)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Límites del plan */}
      <div className="border-t mt-4 pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">Límites mensuales:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Mensajes de chat:</span>
            <span className="font-medium text-gray-900">
              {planInfo.limites.mensajesChat === 'ilimitado'
                ? 'Ilimitado'
                : planInfo.limites.mensajesChat}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Evaluaciones:</span>
            <span className="font-medium text-gray-900">
              {planInfo.limites.evaluacionesMes === 'ilimitado'
                ? 'Ilimitado'
                : planInfo.limites.evaluacionesMes}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Historial:</span>
            <span className="font-medium text-gray-900">
              {planInfo.limites.almacenamientoHistorial} días
            </span>
          </div>
        </div>
      </div>

      {/* Fecha de vencimiento si hay suscripción activa */}
      {planInfo.suscripcionActiva && planInfo.fechaVencimiento && (
        <div className="border-t mt-4 pt-4">
          <div className="text-sm text-gray-600">
            Próxima renovación:{' '}
            <span className="font-medium text-gray-900">
              {new Date(planInfo.fechaVencimiento).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Formatea el nombre de la característica para mostrarlo al usuario
 */
function formatearCaracteristica(caracteristica: string): string {
  const nombres: Record<string, string> = {
    chat_basico: 'Chat básico',
    chat_ilimitado: 'Chat ilimitado',
    evaluaciones_basicas: 'Evaluaciones básicas (PHQ-9, GAD-7)',
    evaluaciones_avanzadas: 'Evaluaciones avanzadas',
    recomendaciones_ia: 'Recomendaciones con IA',
    analisis_emocional: 'Análisis emocional avanzado',
    voz_interactiva: 'Interacción por voz',
    historial_completo: 'Historial completo',
    exportar_reportes: 'Exportar reportes en PDF',
    soporte_prioritario: 'Soporte prioritario',
    sesiones_terapeuticas: 'Sesiones terapéuticas',
  };
  return nombres[caracteristica] || caracteristica;
}
