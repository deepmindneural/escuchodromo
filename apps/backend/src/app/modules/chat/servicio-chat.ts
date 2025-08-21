import { Injectable } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/servicio-prisma';
import { CrearMensajeDto } from './dto/crear-mensaje.dto';
import { CrearConversacionDto } from './dto/crear-conversacion.dto';

@Injectable()
export class ServicioChat {
  constructor(private prisma: ServicioPrisma) {}

  async crearConversacion(crearConversacionDto: CrearConversacionDto) {
    return this.prisma.conversacion.create({
      data: {
        usuarioId: crearConversacionDto.usuarioId,
        titulo: crearConversacionDto.titulo || 'Nueva conversación',
      },
      include: {
        mensajes: {
          take: 50,
          orderBy: { creadoEn: 'desc' },
        },
      },
    });
  }

  async obtenerConversaciones(usuarioId: string) {
    return this.prisma.conversacion.findMany({
      where: { usuarioId },
      include: {
        mensajes: {
          take: 1,
          orderBy: { creadoEn: 'desc' },
        },
        _count: {
          select: { mensajes: true },
        },
      },
      orderBy: { actualizadoEn: 'desc' },
    });
  }

  async obtenerConversacion(id: string, usuarioId: string) {
    return this.prisma.conversacion.findFirst({
      where: { id, usuarioId },
      include: {
        mensajes: {
          orderBy: { creadoEn: 'asc' },
        },
      },
    });
  }

  async crearMensaje(data: {
    conversacionId: string;
    contenido: string;
    usuarioId?: string;
    rol: string;
  }) {
    const mensaje = await this.prisma.mensaje.create({
      data: {
        conversacionId: data.conversacionId,
        contenido: data.contenido,
        rol: data.rol,
        tipo: 'texto',
      },
    });

    // Actualizar fecha de última actividad de la conversación
    await this.prisma.conversacion.update({
      where: { id: data.conversacionId },
      data: { actualizadoEn: new Date() },
    });

    return mensaje;
  }

  async obtenerMensajes(conversacionId: string) {
    return this.prisma.mensaje.findMany({
      where: { conversacionId },
      orderBy: { creadoEn: 'asc' },
    });
  }

  async procesarMensajeConIA(contenido: string, conversacionId: string) {
    // Aquí se integrará con el modelo de IA open source
    // Por ahora, simulamos una respuesta
    const respuestaSimulada = await this.generarRespuestaIA(contenido);
    
    // Analizar sentimiento del mensaje
    const analisisSentimiento = await this.analizarSentimiento(contenido);
    
    // Crear mensaje de respuesta
    const mensajeIA = await this.crearMensaje({
      conversacionId,
      contenido: respuestaSimulada,
      rol: 'asistente',
    });

    // Actualizar con análisis de sentimiento
    await this.prisma.mensaje.update({
      where: { id: mensajeIA.id },
      data: {
        sentimiento: analisisSentimiento.puntuacion,
        emociones: JSON.stringify(analisisSentimiento.emociones),
      },
    });

    return mensajeIA;
  }

  private async generarRespuestaIA(mensaje: string): Promise<string> {
    // TODO: Integrar con modelo de lenguaje open source (Llama, Mistral, etc.)
    // Por ahora, respuestas simuladas basadas en palabras clave
    
    const mensajeLower = mensaje.toLowerCase();
    
    if (mensajeLower.includes('triste') || mensajeLower.includes('deprimido')) {
      return 'Entiendo que te sientas así. Es normal tener días difíciles. ¿Quieres contarme más sobre lo que te está pasando? Estoy aquí para escucharte.';
    }
    
    if (mensajeLower.includes('ansioso') || mensajeLower.includes('ansiedad')) {
      return 'La ansiedad puede ser muy difícil de manejar. ¿Has probado algunas técnicas de respiración? Me gustaría ayudarte a encontrar estrategias que funcionen para ti.';
    }
    
    if (mensajeLower.includes('hola') || mensajeLower.includes('buenos')) {
      return '¡Hola! Me alegra que estés aquí. Soy tu asistente de bienestar emocional. ¿Cómo te sientes hoy?';
    }
    
    return 'Te escucho. Cuéntame más sobre cómo te sientes y qué te gustaría explorar hoy.';
  }

  private async analizarSentimiento(texto: string): Promise<{
    puntuacion: number;
    emociones: Record<string, number>;
  }> {
    // TODO: Integrar con modelo de análisis de sentimientos
    // Por ahora, análisis básico basado en palabras clave
    
    const emociones = {
      alegria: 0,
      tristeza: 0,
      ira: 0,
      miedo: 0,
      sorpresa: 0,
    };
    
    const textoLower = texto.toLowerCase();
    
    // Palabras clave para cada emoción
    if (textoLower.match(/feliz|alegre|contento|bien|genial/)) {
      emociones.alegria = 0.8;
    }
    if (textoLower.match(/triste|deprimido|mal|solo/)) {
      emociones.tristeza = 0.8;
    }
    if (textoLower.match(/enojado|furioso|molesto|ira/)) {
      emociones.ira = 0.8;
    }
    if (textoLower.match(/miedo|asustado|nervioso|ansioso/)) {
      emociones.miedo = 0.8;
    }
    
    // Calcular puntuación general (-1 a 1)
    const puntuacion = emociones.alegria - emociones.tristeza - emociones.ira - emociones.miedo;
    
    return {
      puntuacion: Math.max(-1, Math.min(1, puntuacion)),
      emociones,
    };
  }

