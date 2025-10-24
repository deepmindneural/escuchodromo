'use client';

import React from 'react';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, User, Calendar, CheckCircle2 } from 'lucide-react';

interface Evaluacion {
  id: string;
  tipo: string;
  puntaje_total: number;
  severidad: string;
  respuestas: any;
  creado_en: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface ModalResultadosEvaluacionProps {
  abierto: boolean;
  onCerrar: () => void;
  evaluacion: Evaluacion | null;
}

// Preguntas del PHQ-9
const PREGUNTAS_PHQ9 = [
  'Poco interés o placer en hacer cosas',
  'Sentirse desanimado/a, deprimido/a o sin esperanza',
  'Problemas para quedarse o permanecer dormido/a, o dormir demasiado',
  'Sentirse cansado/a o tener poca energía',
  'Poco apetito o comer en exceso',
  'Sentirse mal con usted mismo/a, o sentir que es un fracaso, o que ha quedado mal con usted mismo/a o con su familia',
  'Problemas para concentrarse en cosas tales como leer el periódico o ver televisión',
  'Moverse o hablar tan lento que otras personas podrían haberlo notado, o por el contrario, estar tan inquieto/a o agitado/a que se ha estado moviendo mucho más de lo normal',
  'Pensamientos de que estaría mejor muerto/a, o de lastimarse de alguna manera',
];

// Preguntas del GAD-7
const PREGUNTAS_GAD7 = [
  'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
  'No ser capaz de parar o controlar la preocupación',
  'Preocuparse demasiado por diferentes cosas',
  'Dificultad para relajarse',
  'Estar tan inquieto/a que es difícil permanecer sentado/a',
  'Molestarse o irritarse fácilmente',
  'Sentir miedo como si algo terrible fuera a suceder',
];

// Opciones de respuesta
const OPCIONES_RESPUESTA = [
  'Para nada',
  'Varios días',
  'Más de la mitad de los días',
  'Casi todos los días',
];

/**
 * ModalResultadosEvaluacion - Modal para ver detalles completos de una evaluación
 *
 * Muestra:
 * - Información del usuario
 * - Tipo de evaluación y puntaje total
 * - Badge de severidad con color
 * - Lista de preguntas con respuestas
 * - Fecha de realización
 */
export function ModalResultadosEvaluacion({
  abierto,
  onCerrar,
  evaluacion,
}: ModalResultadosEvaluacionProps) {
  if (!evaluacion) return null;

  const preguntas = evaluacion.tipo === 'PHQ-9' ? PREGUNTAS_PHQ9 : PREGUNTAS_GAD7;
  const puntajeMaximo = evaluacion.tipo === 'PHQ-9' ? 27 : 21;

  // Parsear respuestas
  let respuestas: number[] = [];
  try {
    if (typeof evaluacion.respuestas === 'string') {
      respuestas = JSON.parse(evaluacion.respuestas);
    } else if (Array.isArray(evaluacion.respuestas)) {
      respuestas = evaluacion.respuestas;
    } else if (evaluacion.respuestas && typeof evaluacion.respuestas === 'object') {
      // Si es un objeto, intentar extraer los valores
      respuestas = Object.values(evaluacion.respuestas);
    }
  } catch (error) {
    console.error('Error al parsear respuestas:', error);
    respuestas = [];
  }

  // Obtener color de severidad
  const obtenerColorSeveridad = (severidad: string) => {
    const severidadLower = severidad.toLowerCase();
    if (severidadLower === 'severa' || severidadLower === 'critica') {
      return 'bg-red-100 text-red-800 border-red-300';
    } else if (severidadLower === 'moderadamente severa') {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    } else if (severidadLower === 'moderada') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else {
      return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  // Obtener color de barra de progreso
  const obtenerColorBarra = () => {
    const porcentaje = (evaluacion.puntaje_total / puntajeMaximo) * 100;
    if (porcentaje >= 70) return 'bg-red-500';
    if (porcentaje >= 50) return 'bg-orange-500';
    if (porcentaje >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Resultados de Evaluación"
      tamano="lg"
    >
      <div className="space-y-6">
        {/* Información del usuario */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 border border-teal-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{evaluacion.usuario.nombre}</p>
              <p className="text-sm text-gray-600">{evaluacion.usuario.email}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {format(new Date(evaluacion.creado_en), "dd MMM yyyy 'a las' HH:mm", {
                locale: es,
              })}
            </div>
          </div>
        </div>

        {/* Tipo y severidad */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Tipo de Evaluación</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {evaluacion.tipo}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {evaluacion.tipo === 'PHQ-9' ? 'Trastorno depresivo mayor' : 'Trastorno de ansiedad generalizada'}
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Nivel de Severidad</span>
            </div>
            <Badge className={`text-lg px-3 py-1 ${obtenerColorSeveridad(evaluacion.severidad)}`}>
              {evaluacion.severidad.charAt(0).toUpperCase() + evaluacion.severidad.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Puntaje total */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Puntaje Total</span>
            <span className="text-3xl font-bold text-gray-900">
              {evaluacion.puntaje_total} <span className="text-lg text-gray-500">/ {puntajeMaximo}</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${obtenerColorBarra()} transition-all duration-500`}
              style={{ width: `${(evaluacion.puntaje_total / puntajeMaximo) * 100}%` }}
            />
          </div>
        </div>

        {/* Respuestas detalladas */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Respuestas Detalladas
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {preguntas.map((pregunta, index) => {
              const respuesta = respuestas[index] ?? 0;
              const respuestaTexto = OPCIONES_RESPUESTA[respuesta] || 'Sin respuesta';

              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-teal-700">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">{pregunta}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            respuesta === 0
                              ? 'border-green-300 text-green-700 bg-green-50'
                              : respuesta === 1
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                              : respuesta === 2
                              ? 'border-orange-300 text-orange-700 bg-orange-50'
                              : 'border-red-300 text-red-700 bg-red-50'
                          }
                        >
                          {respuestaTexto}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ({respuesta} {respuesta === 1 ? 'punto' : 'puntos'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
