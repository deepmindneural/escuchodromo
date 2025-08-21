'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Boton } from '../lib/componentes/ui/boton';
import Navegacion from '../lib/componentes/layout/Navegacion';
import { gsap, useGSAP } from '../lib/hooks/useGsap';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { ImageWithFallback } from '../lib/componentes/ui/image-with-fallback';
import { 
  FaBrain, FaHeart, FaChartLine, FaUsers, FaShieldAlt,
  FaRobot, FaMobile, FaGlobe, FaCheckCircle, FaStar,
  FaQuoteLeft, FaArrowRight, FaPlay, FaLock, FaHeadset
} from 'react-icons/fa';

export default function PaginaInicio() {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [refEstadisticas, inViewEstadisticas] = useInView({ triggerOnce: true });
  const [videoAbierto, setVideoAbierto] = useState(false);

  useGSAP(() => {
    gsap.fromTo('.titulo-hero', 
      { opacity: 0, y: 100, scale: 0.8 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.2
      }
    );

    gsap.fromTo('.subtitulo-hero',
      { opacity: 0, x: -50 },
      { 
        opacity: 1, 
        x: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.8
      }
    );
  }, { scope: contenedorRef });

  const caracteristicas = [
    {
      icono: FaBrain,
      titulo: 'IA Afectiva Avanzada',
      descripcion: 'Nuestra inteligencia artificial comprende tus emociones y responde con empatía genuina.',
      imagen: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=300&fit=crop',
      beneficios: ['Análisis emocional en tiempo real', 'Respuestas personalizadas', 'Aprendizaje continuo']
    },
    {
      icono: FaHeart,
      titulo: 'Apoyo 24/7',
      descripcion: 'Disponible cuando más lo necesitas, día y noche, para escucharte y apoyarte.',
      imagen: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
      beneficios: ['Sin citas previas', 'Respuesta inmediata', 'Total disponibilidad']
    },
    {
      icono: FaChartLine,
      titulo: 'Seguimiento Personalizado',
      descripcion: 'Monitorea tu progreso emocional con herramientas validadas científicamente.',
      imagen: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      beneficios: ['Gráficos de progreso', 'Evaluaciones PHQ-9 y GAD-7', 'Reportes detallados']
    },
    {
      icono: FaShieldAlt,
      titulo: 'Privacidad Total',
      descripcion: 'Tu información está protegida con encriptación de grado bancario.',
      imagen: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop',
      beneficios: ['Encriptación AES-256', 'HIPAA Compliant', 'Datos anónimos']
    }
  ];

  const estadisticas = [
    { icono: FaUsers, valor: 50000, sufijo: '+', etiqueta: 'Usuarios Activos', color: 'from-blue-400 to-blue-600' },
    { icono: FaHeart, valor: 4.8, sufijo: '/5', etiqueta: 'Satisfacción', decimales: 1, color: 'from-pink-400 to-pink-600' },
    { icono: FaBrain, valor: 250000, sufijo: '+', etiqueta: 'Sesiones Completadas', color: 'from-purple-400 to-purple-600' },
    { icono: FaGlobe, valor: 15, sufijo: '', etiqueta: 'Países', color: 'from-teal-400 to-teal-600' }
  ];

  const testimonios = [
    {
      nombre: 'María González',
      cargo: 'Emprendedora',
      imagen: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      texto: 'Escuchodromo me ha ayudado a manejar el estrés del emprendimiento. Es como tener un psicólogo disponible 24/7.',
      rating: 5
    },
    {
      nombre: 'Carlos Rodríguez',
      cargo: 'Estudiante',
      imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      texto: 'La ansiedad por los exámenes era insoportable. Ahora tengo herramientas para manejarla gracias a Escuchodromo.',
      rating: 5
    },
    {
      nombre: 'Ana Martínez',
      cargo: 'Madre de familia',
      imagen: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      texto: 'Como madre, a veces necesito desahogarme. Escuchodromo siempre está ahí, sin juzgar, solo escuchando.',
      rating: 5
    }
  ];

  const planes = [
    {
      nombre: 'Básico',
      precio: 'Gratis',
      descripcion: 'Perfecto para comenzar tu viaje de bienestar',
      caracteristicas: [
        'Chat ilimitado con IA',
        '1 evaluación mensual',
        'Ejercicios básicos',
        'Seguimiento de ánimo'
      ],
      popular: false
    },
    {
      nombre: 'Premium',
      precio: '$49.900',
      moneda: 'COP/mes',
      descripcion: 'Todo lo que necesitas para tu bienestar completo',
      caracteristicas: [
        'Todo del plan Básico',
        'Evaluaciones ilimitadas',
        'Sesiones de voz con IA',
        'Reportes detallados',
        'Ejercicios avanzados',
        'Soporte prioritario'
      ],
      popular: true
    },
    {
      nombre: 'Profesional',
      precio: '$99.900',
      moneda: 'COP/mes',
      descripcion: 'Para terapeutas y profesionales de salud mental',
      caracteristicas: [
        'Todo del plan Premium',
        'Dashboard para pacientes',
        'Integración con consulta',
        'API personalizada',
        'Soporte dedicado'
      ],
      popular: false
    }
  ];

  return (
    <div ref={contenedorRef} className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-cyan-50 overflow-hidden">
      <Navegacion />
      
      {/* Hero Section Mejorada */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Fondo animado */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-6"
              >
                <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <FaStar className="mr-2" />
                  #1 App de Bienestar Emocional en LATAM
                </span>
              </motion.div>
              
              <h1 className="titulo-hero text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                Tu espacio seguro para sanar y crecer
              </h1>
              
              <p className="subtitulo-hero text-xl lg:text-2xl text-gray-700 mb-8 leading-relaxed">
                Habla, desahógate y encuentra apoyo emocional personalizado con nuestra IA terapéutica. 
                Disponible 24/7, sin juicios, con total privacidad.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
                  >
                    Hablar con Escuchodromo - Gratis
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVideoAbierto(true)}
                  className="px-8 py-4 bg-white text-gray-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <FaPlay className="text-teal-500" />
                  Ver Cómo Funciona
                </motion.button>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex -space-x-4">
                  {[1,2,3,4,5].map((i) => (
                    <ImageWithFallback
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i}`}
                      alt="Usuario"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      fallbackColor="from-teal-100 to-cyan-100"
                    />
                  ))}
                </div>
                <p className="text-gray-600">
                  <span className="font-bold text-gray-900">+50,000</span> personas ya confían en nosotros
                </p>
              </div>
            </div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative"
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop"
                  alt="Persona usando Escuchodromo"
                  width={600}
                  height={600}
                  className="rounded-2xl shadow-2xl"
                  fallbackColor="from-teal-100 to-cyan-100"
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                    <FaHeadset className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Soporte 24/7</p>
                    <p className="text-sm text-gray-600">Siempre disponible</p>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                    <FaLock className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">100% Privado</p>
                    <p className="text-sm text-gray-600">Encriptado</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Estadísticas */}
      <section ref={refEstadisticas} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Números que Hablan por Sí Solos
            </h2>
            <p className="text-xl text-gray-600">
              Miles de personas ya han mejorado su bienestar emocional con nosotros
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {estadisticas.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={inViewEstadisticas ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <stat.icono className="text-3xl text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {inViewEstadisticas && (
                    <CountUp 
                      end={stat.valor} 
                      duration={2.5} 
                      suffix={stat.sufijo}
                      decimals={stat.decimales || 0}
                    />
                  )}
                </div>
                <p className="text-gray-600 mt-2 font-medium">{stat.etiqueta}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Características Detalladas */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que Necesitas para tu Bienestar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combinamos tecnología de vanguardia con comprensión humana para ofrecerte 
              la mejor experiencia de apoyo emocional
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {caracteristicas.map((caracteristica, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={caracteristica.imagen}
                    alt={caracteristica.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <caracteristica.icono className="text-4xl mb-2" />
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {caracteristica.titulo}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {caracteristica.descripcion}
                  </p>
                  <ul className="space-y-2">
                    {caracteristica.beneficios.map((beneficio, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FaCheckCircle className="text-teal-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Historias de Transformación
            </h2>
            <p className="text-xl text-gray-600">
              Conoce cómo Escuchodromo ha cambiado vidas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonios.map((testimonio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-50 rounded-2xl p-8 relative"
              >
                <FaQuoteLeft className="absolute top-4 right-4 text-4xl text-blue-100" />
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonio.imagen}
                    alt={testimonio.nombre}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonio.nombre}</h4>
                    <p className="text-gray-600">{testimonio.cargo}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonio.texto}"</p>
                <div className="flex gap-1">
                  {[...Array(testimonio.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes y Precios */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Elige el Plan Perfecto para Ti
            </h2>
            <p className="text-xl text-gray-600">
              Comienza gratis y mejora cuando lo necesites
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {planes.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl scale-105' 
                    : 'bg-white shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                
                <h3 className={`text-2xl font-bold mb-2 ${
                  plan.popular ? 'text-white' : 'text-gray-900'
                }`}>
                  {plan.nombre}
                </h3>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${
                    plan.popular ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plan.precio}
                  </span>
                  {plan.moneda && (
                    <span className={`text-sm ml-2 ${
                      plan.popular ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      {plan.moneda}
                    </span>
                  )}
                </div>
                <p className={`mb-6 ${
                  plan.popular ? 'text-white/90' : 'text-gray-600'
                }`}>
                  {plan.descripcion}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {plan.caracteristicas.map((caracteristica, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FaCheckCircle className={`mt-1 flex-shrink-0 ${
                        plan.popular ? 'text-white' : 'text-teal-500'
                      }`} />
                      <span className={plan.popular ? 'text-white' : 'text-gray-700'}>
                        {caracteristica}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/registrar">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 rounded-lg font-bold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-white text-blue-600 hover:bg-gray-100'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                    }`}
                  >
                    Comenzar Ahora
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para Transformar tu Bienestar Emocional?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Únete a miles de personas que ya han dado el primer paso hacia una vida más equilibrada y feliz
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registrar">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Comenzar Mi Viaje Gratis
              </motion.button>
            </Link>
            <Link href="/contacto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Hablar con un Experto
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaBrain className="text-xl" />
                </div>
                <h3 className="text-xl font-bold">Escuchodromo</h3>
              </div>
              <p className="text-gray-400">
                Tu compañero de confianza en el viaje hacia el bienestar emocional.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/como-funciona" className="hover:text-white">Cómo Funciona</Link></li>
                <li><Link href="/servicios" className="hover:text-white">Servicios</Link></li>
                <li><Link href="/precios" className="hover:text-white">Precios</Link></li>
                <li><Link href="/evaluaciones" className="hover:text-white">Evaluaciones</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/nosotros" className="hover:text-white">Sobre Nosotros</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
                <li><Link href="/empleo" className="hover:text-white">Trabaja con Nosotros</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacidad" className="hover:text-white">Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-white">Términos de Uso</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Política de Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Escuchodromo. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}