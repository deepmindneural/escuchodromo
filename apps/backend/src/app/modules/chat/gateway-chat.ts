import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ServicioChat } from './servicio-chat';
import { GuardiaWsJwt } from '../autenticacion/guardias/guardia-ws-jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class GatewayChat implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private usuariosConectados = new Map<string, string>();

  constructor(private servicioChat: ServicioChat) {}

  afterInit(server: Server) {
    console.log('Gateway de chat inicializado');
  }

  async handleConnection(cliente: Socket) {
    console.log(`Cliente conectado: ${cliente.id}`);
  }

  async handleDisconnect(cliente: Socket) {
    console.log(`Cliente desconectado: ${cliente.id}`);
    this.usuariosConectados.delete(cliente.id);
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('unirse-conversacion')
  async manejarUnirseConversacion(
    @MessageBody() data: { conversacionId: string; usuarioId: string },
    @ConnectedSocket() cliente: Socket,
  ) {
    this.usuariosConectados.set(cliente.id, data.usuarioId);
    await cliente.join(`conversacion:${data.conversacionId}`);
    
    const mensajesAnteriores = await this.servicioChat.obtenerMensajes(data.conversacionId);
    cliente.emit('mensajes-anteriores', mensajesAnteriores);
    
    return { evento: 'unido', conversacionId: data.conversacionId };
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('enviar-mensaje')
  async manejarEnviarMensaje(
    @MessageBody() data: { conversacionId: string; contenido: string; usuarioId: string },
    @ConnectedSocket() cliente: Socket,
  ) {
    const mensaje = await this.servicioChat.crearMensaje({
      conversacionId: data.conversacionId,
      contenido: data.contenido,
      usuarioId: data.usuarioId,
      rol: 'usuario',
    });

    // Emitir a todos en la conversación
    this.server
      .to(`conversacion:${data.conversacionId}`)
      .emit('nuevo-mensaje', mensaje);

    // Procesar respuesta de IA
    const respuestaIA = await this.servicioChat.procesarMensajeConIA(
      data.contenido,
      data.conversacionId,
    );

    // Emitir respuesta de IA
    this.server
      .to(`conversacion:${data.conversacionId}`)
      .emit('nuevo-mensaje', respuestaIA);

    return { estado: 'enviado', mensajeId: mensaje.id };
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('escribiendo')
  async manejarEscribiendo(
    @MessageBody() data: { conversacionId: string; usuarioId: string },
    @ConnectedSocket() cliente: Socket,
  ) {
    cliente.to(`conversacion:${data.conversacionId}`).emit('usuario-escribiendo', {
      usuarioId: data.usuarioId,
    });
  }

  @UseGuards(GuardiaWsJwt)
  @SubscribeMessage('dejar-de-escribir')
  async manejarDejarDeEscribir(
    @MessageBody() data: { conversacionId: string; usuarioId: string },
    @ConnectedSocket() cliente: Socket,
  ) {
    cliente.to(`conversacion:${data.conversacionId}`).emit('usuario-dejo-de-escribir', {
      usuarioId: data.usuarioId,
    });
  }
}