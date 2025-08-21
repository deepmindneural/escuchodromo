import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ServicioUsuarios } from '../usuarios/servicio-usuarios';
import { CrearUsuarioDto } from '../usuarios/dto/crear-usuario.dto';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';

@Injectable()
export class ServicioAutenticacion {
  constructor(
    private servicioUsuarios: ServicioUsuarios,
    private servicioJwt: JwtService,
  ) {}

  async validarUsuario(email: string, contrasena: string): Promise<any> {
    const usuario = await this.servicioUsuarios.encontrarPorEmail(email);
    if (usuario && usuario.hashContrasena) {
      const esContrasenaValida = await bcrypt.compare(contrasena, usuario.hashContrasena);
      if (esContrasenaValida) {
        const { hashContrasena, ...resultado } = usuario;
        return resultado;
      }
    }
    return null;
  }

  async iniciarSesion(iniciarSesionDto: IniciarSesionDto) {
    const usuario = await this.validarUsuario(iniciarSesionDto.email, iniciarSesionDto.contrasena);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const cargaUtil = { email: usuario.email, sub: usuario.id, rol: usuario.rol };
    return {
      token_acceso: this.servicioJwt.sign(cargaUtil),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    };
  }

  async registrar(crearUsuarioDto: CrearUsuarioDto) {
    const contrasenaHash = await bcrypt.hash(crearUsuarioDto.password, 10);
    const usuario = await this.servicioUsuarios.crear({
      ...crearUsuarioDto,
      password: contrasenaHash,
    });

    const cargaUtil = { email: usuario.email, sub: usuario.id, rol: usuario.rol };
    return {
      token_acceso: this.servicioJwt.sign(cargaUtil),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    };
  }
}