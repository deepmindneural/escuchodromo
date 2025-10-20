import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

// Tipos MIME permitidos para documentos profesionales
const MIME_TYPES_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

// Tamaño máximo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * EDGE FUNCTION: Subir Documento Profesional
 *
 * Endpoint seguro para subir documentos de validación profesional
 * (títulos, licencias, cédulas, certificados).
 *
 * Cumple con HIPAA §164.312(b) - Control de acceso a documentación.
 *
 * Método: POST
 * Content-Type: multipart/form-data
 * Body:
 *   - archivo: File (PDF, JPG, PNG)
 *   - tipo: 'licencia' | 'titulo' | 'cedula' | 'certificado'
 *   - email_temporal: string (para identificar la sesión de registro)
 *
 * Seguridad:
 * - Validar tipo MIME del archivo
 * - Validar tamaño máximo (10MB)
 * - Sanitizar nombre de archivo
 * - Rate limiting: 10 archivos por IP por hora
 * - Almacenar en bucket privado 'documentos-profesionales'
 * - Generar UUID único para evitar colisiones
 *
 * Response:
 * {
 *   success: true,
 *   url_storage: string,
 *   nombre_archivo: string,
 *   tamano: number,
 *   mime_type: string
 * }
 */
serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Método no permitido' }),
      { status: 405, headers: CORS_HEADERS }
    )
  }

  try {
    // ==========================================
    // CONFIGURACIÓN
    // ==========================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // ==========================================
    // RATE LIMITING: 10 archivos por hora por IP
    // ==========================================
    const { data: rateLimitOk } = await supabase.rpc('verificar_rate_limit_registro', {
      p_ip_address: ip,
      p_tipo_accion: 'subir_documento',
      p_max_intentos: 10,
      p_ventana_horas: 1,
    })

    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ha excedido el límite de subida de documentos. Intente en 1 hora.',
        }),
        { status: 429, headers: CORS_HEADERS }
      )
    }

    // ==========================================
    // PARSEAR MULTIPART/FORM-DATA
    // ==========================================
    const formData = await req.formData()
    const archivo = formData.get('archivo') as File
    const tipo = formData.get('tipo') as string
    const emailTemporal = formData.get('email_temporal') as string

    if (!archivo) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se proporcionó archivo' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    if (!tipo || !['licencia', 'titulo', 'cedula', 'certificado'].includes(tipo)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tipo de documento inválido' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    if (!emailTemporal) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email temporal no proporcionado' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // ==========================================
    // VALIDACIONES DE SEGURIDAD
    // ==========================================

    // 1. Validar tamaño del archivo
    if (archivo.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `El archivo excede el tamaño máximo permitido de 10MB. Tamaño: ${(archivo.size / 1024 / 1024).toFixed(2)}MB`,
        }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // 2. Validar tipo MIME
    if (!MIME_TYPES_PERMITIDOS.includes(archivo.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, PNG. Recibido: ${archivo.type}`,
        }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // ==========================================
    // GENERAR NOMBRE SEGURO PARA EL ARCHIVO
    // ==========================================
    // Formato: documentos-profesionales/{email_hash}/{tipo}_{timestamp}_{uuid}.{ext}

    const timestamp = Date.now()
    const uuid = crypto.randomUUID().split('-')[0]
    const extension = archivo.name.split('.').pop()?.toLowerCase() || 'pdf'

    // Hash simple del email para organizar carpetas
    const emailHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(emailTemporal)
    )
    const emailHashHex = Array.from(new Uint8Array(emailHash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16)

    const nombreArchivo = `${tipo}_${timestamp}_${uuid}.${extension}`
    const rutaCompleta = `${emailHashHex}/${nombreArchivo}`

    console.log('[SUBIR DOCUMENTO] Preparando subida:', {
      tipo,
      tamano: archivo.size,
      mime_type: archivo.type,
      ruta: rutaCompleta,
    })

    // ==========================================
    // SUBIR ARCHIVO A STORAGE
    // ==========================================
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos-profesionales')
      .upload(rutaCompleta, archivo, {
        contentType: archivo.type,
        cacheControl: '3600',
        upsert: false, // No sobrescribir si ya existe
      })

    if (uploadError) {
      console.error('[SUBIR DOCUMENTO] Error al subir archivo:', uploadError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error al subir archivo: ${uploadError.message}`,
        }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    // ==========================================
    // REGISTRAR INTENTO EN RATE LIMITING
    // ==========================================
    await supabase.rpc('registrar_intento_registro', {
      p_ip_address: ip,
      p_tipo_accion: 'subir_documento',
      p_email_intento: emailTemporal,
      p_user_agent: req.headers.get('user-agent') || 'unknown',
      p_exitoso: true,
    })

    // ==========================================
    // RESPUESTA EXITOSA
    // ==========================================
    const urlStorage = uploadData.path

    console.log('[SUBIR DOCUMENTO] Archivo subido exitosamente:', urlStorage)

    return new Response(
      JSON.stringify({
        success: true,
        url_storage: urlStorage,
        nombre_archivo: nombreArchivo,
        tamano: archivo.size,
        mime_type: archivo.type,
      }),
      { status: 200, headers: CORS_HEADERS }
    )
  } catch (error: any) {
    console.error('[SUBIR DOCUMENTO] Error fatal:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor',
      }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
