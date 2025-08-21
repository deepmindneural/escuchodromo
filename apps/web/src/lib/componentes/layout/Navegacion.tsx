'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaBars, FaTimes } from 'react-icons/fa';

export default function Navegacion() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const enlacesNavegacion = [
    { href: '/', label: 'Inicio' },
    { href: '/chat', label: 'Hablar con Escuchodromo' },
    { href: '/como-funciona', label: 'Cómo Funciona' },
    { href: '/servicios', label: 'Servicios' },
    { href: '/evaluaciones', label: 'Evaluaciones' },
    { href: '/precios', label: 'Precios' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white shadow-md py-3">
      <div className="container mx-auto px-4">
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
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {enlacesNavegacion.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={`px-2 xl:px-4 py-2 rounded-xl transition-all duration-200 font-medium text-xs xl:text-sm whitespace-nowrap ${
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
            <Link
              href="/contacto"
              className="px-2 xl:px-4 py-2 rounded-xl font-medium text-xs xl:text-sm transition-all duration-200 text-gray-700 hover:bg-teal-50 hover:text-teal-600"
            >
              Contacto
            </Link>
            <Link
              href="/iniciar-sesion"
              className="px-2 xl:px-4 py-2 rounded-xl font-medium text-xs xl:text-sm transition-all duration-200 text-gray-700 hover:bg-teal-50 hover:text-teal-600"
            >
              Acceder
            </Link>
            <Link href="/registrar">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 xl:px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xs xl:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Registrarse
              </motion.button>
            </Link>
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
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}