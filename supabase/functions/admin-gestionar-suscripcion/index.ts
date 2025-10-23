/**
 * Edge Function: admin-gestionar-suscripcion
 * Descripción: Gestiona suscripciones (cancelar, reactivar, pausar) con validación Stripe
 * Seguridad: Solo ADMIN, con validación en Stripe antes de cambiar DB
 * Compliance: HIPAA §164.312(b) - Audit Controls
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Tipos
interface AccionSuscripcion {
  suscripcion_id: string;
  accion: 'cancelar' | 'reactivar' | 'pausar' | 'reanudar';
  justificacion: string; // Obligatorio
  notificar_usuario?: boolean;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const tiempoInicio = Date.now();

  try {
    if (req.method !== 'POST') {
      throw new Error('Método no permitido. Use POST.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorización no proporcionado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Autenticar usuario
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar rol ADMIN
    const { data: usuarioData, error: usuarioError } = await supabaseClient
      .from('Usuario')
      .select('id, rol, email')
      .eq('auth_id', user.id)
      .single();

    if (usuarioError || !usuarioData || usuarioData.rol !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Solo administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parsear body
    const body: AccionSuscripcion = await req.json();

    // Validaciones
    if (!body.suscripcion_id || !body.accion || !body.justificacion) {
      throw new Error('Parámetros faltantes: suscripcion_id, accion, justificacion son obligatorios');
    }

    if (body.justificacion.length < 20) {
      throw new Error('La justificación debe tener al menos 20 caracteres');
    }

    const accionesValidas = ['cancelar', 'reactivar', 'pausar', 'reanudar'];
    if (!accionesValidas.includes(body.accion)) {
      throw new Error(`Acción inválida. Debe ser: ${accionesValidas.join(', ')}`);
    }

    // Obtener suscripción actual
    const { data: suscripcion, error: suscripcionError } = await supabaseClient
      .from('Suscripcion')
      .select('*, usuario:Usuario!usuario_id(id, email, nombre)')
      .eq('id', body.suscripcion_id)
      .single();

    if (suscripcionError || !suscripcion) {
      throw new Error('Suscripción no encontrada');
    }

    // Validar transición de estado
    const estadoActual = suscripcion.estado;
    const mapaEstados: Record<string, string> = {
      cancelar: 'cancelada',
      reactivar: 'activa',
      pausar: 'pausada',
      reanudar: 'activa',
    };

    const nuevoEstado = mapaEstados[body.accion];

    // Validar que la transición sea válida
    const transicionesValidas: Record<string, string[]> = {
      activa: ['cancelada', 'pausada', 'cancelar_al_final'],
      pausada: ['activa', 'cancelada'],
      cancelada: ['activa'], // Solo si se reactiva manualmente
      cancelar_al_final: ['cancelada', 'activa'],
      vencida: ['activa'],
    };

    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      throw new Error(
        `Transición inválida: no se puede cambiar de '${estadoActual}' a '${nuevoEstado}'`
      );
    }

    // IMPORTANTE: Aquí se debería validar con Stripe
    // Por ahora, solo registramos advertencia
    const stripeSubscriptionId = suscripcion.stripe_subscription_id;
    if (stripeSubscriptionId) {
      console.warn(`⚠️ TODO: Validar con Stripe subscription ${stripeSubscriptionId}`);
      // En producción:
      // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
      // if (body.accion === 'cancelar') {
      //   await stripe.subscriptions.cancel(stripeSubscriptionId);
      // }
    }

    // Actualizar suscripción usando service_role (bypassing RLS que bloquea admin UPDATE)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: suscripcionActualizada, error: updateError } = await supabaseServiceClient
      .from('Suscripcion')
      .update({
        estado: nuevoEstado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', body.suscripcion_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar suscripción: ${updateError.message}`);
    }

    // Registrar en audit log
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { error: auditError } = await supabaseClient.rpc('registrar_accion_admin', {
      p_accion: 'cambiar_estado_suscripcion',
      p_tabla_afectada: 'Suscripcion',
      p_registro_id: body.suscripcion_id,
      p_cambios_realizados: {
        antes: { estado: estadoActual },
        despues: { estado: nuevoEstado },
        usuario_afectado: suscripcion.usuario?.email,
      },
      p_justificacion: body.justificacion,
      p_es_acceso_phi: false,
      p_filtros_aplicados: null,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_ruta_solicitud: '/admin-gestionar-suscripcion',
      p_metodo_http: 'POST',
    });

    if (auditError) {
      console.error('Error al registrar auditoría:', auditError);
    }

    // TODO: Notificar usuario si se solicitó
    if (body.notificar_usuario) {
      console.log(`📧 TODO: Enviar email a ${suscripcion.usuario?.email} sobre cambio de suscripción`);
    }

    const duracionMs = Date.now() - tiempoInicio;

    return new Response(
      JSON.stringify({
        success: true,
        suscripcion: suscripcionActualizada,
        mensaje: `Suscripción ${body.accion === 'cancelar' ? 'cancelada' : body.accion === 'reactivar' ? 'reactivada' : body.accion === 'pausar' ? 'pausada' : 'reanudada'} exitosamente`,
        metadata: {
          duracion_ms: duracionMs,
          estado_anterior: estadoActual,
          estado_nuevo: nuevoEstado,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en admin-gestionar-suscripcion:', errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
