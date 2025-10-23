/**
 * Queries de Supabase para datos de pacientes individuales
 *
 * Este archivo contiene funciones para obtener información detallada
 * de un paciente específico, incluyendo historial de sesiones,
 * evaluaciones y progreso.
 */

import { obtenerClienteNavegador } from '@/lib/supabase/cliente';

/**
 * Tipo para datos completos del paciente
 */
export interface DatosPacienteCompleto {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  genero: string | null;
  fecha_nacimiento: Date | null;
  foto_perfil: string | null;
  creado_en: Date;
}

/**
 * Tipo para una sesión/cita en el historial
 */
export interface SesionHistorial {
  id: string;
  fecha_hora: Date;
  duracion: number;
  modalidad: 'virtual' | 'presencial';
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  motivo_consulta: string | null;
  notas_profesional: string | null;
  notas_paciente: string | null;
}

/**
 * Tipo para una evaluación (PHQ-9, GAD-7, etc.)
 */
export interface EvaluacionPaciente {
  id: string;
  tipo_evaluacion: 'PHQ-9' | 'GAD-7' | 'Otro';
  puntuacion_total: number;
  nivel_severidad: string;
  fecha_evaluacion: Date;
  respuestas: any;
}

/**
 * Tipo para el progreso emocional (evolución de las evaluaciones)
 */
export interface ProgresoEmocional {
  fecha: Date;
  phq9?: number;
  gad7?: number;
}

/**
 * Obtiene los datos completos de un paciente
 *
 * @param pacienteId - ID del paciente (usuario)
 * @returns Datos del paciente
 */
