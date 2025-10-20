'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaHome,
  FaFileContract,
  FaUserCheck,
  FaHandshake,
  FaExclamationTriangle,
  FaGavel,
  FaMoneyBillWave,
  FaShieldAlt,
  FaBan
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';

interface Seccion {
  id: string;
  titulo: string;
  icono: typeof FaFileContract;
  contenido: string[];
}

const secciones: Seccion[] = [
  {
    id: 'aceptacion',
    titulo: 'Aceptación de Términos',
    icono: FaFileContract,
    contenido: [
      'Bienvenido a Escuchodromo. Al acceder y utilizar esta plataforma, aceptas estar legalmente vinculado por estos Términos y Condiciones.',
      'Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.',
      'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma.',
      'Es tu responsabilidad revisar periódicamente estos términos. El uso continuado del servicio después de los cambios constituye tu aceptación de los nuevos términos.',
      'Última actualización: 20 de octubre de 2025'
    ]
  },
  {
    id: 'definiciones',
    titulo: 'Definiciones',
    icono: FaUserCheck,
    contenido: [
      '<strong>"Plataforma"</strong> se refiere al sitio web, aplicaciones móviles y todos los servicios ofrecidos por Escuchodromo.',
      '<strong>"Usuario"</strong> se refiere a cualquier persona que acceda o utilice la Plataforma.',
      '<strong>"Servicios"</strong> incluyen terapia con IA, sesiones con terapeutas profesionales, evaluaciones psicológicas, y todas las funcionalidades de la Plataforma.',
      '<strong>"Contenido"</strong> se refiere a textos, gráficos, imágenes, música, software, audio, video, información y otros materiales.',
      '<strong>"Terapeuta"</strong> se refiere a profesionales de salud mental licenciados que ofrecen servicios a través de la Plataforma.',
      '<strong>"Cuenta"</strong> se refiere a la cuenta de usuario creada para acceder a los Servicios.'
    ]
  },
  {
    id: 'elegibilidad',
    titulo: 'Elegibilidad y Registro',
    icono: FaUserCheck,
    contenido: [
      '<strong>Edad mínima:</strong> Debes tener al menos 18 años para usar la Plataforma. Los menores de 18 años requieren consentimiento de un padre o tutor legal.',
      '<strong>Capacidad legal:</strong> Debes tener la capacidad legal para celebrar un contrato vinculante.',
      '<strong>Información veraz:</strong> Aceptas proporcionar información verdadera, precisa, actual y completa durante el registro.',
      '<strong>Seguridad de cuenta:</strong> Eres responsable de mantener la confidencialidad de tu contraseña y cuenta.',
      '<strong>Responsabilidad de uso:</strong> Eres responsable de todas las actividades que ocurran bajo tu cuenta.',
      '<strong>Notificación de uso no autorizado:</strong> Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.'
    ]
  },
  {
    id: 'servicios',
    titulo: 'Descripción de Servicios',
    icono: FaHandshake,
    contenido: [
      'Escuchodromo ofrece los siguientes servicios:',
      '<strong>Terapeuta de IA:</strong> Conversaciones con inteligencia artificial entrenada para proporcionar apoyo emocional y orientación básica.',
      '<strong>Sesiones profesionales:</strong> Videollamadas con terapeutas licenciados y certificados.',
      '<strong>Evaluaciones psicológicas:</strong> Tests validados científicamente (PHQ-9, GAD-7, etc.) para evaluar tu bienestar emocional.',
      '<strong>Seguimiento de progreso:</strong> Herramientas para monitorear tu evolución emocional a lo largo del tiempo.',
      '<strong>Recursos educativos:</strong> Artículos, videos y ejercicios para mejorar tu salud mental.',
      '<strong>Análisis de voz y emociones:</strong> Tecnología de IA para detectar patrones emocionales en tu comunicación.',
      'Todos los servicios están sujetos a disponibilidad y pueden modificarse sin previo aviso.'
    ]
  },
  {
    id: 'no-emergencias',
    titulo: 'NO para Emergencias Médicas',
    icono: FaExclamationTriangle,
    contenido: [
      '<strong class="text-red-600">IMPORTANTE: Escuchodromo NO es un servicio de emergencia.</strong>',
      'Si estás experimentando una crisis de salud mental o pensamientos suicidas, contacta inmediatamente:',
      '<strong>Colombia:</strong> Línea de emergencias 123, Línea de la vida 01 800 091 0090',
      '<strong>Internacional:</strong> Busca los servicios de emergencia locales en tu país',
      'La Plataforma no sustituye el tratamiento médico profesional de emergencia. En caso de emergencia, busca ayuda profesional inmediata o acude a la sala de emergencias más cercana.',
      'Escuchodromo no es responsable por daños resultantes del uso de la Plataforma en lugar de tratamiento de emergencia.'
    ]
  },
  {
    id: 'relacion-terapeutica',
    titulo: 'Relación Terapeuta-Paciente',
    icono: FaHandshake,
    contenido: [
      '<strong>Facilitadores, no proveedores:</strong> Escuchodromo facilita la conexión entre terapeutas y pacientes, pero no proporciona servicios médicos directamente.',
      '<strong>Independencia profesional:</strong> Los terapeutas son profesionales independientes responsables de su propio ejercicio profesional.',
      '<strong>Licencias:</strong> Todos los terapeutas están licenciados en sus respectivas jurisdicciones. Verifica sus credenciales en sus perfiles.',
      '<strong>Confidencialidad:</strong> Las sesiones están protegidas por confidencialidad médico-paciente según las leyes aplicables.',
      '<strong>Límites de confidencialidad:</strong> Los terapeutas pueden romper la confidencialidad si existe riesgo inminente de daño a ti o a terceros.',
      '<strong>Segunda opinión:</strong> Siempre tienes derecho a buscar una segunda opinión médica fuera de la Plataforma.'
    ]
  },
  {
    id: 'limitaciones-ia',
    titulo: 'Limitaciones de la IA',
    icono: FaExclamationTriangle,
    contenido: [
      'El terapeuta de IA es una herramienta de apoyo, NO un sustituto de terapia profesional:',
      '<strong>Sin diagnósticos:</strong> La IA no puede diagnosticar condiciones de salud mental.',
      '<strong>Sin prescripciones:</strong> La IA no puede prescribir medicamentos ni tratamientos.',
      '<strong>Tecnología en desarrollo:</strong> La IA puede cometer errores. Verifica siempre la información crítica con un profesional.',
      '<strong>Complemento, no reemplazo:</strong> Usa la IA como complemento a, no en lugar de, tratamiento profesional.',
      '<strong>Retroalimentación:</strong> Ayúdanos a mejorar reportando respuestas inexactas o inapropiadas.'
    ]
  },
  {
    id: 'pagos',
    titulo: 'Pagos y Facturación',
    icono: FaMoneyBillWave,
    contenido: [
      '<strong>Métodos de pago:</strong> Aceptamos tarjetas de crédito/débito, PayPal y transferencias bancarias.',
      '<strong>Procesamiento seguro:</strong> Los pagos son procesados por proveedores certificados PCI-DSS (Stripe, PayPal).',
      '<strong>Monedas:</strong> Aceptamos COP (Peso colombiano) y USD (Dólar estadounidense).',
      '<strong>Planes de suscripción:</strong> Las suscripciones se renuevan automáticamente al final de cada período.',
      '<strong>Cancelación:</strong> Puedes cancelar tu suscripción en cualquier momento desde tu perfil. La cancelación es efectiva al final del período de facturación actual.',
      '<strong>Reembolsos:</strong> Ofrecemos garantía de satisfacción de 30 días. Contáctanos para solicitar un reembolso.',
      '<strong>Precios:</strong> Nos reservamos el derecho de cambiar los precios con 30 días de anticipación.',
      '<strong>Impuestos:</strong> Los precios pueden no incluir impuestos aplicables según tu jurisdicción.'
    ]
  },
  {
    id: 'conducta-usuario',
    titulo: 'Conducta del Usuario',
    icono: FaBan,
    contenido: [
      'Al usar la Plataforma, aceptas NO:',
      '<strong>Acosar o abusar:</strong> Hostigar, amenazar, intimidar o acosar a otros usuarios o terapeutas.',
      '<strong>Contenido inapropiado:</strong> Publicar contenido ilegal, ofensivo, difamatorio, obsceno o que viole derechos de terceros.',
      '<strong>Suplantación:</strong> Hacerte pasar por otra persona o entidad.',
      '<strong>Spam:</strong> Enviar contenido no solicitado o promocional.',
      '<strong>Uso comercial no autorizado:</strong> Usar la Plataforma con fines comerciales sin autorización.',
      '<strong>Interferencia técnica:</strong> Intentar hackear, descompilar o interferir con el funcionamiento de la Plataforma.',
      '<strong>Scraping:</strong> Extraer datos de la Plataforma mediante herramientas automatizadas.',
      '<strong>Violación de leyes:</strong> Usar la Plataforma para actividades ilegales.',
      'Nos reservamos el derecho de suspender o terminar tu cuenta por violación de estas normas.'
    ]
  },
  {
    id: 'propiedad-intelectual',
    titulo: 'Propiedad Intelectual',
    icono: FaShieldAlt,
    contenido: [
      '<strong>Propiedad de Escuchodromo:</strong> Todo el contenido de la Plataforma (diseño, código, textos, gráficos, logos) es propiedad de Escuchodromo SAS.',
      '<strong>Licencia de uso:</strong> Te otorgamos una licencia limitada, no exclusiva, no transferible para usar la Plataforma.',
      '<strong>Prohibiciones:</strong> No puedes copiar, modificar, distribuir, vender o alquilar ninguna parte de la Plataforma.',
      '<strong>Marcas registradas:</strong> "Escuchodromo" y nuestros logos son marcas registradas. No puedes usarlas sin permiso.',
      '<strong>Tu contenido:</strong> Conservas los derechos de tu contenido (mensajes, evaluaciones). Nos otorgas licencia para usarlo para proveer los Servicios.',
      '<strong>Feedback:</strong> Cualquier sugerencia o feedback que proporciones puede ser usado libremente por Escuchodromo sin compensación.'
    ]
  },
  {
    id: 'limitacion-responsabilidad',
    titulo: 'Limitación de Responsabilidad',
    icono: FaExclamationTriangle,
    contenido: [
      'EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY:',
      '<strong>Sin garantías:</strong> La Plataforma se proporciona "tal cual" sin garantías de ningún tipo.',
      '<strong>Disponibilidad:</strong> No garantizamos que la Plataforma esté siempre disponible o libre de errores.',
      '<strong>Daños indirectos:</strong> No somos responsables por daños indirectos, incidentales, especiales o consecuentes.',
      '<strong>Límite de responsabilidad:</strong> Nuestra responsabilidad total está limitada al monto que pagaste en los últimos 12 meses.',
      '<strong>Profesionales independientes:</strong> No somos responsables por las acciones u omisiones de los terapeutas.',
      '<strong>Decisiones de tratamiento:</strong> Tú eres responsable de tus decisiones de tratamiento.',
      'Algunas jurisdicciones no permiten limitaciones de responsabilidad, por lo que estas limitaciones pueden no aplicarse a ti.'
    ]
  },
  {
    id: 'indemnizacion',
    titulo: 'Indemnización',
    icono: FaGavel,
    contenido: [
      'Aceptas indemnizar y mantener indemne a Escuchodromo, sus directores, empleados, agentes y afiliados de:',
      '<strong>Violaciones:</strong> Cualquier violación de estos Términos.',
      '<strong>Uso indebido:</strong> Uso de la Plataforma que cause daño a terceros.',
      '<strong>Contenido:</strong> Cualquier contenido que publiques o compartas.',
      '<strong>Violación de derechos:</strong> Violación de derechos de propiedad intelectual o privacidad de terceros.',
      'Esto incluye honorarios de abogados y costos de defensa razonables.'
    ]
  },
  {
    id: 'terminacion',
    titulo: 'Terminación de Servicios',
    icono: FaBan,
    contenido: [
      '<strong>Por tu parte:</strong> Puedes cancelar tu cuenta en cualquier momento desde Configuración.',
      '<strong>Por nuestra parte:</strong> Podemos suspender o terminar tu cuenta si:',
      '- Violas estos Términos',
      '- No pagas los servicios',
      '- Tu conducta es perjudicial para otros usuarios',
      '- Lo requerimos por ley',
      '<strong>Efectos de terminación:</strong> Al terminar, perderás acceso a tu cuenta y datos.',
      '<strong>Backup de datos:</strong> Te recomendamos exportar tus datos antes de cancelar.',
      '<strong>Supervivencia:</strong> Ciertas cláusulas (indemnización, limitación de responsabilidad) sobreviven la terminación.'
    ]
  },
  {
    id: 'ley-aplicable',
    titulo: 'Ley Aplicable y Jurisdicción',
    icono: FaGavel,
    contenido: [
      '<strong>Ley colombiana:</strong> Estos Términos se rigen por las leyes de la República de Colombia.',
      '<strong>Jurisdicción:</strong> Cualquier disputa será resuelta en los tribunales de Bogotá, Colombia.',
      '<strong>Arbitraje:</strong> Acordamos resolver disputas mediante arbitraje vinculante antes de litigio.',
      '<strong>Renuncia a demanda colectiva:</strong> Renuncias al derecho de participar en demandas colectivas.',
      '<strong>Costos legales:</strong> La parte perdedora pagará los costos legales razonables de la parte ganadora.'
    ]
  },
  {
    id: 'disposiciones-generales',
    titulo: 'Disposiciones Generales',
    icono: FaFileContract,
    contenido: [
      '<strong>Acuerdo completo:</strong> Estos Términos constituyen el acuerdo completo entre tú y Escuchodromo.',
      '<strong>Divisibilidad:</strong> Si alguna cláusula es inválida, las demás permanecen en vigor.',
      '<strong>Renuncia:</strong> La falta de ejercicio de un derecho no constituye renuncia a ese derecho.',
      '<strong>Cesión:</strong> No puedes transferir tus derechos bajo estos Términos sin nuestro consentimiento.',
      '<strong>Notificaciones:</strong> Las notificaciones se enviarán al email registrado en tu cuenta.',
      '<strong>Idioma:</strong> En caso de conflicto entre versiones en diferentes idiomas, prevalece la versión en español.',
      '<strong>Fuerza mayor:</strong> No somos responsables por incumplimiento debido a causas fuera de nuestro control.'
    ]
  },
  {
    id: 'contacto-legal',
    titulo: 'Contacto Legal',
    icono: FaFileContract,
    contenido: [
      'Para preguntas legales sobre estos Términos:',
      '<strong>Email legal:</strong> legal@escuchodromo.com',
      '<strong>Dirección postal:</strong> Escuchodromo SAS, Calle 100 #8A-55, Bogotá, Colombia',
      '<strong>Teléfono:</strong> +57 300 123 4567',
      '<strong>Horario de atención:</strong> Lunes a viernes, 8:00 AM - 6:00 PM (GMT-5)',
      'Responderemos a todas las consultas legales en un plazo máximo de 5 días hábiles.'
    ]
  }
];

