/**
 * Tipos de base de datos generados desde el schema de Supabase
 * Estos tipos se pueden regenerar con: supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Usuario: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          nombre: string | null
          imagen: string | null
          rol: 'USUARIO' | 'TERAPEUTA' | 'ADMIN'
          esta_activo: boolean | null
          creado_en: string | null
          actualizado_en: string | null
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          nombre?: string | null
          imagen?: string | null
          rol?: 'USUARIO' | 'TERAPEUTA' | 'ADMIN'
          esta_activo?: boolean | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Update: {
          id?: string
          auth_id?: string | null
          email?: string
          nombre?: string | null
          imagen?: string | null
          rol?: 'USUARIO' | 'TERAPEUTA' | 'ADMIN'
          esta_activo?: boolean | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
      }
      PerfilUsuario: {
        Row: {
          id: string
          usuario_id: string
          telefono: string | null
          fecha_nacimiento: string | null
          genero: string | null
          idioma_preferido: 'es' | 'en' | null
          moneda: 'COP' | 'USD' | null
          zona_horaria: string | null
          consentimiento_datos: boolean | null
          consentimiento_mkt: boolean | null
          creado_en: string | null
          actualizado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          telefono?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          idioma_preferido?: 'es' | 'en' | null
          moneda?: 'COP' | 'USD' | null
          zona_horaria?: string | null
          consentimiento_datos?: boolean | null
          consentimiento_mkt?: boolean | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          telefono?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          idioma_preferido?: 'es' | 'en' | null
          moneda?: 'COP' | 'USD' | null
          zona_horaria?: string | null
          consentimiento_datos?: boolean | null
          consentimiento_mkt?: boolean | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
      }
      Sesion: {
        Row: {
          id: string
          usuario_id: string
          token: string
          expira_en: string
          creado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          token: string
          expira_en: string
          creado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          token?: string
          expira_en?: string
          creado_en?: string | null
        }
      }
      RegistroAnimo: {
        Row: {
          id: string
          perfil_id: string
          animo: number
          energia: number
          estres: number
          notas: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          perfil_id: string
          animo: number
          energia: number
          estres: number
          notas?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          perfil_id?: string
          animo?: number
          energia?: number
          estres?: number
          notas?: string | null
          creado_en?: string | null
        }
      }
      Conversacion: {
        Row: {
          id: string
          usuario_id: string
          titulo: string | null
          estado: 'activa' | 'archivada' | 'finalizada' | null
          contexto_embedding: string | null // vector(1536) se representa como string
          creado_en: string | null
          actualizado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          titulo?: string | null
          estado?: 'activa' | 'archivada' | 'finalizada' | null
          contexto_embedding?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          titulo?: string | null
          estado?: 'activa' | 'archivada' | 'finalizada' | null
          contexto_embedding?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
      }
      Mensaje: {
        Row: {
          id: string
          conversacion_id: string
          contenido: string
          rol: 'usuario' | 'asistente'
          tipo: 'texto' | 'audio' | null
          url_audio: string | null
          sentimiento: number | null
          emociones: Json | null
          embedding: string | null // vector(1536)
          creado_en: string | null
        }
        Insert: {
          id?: string
          conversacion_id: string
          contenido: string
          rol: 'usuario' | 'asistente'
          tipo?: 'texto' | 'audio' | null
          url_audio?: string | null
          sentimiento?: number | null
          emociones?: Json | null
          embedding?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          conversacion_id?: string
          contenido?: string
          rol?: 'usuario' | 'asistente'
          tipo?: 'texto' | 'audio' | null
          url_audio?: string | null
          sentimiento?: number | null
          emociones?: Json | null
          embedding?: string | null
          creado_en?: string | null
        }
      }
      Prueba: {
        Row: {
          id: string
          codigo: string
          nombre: string
          nombre_en: string | null
          descripcion: string | null
          descripcion_en: string | null
          categoria: string
          creado_en: string | null
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          nombre_en?: string | null
          descripcion?: string | null
          descripcion_en?: string | null
          categoria: string
          creado_en?: string | null
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          nombre_en?: string | null
          descripcion?: string | null
          descripcion_en?: string | null
          categoria?: string
          creado_en?: string | null
        }
      }
      Pregunta: {
        Row: {
          id: string
          prueba_id: string
          orden: number
          texto: string
          texto_en: string | null
          opciones: Json
          creado_en: string | null
        }
        Insert: {
          id?: string
          prueba_id: string
          orden: number
          texto: string
          texto_en?: string | null
          opciones: Json
          creado_en?: string | null
        }
        Update: {
          id?: string
          prueba_id?: string
          orden?: number
          texto?: string
          texto_en?: string | null
          opciones?: Json
          creado_en?: string | null
        }
      }
      Resultado: {
        Row: {
          id: string
          usuario_id: string
          prueba_id: string
          respuestas: Json
          puntuacion: number
          severidad: 'minima' | 'leve' | 'moderada' | 'moderadamente_severa' | 'severa'
          interpretacion: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          prueba_id: string
          respuestas: Json
          puntuacion: number
          severidad: 'minima' | 'leve' | 'moderada' | 'moderadamente_severa' | 'severa'
          interpretacion?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          prueba_id?: string
          respuestas?: Json
          puntuacion?: number
          severidad?: 'minima' | 'leve' | 'moderada' | 'moderadamente_severa' | 'severa'
          interpretacion?: string | null
          creado_en?: string | null
        }
      }
      Recomendacion: {
        Row: {
          id: string
          usuario_id: string
          tipo: string
          prioridad: number | null
          titulo: string
          titulo_en: string | null
          descripcion: string
          descripcion_en: string | null
          url_accion: string | null
          esta_activa: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo: string
          prioridad?: number | null
          titulo: string
          titulo_en?: string | null
          descripcion: string
          descripcion_en?: string | null
          url_accion?: string | null
          esta_activa?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo?: string
          prioridad?: number | null
          titulo?: string
          titulo_en?: string | null
          descripcion?: string
          descripcion_en?: string | null
          url_accion?: string | null
          esta_activa?: boolean | null
          creado_en?: string | null
        }
      }
      Pago: {
        Row: {
          id: string
          usuario_id: string
          monto: number
          moneda: 'COP' | 'USD'
          estado: 'pendiente' | 'completado' | 'fallido' | 'cancelado'
          metodo: 'stripe' | 'paypal' | 'transferencia'
          id_transaccion_externa: string | null
          descripcion: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          monto: number
          moneda: 'COP' | 'USD'
          estado?: 'pendiente' | 'completado' | 'fallido' | 'cancelado'
          metodo: 'stripe' | 'paypal' | 'transferencia'
          id_transaccion_externa?: string | null
          descripcion?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          monto?: number
          moneda?: 'COP' | 'USD'
          estado?: 'pendiente' | 'completado' | 'fallido' | 'cancelado'
          metodo?: 'stripe' | 'paypal' | 'transferencia'
          id_transaccion_externa?: string | null
          descripcion?: string | null
          creado_en?: string | null
        }
      }
      Notificacion: {
        Row: {
          id: string
          usuario_id: string
          tipo: 'email' | 'push' | 'sms'
          titulo: string
          contenido: string
          leida: boolean | null
          enviada: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo: 'email' | 'push' | 'sms'
          titulo: string
          contenido: string
          leida?: boolean | null
          enviada?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo?: 'email' | 'push' | 'sms'
          titulo?: string
          contenido?: string
          leida?: boolean | null
          enviada?: boolean | null
          creado_en?: string | null
        }
      }
      ArchivoAdjunto: {
        Row: {
          id: string
          usuario_id: string
          nombre: string
          tipo: string
          tamano: number
          url: string
          creado_en: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          nombre: string
          tipo: string
          tamano: number
          url: string
          creado_en?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          nombre?: string
          tipo?: string
          tamano?: number
          url?: string
          creado_en?: string | null
        }
      }
      SesionPublica: {
        Row: {
          id: string
          sesion_id: string
          iniciado_en: string
          ultima_actividad: string
        }
        Insert: {
          id?: string
          sesion_id: string
          iniciado_en?: string
          ultima_actividad?: string
        }
        Update: {
          id?: string
          sesion_id?: string
          iniciado_en?: string
          ultima_actividad?: string
        }
      }
      MensajePublico: {
        Row: {
          id: string
          sesion_id: string
          contenido: string
          rol: 'usuario' | 'asistente'
          creado_en: string | null
        }
        Insert: {
          id?: string
          sesion_id: string
          contenido: string
          rol: 'usuario' | 'asistente'
          creado_en?: string | null
        }
        Update: {
          id?: string
          sesion_id?: string
          contenido?: string
          rol?: 'usuario' | 'asistente'
          creado_en?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
