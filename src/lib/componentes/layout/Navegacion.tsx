'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useUsuario, usePerfilUsuario } from '../../supabase/hooks';
import { cerrarSesion } from '../../supabase/auth';

export default function Navegacion() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargando: cargandoAuth } = useUsuario();
  const { perfil } = usePerfilUsuario();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesion();
      router.push('/');
      setMenuMovilAbierto(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Enlaces diferentes según autenticación y rol
  const esProfesional = perfil?.rol === 'TERAPEUTA' || perfil?.rol === 'ADMIN';

  const enlacesNavegacion = usuario
    ? esProfesional
      ? [
          { href: '/profesional/dashboard', label: 'Dashboard' },
          { href: '/profesional/calendario', label: 'Calendario' },
          { href: '/profesional/disponibilidad', label: 'Horarios' },
          { href: '/chat', label: 'Chat' },
        ]
      : [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/profesionales', label: 'Profesionales' },
          { href: '/chat', label: 'Chat' },
          { href: '/evaluaciones', label: 'Evaluaciones' },
        ]
    : [
        { href: '/', label: 'Inicio' },
        { href: '/profesionales', label: 'Profesionales' },
        { href: '/chat', label: 'Chat IA' },
        { href: '/servicios', label: 'Servicios' },
        { href: '/precios', label: 'Precios' },
      ];

  return (
    <>
      {/* Skip Link para accesibilidad de teclado */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only"
      >
        Saltar al contenido principal
      </a>

      <nav className="fixed w-full z-50 bg-white shadow-md" role="navigation" aria-label="Navegación principal">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <FaHeart className="text-white text-xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full border-2 border-white animate-pulse"></div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Escuchodromo
              </h1>
              <p className="text-xs text-gray-600">
                Tu bienestar emocional
              </p>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            {enlacesNavegacion.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={`px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm whitespace-nowrap ${
                  pathname === enlace.href
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {enlace.label}
              </Link>
            ))}
          </div>

          {/* Botones de Usuario Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            {usuario ? (
              <>
                <Link
                  href="/perfil"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-teal-50"
                >
                  {/* Foto del usuario */}
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {perfil?.nombre?.charAt(0)?.toUpperCase() || usuario?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {/* Nombre del usuario */}
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-900">
                      {perfil?.nombre || usuario?.email?.split('@')[0] || 'Usuario'}
                    </span>
                    <span className="text-xs text-gray-500">Ver perfil</span>
                  </div>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCerrarSesion}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <FaSignOutAlt />
                  Salir
                </motion.button>
              </>
            ) : (
              <>
                <Link
                  href="/registrar-profesional"
                  className="px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-300 whitespace-nowrap"
                >
                  Soy Profesional
                </Link>
                <Link
                  href="/iniciar-sesion"
                  className="px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 text-gray-700 hover:bg-teal-50 hover:text-teal-600"
                >
                  Acceder
                </Link>
                <Link href="/registrar">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Registrarse
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <button
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {menuMovilAbierto ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Menú Móvil */}
      <AnimatePresence>
        {menuMovilAbierto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t shadow-xl"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-2">
                {enlacesNavegacion.map((enlace) => (
                  <Link
                    key={enlace.href}
                    href={enlace.href}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={`block px-6 py-4 rounded-xl transition-colors font-medium text-center ${
                      pathname === enlace.href
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
                    }`}
                  >
                    {enlace.label}
                  </Link>
                ))}

                <div className="border-t pt-4 space-y-2">
                  {usuario ? (
                    <>
                      {/* Perfil del usuario en móvil */}
                      <Link
                        href="/perfil"
                        onClick={() => setMenuMovilAbierto(false)}
                        className="flex items-center gap-4 px-6 py-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                          {perfil?.nombre?.charAt(0)?.toUpperCase() || usuario?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-gray-900">
                            {perfil?.nombre || usuario?.email?.split('@')[0] || 'Usuario'}
                          </p>
                          <p className="text-sm text-gray-600">Ver perfil</p>
                        </div>
                      </Link>
                      <button
                        onClick={handleCerrarSesion}
                        className="w-full text-center px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                      >
                        <FaSignOutAlt />
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/registrar-profesional"
                        onClick={() => setMenuMovilAbierto(false)}
                        className="block text-center px-6 py-4 bg-purple-50 text-purple-700 font-bold rounded-xl border-2 border-purple-300 hover:bg-purple-100 transition-colors"
                      >
                        Soy Profesional
                      </Link>
                      <Link
                        href="/contacto"
                        onClick={() => setMenuMovilAbierto(false)}
                        className="block text-center px-6 py-4 text-gray-700 font-medium rounded-xl hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        Contacto
                      </Link>
                      <Link
                        href="/iniciar-sesion"
                        onClick={() => setMenuMovilAbierto(false)}
                        className="block text-center px-6 py-4 text-gray-700 font-medium rounded-xl hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        Acceder
                      </Link>
                      <Link
                        href="/registrar"
                        onClick={() => setMenuMovilAbierto(false)}
                        className="block text-center px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg"
                      >
                        Registrarse
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}