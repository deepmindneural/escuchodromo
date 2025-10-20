/**
 * Tipos compartidos para el sistema de profesionales
 */

/**
 * Datos básicos del profesional para listado público
 */
export interface DatosProfesional {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;

  // Información profesional
  titulo_profesional: string;
  especialidades: string[];
  especialidad: string; // Especialidad principal (retrocompatibilidad)
  experiencia_anos: number;

  // Perfil
  foto_perfil: string | null;
  biografia: string;
  direccion: string | null;

  // Tarifas
  tarifa_por_sesion: number;
  tarifa_30min: number;
  tarifa_60min: number;

  // Rating y estadísticas
  calificacion_promedio: number;
  total_reviews: number;
  total_citas: number;

  // Disponibilidad
  disponible: boolean;

  // Modalidades
  modalidades: ('virtual' | 'presencial')[];
}

/**
 * Filtros para búsqueda de profesionales
 */
export interface FiltrosProfesionales {
  busqueda?: string;
  especialidad?: string;
  tarifa_min?: number;
  tarifa_max?: number;
  modalidad?: 'virtual' | 'presencial' | 'ambas';
  disponible?: boolean;
  orderBy?: 'nombre' | 'rating' | 'tarifa_asc' | 'tarifa_desc' | 'experiencia';
  pagina?: number;
  limite?: number;
}

/**
 * Respuesta de la API de listado de profesionales
 */
export interface RespuestaListadoProfesionales {
  success: boolean;
  profesionales: DatosProfesional[];
  total: number;
  pagina: number;
  total_paginas: number;
  limite: number;
  filtros_aplicados: FiltrosProfesionales;
}

/**
 * Perfil completo del profesional (para vista de detalle)
 */
export interface PerfilCompletoProfesional extends DatosProfesional {
  // Información adicional de verificación
  numero_licencia?: string;
  universidad?: string;
  idiomas: string[];

  // Estado de verificación
  documentos_verificados: boolean;
  perfil_aprobado: boolean;

  // Horarios disponibles
  horarios?: HorarioProfesional[];

  // Reviews
  reviews?: ReviewProfesional[];
}

/**
 * Horario de disponibilidad del profesional
 */
export interface HorarioProfesional {
  id: string;
  dia_semana: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  hora_inicio: string; // Formato: "HH:MM"
  hora_fin: string; // Formato: "HH:MM"
  duracion_sesion: number; // En minutos
  activo: boolean;
}

/**
 * Review de un profesional
 */
export interface ReviewProfesional {
  id: string;
  paciente_nombre?: string; // Opcional por privacidad
  puntuacion: number; // 1-5
  comentario: string;
  puntualidad?: number;
  profesionalismo?: number;
  empatia?: number;
  recomendaria: boolean;
  creado_en: string;
}

/**
 * Especialidades disponibles en la plataforma
 */
export const ESPECIALIDADES_DISPONIBLES = [
  'Ansiedad',
  'Depresión',
  'Trauma',
  'Relaciones',
  'Autoestima',
  'Estrés',
  'Duelo',
  'Adicciones',
  'Trastornos alimentarios',
  'Psicología Clínica',
  'Psicología Infantil',
  'Psicología de Pareja',
  'Psicología Organizacional',
  'Terapia Cognitivo-Conductual',
  'Terapia Humanista',
  'Psicoanálisis',
  'Neuropsicología',
  'Terapia Familiar',
] as const;

export type EspecialidadProfesional = (typeof ESPECIALIDADES_DISPONIBLES)[number];

/**
 * Modalidades de atención
 */
export type ModalidadAtencion = 'virtual' | 'presencial';

/**
 * Opciones de ordenamiento
 */
export type OrdenProfesionales = 'nombre' | 'rating' | 'tarifa_asc' | 'tarifa_desc' | 'experiencia';

/**
 * Helper: Formatear precio en COP
 */
export function formatearPrecioCOP(precio: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

/**
 * Helper: Formatear rating con decimales
 */
export function formatearRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Helper: Obtener initiales del nombre
 */
export function obtenerIniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

/**
 * Helper: Validar si un profesional está disponible
 */
export function estaDisponible(profesional: DatosProfesional): boolean {
  return profesional.disponible === true;
}

/**
 * Helper: Obtener color de badge según rating
 */
export function obtenerColorRating(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-blue-600';
  if (rating >= 3.5) return 'text-yellow-600';
  return 'text-gray-600';
}
