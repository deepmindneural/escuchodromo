'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Boton } from '../../../lib/componentes/ui/boton';
import Navegacion from '../../../lib/componentes/layout/Navegacion';

interface Pregunta {
  id: string;
  orden: number;
  texto: string;
  textoEn?: string;
  opciones: string;
}

interface Prueba {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  preguntas: Pregunta[];
}

interface Opcion {
  valor: number;
  etiqueta: string;
  etiquetaEn?: string;
}

export default function PaginaEvaluacion() {
  const router = useRouter();
  const params = useParams();
  const codigo = params.codigo as string;
  
  const [prueba, setPrueba] = useState<Prueba | null>(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<number[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }

    cargarPrueba();
  }, [codigo, router]);

  const cargarPrueba = async () => {
    try {
      const response = await fetch(`http://localhost:3333/evaluaciones/pruebas/${codigo}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrueba(data);
        setRespuestas(new Array(data.preguntas.length).fill(-1));
      }
    } catch (error) {
      console.error('Error al cargar prueba:', error);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarRespuesta = (valor: number) => {
    const nuevasRespuestas = [...respuestas];
    nuevasRespuestas[preguntaActual] = valor;
    setRespuestas(nuevasRespuestas);
  };

  const siguientePregunta = () => {
    if (preguntaActual < (prueba?.preguntas.length || 0) - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const enviarRespuestas = async () => {
    if (!prueba) return;
    
    setEnviando(true);
    
    try {
      const response = await fetch('http://localhost:3333/evaluaciones/respuestas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          codigoPrueba: prueba.codigo,
          respuestas: respuestas,
        }),
      });

      if (response.ok) {
        const resultado = await response.json();
        router.push(`/evaluaciones/resultado/${resultado.id}`);
      }
    } catch (error) {
      console.error('Error al enviar respuestas:', error);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!prueba) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Prueba no encontrada</p>
      </div>
    );
  }

  const pregunta = prueba.preguntas[preguntaActual];
  const opciones: Opcion[] = JSON.parse(pregunta.opciones);
  const progreso = ((preguntaActual + 1) / prueba.preguntas.length) * 100;
  const todasRespondidas = respuestas.every(r => r !== -1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />
      <div className="container mx-auto px-4 py-8 max-w-2xl pt-20">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{prueba.nombre}</h1>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                Pregunta {preguntaActual + 1} de {prueba.preguntas.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progreso)}% completado
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium mb-6">{pregunta.texto}</h2>
            
            <div className="space-y-3">
              {opciones.map((opcion) => (
                <button
                  key={opcion.valor}
                  onClick={() => seleccionarRespuesta(opcion.valor)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    respuestas[preguntaActual] === opcion.valor
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        respuestas[preguntaActual] === opcion.valor
                          ? 'border-primary-600'
                          : 'border-gray-400'
                      }`}
                    >
                      {respuestas[preguntaActual] === opcion.valor && (
                        <div className="w-3 h-3 bg-primary-600 rounded-full" />
                      )}
                    </div>
                    <span className="font-medium">{opcion.etiqueta}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Boton
              variante="contorno"
              onClick={preguntaAnterior}
              disabled={preguntaActual === 0}
            >
              Anterior
            </Boton>

            {preguntaActual === prueba.preguntas.length - 1 ? (
              <Boton
                onClick={enviarRespuestas}
                disabled={!todasRespondidas || enviando}
              >
                {enviando ? 'Enviando...' : 'Finalizar'}
              </Boton>
            ) : (
              <Boton
                onClick={siguientePregunta}
                disabled={respuestas[preguntaActual] === -1}
              >
                Siguiente
              </Boton>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/evaluaciones')}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancelar evaluación
          </button>
        </div>
      </div>
    </div>
  );
}