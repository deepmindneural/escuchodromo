import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';

enum RolUsuario {
  USUARIO = 'USUARIO',
  TERAPEUTA = 'TERAPEUTA',
  ADMIN = 'ADMIN',
}

export class CrearUsuarioDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(RolUsuario)
  @IsOptional()
  rol?: RolUsuario;
}