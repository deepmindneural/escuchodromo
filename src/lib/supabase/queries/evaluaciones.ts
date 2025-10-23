/**
 * Queries para obtener evaluaciones y resultados de pacientes
 * Incluye PHQ-9, GAD-7 y otros tests psicológicos
 */

import { obtenerClienteNavegador } from '../cliente';

export interface EvaluacionDetalle {
  id: string;
  test_id: string;
  usuario_id: string;
  respuestas: Record<string, any>;
  puntuacion: number;
  severidad: string | null;
  interpretacion: string | null;
  creado_en: string;
  test: {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    categoria: string;
  };
}

export interface EvolucionScore {
  fecha: string;
  puntuacion: number;
  severidad: string | null;
  codigo_test: string;
}

export interface ResumenEvaluaciones {
  total: number;
  phq9: {
    ultima_puntuacion: number | null;
    ultima_severidad: string | null;
    fecha_ultima: string | null;
    total_realizadas: number;
  };
  gad7: {
    ultima_puntuacion: number | null;
    ultima_severidad: string | null;
    fecha_ultima: string | null;
    total_realizadas: number;
  };
  otras: {
    total: number;
    tipos: string[];
  };
}

/**
 * Obtiene todas las evaluaciones de un paciente ordenadas por fecha
 */
export async function obtenerEvaluacionesPaciente(
  pacienteId: string,
  limite: number = 20
): Promise<EvaluacionDetalle[]> {
  const supabase = obtenerClienteNavegador();

  const { data, error } = await supabase
    .from('Evaluacion')
    .select(`
      id,
      test_id,
      usuario_id,
      respuestas,
      puntuacion,
      severidad,
      interpretacion,
      creado_en,
      Test!inner (
        id,
        codigo,
        nombre,
        descripcion,
        categoria
      )
    `)
    .eq('usuario_id', pacienteId)
    .order('creado_en', { ascending: false })
    .limit(limite);

  if (error) {
    console.error('Error al obtener evaluaciones:', error);
    throw error;
  }

  // Transformar la respuesta para que coincida con la interfaz
  return (data || []).map((item: any) => ({
    ...item,
    test: item.Test,
  })) as EvaluacionDetalle[];
}

/**
 * Obtiene el detalle completo de una evaluación específica
 */
export async function obtenerDetalleEvaluacion(
  evaluacionId: string
): Promise<EvaluacionDetalle | null> {
  const supabase = obtenerClienteNavegador();

  const { data, error } = await supabase
    .from('Evaluacion')
    .select(`
      id,
      test_id,
      usuario_id,
      respuestas,
      puntuacion,
      severidad,
      interpretacion,
      creado_en,
      Test!inner (
        id,
        codigo,
        nombre,
        descripcion,
        categoria
      )
    `)
    .eq('id', evaluacionId)
    .single();

  if (error) {
    console.error('Error al obtener detalle de evaluación:', error);
    return null;
  }

  // Transformar la respuesta
  return {
    ...data,
    test: (data as any).Test,
  } as EvaluacionDetalle;
}

/**
 * Obtiene la evolución temporal de scores PHQ-9
 */
export async function obtenerEvolucionPHQ9(
  pacienteId: string,
  limite: number = 10
): Promise<EvolucionScore[]> {
  const supabase = obtenerClienteNavegador();

  // Buscamos test con código PHQ9 (sin guión)
  const { data: testData } = await supabase
    .from('Test')
    .select('id')
    .eq('codigo', 'PHQ9')
    .single();

  if (!testData) {
    return [];
  }

  const { data, error } = await supabase
    .from('Evaluacion')
    .select('creado_en, puntuacion, severidad')
    .eq('usuario_id', pacienteId)
    .eq('test_id', testData.id)
    .order('creado_en', { ascending: true })
    .limit(limite);

  if (error) {
    console.error('Error al obtener evolución PHQ-9:', error);
    return [];
  }

  return (data || []).map((item) => ({
    fecha: item.creado_en,
    puntuacion: item.puntuacion,
    severidad: item.severidad,
    codigo_test: 'PHQ9',
  }));
}

/**
 * Obtiene la evolución temporal de scores GAD-7
 */
export async function obtenerEvolucionGAD7(
  pacienteId: string,
  limite: number = 10
): Promise<EvolucionScore[]> {
  const supabase = obtenerClienteNavegador();

  // Buscamos test con código GAD7 (sin guión)
  const { data: testData } = await supabase
    .from('Test')
    .select('id')
    .eq('codigo', 'GAD7')
    .single();

  if (!testData) {
    return [];
  }

  const { data, error } = await supabase
    .from('Evaluacion')
    .select('creado_en, puntuacion, severidad')
    .eq('usuario_id', pacienteId)
    .eq('test_id', testData.id)
    .order('creado_en', { ascending: true })
    .limit(limite);

  if (error) {
    console.error('Error al obtener evolución GAD-7:', error);
    return [];
  }

  return (data || []).map((item) => ({
    fecha: item.creado_en,
    puntuacion: item.puntuacion,
    severidad: item.severidad,
    codigo_test: 'GAD7',
  }));
}

