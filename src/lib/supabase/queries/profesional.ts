/**
 * Queries de Supabase para el Dashboard Profesional
 *
 * Este archivo contiene todas las funciones para obtener datos reales
 * del profesional desde Supabase, incluyendo pacientes, métricas y citas.
 */

import { obtenerClienteNavegador } from '@/lib/supabase/cliente';

/**
 * Tipo para un paciente del profesional con sus datos completos
 */
export interface PacienteConDatos {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  foto_perfil?: string | null;
  telefono?: string | null;
  genero?: string | null;
  total_citas: number;
  citas_completadas: number;
  ultima_cita?: Date | null;
  proxima_cita?: Date | null;
  estado_emocional?: 'ESTABLE' | 'ALERTA' | 'CRITICO';
  progreso?: number;
}

/**
 * Tipo para las métricas del profesional
 */
export interface MetricasProfesional {
  pacientesActivos: number;
  citasEstaSemana: number;
  citasProximaSemana: number;
  citasCompletadasMes: number;
  citasCanceladasMes: number;
  citasNoAsistioMes: number;
  tasaAdherencia: number; // Porcentaje
  ingresosMes: number;
  ingresosMesAnterior: number;
  tendenciaPacientes: number[]; // Últimas 4 semanas
  tendenciaCitas: number[]; // Últimas 4 semanas
  tendenciaAdherencia: number[]; // Últimas 4 semanas
  tendenciaIngresos: number[]; // Últimas 4 semanas
}

/**
 * Tipo para una cita próxima
 */
export interface CitaProxima {
  id: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string | null;
    foto_perfil?: string | null;
  };
  fecha_hora: Date;
  duracion: number;
  modalidad: 'virtual' | 'presencial';
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  motivo_consulta?: string | null;
  link_videollamada?: string | null;
}

/**
 * Obtiene los pacientes únicos del profesional (usuarios que tienen citas con él)
 * Incluye datos de contacto, historial de citas y estado emocional calculado
 *
 * @param profesionalId - ID del profesional (terapeuta)
 * @returns Array de pacientes con sus datos completos
 */
