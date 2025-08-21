import { IsString, IsArray, IsNotEmpty, ArrayMinSize, IsInt, Min, Max } from 'class-validator';

export class EnviarRespuestasDto {
  @IsString()
  @IsNotEmpty()
  codigoPrueba: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(3, { each: true })
  respuestas: number[];
}