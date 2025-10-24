/**
 * Sistema de Componentes Admin Unificado
 *
 * Exporta todos los componentes base para el panel de administración
 * Uso: import { AdminCard, AdminStatCard, ... } from '@/lib/componentes/admin';
 */

export { AdminCard } from './AdminCard';
export { AdminStatCard } from './AdminStatCard';
export { AdminHeader } from './AdminHeader';
export { AdminEmptyState } from './AdminEmptyState';
export { AdminTableWrapper } from './AdminTableWrapper';
export { AdminLoadingState } from './AdminLoadingState';
export { AdminPagination } from './AdminPagination';
export { AdminFilters } from './AdminFilters';

// Componentes existentes
export { default as AlertasCriticas } from './AlertasCriticas';
export { default as ModalAprobar } from './ModalAprobar';
export { default as VisorDocumento } from './VisorDocumento';
export { ModalUsuario } from './ModalUsuario';
