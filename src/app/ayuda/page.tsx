'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaHome,
  FaQuestionCircle,
  FaUser,
  FaCalendar,
  FaCreditCard,
  FaTools,
  FaEnvelope,
  FaPhone,
  FaComments,
  FaChevronDown,
  FaBrain
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
  categoria: 'cuenta' | 'citas' | 'pagos' | 'soporte';
}

const preguntasFrecuentes: PreguntaFrecuente[] = [
  // Cuenta
  {
    categoria: 'cuenta',
    pregunta: '¿Cómo creo una cuenta en Escuchodromo?',
    respuesta: 'Para crear una cuenta, haz clic en "Registrarse" en la página principal. Ingresa tu correo electrónico, crea una contraseña segura y completa tu perfil. Recibirás un email de confirmación para activar tu cuenta.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Cómo cambio mi contraseña?',
    respuesta: 'Ve a tu perfil, selecciona "Configuración" y luego "Cambiar contraseña". También puedes usar la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión para recibir un link de recuperación.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Puedo eliminar mi cuenta?',
    respuesta: 'Sí, puedes eliminar tu cuenta desde Configuración > Privacidad > Eliminar cuenta. Ten en cuenta que esta acción es irreversible y todos tus datos serán eliminados permanentemente.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Mi información está segura?',
    respuesta: 'Absolutamente. Usamos encriptación de extremo a extremo y cumplimos con GDPR y HIPAA. Tus conversaciones son completamente privadas y nunca compartimos tus datos con terceros.'
  },

  // Citas
  {
    categoria: 'citas',
    pregunta: '¿Cómo programo una sesión con un terapeuta?',
    respuesta: 'Ve a la sección "Profesionales", elige un terapeuta que se ajuste a tus necesidades y selecciona un horario disponible. Recibirás una confirmación por email con los detalles de tu cita.'
  },
  {
    categoria: 'citas',
    pregunta: '¿Puedo cancelar o reprogramar una cita?',
    respuesta: 'Sí, puedes cancelar o reprogramar con al menos 24 horas de anticipación sin cargo. Ve a "Mis Citas" en tu dashboard y selecciona la opción correspondiente.'
  },
  {
    categoria: 'citas',
    pregunta: '¿Cómo funcionan las sesiones de IA?',
    respuesta: 'Nuestro terapeuta de IA está disponible 24/7. Solo ve a la sección "Chat" y comienza a conversar. El sistema usa tecnología de procesamiento emocional para brindarte apoyo personalizado.'
  },
  {
    categoria: 'citas',
    pregunta: '¿Qué hago si mi terapeuta no se presenta?',
    respuesta: 'Si tu terapeuta no se presenta en los primeros 10 minutos, contáctanos inmediatamente. Te reprogramaremos la sesión sin costo y recibirás una sesión adicional gratuita como compensación.'
  },

  // Pagos
  {
    categoria: 'pagos',
    pregunta: '¿Qué métodos de pago aceptan?',
    respuesta: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), PayPal y transferencias bancarias. Todos los pagos son procesados de forma segura.'
  },
  {
    categoria: 'pagos',
    pregunta: '¿Ofrecen planes de suscripción?',
    respuesta: 'Sí, tenemos planes mensuales, trimestrales y anuales con descuentos progresivos. También ofrecemos una prueba gratuita de 7 días para nuevos usuarios.'
  },
  {
    categoria: 'pagos',
    pregunta: '¿Puedo obtener un reembolso?',
    respuesta: 'Ofrecemos garantía de satisfacción de 30 días. Si no estás satisfecho con nuestro servicio, contáctanos y procesaremos tu reembolso completo, sin preguntas.'
  },
  {
    categoria: 'pagos',
    pregunta: '¿Aceptan seguros médicos?',
    respuesta: 'Actualmente no trabajamos directamente con aseguradoras, pero podemos proporcionarte una factura detallada que puedes presentar a tu seguro para posible reembolso.'
  },

  // Soporte técnico
  {
    categoria: 'soporte',
    pregunta: 'La aplicación no carga correctamente',
    respuesta: 'Intenta limpiar el caché de tu navegador, actualizar la página, o usar otro navegador. Si el problema persiste, contáctanos con detalles sobre tu navegador y sistema operativo.'
  },
  {
    categoria: 'soporte',
    pregunta: 'No puedo acceder a las videollamadas',
    respuesta: 'Asegúrate de dar permisos de cámara y micrófono a tu navegador. Verifica tu conexión a internet y usa Chrome, Firefox o Safari actualizados para mejor compatibilidad.'
  },
  {
    categoria: 'soporte',
    pregunta: '¿La plataforma funciona en móviles?',
    respuesta: 'Sí, nuestra plataforma es completamente responsiva y funciona en cualquier dispositivo. También estamos desarrollando aplicaciones nativas para iOS y Android.'
  },
  {
    categoria: 'soporte',
    pregunta: 'No recibo notificaciones',
    respuesta: 'Ve a Configuración > Notificaciones y verifica que estén activadas. También revisa la configuración de notificaciones de tu navegador o dispositivo.'
  }
];

