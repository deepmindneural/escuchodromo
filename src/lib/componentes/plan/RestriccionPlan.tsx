'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaLock, FaCrown, FaStar } from 'react-icons/fa';
import { tieneAccesoCaracteristica, obtenerNombrePlan, type Caracteristica } from '../../planes';

interface RestriccionPlanProps {
  caracteristica: Caracteristica;
  children: React.ReactNode;
  planRequerido?: 'basico' | 'premium' | 'profesional';
  mensajePersonalizado?: string;
}

/**
 * Componente que restringe el acceso a características según el plan del usuario
 *
 * Uso:
 * <RestriccionPlan caracteristica="voz_interactiva" planRequerido="premium">
 *   <BotonVozInteractiva />
 * </RestriccionPlan>
 */
export default function RestriccionPlan({
  caracteristica,
  children,
  planRequerido,
  mensajePersonalizado,
}: RestriccionPlanProps) {
  const [tieneAcceso, setTieneAcceso] = useState<boolean | null>(null);

  useEffect(() => {
    verificarAcceso();
  }, [caracteristica]);

  const verificarAcceso = async () => {
    const acceso = await tieneAccesoCaracteristica(caracteristica);
    setTieneAcceso(acceso);
  };

  // Mientras se verifica el acceso
  if (tieneAcceso === null) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Si tiene acceso, mostrar el contenido
  if (tieneAcceso) {
    return <>{children}</>;
  }

  // Si no tiene acceso, mostrar mensaje de upgrade
  const iconoPlan = planRequerido === 'profesional' ? FaCrown : FaStar;
  const IconoPlan = iconoPlan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Contenido bloqueado con blur */}
      <div className="pointer-events-none blur-sm opacity-50">
        {children}
      </div>

      {/* Overlay con mensaje de actualización */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-500/90 to-cyan-500/90 rounded-xl backdrop-blur-sm">
        <div className="text-center p-6 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <IconoPlan className="text-3xl text-white" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {planRequerido ? `Plan ${obtenerNombrePlan(planRequerido)} Requerido` : 'Actualiza tu Plan'}
          </h3>

          <p className="text-white/90 mb-6">
            {mensajePersonalizado ||
              `Esta característica está disponible en el plan ${planRequerido ? obtenerNombrePlan(planRequerido) : 'premium'}.`}
          </p>

          <Link href="/planes">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-white text-teal-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Ver Planes
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Componente más simple que solo bloquea interacción sin blur
 */
export function BloquearSinPlan({
  caracteristica,
  children,
  onIntentarUsar,
}: {
  caracteristica: Caracteristica;
  children: React.ReactNode;
  onIntentarUsar?: () => void;
}) {
  const [tieneAcceso, setTieneAcceso] = useState<boolean | null>(null);

  useEffect(() => {
    verificarAcceso();
  }, [caracteristica]);

  const verificarAcceso = async () => {
    const acceso = await tieneAccesoCaracteristica(caracteristica);
    setTieneAcceso(acceso);
  };

  if (tieneAcceso === null) {
    return null;
  }

  if (tieneAcceso) {
    return <>{children}</>;
  }

  const handleClick = () => {
    if (onIntentarUsar) {
      onIntentarUsar();
    }
  };

  return (
    <div onClick={handleClick} className="relative cursor-not-allowed opacity-60">
      <div className="absolute inset-0 z-10" />
      <div className="absolute top-2 right-2 z-20">
        <FaLock className="text-gray-400" />
      </div>
      {children}
    </div>
  );
}
