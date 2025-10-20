'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaHome,
  FaShieldAlt,
  FaLock,
  FaDatabase,
  FaUserShield,
  FaCookieBite,
  FaGlobe,
  FaFileContract
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';

interface Seccion {
  id: string;
  titulo: string;
  icono: typeof FaShieldAlt;
  contenido: string[];
}

const secciones: Seccion[] = [
  {
    id: 'introduccion',
    titulo: 'Introducción',
    icono: FaShieldAlt,
    contenido: [
      'En Escuchodromo, tu privacidad y seguridad son nuestra máxima prioridad. Esta política describe cómo recopilamos, usamos, protegemos y compartimos tu información personal.',
      'Al utilizar nuestra plataforma, aceptas las prácticas descritas en esta política. Te recomendamos leerla cuidadosamente y contactarnos si tienes alguna pregunta.',
      'Última actualización: 20 de octubre de 2025'
    ]
  },
  {
    id: 'informacion-recopilada',
    titulo: 'Información que Recopilamos',
    icono: FaDatabase,
    contenido: [
      '<strong>Información de cuenta:</strong> Nombre, correo electrónico, contraseña (encriptada), fecha de nacimiento, foto de perfil.',
      '<strong>Información de salud:</strong> Respuestas a evaluaciones psicológicas (PHQ-9, GAD-7), historial de conversaciones con IA, notas de sesiones con terapeutas, objetivos de bienestar.',
      '<strong>Información de uso:</strong> Páginas visitadas, tiempo de uso, dispositivo, navegador, dirección IP, datos de geolocalización aproximada.',
      '<strong>Información de pago:</strong> Procesada por terceros seguros (Stripe, PayPal). No almacenamos números de tarjeta completos.',
      '<strong>Comunicaciones:</strong> Emails, mensajes de soporte, feedback que nos envíes.'
    ]
  },
  {
    id: 'uso-informacion',
    titulo: 'Cómo Usamos tu Información',
    icono: FaUserShield,
    contenido: [
      '<strong>Proveer servicios:</strong> Facilitar sesiones de terapia, análisis emocional con IA, evaluaciones psicológicas, seguimiento de progreso.',
      '<strong>Personalización:</strong> Adaptar recomendaciones, contenido y experiencias según tus necesidades y preferencias.',
      '<strong>Comunicación:</strong> Enviarte recordatorios de citas, actualizaciones del servicio, newsletters (puedes darte de baja en cualquier momento).',
      '<strong>Mejora del servicio:</strong> Analizar patrones de uso agregados y anónimos para mejorar funcionalidades y desarrollar nuevas características.',
      '<strong>Seguridad:</strong> Detectar y prevenir fraude, abuso o actividades ilegales.',
      '<strong>Cumplimiento legal:</strong> Responder a solicitudes legales o proteger nuestros derechos.'
    ]
  },
  {
    id: 'proteccion-datos',
    titulo: 'Protección de Datos Médicos (HIPAA)',
    icono: FaLock,
    contenido: [
      'Escuchodromo cumple con las regulaciones de HIPAA (Health Insurance Portability and Accountability Act) para proteger tu información de salud:',
      '<strong>Encriptación:</strong> Toda la información sensible se encripta en tránsito (TLS 1.3) y en reposo (AES-256).',
      '<strong>Acceso limitado:</strong> Solo personal autorizado y con necesidad legítima puede acceder a tu información médica.',
      '<strong>Auditorías:</strong> Realizamos auditorías de seguridad periódicas y monitoreo continuo de accesos.',
      '<strong>Contratos BAA:</strong> Todos nuestros proveedores de servicios firman Business Associate Agreements.',
      '<strong>Retención de datos:</strong> Conservamos tus datos médicos durante el tiempo requerido por ley (mínimo 7 años) o hasta que solicites su eliminación.'
    ]
  },
  {
    id: 'gdpr',
    titulo: 'Derechos GDPR',
    icono: FaGlobe,
    contenido: [
      'Si resides en la Unión Europea, tienes los siguientes derechos bajo el GDPR:',
      '<strong>Acceso:</strong> Solicitar una copia de todos tus datos personales.',
      '<strong>Rectificación:</strong> Corregir información inexacta o incompleta.',
      '<strong>Supresión:</strong> Solicitar la eliminación de tus datos ("derecho al olvido").',
      '<strong>Portabilidad:</strong> Recibir tus datos en formato estructurado y legible para transferirlos a otro servicio.',
      '<strong>Limitación:</strong> Restringir el procesamiento de tus datos en ciertas circunstancias.',
      '<strong>Oposición:</strong> Oponerte al procesamiento de tus datos para marketing directo.',
      '<strong>Decisiones automatizadas:</strong> No estar sujeto a decisiones basadas únicamente en procesamiento automatizado.',
      'Para ejercer estos derechos, contáctanos en privacidad@escuchodromo.com. Responderemos en un plazo máximo de 30 días.'
    ]
  },
  {
    id: 'compartir-informacion',
    titulo: 'Compartir Información',
    icono: FaFileContract,
    contenido: [
      'NO vendemos tu información personal a terceros. Podemos compartir información en estas situaciones limitadas:',
      '<strong>Con tu consentimiento:</strong> Cuando nos des permiso explícito para compartir información con terceros específicos.',
      '<strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar (hosting, análisis, pagos) bajo estrictos acuerdos de confidencialidad.',
      '<strong>Profesionales de salud:</strong> Solo con terapeutas o médicos que tú elijas para tu tratamiento.',
      '<strong>Requisitos legales:</strong> Si estamos obligados por ley o para proteger seguridad y derechos.',
      '<strong>Transferencias de negocio:</strong> En caso de fusión, adquisición o venta, tu información se transferirá bajo las mismas protecciones.',
      'Todos los terceros que acceden a tu información están contractualmente obligados a proteger tu privacidad.'
    ]
  },
  {
    id: 'cookies',
    titulo: 'Cookies y Tecnologías Similares',
    icono: FaCookieBite,
    contenido: [
      'Usamos cookies y tecnologías similares para mejorar tu experiencia:',
      '<strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico (autenticación, seguridad).',
      '<strong>Cookies de rendimiento:</strong> Nos ayudan a entender cómo usas el sitio para mejorarlo.',
      '<strong>Cookies de funcionalidad:</strong> Recuerdan tus preferencias (idioma, tema).',
      '<strong>Cookies de marketing:</strong> Usadas para mostrar contenido relevante (solo con tu consentimiento).',
      'Puedes gestionar las cookies desde la configuración de tu navegador. Ten en cuenta que deshabilitar cookies esenciales puede afectar la funcionalidad del sitio.'
    ]
  },
  {
    id: 'menores',
    titulo: 'Menores de Edad',
    icono: FaUserShield,
    contenido: [
      'Escuchodromo está diseñado para mayores de 18 años. Si eres menor de edad:',
      '<strong>13-17 años:</strong> Requieres consentimiento de un padre o tutor legal para usar la plataforma.',
      '<strong>Menores de 13 años:</strong> No podemos aceptar usuarios menores de 13 años según COPPA.',
      'Si descubrimos que hemos recopilado información de menores sin consentimiento, eliminaremos esa información inmediatamente.',
      'Los padres/tutores pueden solicitar acceso, corrección o eliminación de información de sus hijos contactándonos.'
    ]
  },
  {
    id: 'seguridad',
    titulo: 'Seguridad de Datos',
    icono: FaLock,
    contenido: [
      'Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger tu información:',
      '<strong>Encriptación:</strong> TLS 1.3 para transmisión, AES-256 para almacenamiento.',
      '<strong>Autenticación:</strong> Autenticación multifactor (2FA) disponible para todas las cuentas.',
      '<strong>Infraestructura:</strong> Servidores en centros de datos certificados SOC 2 Tipo II.',
      '<strong>Monitoreo:</strong> Sistemas de detección de intrusos y monitoreo 24/7.',
      '<strong>Backups:</strong> Copias de seguridad encriptadas diarias con retención de 30 días.',
      '<strong>Capacitación:</strong> Todo el personal recibe formación anual en seguridad y privacidad.',
      'Aunque implementamos las mejores prácticas, ningún sistema es 100% seguro. Te recomendamos usar contraseñas fuertes y activar 2FA.'
    ]
  },
  {
    id: 'internacional',
    titulo: 'Transferencias Internacionales',
    icono: FaGlobe,
    contenido: [
      'Escuchodromo opera globalmente. Tu información puede ser transferida y procesada en países diferentes al tuyo:',
      '<strong>Servidores:</strong> Utilizamos servidores en Estados Unidos y Europa con proveedores certificados Privacy Shield/SCC.',
      '<strong>Protecciones:</strong> Todas las transferencias se realizan bajo cláusulas contractuales estándar aprobadas por la UE.',
      '<strong>Nivel de protección:</strong> Garantizamos el mismo nivel de protección independientemente de la ubicación.',
      'Si tienes preguntas sobre dónde se procesan tus datos, contáctanos.'
    ]
  },
  {
    id: 'cambios',
    titulo: 'Cambios a esta Política',
    icono: FaFileContract,
    contenido: [
      'Podemos actualizar esta política periódicamente para reflejar cambios en nuestras prácticas o requisitos legales:',
      '<strong>Notificación:</strong> Te notificaremos por email sobre cambios materiales al menos 30 días antes de que entren en vigor.',
      '<strong>Aceptación:</strong> El uso continuado del servicio después de los cambios constituye tu aceptación de la nueva política.',
      '<strong>Historial:</strong> Mantenemos versiones anteriores disponibles en nuestro sitio web.',
      'Te recomendamos revisar esta política periódicamente para estar informado sobre cómo protegemos tu información.'
    ]
  },
  {
    id: 'contacto',
    titulo: 'Contacto',
    icono: FaShieldAlt,
    contenido: [
      'Si tienes preguntas, preocupaciones o solicitudes sobre esta política o tus datos personales:',
      '<strong>Email:</strong> privacidad@escuchodromo.com',
      '<strong>Dirección postal:</strong> Escuchodromo SAS, Calle 100 #8A-55, Bogotá, Colombia',
      '<strong>Teléfono:</strong> +57 300 123 4567',
      '<strong>Oficial de Protección de Datos:</strong> dpo@escuchodromo.com',
      'Responderemos a todas las consultas en un plazo máximo de 30 días. Si no estás satisfecho con nuestra respuesta, tienes derecho a presentar una queja ante la autoridad de protección de datos de tu país.'
    ]
  }
];