export async function obtenerPacientesProfesional(
  profesionalId: string
): Promise<{ data: PacienteConDatos[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    // Obtener todas las citas del profesional para identificar pacientes únicos
    const { data: citas, error: errorCitas } = await supabase
      .from('Cita')
      .select(
        `
        paciente_id,
        estado,
        fecha_hora,
        paciente:Usuario!Cita_paciente_id_fkey(
          id,
          nombre,
          apellido,
          email,
          PerfilUsuario(
            telefono,
            genero,
            foto_perfil
          )
        )
      `
      )
      .eq('profesional_id', profesionalId)
      .order('fecha_hora', { ascending: false });

    if (errorCitas) {
      console.error('Error obteniendo citas:', errorCitas);
      return { data: null, error: errorCitas };
    }

    if (!citas || citas.length === 0) {
      return { data: [], error: null };
    }

    // Agrupar citas por paciente
    const pacientesMap = new Map<string, any>();

    for (const cita of citas) {
      const pacienteData = (cita as any).paciente;
      if (!pacienteData) continue;

      const pacienteId = pacienteData.id;

      if (!pacientesMap.has(pacienteId)) {
        pacientesMap.set(pacienteId, {
          id: pacienteData.id,
          nombre: pacienteData.nombre || '',
          apellido: pacienteData.apellido || null,
          email: pacienteData.email || '',
          foto_perfil: pacienteData.PerfilUsuario?.foto_perfil || null,
          telefono: pacienteData.PerfilUsuario?.telefono || null,
          genero: pacienteData.PerfilUsuario?.genero || null,
          total_citas: 0,
          citas_completadas: 0,
          ultima_cita: null,
          proxima_cita: null,
        });
      }

      const paciente = pacientesMap.get(pacienteId);
      paciente.total_citas += 1;

      if ((cita as any).estado === 'completada') {
        paciente.citas_completadas += 1;
      }

      const fechaCita = new Date((cita as any).fecha_hora);
      const ahora = new Date();

      // Actualizar última cita (pasada)
      if (fechaCita < ahora) {
        if (!paciente.ultima_cita || fechaCita > paciente.ultima_cita) {
          paciente.ultima_cita = fechaCita;
        }
      }

      // Actualizar próxima cita (futura)
      if (
        fechaCita > ahora &&
        ((cita as any).estado === 'pendiente' || (cita as any).estado === 'confirmada')
      ) {
        if (!paciente.proxima_cita || fechaCita < paciente.proxima_cita) {
          paciente.proxima_cita = fechaCita;
        }
      }
    }

    // Obtener evaluaciones recientes de cada paciente para calcular estado emocional
    const pacientesConDatos: PacienteConDatos[] = [];

    const pacientesArray = Array.from(pacientesMap.entries());
    for (const [pacienteId, pacienteBase] of pacientesArray) {
      // Obtener última evaluación del paciente para determinar estado emocional
      const { data: evaluaciones } = await supabase
        .from('Resultado')
        .select('puntuacion, severidad, creado_en')
        .eq('usuario_id', pacienteId)
        .order('creado_en', { ascending: false })
        .limit(1);

      let estadoEmocional: 'ESTABLE' | 'ALERTA' | 'CRITICO' = 'ESTABLE';
      let progreso = 50; // Progreso por defecto

      if (evaluaciones && evaluaciones.length > 0) {
        const evaluacion = evaluaciones[0];
        // Determinar estado emocional basado en severidad
        if (evaluacion.severidad === 'severa' || evaluacion.severidad === 'moderadamente_severa') {
          estadoEmocional = 'CRITICO';
          progreso = 30;
        } else if (evaluacion.severidad === 'moderada') {
          estadoEmocional = 'ALERTA';
          progreso = 50;
        } else {
          estadoEmocional = 'ESTABLE';
          progreso = 75;
        }
      }

      // Calcular progreso basado en adherencia
      if (pacienteBase.total_citas > 0) {
        const adherencia = (pacienteBase.citas_completadas / pacienteBase.total_citas) * 100;
        progreso = Math.round((progreso + adherencia) / 2);
      }

      pacientesConDatos.push({
        ...pacienteBase,
        estado_emocional: estadoEmocional,
        progreso: Math.min(100, Math.max(0, progreso)),
      });
    }

    return { data: pacientesConDatos, error: null };
  } catch (error) {
    console.error('Error en obtenerPacientesProfesional:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene las métricas completas del profesional
 * Incluye pacientes activos, citas, adherencia e ingresos
 *
 * @param profesionalId - ID del profesional (terapeuta)
 * @returns Métricas del profesional con tendencias
 */
export async function obtenerMetricasProfesional(
  profesionalId: string
): Promise<{ data: MetricasProfesional | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();
    const ahora = new Date();

    // Calcular fechas para las consultas
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

    // Inicio de la semana actual (lunes)
    const inicioSemanaActual = new Date(ahora);
    const diaSemana = inicioSemanaActual.getDay();
    const diff = inicioSemanaActual.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    inicioSemanaActual.setDate(diff);
    inicioSemanaActual.setHours(0, 0, 0, 0);

    const finSemanaActual = new Date(inicioSemanaActual);
    finSemanaActual.setDate(finSemanaActual.getDate() + 6);
    finSemanaActual.setHours(23, 59, 59, 999);

    // Semana próxima
    const inicioProximaSemana = new Date(finSemanaActual);
    inicioProximaSemana.setDate(inicioProximaSemana.getDate() + 1);
    inicioProximaSemana.setHours(0, 0, 0, 0);

    const finProximaSemana = new Date(inicioProximaSemana);
    finProximaSemana.setDate(finProximaSemana.getDate() + 6);
    finProximaSemana.setHours(23, 59, 59, 999);

    // Obtener todas las citas del mes actual
    const { data: citasMes, error: errorCitasMes } = await supabase
      .from('Cita')
      .select('id, estado, fecha_hora, paciente_id')
      .eq('profesional_id', profesionalId)
      .gte('fecha_hora', inicioMes.toISOString())
      .lte('fecha_hora', finMes.toISOString());

    if (errorCitasMes) {
      console.error('Error obteniendo citas del mes:', errorCitasMes);
      return { data: null, error: errorCitasMes };
    }

    // Obtener citas de la semana actual
    const { data: citasSemana, error: errorCitasSemana } = await supabase
      .from('Cita')
      .select('id, estado, fecha_hora')
      .eq('profesional_id', profesionalId)
      .gte('fecha_hora', inicioSemanaActual.toISOString())
      .lte('fecha_hora', finSemanaActual.toISOString());

    if (errorCitasSemana) {
      console.error('Error obteniendo citas de la semana:', errorCitasSemana);
      return { data: null, error: errorCitasSemana };
    }

    // Obtener citas de la próxima semana
    const { data: citasProximaSemana, error: errorCitasProximaSemana } = await supabase
      .from('Cita')
      .select('id, estado, fecha_hora')
      .eq('profesional_id', profesionalId)
      .gte('fecha_hora', inicioProximaSemana.toISOString())
      .lte('fecha_hora', finProximaSemana.toISOString());

    if (errorCitasProximaSemana) {
      console.error('Error obteniendo citas de próxima semana:', errorCitasProximaSemana);
    }

    // Obtener tarifa del profesional para calcular ingresos
    const { data: perfilProfesional } = await supabase
      .from('PerfilProfesional')
      .select('tarifa_por_sesion, moneda')
      .eq('usuario_id', profesionalId)
      .single();

    const tarifaPorSesion = perfilProfesional?.tarifa_por_sesion || 0;

    // Calcular métricas del mes actual
    const citasCompletadasMes = citasMes?.filter((c) => c.estado === 'completada').length || 0;
    const citasCanceladasMes = citasMes?.filter((c) => c.estado === 'cancelada').length || 0;
    const citasNoAsistioMes = citasMes?.filter((c) => c.estado === 'no_asistio').length || 0;

    // Calcular pacientes activos (con al menos una cita en los últimos 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const { data: citasRecientes } = await supabase
      .from('Cita')
      .select('paciente_id, estado')
      .eq('profesional_id', profesionalId)
      .gte('fecha_hora', hace30Dias.toISOString());

    const pacientesActivosSet = new Set(
      citasRecientes
        ?.filter((c) => c.estado === 'completada' || c.estado === 'confirmada')
        .map((c) => c.paciente_id) || []
    );
    const pacientesActivos = pacientesActivosSet.size;

    // Calcular adherencia (% de citas completadas vs total programadas)
    const totalCitasProgramadas = citasMes?.length || 0;
    const tasaAdherencia =
      totalCitasProgramadas > 0 ? (citasCompletadasMes / totalCitasProgramadas) * 100 : 0;

    // Calcular ingresos del mes
    const ingresosMes = citasCompletadasMes * tarifaPorSesion;

    // Calcular ingresos del mes anterior
    const { data: citasMesAnterior } = await supabase
      .from('Cita')
      .select('id, estado')
      .eq('profesional_id', profesionalId)
      .eq('estado', 'completada')
      .gte('fecha_hora', inicioMesAnterior.toISOString())
      .lte('fecha_hora', finMesAnterior.toISOString());

    const ingresosMesAnterior = (citasMesAnterior?.length || 0) * tarifaPorSesion;

    // Calcular tendencias (últimas 4 semanas)
    const tendenciaPacientes: number[] = [];
    const tendenciaCitas: number[] = [];
    const tendenciaAdherencia: number[] = [];
    const tendenciaIngresos: number[] = [];

    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(inicioSemanaActual);
      inicioSemana.setDate(inicioSemana.getDate() - i * 7);
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);

      const { data: citasSemanaHistorica } = await supabase
        .from('Cita')
        .select('paciente_id, estado')
        .eq('profesional_id', profesionalId)
        .gte('fecha_hora', inicioSemana.toISOString())
        .lte('fecha_hora', finSemana.toISOString());

      const pacientesSemanales = new Set(citasSemanaHistorica?.map((c) => c.paciente_id) || []);
      const citasCompletadasSemana =
        citasSemanaHistorica?.filter((c) => c.estado === 'completada').length || 0;
      const totalCitasSemana = citasSemanaHistorica?.length || 0;
      const adherenciaSemana =
        totalCitasSemana > 0 ? (citasCompletadasSemana / totalCitasSemana) * 100 : 0;
      const ingresosSemana = citasCompletadasSemana * tarifaPorSesion;

      tendenciaPacientes.push(pacientesSemanales.size);
      tendenciaCitas.push(totalCitasSemana);
      tendenciaAdherencia.push(Math.round(adherenciaSemana));
      tendenciaIngresos.push(ingresosSemana);
    }

    const metricas: MetricasProfesional = {
      pacientesActivos,
      citasEstaSemana: citasSemana?.length || 0,
      citasProximaSemana: citasProximaSemana?.length || 0,
      citasCompletadasMes,
      citasCanceladasMes,
      citasNoAsistioMes,
      tasaAdherencia: Math.round(tasaAdherencia),
      ingresosMes,
      ingresosMesAnterior,
      tendenciaPacientes,
      tendenciaCitas,
      tendenciaAdherencia,
      tendenciaIngresos,
    };

    return { data: metricas, error: null };
  } catch (error) {
    console.error('Error en obtenerMetricasProfesional:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene las próximas citas del profesional
 * Ordenadas por fecha, con datos del paciente
 *
 * @param profesionalId - ID del profesional (terapeuta)
 * @param limite - Número máximo de citas a retornar (default: 10)
 * @returns Array de próximas citas con datos del paciente
 */
export async function obtenerProximasCitas(
  profesionalId: string,
  limite: number = 10
): Promise<{ data: CitaProxima[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();
    const ahora = new Date();

    const { data: citas, error: errorCitas } = await supabase
      .from('Cita')
      .select(
        `
        id,
        fecha_hora,
        duracion,
        modalidad,
        estado,
        motivo_consulta,
        link_videollamada,
        paciente:Usuario!Cita_paciente_id_fkey(
          id,
          nombre,
          apellido,
          PerfilUsuario(foto_perfil)
        )
      `
      )
      .eq('profesional_id', profesionalId)
      .gte('fecha_hora', ahora.toISOString())
      .in('estado', ['pendiente', 'confirmada'])
      .order('fecha_hora', { ascending: true })
      .limit(limite);

    if (errorCitas) {
      console.error('Error obteniendo próximas citas:', errorCitas);
      return { data: null, error: errorCitas };
    }

    if (!citas || citas.length === 0) {
      return { data: [], error: null };
    }

    const citasFormateadas: CitaProxima[] = citas.map((cita: any) => ({
      id: cita.id,
      paciente: {
        id: cita.paciente?.id || '',
        nombre: cita.paciente?.nombre || '',
        apellido: cita.paciente?.apellido || null,
        foto_perfil: cita.paciente?.PerfilUsuario?.foto_perfil || null,
      },
      fecha_hora: new Date(cita.fecha_hora),
      duracion: cita.duracion || 60,
      modalidad: cita.modalidad || 'virtual',
      estado: cita.estado || 'pendiente',
      motivo_consulta: cita.motivo_consulta || null,
      link_videollamada: cita.link_videollamada || null,
    }));

    return { data: citasFormateadas, error: null };
  } catch (error) {
    console.error('Error en obtenerProximasCitas:', error);
    return { data: null, error };
  }
}
