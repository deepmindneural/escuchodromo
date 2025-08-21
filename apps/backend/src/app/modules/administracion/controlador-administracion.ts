import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicioAdministracion } from './servicio-administracion';
import { GuardiaJwt } from '../autenticacion/guardias/guardia-jwt';
import { Roles } from '../autenticacion/decoradores/roles.decorador';
import { GuardiaRoles } from '../autenticacion/guardias/guardia-roles';
import { RolUsuario } from '@prisma/client';

@Controller('admin')
@UseGuards(GuardiaJwt, GuardiaRoles)
@Roles('ADMIN')
export class ControladorAdministracion {
  constructor(private readonly servicioAdmin: ServicioAdministracion) {}

  // Dashboard
  @Get('estadisticas')
  async obtenerEstadisticas() {
    return this.servicioAdmin.obtenerEstadisticasGenerales();
  }

  // Usuarios
  @Get('usuarios')
  async obtenerUsuarios(
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @Query('busqueda') busqueda?: string,
    @Query('rol') rol?: RolUsuario,
    @Query('estado') estado?: 'activo' | 'inactivo',
  ) {
    return this.servicioAdmin.obtenerUsuarios({
      pagina: pagina ? parseInt(pagina) : undefined,
      limite: limite ? parseInt(limite) : undefined,
      busqueda,
      rol,
      estado,
    });
  }

  @Put('usuarios/:id/rol')
  async cambiarRolUsuario(
    @Param('id') usuarioId: string,
    @Body('rol') nuevoRol: RolUsuario,
  ) {
    return this.servicioAdmin.cambiarRolUsuario(usuarioId, nuevoRol);
  }

  @Put('usuarios/:id/toggle-estado')
  async toggleEstadoUsuario(@Param('id') usuarioId: string) {
    return this.servicioAdmin.toggleEstadoUsuario(usuarioId);
  }

  // Análisis
  @Get('analisis/conversaciones')
  async obtenerAnalisisConversaciones() {
    return this.servicioAdmin.obtenerAnalisisConversaciones();
  }

  @Get('analisis/evaluaciones')
  async obtenerAnalisisEvaluaciones() {
    return this.servicioAdmin.obtenerAnalisisEvaluaciones();
  }

  // Finanzas
  @Get('finanzas/reporte')
  async obtenerReporteFinanciero(
    @Query('periodo') periodo: 'dia' | 'semana' | 'mes' | 'año' = 'mes',
  ) {
    return this.servicioAdmin.obtenerReporteFinanciero(periodo);
  }

  // Contenido
  @Get('recomendaciones')
  async obtenerRecomendaciones(
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.servicioAdmin.obtenerRecomendaciones({
      pagina: pagina ? parseInt(pagina) : undefined,
      limite: limite ? parseInt(limite) : undefined,
      tipo,
    });
  }

  // Notificaciones
  @Post('notificaciones/masiva')
  async enviarNotificacionMasiva(
    @Body() datos: {
      tipo: 'todos' | 'suscriptores' | 'inactivos';
      titulo: string;
      contenido: string;
      tipoNotificacion: 'email' | 'push' | 'sms';
    },
  ) {
    return this.servicioAdmin.enviarNotificacionMasiva(datos);
  }
}