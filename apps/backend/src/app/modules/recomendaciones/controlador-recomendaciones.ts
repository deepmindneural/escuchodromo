import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServicioRecomendaciones } from './servicio-recomendaciones';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';

@Controller('recomendaciones')
@UseGuards(GuardiaJwt)
export class ControladorRecomendaciones {
  constructor(private readonly servicioRecomendaciones: ServicioRecomendaciones) {}

  @Post('generar')
  generarRecomendaciones(@Request() req) {
    return this.servicioRecomendaciones.generarRecomendacionesPersonalizadas(
      req.user.usuarioId
    );
  }

  @Get('activas')
  obtenerRecomendacionesActivas(@Request() req) {
    return this.servicioRecomendaciones.obtenerRecomendacionesActivas(
      req.user.usuarioId
    );
  }

  @Patch(':id/completar')
  marcarComoCompletada(@Request() req, @Param('id') id: string) {
    return this.servicioRecomendaciones.marcarComoCompletada(
      id,
      req.user.usuarioId
    );
  }

  @Get('ejercicios')
  obtenerEjerciciosRecomendados(@Request() req) {
    return this.servicioRecomendaciones.obtenerEjerciciosRecomendados(
      req.user.usuarioId
    );
  }
}