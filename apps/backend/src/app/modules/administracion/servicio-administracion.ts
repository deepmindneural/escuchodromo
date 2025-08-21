import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/servicio-prisma';
import { RolUsuario } from '@prisma/client';

@Injectable()
export class ServicioAdministracion {
  private readonly logger = new Logger(ServicioAdministracion.name);

  constructor(private prisma: PrismaService) {}

  // Dashboard general
  async obtenerEstadisticasGenerales() {
    const [
      totalUsuarios,
      usuariosActivos,
      totalConversaciones,
      totalEvaluaciones,
      totalPagos,
      ingresosTotal,
    ] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.usuario.count({
        where: {
          estaActivo: true,
          creadoEn: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
          },
        },
      }),
      this.prisma.conversacion.count(),
      this.prisma.resultado.count(),
      this.prisma.pago.count({ where: { estado: 'completado' } }),
      this.prisma.pago.aggregate({
        where: { estado: 'completado' },
        _sum: { monto: true },
      }),
    ]);

    // Estadísticas por período
    const ultimaSemana = await this.obtenerEstadisticasPeriodo(7);
    const ultimoMes = await this.obtenerEstadisticasPeriodo(30);

    return {
      general: {
        totalUsuarios,
        usuariosActivos,
        totalConversaciones,
        totalEvaluaciones,
        totalPagos,
        ingresosTotal: ingresosTotal._sum.monto || 0,
      },
      ultimaSemana,
      ultimoMes,
      tasaCrecimiento: this.calcularTasaCrecimiento(ultimoMes, ultimaSemana),
    };
  }

  // Gestión de usuarios
  async obtenerUsuarios(params: {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    rol?: RolUsuario;
    estado?: 'activo' | 'inactivo';
  }) {
    const { pagina = 1, limite = 20, busqueda, rol, estado } = params;
    const skip = (pagina - 1) * limite;

    const where: any = {};

    if (busqueda) {
      where.OR = [
        { email: { contains: busqueda, mode: 'insensitive' } },
        { nombre: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (rol) {
      where.rol = rol;
    }

    if (estado) {
      where.estaActivo = estado === 'activo';
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limite,
        include: {
          perfil: true,
          _count: {
            select: {
              conversaciones: true,
              evaluaciones: true,
              pagos: true,
            },
          },
        },
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      usuarios: usuarios.map(u => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        estaActivo: u.estaActivo,
        fechaRegistro: u.creadoEn,
        estadisticas: {
          conversaciones: u._count.conversaciones,
          evaluaciones: u._count.evaluaciones,
          pagos: u._count.pagos,
        },
        perfil: u.perfil,
      })),
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  async cambiarRolUsuario(usuarioId: string, nuevoRol: RolUsuario) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { rol: nuevoRol },
    });

    this.logger.log(`Rol cambiado para usuario ${usuarioId}: ${nuevoRol}`);

    return usuario;
  }

  async toggleEstadoUsuario(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { estaActivo: !usuario.estaActivo },
    });

    this.logger.log(
      `Estado cambiado para usuario ${usuarioId}: ${usuarioActualizado.estaActivo ? 'activo' : 'inactivo'}`
    );

    return usuarioActualizado;
  }

  // Análisis de conversaciones
  async obtenerAnalisisConversaciones() {
    const conversacionesPorDia = await this.prisma.conversacion.groupBy({
      by: ['creadoEn'],
      _count: true,
      orderBy: { creadoEn: 'desc' },
      take: 30,
    });

    const temasComunes = await this.analizarTemasComunes();
    const sentimientoPromedio = await this.calcularSentimientoPromedio();

    return {
      conversacionesPorDia: conversacionesPorDia.map(c => ({
        fecha: c.creadoEn,
        cantidad: c._count,
      })),
      temasComunes,
      sentimientoPromedio,
    };
  }

  // Análisis de evaluaciones
  async obtenerAnalisisEvaluaciones() {
    const evaluacionesPorTipo = await this.prisma.resultado.groupBy({
      by: ['pruebaId'],
      _count: true,
    });

    const severidadPromedio = await this.prisma.resultado.groupBy({
      by: ['severidad'],
      _count: true,
    });

    const tendencias = await this.analizarTendenciasEvaluaciones();

    return {
      porTipo: evaluacionesPorTipo,
      severidadDistribucion: severidadPromedio,
      tendencias,
    };
  }

  // Gestión de contenido
  async obtenerRecomendaciones(params: {
    pagina?: number;
    limite?: number;
    tipo?: string;
  }) {
    const { pagina = 1, limite = 20, tipo } = params;
    const skip = (pagina - 1) * limite;

    const where: any = {};
    if (tipo) {
      where.tipo = tipo;
    }

    const [recomendaciones, total] = await Promise.all([
      this.prisma.recomendacion.findMany({
        where,
        skip,
        take: limite,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.recomendacion.count({ where }),
    ]);

    return {
      recomendaciones,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  // Reportes financieros
  async obtenerReporteFinanciero(periodo: 'dia' | 'semana' | 'mes' | 'año') {
    const fechaInicio = this.calcularFechaInicio(periodo);

    const pagos = await this.prisma.pago.findMany({
      where: {
        estado: 'completado',
        creadoEn: { gte: fechaInicio },
      },
      include: {
        usuario: true,
      },
    });

    const ingresosPorMoneda = pagos.reduce((acc, pago) => {
      if (!acc[pago.moneda]) {
        acc[pago.moneda] = 0;
      }
      acc[pago.moneda] += pago.monto;
      return acc;
    }, {} as Record<string, number>);

    const ingresosPorDia = this.agruparPagosPorDia(pagos);

    return {
      periodo,
      fechaInicio,
      fechaFin: new Date(),
      totalPagos: pagos.length,
      ingresosPorMoneda,
      ingresosPorDia,
      pagoPromedio: pagos.length > 0 
        ? pagos.reduce((sum, p) => sum + p.monto, 0) / pagos.length 
        : 0,
    };
  }

  // Notificaciones masivas
  async enviarNotificacionMasiva(datos: {
    tipo: 'todos' | 'suscriptores' | 'inactivos';
    titulo: string;
    contenido: string;
    tipoNotificacion: 'email' | 'push' | 'sms';
  }) {
    let usuarios;

    switch (datos.tipo) {
      case 'todos':
        usuarios = await this.prisma.usuario.findMany({
          where: { estaActivo: true },
        });
        break;
      case 'suscriptores':
        // Buscar usuarios con pagos activos
        const usuariosConPagos = await this.prisma.pago.findMany({
          where: { estado: 'completado' },
          select: { usuarioId: true },
          distinct: ['usuarioId'],
        });
        usuarios = await this.prisma.usuario.findMany({
          where: {
            id: { in: usuariosConPagos.map(p => p.usuarioId) },
            estaActivo: true,
          },
        });
        break;
      case 'inactivos':
        usuarios = await this.prisma.usuario.findMany({
          where: {
            estaActivo: true,
            actualizadoEn: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Inactivos por 7 días
            },
          },
        });
        break;
    }

    const notificaciones = usuarios.map(usuario => ({
      usuarioId: usuario.id,
      tipo: datos.tipoNotificacion,
      titulo: datos.titulo,
      contenido: datos.contenido,
    }));

    await this.prisma.notificacion.createMany({
      data: notificaciones,
    });

    this.logger.log(
      `Notificación masiva enviada a ${usuarios.length} usuarios`
    );

    return {
      usuariosNotificados: usuarios.length,
      tipo: datos.tipo,
    };
  }

  // Métodos auxiliares privados
  private async obtenerEstadisticasPeriodo(dias: number) {
    const fechaInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const [usuarios, conversaciones, evaluaciones, pagos] = await Promise.all([
      this.prisma.usuario.count({
        where: { creadoEn: { gte: fechaInicio } },
      }),
      this.prisma.conversacion.count({
        where: { creadoEn: { gte: fechaInicio } },
      }),
      this.prisma.resultado.count({
        where: { creadoEn: { gte: fechaInicio } },
      }),
      this.prisma.pago.aggregate({
        where: {
          estado: 'completado',
          creadoEn: { gte: fechaInicio },
        },
        _sum: { monto: true },
        _count: true,
      }),
    ]);

    return {
      nuevosUsuarios: usuarios,
      conversaciones,
      evaluaciones,
      pagos: pagos._count,
      ingresos: pagos._sum.monto || 0,
    };
  }

  private calcularTasaCrecimiento(mes: any, semana: any) {
    const tasaUsuarios = ((semana.nuevosUsuarios * 4) - mes.nuevosUsuarios) / mes.nuevosUsuarios * 100;
    const tasaIngresos = ((semana.ingresos * 4) - mes.ingresos) / mes.ingresos * 100;

    return {
      usuarios: Math.round(tasaUsuarios * 100) / 100,
      ingresos: Math.round(tasaIngresos * 100) / 100,
    };
  }

  private async analizarTemasComunes() {
    // En producción, esto usaría NLP para analizar temas
    return [
      { tema: 'ansiedad', frecuencia: 45 },
      { tema: 'depresión', frecuencia: 32 },
      { tema: 'estrés laboral', frecuencia: 28 },
      { tema: 'relaciones', frecuencia: 25 },
      { tema: 'autoestima', frecuencia: 20 },
    ];
  }

  private async calcularSentimientoPromedio() {
    const mensajes = await this.prisma.mensaje.findMany({
      where: {
        sentimiento: { not: null },
        creadoEn: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: { sentimiento: true },
    });

    if (mensajes.length === 0) return 0;

    const suma = mensajes.reduce((acc, m) => acc + (m.sentimiento || 0), 0);
    return suma / mensajes.length;
  }

  private async analizarTendenciasEvaluaciones() {
    // Análisis de tendencias en los últimos 3 meses
    const meses = 3;
    const tendencias = [];

    for (let i = 0; i < meses; i++) {
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - i - 1);
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() - i);

      const resultados = await this.prisma.resultado.findMany({
        where: {
          creadoEn: {
            gte: fechaInicio,
            lt: fechaFin,
          },
        },
        select: {
          severidad: true,
          puntuacion: true,
        },
      });

      const promedioPuntuacion = resultados.length > 0
        ? resultados.reduce((sum, r) => sum + r.puntuacion, 0) / resultados.length
        : 0;

      tendencias.push({
        mes: fechaInicio.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
        totalEvaluaciones: resultados.length,
        promedioPuntuacion,
      });
    }

    return tendencias.reverse();
  }

  private calcularFechaInicio(periodo: string): Date {
    const ahora = new Date();
    switch (periodo) {
      case 'dia':
        return new Date(ahora.setDate(ahora.getDate() - 1));
      case 'semana':
        return new Date(ahora.setDate(ahora.getDate() - 7));
      case 'mes':
        return new Date(ahora.setMonth(ahora.getMonth() - 1));
      case 'año':
        return new Date(ahora.setFullYear(ahora.getFullYear() - 1));
      default:
        return new Date(ahora.setMonth(ahora.getMonth() - 1));
    }
  }

  private agruparPagosPorDia(pagos: any[]) {
    const grupos: Record<string, number> = {};

    pagos.forEach(pago => {
      const fecha = pago.creadoEn.toISOString().split('T')[0];
      if (!grupos[fecha]) {
        grupos[fecha] = 0;
      }
      grupos[fecha] += pago.monto;
    });

    return Object.entries(grupos).map(([fecha, total]) => ({
      fecha,
      total,
    }));
  }
}