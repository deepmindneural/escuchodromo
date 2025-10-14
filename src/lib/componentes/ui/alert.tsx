'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { clsx } from 'clsx';

interface AlertProps {
  tipo: 'exito' | 'error' | 'advertencia' | 'info';
  titulo?: string;
  mensaje: string;
  mostrar: boolean;
  onCerrar?: () => void;
  duracion?: number; // en segundos, 0 = no cerrar automáticamente
}

const iconos = {
  exito: FaCheckCircle,
  error: FaTimes,
  advertencia: FaExclamationTriangle,
  info: FaInfoCircle,
};

const estilos = {
  exito: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  advertencia: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const estilosIcono = {
  exito: 'text-green-600',
  error: 'text-red-600',
  advertencia: 'text-yellow-600',
  info: 'text-blue-600',
};

export function Alert({
  tipo,
  titulo,
  mensaje,
  mostrar,
  onCerrar,
  duracion = 5
}: AlertProps) {
  const [visible, setVisible] = React.useState(mostrar);
  const Icono = iconos[tipo];

  React.useEffect(() => {
    setVisible(mostrar);
  }, [mostrar]);

  React.useEffect(() => {
    if (visible && duracion > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onCerrar?.(), 300); // Esperar animación
      }, duracion * 1000);

      return () => clearTimeout(timer);
    }
  }, [visible, duracion, onCerrar]);

  const cerrarAlert = () => {
    setVisible(false);
    setTimeout(() => onCerrar?.(), 300);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
    >
      <div className={clsx(
        'border rounded-lg p-4 shadow-lg backdrop-blur-sm',
        estilos[tipo]
      )}>
        <div className="flex items-start gap-3">
          <Icono className={clsx('text-xl mt-0.5 flex-shrink-0', estilosIcono[tipo])} />
          
          <div className="flex-1">
            {titulo && (
              <h4 className="font-semibold mb-1">{titulo}</h4>
            )}
            <p className="text-sm">{mensaje}</p>
          </div>
          
          {onCerrar && (
            <button
              onClick={cerrarAlert}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hook para usar alerts
export function useAlert() {
  const [alerts, setAlerts] = React.useState<Array<AlertProps & { id: string }>>([]);

  const mostrarAlert = (props: Omit<AlertProps, 'mostrar' | 'onCerrar'>) => {
    const id = Date.now().toString();
    const nuevaAlert = {
      ...props,
      id,
      mostrar: true,
      onCerrar: () => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
      }
    };
    
    setAlerts(prev => [...prev, nuevaAlert]);
  };

  const cerrarAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return {
    alerts,
    mostrarAlert,
    cerrarAlert,
    exito: (mensaje: string, titulo?: string) => 
      mostrarAlert({ tipo: 'exito', mensaje, titulo }),
    error: (mensaje: string, titulo?: string) => 
      mostrarAlert({ tipo: 'error', mensaje, titulo }),
    advertencia: (mensaje: string, titulo?: string) => 
      mostrarAlert({ tipo: 'advertencia', mensaje, titulo }),
    info: (mensaje: string, titulo?: string) => 
      mostrarAlert({ tipo: 'info', mensaje, titulo }),
  };
}

// Contenedor para renderizar múltiples alerts
export function AlertContainer() {
  const { alerts } = useAlert();

  return (
    <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
      <div className="space-y-2 p-4">
        {alerts.map((alert) => (
          <Alert key={alert.id} {...alert} />
        ))}
      </div>
    </div>
  );
}