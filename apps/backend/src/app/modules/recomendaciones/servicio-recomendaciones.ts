import { Injectable } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/servicio-prisma';
import { calcularPuntuacionRiesgo } from '@escuchodromo/shared';

interface DatosUsuario {
  ultimosResultados: any[];
  registrosAnimo: any[];
  conversacionesRecientes: any[];
}

@Injectable()
export class ServicioRecomendaciones {
  constructor(private prisma: ServicioPrisma) {}

  async generarRecomendacionesPersonalizadas(usuarioId: string) {
    // Obtener datos del usuario
    const datosUsuario = await this.obtenerDatosUsuario(usuarioId);
    
    // Analizar estado actual
    const estadoEmocional = this.analizarEstadoEmocional(datosUsuario);
    
    // Generar recomendaciones basadas en el análisis
    const recomendaciones = await this.crearRecomendaciones(
      usuarioId,
      estadoEmocional,
      datosUsuario
    );
    
    return recomendaciones;
  }

  private async obtenerDatosUsuario(usuarioId: string): Promise<DatosUsuario> {
    const [ultimosResultados, perfil, conversacionesRecientes] = await Promise.all([
      // Últimos resultados de evaluaciones
      this.prisma.resultado.findMany({
        where: { usuarioId },
        orderBy: { creadoEn: 'desc' },
        take: 5,
        include: { prueba: true },
      }),
      
      // Perfil con registros de ánimo
      this.prisma.perfilUsuario.findUnique({
        where: { usuarioId },
        include: {
          registrosAnimo: {
            orderBy: { creadoEn: 'desc' },
            take: 10,
          },
        },
      }),
      
      // Conversaciones recientes
      this.prisma.conversacion.findMany({
        where: { usuarioId },
        orderBy: { actualizadoEn: 'desc' },
        take: 5,
        include: {
          mensajes: {
            take: 10,
            orderBy: { creadoEn: 'desc' },
          },
        },
      }),
    ]);

    return {
      ultimosResultados,
      registrosAnimo: perfil?.registrosAnimo || [],
      conversacionesRecientes,
    };
  }

  private analizarEstadoEmocional(datos: DatosUsuario) {
    // Calcular puntuación de riesgo basada en evaluaciones
    const resultadosPruebas = datos.ultimosResultados.map(r => ({
      codigoPrueba: r.prueba.codigo,
      puntuacion: r.puntuacion,
    }));
    
    const { nivelRiesgo, recomendaciones: tiposRecomendados } = 
      calcularPuntuacionRiesgo(resultadosPruebas);
    
    // Analizar tendencias de ánimo
    const promedioAnimo = this.calcularPromedioAnimo(datos.registrosAnimo);
    const tendenciaAnimo = this.calcularTendencia(datos.registrosAnimo);
    
    // Analizar sentimientos en conversaciones
    const sentimientoPromedio = this.analizarSentimientosConversaciones(
      datos.conversacionesRecientes
    );
    
    return {
      nivelRiesgo,
      tiposRecomendados,
      promedioAnimo,
      tendenciaAnimo,
      sentimientoPromedio,
    };
  }

  private calcularPromedioAnimo(registros: any[]): number {
    if (registros.length === 0) return 5;
    
    const suma = registros.reduce((acc, r) => acc + r.animo, 0);
    return suma / registros.length;
  }

  private calcularTendencia(registros: any[]): 'mejorando' | 'estable' | 'empeorando' {
    if (registros.length < 3) return 'estable';
    
    const primeros = registros.slice(0, 3);
    const ultimos = registros.slice(-3);
    
    const promedioPrimeros = this.calcularPromedioAnimo(primeros);
    const promedioUltimos = this.calcularPromedioAnimo(ultimos);
    
    if (promedioUltimos > promedioPrimeros + 1) return 'mejorando';
    if (promedioUltimos < promedioPrimeros - 1) return 'empeorando';
    return 'estable';
  }

  private analizarSentimientosConversaciones(conversaciones: any[]): number {
    let totalSentimiento = 0;
    let contador = 0;
    
    conversaciones.forEach(conv => {
      conv.mensajes.forEach((mensaje: any) => {
        if (mensaje.sentimiento !== null) {
          totalSentimiento += mensaje.sentimiento;
          contador++;
        }
      });
    });
    
    return contador > 0 ? totalSentimiento / contador : 0;
  }

