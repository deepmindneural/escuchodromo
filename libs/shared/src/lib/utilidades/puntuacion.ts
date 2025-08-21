export function calcularPuntuacionPHQ9(respuestas: number[]): {
  puntuacion: number;
  severidad: string;
  interpretacion: string;
} {
  const puntuacion = respuestas.reduce((suma, respuesta) => suma + respuesta, 0);
  
  let severidad = 'minima';
  let interpretacion = '';
  
  if (puntuacion >= 0 && puntuacion <= 4) {
    severidad = 'minima';
    interpretacion = 'Síntomas mínimos';
  } else if (puntuacion >= 5 && puntuacion <= 9) {
    severidad = 'leve';
    interpretacion = 'Depresión leve - vigilancia; repetir PHQ-9 en seguimiento';
  } else if (puntuacion >= 10 && puntuacion <= 14) {
    severidad = 'moderada';
    interpretacion = 'Depresión moderada - plan de tratamiento, considerar consejería, seguimiento y/o farmacoterapia';
  } else if (puntuacion >= 15 && puntuacion <= 19) {
    severidad = 'moderadamente_severa';
    interpretacion = 'Depresión moderadamente severa - tratamiento activo con farmacoterapia y/o psicoterapia';
  } else if (puntuacion >= 20 && puntuacion <= 27) {
    severidad = 'severa';
    interpretacion = 'Depresión severa - inicio inmediato de farmacoterapia y, si hay deterioro severo o pobre respuesta al tratamiento, derivación expedita a especialista en salud mental';
  }
  
  return { puntuacion, severidad, interpretacion };
}

export function calcularPuntuacionGAD7(respuestas: number[]): {
  puntuacion: number;
  severidad: string;
  interpretacion: string;
} {
  const puntuacion = respuestas.reduce((suma, respuesta) => suma + respuesta, 0);
  
  let severidad = 'minima';
  let interpretacion = '';
  
  if (puntuacion >= 0 && puntuacion <= 4) {
    severidad = 'minima';
    interpretacion = 'Ansiedad mínima';
  } else if (puntuacion >= 5 && puntuacion <= 9) {
    severidad = 'leve';
    interpretacion = 'Ansiedad leve';
  } else if (puntuacion >= 10 && puntuacion <= 14) {
    severidad = 'moderada';
    interpretacion = 'Ansiedad moderada';
  } else if (puntuacion >= 15 && puntuacion <= 21) {
    severidad = 'severa';
    interpretacion = 'Ansiedad severa';
  }
  
  return { puntuacion, severidad, interpretacion };
}

export function verificarIdeacionSuicida(respuestasPHQ9: number[]): boolean {
  // Pregunta 9 es sobre pensamientos suicidas (índice 8)
  return respuestasPHQ9[8] >= 1;
}

export function calcularPuntuacionRiesgo(resultadosPruebas: Array<{ codigoPrueba: string; puntuacion: number }>): {
  nivelRiesgo: 'bajo' | 'moderado' | 'alto';
  recomendaciones: string[];
} {
  const resultadoPHQ9 = resultadosPruebas.find(r => r.codigoPrueba === 'PHQ9');
  const resultadoGAD7 = resultadosPruebas.find(r => r.codigoPrueba === 'GAD7');
  
  let nivelRiesgo: 'bajo' | 'moderado' | 'alto' = 'bajo';
  const recomendaciones: string[] = [];
  
  if (resultadoPHQ9) {
    if (resultadoPHQ9.puntuacion >= 20) {
      nivelRiesgo = 'alto';
      recomendaciones.push('ayuda_profesional_inmediata');
    } else if (resultadoPHQ9.puntuacion >= 10) {
      nivelRiesgo = 'moderado';
      recomendaciones.push('consulta_profesional');
    }
  }
  
  if (resultadoGAD7) {
    if (resultadoGAD7.puntuacion >= 15 && nivelRiesgo !== 'alto') {
      nivelRiesgo = 'alto';
      recomendaciones.push('manejo_ansiedad');
    } else if (resultadoGAD7.puntuacion >= 10 && nivelRiesgo === 'bajo') {
      nivelRiesgo = 'moderado';
      recomendaciones.push('tecnicas_relajacion');
    }
  }
  
  if (nivelRiesgo === 'bajo') {
    recomendaciones.push('autocuidado', 'seguimiento_animo');
  }
  
  return { nivelRiesgo, recomendaciones };
}