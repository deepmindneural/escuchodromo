/**
 * TIPOS COMPARTIDOS PARA EDGE FUNCTIONS DE IA
 *
 * Interfaces y tipos TypeScript usados en todas las Edge Functions
 * del sistema de IA de Escuchodromo
 */

// ==========================================
// TIPOS DE BASE DE DATOS
// ==========================================

export interface Usuario {
  id: string
  auth_id: string
  email: string
  nombre: string | null
  imagen: string | null
  rol: 'USUARIO' | 'TERAPEUTA' | 'ADMIN'
  esta_activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface Conversacion {
  id: string
  usuario_id: string
  titulo: string | null
  estado: 'activa' | 'archivada' | 'finalizada'
  contexto_embedding: number[] | null
  creado_en: string
  actualizado_en: string
}

export interface Mensaje {
  id: string
  conversacion_id: string
  contenido: string
  rol: 'usuario' | 'asistente'
  tipo: 'texto' | 'audio'
  url_audio: string | null
  sentimiento: number | null
  emociones: Record<string, number> | null
  embedding: number[] | null
  creado_en: string
}

export interface MensajePublico {
  id: string
  sesion_id: string
  contenido: string
  rol: 'usuario' | 'asistente'
  creado_en: string
}

export interface Resultado {
  id: string
  usuario_id: string
  prueba_id: string
  respuestas: any
  puntuacion: number
  severidad: 'minima' | 'leve' | 'moderada' | 'moderadamente_severa' | 'severa'
  interpretacion: string | null
  creado_en: string
}

export interface Prueba {
  id: string
  codigo: string
  nombre: string
  nombre_en: string | null
  descripcion: string | null
  descripcion_en: string | null
  categoria: string
  creado_en: string
}

// ==========================================
// TIPOS DE ANÁLISIS IA
// ==========================================

export interface AnalisisConversacion {
  id?: string
  conversacion_id?: string
  sesion_publica_id?: string
  emociones_dominantes: Record<string, number>
  sentimiento_promedio: number
  score_bienestar: number
  riesgo_suicidio: boolean
  nivel_urgencia: 'bajo' | 'medio' | 'alto' | 'critico'
  senales_crisis: string[]
  temas_recurrentes: string[]
  palabras_clave: Record<string, number>
  resumen_clinico: string
  recomendaciones_terapeuta: string[]
  total_mensajes_analizados: number
  analizado_con_ia: boolean
  modelo_usado: string
  tokens_consumidos: number
  creado_en?: string
}

export interface AlertaUrgente {
  id?: string
  usuario_id?: string
  sesion_publica_id?: string
  analisis_id?: string
  tipo_alerta: 'ideacion_suicida' | 'plan_suicida' | 'autolesion' | 'crisis_grave' | 'deterioro_rapido'
  nivel_urgencia: 'medio' | 'alto' | 'critico'
  titulo: string
  descripcion: string
  senales_detectadas: string[]
  contexto: any
  mensaje_disparador: string | null
  conversacion_id?: string
  estado: 'pendiente' | 'atendida' | 'resuelta' | 'falsa_alarma'
  atendida_por?: string
  atendida_en?: string
  notas_atencion?: string
  notificaciones_enviadas: any[]
  creado_en?: string
  actualizado_en?: string
}

export interface ReporteSemanal {
  id?: string
  usuario_id: string
  profesional_id?: string
  fecha_inicio: string
  fecha_fin: string
  score_bienestar_promedio: number
  emociones_dominantes: Record<string, number>
  temas_identificados: string[]
  nube_palabras: Record<string, number>
  total_mensajes: number
  total_sesiones: number
  promedio_mensajes_por_sesion: number
  horarios_uso: Record<string, Record<string, number>>
  phq9_inicio: number | null
  phq9_fin: number | null
  phq9_tendencia: 'mejorando' | 'estable' | 'empeorando' | null
  gad7_inicio: number | null
  gad7_fin: number | null
  gad7_tendencia: 'mejorando' | 'estable' | 'empeorando' | null
  recomendaciones_terapeuticas: string[]
  resumen_ia: string
  areas_enfoque: string[]
  generado_automaticamente: boolean
  generado_en?: string
  modelo_usado: string
  tokens_consumidos: number
  notificacion_enviada: boolean
  notificacion_enviada_en?: string
  creado_en?: string
}

export interface InsightDashboard {
  id?: string
  usuario_id: string
  periodo: 'dia' | 'semana' | 'mes' | 'trimestre'
  fecha_inicio: string
  fecha_fin: string
  score_bienestar_actual: number
  tendencia: 'mejorando' | 'estable' | 'empeorando'
  evolucion_emocional: Array<{
    fecha: string
    score: number
    emociones: Record<string, number>
  }>
  patrones_horarios: Record<string, Record<string, number>>
  dias_mas_activos: string[]
  horas_pico: string[]
  ultima_phq9: number | null
  penultima_phq9: number | null
  diferencia_phq9: number | null
  ultima_gad7: number | null
  penultima_gad7: number | null
  diferencia_gad7: number | null
  top_emociones: Record<string, number>
  top_temas: string[]
  top_palabras: Record<string, number>
  calculado_en?: string
  ttl?: string
  creado_en?: string
}

// ==========================================
// TIPOS DE GEMINI API
// ==========================================

export interface GeminiRequest {
  mensaje?: string
  historial?: Array<{ rol: string; contenido: string }>
  conversacion_completa?: string
  contexto_adicional?: any
  tipo_prompt: 'chat' | 'analisis' | 'crisis' | 'reporte'
  temperatura?: number
  max_tokens?: number
}

export interface GeminiResponse {
  respuesta: string
  tokens_usados: number
  modelo: string
  latencia_ms?: number
  exitoso: boolean
  error?: string
}

export interface DeteccionCrisis {
  hay_crisis: boolean
  nivel_urgencia: 'bajo' | 'medio' | 'alto' | 'critico'
  senales_detectadas: string[]
  explicacion: string
  accion_recomendada: string
}

export interface AnalisisPostChatGemini {
  emociones_dominantes: Record<string, number>
  sentimiento_promedio: number
  score_bienestar: number
  riesgo_suicidio: boolean
  nivel_urgencia: 'bajo' | 'medio' | 'alto' | 'critico'
  temas_recurrentes: string[]
  palabras_clave: Record<string, number>
  resumen_clinico: string
  recomendaciones_terapeuta: string[]
}

// ==========================================
// TIPOS DE REQUESTS/RESPONSES DE EDGE FUNCTIONS
// ==========================================

export interface ChatIARequest {
  mensaje: string
  sesion_id?: string
  historial?: Array<{ rol: string; contenido: string }>
}

export interface ChatIAResponse {
  respuesta: string
  emociones?: Record<string, number>
  sentimiento?: number
  modelo: string
  tokens_usados: number
  alerta_crisis?: {
    detectada: boolean
    nivel: string
    mensaje: string
  }
}

export interface AnalisisPostChatRequest {
  conversacion_id?: string
  sesion_publica_id?: string
  forzar_reanalizacion?: boolean
}

export interface AnalisisPostChatResponse {
  analisis: AnalisisConversacion
  alerta_creada: boolean
  alerta_id?: string
}

export interface InsightsDashboardRequest {
  usuario_id: string
  periodo: 'dia' | 'semana' | 'mes' | 'trimestre'
  forzar_recalculo?: boolean
}

export interface InsightsDashboardResponse {
  insights: InsightDashboard
  cache_usado: boolean
}

export interface GenerarReporteRequest {
  usuario_id: string
  tipo: 'semanal' | 'mensual' | 'pre-cita'
  fecha_inicio?: string
  fecha_fin?: string
  cita_id?: string
}

export interface GenerarReporteResponse {
  reporte: ReporteSemanal | any
  notificacion_enviada: boolean
}

// ==========================================
// TIPOS DE CONFIGURACIÓN
// ==========================================

export interface RateLimitConfig {
  maxCalls: number
  window: number
  reserva: number
  prioridad: {
    crisis: number
    chat: number
    analisis: number
    reportes: number
  }
}

export interface GeminiConfig {
  apiKey: string
  model: string
  defaultTemperature: number
  defaultMaxTokens: number
  timeout: number
  retryAttempts: number
  retryDelay: number
}

// ==========================================
// TIPOS DE LOGS
// ==========================================

export interface LogGeminiAPI {
  funcion_origen: string
  usuario_id?: string
  sesion_publica_id?: string
  prompt_tipo: 'chat' | 'analisis' | 'reporte' | 'crisis'
  tokens_prompt: number
  tokens_respuesta: number
  tokens_total: number
  latencia_ms: number
  exitoso: boolean
  codigo_error?: string
  mensaje_error?: string
  llamadas_hoy: number
  creado_en?: string
}

// ==========================================
// TIPOS AUXILIARES
// ==========================================

export type NivelUrgencia = 'bajo' | 'medio' | 'alto' | 'critico'
export type NivelSeveridad = 'minima' | 'leve' | 'moderada' | 'moderadamente_severa' | 'severa'
export type TendenciaEvaluacion = 'mejorando' | 'estable' | 'empeorando'
export type RolUsuario = 'USUARIO' | 'TERAPEUTA' | 'ADMIN'
export type EstadoConversacion = 'activa' | 'archivada' | 'finalizada'
export type TipoMensaje = 'texto' | 'audio'
export type RolMensaje = 'usuario' | 'asistente'

// ==========================================
// UTILIDADES DE TIPO
// ==========================================

export function esUsuarioRegistrado(usuario: any): usuario is Usuario {
  return usuario && typeof usuario.id === 'string' && typeof usuario.rol === 'string'
}

export function esConversacionActiva(conversacion: Conversacion): boolean {
  return conversacion.estado === 'activa'
}

export function requiereIntervencionUrgente(nivel: NivelUrgencia): boolean {
  return nivel === 'alto' || nivel === 'critico'
}

export function calcularTendencia(valorAnterior: number | null, valorActual: number | null): TendenciaEvaluacion | null {
  if (valorAnterior === null || valorActual === null) return null

  const diferencia = valorAnterior - valorActual // Menor score = mejor

  if (diferencia > 2) return 'mejorando'
  if (diferencia < -2) return 'empeorando'
  return 'estable'
}

export function interpretarScoreBienestar(score: number): string {
  if (score >= 0 && score <= 25) return 'Crisis / Muy bajo'
  if (score <= 50) return 'Bajo'
  if (score <= 75) return 'Moderado'
  return 'Bueno / Óptimo'
}

export function interpretarPHQ9(score: number): NivelSeveridad {
  if (score <= 4) return 'minima'
  if (score <= 9) return 'leve'
  if (score <= 14) return 'moderada'
  if (score <= 19) return 'moderadamente_severa'
  return 'severa'
}

export function interpretarGAD7(score: number): NivelSeveridad {
  if (score <= 4) return 'minima'
  if (score <= 9) return 'leve'
  if (score <= 14) return 'moderada'
  return 'severa'
}
