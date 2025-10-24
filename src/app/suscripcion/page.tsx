'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../lib/componentes/ui/card';
import { Boton } from '../../lib/componentes/ui/boton';
import Footer from '../../lib/componentes/layout/Footer';
import { FaArrowLeft, FaSpinner, FaCrown, FaCheckCircle, FaExclamationCircle, FaExchangeAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface Suscripcion {
  id: string;
  plan: string;
  estado: string;
  precio: number;
  moneda: string;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  stripe_suscripcion_id: string;
  cancelar_al_final?: boolean;
}

export default function PaginaSuscripcion() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [suscripcionActiva, setSuscripcionActiva] = useState<Suscripcion | null>(null);
  const supabase = obtenerClienteNavegador();

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      await cargarSuscripcion();
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarSuscripcion = async () => {
    try {
      setCargando(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      // Obtener datos del usuario
      const { data: usuarioData } = await supabase
        .from('Usuario')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!usuarioData) {
        toast.error('Usuario no encontrado');
        return;
      }

      // Obtener suscripción activa usando RPC (evita error 406)
      const { data: suscripcionArray } = await supabase
        .rpc('obtener_suscripcion_usuario');

      const suscripcion = suscripcionArray && suscripcionArray.length > 0 ? suscripcionArray[0] : null;

      if (suscripcion) {
        setSuscripcionActiva(suscripcion as any);
      } else {
        // Si no hay suscripción activa, redirigir a precios
        router.push('/precios');
      }
    } catch (error) {
      console.error('Error al cargar suscripción:', error);
    } finally {
      setCargando(false);
    }
  };

  const cancelarSuscripcion = async () => {
    if (!suscripcionActiva) return;

    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Mantendrás acceso hasta el final del período actual.')) {
      return;
    }

    try {
      setProcesando(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión expirada');
        router.push('/iniciar-sesion');
        return;
      }

      const { data, error } = await supabase.functions.invoke('gestionar-suscripcion', {
        body: { accion: 'cancelar' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success('Suscripción cancelada. Mantendrás acceso hasta ' +
        new Date(suscripcionActiva.fecha_fin).toLocaleDateString('es-CO'));

      // Recargar suscripción
      await cargarSuscripcion();
    } catch (error: any) {
      console.error('Error al cancelar suscripción:', error);
      toast.error(error.message || 'No se pudo cancelar la suscripción');
    } finally {
      setProcesando(false);
    }
  };

  const reactivarSuscripcion = async () => {
    if (!suscripcionActiva) return;

    try {
      setProcesando(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión expirada');
        router.push('/iniciar-sesion');
        return;
      }

      const { data, error } = await supabase.functions.invoke('gestionar-suscripcion', {
        body: { accion: 'reactivar' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success('¡Suscripción reactivada exitosamente!');

      // Recargar suscripción
      await cargarSuscripcion();
    } catch (error: any) {
      console.error('Error al reactivar suscripción:', error);
      toast.error(error.message || 'No se pudo reactivar la suscripción');
    } finally {
      setProcesando(false);
    }
  };

  const formatearPrecio = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  const obtenerNombrePlan = (plan: string) => {
    const nombres: { [key: string]: string } = {
      'basico': 'Plan Básico',
      'premium': 'Plan Premium',
      'profesional': 'Plan Profesional'
    };
    return nombres[plan.toLowerCase()] || plan;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Boton variante="fantasma" className="mb-4">
            <FaArrowLeft className="h-4 w-4 mr-2" />
            Volver al dashboard
          </Boton>
        </Link>

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <FaCrown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mi Suscripción
            </h1>
            <p className="text-xl text-gray-600">
              Gestiona tu plan y facturación
            </p>
          </motion.div>

          {suscripcionActiva && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Estado de la suscripción */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {suscripcionActiva.estado === 'activa' ? (
                        <>
                          <FaCheckCircle className="text-green-500" />
                          Suscripción Activa
                        </>
                      ) : (
                        <>
                          <FaExclamationCircle className="text-orange-500" />
                          Suscripción Cancelada
                        </>
                      )}
                    </CardTitle>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      suscripcionActiva.estado === 'activa'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {suscripcionActiva.estado === 'activa' ? 'Activa' : 'Cancelada'}
                    </span>
                  </div>
                  {suscripcionActiva.cancelar_al_final && (
                    <CardDescription className="mt-2 text-orange-600">
                      Se cancelará al final del período actual
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Plan actual</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {obtenerNombrePlan(suscripcionActiva.plan)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Precio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatearPrecio(suscripcionActiva.precio, suscripcionActiva.moneda)}
                        <span className="text-base font-normal text-gray-600">
                          /{suscripcionActiva.periodo === 'mensual' ? 'mes' : 'año'}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fecha de inicio</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {new Date(suscripcionActiva.fecha_inicio).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {suscripcionActiva.cancelar_al_final ? 'Válida hasta' : 'Próxima renovación'}
                      </p>
                      <p className="text-lg font-semibold text-gray-700">
                        {new Date(suscripcionActiva.fecha_fin).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Gestionar Suscripción</CardTitle>
                  <CardDescription>
                    Controla tu suscripción y facturación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suscripcionActiva.estado === 'activa' && !suscripcionActiva.cancelar_al_final && (
                      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Cambiar de plan
                          </h3>
                          <p className="text-sm text-gray-600">
                            Actualiza o reduce tu plan según tus necesidades
                          </p>
                        </div>
                        <Link href="/suscripcion/cambiar-plan">
                          <Boton variante="contorno" className="flex items-center gap-2">
                            <FaExchangeAlt className="h-4 w-4" />
                            Cambiar Plan
                          </Boton>
                        </Link>
                      </div>
                    )}

                    {suscripcionActiva.estado === 'activa' && !suscripcionActiva.cancelar_al_final && (
                      <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Cancelar suscripción
                          </h3>
                          <p className="text-sm text-gray-600">
                            Mantendrás acceso hasta el final del período actual
                          </p>
                        </div>
                        <Boton
                          variante="destructivo"
                          onClick={cancelarSuscripcion}
                          disabled={procesando}
                        >
                          {procesando ? (
                            <>
                              <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                              Cancelando...
                            </>
                          ) : (
                            'Cancelar'
                          )}
                        </Boton>
                      </div>
                    )}

                    {suscripcionActiva.cancelar_al_final && (
                      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Reactivar suscripción
                          </h3>
                          <p className="text-sm text-gray-600">
                            Continúa disfrutando de todos los beneficios de tu plan
                          </p>
                        </div>
                        <Boton
                          onClick={reactivarSuscripcion}
                          disabled={procesando}
                        >
                          {procesando ? (
                            <>
                              <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                              Reactivando...
                            </>
                          ) : (
                            'Reactivar'
                          )}
                        </Boton>
                      </div>
                    )}

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Historial de pagos
                        </h3>
                        <p className="text-sm text-gray-600">
                          Consulta tus facturas y pagos anteriores
                        </p>
                      </div>
                      <Link href="/perfil">
                        <Boton variante="contorno">
                          Ver historial
                        </Boton>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Información de seguridad */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>🔒 Todos los pagos son procesados de forma segura por Stripe</p>
            <p className="mt-2">
              ¿Necesitas ayuda? <Link href="/contacto" className="text-blue-500 hover:underline">Contáctanos</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}