import { obtenerClienteNavegador } from './supabase/cliente';

/**
 * Tipos de planes disponibles en Escuchodromo
 */
export type TipoPlan = 'basico' | 'premium' | 'profesional' | null;

/**
 * Características disponibles en la plataforma
 */
export type Caracteristica =
  | 'chat_basico'
  | 'chat_ilimitado'
  | 'evaluaciones_basicas'
  | 'evaluaciones_avanzadas'
  | 'recomendaciones_ia'
  | 'analisis_emocional'
  | 'voz_interactiva'
  | 'historial_completo'
  | 'exportar_reportes'
  | 'soporte_prioritario'
  | 'sesiones_terapeuticas';

/**
 * Límites por plan
 */
interface LimitesPlan {
  mensajesChat: number | 'ilimitado';
  evaluacionesMes: number | 'ilimitado';
  almacenamientoHistorial: number; // días
  exportarReportes: boolean;
  soportePrioritario: boolean;
  sesionesTerapeuticas: number;
}

/**
 * Configuración de características por plan
 */
const caracteristicasPorPlan: Record<TipoPlan, Caracteristica[]> = {
  null: [
    'chat_basico',
    'evaluaciones_basicas',
  ],
  basico: [
    'chat_basico',
    'evaluaciones_basicas',
    'recomendaciones_ia',
    'historial_completo',
  ],
  premium: [
    'chat_ilimitado',
    'evaluaciones_basicas',
    'evaluaciones_avanzadas',
    'recomendaciones_ia',
    'analisis_emocional',
    'voz_interactiva',
    'historial_completo',
    'exportar_reportes',
  ],
  profesional: [
    'chat_ilimitado',
    'evaluaciones_basicas',
    'evaluaciones_avanzadas',
    'recomendaciones_ia',
    'analisis_emocional',
    'voz_interactiva',
    'historial_completo',
    'exportar_reportes',
    'soporte_prioritario',
    'sesiones_terapeuticas',
  ],
};

/**
 * Límites por plan
 */
const limitesPorPlan: Record<TipoPlan, LimitesPlan> = {
  null: {
    mensajesChat: 10,
    evaluacionesMes: 1,
    almacenamientoHistorial: 7,
    exportarReportes: false,
    soportePrioritario: false,
    sesionesTerapeuticas: 0,
  },
  basico: {
    mensajesChat: 100,
    evaluacionesMes: 5,
    almacenamientoHistorial: 30,
    exportarReportes: false,
    soportePrioritario: false,
    sesionesTerapeuticas: 0,
  },
  premium: {
    mensajesChat: 'ilimitado',
    evaluacionesMes: 'ilimitado',
    almacenamientoHistorial: 365,
    exportarReportes: true,
    soportePrioritario: false,
    sesionesTerapeuticas: 0,
  },
  profesional: {
    mensajesChat: 'ilimitado',
    evaluacionesMes: 'ilimitado',
    almacenamientoHistorial: 730,
    exportarReportes: true,
    soportePrioritario: true,
    sesionesTerapeuticas: 4,
  },
};

/**
 * Información del plan del usuario
 */
export interface InfoPlanUsuario {
  plan: TipoPlan;
  caracteristicas: Caracteristica[];
  limites: LimitesPlan;
  suscripcionActiva: boolean;
  fechaVencimiento?: string;
}

/**
 * Obtiene el plan actual del usuario autenticado
 */
