import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy) {
  constructor(private servicioConfig: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: servicioConfig.get<string>('JWT_SECRET', 'tu-clave-secreta'),
    });
  }

  async validate(cargaUtil: any) {
    return { usuarioId: cargaUtil.sub, email: cargaUtil.email, rol: cargaUtil.rol };
  }
}