import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/servicio-prisma';
import { ServicioStripe } from './servicios/servicio-stripe';
import { ServicioPayPal } from './servicios/servicio-paypal';
import { CrearPagoDto } from './dto/crear-pago.dto';
import { CrearSuscripcionDto } from './dto/crear-suscripcion.dto';
import { ProcesarPagoDto } from './dto/procesar-pago.dto';

export interface PlanesSuscripcion {
  id: string;
  nombre: string;
  precio: {
    COP: number;
    USD: number;
  };
  caracteristicas: string[];
  duracionDias: number;
}

@Injectable()
export class ServicioPagos {
  private readonly logger = new Logger(ServicioPagos.name);
  
  private readonly planes: PlanesSuscripcion[] = [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      precio: { COP: 29900, USD: 7.99 },
      caracteristicas: [
        'Chat ilimitado con IA',
        '3 evaluaciones psicológicas al mes',
        'Recomendaciones personalizadas básicas',
      ],
      duracionDias: 30,
    },
    {
      id: 'profesional',
      nombre: 'Plan Profesional',
      precio: { COP: 59900, USD: 15.99 },
      caracteristicas: [
        'Todo del plan básico',
        'Conversaciones por voz ilimitadas',
        'Evaluaciones ilimitadas',
        'Análisis emocional avanzado',
        'Reportes mensuales detallados',
      ],
      duracionDias: 30,
    },
    {
      id: 'premium',
      nombre: 'Plan Premium',
      precio: { COP: 99900, USD: 25.99 },
      caracteristicas: [
        'Todo del plan profesional',
        'Sesiones con terapeutas reales (2/mes)',
        'Planes de bienestar personalizados',
        'Acceso prioritario a nuevas funciones',
        'Soporte 24/7',
      ],
      duracionDias: 30,
    },
  ];

  constructor(
    private prisma: PrismaService,
    private servicioStripe: ServicioStripe,
    private servicioPayPal: ServicioPayPal,
  ) {}

  async obtenerPlanes() {
    return this.planes;
  }

  async crearPago(dto: CrearPagoDto, usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { perfil: true },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const plan = this.planes.find(p => p.id === dto.planId);
    if (!plan) {
      throw new BadRequestException('Plan no válido');
    }

    const moneda = dto.moneda || usuario.perfil?.moneda || 'COP';
    const monto = plan.precio[moneda as keyof typeof plan.precio];

    // Crear registro de pago pendiente
    const pago = await this.prisma.pago.create({
      data: {
        usuarioId,
        monto,
        moneda,
        estado: 'pendiente',
        proveedor: dto.proveedor,
        metadatos: JSON.stringify({
          planId: plan.id,
          planNombre: plan.nombre,
          duracionDias: plan.duracionDias,
        }),
      },
    });

    // Inicializar pago según el proveedor
    let respuestaPago;
    if (dto.proveedor === 'stripe') {
      respuestaPago = await this.servicioStripe.crearIntencionPago({
        monto,
        moneda,
        descripcion: `Suscripción ${plan.nombre}`,
        clienteEmail: usuario.email,
        metadatos: {
          pagoId: pago.id,
          usuarioId: usuario.id,
          planId: plan.id,
        },
      });
    } else if (dto.proveedor === 'paypal') {
      respuestaPago = await this.servicioPayPal.crearOrden({
        monto,
        moneda,
        descripcion: `Suscripción ${plan.nombre}`,
        pagoId: pago.id,
      });
    } else {
      throw new BadRequestException('Proveedor de pago no válido');
    }

    // Actualizar pago con ID del proveedor
    await this.prisma.pago.update({
      where: { id: pago.id },
      data: {
        proveedorId: respuestaPago.id,
      },
    });

    return {
      pagoId: pago.id,
      proveedorId: respuestaPago.id,
      clientSecret: respuestaPago.clientSecret,
      urlAprobacion: respuestaPago.urlAprobacion,
    };
  }

  async procesarPago(dto: ProcesarPagoDto) {
    const pago = await this.prisma.pago.findUnique({
      where: { id: dto.pagoId },
      include: { usuario: true },
    });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }

    if (pago.estado !== 'pendiente') {
      throw new BadRequestException('El pago ya fue procesado');
    }

    try {
      let confirmado = false;

      if (pago.proveedor === 'stripe') {
        confirmado = await this.servicioStripe.confirmarPago(
          pago.proveedorId!,
          dto.tokenConfirmacion
        );
      } else if (pago.proveedor === 'paypal') {
        confirmado = await this.servicioPayPal.capturarOrden(
          pago.proveedorId!
        );
      }

      if (confirmado) {
        // Actualizar estado del pago
        await this.prisma.pago.update({
          where: { id: pago.id },
          data: {
            estado: 'completado',
          },
        });

        // Crear o actualizar suscripción
        const metadatos = JSON.parse(pago.metadatos || '{}');
        await this.crearOActualizarSuscripcion({
          usuarioId: pago.usuarioId,
          planId: metadatos.planId,
          pagoId: pago.id,
          duracionDias: metadatos.duracionDias,
        });

        // Enviar notificación
        await this.enviarNotificacionPago(pago.usuario, 'completado');

        return {
          estado: 'completado',
          mensaje: 'Pago procesado exitosamente',
        };
      } else {
        await this.prisma.pago.update({
          where: { id: pago.id },
          data: {
            estado: 'fallido',
          },
        });

        return {
          estado: 'fallido',
          mensaje: 'El pago no pudo ser confirmado',
        };
      }
    } catch (error) {
      this.logger.error('Error al procesar pago:', error);
      
      await this.prisma.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'fallido',
        },
      });

      throw new BadRequestException('Error al procesar el pago');
    }
  }

  async cancelarPago(pagoId: string, usuarioId: string) {
    const pago = await this.prisma.pago.findFirst({
      where: {
        id: pagoId,
        usuarioId,
        estado: 'pendiente',
      },
    });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado o ya procesado');
    }

    await this.prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: 'fallido',
      },
    });

    return {
      mensaje: 'Pago cancelado',
    };
  }

  async obtenerHistorialPagos(usuarioId: string) {
    const pagos = await this.prisma.pago.findMany({
      where: {
        usuarioId,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });

    return pagos.map(pago => ({
      id: pago.id,
      monto: pago.monto,
      moneda: pago.moneda,
      estado: pago.estado,
      fecha: pago.creadoEn,
      metadatos: JSON.parse(pago.metadatos || '{}'),
    }));
  }

  async obtenerSuscripcionActiva(usuarioId: string) {
    // Por ahora simulamos la suscripción activa
    // En producción, esto consultaría la tabla de suscripciones
    const ultimoPago = await this.prisma.pago.findFirst({
      where: {
        usuarioId,
        estado: 'completado',
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });

    if (!ultimoPago) {
      return null;
    }

    const metadatos = JSON.parse(ultimoPago.metadatos || '{}');
    const plan = this.planes.find(p => p.id === metadatos.planId);

    return {
      planId: metadatos.planId,
      planNombre: plan?.nombre,
      fechaInicio: ultimoPago.creadoEn,
      fechaFin: new Date(
        ultimoPago.creadoEn.getTime() + (metadatos.duracionDias * 24 * 60 * 60 * 1000)
      ),
      estado: 'activa',
    };
  }

  private async crearOActualizarSuscripcion(data: {
    usuarioId: string;
    planId: string;
    pagoId: string;
    duracionDias: number;
  }) {
    // En producción, esto manejaría la lógica de suscripciones
    // Por ahora solo registramos el pago exitoso
    this.logger.log(`Suscripción creada para usuario ${data.usuarioId}, plan ${data.planId}`);
  }

  private async enviarNotificacionPago(usuario: any, estado: string) {
    await this.prisma.notificacion.create({
      data: {
        usuarioId: usuario.id,
        tipo: 'email',
        titulo: estado === 'completado' 
          ? '¡Pago exitoso!' 
          : 'Problema con tu pago',
        contenido: estado === 'completado'
          ? 'Tu suscripción ha sido activada exitosamente. ¡Gracias por confiar en Escuchodromo!'
          : 'Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.',
        enviadaEn: new Date(),
      },
    });
  }
}