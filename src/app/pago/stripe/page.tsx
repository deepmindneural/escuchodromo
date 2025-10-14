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
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    expiracion: '',
    cvv: '',
    nombre: ''
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
    const moneda = 'COP';
    
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

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aceptaTerminos) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    setProcesando(true);

    try {
      // Simular validación de tarjeta
      if (!datosTarjeta.numero || datosTarjeta.numero.length < 16) {
        throw new Error('Número de tarjeta inválido');
      }
      if (!datosTarjeta.cvv || datosTarjeta.cvv.length < 3) {
        throw new Error('CVV inválido');
      }
      if (!datosTarjeta.expiracion) {
        throw new Error('Fecha de expiración requerida');
      }

      // Simular procesamiento de pago con Stripe
      await new Promise(resolve => setTimeout(resolve, 3000));

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/pagos/stripe/procesar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan?.id,
          datosTarjeta: {
            numero: datosTarjeta.numero.replace(/\s/g, ''),
            expiracion: datosTarjeta.expiracion,
            cvv: datosTarjeta.cvv,
            nombre: datosTarjeta.nombre
          },
          datosFacturacion,
          moneda: plan?.moneda
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('¡Pago procesado exitosamente!');
        
        // Redirigir a página de confirmación
        setTimeout(() => {
          router.push(`/pago/confirmacion?transaccion=${data.transaccionId}`);
        }, 1500);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  const formatearNumeroTarjeta = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatearExpiracion = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
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

                {/* Información de pago */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <FaCreditCard className="text-blue-600 text-xl" />
                    <h3 className="text-2xl font-bold text-gray-900">Información de Pago</h3>
                    <FaLock className="text-gray-500" />
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de tarjeta *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={datosTarjeta.numero}
                        onChange={(e) => setDatosTarjeta(prev => ({ ...prev, numero: formatearNumeroTarjeta(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre en la tarjeta *
                      </label>
                      <input
                        type="text"
                        required
                        value={datosTarjeta.nombre}
                        onChange={(e) => setDatosTarjeta(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Juan Pérez"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          MM/AA *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={datosTarjeta.expiracion}
                          onChange={(e) => setDatosTarjeta(prev => ({ ...prev, expiracion: formatearExpiracion(e.target.value) }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="12/28"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={datosTarjeta.cvv}
                          onChange={(e) => setDatosTarjeta(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123"
                        />
                      </div>
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
                      Pagar {plan.precio.toLocaleString()} {plan.moneda}
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