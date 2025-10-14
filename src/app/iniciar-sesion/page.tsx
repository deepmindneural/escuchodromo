'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaEnvelope, FaLock, FaGoogle, FaFacebook, FaGithub,
  FaEye, FaEyeSlash, FaBrain, FaCheckCircle
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import { ImageWithFallback } from '../../lib/componentes/ui/image-with-fallback';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import { iniciarSesion } from '../../lib/supabase/auth';

export default function PaginaIniciarSesion() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    contrasena: ''
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nuevosErrores.email = 'Email inválido';
    }
    
    if (!formData.contrasena) {
      nuevosErrores.contrasena = 'La contraseña es requerida';
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setCargando(true);

    try {
      await iniciarSesion({
        email: formData.email,
        password: formData.contrasena,
      });

      toast.success('¡Bienvenido de vuelta!');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const beneficios = [
    'Acceso 24/7 a tu terapeuta de IA',
    'Historial completo de conversaciones',
    'Evaluaciones psicológicas ilimitadas',
    'Seguimiento de tu progreso emocional'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Navegacion />
      <Toaster position="top-center" />
      
      <div className="flex min-h-screen pt-20">
        {/* Lado Izquierdo - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-cyan-700 p-12 text-white relative overflow-hidden">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full"></div>
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-white rounded-full"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <FaBrain className="text-2xl" />
                </div>
                <h1 className="text-2xl font-bold">Escuchodromo</h1>
              </Link>
              
              <h2 className="text-4xl font-bold mb-6">
                Tu bienestar emocional nos importa
              </h2>
              <p className="text-xl text-white/90 mb-12">
                Continúa tu viaje hacia una vida más equilibrada y feliz
              </p>
              
              <div className="space-y-4">
                {beneficios.map((beneficio, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <FaCheckCircle className="text-green-400 text-xl flex-shrink-0" />
                    <span className="text-white/90">{beneficio}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="mt-12">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <ImageWithFallback
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 10}`}
                      alt="Usuario"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      fallbackColor="from-teal-100 to-cyan-100"
                    />
                  ))}
                </div>
                <p className="text-white/90">
                  +50,000 usuarios activos
                </p>
              </div>
              <p className="text-white/70 text-sm">
                "Escuchodromo cambió mi vida. Ahora tengo las herramientas para manejar mi ansiedad."
                <br />
                <span className="font-semibold">- María G.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Formulario */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo móvil */}
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <FaBrain className="text-2xl text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Escuchodromo</h1>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Bienvenido de vuelta!
              </h2>
              <p className="text-gray-600 mb-8">
                ¿No tienes cuenta? {' '}
                <Link href="/registrar" className="text-teal-600 hover:text-teal-700 font-medium">
                  Regístrate gratis
                </Link>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                        errores.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errores.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600"
                    >
                      {errores.email}
                    </motion.p>
                  )}
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      id="contrasena"
                      name="contrasena"
                      type={mostrarContrasena ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.contrasena}
                      onChange={handleChange}
                      className={`pl-10 pr-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                        errores.contrasena ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarContrasena(!mostrarContrasena)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {mostrarContrasena ? (
                        <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FaEye className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errores.contrasena && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600"
                    >
                      {errores.contrasena}
                    </motion.p>
                  )}
                </div>

                {/* Opciones adicionales */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Recordarme
                    </span>
                  </label>
                  
                  <Link href="/recuperar-contrasena" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Botón de submit */}
                <motion.button
                  type="submit"
                  disabled={cargando}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 px-4 text-white font-medium rounded-lg shadow-lg transition-all duration-200 ${
                    cargando
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:shadow-xl'
                  }`}
                >
                  {cargando ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Iniciando sesión...
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </motion.button>
              </form>

              {/* Separador */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>

              {/* Botones sociales */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <FaGoogle className="text-red-500 text-xl" />
                  <span className="font-medium text-gray-700">Continuar con Google</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <FaFacebook className="text-teal-600 text-xl" />
                  <span className="font-medium text-gray-700">Continuar con Facebook</span>
                </motion.button>
              </div>

              {/* Credenciales de prueba */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-teal-700 font-medium mb-2">
                  Credenciales de prueba:
                </p>
                <div className="space-y-1 text-sm text-teal-600">
                  <p>Usuario: usuario@escuchodromo.com / 123456</p>
                  <p>Admin: admin@escuchodromo.com / 123456</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}