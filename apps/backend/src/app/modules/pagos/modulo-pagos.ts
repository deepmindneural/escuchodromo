import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServicioPagos } from './servicio-pagos';
import { ControladorPagos } from './controlador-pagos';
import { ServicioStripe } from './servicios/servicio-stripe';
import { ServicioPayPal } from './servicios/servicio-paypal';

@Module({
  imports: [ConfigModule],
  providers: [ServicioPagos, ServicioStripe, ServicioPayPal],
  controllers: [ControladorPagos],
  exports: [ServicioPagos],
})
export class ModuloPagos {}