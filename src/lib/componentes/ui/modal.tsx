'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { clsx } from 'clsx';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: React.ReactNode;
  tamano?: 'sm' | 'md' | 'lg' | 'xl';
  centrado?: boolean;
  cerrarAlClickearFondo?: boolean;
}

const tamanos = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  tamano = 'md',
  centrado = true,
  cerrarAlClickearFondo = true
}: ModalProps) {
  // Cerrar con ESC
  React.useEffect(() => {
    if (!abierto) return;
    
    const manejarEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      }
    };

    document.addEventListener('keydown', manejarEsc);
    return () => document.removeEventListener('keydown', manejarEsc);
  }, [abierto, onCerrar]);

  // Prevenir scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [abierto]);

  const manejarClickFondo = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && cerrarAlClickearFondo) {
      onCerrar();
    }
  };

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={manejarClickFondo}
          />

          {/* Container */}
          <div className={clsx(
            'flex min-h-full',
            centrado ? 'items-center justify-center' : 'items-start justify-center pt-10',
            'p-4'
          )}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'relative bg-white rounded-2xl shadow-2xl w-full',
                tamanos[tamano]
              )}
            >
              {/* Header - Siempre visible para mostrar botón de cerrar */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                {titulo && (
                  <h2 className="text-xl font-semibold text-gray-900">
                    {titulo}
                  </h2>
                )}
                <button
                  onClick={onCerrar}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook para usar modales
export function useModal() {
  const [abierto, setAbierto] = React.useState(false);

  const abrir = () => setAbierto(true);
  const cerrar = () => setAbierto(false);
  const alternar = () => setAbierto(!abierto);

  return {
    abierto,
    abrir,
    cerrar,
    alternar
  };
}

// Componente de confirmación
interface ModalConfirmacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  titulo?: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: 'peligro' | 'advertencia' | 'info';
}

export function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'info'
}: ModalConfirmacionProps) {
  const estilosBoton = {
    peligro: 'bg-red-600 hover:bg-red-700 text-white',
    advertencia: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} tamano="sm">
      <div className="text-center">
        <p className="text-gray-700 mb-6">{mensaje}</p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {textoCancelar}
          </button>
          <button
            onClick={() => {
              onConfirmar();
              onCerrar();
            }}
            className={clsx(
              'px-4 py-2 rounded-lg transition-colors',
              estilosBoton[tipo]
            )}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
}