/**
 * Sistema de colores terapéuticos para el Admin Dashboard
 * Basado en psicología del color para plataformas de salud mental
 */

export const PALETA_ADMIN = {
  // Colores principales terapéuticos
  calma: {
    50: '#F0FDFA',
    100: '#E8F4F8',
    200: '#CCFBF1',
    300: '#99F6E4',
    500: '#5B9EAD',
    600: '#0D9488',
    700: '#0F766E',
  },
  esperanza: {
    50: '#F7FEF0',
    100: '#F0F9E8',
    500: '#7FB069',
    600: '#65A850',
    700: '#4C8E3C',
  },
  calidez: {
    50: '#FFFBEB',
    100: '#FFF4E6',
    500: '#FFB84D',
    600: '#F59E0B',
  },
  serenidad: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    500: '#9F7AEA',
    600: '#8B5CF6',
  },
  alerta: {
    50: '#FEF3E2',
    100: '#FEF3E2',
    500: '#F6AD55',
    600: '#F59E0B',
  },

  // Colores específicos para planes
  planes: {
    basico: {
      primary: '#3B82F6',
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
    },
    premium: {
      primary: '#8B5CF6',
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800',
    },
    profesional: {
      primary: '#F59E0B',
      gradient: 'from-amber-400 via-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800',
    },
  },

  // Estados
  estados: {
    activo: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      dot: 'bg-green-500',
    },
    inactivo: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
      dot: 'bg-gray-400',
    },
    pausado: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      dot: 'bg-yellow-500',
    },
  },
} as const;

/**
 * Obtiene la paleta de colores para un plan específico
 */
export function obtenerColoresPlan(codigo: 'basico' | 'premium' | 'profesional') {
  return PALETA_ADMIN.planes[codigo];
}

/**
 * Obtiene los colores de estado
 */
export function obtenerColoresEstado(activo: boolean) {
  return activo ? PALETA_ADMIN.estados.activo : PALETA_ADMIN.estados.inactivo;
}
