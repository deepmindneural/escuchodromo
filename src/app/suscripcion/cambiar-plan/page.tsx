'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaTimes,
  FaHeart,
  FaBrain,
  FaCrown,
  FaExchangeAlt,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle
} from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../lib/componentes/ui/card';
import { Boton } from '../../../lib/componentes/ui/boton';
import Footer from '../../../lib/componentes/layout/Footer';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { toast } from 'react-hot-toast';

interface SuscripcionActual {
  id: string;
  plan_id: string;
  plan: string;
  precio: number;
  moneda: string;
  periodo: string;
  fecha_fin: string;
}

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
  stripe_precio_id_mensual: string | null;
  stripe_precio_id_anual: string | null;
}

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual: number;
  moneda: string;
  color: string;
  icono: any;
  caracteristicas: string[];
  stripePrecioIdMensual: string | null;
  stripePrecioIdAnual: string | null;
}

export default function CambiarPlanPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [suscripcionActual, setSuscripcionActual] = useState<SuscripcionActual | null>(null);
  const [planesDisponibles, setPlanesDisponibles] = useState<Plan[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const supabase = obtenerClienteNavegador();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      // Verificar autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Obtener datos del usuario
      const { data: usuarioData } = await supabase
        .from('Usuario')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!usuarioData) {
        toast.error('Usuario no encontrado');
        router.push('/dashboard');
        return;
      }

      // Obtener suscripción activa
      const { data: suscripcion, error: errorSuscripcion } = await supabase
        .from('Suscripcion')
        .select('id, plan_id, plan, precio, moneda, periodo, fecha_fin')
        .eq('usuario_id', usuarioData.id)
        .eq('estado', 'activa')
        .order('creado_en', { ascending: false })
        .limit(1)
        .single();

      if (errorSuscripcion || !suscripcion) {
        toast.error('No tienes una suscripción activa');
        router.push('/precios');
        return;
      }

      setSuscripcionActual(suscripcion);

      // Cargar planes disponibles
      const { data: planesDB, error: errorPlanes } = await supabase.rpc('obtener_planes_publico', {
        p_tipo_usuario: 'paciente',
        p_moneda: suscripcion.moneda
      });

      if (errorPlanes) {
        console.error('Error al cargar planes:', errorPlanes);
        toast.error('No se pudieron cargar los planes disponibles');
        return;
      }

      // Mapear planes
      const planesFormateados: Plan[] = planesDB
        .filter((planDB: PlanDB) => planDB.id !== suscripcion.plan_id) // Excluir plan actual
        .map((planDB: PlanDB) => {
          let color = 'from-gray-400 to-gray-600';
          let icono = FaHeart;

          if (planDB.nombre.toLowerCase().includes('premium')) {
            color = 'from-blue-500 to-purple-600';
            icono = FaBrain;
          } else if (planDB.nombre.toLowerCase().includes('profesional')) {
            color = 'from-purple-500 to-pink-600';
            icono = FaCrown;
          }

          // Construir características
          const caracteristicas: string[] = [];
          if (planDB.limite_mensajes !== null) {
            caracteristicas.push(
              planDB.limite_mensajes === -1
                ? 'Chat con IA ilimitado'
                : `Chat con IA (${planDB.limite_mensajes} mensajes/día)`
            );
          }
          if (planDB.limite_evaluaciones !== null) {
            caracteristicas.push(
              planDB.limite_evaluaciones === -1
                ? 'Evaluaciones ilimitadas'
                : `${planDB.limite_evaluaciones} evaluaciones por mes`
            );
          }
          if (planDB.caracteristicas && Array.isArray(planDB.caracteristicas)) {
            planDB.caracteristicas.forEach((car: any) => {
              caracteristicas.push(car.nombre || car);
            });
          }

          return {
            id: planDB.id,
            nombre: planDB.nombre,
            descripcion: planDB.descripcion || `Plan ${planDB.nombre}`,
            precioMensual: planDB.precio_mensual,
            precioAnual: planDB.precio_anual,
            moneda: planDB.moneda,
            color,
            icono,
            caracteristicas,
            stripePrecioIdMensual: planDB.stripe_precio_id_mensual,
            stripePrecioIdAnual: planDB.stripe_precio_id_anual
          };
        });

      setPlanesDisponibles(planesFormateados);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setCargando(false);
    }
  };

  const calcularProrrateo = (planNuevo: Plan): { tipo: 'upgrade' | 'downgrade', monto: number, descripcion: string } => {
    if (!suscripcionActual) {
      return { tipo: 'upgrade', monto: 0, descripcion: '' };
    }

    const precioActual = suscripcionActual.precio;
    const precioNuevo = suscripcionActual.periodo === 'mensual'
      ? planNuevo.precioMensual
      : planNuevo.precioAnual / 12;

    const diferencia = precioNuevo - precioActual;
    const esUpgrade = diferencia > 0;

    // Calcular días restantes
    const diasRestantes = Math.ceil(
      (new Date(suscripcionActual.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const diasTotales = suscripcionActual.periodo === 'mensual' ? 30 : 365;
    const proporcion = diasRestantes / diasTotales;

    const montoProrrateo = Math.abs(diferencia * proporcion);

    let descripcion = '';
    if (esUpgrade) {
      descripcion = `Se cobrará ${formatearPrecio(montoProrrateo, suscripcionActual.moneda)} por los ${diasRestantes} días restantes del período actual.`;
    } else {
      descripcion = `Se aplicará un crédito de ${formatearPrecio(montoProrrateo, suscripcionActual.moneda)} en tu próxima factura.`;
    }

    return {
      tipo: esUpgrade ? 'upgrade' : 'downgrade',
      monto: montoProrrateo,
      descripcion
    };
  };

  const confirmarCambioPlan = async () => {
    if (!planSeleccionado || !suscripcionActual) return;

    try {
      setProcesando(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesión expirada');
        router.push('/iniciar-sesion');
        return;
      }

      // Determinar el precio ID de Stripe según el período
      const stripePrecioId = suscripcionActual.periodo === 'mensual'
        ? planSeleccionado.stripePrecioIdMensual
        : planSeleccionado.stripePrecioIdAnual;

      if (!stripePrecioId) {
        toast.error('Plan no disponible para este período de facturación');
        return;
      }

      // Llamar a Edge Function para cambiar plan
      const { data, error } = await supabase.functions.invoke('cambiar-plan-stripe', {
        body: {
          nuevo_plan_id: planSeleccionado.id,
          nuevo_precio_stripe_id: stripePrecioId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Plan cambiado exitosamente a ${planSeleccionado.nombre}`);

      // Redirigir a la página de suscripción
      setTimeout(() => {
        router.push('/suscripcion');
      }, 1500);
    } catch (error: any) {
      console.error('Error al cambiar plan:', error);
      toast.error(error.message || 'No se pudo cambiar el plan');
    } finally {
      setProcesando(false);
      setMostrarConfirmacion(false);
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

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando planes disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/suscripcion">
          <Boton variante="fantasma" className="mb-4">
            <FaArrowLeft className="h-4 w-4 mr-2" />
            Volver a mi suscripción
          </Boton>
        </Link>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <FaExchangeAlt className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cambiar de Plan
            </h1>
            <p className="text-xl text-gray-600">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </motion.div>

          {/* Plan actual */}
          {suscripcionActual && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Tu Plan Actual</CardTitle>
                  <CardDescription className="text-blue-100">
                    Este es el plan que tienes contratado actualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{suscripcionActual.plan}</h3>
                      <p className="text-blue-100">
                        {formatearPrecio(suscripcionActual.precio, suscripcionActual.moneda)}
                        /{suscripcionActual.periodo === 'mensual' ? 'mes' : 'año'}
                      </p>
                    </div>
                    <FaCrown className="h-12 w-12 text-yellow-300" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Planes disponibles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {planesDisponibles.map((plan, index) => {
              const prorrateo = calcularProrrateo(plan);
              const precio = suscripcionActual?.periodo === 'mensual'
                ? plan.precioMensual
                : plan.precioAnual / 12;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow">
                    <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center`}>
                          <plan.icono className="text-2xl text-white" />
                        </div>
                        {prorrateo.tipo === 'upgrade' ? (
                          <FaArrowUp className="text-green-500 h-6 w-6" />
                        ) : (
                          <FaArrowDown className="text-orange-500 h-6 w-6" />
                        )}
                      </div>
                      <CardTitle>{plan.nombre}</CardTitle>
                      <CardDescription>{plan.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatearPrecio(precio, plan.moneda)}
                        </span>
                        <span className="text-sm text-gray-600">
                          /{suscripcionActual?.periodo === 'mensual' ? 'mes' : 'año'}
                        </span>
                      </div>

                      {/* Características */}
                      <ul className="space-y-2 mb-6">
                        {plan.caracteristicas.slice(0, 4).map((caracteristica, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{caracteristica}</span>
                          </li>
                        ))}
                        {plan.caracteristicas.length > 4 && (
                          <li className="text-sm text-gray-500">
                            +{plan.caracteristicas.length - 4} características más
                          </li>
                        )}
                      </ul>

                      {/* Info de prorrateo */}
                      <div className={`p-3 rounded-lg mb-4 ${
                        prorrateo.tipo === 'upgrade' ? 'bg-green-50' : 'bg-orange-50'
                      }`}>
                        <div className="flex items-start gap-2">
                          <FaInfoCircle className={`mt-0.5 flex-shrink-0 ${
                            prorrateo.tipo === 'upgrade' ? 'text-green-600' : 'text-orange-600'
                          }`} />
                          <p className="text-xs text-gray-700">
                            {prorrateo.descripcion}
                          </p>
                        </div>
                      </div>

                      <Boton
                        onClick={() => {
                          setPlanSeleccionado(plan);
                          setMostrarConfirmacion(true);
                        }}
                        className="w-full"
                        variante={prorrateo.tipo === 'upgrade' ? 'predeterminado' : 'contorno'}
                      >
                        {prorrateo.tipo === 'upgrade' ? 'Mejorar a este plan' : 'Cambiar a este plan'}
                      </Boton>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Información adicional */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FaInfoCircle />
                Información sobre cambios de plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <p>
                • Al mejorar tu plan, tendrás acceso inmediato a todas las nuevas funciones.
              </p>
              <p>
                • Si reduces tu plan, los cambios se aplicarán al final del período actual.
              </p>
              <p>
                • Los cargos se ajustarán proporcionalmente según los días restantes de tu período de facturación.
              </p>
              <p>
                • Puedes cancelar o cambiar tu plan en cualquier momento sin penalizaciones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de confirmación */}
      {mostrarConfirmacion && planSeleccionado && suscripcionActual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Confirmar cambio de plan
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Plan actual</p>
                  <p className="font-semibold text-gray-900">{suscripcionActual.plan}</p>
                </div>
                <FaArrowLeft className="text-gray-400 rotate-180" />
                <div>
                  <p className="text-sm text-gray-500">Nuevo plan</p>
                  <p className="font-semibold text-gray-900">{planSeleccionado.nombre}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {calcularProrrateo(planSeleccionado).descripcion}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Boton
                variante="contorno"
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setPlanSeleccionado(null);
                }}
                disabled={procesando}
                className="flex-1"
              >
                Cancelar
              </Boton>
              <Boton
                onClick={confirmarCambioPlan}
                disabled={procesando}
                className="flex-1"
              >
                {procesando ? (
                  <>
                    <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar cambio'
                )}
              </Boton>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