const categorias = [
  { id: 'cuenta' as const, nombre: 'Cuenta', icono: FaUser, color: 'teal' },
  { id: 'citas' as const, nombre: 'Citas', icono: FaCalendar, color: 'cyan' },
  { id: 'pagos' as const, nombre: 'Pagos', icono: FaCreditCard, color: 'blue' },
  { id: 'soporte' as const, nombre: 'Soporte técnico', icono: FaTools, color: 'purple' }
];

interface ItemAccordionProps {
  pregunta: string;
  respuesta: string;
  index: number;
}

function ItemAccordion({ pregunta, respuesta, index }: ItemAccordionProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-gray-200 rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200 text-left"
        aria-expanded={abierto}
      >
        <span className="font-medium text-gray-900 pr-4">{pregunta}</span>
        <FaChevronDown
          className={`flex-shrink-0 text-teal-600 transition-transform duration-200 ${
            abierto ? 'transform rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {abierto && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-6 py-4 bg-gray-50 border-t border-gray-200"
        >
          <p className="text-gray-700">{respuesta}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function PaginaAyuda() {
  const [categoriaActiva, setCategoriaActiva] = useState<'cuenta' | 'citas' | 'pagos' | 'soporte'>('cuenta');

  const preguntasFiltradas = preguntasFrecuentes.filter(
    (p) => p.categoria === categoriaActiva
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Navegacion />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full mb-6">
              <FaQuestionCircle className="text-3xl text-white" aria-hidden="true" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Centro de Ayuda
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Encuentra respuestas rápidas a las preguntas más frecuentes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categorías */}
      <section className="pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categorias.map((categoria) => {
              const Icono = categoria.icono;
              const activa = categoriaActiva === categoria.id;
              return (
                <motion.button
                  key={categoria.id}
                  onClick={() => setCategoriaActiva(categoria.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    activa
                      ? `border-${categoria.color}-500 bg-${categoria.color}-50 shadow-lg`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  aria-pressed={activa}
                  aria-label={`Ver preguntas sobre ${categoria.nombre}`}
                >
                  <Icono
                    className={`text-3xl mx-auto mb-2 ${
                      activa ? `text-${categoria.color}-600` : 'text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  <p
                    className={`font-medium ${
                      activa ? `text-${categoria.color}-900` : 'text-gray-700'
                    }`}
                  >
                    {categoria.nombre}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {preguntasFiltradas.map((pregunta, index) => (
              <ItemAccordion
                key={index}
                pregunta={pregunta.pregunta}
                respuesta={pregunta.respuesta}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Información de contacto */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl p-8 md:p-12 text-white"
          >
            <h2 className="text-3xl font-bold mb-4">
              ¿No encuentras lo que buscas?
            </h2>
            <p className="text-white/90 mb-8">
              Nuestro equipo de soporte está disponible para ayudarte
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Email */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <FaEnvelope className="text-3xl mb-3" aria-hidden="true" />
                <h3 className="font-bold mb-2">Email</h3>
                <a
                  href="mailto:soporte@escuchodromo.com"
                  className="text-white/90 hover:text-white underline"
                >
                  soporte@escuchodromo.com
                </a>
                <p className="text-sm text-white/70 mt-2">
                  Respuesta en 24 horas
                </p>
              </div>

              {/* Teléfono */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <FaPhone className="text-3xl mb-3" aria-hidden="true" />
                <h3 className="font-bold mb-2">Teléfono</h3>
                <a
                  href="tel:+573001234567"
                  className="text-white/90 hover:text-white underline"
                >
                  +57 300 123 4567
                </a>
                <p className="text-sm text-white/70 mt-2">
                  Lun-Vie: 8am-8pm
                </p>
              </div>

              {/* Chat */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <FaComments className="text-3xl mb-3" aria-hidden="true" />
                <h3 className="font-bold mb-2">Chat en vivo</h3>
                <button
                  className="text-white/90 hover:text-white underline"
                  onClick={() => {
                    // Placeholder para integración futura
                    alert('Chat de soporte próximamente');
                  }}
                >
                  Iniciar chat
                </button>
                <p className="text-sm text-white/70 mt-2">
                  Respuesta inmediata
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Links adicionales */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            También puedes revisar:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/privacidad"
              className="text-teal-600 hover:text-teal-700 font-medium underline"
            >
              Política de privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-teal-600 hover:text-teal-700 font-medium underline"
            >
              Términos y condiciones
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              <FaHome aria-hidden="true" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
