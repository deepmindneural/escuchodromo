'use client';

import { motion } from 'framer-motion';
import { FaSearch, FaHome, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import Navegacion from '../lib/componentes/layout/Navegacion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navegacion />
      
      <div className="flex items-center justify-center min-h-screen pt-20 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Número 404 animado */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4"
          >
            404
          </motion.div>

          {/* Ícono de búsqueda flotante */}
          <motion.div
            animate={{ 
              y: [-10, 10, -10],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="text-6xl text-purple-400 mb-8"
          >
            <FaSearch />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Página no encontrada
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-gray-600 mb-8"
          >
            La página que buscas no existe o ha sido movida. 
            Pero no te preocupes, estamos aquí para ayudarte a encontrar lo que necesitas.
          </motion.p>

          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaHome />
                Ir al inicio
              </motion.button>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl shadow-lg hover:bg-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <FaArrowLeft />
              Volver atrás
            </button>
          </motion.div>

          {/* Enlaces útiles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto"
          >
            <Link
              href="/chat"
              className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
            >
              <div className="text-2xl text-teal-600 mb-2">💬</div>
              <p className="text-sm font-medium text-gray-700">Chat</p>
            </Link>

            <Link
              href="/evaluaciones"
              className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
            >
              <div className="text-2xl text-green-600 mb-2">📊</div>
              <p className="text-sm font-medium text-gray-700">Evaluaciones</p>
            </Link>

            <Link
              href="/servicios"
              className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
            >
              <div className="text-2xl text-blue-600 mb-2">🎯</div>
              <p className="text-sm font-medium text-gray-700">Servicios</p>
            </Link>
          </motion.div>

          {/* Mensaje de apoyo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 p-6 bg-teal-50 rounded-xl border border-teal-200"
          >
            <h3 className="font-semibold text-teal-800 mb-2">Recuerda</h3>
            <p className="text-teal-700 text-sm">
              Estamos aquí para apoyarte en tu bienestar emocional. 
              Si necesitas hablar con alguien, nuestro chat está disponible 24/7.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}