  async archivarConversacion(id: string, usuarioId: string) {
    return this.prisma.conversacion.update({
      where: { id, usuarioId },
      data: { estado: 'archivada' },
    });
  }

  // Métodos para chat público con límite
  async iniciarChatPublico(mensajeInicial: string, sesionId?: string) {
    const LIMITE_MENSAJES_GRATIS = 20;
    
    // Si no hay sesionId, crear nueva sesión
    if (!sesionId) {
      sesionId = `sesion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Verificar si la sesión ya existe y cuántos mensajes tiene
    const sesionExistente = await this.prisma.sesionPublica.findUnique({
      where: { sesionId },
      include: { _count: { select: { mensajes: true } } }
    });

    if (sesionExistente && sesionExistente._count.mensajes >= LIMITE_MENSAJES_GRATIS) {
      throw new Error('Límite de mensajes gratuitos alcanzado. Regístrate para continuar.');
    }

    // Crear sesión si no existe
    if (!sesionExistente) {
      await this.prisma.sesionPublica.create({
        data: {
          sesionId,
          iniciadoEn: new Date(),
          ultimaActividad: new Date()
        }
      });
    }

    // Crear mensaje inicial del usuario
    const mensajeUsuario = await this.prisma.mensajePublico.create({
      data: {
        sesionId,
        contenido: mensajeInicial,
        rol: 'usuario',
        creadoEn: new Date()
      }
    });

    // Generar y crear respuesta de IA
    const respuestaIA = await this.generarRespuestaIA(mensajeInicial);
    const mensajeIA = await this.prisma.mensajePublico.create({
      data: {
        sesionId,
        contenido: respuestaIA,
        rol: 'asistente',
        creadoEn: new Date()
      }
    });

    // Actualizar última actividad
    await this.prisma.sesionPublica.update({
      where: { sesionId },
      data: { ultimaActividad: new Date() }
    });

    // Obtener contador actualizado
    const contadorMensajes = await this.prisma.mensajePublico.count({
      where: { sesionId, rol: 'usuario' }
    });

    return {
      sesionId,
      mensajes: [mensajeUsuario, mensajeIA],
      mensajesRestantes: LIMITE_MENSAJES_GRATIS - contadorMensajes,
      limite: LIMITE_MENSAJES_GRATIS
    };
  }

  async enviarMensajePublico(mensaje: string, sesionId: string) {
    const LIMITE_MENSAJES_GRATIS = 20;

    // Verificar límite
    const contadorMensajes = await this.prisma.mensajePublico.count({
      where: { sesionId, rol: 'usuario' }
    });

    if (contadorMensajes >= LIMITE_MENSAJES_GRATIS) {
      throw new Error('Límite de mensajes gratuitos alcanzado. Regístrate para continuar.');
    }

    // Crear mensaje del usuario
    const mensajeUsuario = await this.prisma.mensajePublico.create({
      data: {
        sesionId,
        contenido: mensaje,
        rol: 'usuario',
        creadoEn: new Date()
      }
    });

    // Generar y crear respuesta de IA
    const respuestaIA = await this.generarRespuestaIA(mensaje);
    const mensajeIA = await this.prisma.mensajePublico.create({
      data: {
        sesionId,
        contenido: respuestaIA,
        rol: 'asistente',
        creadoEn: new Date()
      }
    });

    // Actualizar última actividad
    await this.prisma.sesionPublica.update({
      where: { sesionId },
      data: { ultimaActividad: new Date() }
    });

    // Obtener contador actualizado
    const contadorActualizado = await this.prisma.mensajePublico.count({
      where: { sesionId, rol: 'usuario' }
    });

    return {
      mensajes: [mensajeUsuario, mensajeIA],
      mensajesRestantes: LIMITE_MENSAJES_GRATIS - contadorActualizado,
      limite: LIMITE_MENSAJES_GRATIS
    };
  }

  async obtenerSesionPublica(sesionId: string) {
    const LIMITE_MENSAJES_GRATIS = 20;

    const sesion = await this.prisma.sesionPublica.findUnique({
      where: { sesionId },
      include: {
        mensajes: {
          orderBy: { creadoEn: 'asc' }
        }
      }
    });

    if (!sesion) {
      throw new Error('Sesión no encontrada');
    }

    const contadorMensajes = await this.prisma.mensajePublico.count({
      where: { sesionId, rol: 'usuario' }
    });

    return {
      sesion,
      mensajesRestantes: LIMITE_MENSAJES_GRATIS - contadorMensajes,
      limite: LIMITE_MENSAJES_GRATIS
    };
  }
}