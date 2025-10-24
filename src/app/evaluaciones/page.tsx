'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boton } from '../../lib/componentes/ui/boton';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface Test {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  total_preguntas: number;
}

export default function PaginaEvaluaciones() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [cargando, setCargando] = useState(true);
  const supabase = obtenerClienteNavegador();

  useEffect(() => {
    cargarTests();
  }, []);

  const cargarTests = async () => {
    try {
      // Obtener todos los tests
      const { data: testsData, error: testsError } = await supabase
        .from('Test')
        .select('id, codigo, nombre, descripcion, categoria')
        .order('codigo');

      if (testsError) {
        console.error('Error al cargar tests:', testsError);
        return;
      }

      // Contar preguntas por test
      const testsConPreguntas = await Promise.all(
        (testsData || []).map(async (test) => {
          const { count } = await supabase
            .from('Pregunta')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.id);

          return {
            ...test,
            total_preguntas: count || 0
          };
        })
      );

      setTests(testsConPreguntas);
    } catch (error) {
      console.error('Error al cargar tests:', error);
    } finally {
      setCargando(false);
    }
  };

  const categoriasIconos: Record<string, string> = {
    'salud mental': '🧠',
    depresion: '😔',
    ansiedad: '😰',
    estres: '😣',
    bienestar: '😊',
  };

  const categoriasColores: Record<string, string> = {
    'salud mental': 'bg-purple-100 text-purple-700',
    depresion: 'bg-blue-100 text-blue-700',
    ansiedad: 'bg-yellow-100 text-yellow-700',
    estres: 'bg-red-100 text-red-700',
    bienestar: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />
      <header className="bg-white shadow pt-24 mt-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evaluaciones Psicológicas</h1>
              <p className="text-gray-600 mt-1">
                Realiza evaluaciones validadas para conocer tu estado emocional
              </p>
            </div>
            <Link href="/dashboard">
              <Boton variante="contorno">Volver al Dashboard</Boton>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay evaluaciones disponibles en este momento.</p>
            <p className="text-sm text-gray-500 mt-2">
              Por favor contacta al administrador.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">
                      {categoriasIconos[test.categoria.toLowerCase()] || '📝'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        categoriasColores[test.categoria.toLowerCase()] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {test.categoria}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{test.nombre}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{test.descripcion}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {test.total_preguntas} preguntas
                    </span>
                    <span className="text-sm text-gray-500">
                      ~{Math.ceil(test.total_preguntas * 0.5)} min
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4">
                  <Link href={`/evaluaciones/${test.codigo}`}>
                    <Boton className="w-full">
                      Iniciar Evaluación
                    </Boton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Acerca de las Evaluaciones</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Las evaluaciones psicológicas disponibles en Escuchodromo son instrumentos
              validados científicamente utilizados por profesionales de la salud mental
              en todo el mundo.
            </p>
            <p>
              <strong>Importante:</strong> Estas evaluaciones son herramientas de apoyo
              y no reemplazan el diagnóstico de un profesional. Si obtienes resultados
              que indican niveles moderados o severos, te recomendamos buscar ayuda
              profesional.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>Privacidad:</strong> Todos tus resultados son confidenciales
                y están protegidos. Solo tú y los profesionales que autorices pueden
                acceder a esta información.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}