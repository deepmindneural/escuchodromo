/**
 * AdminCard - Componente de tarjeta estándar para el panel admin
 * Uso: Contenedor principal para secciones con padding y estilos unificados
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AdminCardProps {
  titulo?: string;
  children: ReactNode;
  icono?: ReactNode;
  acciones?: ReactNode;
  className?: string;
  animacion?: boolean;
  delay?: number;
}

export function AdminCard({
  titulo,
  children,
  icono,
  acciones,
  className = '',
  animacion = true,
  delay = 0,
}: AdminCardProps) {
  const contenido = (
    <Card className={`border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      {titulo && (
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {icono && <span className="text-teal-600">{icono}</span>}
              {titulo}
            </CardTitle>
            {acciones && <div className="flex items-center gap-2">{acciones}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={titulo ? 'p-6' : 'p-0'}>
        {children}
      </CardContent>
    </Card>
  );

  if (!animacion) return contenido;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      {contenido}
    </motion.div>
  );
}
