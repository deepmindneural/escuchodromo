'use client';

import Link from 'next/link';
import { FaHeart, FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
                <FaHeart className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold">Escuchodromo</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Tu compañero de bienestar emocional. Cuidamos de ti con inteligencia artificial y empatía humana.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-teal-500 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <FaTwitter />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-teal-500 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <FaFacebook />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-teal-500 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <FaInstagram />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-teal-500 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <FaLinkedin />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-teal-400">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Cómo Funciona
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/evaluaciones" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Evaluaciones
                </Link>
              </li>
              <li>
                <Link href="/precios" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-teal-400">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/chat" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Chat con IA
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/ayuda" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-teal-400">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaEnvelope className="text-teal-400 mt-1 flex-shrink-0" />
                <a href="mailto:hola@escuchodromo.com" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  hola@escuchodromo.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FaPhone className="text-teal-400 mt-1 flex-shrink-0" />
                <a href="tel:+573001234567" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  +57 300 123 4567
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-teal-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  Bogotá, Colombia
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {anioActual} Escuchodromo. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Hecho con</span>
              <FaHeart className="text-red-500 animate-pulse" />
              <span>para tu bienestar</span>
            </div>
          </div>
        </div>

        {/* Aviso importante */}
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <p className="text-yellow-200 text-xs text-center">
            ⚠️ <strong>Aviso importante:</strong> Escuchodromo es una herramienta de apoyo emocional y no sustituye el tratamiento profesional de salud mental.
            Si estás en crisis o necesitas ayuda inmediata, contacta a un profesional o llama a la línea de prevención del suicidio: 106 (Colombia).
          </p>
        </div>
      </div>
    </footer>
  );
}
