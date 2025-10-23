/**
 * Queries de Supabase para gestión de citas
 *
 * Este archivo contiene funciones para gestionar el ciclo de vida completo
 * de las citas: confirmar, completar, cancelar, marcar no asistió, agregar notas.
 */

import { obtenerClienteNavegador } from '@/lib/supabase/cliente';

/**
 * Tipo para el estado de una cita
 */
export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';

/**
 * Tipo para una cita completa
 */
export interface CitaCompleta {
  id: string;
  paciente_id: string;
  profesional_id: string;
  fecha_hora: Date;
  duracion: number;
  modalidad: 'virtual' | 'presencial';
  estado: EstadoCita;
  motivo_consulta: string | null;
  notas_paciente: string | null;
  notas_profesional: string | null;
  link_videollamada: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

/**
 * Confirma una cita (cambia estado de 'pendiente' a 'confirmada')
 *
 * @param citaId - ID de la cita
 * @returns Cita actualizada
 */
export async function confirmarCita(
  citaId: string
): Promise<{ data: CitaCompleta | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Cita')
      .update({ estado: 'confirmada' })
      .eq('id', citaId)
      .select()
      .single();

    if (error) {
      console.error('Error al confirmar cita:', error);
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        fecha_hora: new Date(data.fecha_hora),
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en confirmarCita:', error);
    return { data: null, error };
  }
}

/**
 * Completa una cita (cambia estado a 'completada')
 * Opcionalmente permite agregar notas del profesional
 *
 * @param citaId - ID de la cita
 * @param notas - Notas del profesional (opcional)
 * @returns Cita actualizada
 */
export async function completarCita(
  citaId: string,
  notas?: string
): Promise<{ data: CitaCompleta | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const actualizacion: any = { estado: 'completada' };

    if (notas !== undefined) {
      actualizacion.notas_profesional = notas;
    }

    const { data, error } = await supabase
      .from('Cita')
      .update(actualizacion)
      .eq('id', citaId)
      .select()
      .single();

    if (error) {
      console.error('Error al completar cita:', error);
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        fecha_hora: new Date(data.fecha_hora),
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en completarCita:', error);
    return { data: null, error };
  }
}

/**
 * Marca una cita como "no asistió"
 *
 * @param citaId - ID de la cita
 * @returns Cita actualizada
 */
export async function marcarNoAsistio(
  citaId: string
): Promise<{ data: CitaCompleta | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Cita')
      .update({ estado: 'no_asistio' })
      .eq('id', citaId)
      .select()
      .single();

    if (error) {
      console.error('Error al marcar no asistió:', error);
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        fecha_hora: new Date(data.fecha_hora),
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en marcarNoAsistio:', error);
    return { data: null, error };
  }
}

/**
 * Cancela una cita
 *
 * @param citaId - ID de la cita
 * @param motivoCancelacion - Motivo de la cancelación (opcional)
 * @returns Cita actualizada
 */
export async function cancelarCita(
  citaId: string,
  motivoCancelacion?: string
): Promise<{ data: CitaCompleta | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const actualizacion: any = { estado: 'cancelada' };

    // Si hay motivo, agregarlo a las notas profesionales
    if (motivoCancelacion) {
      actualizacion.notas_profesional = motivoCancelacion;
    }

    const { data, error } = await supabase
      .from('Cita')
      .update(actualizacion)
      .eq('id', citaId)
      .select()
      .single();

    if (error) {
      console.error('Error al cancelar cita:', error);
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        fecha_hora: new Date(data.fecha_hora),
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en cancelarCita:', error);
    return { data: null, error };
  }
}

/**
 * Actualiza las notas del profesional para una cita
 *
 * @param citaId - ID de la cita
 * @param notas - Nuevas notas
 * @returns Cita actualizada
 */
export async function actualizarNotasCita(
  citaId: string,
  notas: string
): Promise<{ data: CitaCompleta | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Cita')
      .update({ notas_profesional: notas })
      .eq('id', citaId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar notas:', error);
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        fecha_hora: new Date(data.fecha_hora),
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en actualizarNotasCita:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene una cita por ID
 *
 * @param citaId - ID de la cita
 * @returns Cita con datos del paciente
 */
export async function obtenerCitaPorId(
  citaId: string
): Promise<{ data: any | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('Cita')
      .select(`
        *,
        paciente:Usuario!Cita_paciente_id_fkey (
          id,
          nombre,
          apellido,
          email,
          telefono,
          imagen
        )
      `)
      .eq('id', citaId)
      .single();

    if (error) {
      console.error('Error al obtener cita:', error);
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        fecha_hora: new Date(data.fecha_hora),
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en obtenerCitaPorId:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene todas las citas de un profesional con filtros opcionales
 *
 * @param profesionalId - ID del perfil profesional
 * @param filtros - Filtros opcionales (estado, fecha desde, fecha hasta)
 * @returns Array de citas
 */
export interface FiltrosCitas {
  estado?: EstadoCita;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export async function obtenerCitasProfesional(
  profesionalId: string,
  filtros?: FiltrosCitas
): Promise<{ data: any[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    let query = supabase
      .from('Cita')
      .select(`
        *,
        paciente:Usuario!Cita_paciente_id_fkey (
          id,
          nombre,
          apellido,
          imagen
        )
      `)
      .eq('profesional_id', profesionalId);

    // Aplicar filtros
    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros?.fechaDesde) {
      query = query.gte('fecha_hora', filtros.fechaDesde.toISOString());
    }

    if (filtros?.fechaHasta) {
      query = query.lte('fecha_hora', filtros.fechaHasta.toISOString());
    }

    query = query.order('fecha_hora', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener citas:', error);
      return { data: null, error };
    }

    const citasFormateadas = (data || []).map((cita: any) => ({
      ...cita,
      fecha_hora: new Date(cita.fecha_hora),
      creado_en: new Date(cita.creado_en),
      actualizado_en: new Date(cita.actualizado_en),
    }));

    return { data: citasFormateadas, error: null };
  } catch (error) {
    console.error('Error en obtenerCitasProfesional:', error);
    return { data: null, error };
  }
}
