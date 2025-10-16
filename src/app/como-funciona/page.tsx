'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FaBrain, FaComments, FaChartLine, FaShieldAlt, 
  FaUserPlus, FaRobot, FaHeart, FaCheckCircle 
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';

export default function PaginaComoFunciona() {
  const pasos = [
    {
      numero: '01',
      titulo: 'Regístrate Gratis',
      descripcion: 'Crea tu cuenta en segundos y accede a tu espacio personal de bienestar emocional.',
      icono: FaUserPlus,
      color: 'from-blue-400 to-blue-600'
    },
    {
      numero: '02',
      titulo: 'Habla con la IA',
      descripcion: 'Comparte tus pensamientos y emociones con nuestra IA terapéutica entrenada.',
      icono: FaComments,
      color: 'from-purple-400 to-purple-600'
    },
    {
      numero: '03',
      titulo: 'Recibe Apoyo',
      descripcion: 'Obtén respuestas empáticas y herramientas personalizadas para tu bienestar.',
      icono: FaHeart,
      color: 'from-pink-400 to-pink-600'
    },
    {
      numero: '04',
      titulo: 'Sigue tu Progreso',
      descripcion: 'Monitorea tu evolución emocional con evaluaciones y gráficos detallados.',
      icono: FaChartLine,
      color: 'from-green-400 to-green-600'
    }
  ];

  const caracteristicas = [
    {
      icono: FaBrain,
      titulo: 'IA Afectiva Avanzada',
      descripcion: 'Nuestra inteligencia artificial comprende el contexto emocional y responde con empatía genuina.'
    },
    {
      icono: FaShieldAlt,
      titulo: 'Privacidad Garantizada',
      descripcion: 'Tus conversaciones están encriptadas y protegidas con los más altos estándares de seguridad.'
    },
    {
      icono: FaRobot,
      titulo: 'Disponible 24/7',
      descripcion: 'Accede a apoyo emocional cuando lo necesites, sin citas ni tiempos de espera.'
    },
    {
      icono: FaChartLine,
      titulo: 'Seguimiento Científico',
      descripcion: 'Utilizamos evaluaciones validadas como PHQ-9 y GAD-7 para monitorear tu progreso.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      <Navegacion />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ¿Cómo Funciona Escuchodromo?
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
              Tu viaje hacia el bienestar emocional es simple y seguro. 
              Descubre cómo nuestra plataforma te acompaña en cada paso.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pasos */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Tu Camino en 4 Simples Pasos
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pasos.map((paso, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl shadow-xl p-6 h-full hover:shadow-2xl transition-shadow duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-br ${paso.color} rounded-full flex items-center justify-center mb-4`}>
                    <paso.icono className="text-2xl text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gray-200 absolute top-4 right-4">
                    {paso.numero}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {paso.titulo}
                  </h3>
                  <p className="text-gray-600">
                    {paso.descripcion}
                  </p>
                </div>
                {index < pasos.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 + 0.3 }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M9 6L15 12L9 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            ¿Qué hace especial a Escuchodromo?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {caracteristicas.map((caracteristica, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <caracteristica.icono className="text-2xl text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {caracteristica.titulo}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {caracteristica.descripcion}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-1"
          >
            <div className="bg-white rounded-3xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                Mira Escuchodromo en Acción
              </h2>
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Video demostrativo próximamente</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              ¿Listo para Empezar?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Únete a miles de personas que ya están mejorando su bienestar emocional
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Probar Chat Gratis
                </motion.button>
              </Link>
              <Link href="/registrar">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600"
                >
                  Crear Cuenta
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}