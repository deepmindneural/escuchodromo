import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServicioVoz } from './servicio-voz';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';
import { TranscribirAudioDto } from './dto/transcribir-audio.dto';

@Controller('voz')
@UseGuards(GuardiaJwt)
export class ControladorVoz {
  constructor(private readonly servicioVoz: ServicioVoz) {}

  @Post('transcribir')
  async transcribirAudio(@Body() dto: TranscribirAudioDto, @Request() req: any) {
    return this.servicioVoz.transcribirAudio(dto, req.user.sub);
  }

  @Post('generar-respuesta')
  async generarRespuestaVoz(
    @Body() body: { texto: string; emocionUsuario?: string }
  ) {
    return this.servicioVoz.generarRespuestaVoz(body.texto, body.emocionUsuario);
  }

  @Get('estadisticas')
  async obtenerEstadisticas(@Request() req: any) {
    return this.servicioVoz.obtenerEstadisticasVoz(req.user.sub);
  }
}