import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/servicio-prisma';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicioUsuarios {
  constructor(private prisma: ServicioPrisma) {}

  async crear(crearUsuarioDto: CrearUsuarioDto) {
    try {
      const { password, ...datosUsuario } = crearUsuarioDto;
      const usuario = await this.prisma.usuario.create({
        data: {
          ...datosUsuario,
          hashContrasena: password,
          perfil: {
            create: {
              idiomaPreferido: 'es',
              moneda: 'COP',
              zonaHoraria: 'America/Bogota',
            },
          },
        },
        include: {
          perfil: true,
        },
      });
      
      const { hashContrasena, ...resultado } = usuario;
      return resultado;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('El email ya existe');
        }
      }
      throw error;
    }
  }

  async encontrarTodos() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estaActivo: true,
        creadoEn: true,
        perfil: true,
      },
    });
  }

  async encontrarUno(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        perfil: true,
        _count: {
          select: {
            conversaciones: true,
            evaluaciones: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { hashContrasena, ...resultado } = usuario;
    return resultado;
  }

  async encontrarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async actualizar(id: string, actualizarUsuarioDto: ActualizarUsuarioDto) {
    try {
      const usuario = await this.prisma.usuario.update({
        where: { id },
        data: actualizarUsuarioDto,
        include: {
          perfil: true,
        },
      });

      const { hashContrasena, ...resultado } = usuario;
      return resultado;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Usuario no encontrado');
        }
      }
      throw error;
    }
  }

  async actualizarPerfil(usuarioId: string, datosPerfil: any) {
    return this.prisma.perfilUsuario.update({
      where: { usuarioId },
      data: datosPerfil,
    });
  }

  async eliminar(id: string) {
    try {
      await this.prisma.usuario.delete({
        where: { id },
      });
      return { mensaje: 'Usuario eliminado exitosamente' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Usuario no encontrado');
        }
      }
      throw error;
    }
  }
}