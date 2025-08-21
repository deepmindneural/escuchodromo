import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ServicioPagos } from './servicio-pagos';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';
import { CrearPagoDto } from './dto/crear-pago.dto';
import { ProcesarPagoDto } from './dto/procesar-pago.dto';

@Controller('pagos')
export class ControladorPagos {
  constructor(private readonly servicioPagos: ServicioPagos) {}

  @Get('planes')
  async obtenerPlanes() {
    return this.servicioPagos.obtenerPlanes();
  }

  @UseGuards(GuardiaJwt)
  @Post('crear')
  async crearPago(@Body() dto: CrearPagoDto, @Request() req: any) {
    return this.servicioPagos.crearPago(dto, req.user.sub);
  }

  @UseGuards(GuardiaJwt)
  @Post('procesar')
  async procesarPago(@Body() dto: ProcesarPagoDto) {
    return this.servicioPagos.procesarPago(dto);
  }

  @UseGuards(GuardiaJwt)
  @Delete(':pagoId')
  async cancelarPago(@Param('pagoId') pagoId: string, @Request() req: any) {
    return this.servicioPagos.cancelarPago(pagoId, req.user.sub);
  }

  @UseGuards(GuardiaJwt)
  @Get('historial')
  async obtenerHistorial(@Request() req: any) {
    return this.servicioPagos.obtenerHistorialPagos(req.user.sub);
  }

  @UseGuards(GuardiaJwt)
  @Get('suscripcion/activa')
  async obtenerSuscripcionActiva(@Request() req: any) {
    return this.servicioPagos.obtenerSuscripcionActiva(req.user.sub);
  }

  // Webhooks (sin autenticación JWT)
  @Post('webhook/stripe')
  async webhookStripe(@Body() body: any, @Request() req: any) {
    // En producción, verificar la firma del webhook
    const signature = req.headers['stripe-signature'];
    // return this.servicioPagos.procesarWebhookStripe(body, signature);
    return { received: true };
  }

  @Post('webhook/paypal')
  async webhookPayPal(@Body() body: any, @Request() req: any) {
    // En producción, verificar el webhook de PayPal
    // return this.servicioPagos.procesarWebhookPayPal(req.headers, body);
    return { status: 'success' };
  }
}