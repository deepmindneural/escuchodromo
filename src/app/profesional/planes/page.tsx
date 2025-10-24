'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BadgeCheck,
  TrendingUp,
  Zap,
  Users,
  Check,
  X,
  Shield,
  BarChart3,
  Star,
  Clock,
  Calendar,
  MessageSquare,
  HeadphonesIcon,
} from 'lucide-react';
import { Button } from '@/lib/componentes/ui/button';
import { Badge } from '@/lib/componentes/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/lib/componentes/ui/card';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import toast, { Toaster } from 'react-hot-toast';

interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  moneda: string;
  caracteristicas: Array<{
    nombre: string;
    incluido: boolean;
    limite?: string;
  }>;
  limite_pacientes: number | null;
  verificado: boolean;
  acceso_analytics: boolean;
  destacado: boolean;
}

const iconosCaracteristicas: Record<string, any> = {
  pacientes: Users,
  verificado: BadgeCheck,
  analytics: BarChart3,
  soporte: HeadphonesIcon,
  reportes: TrendingUp,
  chat: MessageSquare,
  calendario: Calendar,
  integracion: Zap,
};

export default function PlanesProfesionales() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const [planes, setPlanes] = useState<Plan[]>([]);
  const [periodo, setPeriodo] = useState<'mensual' | 'anual'>('mensual');
  const [cargando, setCargando] = useState(true);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    cargarPlanes();
  }, [periodo]);

  const verificarAutenticacion = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUsuarioAutenticado(!!session);
  };

  const cargarPlanes = async () => {
    try {
      setCargando(true);

      // Llamar a la función RPC para obtener planes públicos
      const { data, error } = await supabase.rpc('obtener_planes_publico', {
        p_tipo_usuario: 'profesional',
        p_moneda: 'COP',
      });

      if (error) {
        console.error('Error cargando planes:', error);
        toast.error('No se pudieron cargar los planes disponibles');
        return;
      }

      if (data) {
        setPlanes(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los planes');
    } finally {
      setCargando(false);
    }
  };

  const manejarSeleccionarPlan = (planCodigo: string) => {
    if (!usuarioAutenticado) {
      toast.error('Debes iniciar sesión para suscribirte');
      router.push('/iniciar-sesion?redirect=/profesional/planes');
      return;
    }

    // Redirigir a la página de pago con parámetros
    router.push(`/pago/stripe?plan=${planCodigo}&periodo=${periodo}&tipo=profesional`);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Toaster position="top-center" />
        <div className="text-center" role="status" aria-live="polite">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-700 text-lg font-medium">Cargando planes profesionales...</p>
          <span className="sr-only">Cargando información de planes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
      </div>

      <Toaster position="top-center" />

      {/* Header con paleta terapéutica mejorada */}
      <section className="pt-28 pb-20 px-4 relative z-10" role="main" aria-label="Planes profesionales">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Badge className="mb-8 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow rounded-full">
                <Star className="w-4 h-4 inline mr-2" aria-hidden="true" />
                Planes Profesionales
              </Badge>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6 leading-tight">
              Crece tu práctica terapéutica
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto mb-10 leading-relaxed font-light">
              Gestiona pacientes, análisis con IA y herramientas profesionales.
              <span className="block mt-2 font-medium text-gray-800">
                Todo lo que necesitas para ofrecer el mejor servicio.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-6 py-3.5 border border-green-200 shadow-sm">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">Prueba gratuita de 14 días</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full px-6 py-3.5 border border-blue-200 shadow-sm">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">Cancela cuando quieras</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Toggle Mensual/Anual con mejor accesibilidad y diseño mejorado */}
      <section className="pb-16 px-4 relative z-10" aria-label="Selector de periodo de facturación">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-16"
          >
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border-2 border-blue-200/50"
              role="group"
              aria-label="Período de facturación"
            >
              <Button
                variant={periodo === 'mensual' ? 'default' : 'ghost'}
                onClick={() => setPeriodo('mensual')}
                className={`rounded-xl px-10 py-4 text-base font-semibold transition-all duration-300 ${
                  periodo === 'mensual'
                    ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-blue-50/50'
                }`}
                aria-pressed={periodo === 'mensual'}
                aria-label="Facturación mensual"
              >
                Mensual
              </Button>
              <Button
                variant={periodo === 'anual' ? 'default' : 'ghost'}
                onClick={() => setPeriodo('anual')}
                className={`rounded-xl px-10 py-4 text-base font-semibold transition-all duration-300 ${
                  periodo === 'anual'
                    ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-blue-50/50'
                }`}
                aria-pressed={periodo === 'anual'}
                aria-label="Facturación anual con 20% de descuento"
              >
                Anual
                <Badge className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 font-bold shadow-sm">
                  Ahorra 20%
                </Badge>
              </Button>
            </div>
          </motion.div>

          {/* Tarjetas de planes con mejor espaciado */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {planes.map((plan, index) => (
              <TarjetaPlanProfesional
                key={plan.id}
                plan={plan}
                periodo={periodo}
                onSeleccionar={manejarSeleccionarPlan}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Tabla de comparación */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-7xl">
          <TablaComparacionProfesionales planes={planes} periodo={periodo} />
        </div>
      </section>

      {/* FAQ y Soporte mejorado */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-12 shadow-2xl border-2 border-blue-100"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 text-sm font-semibold shadow-md">
                <HeadphonesIcon className="w-4 h-4 inline mr-2" aria-hidden="true" />
                Estamos Aquí Para Ayudarte
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                ¿Necesitas ayuda para elegir?
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto para tu práctica
              </p>
            </div>

            {/* Grid de opciones de contacto */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Contactar ventas */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/contacto" className="block h-full">
                  <div className="h-full bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="rounded-xl bg-blue-500 p-3 shadow-md">
                        <MessageSquare className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Contactar ventas
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Habla con nuestro equipo para planes empresariales o preguntas específicas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                      <span>Enviar mensaje</span>
                      <TrendingUp className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* FAQ */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/preguntas-frecuentes" className="block h-full">
                  <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 hover:border-green-400 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="rounded-xl bg-green-500 p-3 shadow-md">
                        <HeadphonesIcon className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Preguntas frecuentes
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Encuentra respuestas rápidas a las dudas más comunes sobre nuestros planes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                      <span>Ver preguntas</span>
                      <TrendingUp className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t-2 border-gray-200">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-green-100 p-3">
                    <Shield className="w-6 h-6 text-green-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Garantía de satisfacción
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-blue-100 p-3">
                    <Clock className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Soporte 24/7
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-purple-100 p-3">
                    <BadgeCheck className="w-6 h-6 text-purple-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Datos seguros
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

interface TarjetaPlanProfesionalProps {
  plan: Plan;
  periodo: 'mensual' | 'anual';
  onSeleccionar: (codigo: string) => void;
  index: number;
}

function TarjetaPlanProfesional({
  plan,
  periodo,
  onSeleccionar,
  index,
}: TarjetaPlanProfesionalProps) {
  const precio = periodo === 'mensual' ? plan.precio_mensual : plan.precio_anual;
  const esGratis = precio === 0;

  // Ahorros anuales
  const ahorroAnual = plan.precio_mensual * 12 - plan.precio_anual;
  const porcentajeAhorro = Math.round((ahorroAnual / (plan.precio_mensual * 12)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="h-full"
    >
      <Card
        className={`h-full flex flex-col relative overflow-hidden transition-all duration-300 backdrop-blur-sm ${
          plan.destacado
            ? 'border-2 border-blue-400 shadow-2xl shadow-blue-500/20 ring-4 ring-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 scale-105 lg:scale-110'
            : 'border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-2xl bg-white/90'
        }`}
        role="article"
        aria-label={`Plan ${plan.nombre}`}
      >
        {plan.destacado && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white text-center py-3 text-sm font-extrabold tracking-wide shadow-lg"
            aria-label="Plan más popular"
          >
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>MÁS POPULAR</span>
              <Star className="w-4 h-4 fill-current" aria-hidden="true" />
            </div>
          </motion.div>
        )}

        <CardHeader className={plan.destacado ? 'pt-16 pb-6' : 'pt-6 pb-6'}>
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
              {plan.nombre}
            </CardTitle>
            <CardDescription className="text-base text-gray-600 leading-relaxed">
              {plan.descripcion}
            </CardDescription>
          </div>

          {/* Precio mejorado */}
          <div className="mt-4 mb-2">
            {esGratis ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    GRATIS
                  </span>
                </div>
                <p className="text-center text-green-700 font-medium mt-2">
                  14 días de prueba
                </p>
              </div>
            ) : (
              <div className={`rounded-2xl p-6 ${
                plan.destacado
                  ? 'bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 border-2 border-blue-200'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}>
                <div className="flex items-start justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-700 mt-2">$</span>
                  <span className={`text-6xl font-extrabold ${
                    plan.destacado
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent'
                      : 'text-gray-900'
                  }`}>
                    {Math.floor(precio / 1000)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-gray-700">K</span>
                    <span className="text-sm text-gray-500 font-medium">
                      {plan.moneda}
                    </span>
                  </div>
                </div>
                <p className="text-center text-gray-600 font-medium mt-2">
                  por {periodo === 'mensual' ? 'mes' : 'año'}
                </p>
                {periodo === 'anual' && porcentajeAhorro > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 pt-3 border-t border-gray-300"
                  >
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <TrendingUp className="w-4 h-4" aria-hidden="true" />
                      <p className="text-sm font-bold">
                        Ahorras ${(ahorroAnual / 1000).toFixed(0)}K ({porcentajeAhorro}%)
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6 pb-6">
          <div className={`rounded-xl p-4 mb-4 ${
            plan.destacado
              ? 'bg-gradient-to-br from-blue-50/50 to-green-50/50 border border-blue-100'
              : 'bg-gray-50/50 border border-gray-100'
          }`}>
            <ul className="space-y-3.5">
              {/* Límite de pacientes */}
              <li className="flex items-start gap-3">
                <div className={`rounded-lg p-1.5 ${
                  plan.destacado ? 'bg-blue-100' : 'bg-blue-50'
                }`}>
                  <Users className="w-4 h-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-gray-800 mt-1">
                  {plan.limite_pacientes
                    ? `Hasta ${plan.limite_pacientes} pacientes`
                    : 'Pacientes ilimitados'}
                </span>
              </li>

              {/* Verificado */}
              {plan.verificado && (
                <li className="flex items-start gap-3">
                  <div className={`rounded-lg p-1.5 ${
                    plan.destacado ? 'bg-green-100' : 'bg-green-50'
                  }`}>
                    <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 mt-1">
                    Insignia verificado
                  </span>
                </li>
              )}

              {/* Analytics */}
              {plan.acceso_analytics && (
                <li className="flex items-start gap-3">
                  <div className={`rounded-lg p-1.5 ${
                    plan.destacado ? 'bg-purple-100' : 'bg-purple-50'
                  }`}>
                    <BarChart3 className="w-4 h-4 text-purple-600 flex-shrink-0" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 mt-1">
                    Analytics avanzado
                  </span>
                </li>
              )}

              {/* Características desde JSON */}
              {plan.caracteristicas?.map((car, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`rounded-lg p-1.5 ${
                    car.incluido
                      ? plan.destacado ? 'bg-green-100' : 'bg-green-50'
                      : 'bg-gray-100'
                  }`}>
                    {car.incluido ? (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 mt-1">
                    <span
                      className={`text-sm font-medium ${
                        car.incluido ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {car.nombre}
                    </span>
                    {car.limite && car.incluido && (
                      <span className="block text-xs text-gray-500 mt-1 font-normal">
                        {car.limite}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 pt-2">
          <motion.div
            className="w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => onSeleccionar(plan.codigo)}
              className={`w-full font-bold text-base py-7 rounded-xl transition-all duration-300 ${
                plan.destacado
                  ? 'bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
                  : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white shadow-lg hover:shadow-xl'
              }`}
              size="lg"
              aria-label={`${esGratis ? 'Comenzar prueba gratuita' : 'Suscribirse'} al plan ${plan.nombre}`}
            >
              <span className="flex items-center justify-center gap-2">
                {esGratis ? (
                  <>
                    <Zap className="w-5 h-5" aria-hidden="true" />
                    Comenzar Prueba Gratuita
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" aria-hidden="true" />
                    Suscribirme Ahora
                  </>
                )}
              </span>
            </Button>
          </motion.div>

          {/* Trust signal */}
          {plan.destacado && (
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
        </CardFooter>
      </Card>
    </motion.div>
  );
}

interface TablaComparacionProps {
  planes: Plan[];
  periodo: 'mensual' | 'anual';
}

function TablaComparacionProfesionales({ planes, periodo }: TablaComparacionProps) {
  // Extraer todas las características únicas
  const todasCaracteristicas = new Set<string>();
  planes.forEach((plan) => {
    plan.caracteristicas?.forEach((car) => todasCaracteristicas.add(car.nombre));
  });

  // Agregar características base
  todasCaracteristicas.add('Límite de pacientes');
  todasCaracteristicas.add('Insignia verificado');
  todasCaracteristicas.add('Analytics avanzado');

  const caracteristicasArray = Array.from(todasCaracteristicas);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="relative"
    >
      {/* Header de la sección */}
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-2 text-sm font-semibold shadow-md">
          <BarChart3 className="w-4 h-4 inline mr-2" aria-hidden="true" />
          Comparación Completa
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
          Comparación detallada de planes
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Revisa todas las características para encontrar el plan perfecto para tu práctica
        </p>
      </div>

      {/* Tabla mejorada */}
      <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 bg-white shadow-2xl">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-5 text-left text-base font-bold text-gray-900 sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10">
                Característica
              </th>
              {planes.map((plan) => (
                <th
                  key={plan.id}
                  className={`px-6 py-5 text-center text-base font-bold ${
                    plan.destacado
                      ? 'bg-gradient-to-b from-blue-50 to-teal-50 text-blue-900'
                      : 'text-gray-900'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {plan.destacado && (
                      <Star className="w-5 h-5 text-blue-500 fill-current" aria-hidden="true" />
                    )}
                    <span>{plan.nombre}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {caracteristicasArray.map((nombreCaracteristica, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="hover:bg-blue-50/30 transition-colors duration-200"
              >
                <td className="px-6 py-5 text-sm text-gray-800 font-semibold sticky left-0 bg-white hover:bg-blue-50/30 transition-colors">
                  {nombreCaracteristica}
                </td>
                {planes.map((plan) => {
                  let valor: boolean | string = false;

                  // Características especiales
                  if (nombreCaracteristica === 'Límite de pacientes') {
                    valor = plan.limite_pacientes
                      ? `Hasta ${plan.limite_pacientes}`
                      : 'Ilimitados';
                  } else if (nombreCaracteristica === 'Insignia verificado') {
                    valor = plan.verificado;
                  } else if (nombreCaracteristica === 'Analytics avanzado') {
                    valor = plan.acceso_analytics;
                  } else {
                    // Buscar en características JSON
                    const car = plan.caracteristicas?.find(
                      (c) => c.nombre === nombreCaracteristica
                    );
                    if (car) {
                      valor = car.incluido;
                      if (car.limite && car.incluido) {
                        valor = car.limite;
                      }
                    }
                  }

                  return (
                    <td
                      key={plan.id}
                      className={`px-6 py-5 text-center ${
                        plan.destacado ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {typeof valor === 'boolean' ? (
                        valor ? (
                          <div className="flex justify-center">
                            <div className="rounded-full bg-green-100 p-1.5">
                              <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="rounded-full bg-gray-100 p-1.5">
                              <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-sm font-medium text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                          {valor}
                        </span>
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nota adicional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-green-600" aria-hidden="true" />
          Todos los planes incluyen prueba gratuita de 14 días sin tarjeta de crédito
        </p>
      </motion.div>
    </motion.div>
  );
}
