'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaHome, FaSyncAlt } from 'react-icons/fa';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para debugging
    console.error('Error capturado por boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="text-6xl text-red-500 mb-6"
        >
          <FaExclamationTriangle />
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ¡Oops! Algo salió mal
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Ha ocurrido un error inesperado. No te preocupes, nuestro equipo ha sido notificado.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left"
          >
            <h3 className="font-semibold text-red-800 mb-2">Error técnico:</h3>
            <p className="text-red-700 text-sm font-mono">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-red-600 text-xs mt-2">
                ID: {error.digest}
              </p>
            )}
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            <FaSyncAlt />
            Intentar de nuevo
          </motion.button>

          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-colors"
            >
              <FaHome />
              Ir al inicio
            </motion.button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 bg-teal-50 rounded-xl border border-teal-200"
        >
          <h3 className="font-semibold text-teal-800 mb-2">¿Necesitas ayuda inmediata?</h3>
          <p className="text-teal-700 text-sm mb-3">
            Si estás experimentando una crisis emocional, no dudes en contactar:
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-teal-800">📞 Línea Nacional: <strong>106</strong></p>
            <p className="text-teal-800">🚨 Emergencias: <strong>123</strong></p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}