  private async crearRecomendaciones(
    usuarioId: string,
    estadoEmocional: any,
    datosUsuario: DatosUsuario
  ) {
    const recomendaciones = [];
    
    // Recomendaciones basadas en nivel de riesgo
    if (estadoEmocional.nivelRiesgo === 'alto') {
      recomendaciones.push({
        tipo: 'ayuda_profesional_urgente',
        prioridad: 5,
        titulo: 'Busca ayuda profesional inmediata',
        tituloEn: 'Seek immediate professional help',
        descripcion: 'Tu bienestar es importante. Te recomendamos contactar con un profesional de salud mental lo antes posible.',
        descripcionEn: 'Your wellbeing is important. We recommend contacting a mental health professional as soon as possible.',
        urlAccion: '/profesionales',
      });
    }
    
    // Recomendaciones basadas en tendencia de ánimo
    if (estadoEmocional.tendenciaAnimo === 'empeorando') {
      recomendaciones.push({
        tipo: 'actividades_bienestar',
        prioridad: 4,
        titulo: 'Actividades para mejorar tu bienestar',
        tituloEn: 'Activities to improve your wellbeing',
        descripcion: 'Hemos notado que tu ánimo ha bajado. Te sugerimos actividades que pueden ayudarte.',
        descripcionEn: "We've noticed your mood has been declining. We suggest activities that might help.",
        urlAccion: '/actividades',
      });
    }
    
    // Recomendaciones de ejercicios específicos
    if (estadoEmocional.promedioAnimo < 5) {
      recomendaciones.push({
        tipo: 'ejercicio_respiracion',
        prioridad: 3,
        titulo: 'Ejercicio de respiración guiada',
        tituloEn: 'Guided breathing exercise',
        descripcion: 'Dedica 5 minutos a esta técnica de respiración para reducir la ansiedad.',
        descripcionEn: 'Take 5 minutes for this breathing technique to reduce anxiety.',
        urlAccion: '/ejercicios/respiracion',
      });
    }
    
    // Recomendación de seguimiento
    if (datosUsuario.ultimosResultados.length === 0) {
      recomendaciones.push({
        tipo: 'evaluacion_inicial',
        prioridad: 3,
        titulo: 'Realiza tu primera evaluación',
        tituloEn: 'Take your first assessment',
        descripcion: 'Conoce tu estado emocional actual con una evaluación breve.',
        descripcionEn: 'Understand your current emotional state with a brief assessment.',
        urlAccion: '/evaluaciones',
      });
    }
    
    // Guardar recomendaciones en la base de datos
    if (recomendaciones.length > 0) {
      await this.prisma.recomendacion.createMany({
        data: recomendaciones.map(r => ({
          ...r,
          usuarioId,
          estaActiva: true,
        })),
      });
    }
    
    return recomendaciones;
  }

  async obtenerRecomendacionesActivas(usuarioId: string) {
    return this.prisma.recomendacion.findMany({
      where: {
        usuarioId,
        estaActiva: true,
      },
      orderBy: {
        prioridad: 'desc',
      },
    });
  }

  async marcarComoCompletada(id: string, usuarioId: string) {
    return this.prisma.recomendacion.update({
      where: { id, usuarioId },
      data: { estaActiva: false },
    });
  }

  async obtenerEjerciciosRecomendados(usuarioId: string) {
    const perfil = await this.prisma.perfilUsuario.findUnique({
      where: { usuarioId },
    });
    
    const idioma = perfil?.idiomaPreferido || 'es';
    
    // Lista de ejercicios disponibles
    const ejercicios = [
      {
        id: 'respiracion-4-7-8',
        tipo: 'respiracion',
        titulo: idioma === 'es' ? 'Respiración 4-7-8' : 'Breathing 4-7-8',
        descripcion: idioma === 'es' 
          ? 'Técnica de respiración para reducir la ansiedad'
          : 'Breathing technique to reduce anxiety',
        duracion: 5,
        nivel: 'principiante',
      },
      {
        id: 'meditacion-mindfulness',
        tipo: 'meditacion',
        titulo: idioma === 'es' ? 'Meditación Mindfulness' : 'Mindfulness Meditation',
        descripcion: idioma === 'es'
          ? 'Meditación guiada para el momento presente'
          : 'Guided meditation for the present moment',
        duracion: 10,
        nivel: 'principiante',
      },
      {
        id: 'relajacion-muscular',
        tipo: 'relajacion',
        titulo: idioma === 'es' ? 'Relajación Muscular Progresiva' : 'Progressive Muscle Relaxation',
        descripcion: idioma === 'es'
          ? 'Técnica para liberar tensión muscular'
          : 'Technique to release muscle tension',
        duracion: 15,
        nivel: 'intermedio',
      },
    ];
    
    return ejercicios;
  }
}