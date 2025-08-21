import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CrearPagoDto {
  @IsString()
  planId: string;

  @IsEnum(['stripe', 'paypal'])
  proveedor: 'stripe' | 'paypal';

  @IsOptional()
  @IsEnum(['COP', 'USD'])
  moneda?: 'COP' | 'USD';
}