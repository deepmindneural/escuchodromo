import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ControladorAutenticacion } from './controlador-autenticacion';
import { ServicioAutenticacion } from './servicio-autenticacion';
import { EstrategiaLocal } from './estrategias/estrategia-local';
import { EstrategiaJwt } from './estrategias/estrategia-jwt';
import { ModuloUsuarios } from '../usuarios/modulo-usuarios';

@Module({
  imports: [
    ConfigModule,
    ModuloUsuarios,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'tu-clave-secreta'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ControladorAutenticacion],
  providers: [ServicioAutenticacion, EstrategiaLocal, EstrategiaJwt],
  exports: [ServicioAutenticacion],
})
export class ModuloAutenticacion {}