import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModuloPrisma } from './modules/prisma/modulo-prisma';
import { ModuloAutenticacion } from './modules/autenticacion/modulo-autenticacion';
import { ModuloUsuarios } from './modules/usuarios/modulo-usuarios';
import { ModuloChat } from './modules/chat/modulo-chat';
import { ModuloEvaluaciones } from './modules/evaluaciones/modulo-evaluaciones';
import { ModuloRecomendaciones } from './modules/recomendaciones/modulo-recomendaciones';
import { ModuloNotificaciones } from './modules/notificaciones/modulo-notificaciones';
import { ModuloVoz } from './modules/voz/modulo-voz';
import { ModuloPagos } from './modules/pagos/modulo-pagos';
import { ModuloAdministracion } from './modules/administracion/modulo-administracion';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ModuloPrisma,
    ModuloAutenticacion,
    ModuloUsuarios,
    ModuloChat,
    ModuloEvaluaciones,
    ModuloRecomendaciones,
    ModuloNotificaciones,
    ModuloVoz,
    ModuloPagos,
    ModuloAdministracion,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}