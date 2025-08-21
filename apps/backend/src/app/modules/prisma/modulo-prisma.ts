import { Module, Global } from '@nestjs/common';
import { ServicioPrisma } from './servicio-prisma';

@Global()
@Module({
  providers: [ServicioPrisma],
  exports: [ServicioPrisma],
})
export class ModuloPrisma {}