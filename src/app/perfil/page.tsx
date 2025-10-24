'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt,
  FaArrowLeft, FaEdit, FaSave, FaTimes, FaEye, FaEyeSlash,
  FaShieldAlt, FaLanguage, FaSignOutAlt, FaCrown, FaCheckCircle,
  FaExclamationTriangle, FaSpinner, FaCreditCard, FaPlus, FaTrash
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface PerfilUsuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: string;
  genero?: string;
  idioma_preferido: string;
  rol: string;
  creado_en: string;
}

interface Suscripcion {
  id: string;
  plan: string;
  estado: string;
  precio: number;
  moneda: string;
  periodo: string;
  fecha_fin: string;
}

interface Pago {
  id: string;
  monto: number;
  moneda: string;
  estado: string;
  creado_en: string;
}

interface MetodoPago {
  id: string;
  tipo: 'tarjeta' | 'paypal';
  ultimos_digitos?: string;
  marca?: string;
  nombre_titular: string;
  fecha_expiracion?: string;
  es_predeterminado: boolean;
}

export default function PaginaPerfil() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarCambiarContrasena, setMostrarCambiarContrasena] = useState(false);
  const [mostrarHistorialPagos, setMostrarHistorialPagos] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
    idioma_preferido: 'es'
  });
  const [cambioContrasena, setCambioContrasena] = useState({
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const [mostrarContrasenas, setMostrarContrasenas] = useState({
    nueva: false,
    confirmar: false
  });
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [mostrarAgregarMetodo, setMostrarAgregarMetodo] = useState(false);

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

      await cargarPerfil();
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      // Obtener datos del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('Usuario')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (usuarioError) throw usuarioError;

      setUsuario(usuarioData);
      setFormData({
        nombre: usuarioData.nombre || '',
        telefono: usuarioData.telefono || '',
        fecha_nacimiento: usuarioData.fecha_nacimiento?.split('T')[0] || '',
        genero: usuarioData.genero || '',
        idioma_preferido: usuarioData.idioma_preferido || 'es'
      });

      // Obtener suscripción activa usando RPC (evita error 406)
      const { data: suscripcionArray } = await supabase
        .rpc('obtener_suscripcion_usuario');

      const suscripcionData = suscripcionArray && suscripcionArray.length > 0 ? suscripcionArray[0] : null;

      if (suscripcionData) {
        setSuscripcion(suscripcionData as any);
      }

      // Obtener historial de pagos
      const { data: pagosData } = await supabase
        .from('Pago')
        .select('*')
        .eq('usuario_id', usuarioData.id)
        .order('creado_en', { ascending: false })
        .limit(10);

      if (pagosData) {
        setHistorialPagos(pagosData);
      }

      // Cargar métodos de pago (mock data por ahora)
      // TODO: Implementar integración con Stripe/PayPal cuando las API keys estén configuradas
      setMetodosPago([
        {
          id: '1',
          tipo: 'tarjeta',
          marca: 'Visa',
          ultimos_digitos: '4242',
          nombre_titular: usuarioData.nombre,
          fecha_expiracion: '12/25',
          es_predeterminado: true
        }
      ]);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !usuario) return;

      const { error } = await supabase
        .from('Usuario')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          genero: formData.genero || null,
          idioma_preferido: formData.idioma_preferido
        })
        .eq('id', usuario.id);

      if (error) throw error;

      // Recargar perfil
      await cargarPerfil();
      setEditando(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cambioContrasena.nuevaContrasena !== cambioContrasena.confirmarContrasena) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (cambioContrasena.nuevaContrasena.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: cambioContrasena.nuevaContrasena
      });

      if (error) throw error;

      toast.success('Contraseña actualizada correctamente');
      setMostrarCambiarContrasena(false);
      setCambioContrasena({ nuevaContrasena: '', confirmarContrasena: '' });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    }
  };

  const handleCerrarSesion = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sesión cerrada correctamente');
      router.push('/');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleCancelarSuscripcion = async () => {
    if (!suscripcion) return;

    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Mantendrás acceso hasta el final del período actual.')) {
      return;
    }

    try {
      setGuardando(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión expirada');
        router.push('/iniciar-sesion');
        return;
      }

      // Llamar a la función de Supabase para cancelar
      const { data, error } = await supabase.functions.invoke('gestionar-suscripcion', {
        body: { accion: 'cancelar' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        // Si la función de Supabase no está disponible, actualizar directamente en la BD
        // Esto es un fallback mientras se configuran las Edge Functions
        const { error: updateError } = await supabase
          .from('Suscripcion')
          .update({ cancelar_al_final: true, estado: 'cancelada' })
          .eq('id', suscripcion.id);

        if (updateError) throw updateError;
      }

      toast.success('Suscripción cancelada. Mantendrás acceso hasta ' +
        new Date(suscripcion.fecha_fin).toLocaleDateString('es-CO'));

      // Recargar perfil
      await cargarPerfil();
    } catch (error: any) {
      console.error('Error al cancelar suscripción:', error);
      toast.error(error.message || 'No se pudo cancelar la suscripción');
    } finally {
      setGuardando(false);
    }
  };

  const handleReactivarSuscripcion = async () => {
    if (!suscripcion) return;

    try {
      setGuardando(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión expirada');
        router.push('/iniciar-sesion');
        return;
      }

      // Llamar a la función de Supabase para reactivar
      const { data, error } = await supabase.functions.invoke('gestionar-suscripcion', {
        body: { accion: 'reactivar' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        // Si la función de Supabase no está disponible, actualizar directamente en la BD
        // Esto es un fallback mientras se configuran las Edge Functions
        const { error: updateError } = await supabase
          .from('Suscripcion')
          .update({ cancelar_al_final: false, estado: 'activa' })
          .eq('id', suscripcion.id);

        if (updateError) throw updateError;
      }

      toast.success('¡Suscripción reactivada exitosamente!');

      // Recargar perfil
      await cargarPerfil();
    } catch (error: any) {
      console.error('Error al reactivar suscripción:', error);
      toast.error(error.message || 'No se pudo reactivar la suscripción');
    } finally {
      setGuardando(false);
    }
  };

  const handleEstablecerPredeterminado = async (metodoId: string) => {
    try {
      // TODO: Implementar llamada al backend para actualizar método predeterminado
      setMetodosPago(prev => prev.map(metodo => ({
        ...metodo,
        es_predeterminado: metodo.id === metodoId
      })));
      toast.success('Método de pago predeterminado actualizado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar método de pago');
    }
  };

  const handleEliminarMetodo = async (metodoId: string) => {
    try {
      // TODO: Implementar llamada al backend para eliminar método de pago
      setMetodosPago(prev => prev.filter(metodo => metodo.id !== metodoId));
      toast.success('Método de pago eliminado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar método de pago');
    }
  };

  const handleAgregarMetodo = () => {
    // TODO: Implementar integración con Stripe Elements o PayPal
    toast('Esta funcionalidad se habilitará cuando se configure Stripe/PayPal', {
      icon: 'ℹ️',
    });
    setMostrarAgregarMetodo(false);
  };

  const formatearPrecio = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  const obtenerColorMarca = (marca?: string) => {
    switch (marca?.toLowerCase()) {
      case 'visa':
        return 'from-blue-500 to-blue-700';
      case 'mastercard':
        return 'from-red-500 to-orange-600';
      case 'amex':
      case 'american express':
        return 'from-cyan-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="h-16 w-16 text-teal-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Error al cargar el perfil</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Toaster position="top-center" />
      <Navegacion />

      <div className="pt-28 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaArrowLeft className="text-teal-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
                <p className="text-gray-600 text-lg">Gestiona tu información y suscripción</p>
              </div>
            </div>

            {!editando && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditando(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaEdit className="inline mr-2" />
                Editar Perfil
              </motion.button>
            )}
          </div>

          {/* Suscripción Activa o CTA */}
          {suscripcion ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 mb-8 border-2 border-blue-200"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <FaCrown className="text-4xl text-yellow-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {suscripcion.plan === 'premium' ? 'Plan Premium' :
                       suscripcion.plan === 'profesional' ? 'Plan Profesional' :
                       'Plan Básico'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Estado: <span className={`font-medium ${suscripcion.estado === 'activa' ? 'text-green-600' : 'text-orange-600'}`}>
                        {suscripcion.estado === 'activa' ? 'Activa' : 'Cancelada'}
                      </span> • Renovación: {new Date(suscripcion.fecha_fin).toLocaleDateString('es-CO')}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatearPrecio(suscripcion.precio, suscripcion.moneda)}
                      <span className="text-sm font-normal text-gray-600">/{suscripcion.periodo === 'mensual' ? 'mes' : 'año'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  {suscripcion.estado === 'activa' && !suscripcion.cancelar_al_final && (
                    <>
                      <Link href="/precios" className="w-full sm:w-auto">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full px-6 py-2 bg-blue-500 text-white font-medium rounded-lg shadow hover:bg-blue-600"
                        >
                          Cambiar Plan
                        </motion.button>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancelarSuscripcion}
                        disabled={guardando}
                        className="w-full px-6 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        {guardando ? 'Cancelando...' : 'Cancelar Suscripción'}
                      </motion.button>
                    </>
                  )}
                  {suscripcion.cancelar_al_final && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReactivarSuscripcion}
                      disabled={guardando}
                      className="w-full px-6 py-2 bg-green-500 text-white font-medium rounded-lg shadow hover:bg-green-600 disabled:opacity-50"
                    >
                      {guardando ? 'Reactivando...' : 'Reactivar Suscripción'}
                    </motion.button>
                  )}
                  <Link href="/suscripcion" className="w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-2 bg-white text-gray-700 font-medium rounded-lg shadow hover:shadow-md border border-gray-200"
                    >
                      Ver Detalles
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl shadow-xl p-8 mb-8 border-2 border-teal-200 text-center"
            >
              <FaCrown className="text-5xl text-teal-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Desbloquea todo el potencial de Escuchodromo
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Accede a evaluaciones ilimitadas, chat 24/7 con IA, análisis de voz emocional y mucho más.
              </p>
              <Link href="/precios">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl text-lg"
                >
                  Ver Planes y Precios
                </motion.button>
              </Link>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Info del usuario */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Foto de perfil */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-5xl text-white font-bold shadow-lg">
                    {usuario.nombre?.charAt(0)?.toUpperCase() || <FaUser className="text-4xl" />}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <FaCheckCircle className="text-white text-sm" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{usuario.nombre}</h3>
                <p className="text-gray-600 mb-4">{usuario.email}</p>
                <div className="flex items-center justify-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                  <FaShieldAlt />
                  {usuario.rol}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Miembro desde</p>
                  <p className="font-medium text-gray-900">
                    {new Date(usuario.creado_en).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCerrarSesion}
                  className="mt-6 w-full px-4 py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                  <FaSignOutAlt className="inline mr-2" />
                  Cerrar Sesión
                </motion.button>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Información Personal */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
                  {editando && (
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditando(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                      >
                        <FaTimes className="inline mr-2" />
                        Cancelar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGuardarPerfil}
                        disabled={guardando}
                        className="px-4 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50"
                      >
                        <FaSave className="inline mr-2" />
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </motion.button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleGuardarPerfil} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaUser className="inline mr-2" />
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaEnvelope className="inline mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={usuario.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaPhone className="inline mr-2" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="+57 300 000 0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCalendarAlt className="inline mr-2" />
                        Fecha de nacimiento
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Género
                      </label>
                      <select
                        value={formData.genero}
                        onChange={(e) => setFormData(prev => ({ ...prev, genero: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Seleccionar</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                        <option value="prefiero_no_decir">Prefiero no decir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaLanguage className="inline mr-2" />
                        Idioma preferido
                      </label>
                      <select
                        value={formData.idioma_preferido}
                        onChange={(e) => setFormData(prev => ({ ...prev, idioma_preferido: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              {/* Historial de Pagos */}
              {historialPagos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Historial de Pagos</h2>
                    <button
                      onClick={() => setMostrarHistorialPagos(!mostrarHistorialPagos)}
                      className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                      {mostrarHistorialPagos ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>

                  {mostrarHistorialPagos && (
                    <div className="space-y-4">
                      {historialPagos.map((pago) => (
                        <div key={pago.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatearPrecio(pago.monto, pago.moneda)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(pago.creado_en).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            pago.estado === 'completado'
                              ? 'bg-green-100 text-green-700'
                              : pago.estado === 'pendiente'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {pago.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Seguridad */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Seguridad</h2>

                <div className="space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMostrarCambiarContrasena(!mostrarCambiarContrasena)}
                    className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <FaShieldAlt className="text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Cambiar contraseña</h4>
                        <p className="text-sm text-gray-600">Actualiza tu contraseña para mantener tu cuenta segura</p>
                      </div>
                    </div>
                  </motion.button>

                  {mostrarCambiarContrasena && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <form onSubmit={handleCambiarContrasena} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nueva contraseña
                          </label>
                          <div className="relative">
                            <input
                              type={mostrarContrasenas.nueva ? 'text' : 'password'}
                              value={cambioContrasena.nuevaContrasena}
                              onChange={(e) => setCambioContrasena(prev => ({ ...prev, nuevaContrasena: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setMostrarContrasenas(prev => ({ ...prev, nueva: !prev.nueva }))}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {mostrarContrasenas.nueva ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar nueva contraseña
                          </label>
                          <div className="relative">
                            <input
                              type={mostrarContrasenas.confirmar ? 'text' : 'password'}
                              value={cambioContrasena.confirmarContrasena}
                              onChange={(e) => setCambioContrasena(prev => ({ ...prev, confirmarContrasena: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setMostrarContrasenas(prev => ({ ...prev, confirmar: !prev.confirmar }))}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {mostrarContrasenas.confirmar ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMostrarCambiarContrasena(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                          >
                            Cancelar
                          </motion.button>
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-4 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600"
                          >
                            Actualizar Contraseña
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
