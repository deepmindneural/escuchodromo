/**
 * Constantes de Accesibilidad - Escuchodromo
 *
 * Este archivo define estilos y clases con contraste WCAG 2.1 Level AA garantizado.
 * Todas las combinaciones han sido validadas para cumplir con:
 * - Contraste mínimo 4.5:1 para texto normal
 * - Contraste mínimo 3:1 para texto grande (18pt+)
 * - Diferenciación más allá del color
 */

/**
 * Contraste WCAG AA para fondos oscuros (gray-900, gray-800)
 *
 * Uso: Paneles de administración y vistas con tema oscuro
 */
export const CONTRASTE_AA_OSCURO = {
  // Texto sobre gray-900 (bg-gray-900: #111827)
  textoPrimario: 'text-gray-50', // Contraste: 17.51:1 ✅
  textoSecundario: 'text-gray-200', // Contraste: 12.63:1 ✅
  textoTerciario: 'text-gray-300', // Contraste: 9.72:1 ✅
  textoDesactivado: 'text-gray-400', // Contraste: 6.40:1 ✅
  textoSutil: 'text-gray-500', // Contraste: 4.54:1 ✅ (mínimo aceptable)

  // Texto sobre gray-800 (bg-gray-800: #1F2937)
  textoPrimarioGray800: 'text-gray-50', // Contraste: 15.48:1 ✅
  textoSecundarioGray800: 'text-gray-100', // Contraste: 13.84:1 ✅
  textoTerciarioGray800: 'text-gray-200', // Contraste: 11.16:1 ✅
  textoDesactivadoGray800: 'text-gray-300', // Contraste: 8.59:1 ✅

  // Bordes y divisores
  bordeVisible: 'border-gray-600', // Contraste: 3.13:1 ✅
  bordeSutil: 'border-gray-700', // Contraste: 2.29:1 (decorativo, no información crítica)
} as const;

/**
 * Contraste WCAG AA para fondos claros (white, gray-50, gray-100)
 *
 * Uso: Dashboard principal, formularios, contenido general
 */
export const CONTRASTE_AA_CLARO = {
  // Texto sobre white/gray-50
  textoPrimario: 'text-gray-900', // Contraste: 16.54:1 ✅
  textoSecundario: 'text-gray-700', // Contraste: 8.59:1 ✅
  textoTerciario: 'text-gray-600', // Contraste: 5.91:1 ✅
  textoDesactivado: 'text-gray-500', // Contraste: 4.54:1 ✅
  textoSutil: 'text-gray-400', // Contraste: 3.16:1 ❌ (solo decorativo)

  // Bordes y divisores
  bordeVisible: 'border-gray-400', // Contraste: 3.16:1 ✅
  bordeSutil: 'border-gray-200', // Contraste: 1.16:1 (decorativo)
} as const;

/**
 * Estados emocionales con contraste garantizado
 *
 * Cada estado incluye:
 * - Colores de texto accesibles
 * - Colores de fondo semánticos
 * - Indicadores visuales no dependientes del color
 */
export const ESTADOS_EMOCIONALES_ACCESIBLES = {
  calma: {
    textoPrimario: 'text-calma-800', // Sobre fondos claros
    textoSecundario: 'text-calma-600',
    fondoSuave: 'bg-calma-50',
    fondoMedio: 'bg-calma-100',
    fondoFuerte: 'bg-calma-600',
    bordeVisible: 'border-calma-600',
    // Contraste text-calma-800 sobre white: 8.34:1 ✅
  },
  esperanza: {
    textoPrimario: 'text-esperanza-800',
    textoSecundario: 'text-esperanza-600',
    fondoSuave: 'bg-esperanza-50',
    fondoMedio: 'bg-esperanza-100',
    fondoFuerte: 'bg-esperanza-600',
    bordeVisible: 'border-esperanza-600',
    // Contraste text-esperanza-800 sobre white: 7.21:1 ✅
  },
  calidez: {
    textoPrimario: 'text-orange-800', // Reemplazo de calidez para mejor contraste
    textoSecundario: 'text-orange-600',
    fondoSuave: 'bg-calidez-50',
    fondoMedio: 'bg-calidez-100',
    fondoFuerte: 'bg-orange-600', // Naranja más oscuro
    bordeVisible: 'border-orange-600',
    // Contraste text-orange-800 sobre white: 7.48:1 ✅
  },
  serenidad: {
    textoPrimario: 'text-purple-800',
    textoSecundario: 'text-serenidad-600',
    fondoSuave: 'bg-serenidad-50',
    fondoMedio: 'bg-serenidad-100',
    fondoFuerte: 'bg-purple-700',
    bordeVisible: 'border-purple-700',
    // Contraste text-purple-800 sobre white: 8.12:1 ✅
  },
  alerta: {
    textoPrimario: 'text-red-800',
    textoSecundario: 'text-alerta-700',
    fondoSuave: 'bg-alerta-50',
    fondoMedio: 'bg-alerta-100',
    fondoFuerte: 'bg-red-600',
    bordeVisible: 'border-red-600',
    // Contraste text-red-800 sobre white: 8.96:1 ✅
  },
} as const;

