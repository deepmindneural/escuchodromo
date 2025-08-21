import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/servicio-prisma';
import { TranscribirAudioDto } from './dto/transcribir-audio.dto';
import { AnalizarEmocionVozDto } from './dto/analizar-emocion-voz.dto';

@Injectable()
export class ServicioVoz {
  private readonly logger = new Logger(ServicioVoz.name);

  constructor(private prisma: PrismaService) {}

  async transcribirAudio(dto: TranscribirAudioDto, usuarioId: string) {
    try {
      // Aquí se integraría con un servicio de STT como Google Cloud Speech-to-Text
      // Por ahora simulamos la transcripción
      const transcripcion = dto.audioBase64 ? 'Texto transcrito del audio' : '';
      
      // Guardar el mensaje con audio en la conversación
      const mensaje = await this.prisma.mensaje.create({
        data: {
          conversacionId: dto.conversacionId,
          contenido: transcripcion,
          rol: 'usuario',
          tipo: 'audio',
          urlAudio: dto.audioUrl,
        },
      });

      // Analizar emociones del audio
      const analisisEmocional = await this.analizarEmocionesVoz({
        audioBase64: dto.audioBase64,
        duracion: dto.duracion,
      });

      // Actualizar mensaje con análisis emocional
      await this.prisma.mensaje.update({
        where: { id: mensaje.id },
        data: {
          sentimiento: analisisEmocional.sentimiento,
          emociones: JSON.stringify(analisisEmocional.emociones),
        },
      });

      return {
        mensajeId: mensaje.id,
        transcripcion,
        analisisEmocional,
      };
    } catch (error) {
      this.logger.error('Error al transcribir audio:', error);
      throw error;
    }
  }

  async analizarEmocionesVoz(dto: AnalizarEmocionVozDto) {
    // Aquí se integraría con un servicio de análisis emocional de voz
    // Por ahora simulamos el análisis
    const emociones = {
      alegria: Math.random() * 0.3,
      tristeza: Math.random() * 0.4,
      ansiedad: Math.random() * 0.5,
      ira: Math.random() * 0.2,
      miedo: Math.random() * 0.3,
      calma: Math.random() * 0.6,
    };

    // Calcular sentimiento general (-1 a 1)
    const sentimientoPositivo = emociones.alegria + emociones.calma;
    const sentimientoNegativo = emociones.tristeza + emociones.ansiedad + emociones.ira + emociones.miedo;
    const sentimiento = (sentimientoPositivo - sentimientoNegativo) / 2;

    return {
      sentimiento: Math.max(-1, Math.min(1, sentimiento)),
      emociones,
      confianza: 0.85,
    };
  }

  async generarRespuestaVoz(texto: string, emocionUsuario?: string) {
    // Aquí se integraría con un servicio de TTS como Google Cloud Text-to-Speech
    // Por ahora retornamos una URL simulada
    const velocidad = emocionUsuario === 'ansiedad' ? 0.9 : 1.0;
    const tono = emocionUsuario === 'tristeza' ? 'empatico' : 'calido';

    return {
      audioUrl: `/api/audio/respuesta-${Date.now()}.mp3`,
      texto,
      configuracion: {
        velocidad,
        tono,
        voz: 'es-ES-Neural2-A', // Voz femenina neural en español
      },
    };
  }

  async obtenerEstadisticasVoz(usuarioId: string) {
    const mensajesVoz = await this.prisma.mensaje.count({
      where: {
        tipo: 'audio',
        conversacion: {
          usuarioId,
        },
      },
    });

    const ultimosMensajes = await this.prisma.mensaje.findMany({
      where: {
        tipo: 'audio',
        conversacion: {
          usuarioId,
        },
        emociones: { not: null },
      },
      orderBy: { creadoEn: 'desc' },
      take: 10,
    });

    // Procesar emociones promedio
    const emocionesPromedio = this.calcularEmocionesPromedio(ultimosMensajes);

    return {
      totalMensajesVoz: mensajesVoz,
      emocionesPromedio,
      tendenciaEmocional: this.calcularTendencia(ultimosMensajes),
    };
  }

  private calcularEmocionesPromedio(mensajes: any[]) {
    if (mensajes.length === 0) return null;

    const sumaEmociones = mensajes.reduce((acc, msg) => {
      const emociones = JSON.parse(msg.emociones || '{}');
      Object.keys(emociones).forEach(emocion => {
        acc[emocion] = (acc[emocion] || 0) + emociones[emocion];
      });
      return acc;
    }, {});

    Object.keys(sumaEmociones).forEach(emocion => {
      sumaEmociones[emocion] /= mensajes.length;
    });

    return sumaEmociones;
  }

  private calcularTendencia(mensajes: any[]) {
    if (mensajes.length < 2) return 'estable';

    const sentimientos = mensajes.map(m => m.sentimiento || 0);
    const primerosSentimientos = sentimientos.slice(0, Math.floor(sentimientos.length / 2));
    const ultimosSentimientos = sentimientos.slice(Math.floor(sentimientos.length / 2));

    const promedioPrimeros = primerosSentimientos.reduce((a, b) => a + b, 0) / primerosSentimientos.length;
    const promedioUltimos = ultimosSentimientos.reduce((a, b) => a + b, 0) / ultimosSentimientos.length;

    const diferencia = promedioUltimos - promedioPrimeros;

    if (diferencia > 0.2) return 'mejorando';
    if (diferencia < -0.2) return 'empeorando';
    return 'estable';
  }
}