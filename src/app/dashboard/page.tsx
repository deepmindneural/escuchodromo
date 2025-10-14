'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boton } from '../../lib/componentes/ui/boton';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import { useUsuario, usePerfilUsuario } from '../../lib/supabase/hooks';
import { cerrarSesion as cerrarSesionSupabase } from '../../lib/supabase/auth';

export default function PaginaDashboard() {
  const router = useRouter();
  const { usuario: authUsuario, cargando: cargandoAuth } = useUsuario();
  const { perfil, cargando: cargandoPerfil } = usePerfilUsuario();

  const cargando = cargandoAuth || cargandoPerfil;
  const usuario = perfil;

  useEffect(() => {
    if (!cargandoAuth && !authUsuario) {
      router.push('/iniciar-sesion');
    }
  }, [authUsuario, cargandoAuth, router]);

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesionSupabase();
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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
      <Navegacion />
      <nav className="bg-white shadow-sm mt-20">
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
                onClick={handleCerrarSesion}
              >
                Cerrar sesión
              </Boton>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Tu Dashboard</h2>

        {/* Dashboard específico por rol */}
        {usuario?.rol === 'USUARIO' && (
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
        )}

        {/* Dashboard para TERAPEUTA */}
        {usuario?.rol === 'TERAPEUTA' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/terapeuta/pacientes">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mis Pacientes
                </h3>
                <p className="text-gray-600">
                  Gestiona y supervisa a tus pacientes asignados
                </p>
              </div>
            </Link>

            <Link href="/terapeuta/reportes">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Reportes Clínicos
                </h3>
                <p className="text-gray-600">
                  Revisa evaluaciones y progreso de pacientes
                </p>
              </div>
            </Link>

            <Link href="/evaluaciones">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Herramientas de Evaluación
                </h3>
                <p className="text-gray-600">
                  Accede a pruebas psicológicas profesionales
                </p>
              </div>
            </Link>

            <Link href="/chat">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Supervisar IA
                </h3>
                <p className="text-gray-600">
                  Revisa conversaciones y ajusta parámetros de IA
                </p>
              </div>
            </Link>

            <Link href="/terapeuta/calendario">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-4">📅</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Calendario
                </h3>
                <p className="text-gray-600">
                  Programa y gestiona sesiones con pacientes
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
                  Gestiona tu información profesional
                </p>
              </div>
            </Link>
          </div>
        )}

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