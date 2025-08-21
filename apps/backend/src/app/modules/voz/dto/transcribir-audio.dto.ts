import { IsString, IsOptional, IsNumber } from 'class-validator';

export class TranscribirAudioDto {
  @IsString()
  conversacionId: string;

  @IsString()
  @IsOptional()
  audioBase64?: string;

  @IsString()
  @IsOptional()
  audioUrl?: string;

  @IsNumber()
  @IsOptional()
  duracion?: number;

  @IsString()
  @IsOptional()
  formato?: string; // webm, mp3, wav
}