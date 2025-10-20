/**
 * UTILIDADES PARA REGISTRO DE PROFESIONALES
 *
 * Funciones helper para manejar el registro seguro de profesionales,
 * incluyendo validaciones, subida de documentos y envío de datos.
 */

import { obtenerClienteNavegador } from '@/lib/supabase/cliente'

export interface DocumentoSubido {
  tipo: 'licencia' | 'titulo' | 'cedula' | 'certificado'
  nombre: string
  url_storage: string
  tamano: number
  mime_type: string
}

export interface DatosRegistroProfesional {
  // Paso 1: Datos personales
  email: string
  password: string
  nombre: string
  apellido?: string
  telefono?: string

  // Paso 2: Información profesional
  titulo_profesional: string
  numero_licencia: string
  universidad?: string
  anos_experiencia: number
  especialidades: string[]
  idiomas: string[]
  tarifa_por_sesion: number
  moneda: 'COP' | 'USD'
  biografia?: string

  // Paso 3: Documentos
  documentos: DocumentoSubido[]

  // Consentimiento
  acepta_terminos: boolean
}

/**
 * Subir un documento profesional a Supabase Storage
 *
 * @param archivo - Archivo a subir
 * @param tipo - Tipo de documento
 * @param emailTemporal - Email del profesional (para organizar carpetas)
 * @returns Información del documento subido
 */
export async function subirDocumentoProfesional(
  archivo: File,
  tipo: 'licencia' | 'titulo' | 'cedula' | 'certificado',
  emailTemporal: string
): Promise<DocumentoSubido> {
  const supabase = obtenerClienteNavegador()

  // Crear FormData
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('tipo', tipo)
  formData.append('email_temporal', emailTemporal)

  // Llamar a Edge Function
  const { data, error } = await supabase.functions.invoke('subir-documento-profesional', {
    body: formData,
  })

  if (error) {
    console.error('Error al subir documento:', error)
    throw new Error(`Error al subir documento: ${error.message}`)
  }

  if (!data || !data.success) {
    throw new Error(data?.error || 'Error desconocido al subir documento')
  }

  return {
    tipo,
    nombre: archivo.name,
    url_storage: data.url_storage,
    tamano: data.tamano,
    mime_type: data.mime_type,
  }
}

/**
 * Subir múltiples documentos profesionales
 *
 * @param documentos - Array de archivos con su tipo
 * @param emailTemporal - Email del profesional
 * @param onProgress - Callback para reportar progreso
 * @returns Array de documentos subidos
 */
export async function subirDocumentosProfesionales(
  documentos: Array<{ archivo: File; tipo: 'licencia' | 'titulo' | 'cedula' | 'certificado' }>,
  emailTemporal: string,
  onProgress?: (actual: number, total: number) => void
): Promise<DocumentoSubido[]> {
  const documentosSubidos: DocumentoSubido[] = []

  for (let i = 0; i < documentos.length; i++) {
    const { archivo, tipo } = documentos[i]

    try {
      const docSubido = await subirDocumentoProfesional(archivo, tipo, emailTemporal)
      documentosSubidos.push(docSubido)

      if (onProgress) {
        onProgress(i + 1, documentos.length)
      }
    } catch (error) {
      console.error(`Error al subir documento ${tipo}:`, error)
      throw error
    }
  }

  return documentosSubidos
}

/**
 * Registrar profesional en el sistema
 *
 * @param datos - Datos completos del profesional
 * @returns Resultado del registro
 */
export async function registrarProfesional(datos: DatosRegistroProfesional): Promise<{
  success: boolean
  profesional_id?: string
  perfil_profesional_id?: string
  mensaje?: string
  error?: string
}> {
  const supabase = obtenerClienteNavegador()

  const { data, error } = await supabase.functions.invoke('registrar-profesional', {
    body: datos,
  })

  if (error) {
    console.error('Error al registrar profesional:', error)
    return {
      success: false,
      error: error.message || 'Error al comunicarse con el servidor',
    }
  }

  return data
}

