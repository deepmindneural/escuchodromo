'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FaComments, FaMicrophone, FaChartLine, FaBrain, 
  FaHeart, FaBook, FaMobile, FaUsers, FaCheckCircle,
  FaClock, FaGlobe, FaShieldAlt
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import { ImageWithFallback } from '../../lib/componentes/ui/image-with-fallback';

export default function PaginaServicios() {
  const servicios = [
    {
      icono: FaComments,
      titulo: 'Chat Terapéutico 24/7',
      descripcion: 'Conversaciones ilimitadas con nuestra IA especializada en salud mental',
      caracteristicas: [
        'Respuestas empáticas inmediatas',
        'Sin límites de tiempo',
        'Historial de conversaciones',
        'Modo anónimo disponible'
      ],
      color: 'from-blue-400 to-blue-600',
      destacado: false
    },
    {
      icono: FaMicrophone,
      titulo: 'Terapia por Voz',
      descripcion: 'Habla directamente con la IA como si fuera una sesión presencial',
      caracteristicas: [
        'Reconocimiento de voz avanzado',
        'Análisis de tono emocional',
        'Transcripciones automáticas',
        'Ejercicios de respiración guiados'
      ],
      color: 'from-purple-400 to-purple-600',
      destacado: true
    },
    {
      icono: FaChartLine,
      titulo: 'Evaluaciones Psicológicas',
      descripcion: 'Tests validados científicamente para monitorear tu salud mental',
      caracteristicas: [
        'PHQ-9 para depresión',
        'GAD-7 para ansiedad',
        'Resultados inmediatos',
        'Seguimiento histórico'
      ],
      color: 'from-green-400 to-green-600',
      destacado: false
    },
    {
      icono: FaBrain,
      titulo: 'Planes Personalizados',
      descripcion: 'Programas de bienestar adaptados a tus necesidades específicas',
      caracteristicas: [
        'Análisis de patrones',
        'Recomendaciones diarias',
        'Ejercicios personalizados',
        'Ajustes automáticos'
      ],
      color: 'from-pink-400 to-pink-600',
      destacado: false
    },
    {
      icono: FaBook,
      titulo: 'Biblioteca de Recursos',
      descripcion: 'Acceso a contenido educativo sobre salud mental y bienestar',
      caracteristicas: [
        'Artículos especializados',
        'Técnicas de mindfulness',
        'Meditaciones guiadas',
        'Videos educativos'
      ],
      color: 'from-yellow-400 to-yellow-600',
      destacado: false
    },
    {
      icono: FaUsers,
      titulo: 'Comunidad de Apoyo',
      descripcion: 'Conecta con otros usuarios en un espacio seguro y moderado',
      caracteristicas: [
        'Grupos de apoyo temáticos',
        'Moderación profesional',
        'Eventos virtuales',
        'Compartir experiencias'
      ],
      color: 'from-indigo-400 to-indigo-600',
      destacado: false
    }
  ];

  const beneficios = [
    { icono: FaClock, texto: 'Disponible 24/7 sin citas previas' },
    { icono: FaGlobe, texto: 'Accesible desde cualquier lugar' },
    { icono: FaShieldAlt, texto: 'Completamente privado y seguro' },
    { icono: FaHeart, texto: 'Apoyo empático y sin juicios' }
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
              Nuestros Servicios
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12">
              Una suite completa de herramientas diseñadas para cuidar tu salud mental 
              y emocional de manera integral
            </p>
            
            {/* Beneficios principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {beneficios.map((beneficio, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="bg-white rounded-xl p-4 shadow-md"
                >
                  <beneficio.icono className="text-2xl text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">{beneficio.texto}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid de Servicios */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${servicio.destacado ? 'lg:scale-105' : ''}`}
              >
                {servicio.destacado && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                
                <div className={`bg-white rounded-2xl shadow-xl p-8 h-full hover:shadow-2xl transition-all duration-300 ${
                  servicio.destacado ? 'border-2 border-purple-500' : ''
                }`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${servicio.color} rounded-xl flex items-center justify-center mb-6`}>
                    <servicio.icono className="text-3xl text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {servicio.titulo}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    {servicio.descripcion}
                  </p>
                  
                  <ul className="space-y-3">
                    {servicio.caracteristicas.map((caracteristica, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{caracteristica}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de integración móvil */}
      <section className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Siempre Contigo, Donde Estés
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Accede a todos nuestros servicios desde cualquier dispositivo. 
                Nuestra plataforma está optimizada para brindarte la mejor experiencia 
                sin importar si estás en casa, en el trabajo o en movimiento.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaMobile className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">App Móvil Nativa</h4>
                    <p className="text-gray-600 text-sm">Próximamente en iOS y Android</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaGlobe className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Plataforma Web</h4>
                    <p className="text-gray-600 text-sm">Acceso completo desde tu navegador</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=600&fit=crop"
                  alt="Dispositivos móviles"
                  width={600}
                  height={600}
                  className="rounded-2xl shadow-2xl w-4/5"
                  fallbackColor="from-teal-100 to-cyan-100"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center"
        >
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Comienza Tu Viaje de Bienestar Hoy
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Todos estos servicios están disponibles desde el momento en que te registras
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
            <Link href="/precios">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600"
              >
                Ver Planes y Precios
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}