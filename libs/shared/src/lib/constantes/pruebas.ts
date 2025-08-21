export const PRUEBAS_PSICOLOGICAS = {
  PHQ9: {
    codigo: 'PHQ9',
    nombre: 'Cuestionario de Salud del Paciente-9',
    nombreEn: 'Patient Health Questionnaire-9',
    categoria: 'depresion',
    preguntas: [
      {
        id: 1,
        texto: 'Poco interés o placer en hacer cosas',
        textoEn: 'Little interest or pleasure in doing things',
      },
      {
        id: 2,
        texto: 'Sentirse decaído/a, deprimido/a o sin esperanzas',
        textoEn: 'Feeling down, depressed, or hopeless',
      },
      {
        id: 3,
        texto: 'Dificultades para dormir o permanecer dormido/a, o dormir demasiado',
        textoEn: 'Trouble falling or staying asleep, or sleeping too much',
      },
      {
        id: 4,
        texto: 'Sentirse cansado/a o tener poca energía',
        textoEn: 'Feeling tired or having little energy',
      },
      {
        id: 5,
        texto: 'Poco apetito o comer en exceso',
        textoEn: 'Poor appetite or overeating',
      },
      {
        id: 6,
        texto: 'Sentirse mal con usted mismo/a - o que es un fracaso o que ha quedado mal con usted mismo/a o con su familia',
        textoEn: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
      },
      {
        id: 7,
        texto: 'Dificultad para concentrarse en cosas tales como leer el periódico o ver televisión',
        textoEn: 'Trouble concentrating on things, such as reading the newspaper or watching television',
      },
      {
        id: 8,
        texto: 'Moverse o hablar tan lentamente que otras personas podrían notarlo? O lo contrario - estar tan inquieto/a o intranquilo/a que ha estado moviéndose mucho más de lo normal',
        textoEn: 'Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
      },
      {
        id: 9,
        texto: 'Pensamientos de que estaría mejor muerto/a o de lastimarse de alguna manera',
        textoEn: 'Thoughts that you would be better off dead or of hurting yourself in some way',
      },
    ],
    opciones: [
      { valor: 0, etiqueta: 'Para nada', etiquetaEn: 'Not at all' },
      { valor: 1, etiqueta: 'Varios días', etiquetaEn: 'Several days' },
      { valor: 2, etiqueta: 'Más de la mitad de los días', etiquetaEn: 'More than half the days' },
      { valor: 3, etiqueta: 'Casi todos los días', etiquetaEn: 'Nearly every day' },
    ],
    puntuacion: {
      rangos: [
        { min: 0, max: 4, severidad: 'minima', etiqueta: 'Depresión mínima', etiquetaEn: 'Minimal depression' },
        { min: 5, max: 9, severidad: 'leve', etiqueta: 'Depresión leve', etiquetaEn: 'Mild depression' },
        { min: 10, max: 14, severidad: 'moderada', etiqueta: 'Depresión moderada', etiquetaEn: 'Moderate depression' },
        { min: 15, max: 19, severidad: 'moderadamente_severa', etiqueta: 'Depresión moderadamente severa', etiquetaEn: 'Moderately severe depression' },
        { min: 20, max: 27, severidad: 'severa', etiqueta: 'Depresión severa', etiquetaEn: 'Severe depression' },
      ],
    },
  },
  GAD7: {
    codigo: 'GAD7',
    nombre: 'Trastorno de Ansiedad Generalizada-7',
    nombreEn: 'Generalized Anxiety Disorder-7',
    categoria: 'ansiedad',
    preguntas: [
      {
        id: 1,
        texto: 'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
        textoEn: 'Feeling nervous, anxious or on edge',
      },
      {
        id: 2,
        texto: 'No poder dejar de preocuparse o controlar la preocupación',
        textoEn: 'Not being able to stop or control worrying',
      },
      {
        id: 3,
        texto: 'Preocuparse demasiado por diferentes cosas',
        textoEn: 'Worrying too much about different things',
      },
      {
        id: 4,
        texto: 'Dificultad para relajarse',
        textoEn: 'Trouble relaxing',
      },
      {
        id: 5,
        texto: 'Estar tan inquieto/a que es difícil permanecer sentado/a tranquilamente',
        textoEn: 'Being so restless that it is hard to sit still',
      },
      {
        id: 6,
        texto: 'Molestarse o ponerse irritable fácilmente',
        textoEn: 'Becoming easily annoyed or irritable',
      },
      {
        id: 7,
        texto: 'Sentir miedo como si algo terrible pudiera pasar',
        textoEn: 'Feeling afraid as if something awful might happen',
      },
    ],
    opciones: [
      { valor: 0, etiqueta: 'Para nada', etiquetaEn: 'Not at all' },
      { valor: 1, etiqueta: 'Varios días', etiquetaEn: 'Several days' },
      { valor: 2, etiqueta: 'Más de la mitad de los días', etiquetaEn: 'More than half the days' },
      { valor: 3, etiqueta: 'Casi todos los días', etiquetaEn: 'Nearly every day' },
    ],
    puntuacion: {
      rangos: [
        { min: 0, max: 4, severidad: 'minima', etiqueta: 'Ansiedad mínima', etiquetaEn: 'Minimal anxiety' },
        { min: 5, max: 9, severidad: 'leve', etiqueta: 'Ansiedad leve', etiquetaEn: 'Mild anxiety' },
        { min: 10, max: 14, severidad: 'moderada', etiqueta: 'Ansiedad moderada', etiquetaEn: 'Moderate anxiety' },
        { min: 15, max: 21, severidad: 'severa', etiqueta: 'Ansiedad severa', etiquetaEn: 'Severe anxiety' },
      ],
    },
  },
};