import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/servicio-prisma';
import { PRUEBAS_PSICOLOGICAS, calcularPuntuacionPHQ9, calcularPuntuacionGAD7, verificarIdeacionSuicida } from '@escuchodromo/shared';
import { EnviarRespuestasDto } from './dto/enviar-respuestas.dto';

@Injectable()
export class ServicioEvaluaciones {
  constructor(private prisma: ServicioPrisma) {}

  async inicializarPruebas() {
    // Verificar si las pruebas ya existen
    const pruebasExistentes = await this.prisma.prueba.count();
    if (pruebasExistentes > 0) return;

    // Crear PHQ-9
    const phq9 = await this.prisma.prueba.create({
      data: {
        codigo: 'PHQ9',
        nombre: PRUEBAS_PSICOLOGICAS.PHQ9.nombre,
        descripcion: 'Cuestionario sobre la salud del paciente para evaluar síntomas de depresión',
        categoria: 'depresion',
        preguntas: {
          create: PRUEBAS_PSICOLOGICAS.PHQ9.preguntas.map((pregunta, index) => ({
            orden: index + 1,
            texto: pregunta.texto,
            textoEn: pregunta.textoEn,
            opciones: JSON.stringify(PRUEBAS_PSICOLOGICAS.PHQ9.opciones),
          })),
        },
      },
    });

    // Crear GAD-7
    const gad7 = await this.prisma.prueba.create({
      data: {
        codigo: 'GAD7',
        nombre: PRUEBAS_PSICOLOGICAS.GAD7.nombre,
        descripcion: 'Escala del trastorno de ansiedad generalizada',
        categoria: 'ansiedad',
        preguntas: {
          create: PRUEBAS_PSICOLOGICAS.GAD7.preguntas.map((pregunta, index) => ({
            orden: index + 1,
            texto: pregunta.texto,
            textoEn: pregunta.textoEn,
            opciones: JSON.stringify(PRUEBAS_PSICOLOGICAS.GAD7.opciones),
          })),
        },
      },
    });

    return { phq9, gad7 };
  }

  async obtenerPruebas() {
    return this.prisma.prueba.findMany({
      where: { estaActiva: true },
      include: {
        _count: {
          select: { preguntas: true },
        },
      },
    });
  }

  async obtenerPrueba(codigo: string) {
    const prueba = await this.prisma.prueba.findUnique({
      where: { codigo },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!prueba) {
      throw new NotFoundException('Prueba no encontrada');
    }

    return prueba;
  }

  async enviarRespuestas(usuarioId: string, enviarRespuestasDto: EnviarRespuestasDto) {
    const { codigoPrueba, respuestas } = enviarRespuestasDto;
    
    // Verificar que la prueba existe
    const prueba = await this.obtenerPrueba(codigoPrueba);
    
    // Calcular puntuación según el tipo de prueba
    let resultado;
    if (codigoPrueba === 'PHQ9') {
      resultado = calcularPuntuacionPHQ9(respuestas);
      
      // Verificar ideación suicida
      if (verificarIdeacionSuicida(respuestas)) {
        // TODO: Activar protocolo de emergencia
        await this.crearAlertaRiesgo(usuarioId, 'ideacion_suicida', codigoPrueba);
      }
    } else if (codigoPrueba === 'GAD7') {
      resultado = calcularPuntuacionGAD7(respuestas);
    } else {
      throw new NotFoundException('Calculador de puntuación no disponible para esta prueba');
    }

    // Guardar resultado
    const resultadoGuardado = await this.prisma.resultado.create({
      data: {
        pruebaId: prueba.id,
        usuarioId,
        puntuacion: resultado.puntuacion,
        severidad: resultado.severidad,
        respuestas: JSON.stringify(respuestas),
        interpretacion: resultado.interpretacion,
      },
      include: {
        prueba: true,
      },
    });

    // Generar recomendaciones basadas en el resultado
    await this.generarRecomendaciones(usuarioId, resultadoGuardado);

    return resultadoGuardado;
  }

  async obtenerHistorial(usuarioId: string) {
    return this.prisma.resultado.findMany({
      where: { usuarioId },
      include: {
        prueba: true,
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerResultado(id: string, usuarioId: string) {
    const resultado = await this.prisma.resultado.findFirst({
      where: { id, usuarioId },
      include: {
        prueba: {
          include: {
            preguntas: {
              orderBy: { orden: 'asc' },
            },
          },
        },
      },
    });

    if (!resultado) {
      throw new NotFoundException('Resultado no encontrado');
    }

    return resultado;
  }

  async obtenerProgreso(usuarioId: string, codigoPrueba: string) {
    const resultados = await this.prisma.resultado.findMany({
      where: {
        usuarioId,
        prueba: { codigo: codigoPrueba },
      },
      orderBy: { creadoEn: 'asc' },
      take: 10, // Últimos 10 resultados
    });

    return {
      prueba: codigoPrueba,
      resultados: resultados.map(r => ({
        fecha: r.creadoEn,
        puntuacion: r.puntuacion,
        severidad: r.severidad,
      })),
    };
  }

  private async generarRecomendaciones(usuarioId: string, resultado: any) {
    const recomendaciones = [];

    // Recomendaciones basadas en severidad
    if (resultado.severidad === 'severa' || resultado.severidad === 'moderadamente_severa') {
      recomendaciones.push({
        usuarioId,
        tipo: 'ayuda_profesional',
        prioridad: 5,
        titulo: 'Buscar ayuda profesional',
        tituloEn: 'Seek professional help',
        descripcion: 'Te recomendamos buscar ayuda de un profesional de salud mental.',
        descripcionEn: 'We recommend seeking help from a mental health professional.',
      });
    }

    if (resultado.severidad === 'moderada' || resultado.severidad === 'leve') {
      recomendaciones.push({
        usuarioId,
        tipo: 'tecnicas_relajacion',
        prioridad: 3,
        titulo: 'Técnicas de relajación',
        tituloEn: 'Relaxation techniques',
        descripcion: 'Practica ejercicios de respiración y meditación diariamente.',
        descripcionEn: 'Practice breathing exercises and meditation daily.',
      });
    }

    // Guardar recomendaciones
    if (recomendaciones.length > 0) {
      await this.prisma.recomendacion.createMany({
        data: recomendaciones,
      });
    }

    return recomendaciones;
  }

  private async crearAlertaRiesgo(usuarioId: string, tipo: string, codigoPrueba: string) {
    // TODO: Implementar sistema de alertas para profesionales
    console.log(`ALERTA DE RIESGO: Usuario ${usuarioId} - Tipo: ${tipo} - Prueba: ${codigoPrueba}`);
    
    // Crear notificación urgente
    await this.prisma.notificacion.create({
      data: {
        usuarioId,
        tipo: 'alerta_riesgo',
        titulo: 'Alerta de riesgo detectada',
        contenido: 'Se ha detectado una situación que requiere atención inmediata. Un profesional se pondrá en contacto contigo pronto.',
        leida: false,
      },
    });
  }
}