import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServicioUsuarios } from './servicio-usuarios';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';
import { GuardiaRoles } from '../autenticacion/guardias/guardia-roles';
import { Roles } from '../autenticacion/decoradores/decorador-roles';

@Controller('usuarios')
@UseGuards(GuardiaJwt)
export class ControladorUsuarios {
  constructor(private readonly servicioUsuarios: ServicioUsuarios) {}

  @Post()
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN')
  crear(@Body() crearUsuarioDto: CrearUsuarioDto) {
    return this.servicioUsuarios.crear(crearUsuarioDto);
  }

  @Get()
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN')
  encontrarTodos() {
    return this.servicioUsuarios.encontrarTodos();
  }

  @Get('perfil')
  obtenerMiPerfil(@Request() req) {
    return this.servicioUsuarios.encontrarUno(req.user.usuarioId);
  }

  @Patch('perfil')
  actualizarMiPerfil(@Request() req, @Body() actualizarPerfilDto: ActualizarPerfilDto) {
    return this.servicioUsuarios.actualizarPerfil(req.user.usuarioId, actualizarPerfilDto);
  }

  @Get(':id')
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN', 'TERAPEUTA')
  encontrarUno(@Param('id') id: string) {
    return this.servicioUsuarios.encontrarUno(id);
  }

  @Patch(':id')
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN')
  actualizar(@Param('id') id: string, @Body() actualizarUsuarioDto: ActualizarUsuarioDto) {
    return this.servicioUsuarios.actualizar(id, actualizarUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN')
  eliminar(@Param('id') id: string) {
    return this.servicioUsuarios.eliminar(id);
  }
}