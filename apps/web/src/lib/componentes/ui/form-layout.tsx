'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaHeart } from 'react-icons/fa';
import { ImageWithFallback } from './image-with-fallback';

interface FormLayoutProps {
  children: React.ReactNode;
  titulo: string;
  subtitulo?: string;
  linkTexto?: string;
  linkHref?: string;
  linkLabel?: string;
  beneficios?: string[];
  imagenFondo?: string;
  mostrarLogo?: boolean;
}

export function FormLayout({
  children,
  titulo,
  subtitulo,
  linkTexto,
  linkHref,
  linkLabel,
  beneficios,
  imagenFondo,
  mostrarLogo = true,
}: FormLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="flex min-h-screen">
        {/* Lado Izquierdo - Información (solo desktop) */}
        {beneficios && (
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 to-cyan-600 p-12 text-white relative overflow-hidden">
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full"></div>
              <div className="absolute bottom-0 -right-4 w-96 h-96 bg-white rounded-full"></div>
              {imagenFondo && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${imagenFondo})` }}
                />
              )}
            </div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                {mostrarLogo && (
                  <Link href="/" className="flex items-center gap-3 mb-12">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <FaHeart className="text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold">Escuchodromo</h1>
                  </Link>
                )}
                
                <h2 className="text-4xl font-bold mb-6">
                  Tu bienestar emocional es nuestra prioridad
                </h2>
                <p className="text-xl text-white/90 mb-12">
                  Únete a miles de personas que han encontrado apoyo y herramientas para una vida más equilibrada
                </p>
                
                <div className="space-y-4">
                  {beneficios.map((beneficio, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
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
                        src={`https://i.pravatar.cc/40?img=${i + 15}`}
                        alt="Usuario satisfecho"
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
                  "Escuchodromo me ayudó a encontrar equilibrio emocional y herramientas prácticas para mi día a día."
                  <br />
                  <span className="font-semibold">- Usuario verificado</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lado Derecho - Formulario */}
        <div className={`${beneficios ? 'flex-1' : 'w-full'} flex items-center justify-center p-8`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            {/* Logo móvil */}
            {mostrarLogo && (
              <div className="lg:hidden mb-8 text-center">
                <Link href="/" className="inline-flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <FaHeart className="text-2xl text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Escuchodromo</h1>
                </Link>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {titulo}
                </h2>
                {subtitulo && (
                  <p className="text-gray-600">
                    {subtitulo}
                  </p>
                )}
                {linkTexto && linkHref && (
                  <p className="text-gray-600 mt-2">
                    {linkTexto}{' '}
                    <Link href={linkHref} className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                      {linkLabel}
                    </Link>
                  </p>
                )}
              </div>

              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}