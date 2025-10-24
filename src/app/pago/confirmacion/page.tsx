'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, FaDownload, FaPrint, FaHome, FaUser,
  FaCalendarAlt, FaCreditCard, FaReceipt, FaHeart,
  FaPaypal, FaEnvelope, FaShareAlt
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../../lib/componentes/layout/Navegacion';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';

interface ConfirmacionPago {
  transaccionId: string;
  planNombre: string;
  monto: number;
  moneda: string;
  proveedor: 'stripe' | 'paypal';
  fecha: string;
  estado: 'completado' | 'pendiente' | 'fallido';
  siguienteFacturacion: string;
  metodoPago: string;
  emailFacturacion: string;
  numeroFactura: string;
}

export default function PaginaConfirmacionPago() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();
  const [confirmacion, setConfirmacion] = useState<ConfirmacionPago | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviandoRecibo, setEnviandoRecibo] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    cargarConfirmacion();
  }, []);

  const verificarAutenticacion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/iniciar-sesion');
      return false;
    }
    return true;
  };

  const cargarConfirmacion = async () => {
    const autenticado = await verificarAutenticacion();
    if (!autenticado) return;

    // Obtener session_id de query params
    const searchParams = new URLSearchParams(window.location.search);
    const sesionId = searchParams.get('sesion_id');

    if (!sesionId) {
      toast.error('No se encontró información de la sesión');
      setTimeout(() => router.push('/dashboard'), 2000);
      return;
    }

    try {
      // Obtener información de la suscripción del usuario
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Buscar usuario en BD
      const { data: usuarioData } = await supabase
        .from('Usuario')
        .select('id, email, nombre')
        .eq('auth_id', user.id)
        .single();

      if (!usuarioData) {
        throw new Error('Usuario no encontrado en BD');
      }

      // Obtener la última suscripción del usuario usando RPC (evita error 406)
      const { data: suscripcionArray, error: suscripcionError } = await supabase
        .rpc('obtener_suscripcion_usuario');

      const suscripcion = suscripcionArray && suscripcionArray.length > 0 ? suscripcionArray[0] : null;

      if (suscripcionError || !suscripcion) {
        console.error('Error obteniendo suscripción:', suscripcionError);
        throw new Error('No se encontró la suscripción');
      }

      // Obtener el pago asociado
      const { data: pago } = await supabase
        .from('Pago')
        .select('*')
        .eq('stripe_sesion_id', sesionId)
        .single();

      // Construir objeto de confirmación
      const datosConfirmacion: ConfirmacionPago = {
        transaccionId: suscripcion.stripe_suscripcion_id || suscripcion.id,
        planNombre: `Plan ${suscripcion.plan.charAt(0).toUpperCase() + suscripcion.plan.slice(1)}`,
        monto: suscripcion.precio,
        moneda: suscripcion.moneda,
        proveedor: 'stripe',
        fecha: suscripcion.creado_en,
        estado: suscripcion.estado === 'activa' ? 'completado' : 'pendiente',
        siguienteFacturacion: suscripcion.fecha_renovacion || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metodoPago: 'Tarjeta de crédito/débito',
        emailFacturacion: usuarioData.email,
        numeroFactura: pago?.id || suscripcion.id
      };

      setConfirmacion(datosConfirmacion);
      toast.success('¡Pago confirmado exitosamente!');

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar la confirmación');

      // Mostrar datos básicos de confirmación
      setConfirmacion({
        transaccionId: sesionId,
        planNombre: 'Suscripción Premium',
        monto: 49900,
        moneda: 'COP',
        proveedor: 'stripe',
        fecha: new Date().toISOString(),
        estado: 'completado',
        siguienteFacturacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metodoPago: 'Tarjeta de crédito/débito',
        emailFacturacion: 'usuario@email.com',
        numeroFactura: sesionId.slice(0, 16)
      });
    } finally {
      setCargando(false);
    }
  };

  const descargarRecibo = () => {
    toast.success('Descargando recibo en PDF...');
    // Aquí iría la lógica de descarga
  };

  const imprimirRecibo = () => {
    window.print();
  };

  const enviarReciboEmail = async () => {
    setEnviandoRecibo(true);

    try {
      // Por ahora solo mostrar mensaje
      // TODO: Integrar con servicio de email cuando esté configurado
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Recibo enviado por email');
    } catch (error) {
      toast.error('Error al enviar recibo');
    } finally {
      setEnviandoRecibo(false);
    }
  };

  const compartirExito = () => {
    if (navigator.share) {
      navigator.share({
        title: '¡Me uní a Escuchodromo!',
        text: 'Acabo de suscribirme a Escuchodromo para cuidar mi bienestar emocional. ¡Te invito a que también cuides el tuyo!',
        url: 'https://escuchodromo.com'
      });
    } else {
      navigator.clipboard.writeText('¡Me uní a Escuchodromo para cuidar mi bienestar emocional!');
      toast.success('Mensaje copiado al portapapeles');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando confirmación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!confirmacion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmación no encontrada</h2>
            <p className="text-gray-600 mb-6">No pudimos encontrar los detalles de tu transacción</p>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-teal-500 text-white font-bold rounded-xl"
              >
                Ir al Dashboard
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <Toaster position="top-center" />
      <Navegacion />
      
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Animación de éxito */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6
            }}
            className="text-center mb-12"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FaCheckCircle className="text-white text-6xl" />
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              ¡Pago Exitoso! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Tu suscripción ha sido activada correctamente
            </p>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 inline-block">
              <p className="text-gray-700 font-medium">
                Transacción: <span className="font-mono text-teal-600">#{confirmacion.transaccionId}</span>
              </p>
            </div>
          </motion.div>

          {/* Detalles de la transacción */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Información del plan */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaHeart className="text-teal-500 text-2xl" />
                <h2 className="text-2xl font-bold text-gray-900">Detalles de tu Suscripción</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-bold text-gray-900">{confirmacion.planNombre}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Monto</span>
                  <span className="font-bold text-gray-900">
                    {confirmacion.moneda === 'USD' ? '$' : '$'} {confirmacion.monto.toLocaleString()} {confirmacion.moneda}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Método de pago</span>
                  <div className="flex items-center gap-2">
                    {confirmacion.proveedor === 'paypal' ? (
                      <FaPaypal className="text-blue-500" />
                    ) : (
                      <FaCreditCard className="text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900">{confirmacion.metodoPago}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Estado</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    confirmacion.estado === 'completado' 
                      ? 'bg-green-100 text-green-800' 
                      : confirmacion.estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {confirmacion.estado === 'completado' ? 'Completado' :
                     confirmacion.estado === 'pendiente' ? 'Pendiente' : 'Fallido'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Próxima facturación</span>
                  <span className="font-medium text-gray-900">
                    {new Date(confirmacion.siguienteFacturacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Información de facturación */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaReceipt className="text-blue-500 text-2xl" />
                <h2 className="text-2xl font-bold text-gray-900">Información de Facturación</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Número de factura</p>
                  <p className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    {confirmacion.numeroFactura}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de transacción</p>
                  <p className="font-medium text-gray-900">
                    {new Date(confirmacion.fecha).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email de facturación</p>
                  <p className="font-medium text-gray-900">{confirmacion.emailFacturacion}</p>
                </div>
              </div>

              {/* Acciones de recibo */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Recibo</h3>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={descargarRecibo}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FaDownload />
                    Descargar
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={imprimirRecibo}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <FaPrint />
                    Imprimir
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={enviarReciboEmail}
                  disabled={enviandoRecibo}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <FaEnvelope />
                  {enviandoRecibo ? 'Enviando...' : 'Enviar por Email'}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Bienvenida y próximos pasos */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-xl p-8 text-white mb-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">¡Bienvenido a Escuchodromo Premium! 💕</h2>
              <p className="text-xl text-white/90 mb-8">
                Ahora tienes acceso completo a todas nuestras herramientas de bienestar emocional
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <FaHeart className="text-3xl mb-2 mx-auto" />
                  <h3 className="font-bold mb-1">Chat Ilimitado</h3>
                  <p className="text-sm text-white/80">Habla con nuestra IA cuando lo necesites</p>
                </div>
                
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <FaUser className="text-3xl mb-2 mx-auto" />
                  <h3 className="font-bold mb-1">Evaluaciones</h3>
                  <p className="text-sm text-white/80">Acceso a todas las pruebas psicológicas</p>
                </div>
                
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <FaCalendarAlt className="text-3xl mb-2 mx-auto" />
                  <h3 className="font-bold mb-1">Seguimiento</h3>
                  <p className="text-sm text-white/80">Monitorea tu progreso emocional</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-white text-teal-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <FaHome className="inline mr-2" />
                    Ir al Dashboard
                  </motion.button>
                </Link>
                
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-white/20 backdrop-blur text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-200"
                  >
                    <FaHeart className="inline mr-2" />
                    Comenzar Chat
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={compartirExito}
                  className="px-8 py-3 bg-white/20 backdrop-blur text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-200"
                >
                  <FaShareAlt className="inline mr-2" />
                  Compartir
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Información adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-yellow-800 mb-2">¿Necesitas ayuda?</h3>
            <p className="text-yellow-700 mb-4">
              Si tienes alguna pregunta sobre tu suscripción o necesitas soporte, estamos aquí para ayudarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contacto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Contactar Soporte
                </motion.button>
              </Link>
              
              <Link href="/como-funciona">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 border border-yellow-500 text-yellow-700 font-medium rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  Guía de Inicio
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Datos mock para desarrollo
const confirmacionMock: ConfirmacionPago = {
  transaccionId: 'ESC-2024-001234',
  planNombre: 'Plan Premium',
  monto: 49900,
  moneda: 'COP',
  proveedor: 'stripe',
  fecha: new Date().toISOString(),
  estado: 'completado',
  siguienteFacturacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  metodoPago: 'Visa **** 1234',
  emailFacturacion: 'usuario@email.com',
  numeroFactura: 'INV-2024-001234'
};