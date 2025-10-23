/**
 * AdminStatCard - Tarjeta de estadísticas con animaciones unificadas
 * Uso: KPIs y métricas principales del dashboard
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  titulo: string;
  valor: number;
  icono: LucideIcon | any;
  color?: string; // Gradiente Tailwind: 'from-blue-400 to-blue-600'
  cambio?: number;
  tendencia?: 'up' | 'down' | 'neutral';
  sufijo?: string;
  prefijo?: string;
  descripcion?: string;
  formato?: 'numero' | 'moneda' | 'porcentaje';
  moneda?: string;
  delay?: number;
}

export function AdminStatCard({
  titulo,
  valor,
  icono: Icono,
  color = 'from-teal-400 to-teal-600',
  cambio,
  tendencia = 'neutral',
  sufijo = '',
  prefijo = '',
  descripcion,
  formato = 'numero',
  moneda = 'COP',
  delay = 0,
}: AdminStatCardProps) {
  const formatearValor = () => {
    if (formato === 'moneda') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: moneda,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(valor);
    }

    if (formato === 'porcentaje') {
      return <CountUp end={valor} duration={2} suffix="%" decimals={1} />;
    }

    return <CountUp end={valor} duration={2} prefix={prefijo} suffix={sufijo} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
    >
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Icono con gradiente */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md transform group-hover:scale-110 transition-transform duration-300`}
          >
            <Icono className="text-2xl text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Título */}
        <p className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
          {titulo}
        </p>

        {/* Valor principal */}
        <p className="text-4xl font-bold text-gray-900 mb-3">
          {formatearValor()}
        </p>

        {/* Cambio y tendencia */}
        <div className="flex items-center justify-between">
          {cambio !== undefined && tendencia !== 'neutral' ? (
            <div className="flex items-center gap-1">
              {tendencia === 'up' ? (
                <FaArrowUp className="text-green-500 text-sm" aria-hidden="true" />
              ) : (
                <FaArrowDown className="text-red-500 text-sm" aria-hidden="true" />
              )}
              <span
                className={`text-sm font-semibold ${
                  tendencia === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(cambio)}% hoy
              </span>
            </div>
          ) : (
            <div />
          )}

          {descripcion && (
            <span className="text-xs text-gray-500 italic">{descripcion}</span>
          )}
        </div>
      </div>

      {/* Línea decorativa inferior */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
    </motion.div>
  );
}
