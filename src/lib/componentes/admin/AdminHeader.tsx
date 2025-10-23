/**
 * AdminHeader - Header estándar para todas las páginas del admin
 * Uso: Título, descripción y acciones principales de cada página
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AdminHeaderProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  icono?: ReactNode;
}

export function AdminHeader({ titulo, descripcion, acciones, icono }: AdminHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 mb-8 sticky top-0 z-40 backdrop-blur-sm bg-white/95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {icono && (
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-md">
                <div className="text-white text-2xl">{icono}</div>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {titulo}
              </h1>
              {descripcion && (
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {descripcion}
                </p>
              )}
            </div>
          </div>
          {acciones && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {acciones}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
