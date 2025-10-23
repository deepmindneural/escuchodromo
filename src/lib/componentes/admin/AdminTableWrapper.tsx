/**
 * AdminTableWrapper - Wrapper estándar para tablas con estilos unificados
 * Uso: Envuelve el componente Table de shadcn/ui con estilos consistentes
 */

import { ReactNode } from 'react';
import { AdminCard } from './AdminCard';
import { AdminEmptyState } from './AdminEmptyState';

interface AdminTableWrapperProps {
  titulo?: string;
  icono?: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  cargando?: boolean;
  vacio?: boolean;
  emptyStateProps?: React.ComponentProps<typeof AdminEmptyState>;
  className?: string;
}

export function AdminTableWrapper({
  titulo,
  icono,
  acciones,
  children,
  cargando = false,
  vacio = false,
  emptyStateProps,
  className = '',
}: AdminTableWrapperProps) {
  return (
    <AdminCard
      titulo={titulo}
      icono={icono}
      acciones={acciones}
      className={className}
      animacion={false}
    >
      <div className="overflow-x-auto">
        {vacio && !cargando ? (
          <AdminEmptyState {...emptyStateProps} />
        ) : (
          children
        )}
      </div>
    </AdminCard>
  );
}
