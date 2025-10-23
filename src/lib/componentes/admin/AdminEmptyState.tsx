/**
 * AdminEmptyState - Estado vacío unificado para tablas y listas
 * Uso: Cuando no hay datos que mostrar en una sección
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Search, FileQuestion, Database } from 'lucide-react';

interface AdminEmptyStateProps {
  tipo?: 'busqueda' | 'datos' | 'filtros';
  titulo?: string;
  descripcion?: string;
  accion?: {
    texto: string;
    onClick: () => void;
    icono?: ReactNode;
  };
  icono?: ReactNode;
}

export function AdminEmptyState({
  tipo = 'datos',
  titulo,
  descripcion,
  accion,
  icono,
}: AdminEmptyStateProps) {
  const obtenerContenidoPorTipo = () => {
    switch (tipo) {
      case 'busqueda':
        return {
          icono: icono || <Search className="h-16 w-16 text-gray-300" />,
          titulo: titulo || 'No se encontraron resultados',
          descripcion: descripcion || 'Intenta ajustar los términos de búsqueda o filtros',
        };
      case 'filtros':
        return {
          icono: icono || <FileQuestion className="h-16 w-16 text-gray-300" />,
          titulo: titulo || 'No hay datos con estos filtros',
          descripcion: descripcion || 'Intenta cambiar o limpiar los filtros aplicados',
        };
      case 'datos':
      default:
        return {
          icono: icono || <Database className="h-16 w-16 text-gray-300" />,
          titulo: titulo || 'No hay datos disponibles',
          descripcion: descripcion || 'Aún no se han registrado elementos en esta sección',
        };
    }
  };

  const contenido = obtenerContenidoPorTipo();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {contenido.icono}
      </motion.div>

      <h3 className="mt-6 text-lg font-semibold text-gray-900">
        {contenido.titulo}
      </h3>

      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        {contenido.descripcion}
      </p>

      {accion && (
        <Button
          variant="outline"
          onClick={accion.onClick}
          className="mt-6 gap-2"
        >
          {accion.icono}
          {accion.texto}
        </Button>
      )}
    </motion.div>
  );
}
