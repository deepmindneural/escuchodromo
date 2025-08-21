import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CrearNotificacionDto {
  @IsString()
  @IsNotEmpty()
  usuarioId: string;

  @IsEnum(['email', 'push', 'sms'])
  tipo: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsOptional()
  metadatos?: any;
}