import { Module } from '@nestjs/common';
import { ControladorRecomendaciones } from './controlador-recomendaciones';
import { ServicioRecomendaciones } from './servicio-recomendaciones';

@Module({
  controllers: [ControladorRecomendaciones],
  providers: [ServicioRecomendaciones],
  exports: [ServicioRecomendaciones],
})
export class ModuloRecomendaciones {}