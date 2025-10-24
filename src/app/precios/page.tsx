'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FaCheckCircle, FaTimes, FaHeart, FaBrain,
  FaCrown, FaQuestion, FaWhatsapp, FaEnvelope, FaSpinner
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';
import { toast } from 'react-hot-toast';

interface PlanDB {
  id: string;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  moneda: string;
  tipo_usuario: string;
  activo: boolean;
  caracteristicas: any;
  limite_pacientes: number | null;
  limite_mensajes: number | null;
  limite_evaluaciones: number | null;
}

interface Plan {
  id: string;
  nombre: string;
  precio: string;
  precioAnual: string;
  moneda?: string;
  descripcion: string;
  color: string;
  icono: any;
  popular: boolean;
  caracteristicas: Array<{
    nombre: string;
    incluido: boolean;
    limite?: string;
  }>;
}

export default function PaginaPrecios() {
  const [facturacionAnual, setFacturacionAnual] = useState(false);
  const [moneda, setMoneda] = useState<'COP' | 'USD'>('COP');
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const supabase = obtenerClienteNavegador();

  useEffect(() => {
    cargarPlanes();
  }, [moneda]);

  const cargarPlanes = async () => {
    try {
      setCargando(true);

      const { data: planesDB, error } = await supabase.rpc('obtener_planes_publico', {
        p_tipo_usuario: 'paciente',
        p_moneda: moneda
      });

      if (error) {
        console.error('Error al cargar planes:', error);
        toast.error('No se pudieron cargar los planes');
        return;
      }

      if (!planesDB || planesDB.length === 0) {
        toast.error('No hay planes disponibles');
        return;
      }

      // Mapear planes de BD a formato UI
      const planesFormateados: Plan[] = planesDB.map((planDB: PlanDB) => {
        // Determinar color e ícono según el plan
        let color = 'from-gray-400 to-gray-600';
        let icono = FaHeart;
        let popular = false;

        if (planDB.nombre.toLowerCase().includes('premium')) {
          color = 'from-blue-500 to-purple-600';
          icono = FaBrain;
          popular = true;
        } else if (planDB.nombre.toLowerCase().includes('profesional')) {
          color = 'from-purple-500 to-pink-600';
          icono = FaCrown;
        }

        // Formatear precio
        const precioMensual = planDB.precio_mensual === 0
          ? 'Gratis'
          : formatearPrecio(planDB.precio_mensual, planDB.moneda);

        const precioAnual = planDB.precio_anual === 0
          ? 'Gratis'
          : formatearPrecio(planDB.precio_anual / 12, planDB.moneda);

        // Construir características desde las propiedades del plan
        const caracteristicas: Array<{ nombre: string; incluido: boolean; limite?: string }> = [];

        // Características comunes
        if (planDB.limite_mensajes !== null) {
          caracteristicas.push({
            nombre: 'Chat con IA',
            incluido: true,
            limite: planDB.limite_mensajes === -1 ? 'Ilimitado' : `${planDB.limite_mensajes} mensajes/día`
          });
        }

        if (planDB.limite_evaluaciones !== null) {
          caracteristicas.push({
            nombre: 'Evaluaciones',
            incluido: true,
            limite: planDB.limite_evaluaciones === -1 ? 'Ilimitadas' : `${planDB.limite_evaluaciones} por mes`
          });
        }

        // Agregar características desde JSON
        if (planDB.caracteristicas && Array.isArray(planDB.caracteristicas)) {
          planDB.caracteristicas.forEach((car: any) => {
            caracteristicas.push({
              nombre: car.nombre || car,
              incluido: car.incluido !== false,
              limite: car.limite
            });
          });
        }

        // Características predeterminadas si no hay en BD
        if (caracteristicas.length === 0) {
          if (planDB.nombre.toLowerCase().includes('básico') || planDB.precio_mensual === 0) {
            caracteristicas.push(
              { nombre: 'Ejercicios básicos', incluido: true },
              { nombre: 'Seguimiento de ánimo', incluido: true },
              { nombre: 'Acceso móvil', incluido: true },
              { nombre: 'Chat de voz', incluido: false },
              { nombre: 'Reportes detallados', incluido: false },
              { nombre: 'Soporte prioritario', incluido: false }
            );
          } else if (planDB.nombre.toLowerCase().includes('premium')) {
            caracteristicas.push(
              { nombre: 'Chat con IA ilimitado', incluido: true },
              { nombre: 'Todas las evaluaciones', incluido: true },
              { nombre: 'Chat de voz con IA', incluido: true },
              { nombre: 'Reportes detallados', incluido: true },
              { nombre: 'Ejercicios personalizados', incluido: true },
              { nombre: 'Seguimiento avanzado', incluido: true },
              { nombre: 'Notificaciones inteligentes', incluido: true },
              { nombre: 'Soporte por email', incluido: true }
            );
          } else if (planDB.nombre.toLowerCase().includes('profesional')) {
            caracteristicas.push(
              { nombre: 'Todo del plan Premium', incluido: true },
              { nombre: 'Dashboard para pacientes', incluido: true, limite: planDB.limite_pacientes ? `Hasta ${planDB.limite_pacientes} pacientes` : undefined },
              { nombre: 'Integración con consulta', incluido: true },
              { nombre: 'Reportes profesionales', incluido: true },
              { nombre: 'API personalizada', incluido: true },
              { nombre: 'Capacitación especializada', incluido: true },
              { nombre: 'Soporte dedicado 24/7', incluido: true },
              { nombre: 'Facturación empresarial', incluido: true },
              { nombre: 'Cumplimiento HIPAA', incluido: true }
            );
          }
        }

        return {
          id: planDB.id,
          nombre: planDB.nombre,
          precio: precioMensual,
          precioAnual: precioAnual,
          moneda: planDB.precio_mensual > 0 ? `${planDB.moneda}/mes` : undefined,
          descripcion: planDB.descripcion || `Plan ${planDB.nombre}`,
          color,
          icono,
          popular,
          caracteristicas
        };
      });

      setPlanes(planesFormateados);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      toast.error('Error al cargar los planes');
    } finally {
      setCargando(false);
    }
  };

  const formatearPrecio = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

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

            {/* Selector de moneda */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={() => setMoneda('COP')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  moneda === 'COP'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                COP (Colombia)
              </button>
              <button
                onClick={() => setMoneda('USD')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  moneda === 'USD'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                USD (Internacional)
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {cargando ? (
            <div className="flex justify-center items-center py-20">
              <FaSpinner className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {planes.map((plan, index) => (
                <motion.div
                  key={plan.id}
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
                      <Link href={
                        plan.precio === 'Gratis'
                          ? '/registrar'
                          : `/pago/stripe?plan=${plan.id}&periodo=${facturacionAnual ? 'anual' : 'mensual'}`
                      }>
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
          )}
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
      <Footer />
    </div>
  );
}
