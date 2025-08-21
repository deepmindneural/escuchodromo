import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ServicioVoz } from './servicio-voz';
import { ControladorVoz } from './controlador-voz';
import { GatewayVoz } from './gateway-voz';

@Module({
  imports: [JwtModule],
  providers: [ServicioVoz, GatewayVoz],
  controllers: [ControladorVoz],
  exports: [ServicioVoz],
})
export class ModuloVoz {}