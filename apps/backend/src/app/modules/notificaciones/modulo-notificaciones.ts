import { Module } from '@nestjs/common';
import { ControladorNotificaciones } from './controlador-notificaciones';
import { ServicioNotificaciones } from './servicio-notificaciones';

@Module({
  controllers: [ControladorNotificaciones],
  providers: [ServicioNotificaciones],
  exports: [ServicioNotificaciones],
})
export class ModuloNotificaciones {}