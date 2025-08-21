export interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  imagen?: string;
  rol: 'USUARIO' | 'TERAPEUTA' | 'ADMIN';
  estaActivo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface PerfilUsuario {
  id: string;
  usuarioId: string;
  telefono?: string;
  fechaNacimiento?: Date;
  genero?: string;
  idiomaPreferido: 'es' | 'en';
  moneda: 'COP' | 'USD';
  zonaHoraria: string;
  consentimientoDatos: boolean;
  consentimientoMkt: boolean;
}

export interface RegistroAnimo {
  id: string;
  animo: number; // 1-10
  energia: number; // 1-10
  estres: number; // 1-10
  notas?: string;
  creadoEn: Date;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  contenido: string;
  rol: 'usuario' | 'asistente';
  tipo: 'texto' | 'audio';
  urlAudio?: string;
  sentimiento?: number;
  emociones?: Record<string, number>;
  creadoEn: Date;
}

export interface ResultadoPrueba {
  id: string;
  codigoPrueba: string;
  puntuacion: number;
  severidad: 'minima' | 'leve' | 'moderada' | 'severa';
  respuestas: Record<string, number>;
  interpretacion?: string;
  creadoEn: Date;
}

export interface Recomendacion {
  id: string;
  usuarioId: string;
  tipo: string;
  prioridad: number;
  titulo: string;
  tituloEn?: string;
  descripcion: string;
  descripcionEn?: string;
  urlAccion?: string;
  estaActiva: boolean;
}