import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ServicioAutenticacion } from './servicio-autenticacion';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { CrearUsuarioDto } from '../usuarios/dto/crear-usuario.dto';
import { GuardiaJwt } from './guardias/guardia-jwt';

@Controller('autenticacion')
export class ControladorAutenticacion {
  constructor(private servicioAutenticacion: ServicioAutenticacion) {}

  @Post('iniciar-sesion')
  async iniciarSesion(@Body() iniciarSesionDto: IniciarSesionDto) {
    return this.servicioAutenticacion.iniciarSesion(iniciarSesionDto);
  }

  @Post('registrar')
  async registrar(@Body() crearUsuarioDto: CrearUsuarioDto) {
    return this.servicioAutenticacion.registrar(crearUsuarioDto);
  }

  @UseGuards(GuardiaJwt)
  @Get('yo')
  obtenerPerfil(@Request() req) {
    return req.user;
  }
}