export async function obtenerDatosPaciente(
  pacienteId: string
): Promise<{ data: DatosPacienteCompleto | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Usuario')
      .select('id, nombre, apellido, email, telefono, genero, fecha_nacimiento, imagen, creado_en')
      .eq('id', pacienteId)
      .single();

    if (error) {
      console.error('Error al obtener datos del paciente:', error);
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: new Error('Paciente no encontrado') };
    }

    return {
      data: {
        id: data.id,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        genero: data.genero,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
        foto_perfil: data.imagen,
        creado_en: new Date(data.creado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en obtenerDatosPaciente:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene el historial de sesiones de un paciente con un profesional
 *
 * @param pacienteId - ID del paciente
 * @param profesionalId - ID del perfil profesional
 * @returns Array de sesiones ordenadas por fecha descendente
 */
export async function obtenerHistorialSesiones(
  pacienteId: string,
  profesionalId: string
): Promise<{ data: SesionHistorial[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Cita')
      .select('id, fecha_hora, duracion, modalidad, estado, motivo_consulta, notas_profesional, notas_paciente')
      .eq('paciente_id', pacienteId)
      .eq('profesional_id', profesionalId)
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('Error al obtener historial de sesiones:', error);
      return { data: null, error };
    }

    const sesiones: SesionHistorial[] = (data || []).map((sesion: any) => ({
      id: sesion.id,
      fecha_hora: new Date(sesion.fecha_hora),
      duracion: sesion.duracion || 60,
      modalidad: sesion.modalidad || 'virtual',
      estado: sesion.estado || 'pendiente',
      motivo_consulta: sesion.motivo_consulta,
      notas_profesional: sesion.notas_profesional,
      notas_paciente: sesion.notas_paciente,
    }));

    return { data: sesiones, error: null };
  } catch (error) {
    console.error('Error en obtenerHistorialSesiones:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene las evaluaciones de un paciente
 *
 * @param pacienteId - ID del paciente
 * @returns Array de evaluaciones ordenadas por fecha descendente
 */
export async function obtenerEvaluacionesPaciente(
  pacienteId: string
): Promise<{ data: EvaluacionPaciente[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    // Obtener evaluaciones de la tabla Resultado
    const { data, error } = await supabase
      .from('Resultado')
      .select(`
        id,
        puntaje_total,
        nivel_severidad,
        respuestas,
        creado_en,
        evaluacion:evaluacion_id (
          tipo
        )
      `)
      .eq('usuario_id', pacienteId)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error al obtener evaluaciones:', error);
      return { data: null, error };
    }

    const evaluaciones: EvaluacionPaciente[] = (data || []).map((eval: any) => ({
      id: eval.id,
      tipo_evaluacion: eval.evaluacion?.tipo || 'Otro',
      puntuacion_total: eval.puntaje_total || 0,
      nivel_severidad: eval.nivel_severidad || 'DESCONOCIDO',
      fecha_evaluacion: new Date(eval.creado_en),
      respuestas: eval.respuestas,
    }));

    return { data: evaluaciones, error: null };
  } catch (error) {
    console.error('Error en obtenerEvaluacionesPaciente:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene el progreso emocional del paciente (evolución de PHQ-9 y GAD-7)
 *
 * @param pacienteId - ID del paciente
 * @returns Array de puntos de datos para graficar evolución
 */
export async function obtenerProgresoEmocional(
  pacienteId: string
): Promise<{ data: ProgresoEmocional[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Resultado')
      .select(`
        puntaje_total,
        creado_en,
        evaluacion:evaluacion_id (
          tipo
        )
      `)
      .eq('usuario_id', pacienteId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('Error al obtener progreso emocional:', error);
      return { data: null, error };
    }

    // Agrupar por fecha y tipo de evaluación
    const progresoMap = new Map<string, ProgresoEmocional>();

    (data || []).forEach((eval: any) => {
      const fecha = new Date(eval.creado_en);
      const fechaKey = fecha.toISOString().split('T')[0]; // Solo la fecha (YYYY-MM-DD)
      const tipo = eval.evaluacion?.tipo;

      if (!progresoMap.has(fechaKey)) {
        progresoMap.set(fechaKey, { fecha });
      }

      const punto = progresoMap.get(fechaKey)!;

      if (tipo === 'PHQ-9') {
        punto.phq9 = eval.puntaje_total;
      } else if (tipo === 'GAD-7') {
        punto.gad7 = eval.puntaje_total;
      }
    });

    const progreso = Array.from(progresoMap.values()).sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    return { data: progreso, error: null };
  } catch (error) {
    console.error('Error en obtenerProgresoEmocional:', error);
    return { data: null, error };
  }
}

/**
 * Agrega una nota del profesional a una cita específica
 *
 * @param citaId - ID de la cita
 * @param notas - Notas del profesional
 * @returns Cita actualizada
 */
export async function agregarNotaPaciente(
  citaId: string,
  notas: string
): Promise<{ data: any | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Cita')
      .update({ notas_profesional: notas })
      .eq('id', citaId)
      .select()
      .single();

    if (error) {
      console.error('Error al agregar nota:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en agregarNotaPaciente:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene métricas resumidas de un paciente
 *
 * @param pacienteId - ID del paciente
 * @param profesionalId - ID del perfil profesional
 * @returns Métricas del paciente
 */
export interface MetricasPaciente {
  total_sesiones: number;
  sesiones_completadas: number;
  sesiones_canceladas: number;
  sesiones_no_asistio: number;
  tasa_adherencia: number; // Porcentaje
  ultima_evaluacion_phq9: number | null;
  ultima_evaluacion_gad7: number | null;
  tendencia_phq9: 'mejorando' | 'estable' | 'empeorando' | null;
  tendencia_gad7: 'mejorando' | 'estable' | 'empeorando' | null;
}

export async function obtenerMetricasPaciente(
  pacienteId: string,
  profesionalId: string
): Promise<{ data: MetricasPaciente | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    // Obtener todas las citas
    const { data: citas, error: citasError } = await supabase
      .from('Cita')
      .select('estado')
      .eq('paciente_id', pacienteId)
      .eq('profesional_id', profesionalId);

    if (citasError) {
      return { data: null, error: citasError };
    }

    const total_sesiones = citas?.length || 0;
    const sesiones_completadas = citas?.filter((c: any) => c.estado === 'completada').length || 0;
    const sesiones_canceladas = citas?.filter((c: any) => c.estado === 'cancelada').length || 0;
    const sesiones_no_asistio = citas?.filter((c: any) => c.estado === 'no_asistio').length || 0;

    const citasRealizadas = sesiones_completadas + sesiones_no_asistio;
    const tasa_adherencia = citasRealizadas > 0
      ? (sesiones_completadas / citasRealizadas) * 100
      : 0;

    // Obtener últimas evaluaciones
    const { data: evaluacionesPHQ9 } = await supabase
      .from('Resultado')
      .select('puntaje_total, creado_en, evaluacion:evaluacion_id(tipo)')
      .eq('usuario_id', pacienteId)
      .order('creado_en', { ascending: false })
      .limit(2);

    const phq9Evals = (evaluacionesPHQ9 || []).filter(
      (e: any) => e.evaluacion?.tipo === 'PHQ-9'
    );

    const { data: evaluacionesGAD7 } = await supabase
      .from('Resultado')
      .select('puntaje_total, creado_en, evaluacion:evaluacion_id(tipo)')
      .eq('usuario_id', pacienteId)
      .order('creado_en', { ascending: false })
      .limit(2);

    const gad7Evals = (evaluacionesGAD7 || []).filter(
      (e: any) => e.evaluacion?.tipo === 'GAD-7'
    );

    const calcularTendencia = (evals: any[]): 'mejorando' | 'estable' | 'empeorando' | null => {
      if (evals.length < 2) return null;
      const diff = evals[0].puntaje_total - evals[1].puntaje_total;
      if (diff < -2) return 'mejorando'; // Puntaje bajó (mejor)
      if (diff > 2) return 'empeorando'; // Puntaje subió (peor)
      return 'estable';
    };

    return {
      data: {
        total_sesiones,
        sesiones_completadas,
        sesiones_canceladas,
        sesiones_no_asistio,
        tasa_adherencia: Math.round(tasa_adherencia),
        ultima_evaluacion_phq9: phq9Evals[0]?.puntaje_total || null,
        ultima_evaluacion_gad7: gad7Evals[0]?.puntaje_total || null,
        tendencia_phq9: calcularTendencia(phq9Evals),
        tendencia_gad7: calcularTendencia(gad7Evals),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en obtenerMetricasPaciente:', error);
    return { data: null, error };
  }
}
