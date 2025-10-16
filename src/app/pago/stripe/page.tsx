'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaCreditCard, FaShieldAlt, FaCheckCircle, 
  FaSpinner, FaExclamationTriangle, FaLock
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../../lib/componentes/layout/Navegacion';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';

interface PlanSuscripcion {
  id: string;
  nombre: string;
  precio: number;
  moneda: string;
  periodo: string;
  caracteristicas: string[];
}

export default function PaginaPagoStripe() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();
  const [plan, setPlan] = useState<PlanSuscripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [datosFacturacion, setDatosFacturacion] = useState({
    nombre: '',
    email: '',
    telefono: '',
    pais: 'CO',
    ciudad: '',
    direccion: '',
    codigoPostal: ''
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    cargarPlan();
  }, []);

  const verificarAutenticacion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarPlan = async () => {
    // Obtener plan de query params o usar default
    const searchParams = new URLSearchParams(window.location.search);
    const planId = searchParams.get('plan') || 'premium';
    const periodo = searchParams.get('periodo') || 'mensual';

    // Usar datos del plan
    const planesDisponibles: Record<string, PlanSuscripcion> = {
      premium_mensual: {
        id: 'premium',
        nombre: 'Plan Premium',
        precio: 49900,
        moneda: 'COP',
        periodo: 'mensual',
        caracteristicas: [
          'Chat ilimitado con IA',
          'Evaluaciones psicológicas ilimitadas',
          'Sesiones de voz con IA',
          'Reportes detallados',
          'Soporte prioritario'
        ]
      },
      premium_anual: {
        id: 'premium',
        nombre: 'Plan Premium',
        precio: 479000,
        moneda: 'COP',
        periodo: 'anual',
        caracteristicas: [
          'Chat ilimitado con IA',
          'Evaluaciones psicológicas ilimitadas',
          'Sesiones de voz con IA',
          'Reportes detallados',
          'Soporte prioritario',
          '20% de descuento'
        ]
      },
      profesional_mensual: {
        id: 'profesional',
        nombre: 'Plan Profesional',
        precio: 99900,
        moneda: 'COP',
        periodo: 'mensual',
        caracteristicas: [
          'Todo del plan Premium',
          'Dashboard para pacientes (50)',
          'Integración con consulta',
          'Reportes profesionales',
          'API personalizada',
          'Soporte dedicado 24/7'
        ]
      },
      profesional_anual: {
        id: 'profesional',
        nombre: 'Plan Profesional',
        precio: 959000,
        moneda: 'COP',
        periodo: 'anual',
        caracteristicas: [
          'Todo del plan Premium',
          'Dashboard para pacientes (50)',
          'Integración con consulta',
          'Reportes profesionales',
          'API personalizada',
          'Soporte dedicado 24/7',
          '20% de descuento'
        ]
      }
    };

    const planKey = `${planId}_${periodo}` as keyof typeof planesDisponibles;
    const planSeleccionado = planesDisponibles[planKey];

    if (planSeleccionado) {
      setPlan(planSeleccionado);
    } else {
      router.push('/precios');
    }

    setCargando(false);
  };

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aceptaTerminos) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    if (!plan) {
      toast.error('No se ha seleccionado un plan');
      return;
    }

    // Validar datos de facturación
    if (!datosFacturacion.nombre || !datosFacturacion.email || !datosFacturacion.ciudad || !datosFacturacion.direccion) {
      toast.error('Por favor completa todos los campos de facturación');
      return;
    }

    setProcesando(true);

    try {
      // Obtener sesión de autenticación
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión no válida. Por favor inicia sesión nuevamente.');
        router.push('/iniciar-sesion');
        return;
      }

      // Llamar al Edge Function para crear sesión de Stripe
      const { data, error } = await supabase.functions.invoke('crear-checkout-stripe', {
        body: {
          plan: plan.id,
          periodo: plan.periodo,
          moneda: plan.moneda
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error al crear checkout:', error);
        throw new Error(error.message || 'Error al iniciar proceso de pago');
      }

      if (data.redirect_url) {
        // Plan gratuito - redirigir directamente
        toast.success(data.message);
        setTimeout(() => {
          router.push(data.redirect_url);
        }, 1000);
        return;
      }

      if (!data.checkout_url) {
        throw new Error('No se recibió URL de checkout');
      }

      // Redirigir a Stripe Checkout
      toast.success('Redirigiendo a pago seguro...');
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pago');
      setProcesando(false);
    }
  };


  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan no encontrado</h2>
            <p className="text-gray-600 mb-6">No pudimos cargar la información del plan seleccionado</p>
            <Link href="/precios">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl"
              >
                Volver a Precios
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster position="top-center" />
      <Navegacion />
      
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/suscripcion">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaArrowLeft className="text-blue-600" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Procesamiento de Pago</h1>
              <p className="text-gray-600 text-lg">Completa tu suscripción de forma segura</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Resumen del plan */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Resumen del Pedido</h3>
                
                <div className="border border-gray-200 rounded-xl p-6 mb-6">
                  <h4 className="text-xl font-bold text-blue-600 mb-2">{plan.nombre}</h4>
                  <p className="text-gray-600 mb-4">Suscripción {plan.periodo}</p>
                  
                  <div className="space-y-2 mb-4">
                    {plan.caracteristicas.slice(0, 3).map((caracteristica, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <FaCheckCircle className="text-green-500" />
                        <span>{caracteristica}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-2xl font-bold text-gray-900">
                      <span>Total:</span>
                      <span>{plan.precio.toLocaleString()} {plan.moneda}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Facturado {plan.periodo}</p>
                  </div>
                </div>

                {/* Seguridad */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaShieldAlt className="text-green-600" />
                    <h4 className="font-semibold text-green-800">Pago 100% Seguro</h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Procesado por Stripe con encriptación SSL de 256 bits
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario de pago */}
            <div className="lg:col-span-2">
              <form onSubmit={procesarPago} className="space-y-8">
                {/* Información de facturación */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Información de Facturación</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={datosFacturacion.nombre}
                        onChange={(e) => setDatosFacturacion(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Juan Pérez"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={datosFacturacion.email}
                        onChange={(e) => setDatosFacturacion(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="juan@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={datosFacturacion.telefono}
                        onChange={(e) => setDatosFacturacion(prev => ({ ...prev, telefono: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+57 300 000 0000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        País *
                      </label>
                      <select
                        required
                        value={datosFacturacion.pais}
                        onChange={(e) => setDatosFacturacion(prev => ({ ...prev, pais: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="CO">Colombia</option>
                        <option value="MX">México</option>
                        <option value="US">Estados Unidos</option>
                        <option value="ES">España</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        required
                        value={datosFacturacion.ciudad}
                        onChange={(e) => setDatosFacturacion(prev => ({ ...prev, ciudad: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bogotá"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={datosFacturacion.codigoPostal}
                        onChange={(e) => setDatosFacturacion(prev => ({ ...prev, codigoPostal: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="110111"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      required
                      value={datosFacturacion.direccion}
                      onChange={(e) => setDatosFacturacion(prev => ({ ...prev, direccion: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Calle 123 #45-67"
                    />
                  </div>
                </div>

                {/* Nota sobre procesamiento seguro */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <FaShieldAlt className="text-blue-600 text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Pago 100% Seguro con Stripe</h4>
                      <p className="text-blue-800 text-sm mb-3">
                        Al hacer clic en "Continuar al Pago", serás redirigido a Stripe,
                        nuestro procesador de pagos seguro y certificado PCI DSS Level 1.
                      </p>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-600" />
                          No almacenamos datos de tarjetas
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-600" />
                          Encriptación SSL de 256 bits
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-600" />
                          Cumplimiento total con PCI DSS
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Términos y condiciones */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terminos"
                      checked={aceptaTerminos}
                      onChange={(e) => setAceptaTerminos(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <label htmlFor="terminos" className="text-gray-700">
                      Acepto los{' '}
                      <Link href="/terminos" className="text-blue-600 hover:text-blue-700 font-medium">
                        términos y condiciones
                      </Link>{' '}
                      y la{' '}
                      <Link href="/privacidad" className="text-blue-600 hover:text-blue-700 font-medium">
                        política de privacidad
                      </Link>
                      . Autorizo el cobro recurrente según el plan seleccionado.
                    </label>
                  </div>
                </div>

                {/* Botón de pago */}
                <motion.button
                  type="submit"
                  disabled={procesando || !aceptaTerminos}
                  whileHover={{ scale: procesando ? 1 : 1.02 }}
                  whileTap={{ scale: procesando ? 1 : 0.98 }}
                  className={`w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-200 ${
                    procesando || !aceptaTerminos
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl'
                  }`}
                >
                  {procesando ? (
                    <div className="flex items-center justify-center gap-3">
                      <FaSpinner className="animate-spin" />
                      Procesando pago...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <FaLock />
                      Continuar al Pago Seguro
                    </div>
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Datos mock para desarrollo
const planMock: PlanSuscripcion = {
  id: 'premium',
  nombre: 'Plan Premium',
  precio: 49900,
  moneda: 'COP',
  periodo: 'mensual',
  caracteristicas: [
    'Chat ilimitado con IA',
    'Evaluaciones psicológicas ilimitadas',
    'Sesiones de voz con IA',
    'Reportes detallados',
    'Soporte prioritario'
  ]
};