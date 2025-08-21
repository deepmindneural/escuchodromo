import { Injectable } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/servicio-prisma';
import { CrearNotificacionDto } from './dto/crear-notificacion.dto';

@Injectable()
export class ServicioNotificaciones {
  constructor(private prisma: ServicioPrisma) {}

  async crearNotificacion(crearNotificacionDto: CrearNotificacionDto) {
    return this.prisma.notificacion.create({
      data: crearNotificacionDto,
    });
  }

  async obtenerNotificaciones(usuarioId: string) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerNoLeidas(usuarioId: string) {
    return this.prisma.notificacion.findMany({
      where: {
        usuarioId,
        leida: false,
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async marcarComoLeida(id: string, usuarioId: string) {
    return this.prisma.notificacion.update({
      where: { id, usuarioId },
      data: { leida: true },
    });
  }

  async marcarTodasComoLeidas(usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: {
        usuarioId,
        leida: false,
      },
      data: { leida: true },
    });
  }

  async enviarNotificacionEmail(usuarioId: string, asunto: string, contenido: string) {
    // TODO: Integrar con servicio de email (SendGrid, AWS SES, etc.)
    console.log(`Enviando email a usuario ${usuarioId}: ${asunto}`);
    
    // Guardar registro de notificación
    await this.crearNotificacion({
      usuarioId,
      tipo: 'email',
      titulo: asunto,
      contenido,
    });
  }

  async enviarNotificacionPush(usuarioId: string, titulo: string, mensaje: string) {
    // TODO: Integrar con servicio de push notifications (Firebase, OneSignal, etc.)
    console.log(`Enviando push a usuario ${usuarioId}: ${titulo}`);
    
    // Guardar registro de notificación
    await this.crearNotificacion({
      usuarioId,
      tipo: 'push',
      titulo,
      contenido: mensaje,
    });
  }

  async enviarNotificacionSMS(usuarioId: string, mensaje: string) {
    // TODO: Integrar con servicio de SMS (Twilio, etc.)
    console.log(`Enviando SMS a usuario ${usuarioId}: ${mensaje}`);
    
    // Guardar registro de notificación
    await this.crearNotificacion({
      usuarioId,
      tipo: 'sms',
      titulo: 'SMS',
      contenido: mensaje,
    });
  }

  async programarRecordatorios(usuarioId: string) {
    const perfil = await this.prisma.perfilUsuario.findUnique({
      where: { usuarioId },
    });

    if (!perfil) return;

    // Crear recordatorios basados en preferencias del usuario
    const recordatorios = [];

    // Recordatorio diario de registro de ánimo
    recordatorios.push({
      usuarioId,
      tipo: 'push',
      titulo: perfil.idiomaPreferido === 'es' 
        ? '¿Cómo te sientes hoy?' 
        : 'How are you feeling today?',
      contenido: perfil.idiomaPreferido === 'es'
        ? 'Es momento de registrar tu estado de ánimo'
        : "It's time to log your mood",
    });

    // Recordatorio semanal de evaluación
    const ultimaEvaluacion = await this.prisma.resultado.findFirst({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
    });

    const diasDesdeUltimaEvaluacion = ultimaEvaluacion
      ? Math.floor((Date.now() - ultimaEvaluacion.creadoEn.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (diasDesdeUltimaEvaluacion > 7) {
      recordatorios.push({
        usuarioId,
        tipo: 'email',
        titulo: perfil.idiomaPreferido === 'es'
          ? 'Es hora de tu evaluación semanal'
          : 'Time for your weekly assessment',
        contenido: perfil.idiomaPreferido === 'es'
          ? 'Realiza una evaluación breve para monitorear tu progreso'
          : 'Take a brief assessment to monitor your progress',
      });
    }

    // Crear notificaciones programadas
    for (const recordatorio of recordatorios) {
      await this.crearNotificacion(recordatorio);
    }

    return recordatorios;
  }

  async contarNoLeidas(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: {
        usuarioId,
        leida: false,
      },
    });
  }
}