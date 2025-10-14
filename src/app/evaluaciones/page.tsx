'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boton } from '../../lib/componentes/ui/boton';
import Navegacion from '../../lib/componentes/layout/Navegacion';

interface Prueba {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  _count: {
    preguntas: number;
  };
}

export default function PaginaEvaluaciones() {
  const router = useRouter();
  const [pruebas, setPruebas] = useState<Prueba[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }

    cargarPruebas();
  }, [router]);

  const cargarPruebas = async () => {
    try {
      const response = await fetch('http://localhost:3333/evaluaciones/pruebas', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPruebas(data);
      }
    } catch (error) {
      console.error('Error al cargar pruebas:', error);
    } finally {
      setCargando(false);
    }
  };

  const categoriasIconos: Record<string, string> = {
    depresion: '😔',
    ansiedad: '😰',
    estres: '😣',
    bienestar: '😊',
  };

  const categoriasColores: Record<string, string> = {
    depresion: 'bg-blue-100 text-blue-700',
    ansiedad: 'bg-yellow-100 text-yellow-700',
    estres: 'bg-red-100 text-red-700',
    bienestar: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />
      <header className="bg-white shadow mt-20">
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
        ) : pruebas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay pruebas disponibles en este momento.</p>
            <Boton
              className="mt-4"
              onClick={async () => {
                const response = await fetch('http://localhost:3333/evaluaciones/inicializar', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                });
                if (response.ok) {
                  cargarPruebas();
                }
              }}
            >
              Inicializar Pruebas
            </Boton>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pruebas.map((prueba) => (
              <div key={prueba.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">
                      {categoriasIconos[prueba.categoria] || '📝'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        categoriasColores[prueba.categoria] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {prueba.categoria}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{prueba.nombre}</h3>
                  <p className="text-gray-600 mb-4">{prueba.descripcion}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {prueba._count.preguntas} preguntas
                    </span>
                    <span className="text-sm text-gray-500">
                      ~{Math.ceil(prueba._count.preguntas * 0.5)} min
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4">
                  <Link href={`/evaluaciones/${prueba.codigo}`}>
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
    </div>
  );
}