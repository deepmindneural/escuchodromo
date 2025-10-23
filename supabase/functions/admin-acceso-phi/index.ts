/**
 * Edge Function: admin-acceso-phi
 * Descripción: Registra justificación de admin para acceder a PHI (mensajes, evaluaciones)
 * Seguridad: Crea sesión temporal de acceso (10 minutos) con justificación registrada
 * Compliance: HIPAA §164.312(b) - Audit Controls, "Break the Glass" audit trail
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface SolicitudAccesoPHI {
  tipo_recurso: 'mensajes' | 'evaluaciones' | 'notas_sesion' | 'conversaciones';
  justificacion: string; // Mínimo 30 caracteres
  usuario_afectado_id?: string; // Opcional: si es para usuario específico
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    // Autenticar
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
    const body: SolicitudAccesoPHI = await req.json();

    // Validaciones estrictas
    if (!body.tipo_recurso || !body.justificacion) {
      throw new Error('Parámetros faltantes: tipo_recurso y justificacion son obligatorios');
    }

    if (body.justificacion.length < 30) {
      throw new Error(
        'La justificación debe tener al menos 30 caracteres. Explique por qué necesita acceder a esta información médica protegida.'
      );
    }

    const tiposValidos = ['mensajes', 'evaluaciones', 'notas_sesion', 'conversaciones'];
    if (!tiposValidos.includes(body.tipo_recurso)) {
      throw new Error(`Tipo de recurso inválido. Debe ser: ${tiposValidos.join(', ')}`);
    }

    // Mapear tipo de recurso a acción de auditoría
    const mapaAcciones: Record<string, string> = {
      mensajes: 'ver_mensajes',
      evaluaciones: 'ver_evaluaciones',
      notas_sesion: 'ver_notas_sesion',
      conversaciones: 'ver_conversaciones',
    };

    const accion = mapaAcciones[body.tipo_recurso];

    // Extraer contexto
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Registrar justificación en audit log (esto habilita RLS por 10 minutos)
    const { error: auditError, data: auditData } = await supabaseClient.rpc(
      'registrar_accion_admin',
      {
        p_accion: accion,
        p_tabla_afectada: body.tipo_recurso,
        p_registro_id: body.usuario_afectado_id || null,
        p_cambios_realizados: null,
        p_justificacion: body.justificacion,
        p_es_acceso_phi: true, // ⚠️ CRÍTICO: Marca como acceso a PHI
        p_filtros_aplicados: null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_ruta_solicitud: '/admin-acceso-phi',
        p_metodo_http: 'POST',
      }
    );

    if (auditError) {
      console.error('Error al registrar auditoría:', auditError);
      throw new Error('No se pudo registrar la justificación de acceso');
    }

    // Calcular timestamp de expiración (10 minutos)
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000);

    // Enviar alerta a otros admins (opcional, para transparencia)
    console.log(
      `🚨 ALERTA: Admin ${usuarioData.email} solicitó acceso a ${body.tipo_recurso} - Justificación: ${body.justificacion}`
    );

    // TODO: En producción, enviar notificación a canal de Slack/Discord de seguridad

    return new Response(
      JSON.stringify({
        success: true,
        mensaje: 'Acceso a PHI autorizado temporalmente',
        acceso: {
          tipo_recurso: body.tipo_recurso,
          expira_en: expiraEn.toISOString(),
          duracion_minutos: 10,
          justificacion_registrada: true,
          audit_id: auditData,
        },
        advertencia:
          '⚠️ Este acceso ha sido registrado en el audit log. Cualquier uso indebido será investigado.',
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
    console.error('Error en admin-acceso-phi:', errorMessage);

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
