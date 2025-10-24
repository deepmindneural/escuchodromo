'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Boton } from '../../../lib/componentes/ui/boton';
import Navegacion from '../../../lib/componentes/layout/Navegacion';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import toast from 'react-hot-toast';

interface Opcion {
  valor: number;
  texto: string;
  texto_en?: string;
}

interface Pregunta {
  id: string;
  orden: number;
  texto: string;
  texto_en?: string;
  opciones: Opcion[];
}

interface Test {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
}

export default function PaginaTestIndividual() {
  const router = useRouter();
  const params = useParams();
  const codigo = params.codigo as string;

  const [test, setTest] = useState<Test | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const supabase = obtenerClienteNavegador();

  useEffect(() => {
    cargarTestYPreguntas();
  }, [codigo]);

  const cargarTestYPreguntas = async () => {
    try {
      // Cargar información del test
      const { data: testData, error: testError } = await supabase
        .from('Test')
        .select('*')
        .eq('codigo', codigo)
        .single();

      if (testError || !testData) {
        toast.error('Test no encontrado');
        router.push('/evaluaciones');
        return;
      }

      setTest(testData);

      // Cargar preguntas
      const { data: preguntasData, error: preguntasError } = await supabase
        .from('Pregunta')
        .select('*')
        .eq('test_id', testData.id)
        .order('orden');

      if (preguntasError) {
        console.error('Error al cargar preguntas:', preguntasError);
        toast.error('Error al cargar las preguntas');
        return;
      }

      setPreguntas(preguntasData || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el test');
    } finally {
      setCargando(false);
    }
  };

  const handleRespuesta = (preguntaId: string, valor: number) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: valor
    }));
  };

  const todasRespondidas = () => {
    return preguntas.every((pregunta) => respuestas[pregunta.id] !== undefined);
  };

  const handleEnviar = async () => {
    if (!todasRespondidas()) {
      toast.error('Por favor responde todas las preguntas');
      return;
    }

    if (!test) return;

    setProcesando(true);

    try {
      // Preparar respuestas en el formato esperado
      const respuestasArray = Object.entries(respuestas).map(([pregunta_id, valor]) => ({
        pregunta_id,
        valor
      }));

      // Llamar al Edge Function
      const { data, error } = await supabase.functions.invoke('procesar-evaluacion', {
        body: {
          test_id: test.id,
          respuestas: respuestasArray
        }
      });

      if (error) {
        console.error('Error al procesar evaluación:', error);
        toast.error('Error al procesar la evaluación');
        return;
      }

      // Guardar resultado en localStorage para mostrar en página de resultados
      localStorage.setItem('ultimo_resultado_evaluacion', JSON.stringify(data));

      // Redirigir a página de resultados
      router.push(`/evaluaciones/${codigo}/resultados`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar la evaluación');
    } finally {
      setProcesando(false);
    }
  };

  const porcentajeCompletado = () => {
    const respondidas = Object.keys(respuestas).length;
    return Math.round((respondidas / preguntas.length) * 100);
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

  if (!test) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />

      <header className="bg-white shadow pt-24 mt-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.nombre}</h1>
              <p className="text-gray-600 mt-1">{test.descripcion}</p>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {preguntas.length} preguntas
                </span>
                <span className="text-sm font-medium text-primary-600">
                  {porcentajeCompletado()}% completado
                </span>
              </div>
            </div>
            <Boton
              variante="contorno"
              onClick={() => router.push('/evaluaciones')}
            >
              Cancelar
            </Boton>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${porcentajeCompletado()}%` }}
            ></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-8">
          {preguntas.map((pregunta, index) => (
            <div key={pregunta.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {pregunta.texto}
                  </h3>

                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => (
                      <label
                        key={opcion.valor}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          respuestas[pregunta.id] === opcion.valor
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pregunta-${pregunta.id}`}
                          value={opcion.valor}
                          checked={respuestas[pregunta.id] === opcion.valor}
                          onChange={() => handleRespuesta(pregunta.id, opcion.valor)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-gray-700">{opcion.texto}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {Object.keys(respuestas).length} de {preguntas.length} preguntas respondidas
              </p>
            </div>
            <Boton
              onClick={handleEnviar}
              deshabilitado={!todasRespondidas() || procesando}
              className="min-w-[200px]"
            >
              {procesando ? 'Procesando...' : 'Enviar Evaluación'}
            </Boton>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> Responde con honestidad basándote en cómo te has sentido
            en las últimas 2 semanas. No hay respuestas correctas o incorrectas.
          </p>
        </div>
      </main>
    </div>
  );
}
