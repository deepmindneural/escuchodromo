import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ServicioAutenticacion } from '../servicio-autenticacion';

@Injectable()
export class EstrategiaLocal extends PassportStrategy(Strategy) {
  constructor(private servicioAutenticacion: ServicioAutenticacion) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, contrasena: string): Promise<any> {
    const usuario = await this.servicioAutenticacion.validarUsuario(email, contrasena);
    if (!usuario) {
      throw new UnauthorizedException();
    }
    return usuario;
  }
}