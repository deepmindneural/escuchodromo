import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServicioEvaluaciones } from './servicio-evaluaciones';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';
import { EnviarRespuestasDto } from './dto/enviar-respuestas.dto';

@Controller('evaluaciones')
@UseGuards(GuardiaJwt)
export class ControladorEvaluaciones {
  constructor(private readonly servicioEvaluaciones: ServicioEvaluaciones) {}

  @Get('pruebas')
  obtenerPruebas() {
    return this.servicioEvaluaciones.obtenerPruebas();
  }

  @Get('pruebas/:codigo')
  obtenerPrueba(@Param('codigo') codigo: string) {
    return this.servicioEvaluaciones.obtenerPrueba(codigo);
  }

  @Post('respuestas')
  enviarRespuestas(@Request() req, @Body() enviarRespuestasDto: EnviarRespuestasDto) {
    return this.servicioEvaluaciones.enviarRespuestas(req.user.usuarioId, enviarRespuestasDto);
  }

  @Get('historial')
  obtenerHistorial(@Request() req) {
    return this.servicioEvaluaciones.obtenerHistorial(req.user.usuarioId);
  }

  @Get('resultados/:id')
  obtenerResultado(@Request() req, @Param('id') id: string) {
    return this.servicioEvaluaciones.obtenerResultado(id, req.user.usuarioId);
  }

  @Get('progreso/:codigoPrueba')
  obtenerProgreso(@Request() req, @Param('codigoPrueba') codigoPrueba: string) {
    return this.servicioEvaluaciones.obtenerProgreso(req.user.usuarioId, codigoPrueba);
  }

  @Post('inicializar')
  inicializarPruebas() {
    return this.servicioEvaluaciones.inicializarPruebas();
  }
}