'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Boton } from '../../../../lib/componentes/ui/boton';
import Navegacion from '../../../../lib/componentes/layout/Navegacion';
import ReactMarkdown from 'react-markdown';

interface ResultadoEvaluacion {
  test: {
    codigo: string;
    nombre: string;
    categoria: string;
  };
  puntuacion: number;
  severidad: string;
  interpretacion: string;
  evaluacion_id: string | null;
  guardado_en_bd: boolean;
}

export default function PaginaResultados() {
  const router = useRouter();
  const params = useParams();
  const codigo = params.codigo as string;

  const [resultado, setResultado] = useState<ResultadoEvaluacion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarResultado();
  }, []);

  const cargarResultado = () => {
    try {
      const resultadoGuardado = localStorage.getItem('ultimo_resultado_evaluacion');

      if (!resultadoGuardado) {
        router.push('/evaluaciones');
        return;
      }

      const data = JSON.parse(resultadoGuardado);
      setResultado(data);

      // Limpiar localStorage después de cargar
      localStorage.removeItem('ultimo_resultado_evaluacion');
    } catch (error) {
      console.error('Error al cargar resultado:', error);
      router.push('/evaluaciones');
    } finally {
      setCargando(false);
    }
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'minima':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'leve':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'moderada':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderadamente_severa':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'severa':
        return 'bg-red-200 text-red-900 border-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeveridadTexto = (severidad: string) => {
    return severidad.replace('_', ' ').charAt(0).toUpperCase() + severidad.replace('_', ' ').slice(1);
  };

  const getPuntuacionMaxima = (codigo: string) => {
    if (codigo === 'PHQ-9') return 27;
    if (codigo === 'GAD-7') return 21;
    return 100;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navegacion />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!resultado) {
    return null;
  }

  const puntuacionMaxima = getPuntuacionMaxima(resultado.test.codigo);
  const porcentajePuntuacion = (resultado.puntuacion / puntuacionMaxima) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />

      <header className="bg-white shadow mt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Resultados de {resultado.test.nombre}</h1>
            <p className="text-gray-600 mt-2">Aquí están los resultados de tu evaluación</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tarjeta de puntuación */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Tu Puntuación</h2>

            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={
                    resultado.severidad === 'minima' ? '#10b981' :
                    resultado.severidad === 'leve' ? '#fbbf24' :
                    resultado.severidad === 'moderada' ? '#f97316' :
                    '#ef4444'
                  }
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${porcentajePuntuacion * 5.53} 553`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-gray-900">{resultado.puntuacion}</span>
                <span className="text-sm text-gray-500">de {puntuacionMaxima}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <span className={`inline-block px-6 py-3 rounded-full text-lg font-semibold border-2 ${getSeveridadColor(resultado.severidad)}`}>
                Severidad: {getSeveridadTexto(resultado.severidad)}
              </span>
            </div>
          </div>
        </div>

        {/* Interpretación */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{resultado.interpretacion}</ReactMarkdown>
          </div>
        </div>

        {/* Alerta para severidad alta */}
        {(resultado.severidad === 'moderadamente_severa' || resultado.severidad === 'severa') && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-900">Recomendación Importante</h3>
                <p className="mt-2 text-red-800">
                  Tus resultados indican un nivel de severidad que requiere atención profesional.
                  Te recomendamos encarecidamente que busques ayuda de un profesional de salud mental
                  licenciado (psicólogo o psiquiatra) lo antes posible.
                </p>
                <p className="mt-2 text-red-800 font-medium">
                  Si tienes pensamientos de hacerte daño, por favor contacta con servicios de emergencia
                  o líneas de ayuda inmediatamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Sobre tus resultados</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Estos resultados son orientativos y no sustituyen un diagnóstico profesional</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Considera realizar evaluaciones periódicas para monitorear tu bienestar emocional</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Los síntomas pueden variar con el tiempo, y el apoyo profesional puede marcar una gran diferencia</span>
            </li>
            {resultado.guardado_en_bd && (
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Tu resultado ha sido guardado en tu historial para seguimiento futuro</span>
              </li>
            )}
          </ul>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Boton
            onClick={() => router.push('/evaluaciones')}
            variante="contorno"
            className="sm:w-auto w-full"
          >
            Volver a Evaluaciones
          </Boton>
          <Boton
            onClick={() => router.push('/recomendaciones')}
            className="sm:w-auto w-full"
          >
            Ver Recomendaciones Personalizadas
          </Boton>
          <Boton
            onClick={() => router.push('/chat')}
            variante="secundario"
            className="sm:w-auto w-full"
          >
            Hablar con el Asistente IA
          </Boton>
        </div>
      </main>
    </div>
  );
}
