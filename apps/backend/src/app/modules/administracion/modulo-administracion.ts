import { Module } from '@nestjs/common';
import { ServicioAdministracion } from './servicio-administracion';
import { ControladorAdministracion } from './controlador-administracion';
import { ModuloUsuarios } from '../usuarios/modulo-usuarios';
import { ModuloEvaluaciones } from '../evaluaciones/modulo-evaluaciones';
import { ModuloPagos } from '../pagos/modulo-pagos';

@Module({
  imports: [ModuloUsuarios, ModuloEvaluaciones, ModuloPagos],
  providers: [ServicioAdministracion],
  controllers: [ControladorAdministracion],
  exports: [ServicioAdministracion],
})
export class ModuloAdministracion {}