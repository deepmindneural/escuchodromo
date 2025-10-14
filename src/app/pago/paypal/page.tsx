'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaPaypal, FaShieldAlt, FaCheckCircle, 
  FaSpinner, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../../lib/componentes/layout/Navegacion';

interface PlanSuscripcion {
  id: string;
  nombre: string;
  precio: number;
  moneda: string;
  periodo: string;
  caracteristicas: string[];
}

export default function PaginaPagoPayPal() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanSuscripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [datosFacturacion, setDatosFacturacion] = useState({
    nombre: '',
    email: '',
    telefono: '',
    pais: 'CO'
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    cargarPlan();
  }, []);

  const verificarAutenticacion = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarPlan = async () => {
    // Simular plan para el ejemplo
    const planId = 'basico';
    const moneda = 'USD';
    
    if (!planId) {
      router.push('/precios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3333/api/suscripciones/plan/${planId}?moneda=${moneda}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      } else {
        // Usar datos mock para desarrollo
        setPlan(planMock);
      }
    } catch (error) {
      console.error('Error:', error);
      setPlan(planMock);
    } finally {
      setCargando(false);
    }
  };

  const procesarPagoPayPal = async () => {
    if (!aceptaTerminos) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    if (!datosFacturacion.nombre || !datosFacturacion.email) {
      toast.error('Completa los datos de facturación');
      return;
    }

    setProcesando(true);

    try {
      const token = localStorage.getItem('token');
      
      // Crear orden de PayPal
      const response = await fetch('http://localhost:3333/api/pagos/paypal/crear-orden', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan?.id,
          datosFacturacion,
          moneda: plan?.moneda,
          returnUrl: `${window.location.origin}/pago/paypal/return`,
          cancelUrl: `${window.location.origin}/pago/paypal/cancel`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.approvalUrl) {
          // Redirigir a PayPal para aprobación
          window.location.href = data.approvalUrl;
        } else {
          throw new Error('No se pudo obtener la URL de aprobación de PayPal');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la orden de PayPal');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar con PayPal');
      setProcesando(false);
    }
  };

  // Simular integración con PayPal SDK
  const inicializarPayPalSDK = () => {
    // En producción, aquí se cargaría el SDK de PayPal
    toast('Redirigiendo a PayPal...', { icon: 'ℹ️' });
    
    setTimeout(() => {
      // Simular redirect a PayPal
      const paypalUrl = `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-MOCK${Date.now()}`;
      
      // En lugar de redireccionar realmente, mostrar mensaje
      toast.success('Simulación: Serías redirigido a PayPal para completar el pago');
      setProcesando(false);
      
      // Simular retorno exitoso después de 3 segundos
      setTimeout(() => {
        router.push(`/pago/confirmacion?transaccion=PAYPAL-MOCK-${Date.now()}&proveedor=paypal`);
      }, 3000);
    }, 2000);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <Toaster position="top-center" />
      <Navegacion />
      
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Pago con PayPal</h1>
              <p className="text-gray-600 text-lg">Paga de forma segura con tu cuenta PayPal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información del plan */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Resumen del Pedido</h3>
                
                <div className="border border-gray-200 rounded-xl p-6 mb-6">
                  <h4 className="text-xl font-bold text-blue-600 mb-2">{plan.nombre}</h4>
                  <p className="text-gray-600 mb-4">Suscripción {plan.periodo}</p>
                  
                  <div className="space-y-2 mb-4">
                    {plan.caracteristicas.map((caracteristica, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <FaCheckCircle className="text-green-500" />
                        <span>{caracteristica}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-2xl font-bold text-gray-900">
                      <span>Total:</span>
                      <span>
                        {plan.moneda === 'USD' ? '$' : '$'} {plan.precio.toLocaleString()} {plan.moneda}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Facturado {plan.periodo}</p>
                  </div>
                </div>

                {/* Información sobre PayPal */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaPaypal className="text-blue-600 text-xl" />
                    <h4 className="font-semibold text-blue-800">¿Por qué PayPal?</h4>
                  </div>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• No compartimos tu información financiera</li>
                    <li>• Protección al comprador incluida</li>
                    <li>• Pago en un solo clic</li>
                    <li>• Acepta tarjetas y cuentas bancarias</li>
                  </ul>
                </div>

                {/* Seguridad */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaShieldAlt className="text-green-600" />
                    <h4 className="font-semibold text-green-800">Pago 100% Seguro</h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    PayPal protege tu información con encriptación de grado bancario
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Información de Facturación</h3>
                
                <div className="space-y-6">
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
                    <p className="text-xs text-gray-500 mt-1">
                      Debe coincidir con tu email de PayPal
                    </p>
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
                      placeholder="+1 555 000 0000"
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
                      <option value="AR">Argentina</option>
                      <option value="CL">Chile</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Términos */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
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

              {/* Información adicional */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-yellow-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">¿Qué sucede después?</h4>
                    <p className="text-yellow-700 text-sm">
                      Serás redirigido a PayPal para completar el pago de forma segura. 
                      Una vez confirmado, tu suscripción se activará inmediatamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de PayPal */}
              <motion.button
                onClick={procesarPagoPayPal}
                disabled={procesando || !aceptaTerminos}
                whileHover={{ scale: procesando ? 1 : 1.02 }}
                whileTap={{ scale: procesando ? 1 : 0.98 }}
                className={`w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-200 ${
                  procesando || !aceptaTerminos
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl'
                }`}
              >
                {procesando ? (
                  <div className="flex items-center justify-center gap-3">
                    <FaSpinner className="animate-spin" />
                    Conectando con PayPal...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FaPaypal className="text-xl" />
                    Continuar con PayPal
                  </div>
                )}
              </motion.button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Al hacer clic, serás redirigido a PayPal para completar tu compra de forma segura
              </p>
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
  precio: 19.99,
  moneda: 'USD',
  periodo: 'mensual',
  caracteristicas: [
    'Chat ilimitado con IA',
    'Evaluaciones psicológicas ilimitadas',
    'Sesiones de voz con IA',
    'Reportes detallados',
    'Soporte prioritario'
  ]
};