/**
 * Validar campos del formulario de registro profesional
 *
 * @param datos - Datos a validar
 * @param paso - Paso actual del formulario (1, 2 o 3)
 * @returns Objeto con errores encontrados
 */
export function validarFormularioRegistroProfesional(
  datos: Partial<DatosRegistroProfesional>,
  paso: number
): Record<string, string> {
  const errores: Record<string, string> = {}

  // Validaciones Paso 1: Datos personales
  if (paso === 1) {
    if (!datos.nombre?.trim()) {
      errores.nombre = 'El nombre es requerido'
    }

    if (!datos.email?.trim()) {
      errores.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      errores.email = 'Formato de email inválido'
    }

    if (!datos.password) {
      errores.password = 'La contraseña es requerida'
    } else if (datos.password.length < 8) {
      errores.password = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(datos.password)) {
      errores.password =
        'La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales (@$!%*?&#)'
    }
  }

  // Validaciones Paso 2: Información profesional
  if (paso === 2) {
    if (!datos.titulo_profesional?.trim()) {
      errores.titulo_profesional = 'El título profesional es requerido'
    }

    if (!datos.numero_licencia?.trim()) {
      errores.numero_licencia = 'El número de licencia es requerido'
    }

    if (!datos.universidad?.trim()) {
      errores.universidad = 'La universidad es requerida'
    }

    if (datos.anos_experiencia === undefined || datos.anos_experiencia < 0) {
      errores.anos_experiencia = 'Los años de experiencia deben ser 0 o mayor'
    }

    if (!datos.especialidades || datos.especialidades.length === 0) {
      errores.especialidades = 'Selecciona al menos una especialidad'
    }

    if (!datos.tarifa_por_sesion || datos.tarifa_por_sesion <= 0) {
      errores.tarifa_por_sesion = 'La tarifa debe ser mayor a 0'
    }
  }

  // Validaciones Paso 3: Documentos
  if (paso === 3) {
    if (!datos.documentos || datos.documentos.length === 0) {
      errores.documentos = 'Debe subir al menos un documento de validación'
    }

    if (!datos.acepta_terminos) {
      errores.acepta_terminos = 'Debe aceptar los términos y condiciones'
    }
  }

  return errores
}

/**
 * Convertir especialidades del formulario al formato de la API
 *
 * @param especialidades - Array de especialidades en español
 * @returns Array de especialidades en formato API
 */
export function convertirEspecialidadesAPI(especialidades: string[]): string[] {
  const mapeo: Record<string, string> = {
    Ansiedad: 'ansiedad',
    Depresión: 'depresion',
    Estrés: 'estres',
    'Terapia de Pareja': 'terapia_pareja',
    'Terapia Familiar': 'terapia_familiar',
    'Terapia Cognitivo-Conductual': 'tcc',
    Psicoanálisis: 'psicoanalisis',
    'Trastornos Alimenticios': 'trastornos_alimenticios',
    Adicciones: 'adicciones',
    Trauma: 'trauma',
    Duelo: 'duelo',
    Autoestima: 'autoestima',
    Mindfulness: 'mindfulness',
    Neuropsicología: 'neuropsicologia',
  }

  return especialidades.map((esp) => mapeo[esp] || esp.toLowerCase())
}

/**
 * Convertir idiomas del formulario al formato de la API
 *
 * @param idiomas - Array de idiomas en español
 * @returns Array de códigos de idioma
 */
export function convertirIdiomasAPI(idiomas: string[]): string[] {
  const mapeo: Record<string, string> = {
    Español: 'es',
    Inglés: 'en',
    Francés: 'fr',
    Portugués: 'pt',
    Alemán: 'de',
  }

  return idiomas.map((idioma) => mapeo[idioma] || idioma.toLowerCase())
}
