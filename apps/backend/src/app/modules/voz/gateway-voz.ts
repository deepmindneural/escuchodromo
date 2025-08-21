import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { GuardiaWsJwt } from '../autenticacion/guardias/guardia-ws-jwt';
import { ServicioVoz } from './servicio-voz';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'voz',
  cors: {
    origin: '*',
  },
})
export class GatewayVoz implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GatewayVoz.name);
  private sesionesActivas = new Map<string, any>();

  constructor(private readonly servicioVoz: ServicioVoz) {}

  handleConnection(cliente: Socket) {
    this.logger.log(`Cliente conectado a voz: ${cliente.id}`);
  }

  handleDisconnect(cliente: Socket) {
    this.logger.log(`Cliente desconectado de voz: ${cliente.id}`);
    this.sesionesActivas.delete(cliente.id);
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('iniciar-sesion-voz')
  async iniciarSesionVoz(
    @MessageBody() data: { conversacionId: string },
    @ConnectedSocket() cliente: Socket
  ) {
    const usuario = (cliente as any).usuario;
    
    this.sesionesActivas.set(cliente.id, {
      usuarioId: usuario.sub,
      conversacionId: data.conversacionId,
      iniciadoEn: new Date(),
    });

    cliente.emit('sesion-voz-iniciada', {
      mensaje: 'Sesión de voz iniciada',
      configuracion: {
        idioma: 'es-ES',
        reconocimientoContinuo: true,
        resultadosInterinos: true,
      },
    });
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('audio-chunk')
  async procesarChunkAudio(
    @MessageBody() data: { chunk: string; esFinal: boolean },
    @ConnectedSocket() cliente: Socket
  ) {
    const sesion = this.sesionesActivas.get(cliente.id);
    if (!sesion) {
      cliente.emit('error', { mensaje: 'No hay sesión activa' });
      return;
    }

    // Aquí se procesaría el chunk de audio en tiempo real
    // Por ahora simulamos una transcripción parcial
    if (!data.esFinal) {
      cliente.emit('transcripcion-parcial', {
        texto: 'Transcripción en proceso...',
      });
    } else {
      // Procesar audio completo
      const resultado = await this.servicioVoz.transcribirAudio({
        conversacionId: sesion.conversacionId,
        audioBase64: data.chunk,
      }, sesion.usuarioId);

      cliente.emit('transcripcion-final', resultado);

      // Notificar a otros clientes en la conversación
      this.server.to(`conversacion-${sesion.conversacionId}`).emit('nuevo-mensaje-voz', {
        mensajeId: resultado.mensajeId,
        transcripcion: resultado.transcripcion,
        analisisEmocional: resultado.analisisEmocional,
      });
    }
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('solicitar-respuesta-voz')
  async solicitarRespuestaVoz(
    @MessageBody() data: { texto: string; emocionDetectada?: string },
    @ConnectedSocket() cliente: Socket
  ) {
    const sesion = this.sesionesActivas.get(cliente.id);
    if (!sesion) {
      cliente.emit('error', { mensaje: 'No hay sesión activa' });
      return;
    }

    try {
      const respuesta = await this.servicioVoz.generarRespuestaVoz(
        data.texto,
        data.emocionDetectada
      );

      cliente.emit('respuesta-voz-generada', respuesta);
    } catch (error) {
      this.logger.error('Error al generar respuesta de voz:', error);
      cliente.emit('error', { mensaje: 'Error al generar respuesta de voz' });
    }
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('finalizar-sesion-voz')
  async finalizarSesionVoz(@ConnectedSocket() cliente: Socket) {
    const sesion = this.sesionesActivas.get(cliente.id);
    if (sesion) {
      const duracion = Date.now() - sesion.iniciadoEn.getTime();
      this.sesionesActivas.delete(cliente.id);

      cliente.emit('sesion-voz-finalizada', {
        duracion,
        mensaje: 'Sesión de voz finalizada',
      });
    }
  }
}