'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaEnvelope, FaBrain, FaCheckCircle, FaArrowLeft
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { resetearContrasena } from '../../lib/supabase/auth';

export default function PaginaRecuperarContrasena() {
  const [email, setEmail] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!email.trim()) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nuevosErrores.email = 'Email inválido';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setCargando(true);

    try {
      await resetearContrasena(email);
      setEnviado(true);
      toast.success('¡Email de recuperación enviado! Revisa tu bandeja de entrada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar el email');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Navegacion />
      <Toaster position="top-center" />

      <div className="flex min-h-screen pt-20">
        {/* Lado Izquierdo - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-cyan-700 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full"></div>
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-white rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-center h-full">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <FaBrain className="text-2xl" />
                </div>
                <h1 className="text-2xl font-bold">Escuchodromo</h1>
              </Link>

              <h2 className="text-4xl font-bold mb-6">
                No te preocupes, todos olvidamos
              </h2>
              <p className="text-xl text-white/90 mb-12">
                Recupera el acceso a tu cuenta en simples pasos
              </p>

              <div className="space-y-4">
                {[
                  'Ingresa tu correo electrónico',
                  'Recibirás un link de recuperación',
                  'Crea una nueva contraseña segura',
                  'Regresa a tu viaje de bienestar'
                ].map((paso, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-white/90">{paso}</span>
                  </motion.div>
                ))}
              </div>
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
              {!enviado ? (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Recuperar contraseña
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Ingresa tu email y te enviaremos un link para restablecer tu contraseña
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
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errores.email) {
                              setErrores({});
                            }
                          }}
                          className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                            errores.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="tu@email.com"
                          aria-describedby={errores.email ? 'email-error' : undefined}
                        />
                      </div>
                      {errores.email && (
                        <motion.p
                          id="email-error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2"
                          role="alert"
                          aria-live="polite"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{errores.email}</span>
                        </motion.p>
                      )}
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
                      aria-label="Enviar link de recuperación"
                    >
                      {cargando ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" aria-hidden="true"></div>
                          Enviando...
                        </div>
                      ) : (
                        'Enviar link de recuperación'
                      )}
                    </motion.button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="text-3xl text-green-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Email enviado!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Hemos enviado un link de recuperación a <strong>{email}</strong>
                  </p>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-teal-800">
                      <strong>¿No ves el email?</strong>
                    </p>
                    <ul className="text-sm text-teal-700 mt-2 space-y-1 list-disc list-inside">
                      <li>Revisa tu carpeta de spam</li>
                      <li>Verifica que el email sea correcto</li>
                      <li>El link expira en 60 minutos</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setEnviado(false);
                      setEmail('');
                    }}
                    className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    Enviar nuevamente
                  </button>
                </div>
              )}

              {/* Link para volver */}
              <div className="mt-6 text-center">
                <Link
                  href="/iniciar-sesion"
                  className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  <FaArrowLeft aria-hidden="true" />
                  Volver a iniciar sesión
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
