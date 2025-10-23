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
      className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-xl p-8 mb-8 text-white"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {icono && (
            <div className="flex-shrink-0 text-5xl">{icono}</div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {titulo}
            </h1>
            {descripcion && (
              <p className="text-white/90 text-lg">
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
    </motion.div>
  );
}
