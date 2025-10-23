/**
 * AdminPagination - Paginación unificada para tablas
 * Uso: Navegación entre páginas de datos
 */

import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminCard } from './AdminCard';

interface AdminPaginationProps {
  paginaActual: number;
  totalPaginas: number;
  total: number;
  limite: number;
  onCambiarPagina: (pagina: number) => void;
  tipo?: string; // 'usuarios', 'pagos', etc.
}

export function AdminPagination({
  paginaActual,
  totalPaginas,
  total,
  limite,
  onCambiarPagina,
  tipo = 'elementos',
}: AdminPaginationProps) {
  if (totalPaginas <= 1) return null;

  const inicio = (paginaActual - 1) * limite + 1;
  const fin = Math.min(paginaActual * limite, total);

  return (
    <AdminCard animacion={false} className="mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <p className="text-sm text-gray-600">
          Mostrando{' '}
          <span className="font-semibold text-gray-900">
            {inicio} - {fin}
          </span>{' '}
          de{' '}
          <span className="font-semibold text-gray-900">{total}</span>{' '}
          {tipo}
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
            <span className="text-sm font-semibold text-teal-900">
              Página {paginaActual} de {totalPaginas}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onCambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="gap-1"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}
