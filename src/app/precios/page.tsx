'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FaCheckCircle, FaTimes, FaHeart, FaBrain, 
  FaCrown, FaQuestion, FaWhatsapp, FaEnvelope
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';

export default function PaginaPrecios() {
  const [facturacionAnual, setFacturacionAnual] = useState(false);

  const planes = [
    {
      nombre: 'Básico',
      precio: 'Gratis',
      precioAnual: 'Gratis',
      descripcion: 'Perfecto para comenzar tu viaje de bienestar',
      color: 'from-gray-400 to-gray-600',
      icono: FaHeart,
      popular: false,
      caracteristicas: [
        { nombre: 'Chat con IA limitado', incluido: true, limite: '5 mensajes/día' },
        { nombre: 'Evaluación mensual', incluido: true, limite: '1 test/mes' },
        { nombre: 'Ejercicios básicos', incluido: true },
        { nombre: 'Seguimiento de ánimo', incluido: true },
        { nombre: 'Acceso móvil', incluido: true },
        { nombre: 'Chat de voz', incluido: false },
        { nombre: 'Evaluaciones ilimitadas', incluido: false },
        { nombre: 'Reportes detallados', incluido: false },
        { nombre: 'Soporte prioritario', incluido: false }
      ]
    },
    {
      nombre: 'Premium',
      precio: '$49.900',
      precioAnual: '$39.900',
      moneda: 'COP/mes',
      descripcion: 'Todo lo que necesitas para tu bienestar completo',
      color: 'from-blue-500 to-purple-600',
      icono: FaBrain,
      popular: true,
      caracteristicas: [
        { nombre: 'Chat con IA ilimitado', incluido: true },
        { nombre: 'Todas las evaluaciones', incluido: true },
        { nombre: 'Chat de voz con IA', incluido: true },
        { nombre: 'Reportes detallados', incluido: true },
        { nombre: 'Ejercicios personalizados', incluido: true },
        { nombre: 'Seguimiento avanzado', incluido: true },
        { nombre: 'Acceso móvil premium', incluido: true },
        { nombre: 'Notificaciones inteligentes', incluido: true },
        { nombre: 'Soporte por email', incluido: true }
      ]
    },
    {
      nombre: 'Profesional',
      precio: '$99.900',
      precioAnual: '$79.900',
      moneda: 'COP/mes',
      descripcion: 'Para terapeutas y profesionales de salud mental',
      color: 'from-purple-500 to-pink-600',
      icono: FaCrown,
      popular: false,
      caracteristicas: [
        { nombre: 'Todo del plan Premium', incluido: true },
        { nombre: 'Dashboard para pacientes', incluido: true, limite: 'Hasta 50 pacientes' },
        { nombre: 'Integración con consulta', incluido: true },
        { nombre: 'Reportes profesionales', incluido: true },
        { nombre: 'API personalizada', incluido: true },
        { nombre: 'Capacitación especializada', incluido: true },
        { nombre: 'Soporte dedicado', incluido: true, limite: '24/7' },
        { nombre: 'Facturación empresarial', incluido: true },
        { nombre: 'Cumplimiento HIPAA', incluido: true }
      ]
    }
  ];

  const preguntas = [
    {
      pregunta: '¿Puedo cambiar de plan en cualquier momento?',
      respuesta: 'Sí, puedes cambiar tu plan cuando quieras. Si actualizas, tendrás acceso inmediato a las nuevas funciones. Si reduces el plan, los cambios se aplicarán en tu próximo ciclo de facturación.'
    },
    {
      pregunta: '¿Ofrecen garantía de devolución?',
      respuesta: 'Ofrecemos una garantía de 30 días sin preguntas. Si no estás satisfecho con nuestro servicio, te devolvemos tu dinero completo.'
    },
    {
      pregunta: '¿Mis datos están seguros?',
      respuesta: 'Absolutamente. Utilizamos encriptación de grado bancario y cumplimos con todas las regulaciones de privacidad. Tus conversaciones y datos están completamente protegidos.'
    },
    {
      pregunta: '¿Puedo usar Escuchodromo en múltiples dispositivos?',
      respuesta: 'Sí, tu cuenta funciona en todos tus dispositivos. Puedes acceder desde tu computadora, tablet o móvil sin restricciones.'
    },
    {
      pregunta: '¿Qué sucede si cancelo mi suscripción?',
      respuesta: 'Puedes cancelar en cualquier momento. Mantendrás acceso a tu plan hasta el final del período pagado, luego pasarás automáticamente al plan gratuito.'
    }
  ];

  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null);

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
              Planes y Precios
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
              Elige el plan perfecto para tu viaje de bienestar emocional. 
              Comienza gratis y escala cuando estés listo.
            </p>
            
            {/* Toggle de facturación */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`font-medium ${!facturacionAnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Mensual
              </span>
              <motion.button
                onClick={() => setFacturacionAnual(!facturacionAnual)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  facturacionAnual ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <motion.div
                  animate={{ x: facturacionAnual ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                />
              </motion.button>
              <span className={`font-medium ${facturacionAnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Anual
              </span>
              {facturacionAnual && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Ahorra 20%
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {planes.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative ${plan.popular ? 'scale-105 z-10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                
                <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                  
                  <div className="p-8">
                    {/* Header del plan */}
                    <div className="text-center mb-8">
                      <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <plan.icono className="text-3xl text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.nombre}
                      </h3>
                      
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                          {facturacionAnual && plan.precioAnual !== plan.precio ? plan.precioAnual : plan.precio}
                        </span>
                        {plan.moneda && (
                          <span className="text-sm text-gray-600 ml-2">
                            {facturacionAnual ? plan.moneda.replace('/mes', '/mes (facturado anualmente)') : plan.moneda}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600">
                        {plan.descripcion}
                      </p>
                    </div>
                    
                    {/* Características */}
                    <ul className="space-y-4 mb-8">
                      {plan.caracteristicas.map((caracteristica, i) => (
                        <li key={i} className="flex items-start gap-3">
                          {caracteristica.incluido ? (
                            <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <FaTimes className="text-gray-300 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="text-sm">
                            <span className={caracteristica.incluido ? 'text-gray-700' : 'text-gray-400'}>
                              {caracteristica.nombre}
                            </span>
                            {caracteristica.limite && (
                              <span className="block text-xs text-gray-500">
                                {caracteristica.limite}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Botón CTA */}
                    <Link href={plan.precio === 'Gratis' ? '/registrar' : '/registrar'}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-3 rounded-lg font-bold transition-all duration-300 ${
                          plan.popular
                            ? `bg-gradient-to-r ${plan.color} text-white shadow-lg hover:shadow-xl`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {plan.precio === 'Gratis' ? 'Comenzar Gratis' : 'Elegir Plan'}
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-4">
            {preguntas.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setPreguntaAbierta(preguntaAbierta === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{item.pregunta}</span>
                  <motion.div
                    animate={{ rotate: preguntaAbierta === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaQuestion className="text-gray-400" />
                  </motion.div>
                </button>
                
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: preguntaAbierta === index ? 'auto' : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600">
                    {item.respuesta}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto y soporte */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            ¿Necesitas Ayuda para Elegir?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                <FaWhatsapp />
                Hablar por WhatsApp
              </motion.button>
            </Link>
            
            <Link href="/contacto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaEnvelope />
                Escribir Email
              </motion.button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}