/**
 * Obtiene un resumen completo de todas las evaluaciones del paciente
 */
export async function obtenerResumenEvaluaciones(
  pacienteId: string
): Promise<ResumenEvaluaciones> {
  const supabase = obtenerClienteNavegador();

  // Obtener todas las evaluaciones
  const { data: evaluaciones, error } = await supabase
    .from('Evaluacion')
    .select(`
      id,
      test_id,
      puntuacion,
      severidad,
      creado_en,
      Test!inner (codigo, nombre)
    `)
    .eq('usuario_id', pacienteId)
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('Error al obtener resumen de evaluaciones:', error);
    throw error;
  }

  const total = evaluaciones?.length || 0;

  // Filtrar PHQ9 (sin guión)
  const phq9List = (evaluaciones || []).filter(
    (e: any) => e.Test?.codigo === 'PHQ9'
  );
  const ultimaPhq9 = phq9List[0];

  // Filtrar GAD7 (sin guión)
  const gad7List = (evaluaciones || []).filter(
    (e: any) => e.Test?.codigo === 'GAD7'
  );
  const ultimaGad7 = gad7List[0];

  // Otras evaluaciones
  const otras = (evaluaciones || []).filter(
    (e: any) => e.Test?.codigo !== 'PHQ9' && e.Test?.codigo !== 'GAD7'
  );
  const tiposUnicos = [
    ...new Set(otras.map((e: any) => e.Test?.nombre || 'Desconocido')),
  ];

  return {
    total,
    phq9: {
      ultima_puntuacion: ultimaPhq9?.puntuacion || null,
      ultima_severidad: ultimaPhq9?.severidad || null,
      fecha_ultima: ultimaPhq9?.creado_en || null,
      total_realizadas: phq9List.length,
    },
    gad7: {
      ultima_puntuacion: ultimaGad7?.puntuacion || null,
      ultima_severidad: ultimaGad7?.severidad || null,
      fecha_ultima: ultimaGad7?.creado_en || null,
      total_realizadas: gad7List.length,
    },
    otras: {
      total: otras.length,
      tipos: tiposUnicos,
    },
  };
}

/**
 * Obtiene la última evaluación completada de un tipo específico
 */
export async function obtenerUltimaEvaluacionPorTipo(
  pacienteId: string,
  codigoTest: string
): Promise<EvaluacionDetalle | null> {
  const supabase = obtenerClienteNavegador();

  // Primero obtenemos el ID del test
  const { data: testData } = await supabase
    .from('Test')
    .select('id')
    .eq('codigo', codigoTest)
    .single();

  if (!testData) {
    return null;
  }

  const { data, error } = await supabase
    .from('Evaluacion')
    .select(`
      id,
      test_id,
      usuario_id,
      respuestas,
      puntuacion,
      severidad,
      interpretacion,
      creado_en,
      Test!inner (
        id,
        codigo,
        nombre,
        descripcion,
        categoria
      )
    `)
    .eq('usuario_id', pacienteId)
    .eq('test_id', testData.id)
    .order('creado_en', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error(`Error al obtener última evaluación ${codigoTest}:`, error);
    return null;
  }

  // Transformar la respuesta
  return {
    ...data,
    test: (data as any).Test,
  } as EvaluacionDetalle;
}

/**
 * Helper para interpretar la severidad de PHQ-9
 */
export function interpretarSeveridadPHQ9(puntuacion: number): {
  severidad: string;
  descripcion: string;
  color: string;
} {
  if (puntuacion <= 4) {
    return {
      severidad: 'Mínima',
      descripcion: 'Depresión mínima o ausente',
      color: 'green',
    };
  } else if (puntuacion <= 9) {
    return {
      severidad: 'Leve',
      descripcion: 'Depresión leve',
      color: 'yellow',
    };
  } else if (puntuacion <= 14) {
    return {
      severidad: 'Moderada',
      descripcion: 'Depresión moderada',
      color: 'orange',
    };
  } else if (puntuacion <= 19) {
    return {
      severidad: 'Moderadamente severa',
      descripcion: 'Depresión moderadamente severa',
      color: 'red',
    };
  } else {
    return {
      severidad: 'Severa',
      descripcion: 'Depresión severa',
      color: 'red',
    };
  }
}

/**
 * Helper para interpretar la severidad de GAD-7
 */
export function interpretarSeveridadGAD7(puntuacion: number): {
  severidad: string;
  descripcion: string;
  color: string;
} {
  if (puntuacion <= 4) {
    return {
      severidad: 'Mínima',
      descripcion: 'Ansiedad mínima o ausente',
      color: 'green',
    };
  } else if (puntuacion <= 9) {
    return {
      severidad: 'Leve',
      descripcion: 'Ansiedad leve',
      color: 'yellow',
    };
  } else if (puntuacion <= 14) {
    return {
      severidad: 'Moderada',
      descripcion: 'Ansiedad moderada',
      color: 'orange',
    };
  } else {
    return {
      severidad: 'Severa',
      descripcion: 'Ansiedad severa',
      color: 'red',
    };
  }
}
