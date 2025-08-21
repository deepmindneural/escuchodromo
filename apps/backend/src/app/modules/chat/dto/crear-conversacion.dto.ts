import { IsOptional, IsString } from 'class-validator';

export class CrearConversacionDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  usuarioId?: string;
}