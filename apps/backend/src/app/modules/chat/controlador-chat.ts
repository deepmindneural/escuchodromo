import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ServicioChat } from './servicio-chat';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';
import { CrearConversacionDto } from './dto/crear-conversacion.dto';

@Controller('chat')
export class ControladorChat {
  constructor(private readonly servicioChat: ServicioChat) {}

  @Post('conversaciones')
  @UseGuards(GuardiaJwt)
  crearConversacion(@Request() req, @Body() crearConversacionDto: CrearConversacionDto) {
    return this.servicioChat.crearConversacion({
      ...crearConversacionDto,
      usuarioId: req.user.usuarioId,
    });
  }

  @Get('conversaciones')
  @UseGuards(GuardiaJwt)
  obtenerConversaciones(@Request() req) {
    return this.servicioChat.obtenerConversaciones(req.user.usuarioId);
  }

  @Get('conversaciones/:id')
  @UseGuards(GuardiaJwt)
  obtenerConversacion(@Request() req, @Param('id') id: string) {
    return this.servicioChat.obtenerConversacion(id, req.user.usuarioId);
  }

  @Get('conversaciones/:id/mensajes')
  @UseGuards(GuardiaJwt)
  obtenerMensajes(@Param('id') id: string) {
    return this.servicioChat.obtenerMensajes(id);
  }

  @Patch('conversaciones/:id/archivar')
  @UseGuards(GuardiaJwt)
  archivarConversacion(@Request() req, @Param('id') id: string) {
    return this.servicioChat.archivarConversacion(id, req.user.usuarioId);
  }

  // Endpoints públicos para chat con límite
  @Post('publico/iniciar')
  async iniciarChatPublico(@Body() body: { mensaje: string; sesionId?: string }) {
    return this.servicioChat.iniciarChatPublico(body.mensaje, body.sesionId);
  }

  @Post('publico/mensaje')
  async enviarMensajePublico(@Body() body: { mensaje: string; sesionId: string }) {
    return this.servicioChat.enviarMensajePublico(body.mensaje, body.sesionId);
  }

  @Get('publico/sesion/:sesionId')
  async obtenerSesionPublica(@Param('sesionId') sesionId: string) {
    return this.servicioChat.obtenerSesionPublica(sesionId);
  }
}