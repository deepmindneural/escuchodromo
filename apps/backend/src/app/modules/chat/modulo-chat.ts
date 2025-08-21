import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ControladorChat } from './controlador-chat';
import { ServicioChat } from './servicio-chat';
import { GatewayChat } from './gateway-chat';

@Module({
  imports: [JwtModule],
  controllers: [ControladorChat],
  providers: [ServicioChat, GatewayChat],
  exports: [ServicioChat],
})
export class ModuloChat {}