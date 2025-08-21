'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

interface ConnectionStatusProps {
  showWhenOnline?: boolean;
}

export function ConnectionStatus({ showWhenOnline = false }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('http://localhost:3333/api', {
          method: 'GET',
          timeout: 5000,
        } as any);
        
        setApiStatus(response.ok ? 'online' : 'offline');
      } catch (error) {
        setApiStatus('offline');
      }
    };

    if (isOnline) {
      checkApiStatus();
      const interval = setInterval(checkApiStatus, 30000); // Verificar cada 30 segundos
      return () => clearInterval(interval);
    } else {
      setApiStatus('offline');
    }
  }, [isOnline]);

  const shouldShow = !isOnline || apiStatus === 'offline' || (showWhenOnline && isOnline && apiStatus === 'online');

  if (!shouldShow) return null;

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: FaWifi,
        message: 'Sin conexión a internet',
        bgColor: 'bg-red-500',
        textColor: 'text-white',
      };
    }
    
    if (apiStatus === 'offline') {
      return {
        icon: FaExclamationTriangle,
        message: 'Servidor no disponible',
        bgColor: 'bg-orange-500',
        textColor: 'text-white',
      };
    }
    
    if (apiStatus === 'checking') {
      return {
        icon: FaWifi,
        message: 'Verificando conexión...',
        bgColor: 'bg-yellow-500',
        textColor: 'text-white',
      };
    }
    
    return {
      icon: FaCheckCircle,
      message: 'Conectado',
      bgColor: 'bg-teal-500',
      textColor: 'text-white',
    };
  };

  const { icon: Icon, message, bgColor, textColor } = getStatusInfo();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className={`${bgColor} ${textColor} px-4 py-2 rounded-lg shadow-lg flex items-center gap-2`}>
          <Icon className="text-sm" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}