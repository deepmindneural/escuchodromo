/**
 * AdminFilters - Barra de filtros unificada
 * Uso: Filtros de búsqueda y selección en tablas
 */

import { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { AdminCard } from './AdminCard';

interface AdminFiltersProps {
  children: ReactNode;
  titulo?: string;
}

export function AdminFilters({ children, titulo = 'Filtros de búsqueda' }: AdminFiltersProps) {
  return (
    <AdminCard
      titulo={titulo}
      icono={<Search className="h-5 w-5" />}
      className="mb-6"
      delay={0.2}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </AdminCard>
  );
}
