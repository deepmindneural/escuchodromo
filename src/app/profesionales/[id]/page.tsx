'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import toast from 'react-hot-toast';

interface DatosProfesional {
  id: string;
  nombre: string;
  apellido: string;
  especialidad?: string;
  foto_perfil?: string;
  biografia?: string;
  direccion_consultorio?: string;
  experiencia_anos?: number;
  tarifa_30min?: number;
  tarifa_60min?: number;
  disponible?: boolean;
}

/**
 * Página de Detalle de Profesional
 *
 * Muestra información completa del profesional incluyendo:
 * - Biografía extendida
 * - Experiencia y formación
 * - Especialidades
 * - Tarifas y modalidades
 * - Botón para agendar cita
 */
export default function PaginaDetalleProfesional() {
  const params = useParams();
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const profesionalId = params.id as string;

  const [profesional, setProfesional] = useState<DatosProfesional | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosProfesional();
  }, [profesionalId]);

  const cargarDatosProfesional = async () => {
    try {
      setCargando(true);

      const { data, error } = await supabase
        .from('Usuario')
        .select(`
          id,
          nombre,
          apellido,
          PerfilUsuario!PerfilUsuario_usuario_id_fkey (
            especialidad,
            experiencia_anos,
            foto_perfil,
            biografia,
            direccion,
            tarifa_30min,
            tarifa_60min,
            disponible
          )
        `)
        .eq('id', profesionalId)
        .eq('rol', 'TERAPEUTA')
        .eq('esta_activo', true)
        .single();

      if (error) throw error;

      if (data) {
        setProfesional({
          id: data.id,
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          especialidad: data.PerfilUsuario?.especialidad || 'Psicología General',
          foto_perfil: data.PerfilUsuario?.foto_perfil,
          biografia: data.PerfilUsuario?.biografia || '',
          direccion_consultorio: data.PerfilUsuario?.direccion,
          experiencia_anos: data.PerfilUsuario?.experiencia_anos || 0,
          tarifa_30min: 80000,
          tarifa_60min: 150000,
          disponible: data.PerfilUsuario?.disponible ?? true,
        });
      }
    } catch (error) {
      console.error('Error cargando profesional:', error);
      toast.error('No se pudo cargar la información del profesional');
    } finally {
      setCargando(false);
    }
  };

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  // Profesional no encontrado
  if (!profesional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profesional no encontrado</h1>
          <p className="text-gray-600 mb-6">
            No pudimos encontrar la información de este profesional
          </p>
          <button
            onClick={() => router.push('/profesionales')}
            className="px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700"
          >
            Ver todos los profesionales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con foto de portada */}
      <div className="bg-gradient-to-r from-calma-600 to-esperanza-600 h-48 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-calma-100 focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-2"
          >
            <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna lateral - Tarjeta de perfil */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-6">
              {/* Foto de perfil */}
              <div className="relative mb-4">
                {profesional.foto_perfil ? (
                  <img
                    src={profesional.foto_perfil}
                    alt=""
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto bg-calma-200 flex items-center justify-center text-calma-700 font-bold text-4xl border-4 border-white shadow-lg">
                    {profesional.nombre.charAt(0)}
                    {profesional.apellido.charAt(0)}
                  </div>
                )}

                {/* Badge de verificado */}
                <div className="absolute top-0 right-0 lg:right-12 bg-esperanza-500 rounded-full p-2">
                  <CheckBadgeIcon className="w-6 h-6 text-white" aria-label="Profesional verificado" />
                </div>
              </div>

              {/* Nombre y especialidad */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {profesional.nombre} {profesional.apellido}
                </h1>
                <p className="text-calma-600 font-medium">{profesional.especialidad}</p>

                {/* Badge de disponibilidad */}
                {profesional.disponible && (
                  <div className="inline-block mt-3 px-3 py-1 bg-esperanza-100 text-esperanza-700 text-sm font-medium rounded-full">
                    Disponible para citas
                  </div>
                )}
              </div>

              {/* Información rápida */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {/* Experiencia */}
                <div className="flex items-center gap-3 text-sm">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    {profesional.experiencia_anos} años de experiencia
                  </span>
                </div>

                {/* Ubicación */}
                {profesional.direccion_consultorio && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{profesional.direccion_consultorio}</span>
                  </div>
                )}
              </div>

              {/* Tarifas */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-calma-600" />
                  Tarifas
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600">30 minutos:</span>
                    <span className="font-bold text-gray-900">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                      }).format(profesional.tarifa_30min || 80000)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600">60 minutos:</span>
                    <span className="font-bold text-gray-900">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                      }).format(profesional.tarifa_60min || 150000)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modalidades */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Modalidades</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <VideoCameraIcon className="w-5 h-5 text-esperanza-600" />
                    <span>Sesiones virtuales</span>
                  </div>
                  {profesional.direccion_consultorio && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BuildingOfficeIcon className="w-5 h-5 text-calma-600" />
                      <span>Consulta presencial</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de reserva */}
              <button
                onClick={() => router.push(`/profesionales/${profesional.id}/reservar`)}
                className="w-full px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
              >
                Agendar cita
              </button>
            </div>
          </div>

          {/* Columna principal - Información detallada */}
          <div className="lg:col-span-2 space-y-6 mt-6 lg:mt-0">
            {/* Acerca de */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acerca de mí</h2>
              {profesional.biografia ? (
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {profesional.biografia}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Este profesional aún no ha agregado información biográfica.
                </p>
              )}
            </section>

            {/* Especialidades */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-calma-600" />
                Especialidades
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-calma-100 text-calma-700 rounded-full text-sm font-medium">
                  {profesional.especialidad}
                </span>
              </div>
            </section>

            {/* Enfoque y metodología */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BriefcaseIcon className="w-6 h-6 text-calma-600" />
                Enfoque y Metodología
              </h2>
              <div className="text-gray-600 leading-relaxed">
                <p>
                  Con {profesional.experiencia_anos} años de experiencia en {profesional.especialidad},
                  trabajo con un enfoque centrado en la persona, adaptando las sesiones a las
                  necesidades específicas de cada paciente.
                </p>
                <p className="mt-4">
                  Mi objetivo es crear un espacio seguro y de confianza donde puedas explorar
                  tus emociones, desarrollar herramientas de afrontamiento y alcanzar tu
                  bienestar emocional.
                </p>
              </div>
            </section>

            {/* Qué esperar en la primera sesión */}
            <section className="bg-calma-50 rounded-lg border border-calma-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ¿Qué esperar en la primera sesión?
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-calma-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span>Presentación y establecimiento de un ambiente de confianza</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-calma-600 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span>Conversación sobre tus necesidades y objetivos terapéuticos</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-calma-600 text-white flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span>Evaluación inicial y plan de tratamiento personalizado</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-calma-600 text-white flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  <span>Resolución de dudas sobre el proceso terapéutico</span>
                </li>
              </ul>
            </section>

            {/* CTA final */}
            <div className="bg-gradient-to-r from-calma-600 to-esperanza-600 rounded-lg p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-3">
                Comienza tu camino hacia el bienestar
              </h2>
              <p className="text-calma-50 mb-6 max-w-2xl mx-auto">
                Agenda tu primera sesión con {profesional.nombre} y da el primer paso hacia
                una vida más plena y equilibrada
              </p>
              <button
                onClick={() => router.push(`/profesionales/${profesional.id}/reservar`)}
                className="px-8 py-3 bg-white text-calma-600 rounded-lg hover:bg-calma-50 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-calma-600"
              >
                Agendar mi cita ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
