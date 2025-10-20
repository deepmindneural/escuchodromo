/**
 * Fixtures de citas para testing
 *
 * Datos de prueba para diferentes estados y escenarios de citas
 * NO contiene PHI real - solo datos de prueba
 */

export const citasMock = [
  {
    id: 'cita-001-uuid',
    paciente_id: 'usuario-123-uuid-test',
    profesional_id: 'prof-123-uuid-test-1',
    fecha_hora: '2025-11-15T09:00:00',
    duracion: 60,
    estado: 'confirmada',
    modalidad: 'VIRTUAL',
    motivo_consulta: 'Consulta inicial por ansiedad',
    notas_profesional: null,
    recordatorio_enviado: true,
    creado_en: '2025-11-01T10:30:00',
    actualizado_en: '2025-11-01T10:30:00',
  },
  {
    id: 'cita-002-uuid',
    paciente_id: 'usuario-123-uuid-test',
    profesional_id: 'prof-456-uuid-test-2',
    fecha_hora: '2025-11-20T14:00:00',
    duracion: 30,
    estado: 'pendiente',
    modalidad: 'PRESENCIAL',
    motivo_consulta: 'Seguimiento tratamiento farmacológico',
    notas_profesional: null,
    recordatorio_enviado: false,
    creado_en: '2025-11-01T11:00:00',
    actualizado_en: '2025-11-01T11:00:00',
  },
  {
    id: 'cita-003-uuid',
    paciente_id: 'usuario-456-uuid-test',
    profesional_id: 'prof-123-uuid-test-1',
    fecha_hora: '2025-11-18T10:30:00',
    duracion: 60,
    estado: 'confirmada',
    modalidad: 'VIRTUAL',
    motivo_consulta: 'Terapia para manejo de estrés laboral',
    notas_profesional: null,
    recordatorio_enviado: false,
    creado_en: '2025-11-02T09:15:00',
    actualizado_en: '2025-11-02T09:15:00',
  },
  {
    id: 'cita-004-uuid',
    paciente_id: 'usuario-789-uuid-test',
    profesional_id: 'prof-789-uuid-test-3',
    fecha_hora: '2025-10-28T16:00:00', // Pasada
    duracion: 60,
    estado: 'completada',
    modalidad: 'PRESENCIAL',
    motivo_consulta: 'Terapia de pareja',
    notas_profesional: 'Primera sesión completada. Continuar con plan de 8 sesiones.',
    recordatorio_enviado: true,
    creado_en: '2025-10-15T14:20:00',
    actualizado_en: '2025-10-28T17:00:00',
  },
  {
    id: 'cita-005-uuid',
    paciente_id: 'usuario-123-uuid-test',
    profesional_id: 'prof-123-uuid-test-1',
    fecha_hora: '2025-11-10T11:00:00',
    duracion: 60,
    estado: 'cancelada',
    modalidad: 'VIRTUAL',
    motivo_consulta: 'Sesión regular',
    notas_profesional: null,
    recordatorio_enviado: false,
    creado_en: '2025-11-01T08:00:00',
    actualizado_en: '2025-11-09T18:30:00',
  },
];

// Citas ocupadas para un día específico (para tests de disponibilidad)
export const citasOcupadasDiaMock = [
  {
    id: 'cita-ocupada-1',
    paciente_id: 'usuario-otro-1',
    profesional_id: 'prof-123-uuid-test-1',
    fecha_hora: '2025-11-15T09:00:00',
    duracion: 60,
    estado: 'confirmada',
    modalidad: 'VIRTUAL',
  },
  {
    id: 'cita-ocupada-2',
    paciente_id: 'usuario-otro-2',
    profesional_id: 'prof-123-uuid-test-1',
    fecha_hora: '2025-11-15T15:30:00',
    duracion: 60,
    estado: 'pendiente',
    modalidad: 'VIRTUAL',
  },
  {
    id: 'cita-ocupada-3',
    paciente_id: 'usuario-otro-3',
    profesional_id: 'prof-123-uuid-test-1',
    fecha_hora: '2025-11-15T16:00:00',
    duracion: 30,
    estado: 'confirmada',
    modalidad: 'PRESENCIAL',
  },
];

// Nueva cita para crear (payload válido)
export const nuevaCitaPayloadMock = {
  profesional_id: 'prof-123-uuid-test-1',
  fecha_hora: '2025-11-25T10:00:00',
  duracion: 60,
  modalidad: 'VIRTUAL' as const,
  motivo_consulta: 'Me gustaría trabajar en mejorar mi ansiedad y aprender técnicas de manejo del estrés',
};

// Payload inválido (para tests de validación)
export const citaPayloadInvalidoMock = {
  profesional_id: '',
  fecha_hora: 'fecha-invalida',
  duracion: 45, // Duración no permitida
  modalidad: 'INVALIDA',
  motivo_consulta: '', // Vacío
};

// Cita creada exitosamente (response)
export const citaCreadaResponseMock = {
  success: true,
  cita: {
    id: 'cita-nueva-uuid',
    fecha_hora: '2025-11-25T10:00:00',
    duracion: 60,
    estado: 'pendiente',
    modalidad: 'VIRTUAL',
  },
  tarifa: 150000,
};

// Error de conflicto de horario
export const errorConflictoHorarioMock = {
  success: false,
  error: 'Horario no disponible (ya reservado)',
};

// Error de rate limiting
export const errorRateLimitingMock = {
  success: false,
  error: 'Límite de reservas diarias alcanzado (5 máximo)',
};

// Citas del día actual (para rate limiting)
export const citasHoyMock = [
  { id: 'cita-hoy-1', creado_en: '2025-11-01T08:00:00' },
  { id: 'cita-hoy-2', creado_en: '2025-11-01T09:00:00' },
  { id: 'cita-hoy-3', creado_en: '2025-11-01T10:00:00' },
  { id: 'cita-hoy-4', creado_en: '2025-11-01T11:00:00' },
  { id: 'cita-hoy-5', creado_en: '2025-11-01T12:00:00' },
];
