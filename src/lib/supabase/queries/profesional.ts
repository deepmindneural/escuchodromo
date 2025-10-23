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

    console.log('🔍 [obtenerPacientesProfesional] Buscando pacientes para profesional:', profesionalId);

    // Usar función de base de datos con SECURITY DEFINER para evitar bloqueo de RLS
    const { data: citasConPacientes, error: errorCitas } = await supabase
      .rpc('obtener_pacientes_con_citas', { p_profesional_id: profesionalId });

    console.log('📊 [obtenerPacientesProfesional] Citas encontradas:', citasConPacientes?.length || 0);
    console.log('📋 [obtenerPacientesProfesional] Datos de citas:', JSON.stringify(citasConPacientes?.slice(0, 3), null, 2));

    if (errorCitas) {
      console.error('❌ [obtenerPacientesProfesional] Error obteniendo citas:', errorCitas);
      return { data: null, error: errorCitas };
    }

    if (!citasConPacientes || citasConPacientes.length === 0) {
      console.log('⚠️ [obtenerPacientesProfesional] No se encontraron citas');
      return { data: [], error: null };
    }

    // Agrupar citas por paciente
    const pacientesMap = new Map<string, any>();

    for (const cita of citasConPacientes) {
      const pacienteId = cita.paciente_id;
      if (!pacienteId) continue;

      if (!pacientesMap.has(pacienteId)) {
        pacientesMap.set(pacienteId, {
          id: pacienteId,
          nombre: cita.paciente_nombre || '',
          apellido: cita.paciente_apellido || null,
          email: cita.paciente_email || '',
          foto_perfil: cita.paciente_imagen || null,
          telefono: null,
          genero: null,
          total_citas: 0,
          citas_completadas: 0,
          ultima_cita: null,
          proxima_cita: null,
        });
      }

      const paciente = pacientesMap.get(pacienteId);
      paciente.total_citas += 1;

      if (cita.cita_estado === 'completada') {
        paciente.citas_completadas += 1;
      }

      const fechaCita = new Date(cita.cita_fecha_hora);
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
        (cita.cita_estado === 'pendiente' || cita.cita_estado === 'confirmada')
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
        Usuario:paciente_id(
          id,
          nombre,
          apellido,
          imagen
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
        id: cita.Usuario?.id || '',
        nombre: cita.Usuario?.nombre || '',
        apellido: cita.Usuario?.apellido || null,
        foto_perfil: cita.Usuario?.imagen || null,
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

/**
 * Tipo para el perfil profesional completo
 */
export interface PerfilProfesionalCompleto {
  id: string;
  usuario_id: string;
  titulo_profesional: string | null;
  numero_licencia: string | null;
  universidad: string | null;
  anos_experiencia: number | null;
  especialidades: string[];
  biografia: string | null;
  idiomas: string[];
  tarifa_por_sesion: number | null;
  moneda: 'COP' | 'USD';
  perfil_aprobado: boolean;
  total_pacientes: number;
  total_citas: number;
  calificacion_promedio: number | null;
  creado_en: Date;
  actualizado_en: Date;
}

/**
 * Obtiene el perfil profesional completo por usuario_id
 *
 * @param usuarioId - ID del usuario (no el auth_id)
 * @returns Perfil profesional completo
 */
export async function obtenerPerfilProfesional(
  usuarioId: string
): Promise<{ data: PerfilProfesionalCompleto | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    const { data, error } = await supabase
      .from('PerfilProfesional')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      console.error('Error al obtener perfil profesional:', error);
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: new Error('Perfil profesional no encontrado') };
    }

    return {
      data: {
        ...data,
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en obtenerPerfilProfesional:', error);
    return { data: null, error };
  }
}

/**
 * Tipo para actualizar perfil profesional
 */
export interface ActualizarPerfilProfesionalInput {
  titulo_profesional?: string;
  numero_licencia?: string;
  universidad?: string;
  anos_experiencia?: number;
  especialidades?: string[];
  biografia?: string;
  idiomas?: string[];
  tarifa_por_sesion?: number;
  moneda?: 'COP' | 'USD';
}

/**
 * Actualiza el perfil profesional
 *
 * @param usuarioId - ID del usuario profesional
 * @param datos - Datos a actualizar
 * @returns Perfil actualizado
 */
export async function actualizarPerfilProfesional(
  usuarioId: string,
  datos: ActualizarPerfilProfesionalInput
): Promise<{ data: PerfilProfesionalCompleto | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    // Actualizar el perfil
    const { data, error } = await supabase
      .from('PerfilProfesional')
      .update(datos)
      .eq('usuario_id', usuarioId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar perfil profesional:', error);
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        creado_en: new Date(data.creado_en),
        actualizado_en: new Date(data.actualizado_en),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en actualizarPerfilProfesional:', error);
    return { data: null, error };
  }
}

/**
 * Tipo para una cita del día con información de pago
 */
export interface CitaDelDia extends CitaProxima {
  pago?: {
    id: string;
    monto: number;
    moneda: string;
    estado: 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'reembolsado' | 'cancelado';
    fecha_pago?: Date | null;
  } | null;
  minutos_hasta_cita: number;
  urgencia: 'critico' | 'proximo' | 'programado';
}

/**
 * Obtiene las citas del día actual del profesional
 * Incluye información de pagos asociados y urgencia
 *
 * @param profesionalId - ID del profesional (terapeuta)
 * @returns Array de citas del día con pagos y urgencia
 */
export async function obtenerCitasHoy(
  profesionalId: string
): Promise<{ data: CitaDelDia[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();
    const ahora = new Date();

    // Inicio del día actual (00:00:00)
    const inicioDia = new Date(ahora);
    inicioDia.setHours(0, 0, 0, 0);

    // Fin del día actual (23:59:59)
    const finDia = new Date(ahora);
    finDia.setHours(23, 59, 59, 999);

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
        Usuario:paciente_id(
          id,
          nombre,
          apellido,
          imagen
        ),
        PagoCita(
          id,
          monto,
          moneda,
          estado,
          fecha_pago
        )
      `
      )
      .eq('profesional_id', profesionalId)
      .gte('fecha_hora', inicioDia.toISOString())
      .lte('fecha_hora', finDia.toISOString())
      .in('estado', ['pendiente', 'confirmada', 'completada'])
      .order('fecha_hora', { ascending: true });

    if (errorCitas) {
      console.error('Error obteniendo citas del día:', errorCitas);
      return { data: null, error: errorCitas };
    }

    if (!citas || citas.length === 0) {
      return { data: [], error: null };
    }

    const citasFormateadas: CitaDelDia[] = citas.map((cita: any) => {
      const fechaCita = new Date(cita.fecha_hora);
      const minutosHastaCita = Math.floor((fechaCita.getTime() - ahora.getTime()) / (1000 * 60));

      let urgencia: 'critico' | 'proximo' | 'programado' = 'programado';
      if (minutosHastaCita <= 60 && minutosHastaCita >= 0) {
        urgencia = 'critico';
      } else if (minutosHastaCita > 60 && minutosHastaCita <= 120) {
        urgencia = 'proximo';
      }

      // Obtener primer pago (debería ser único por cita)
      const pagoCita = Array.isArray(cita.PagoCita) ? cita.PagoCita[0] : cita.PagoCita;

      return {
        id: cita.id,
        paciente: {
          id: cita.Usuario?.id || '',
          nombre: cita.Usuario?.nombre || '',
          apellido: cita.Usuario?.apellido || null,
          foto_perfil: cita.Usuario?.imagen || null,
        },
        fecha_hora: fechaCita,
        duracion: cita.duracion || 60,
        modalidad: cita.modalidad || 'virtual',
        estado: cita.estado || 'pendiente',
        motivo_consulta: cita.motivo_consulta || null,
        link_videollamada: cita.link_videollamada || null,
        pago: pagoCita
          ? {
              id: pagoCita.id,
              monto: pagoCita.monto,
              moneda: pagoCita.moneda || 'COP',
              estado: pagoCita.estado || 'pendiente',
              fecha_pago: pagoCita.fecha_pago ? new Date(pagoCita.fecha_pago) : null,
            }
          : null,
        minutos_hasta_cita: minutosHastaCita,
        urgencia,
      };
    });

    return { data: citasFormateadas, error: null };
  } catch (error) {
    console.error('Error en obtenerCitasHoy:', error);
    return { data: null, error };
  }
}

/**
 * Tipo para un pago con información completa de cita y paciente
 */
export interface PagoConDetalles {
  id: string;
  cita_id: string;
  usuario_id: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'reembolsado' | 'cancelado';
  fecha_pago: Date | null;
  stripe_payment_intent_id: string | null;
  cita: {
    id: string;
    fecha_hora: Date;
    duracion: number;
    modalidad: 'virtual' | 'presencial';
    estado: string;
  };
  paciente: {
    id: string;
    nombre: string;
    apellido: string | null;
    email: string;
    foto_perfil?: string | null;
  };
  creado_en: Date;
}

/**
 * Filtros para obtener pagos
 */
export interface FiltrosPagos {
  fechaInicio?: Date;
  fechaFin?: Date;
  estado?: 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'reembolsado' | 'cancelado';
  pacienteId?: string;
  montoMin?: number;
  montoMax?: number;
}

/**
 * Obtiene los pagos del profesional con filtros opcionales
 * Incluye información completa de cita y paciente
 *
 * @param profesionalId - ID del profesional (terapeuta)
 * @param filtros - Filtros opcionales para la consulta
 * @returns Array de pagos con detalles completos
 */
export async function obtenerPagosProfesional(
  profesionalId: string,
  filtros?: FiltrosPagos
): Promise<{ data: PagoConDetalles[] | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();

    // Construir query base
    let query = supabase
      .from('PagoCita')
      .select(
        `
        id,
        cita_id,
        usuario_id,
        monto,
        moneda,
        estado,
        fecha_pago,
        stripe_payment_intent_id,
        creado_en,
        Cita!inner(
          id,
          fecha_hora,
          duracion,
          modalidad,
          estado,
          profesional_id,
          Usuario:paciente_id(
            id,
            nombre,
            apellido,
            email,
            imagen
          )
        )
      `
      )
      .eq('Cita.profesional_id', profesionalId);

    // Aplicar filtros
    if (filtros?.fechaInicio) {
      query = query.gte('fecha_pago', filtros.fechaInicio.toISOString());
    }
    if (filtros?.fechaFin) {
      query = query.lte('fecha_pago', filtros.fechaFin.toISOString());
    }
    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado);
    }
    if (filtros?.pacienteId) {
      query = query.eq('usuario_id', filtros.pacienteId);
    }
    if (filtros?.montoMin !== undefined) {
      query = query.gte('monto', filtros.montoMin);
    }
    if (filtros?.montoMax !== undefined) {
      query = query.lte('monto', filtros.montoMax);
    }

    const { data: pagos, error: errorPagos } = await query.order('fecha_pago', {
      ascending: false,
      nullsFirst: false,
    });

    if (errorPagos) {
      console.error('Error obteniendo pagos del profesional:', errorPagos);
      return { data: null, error: errorPagos };
    }

    if (!pagos || pagos.length === 0) {
      return { data: [], error: null };
    }

    const pagosFormateados: PagoConDetalles[] = pagos.map((pago: any) => ({
      id: pago.id,
      cita_id: pago.cita_id,
      usuario_id: pago.usuario_id,
      monto: pago.monto,
      moneda: pago.moneda || 'COP',
      estado: pago.estado || 'pendiente',
      fecha_pago: pago.fecha_pago ? new Date(pago.fecha_pago) : null,
      stripe_payment_intent_id: pago.stripe_payment_intent_id,
      cita: {
        id: pago.Cita.id,
        fecha_hora: new Date(pago.Cita.fecha_hora),
        duracion: pago.Cita.duracion,
        modalidad: pago.Cita.modalidad,
        estado: pago.Cita.estado,
      },
      paciente: {
        id: pago.Cita.Usuario?.id || '',
        nombre: pago.Cita.Usuario?.nombre || '',
        apellido: pago.Cita.Usuario?.apellido || null,
        email: pago.Cita.Usuario?.email || '',
        foto_perfil: pago.Cita.Usuario?.imagen || null,
      },
      creado_en: new Date(pago.creado_en),
    }));

    return { data: pagosFormateados, error: null };
  } catch (error) {
    console.error('Error en obtenerPagosProfesional:', error);
    return { data: null, error };
  }
}

/**
 * Tipo para resumen financiero del profesional
 */
export interface ResumenFinanciero {
  ingresosMesActual: number;
  ingresosMesAnterior: number;
  cambioMensual: {
    valor: number;
    porcentaje: number;
    tipo: 'positivo' | 'negativo' | 'neutro';
  };
  pagosPendientes: number;
  pagosCompletados: number;
  totalPagos: number;
  tendenciaUltimos6Meses: {
    mes: string;
    ingresos: number;
    pagos: number;
  }[];
  topPacientes: {
    paciente: {
      id: string;
      nombre: string;
      apellido: string | null;
    };
    totalPagado: number;
    numeroPagos: number;
  }[];
}

/**
 * Obtiene el resumen financiero completo del profesional
 * Incluye ingresos, tendencias y top pacientes
 *
 * @param profesionalId - ID del profesional (terapeuta)
 * @returns Resumen financiero completo
 */
export async function obtenerResumenFinanciero(
  profesionalId: string
): Promise<{ data: ResumenFinanciero | null; error: any }> {
  try {
    const supabase = obtenerClienteNavegador();
    const ahora = new Date();

    // Calcular fechas
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMesActual = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);
    const inicio6MesesAtras = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);

    // Obtener todos los pagos desde hace 6 meses
    const { data: pagosHistoricos, error: errorHistorico } = await supabase
      .from('PagoCita')
      .select(
        `
        id,
        monto,
        estado,
        fecha_pago,
        usuario_id,
        Cita!inner(
          profesional_id,
          Usuario:paciente_id(
            id,
            nombre,
            apellido
          )
        )
      `
      )
      .eq('Cita.profesional_id', profesionalId)
      .gte('creado_en', inicio6MesesAtras.toISOString())
      .order('fecha_pago', { ascending: false });

    if (errorHistorico) {
      console.error('Error obteniendo pagos históricos:', errorHistorico);
      return { data: null, error: errorHistorico };
    }

    // Calcular métricas del mes actual
    const pagosMesActual = (pagosHistoricos || []).filter((p: any) => {
      const fechaPago = p.fecha_pago ? new Date(p.fecha_pago) : new Date(p.creado_en);
      return fechaPago >= inicioMesActual && fechaPago <= finMesActual;
    });

    const ingresosMesActual = pagosMesActual
      .filter((p: any) => p.estado === 'completado')
      .reduce((sum: number, p: any) => sum + Number(p.monto), 0);

    const pagosPendientes = pagosMesActual.filter(
      (p: any) => p.estado === 'pendiente' || p.estado === 'procesando'
    ).length;

    const pagosCompletados = pagosMesActual.filter((p: any) => p.estado === 'completado').length;

    // Calcular métricas del mes anterior
    const pagosMesAnterior = (pagosHistoricos || []).filter((p: any) => {
      const fechaPago = p.fecha_pago ? new Date(p.fecha_pago) : new Date(p.creado_en);
      return fechaPago >= inicioMesAnterior && fechaPago <= finMesAnterior;
    });

    const ingresosMesAnterior = pagosMesAnterior
      .filter((p: any) => p.estado === 'completado')
      .reduce((sum: number, p: any) => sum + Number(p.monto), 0);

    // Calcular cambio mensual
    const cambioValor = ingresosMesActual - ingresosMesAnterior;
    const cambioPorcentaje =
      ingresosMesAnterior > 0 ? Math.round((cambioValor / ingresosMesAnterior) * 100) : 0;

    const cambioMensual = {
      valor: cambioValor,
      porcentaje: Math.abs(cambioPorcentaje),
      tipo:
        cambioValor > 0 ? ('positivo' as const) : cambioValor < 0 ? ('negativo' as const) : ('neutro' as const),
    };

    // Calcular tendencia últimos 6 meses
    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const tendenciaUltimos6Meses = [];

    for (let i = 5; i >= 0; i--) {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const finMes = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0, 23, 59, 59);

      const pagosMes = (pagosHistoricos || []).filter((p: any) => {
        const fechaPago = p.fecha_pago ? new Date(p.fecha_pago) : new Date(p.creado_en);
        return fechaPago >= inicioMes && fechaPago <= finMes;
      });

      const ingresosMes = pagosMes
        .filter((p: any) => p.estado === 'completado')
        .reduce((sum: number, p: any) => sum + Number(p.monto), 0);

      tendenciaUltimos6Meses.push({
        mes: MESES[inicioMes.getMonth()],
        ingresos: ingresosMes,
        pagos: pagosMes.length,
      });
    }

    // Calcular top 5 pacientes por monto pagado
    const pagosPorPaciente = new Map<string, { paciente: any; totalPagado: number; numeroPagos: number }>();

    for (const pago of pagosHistoricos || []) {
      if (pago.estado !== 'completado') continue;

      const pacienteId = pago.Cita?.Usuario?.id;
      if (!pacienteId) continue;

      if (!pagosPorPaciente.has(pacienteId)) {
        pagosPorPaciente.set(pacienteId, {
          paciente: {
            id: pacienteId,
            nombre: pago.Cita.Usuario.nombre,
            apellido: pago.Cita.Usuario.apellido,
          },
          totalPagado: 0,
          numeroPagos: 0,
        });
      }

      const registro = pagosPorPaciente.get(pacienteId)!;
      registro.totalPagado += Number(pago.monto);
      registro.numeroPagos += 1;
    }

    const topPacientes = Array.from(pagosPorPaciente.values())
      .sort((a, b) => b.totalPagado - a.totalPagado)
      .slice(0, 5);

    const resumen: ResumenFinanciero = {
      ingresosMesActual,
      ingresosMesAnterior,
      cambioMensual,
      pagosPendientes,
      pagosCompletados,
      totalPagos: pagosMesActual.length,
      tendenciaUltimos6Meses,
      topPacientes,
    };

    return { data: resumen, error: null };
  } catch (error) {
    console.error('Error en obtenerResumenFinanciero:', error);
    return { data: null, error };
  }
}
