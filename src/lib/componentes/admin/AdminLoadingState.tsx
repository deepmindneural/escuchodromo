/**
 * AdminLoadingState - Loading unificado para el admin
 * Uso: Pantalla de carga consistente en todas las páginas
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AdminLoadingStateProps {
  mensaje?: string;
}

export function AdminLoadingState({ mensaje = 'Cargando...' }: AdminLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={mensaje}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center"
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="inline-block"
        >
          <Loader2 className="h-16 w-16 text-teal-500" />
        </motion.div>
        <p className="mt-4 text-gray-600 text-lg font-medium">{mensaje}</p>
      </motion.div>
    </div>
  );
}
