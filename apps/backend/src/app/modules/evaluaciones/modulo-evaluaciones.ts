import { Module } from '@nestjs/common';
import { ControladorEvaluaciones } from './controlador-evaluaciones';
import { ServicioEvaluaciones } from './servicio-evaluaciones';

@Module({
  controllers: [ControladorEvaluaciones],
  providers: [ServicioEvaluaciones],
  exports: [ServicioEvaluaciones],
})
export class ModuloEvaluaciones {}