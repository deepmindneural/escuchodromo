import { IsString, IsNumber } from 'class-validator';

export class CrearSuscripcionDto {
  @IsString()
  usuarioId: string;

  @IsString()
  planId: string;

  @IsString()
  pagoId: string;

  @IsNumber()
  duracionDias: number;
}