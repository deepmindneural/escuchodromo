import { IsOptional, IsString, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export class ActualizarPerfilDto {
  @IsString()
  @IsOptional()
  telefono?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsString()
  @IsOptional()
  genero?: string;

  @IsEnum(['es', 'en'])
  @IsOptional()
  idiomaPreferido?: 'es' | 'en';

  @IsEnum(['COP', 'USD'])
  @IsOptional()
  moneda?: 'COP' | 'USD';

  @IsString()
  @IsOptional()
  zonaHoraria?: string;

  @IsBoolean()
  @IsOptional()
  consentimientoDatos?: boolean;

  @IsBoolean()
  @IsOptional()
  consentimientoMkt?: boolean;
}