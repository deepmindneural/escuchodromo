import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario de prueba
  const hashContrasena = await bcrypt.hash('123456', 10);
  
  const usuario = await prisma.usuario.upsert({
    where: { email: 'usuario@escuchodromo.com' },
    update: {},
    create: {
      email: 'usuario@escuchodromo.com',
      hashContrasena,
      nombre: 'Usuario Demo',
      rol: 'USUARIO',
      perfil: {
        create: {
          idiomaPreferido: 'es',
          moneda: 'COP',
          zonaHoraria: 'America/Bogota',
          consentimientoDatos: true,
        },
      },
    },
    include: {
      perfil: true,
    },
  });

  console.log('✅ Usuario de prueba creado:', usuario.email);

  // Crear usuario administrador
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@escuchodromo.com' },
    update: {},
    create: {
      email: 'admin@escuchodromo.com',
      hashContrasena,
      nombre: 'Administrador',
      rol: 'ADMIN',
      perfil: {
        create: {
          idiomaPreferido: 'es',
          moneda: 'COP',
          zonaHoraria: 'America/Bogota',
          consentimientoDatos: true,
        },
      },
    },
  });

  console.log('✅ Usuario administrador creado:', admin.email);

  // Crear pruebas psicológicas
  const phq9 = await prisma.prueba.upsert({
    where: { codigo: 'PHQ9' },
    update: {},
    create: {
      codigo: 'PHQ9',
      nombre: 'Cuestionario de Salud del Paciente-9',
      descripcion: 'Evalúa síntomas de depresión en las últimas 2 semanas',
      categoria: 'depresion',
      preguntas: {
        create: [
          {
            orden: 1,
            texto: 'Poco interés o placer en hacer cosas',
            textoEn: 'Little interest or pleasure in doing things',
            opciones: JSON.stringify([
              { valor: 0, etiqueta: 'Para nada', etiquetaEn: 'Not at all' },
              { valor: 1, etiqueta: 'Varios días', etiquetaEn: 'Several days' },
              { valor: 2, etiqueta: 'Más de la mitad de los días', etiquetaEn: 'More than half the days' },
              { valor: 3, etiqueta: 'Casi todos los días', etiquetaEn: 'Nearly every day' },
            ]),
          },
          {
            orden: 2,
            texto: 'Sentirse decaído/a, deprimido/a o sin esperanzas',
            textoEn: 'Feeling down, depressed, or hopeless',
            opciones: JSON.stringify([
              { valor: 0, etiqueta: 'Para nada', etiquetaEn: 'Not at all' },
              { valor: 1, etiqueta: 'Varios días', etiquetaEn: 'Several days' },
              { valor: 2, etiqueta: 'Más de la mitad de los días', etiquetaEn: 'More than half the days' },
              { valor: 3, etiqueta: 'Casi todos los días', etiquetaEn: 'Nearly every day' },
            ]),
          },
        ],
      },
    },
  });

  console.log('✅ Prueba PHQ-9 creada');

  const gad7 = await prisma.prueba.upsert({
    where: { codigo: 'GAD7' },
    update: {},
    create: {
      codigo: 'GAD7',
      nombre: 'Escala del Trastorno de Ansiedad Generalizada-7',
      descripcion: 'Evalúa síntomas de ansiedad en las últimas 2 semanas',
      categoria: 'ansiedad',
      preguntas: {
        create: [
          {
            orden: 1,
            texto: 'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
            textoEn: 'Feeling nervous, anxious or on edge',
            opciones: JSON.stringify([
              { valor: 0, etiqueta: 'Para nada', etiquetaEn: 'Not at all' },
              { valor: 1, etiqueta: 'Varios días', etiquetaEn: 'Several days' },
              { valor: 2, etiqueta: 'Más de la mitad de los días', etiquetaEn: 'More than half the days' },
              { valor: 3, etiqueta: 'Casi todos los días', etiquetaEn: 'Nearly every day' },
            ]),
          },
        ],
      },
    },
  });

  console.log('✅ Prueba GAD-7 creada');

  // Crear conversación de ejemplo
  const conversacion = await prisma.conversacion.create({
    data: {
      usuarioId: usuario.id,
      titulo: 'Mi primera conversación',
      mensajes: {
        create: [
          {
            contenido: 'Hola, me siento un poco ansioso últimamente',
            rol: 'usuario',
            tipo: 'texto',
          },
          {
            contenido: 'Hola, gracias por compartir cómo te sientes. La ansiedad es algo que muchas personas experimentan. ¿Puedes contarme más sobre qué situaciones te generan esta sensación?',
            rol: 'asistente',
            tipo: 'texto',
            sentimiento: 0.2,
            emociones: JSON.stringify({ ansiedad: 0.7, preocupacion: 0.3 }),
          },
        ],
      },
    },
  });

  console.log('✅ Conversación de ejemplo creada');

  // Crear registros de ánimo
  if (usuario.perfil) {
    await prisma.registroAnimo.createMany({
      data: [
        {
          perfilId: usuario.perfil.id,
          animo: 7,
          energia: 6,
          estres: 4,
          notas: 'Me siento bien hoy',
        },
        {
          perfilId: usuario.perfil.id,
          animo: 5,
          energia: 5,
          estres: 6,
          notas: 'Día regular',
        },
      ],
    });
    
    console.log('✅ Registros de ánimo creados');
  }

  // Crear notificaciones de ejemplo
  await prisma.notificacion.createMany({
    data: [
      {
        usuarioId: usuario.id,
        tipo: 'push',
        titulo: '¡Bienvenido a Escuchodromo!',
        contenido: 'Estamos aquí para apoyarte en tu bienestar emocional',
        leida: false,
      },
      {
        usuarioId: usuario.id,
        tipo: 'email',
        titulo: 'Tu primera evaluación está lista',
        contenido: 'Realiza tu primera evaluación para conocer tu estado emocional actual',
        leida: false,
      },
    ],
  });

  console.log('✅ Notificaciones creadas');

  // Crear recomendaciones iniciales
  await prisma.recomendacion.createMany({
    data: [
      {
        usuarioId: usuario.id,
        tipo: 'bienvenida',
        prioridad: 3,
        titulo: 'Completa tu perfil',
        tituloEn: 'Complete your profile',
        descripcion: 'Agrega información sobre ti para recibir recomendaciones más personalizadas',
        descripcionEn: 'Add information about yourself to receive more personalized recommendations',
        urlAccion: '/perfil',
        estaActiva: true,
      },
      {
        usuarioId: usuario.id,
        tipo: 'evaluacion_inicial',
        prioridad: 4,
        titulo: 'Realiza tu primera evaluación',
        tituloEn: 'Take your first assessment',
        descripcion: 'Conoce tu estado emocional actual con una evaluación breve',
        descripcionEn: 'Understand your current emotional state with a brief assessment',
        urlAccion: '/evaluaciones',
        estaActiva: true,
      },
    ],
  });

  console.log('✅ Recomendaciones iniciales creadas');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });