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

      // Obtener suscripción activa
      const { data: suscripcionData } = await supabase
        .from('Suscripcion')
        .select('*')
        .eq('usuario_id', usuarioData.id)
        .in('estado', ['activa', 'cancelada'])
        .order('creado_en', { ascending: false })
        .limit(1)
        .single();

      if (suscripcionData) {
        setSuscripcion(suscripcionData);
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
    toast.info('Esta funcionalidad se habilitará cuando se configure Stripe/PayPal');
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

          {/* Suscripción Activa */}
          {suscripcion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 mb-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FaCrown className="text-4xl text-yellow-500" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {suscripcion.plan === 'premium' ? 'Plan Premium' : 'Plan Profesional'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Estado: <span className={`font-medium ${suscripcion.estado === 'activa' ? 'text-green-600' : 'text-orange-600'}`}>
                        {suscripcion.estado === 'activa' ? 'Activa' : 'Cancelada'}
                      </span> • Renovación: {new Date(suscripcion.fecha_fin).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
                <Link href="/suscripcion">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg shadow hover:shadow-md"
                  >
                    Gestionar Suscripción
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Info del usuario */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-white font-bold">
                  {usuario.nombre?.charAt(0)?.toUpperCase() || <FaUser />}
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