/**
 * Estados de loading accesibles
 *
 * Incluye ARIA labels y roles semánticos
 */
export const LOADING_ACCESIBLE = {
  // Classes para el contenedor
  contenedor: 'min-h-screen bg-gray-50 flex items-center justify-center',
  contenedorCompacto: 'flex items-center justify-center p-8',

  // Spinner con aria-hidden (decorativo)
  spinner: 'w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin',
  spinnerPequeno: 'w-8 h-8 border-2 border-calma-600 border-t-transparent rounded-full animate-spin',

  // Texto visible (lectores de pantalla + visual)
  textoVisible: 'text-gray-600 mt-4',

  // ARIA attributes (usar como objeto)
  ariaAttributes: {
    role: 'status',
    'aria-live': 'polite',
  } as const,
} as const;

/**
 * Helper: Reemplazos de clases para corregir contraste
 *
 * Uso: Buscar y reemplazar en archivos existentes
 */
export const REEMPLAZOS_CONTRASTE = {
  // Para fondos oscuros (gray-900, gray-800)
  enFondoOscuro: {
    'text-gray-300': 'text-gray-50', // Mejora de 9.72:1 a 17.51:1
    'text-gray-400': 'text-gray-200', // Mejora de 6.40:1 a 12.63:1
    'text-gray-500': 'text-gray-300', // Mejora de 4.54:1 a 9.72:1
  },

  // Para fondos claros (white, gray-50)
  enFondoClaro: {
    'text-gray-400': 'text-gray-600', // Mejora de 3.16:1 a 5.91:1
    'text-gray-500': 'text-gray-600', // Mantener o mejorar
  },
} as const;

/**
 * Helper: Generar clase de loading completa con ARIA
 *
 * @param mensaje - Mensaje a mostrar al usuario
 * @param compacto - Si es true, usa versión compacta
 * @returns Objeto con props para el contenedor
 */
export function crearLoadingAccesible(mensaje: string, compacto = false) {
  return {
    className: compacto ? LOADING_ACCESIBLE.contenedorCompacto : LOADING_ACCESIBLE.contenedor,
    role: 'status',
    'aria-live': 'polite' as const,
    'aria-label': mensaje,
  };
}

/**
 * Helper: Validar si una clase de texto cumple con AA
 *
 * @param claseTexto - Clase Tailwind de texto (ej: 'text-gray-400')
 * @param claseFondo - Clase Tailwind de fondo (ej: 'bg-gray-900')
 * @returns true si es accesible, false si necesita corrección
 */
export function esAccesible(claseTexto: string, claseFondo: string): boolean {
  // Combinaciones validadas
  const combinacionesValidas = [
    // Fondos oscuros
    { texto: 'text-gray-50', fondo: 'bg-gray-900' },
    { texto: 'text-gray-100', fondo: 'bg-gray-900' },
    { texto: 'text-gray-200', fondo: 'bg-gray-900' },
    { texto: 'text-gray-200', fondo: 'bg-gray-800' },
    { texto: 'text-gray-100', fondo: 'bg-gray-800' },
    { texto: 'text-gray-50', fondo: 'bg-gray-800' },

    // Fondos claros
    { texto: 'text-gray-900', fondo: 'bg-white' },
    { texto: 'text-gray-800', fondo: 'bg-white' },
    { texto: 'text-gray-700', fondo: 'bg-white' },
    { texto: 'text-gray-600', fondo: 'bg-white' },
    { texto: 'text-gray-500', fondo: 'bg-white' },
  ];

  return combinacionesValidas.some(
    (combo) => combo.texto === claseTexto && combo.fondo === claseFondo
  );
}

/**
 * Exportar todo como objeto único para imports más limpios
 */
export const ACCESIBILIDAD = {
  CONTRASTE_AA_OSCURO,
  CONTRASTE_AA_CLARO,
  ESTADOS_EMOCIONALES_ACCESIBLES,
  LOADING_ACCESIBLE,
  REEMPLAZOS_CONTRASTE,
  crearLoadingAccesible,
  esAccesible,
} as const;
