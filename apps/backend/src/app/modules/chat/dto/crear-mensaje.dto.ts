import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CrearMensajeDto {
  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsString()
  @IsNotEmpty()
  conversacionId: string;

  @IsString()
  @IsOptional()
  tipo?: string;
}