export default function PaginaPrivacidad() {
  const [seccionActiva, setSeccionActiva] = useState('introduccion');

  // Scroll to section on hash change
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
      setSeccionActiva(hash);
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const scrollToSection = (id: string) => {
    setSeccionActiva(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    window.history.pushState(null, '', `#${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Navegacion />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 bg-gradient-to-br from-teal-600 to-cyan-700">
        <div className="max-w-6xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-full mb-6">
              <FaShieldAlt className="text-3xl" aria-hidden="true" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Política de Privacidad
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Tu privacidad es sagrada. Conoce cómo protegemos y manejamos tu información personal y médica.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navegación lateral */}
          <aside className="lg:w-1/4">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg p-6">
              <h2 className="font-bold text-gray-900 mb-4">Contenido</h2>
              <nav aria-label="Navegación de secciones">
                <ul className="space-y-2">
                  {secciones.map((seccion) => {
                    const Icono = seccion.icono;
                    return (
                      <li key={seccion.id}>
                        <button
                          onClick={() => scrollToSection(seccion.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
                            seccionActiva === seccion.id
                              ? 'bg-teal-50 text-teal-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          aria-current={seccionActiva === seccion.id ? 'true' : undefined}
                        >
                          <Icono className="flex-shrink-0" aria-hidden="true" />
                          <span className="text-sm">{seccion.titulo}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              {secciones.map((seccion, index) => {
                const Icono = seccion.icono;
                return (
                  <motion.section
                    key={seccion.id}
                    id={seccion.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ delay: index * 0.1 }}
                    className={index > 0 ? 'mt-12 pt-12 border-t border-gray-200' : ''}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <Icono className="text-xl text-white" aria-hidden="true" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {seccion.titulo}
                      </h2>
                    </div>
                    <div className="space-y-4 text-gray-700">
                      {seccion.contenido.map((parrafo, idx) => (
                        <p
                          key={idx}
                          dangerouslySetInnerHTML={{ __html: parrafo }}
                          className="leading-relaxed"
                        />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>

            {/* Links adicionales */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Documentos relacionados:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/terminos"
                  className="text-teal-600 hover:text-teal-700 font-medium underline"
                >
                  Términos y condiciones
                </Link>
                <Link
                  href="/ayuda"
                  className="text-teal-600 hover:text-teal-700 font-medium underline"
                >
                  Centro de ayuda
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
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