export async function obtenerPlanUsuario(): Promise<InfoPlanUsuario> {
  const supabase = obtenerClienteNavegador();

  try {
    // Obtener sesión actual
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        plan: null,
        caracteristicas: caracteristicasPorPlan[null],
        limites: limitesPorPlan[null],
        suscripcionActiva: false,
      };
    }

    // Obtener usuario y su suscripción activa
    const { data: usuario } = await supabase
      .from('Usuario')
      .select(`
        id,
        Suscripcion (
          id,
          plan,
          estado,
          fin_periodo
        )
      `)
      .eq('auth_id', session.user.id)
      .single();

    if (!usuario || !usuario.Suscripcion || usuario.Suscripcion.length === 0) {
      // Usuario sin suscripción activa
      return {
        plan: null,
        caracteristicas: caracteristicasPorPlan[null],
        limites: limitesPorPlan[null],
        suscripcionActiva: false,
      };
    }

    // Buscar suscripción activa
    const suscripcionActiva = Array.isArray(usuario.Suscripcion)
      ? usuario.Suscripcion.find((s: any) => s.estado === 'activa')
      : usuario.Suscripcion.estado === 'activa' ? usuario.Suscripcion : null;

    if (!suscripcionActiva) {
      return {
        plan: null,
        caracteristicas: caracteristicasPorPlan[null],
        limites: limitesPorPlan[null],
        suscripcionActiva: false,
      };
    }

    const plan = suscripcionActiva.plan as TipoPlan;

    return {
      plan,
      caracteristicas: caracteristicasPorPlan[plan] || [],
      limites: limitesPorPlan[plan] || limitesPorPlan[null],
      suscripcionActiva: true,
      fechaVencimiento: suscripcionActiva.fin_periodo,
    };
  } catch (error) {
    console.error('Error al obtener plan del usuario:', error);
    return {
      plan: null,
      caracteristicas: caracteristicasPorPlan[null],
      limites: limitesPorPlan[null],
      suscripcionActiva: false,
    };
  }
}

/**
 * Verifica si el usuario tiene acceso a una característica específica
 */
export async function tieneAccesoCaracteristica(caracteristica: Caracteristica): Promise<boolean> {
  const { caracteristicas } = await obtenerPlanUsuario();
  return caracteristicas.includes(caracteristica);
}

/**
 * Verifica si el usuario puede realizar una acción basada en sus límites
 */
export async function puedeRealizarAccion(
  tipo: 'mensaje' | 'evaluacion'
): Promise<{ puede: boolean; limite?: number | 'ilimitado'; usado?: number }> {
  const supabase = obtenerClienteNavegador();
  const { plan, limites } = await obtenerPlanUsuario();

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { puede: false, limite: 0 };
    }

    // Obtener usuario_id
    const { data: usuario } = await supabase
      .from('Usuario')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!usuario) {
      return { puede: false, limite: 0 };
    }

    // Calcular fecha de inicio del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    if (tipo === 'mensaje') {
      const limite = limites.mensajesChat;

      if (limite === 'ilimitado') {
        return { puede: true, limite: 'ilimitado' };
      }

      // Contar mensajes del usuario en el mes actual
      const { count } = await supabase
        .from('Mensaje')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id)
        .eq('remitente', 'usuario')
        .gte('creado_en', inicioMes.toISOString());

      const usado = count || 0;
      return {
        puede: usado < limite,
        limite,
        usado,
      };
    }

    if (tipo === 'evaluacion') {
      const limite = limites.evaluacionesMes;

      if (limite === 'ilimitado') {
        return { puede: true, limite: 'ilimitado' };
      }

      // Contar evaluaciones del usuario en el mes actual
      const { count } = await supabase
        .from('Evaluacion')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id)
        .gte('creado_en', inicioMes.toISOString());

      const usado = count || 0;
      return {
        puede: usado < limite,
        limite,
        usado,
      };
    }

    return { puede: false };
  } catch (error) {
    console.error('Error al verificar acción:', error);
    return { puede: false };
  }
}

/**
 * Obtiene el nombre legible del plan
 */
export function obtenerNombrePlan(plan: TipoPlan): string {
  const nombres: Record<TipoPlan, string> = {
    null: 'Gratis',
    basico: 'Básico',
    premium: 'Premium',
    profesional: 'Profesional',
  };
  return nombres[plan];
}

/**
 * Obtiene la descripción del plan
 */
export function obtenerDescripcionPlan(plan: TipoPlan): string {
  const descripciones: Record<TipoPlan, string> = {
    null: 'Acceso limitado a funciones básicas',
    basico: 'Acceso a chat y evaluaciones con límites mensuales',
    premium: 'Acceso ilimitado a todas las funciones principales',
    profesional: 'Acceso completo con soporte prioritario y sesiones terapéuticas',
  };
  return descripciones[plan];
}

/**
 * Obtiene el precio mensual del plan
 */
export function obtenerPrecioPlan(plan: TipoPlan, moneda: 'COP' | 'USD' = 'COP'): number {
  const precios: Record<TipoPlan, { COP: number; USD: number }> = {
    null: { COP: 0, USD: 0 },
    basico: { COP: 29900, USD: 7.99 },
    premium: { COP: 59900, USD: 14.99 },
    profesional: { COP: 129900, USD: 32.99 },
  };
  return precios[plan][moneda];
}
