import { Module } from '@nestjs/common';
import { ServicioUsuarios } from './servicio-usuarios';
import { ControladorUsuarios } from './controlador-usuarios';

@Module({
  controllers: [ControladorUsuarios],
  providers: [ServicioUsuarios],
  exports: [ServicioUsuarios],
})
export class ModuloUsuarios {}