'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Check,
  X,
  Heart,
  Brain,
  Crown,
  ChevronDown,
  MessageSquare,
  Mail,
  Shield,
  Clock,
  BadgeCheck,
  Star,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';
import { toast } from 'react-hot-toast';

interface PlanDB {
  id: string;
  codigo: string;
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
  codigo: string;
  nombre: string;
  precio: string;
  precioAnual: string;
  moneda?: string;
  descripcion: string;
  color: string;
  colorBadge: string;
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
        let colorBadge = 'from-gray-100 to-gray-200';
        let icono = Heart;
        let popular = false;

        if (planDB.nombre.toLowerCase().includes('premium')) {
          color = 'from-blue-500 via-teal-500 to-green-500';
          colorBadge = 'from-blue-100 to-teal-100';
          icono = Brain;
          popular = true;
        } else if (planDB.nombre.toLowerCase().includes('profesional')) {
          color = 'from-purple-500 via-pink-500 to-rose-500';
          colorBadge = 'from-purple-100 to-pink-100';
          icono = Crown;
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
          codigo: planDB.codigo,
          nombre: planDB.nombre,
          precio: precioMensual,
          precioAnual: precioAnual,
          moneda: planDB.precio_mensual > 0 ? `${planDB.moneda}/mes` : undefined,
          descripcion: planDB.descripcion || `Plan ${planDB.nombre}`,
          color,
          colorBadge,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <Navegacion />

      {/* Hero Section mejorado */}
      <section className="pt-32 pb-20 px-4 relative z-10" role="main" aria-label="Planes y precios">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Badge principal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white px-8 py-3 rounded-full text-base font-semibold shadow-lg">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                Planes y Precios
              </span>
            </motion.div>

            {/* Título principal con gradiente */}
            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6 leading-tight">
              Tu bienestar emocional
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                merece el mejor plan
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto mb-10 leading-relaxed font-light">
              Comienza tu viaje hacia el bienestar emocional con el plan perfecto para ti.
              <span className="block mt-2 font-medium text-gray-800">
                Sin compromisos. Cancela cuando quieras.
              </span>
            </p>

            {/* Trust badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-12">
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-6 py-3.5 border border-green-200 shadow-sm">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">Garantía de 30 días</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full px-6 py-3.5 border border-blue-200 shadow-sm">
                <BadgeCheck className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">Datos 100% seguros</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full px-6 py-3.5 border border-purple-200 shadow-sm">
                <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">Soporte 24/7</span>
              </div>
            </div>

            {/* Toggle de facturación con glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border-2 border-blue-200/50 inline-flex items-center gap-3"
                role="group"
                aria-label="Selector de período de facturación"
              >
                <button
                  onClick={() => setFacturacionAnual(false)}
                  className={`rounded-xl px-8 py-3 text-base font-semibold transition-all duration-300 ${
                    !facturacionAnual
                      ? 'bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-blue-50/50'
                  }`}
                  aria-pressed={!facturacionAnual}
                  aria-label="Facturación mensual"
                >
                  Mensual
                </button>
                <button
                  onClick={() => setFacturacionAnual(true)}
                  className={`rounded-xl px-8 py-3 text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
                    facturacionAnual
                      ? 'bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-blue-50/50'
                  }`}
                  aria-pressed={facturacionAnual}
                  aria-label="Facturación anual con 20% de descuento"
                >
                  Anual
                  {facturacionAnual && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm"
                    >
                      Ahorra 20%
                    </motion.span>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Selector de moneda mejorado */}
            <div
              className="flex items-center justify-center gap-3"
              role="group"
              aria-label="Selector de moneda"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMoneda('COP')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                  moneda === 'COP'
                    ? 'bg-white text-gray-900 border-2 border-blue-400 shadow-blue-200/50'
                    : 'bg-white/60 text-gray-700 border-2 border-transparent hover:border-gray-300 hover:bg-white'
                }`}
                aria-pressed={moneda === 'COP'}
                aria-label="Seleccionar pesos colombianos"
              >
                COP (Colombia)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMoneda('USD')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                  moneda === 'USD'
                    ? 'bg-white text-gray-900 border-2 border-blue-400 shadow-blue-200/50'
                    : 'bg-white/60 text-gray-700 border-2 border-transparent hover:border-gray-300 hover:bg-white'
                }`}
                aria-pressed={moneda === 'USD'}
                aria-label="Seleccionar dólares estadounidenses"
              >
                USD (Internacional)
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Planes mejorados */}
      <section className="py-20 px-4 relative z-10" aria-label="Planes disponibles">
        <div className="container mx-auto max-w-7xl">
          {cargando ? (
            <div className="flex justify-center items-center py-20" role="status" aria-live="polite">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-gray-700 text-lg font-medium">Cargando planes disponibles...</p>
              </div>
              <span className="sr-only">Cargando planes disponibles</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
              {planes.map((plan, index) => (
                <motion.article
                  key={plan.codigo}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className={`relative h-full ${plan.popular ? 'md:scale-105' : ''}`}
                  aria-label={`Plan ${plan.nombre}`}
                >
                  {/* Badge "Más Popular" */}
                  {plan.popular && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20"
                    >
                      <div className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white px-5 py-2 rounded-full text-sm font-extrabold shadow-lg flex items-center gap-2">
                        <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                        MÁS POPULAR
                        <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                      </div>
                    </motion.div>
                  )}

                  {/* Tarjeta principal */}
                  <div className={`h-full flex flex-col bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
                    plan.popular
                      ? 'border-2 border-blue-400 shadow-2xl shadow-blue-500/20 ring-4 ring-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30'
                      : 'border-2 border-gray-200 hover:border-blue-300 hover:shadow-2xl'
                  }`}>
                    {/* Banda superior de color */}
                    <div className={`h-2 bg-gradient-to-r ${plan.color}`} aria-hidden="true" />

                    {/* Contenido de la tarjeta */}
                    <div className="flex-1 flex flex-col p-8">
                      {/* Icono y nombre del plan */}
                      <div className="text-center mb-6">
                        <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.colorBadge} flex items-center justify-center shadow-lg`}>
                          <plan.icono className="w-10 h-10 text-gray-700" aria-hidden="true" />
                        </div>

                        <h3 className="text-3xl font-bold text-gray-900 mb-2">
                          {plan.nombre}
                        </h3>

                        <p className="text-base text-gray-600 leading-relaxed">
                          {plan.descripcion}
                        </p>
                      </div>

                      {/* Precio destacado */}
                      <div className="mb-6">
                        {plan.precio === 'Gratis' ? (
                          <div className={`rounded-2xl p-6 ${
                            plan.popular
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
                              : 'bg-gray-50 border-2 border-gray-200'
                          }`}>
                            <div className="flex items-baseline justify-center">
                              <span className={`text-5xl font-extrabold ${
                                plan.popular
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
                                  : 'text-gray-900'
                              }`}>
                                GRATIS
                              </span>
                            </div>
                            <p className="text-center text-green-700 font-medium mt-2">
                              Para siempre
                            </p>
                          </div>
                        ) : (
                          <div className={`rounded-2xl p-6 ${
                            plan.popular
                              ? 'bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 border-2 border-blue-200'
                              : 'bg-gray-50 border-2 border-gray-200'
                          }`}>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className={`text-5xl font-extrabold ${
                                plan.popular
                                  ? 'bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-transparent'
                                  : 'text-gray-900'
                              }`}>
                                {facturacionAnual && plan.precioAnual !== plan.precio ? plan.precioAnual : plan.precio}
                              </span>
                            </div>
                            {plan.moneda && (
                              <p className="text-center text-gray-600 font-medium mt-2">
                                {facturacionAnual ? plan.moneda.replace('/mes', '/mes (facturado anualmente)') : plan.moneda}
                              </p>
                            )}
                            {facturacionAnual && plan.precio !== plan.precioAnual && plan.precio !== 'Gratis' && (
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mt-3 pt-3 border-t border-gray-300"
                              >
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                                  <p className="text-sm font-bold">
                                    Ahorras 20% anual
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Lista de características */}
                      <div className={`flex-1 rounded-xl p-5 mb-6 ${
                        plan.popular
                          ? 'bg-gradient-to-br from-blue-50/50 to-green-50/50 border border-blue-100'
                          : 'bg-gray-50/50 border border-gray-100'
                      }`}>
                        <ul className="space-y-3.5">
                          {plan.caracteristicas.map((caracteristica, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className={`rounded-lg p-1.5 flex-shrink-0 ${
                                caracteristica.incluido
                                  ? plan.popular ? 'bg-green-100' : 'bg-green-50'
                                  : 'bg-gray-100'
                              }`}>
                                {caracteristica.incluido ? (
                                  <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                                ) : (
                                  <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                )}
                              </div>
                              <div className="flex-1">
                                <span className={`text-sm font-medium ${
                                  caracteristica.incluido ? 'text-gray-800' : 'text-gray-400'
                                }`}>
                                  {caracteristica.nombre}
                                </span>
                                {caracteristica.limite && caracteristica.incluido && (
                                  <span className="block text-xs text-gray-500 mt-1">
                                    {caracteristica.limite}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Botón CTA mejorado */}
                      <Link href={
                        plan.precio === 'Gratis'
                          ? '/registrar'
                          : `/pago/stripe?plan=${plan.codigo}&periodo=${facturacionAnual ? 'anual' : 'mensual'}&tipo=usuario`
                      } className="block">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                            plan.popular
                              ? 'bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
                              : plan.precio === 'Gratis'
                              ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white shadow-lg hover:shadow-xl'
                              : 'bg-white border-2 border-gray-300 text-gray-800 hover:border-blue-500 hover:bg-blue-50 shadow-lg hover:shadow-xl'
                          }`}
                          aria-label={`${plan.precio === 'Gratis' ? 'Comenzar gratis' : 'Elegir'} plan ${plan.nombre}`}
                        >
                          {plan.precio === 'Gratis' ? (
                            <>
                              <Sparkles className="w-5 h-5" aria-hidden="true" />
                              Comenzar Gratis
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5" aria-hidden="true" />
                              Elegir Plan
                            </>
                          )}
                        </motion.button>
                      </Link>

                      {/* Trust signal para plan popular */}
                      {plan.popular && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-xs text-center text-gray-600 mt-3 flex items-center justify-center gap-1.5"
                        >
                          <Shield className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                          Garantía de satisfacción
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ mejorado */}
      <section className="py-20 bg-white/50 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Header de FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md mb-6">
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              Preguntas Frecuentes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              ¿Tienes dudas?
            </h2>
            <p className="text-lg text-gray-600">
              Resolvemos las preguntas más comunes sobre nuestros planes
            </p>
          </motion.div>

          {/* Acordeones de preguntas */}
          <div className="space-y-4">
            {preguntas.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300"
              >
                <button
                  onClick={() => setPreguntaAbierta(preguntaAbierta === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-blue-50/30 transition-colors"
                  aria-expanded={preguntaAbierta === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-semibold text-lg text-gray-900 flex-1">
                    {item.pregunta}
                  </span>
                  <motion.div
                    animate={{ rotate: preguntaAbierta === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex-shrink-0"
                  >
                    <div className={`rounded-full p-1 ${
                      preguntaAbierta === index
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      <ChevronDown className={`w-5 h-5 ${
                        preguntaAbierta === index
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`} aria-hidden="true" />
                    </div>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {preguntaAbierta === index && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-2">
                        <div className="pl-4 border-l-4 border-blue-300">
                          <p className="text-gray-700 leading-relaxed">
                            {item.respuesta}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto y soporte mejorado */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-12 shadow-2xl border-2 border-blue-100"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md mb-6">
                <Mail className="w-4 h-4" aria-hidden="true" />
                Estamos Aquí Para Ayudarte
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                ¿Necesitas ayuda para elegir?
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                Nuestro equipo está listo para ayudarte a encontrar el plan perfecto para tu bienestar
              </p>
            </div>

            {/* Botones de contacto */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <Link href="/contacto" className="block h-full">
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="rounded-xl bg-blue-500 p-3 shadow-md">
                      <MessageSquare className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Chat en vivo
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Habla con nuestro equipo en tiempo real para resolver tus dudas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                    <span>Iniciar conversación</span>
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  </div>
                </motion.div>
              </Link>

              <Link href="/contacto" className="block h-full">
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 hover:border-green-400 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="rounded-xl bg-green-500 p-3 shadow-md">
                      <Mail className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Enviar email
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Escríbenos y te responderemos en menos de 24 horas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <span>Escribir mensaje</span>
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  </div>
                </motion.div>
              </Link>
            </div>

            {/* Trust badges finales */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t-2 border-gray-200">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-green-100 p-3">
                    <Shield className="w-6 h-6 text-green-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Garantía 30 días
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Devolución completa
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-blue-100 p-3">
                    <BadgeCheck className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Datos seguros
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Encriptación total
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-purple-100 p-3">
                    <Clock className="w-6 h-6 text-purple-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Soporte 24/7
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Siempre disponibles
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
