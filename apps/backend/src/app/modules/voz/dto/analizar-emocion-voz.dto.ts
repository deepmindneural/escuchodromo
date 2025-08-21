import { IsString, IsNumber, IsOptional } from 'class-validator';

export class AnalizarEmocionVozDto {
  @IsString()
  audioBase64: string;

  @IsNumber()
  @IsOptional()
  duracion?: number;

  @IsString()
  @IsOptional()
  idioma?: string;
}