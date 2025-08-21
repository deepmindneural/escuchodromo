import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServicioNotificaciones } from './servicio-notificaciones';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';

@Controller('notificaciones')
@UseGuards(GuardiaJwt)
export class ControladorNotificaciones {
  constructor(private readonly servicioNotificaciones: ServicioNotificaciones) {}

  @Get()
  obtenerNotificaciones(@Request() req) {
    return this.servicioNotificaciones.obtenerNotificaciones(req.user.usuarioId);
  }

  @Get('no-leidas')
  obtenerNoLeidas(@Request() req) {
    return this.servicioNotificaciones.obtenerNoLeidas(req.user.usuarioId);
  }

  @Get('contador')
  async contarNoLeidas(@Request() req) {
    const cantidad = await this.servicioNotificaciones.contarNoLeidas(req.user.usuarioId);
    return { cantidad };
  }

  @Patch(':id/leer')
  marcarComoLeida(@Request() req, @Param('id') id: string) {
    return this.servicioNotificaciones.marcarComoLeida(id, req.user.usuarioId);
  }

  @Post('leer-todas')
  marcarTodasComoLeidas(@Request() req) {
    return this.servicioNotificaciones.marcarTodasComoLeidas(req.user.usuarioId);
  }

  @Post('programar-recordatorios')
  programarRecordatorios(@Request() req) {
    return this.servicioNotificaciones.programarRecordatorios(req.user.usuarioId);
  }
}