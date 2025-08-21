import { IsString, IsOptional } from 'class-validator';

export class ProcesarPagoDto {
  @IsString()
  pagoId: string;

  @IsOptional()
  @IsString()
  tokenConfirmacion?: string;
}