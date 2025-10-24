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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Toaster position="top-center" />

      {/* Header con paleta terapéutica */}
      <section className="pt-24 pb-16 px-4" role="main" aria-label="Planes profesionales">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 text-sm font-medium shadow-md">
              Planes Profesionales
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Crece tu práctica terapéutica
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-6 leading-relaxed">
              Gestiona pacientes, análisis con IA y herramientas profesionales.
              Todo lo que necesitas para ofrecer el mejor servicio.
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600 bg-green-50 rounded-full px-6 py-3 inline-flex border border-green-200">
              <Shield className="w-5 h-5 text-green-600" aria-hidden="true" />
              <span>Prueba gratuita de 14 días · Cancela cuando quieras</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Toggle Mensual/Anual con mejor accesibilidad */}
      <section className="pb-12 px-4" aria-label="Selector de periodo de facturación">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-center mb-12">
            <div
              className="bg-white rounded-full p-2 shadow-lg border-2 border-blue-200"
              role="group"
              aria-label="Período de facturación"
            >
              <Button
                variant={periodo === 'mensual' ? 'default' : 'ghost'}
                onClick={() => setPeriodo('mensual')}
                className={`rounded-full px-8 py-3 transition-all duration-300 ${
                  periodo === 'mensual'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
                aria-pressed={periodo === 'mensual'}
                aria-label="Facturación mensual"
              >
                Mensual
              </Button>
              <Button
                variant={periodo === 'anual' ? 'default' : 'ghost'}
                onClick={() => setPeriodo('anual')}
                className={`rounded-full px-8 py-3 transition-all duration-300 ${
                  periodo === 'anual'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
                aria-pressed={periodo === 'anual'}
                aria-label="Facturación anual con 20% de descuento"
              >
                Anual
                <Badge className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 font-semibold">
                  -20%
                </Badge>
              </Button>
            </div>
          </div>

          {/* Tarjetas de planes */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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

      {/* FAQ y Soporte */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Necesitas ayuda para elegir?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto para tu práctica
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto">
              <Button size="lg" className="gap-2">
                <MessageSquare className="w-5 h-5" />
                Contactar ventas
              </Button>
            </Link>
            <Link href="/preguntas-frecuentes">
              <Button size="lg" variant="outline" className="gap-2">
                <HeadphonesIcon className="w-5 h-5" />
                Ver preguntas frecuentes
              </Button>
            </Link>
          </div>
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
      className="h-full"
    >
      <Card
        className={`h-full flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-102 ${
          plan.destacado
            ? 'border-2 border-blue-500 shadow-xl ring-2 ring-blue-200 ring-offset-2'
            : 'border-2 border-gray-200 hover:border-blue-300'
        }`}
        role="article"
        aria-label={`Plan ${plan.nombre}`}
      >
        {plan.destacado && (
          <div
            className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-green-500 text-white text-center py-2.5 text-sm font-bold tracking-wide shadow-md"
            aria-label="Plan más popular"
          >
            ⭐ MÁS POPULAR
          </div>
        )}

        <CardHeader className={plan.destacado ? 'pt-12' : ''}>
          <div className="mb-4">
            <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
            <CardDescription className="mt-2">{plan.descripcion}</CardDescription>
          </div>

          {/* Precio */}
          <div className="mt-6">
            {esGratis ? (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">GRATIS</span>
                <span className="text-slate-600">14 días</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-slate-900">$</span>
                  <span className="text-5xl font-bold text-slate-900">
                    {Math.floor(precio / 1000)}
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">K</span>
                  <span className="text-slate-600 ml-2">
                    /{periodo === 'mensual' ? 'mes' : 'año'}
                  </span>
                </div>
                {periodo === 'anual' && porcentajeAhorro > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Ahorras ${(ahorroAnual / 1000).toFixed(0)}K al año ({porcentajeAhorro}%)
                  </p>
                )}
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <ul className="space-y-3">
            {/* Límite de pacientes */}
            <li className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">
                {plan.limite_pacientes
                  ? `Hasta ${plan.limite_pacientes} pacientes`
                  : 'Pacientes ilimitados'}
              </span>
            </li>

            {/* Verificado */}
            {plan.verificado && (
              <li className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">Insignia verificado</span>
              </li>
            )}

            {/* Analytics */}
            {plan.acceso_analytics && (
              <li className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">Analytics avanzado</span>
              </li>
            )}

            {/* Características desde JSON */}
            {plan.caracteristicas?.map((car, i) => (
              <li key={i} className="flex items-start gap-3">
                {car.incluido ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span
                    className={`text-sm ${
                      car.incluido ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {car.nombre}
                  </span>
                  {car.limite && car.incluido && (
                    <span className="block text-xs text-slate-500 mt-0.5">{car.limite}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-6">
          <Button
            onClick={() => onSeleccionar(plan.codigo)}
            className={`w-full font-semibold text-lg py-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
              plan.destacado
                ? 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white transform hover:scale-105'
                : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
            }`}
            size="lg"
            aria-label={`${esGratis ? 'Comenzar prueba gratuita' : 'Suscribirse'} al plan ${plan.nombre}`}
          >
            {esGratis ? '✨ Comenzar Prueba Gratuita' : '🚀 Suscribirme Ahora'}
          </Button>
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
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
        Comparación detallada de planes
      </h2>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-lg">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Característica
              </th>
              {planes.map((plan) => (
                <th
                  key={plan.id}
                  className="px-6 py-4 text-center text-sm font-semibold text-slate-900"
                >
                  {plan.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {caracteristicasArray.map((nombreCaracteristica, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-700 font-medium">
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
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {typeof valor === 'boolean' ? (
                        valor ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-slate-700">{valor}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
