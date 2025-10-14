'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaHeart } from 'react-icons/fa';
import { clsx } from 'clsx';

interface LoadingProps {
  tipo?: 'spinner' | 'puntos' | 'corazon' | 'ondas';
  tamano?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  mensaje?: string;
  centrado?: boolean;
}

const tamanos = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

const colores = {
  primary: 'text-blue-600',
  secondary: 'text-purple-600',
  white: 'text-white',
};

// Spinner rotando
function SpinnerLoader({ tamano, color }: Pick<LoadingProps, 'tamano' | 'color'>) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={clsx(tamanos[tamano!], colores[color!])}
    >
      <FaSpinner />
    </motion.div>
  );
}

// Puntos saltando
function PuntosLoader({ color }: Pick<LoadingProps, 'color'>) {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: ['0%', '-100%', '0%'],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
          className={clsx(
            'w-2 h-2 rounded-full',
            color === 'white' ? 'bg-white' : 
            color === 'secondary' ? 'bg-purple-600' : 'bg-blue-600'
          )}
        />
      ))}
    </div>
  );
}

// Corazón pulsante
function CorazonLoader({ tamano, color }: Pick<LoadingProps, 'tamano' | 'color'>) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={clsx(tamanos[tamano!], colores[color!])}
    >
      <FaHeart />
    </motion.div>
  );
}

// Ondas expandiéndose
function OndasLoader({ color }: Pick<LoadingProps, 'color'>) {
  return (
    <div className="relative">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [0, 2],
            opacity: [1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeOut'
          }}
          className={clsx(
            'absolute inset-0 rounded-full border-2',
            color === 'white' ? 'border-white' :
            color === 'secondary' ? 'border-purple-600' : 'border-blue-600'
          )}
          style={{
            width: '20px',
            height: '20px',
            left: '50%',
            top: '50%',
            marginLeft: '-10px',
            marginTop: '-10px'
          }}
        />
      ))}
      <div
        className={clsx(
          'w-2 h-2 rounded-full relative z-10',
          color === 'white' ? 'bg-white' :
          color === 'secondary' ? 'bg-purple-600' : 'bg-blue-600'
        )}
      />
    </div>
  );
}

export function Loading({
  tipo = 'spinner',
  tamano = 'md',
  color = 'primary',
  mensaje,
  centrado = true
}: LoadingProps) {
  const renderLoader = () => {
    switch (tipo) {
      case 'puntos':
        return <PuntosLoader color={color} />;
      case 'corazon':
        return <CorazonLoader tamano={tamano} color={color} />;
      case 'ondas':
        return <OndasLoader color={color} />;
      default:
        return <SpinnerLoader tamano={tamano} color={color} />;
    }
  };

  const contenido = (
    <div className="flex flex-col items-center gap-3">
      {renderLoader()}
      {mensaje && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={clsx(
            'text-sm font-medium',
            color === 'white' ? 'text-white' : 'text-gray-600'
          )}
        >
          {mensaje}
        </motion.p>
      )}
    </div>
  );

  if (centrado) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {contenido}
      </div>
    );
  }

  return contenido;
}

// Loading de pantalla completa
export function LoadingPantallaCompleta({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <Loading tipo="corazon" tamano="lg" mensaje={mensaje} centrado={false} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Escuchodromo</h1>
          <p className="text-gray-600">Tu bienestar emocional es nuestra prioridad</p>
        </motion.div>
      </div>
    </div>
  );
}

// Loading para botones
export function LoadingBoton({ activo = false }: { activo?: boolean }) {
  if (!activo) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center"
    >
      <Loading tipo="spinner" tamano="sm" color="white" centrado={false} />
      <span className="ml-2">Cargando...</span>
    </motion.div>
  );
}

// Hook para estados de loading
export function useLoading(inicialEstado = false) {
  const [cargando, setCargando] = React.useState(inicialEstado);

  const iniciarCarga = () => setCargando(true);
  const detenerCarga = () => setCargando(false);
  const alternarCarga = () => setCargando(!cargando);

  return {
    cargando,
    iniciarCarga,
    detenerCarga,
    alternarCarga
  };
}