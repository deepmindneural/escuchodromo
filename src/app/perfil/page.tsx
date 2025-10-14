'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaGlobe,
  FaArrowLeft, FaEdit, FaSave, FaTimes, FaEye, FaEyeSlash,
  FaShieldAlt, FaBell, FaLanguage, FaMoneyBillWave, FaClock,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';

interface PerfilUsuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  genero?: string;
  idiomaPreferido: string;
  moneda: string;
  zonaHoraria: string;
  consentimientoDatos: boolean;
  consentimientoMkt: boolean;
  imagen?: string;
  creadoEn: string;
  rol: string;
}

export default function PaginaPerfil() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarCambiarContrasena, setMostrarCambiarContrasena] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
    idiomaPreferido: 'es',
    moneda: 'COP',
    zonaHoraria: 'America/Bogota',
    consentimientoDatos: false,
    consentimientoMkt: false
  });
  const [cambioContrasena, setCambioContrasena] = useState({
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const [mostrarContrasenas, setMostrarContrasenas] = useState({
    actual: false,
    nueva: false,
    confirmar: false
  });

  useEffect(() => {
    verificarAutenticacion();
    cargarPerfil();
  }, []);

  const verificarAutenticacion = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarPerfil = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/usuarios/perfil', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data);
        setFormData({
          nombre: data.nombre || '',
          telefono: data.perfil?.telefono || '',
          fechaNacimiento: data.perfil?.fechaNacimiento?.split('T')[0] || '',
          genero: data.perfil?.genero || '',
          idiomaPreferido: data.perfil?.idiomaPreferido || 'es',
          moneda: data.perfil?.moneda || 'COP',
          zonaHoraria: data.perfil?.zonaHoraria || 'America/Bogota',
          consentimientoDatos: data.perfil?.consentimientoDatos || false,
          consentimientoMkt: data.perfil?.consentimientoMkt || false
        });
      } else {
        throw new Error('Error al cargar perfil');
      }
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/usuarios/perfil', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data);
        setEditando(false);
        toast.success('Perfil actualizado correctamente');
      } else {
        throw new Error('Error al actualizar perfil');
      }
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/usuarios/cambiar-contrasena', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contrasenaActual: cambioContrasena.contrasenaActual,
          nuevaContrasena: cambioContrasena.nuevaContrasena,
        }),
      });

      if (response.ok) {
        toast.success('Contraseña actualizada correctamente');
        setMostrarCambiarContrasena(false);
        setCambioContrasena({ contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
    }
  };

  const handleEliminarCuenta = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3333/api/usuarios/eliminar-cuenta', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          localStorage.removeItem('token');
          toast.success('Cuenta eliminada correctamente');
          router.push('/');
        } else {
          throw new Error('Error al eliminar cuenta');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al eliminar la cuenta');
      }
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
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
        <div className="max-w-4xl mx-auto">
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
                <p className="text-gray-600 text-lg">Gestiona tu información personal</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Info del usuario */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-white font-bold">
                  {usuario.imagen ? (
                    <img src={usuario.imagen} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    usuario.nombre?.charAt(0)?.toUpperCase() || <FaUser />
                  )}
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
                    {new Date(usuario.creadoEn).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                </div>
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
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
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
                        value={formData.idiomaPreferido}
                        onChange={(e) => setFormData(prev => ({ ...prev, idiomaPreferido: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaMoneyBillWave className="inline mr-2" />
                        Moneda
                      </label>
                      <select
                        value={formData.moneda}
                        onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="COP">Peso Colombiano (COP)</option>
                        <option value="USD">Dólar Americano (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline mr-2" />
                        Zona horaria
                      </label>
                      <select
                        value={formData.zonaHoraria}
                        onChange={(e) => setFormData(prev => ({ ...prev, zonaHoraria: e.target.value }))}
                        disabled={!editando}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="America/Bogota">Bogotá (UTC-5)</option>
                        <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
                        <option value="America/New_York">Nueva York (UTC-5)</option>
                        <option value="Europe/Madrid">Madrid (UTC+1)</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              {/* Privacidad y Consentimientos */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacidad y Consentimientos</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FaShieldAlt className="text-teal-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Consentimiento de datos</h4>
                        <p className="text-sm text-gray-600">Permitir el procesamiento de datos personales</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.consentimientoDatos ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : (
                        <FaExclamationTriangle className="text-yellow-500" />
                      )}
                      <input
                        type="checkbox"
                        checked={formData.consentimientoDatos}
                        onChange={(e) => setFormData(prev => ({ ...prev, consentimientoDatos: e.target.checked }))}
                        disabled={!editando}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FaBell className="text-purple-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Marketing</h4>
                        <p className="text-sm text-gray-600">Recibir comunicaciones promocionales</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.consentimientoMkt}
                      onChange={(e) => setFormData(prev => ({ ...prev, consentimientoMkt: e.target.checked }))}
                      disabled={!editando}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

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
                            Contraseña actual
                          </label>
                          <div className="relative">
                            <input
                              type={mostrarContrasenas.actual ? 'text' : 'password'}
                              value={cambioContrasena.contrasenaActual}
                              onChange={(e) => setCambioContrasena(prev => ({ ...prev, contrasenaActual: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setMostrarContrasenas(prev => ({ ...prev, actual: !prev.actual }))}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {mostrarContrasenas.actual ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

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

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEliminarCuenta}
                    className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-left hover:bg-red-100 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <FaExclamationTriangle className="text-red-600" />
                      <div>
                        <h4 className="font-medium text-red-900">Eliminar cuenta</h4>
                        <p className="text-sm text-red-600">Esta acción no se puede deshacer</p>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}