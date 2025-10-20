/**
 * Fixtures de horarios profesionales para testing
 *
 * Simula horarios de trabajo de profesionales
 * con diferentes patrones y disponibilidades
 */

import type { SlotHorario } from '@/lib/componentes/SlotsDisponibles';

// Horarios típicos de profesional (Lunes a Viernes)
export const horariosProfesional1Mock = [
  // Lunes (1)
  {
    id: 'hor-1-lun-am',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 1, // Lunes
    hora_inicio: '08:00',
    hora_fin: '12:00',
    activo: true,
  },
  {
    id: 'hor-1-lun-pm',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 1,
    hora_inicio: '14:00',
    hora_fin: '18:00',
    activo: true,
  },
  // Martes (2)
  {
    id: 'hor-1-mar-am',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 2,
    hora_inicio: '09:00',
    hora_fin: '13:00',
    activo: true,
  },
  {
    id: 'hor-1-mar-pm',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 2,
    hora_inicio: '15:00',
    hora_fin: '19:00',
    activo: true,
  },
  // Miércoles (3)
  {
    id: 'hor-1-mie-am',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 3,
    hora_inicio: '08:00',
    hora_fin: '12:00',
    activo: true,
  },
  {
    id: 'hor-1-mie-pm',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 3,
    hora_inicio: '14:00',
    hora_fin: '17:00',
    activo: true,
  },
  // Jueves (4)
  {
    id: 'hor-1-jue-todo',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 4,
    hora_inicio: '10:00',
    hora_fin: '16:00',
    activo: true,
  },
  // Viernes (5)
  {
    id: 'hor-1-vie-am',
    perfil_profesional_id: 'perf-prof-1',
    dia_semana: 5,
    hora_inicio: '08:00',
    hora_fin: '13:00',
    activo: true,
  },
  // No trabaja sábado ni domingo
];

// Profesional con horario limitado
export const horariosLimitadosMock = [
  // Solo martes y jueves
  {
    id: 'hor-lim-mar',
    perfil_profesional_id: 'perf-prof-2',
    dia_semana: 2,
    hora_inicio: '14:00',
    hora_fin: '18:00',
    activo: true,
  },
  {
    id: 'hor-lim-jue',
    perfil_profesional_id: 'perf-prof-2',
    dia_semana: 4,
    hora_inicio: '14:00',
    hora_fin: '18:00',
    activo: true,
  },
];

// Profesional con horario completo (incluyendo sábados)
export const horariosCompletosMock = [
  // Lunes a Viernes (8am - 6pm)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `hor-comp-dia-${i + 1}`,
    perfil_profesional_id: 'perf-prof-completo',
    dia_semana: i + 1,
    hora_inicio: '08:00',
    hora_fin: '18:00',
    activo: true,
  })),
  // Sábado (9am - 1pm)
  {
    id: 'hor-comp-sab',
    perfil_profesional_id: 'perf-prof-completo',
    dia_semana: 6,
    hora_inicio: '09:00',
    hora_fin: '13:00',
    activo: true,
  },
];

// Slots disponibles generados (para componente SlotsDisponibles)
export const slotsDisponiblesMock: SlotHorario[] = [
  { hora_inicio: '08:00', hora_fin: '08:30', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '08:30', hora_fin: '09:00', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '09:00', hora_fin: '09:30', disponible: false }, // Ocupado
  { hora_inicio: '09:30', hora_fin: '10:00', disponible: false }, // Ocupado
  { hora_inicio: '10:00', hora_fin: '10:30', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '10:30', hora_fin: '11:00', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '11:00', hora_fin: '11:30', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '11:30', hora_fin: '12:00', disponible: true, duracion_disponible: 30 }, // Solo 30 min
  { hora_inicio: '14:00', hora_fin: '14:30', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '14:30', hora_fin: '15:00', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '15:00', hora_fin: '15:30', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '15:30', hora_fin: '16:00', disponible: false }, // Ocupado
  { hora_inicio: '16:00', hora_fin: '16:30', disponible: false }, // Ocupado
  { hora_inicio: '16:30', hora_fin: '17:00', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '17:00', hora_fin: '17:30', disponible: true, duracion_disponible: 30 }, // Solo 30 min
];

// Solo slots disponibles (sin ocupados)
export const slotsDisponiblesFiltradosMock: SlotHorario[] = slotsDisponiblesMock.filter(
  (slot) => slot.disponible
);

// Día sin slots disponibles
export const slotsSinDisponibilidadMock: SlotHorario[] = [];

// Slots con muy poca disponibilidad (solo 30 minutos)
export const slotsSolo30MinMock: SlotHorario[] = [
  { hora_inicio: '08:00', hora_fin: '08:30', disponible: true, duracion_disponible: 30 },
  { hora_inicio: '10:00', hora_fin: '10:30', disponible: true, duracion_disponible: 30 },
  { hora_inicio: '16:00', hora_fin: '16:30', disponible: true, duracion_disponible: 30 },
];

// Slots para tests de validación de duración
export const slotsMixtaDuracionMock: SlotHorario[] = [
  { hora_inicio: '08:00', hora_fin: '08:30', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '08:30', hora_fin: '09:00', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '09:00', hora_fin: '09:30', disponible: true, duracion_disponible: 30 }, // Solo 30
  { hora_inicio: '10:00', hora_fin: '10:30', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '10:30', hora_fin: '11:00', disponible: true, duracion_disponible: 60 },
  { hora_inicio: '11:00', hora_fin: '11:30', disponible: true, duracion_disponible: 30 }, // Solo 30
];
