'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boton } from '../../lib/componentes/ui/boton';

export default function PaginaDashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }

    try {
      const response = await fetch('http://localhost:3333/api/usuarios/perfil', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('No autorizado');
      }

      const data = await response.json();
      setUsuario(data);
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/iniciar-sesion');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Escuchodromo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Hola, {usuario?.nombre || usuario?.email}
              </span>
              <Boton
                variante="fantasma"
                tamano="sm"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </Boton>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Tu Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/chat">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chat con IA
              </h3>
              <p className="text-gray-600">
                Habla con nuestra IA sobre cómo te sientes
              </p>
            </div>
          </Link>

          <Link href="/voz">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-4">🎙️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hablar por Voz
              </h3>
              <p className="text-gray-600">
                Expresa tus emociones hablando con la IA
              </p>
            </div>
          </Link>

          <Link href="/evaluaciones">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Evaluaciones
              </h3>
              <p className="text-gray-600">
                Realiza pruebas psicológicas validadas
              </p>
            </div>
          </Link>

          <Link href="/animo">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Registro de Ánimo
              </h3>
              <p className="text-gray-600">
                Registra y monitorea tu estado emocional
              </p>
            </div>
          </Link>

          <Link href="/recomendaciones">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Recomendaciones
              </h3>
              <p className="text-gray-600">
                Recibe sugerencias personalizadas
              </p>
            </div>
          </Link>

          <Link href="/perfil">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mi Perfil
              </h3>
              <p className="text-gray-600">
                Gestiona tu información personal
              </p>
            </div>
          </Link>
        </div>

        {usuario?.rol === 'ADMIN' && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Administración
            </h3>
            <Link href="/admin">
              <Boton>
                Ir al Panel de Administración
              </Boton>
            </Link>
          </div>
        )}

        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda inmediata?
          </h3>
          <p className="text-gray-700 mb-4">
            Si estás pasando por una crisis o necesitas apoyo urgente, aquí hay recursos disponibles:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Línea Nacional de Prevención del Suicidio: 106 (Colombia)</li>
            <li>• Chat de Crisis: Disponible 24/7</li>
            <li>• Encuentra un profesional cerca de ti</li>
          </ul>
        </div>
      </main>
    </div>
  );
}