export default function PaginaTerminos() {
  const [seccionActiva, setSeccionActiva] = useState('aceptacion');

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
      <section className="pt-28 pb-12 px-4 bg-gradient-to-br from-cyan-600 to-teal-700">
        <div className="max-w-6xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-full mb-6">
              <FaFileContract className="text-3xl" aria-hidden="true" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Lee cuidadosamente estos términos antes de utilizar nuestros servicios.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navegación lateral */}
          <aside className="lg:w-1/4">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                              ? 'bg-cyan-50 text-cyan-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          aria-current={seccionActiva === seccion.id ? 'true' : undefined}
                        >
                          <Icono className="flex-shrink-0 text-sm" aria-hidden="true" />
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
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8" role="alert">
                <div className="flex">
                  <FaExclamationTriangle className="text-yellow-400 mr-3 flex-shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-yellow-800">Aviso Importante</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Al usar Escuchodromo, aceptas estos términos legalmente vinculantes.
                      Lee cuidadosamente cada sección antes de utilizar nuestros servicios.
                    </p>
                  </div>
                </div>
              </div>

              {secciones.map((seccion, index) => {
                const Icono = seccion.icono;
                return (
                  <motion.section
                    key={seccion.id}
                    id={seccion.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ delay: index * 0.05 }}
                    className={index > 0 ? 'mt-12 pt-12 border-t border-gray-200' : ''}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
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
                  href="/privacidad"
                  className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                >
                  Política de privacidad
                </Link>
                <Link
                  href="/ayuda"
                  className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                >
                  Centro de ayuda
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-medium"
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
