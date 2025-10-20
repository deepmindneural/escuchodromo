'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Cita {
  id: string;
  fecha_hora: string;
  duracion: number;
  modalidad: 'VIRTUAL' | 'PRESENCIAL';
  estado: string;
  paciente: {
    nombre: string;
    apellido: string;
  };
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Página de Calendario del Profesional
 *
 * Vista de calendario mensual con todas las citas agendadas
 * Permite al profesional ver su agenda completa y los detalles de cada cita
 */
export default function PaginaCalendarioProfesional() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const [fechaActual, setFechaActual] = useState(new Date());
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [cargando, setCargando] = useState(true);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  useEffect(() => {
    if (profesionalId) {
      cargarCitas();
    }
  }, [profesionalId, fechaActual]);

  const verificarAutenticacion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Debes iniciar sesión');
        router.push('/iniciar-sesion');
        return;
      }

      // Verificar que sea profesional
      const { data: userData, error } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('id', user.id)
        .single();

      if (error || !userData || userData.rol !== 'TERAPEUTA') {
        toast.error('No tienes permisos para acceder a esta página');
        router.push('/dashboard');
        return;
      }

      setProfesionalId(userData.id);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      toast.error('Error de autenticación');
      router.push('/iniciar-sesion');
    }
  };

  const cargarCitas = async () => {
    if (!profesionalId) return;

    try {
      setCargando(true);

      // Obtener primer y último día del mes actual
      const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('Cita')
        .select(`
          id,
          fecha_hora,
          duracion,
          modalidad,
          estado,
          usuario_id,
          Usuario!Cita_usuario_id_fkey (
            nombre,
            apellido
          )
        `)
        .eq('profesional_id', profesionalId)
        .gte('fecha_hora', primerDia.toISOString())
        .lte('fecha_hora', ultimoDia.toISOString())
        .order('fecha_hora', { ascending: true });

      if (error) throw error;

      const citasFormateadas = (data || []).map((cita: any) => ({
        id: cita.id,
        fecha_hora: cita.fecha_hora,
        duracion: cita.duracion,
        modalidad: cita.modalidad,
        estado: cita.estado,
        paciente: {
          nombre: cita.Usuario?.nombre || 'Desconocido',
          apellido: cita.Usuario?.apellido || '',
        },
      }));

      setCitas(citasFormateadas);
    } catch (error: any) {
      console.error('Error cargando citas:', error);
      toast.error('No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  };

  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  };

  const obtenerDiasDelMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);

    const diasAnteriores = primerDia.getDay();
    const diasMes = ultimoDia.getDate();

    const dias: (Date | null)[] = [];

    // Días del mes anterior
    for (let i = 0; i < diasAnteriores; i++) {
      dias.push(null);
    }

    // Días del mes actual
    for (let i = 1; i <= diasMes; i++) {
      dias.push(new Date(año, mes, i));
    }

    return dias;
  };

  const obtenerCitasPorDia = (fecha: Date | null) => {
    if (!fecha) return [];

    return citas.filter((cita) => {
      const fechaCita = new Date(cita.fecha_hora);
      return (
        fechaCita.getDate() === fecha.getDate() &&
        fechaCita.getMonth() === fecha.getMonth() &&
        fechaCita.getFullYear() === fecha.getFullYear()
      );
    });
  };

  const formatearHora = (fechaHora: string) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const esHoy = (fecha: Date | null) => {
    if (!fecha) return false;
    const hoy = new Date();
    return (
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()
    );
  };

  const dias = obtenerDiasDelMes();

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-calma-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Calendario</h1>
                <p className="text-gray-600">Gestiona tus citas y disponibilidad</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/profesional/dashboard')}
              className="px-4 py-2 text-calma-600 hover:text-calma-700 font-medium"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de mes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={mesAnterior}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900">
              {MESES[fechaActual.getMonth()]} {fechaActual.getFullYear()}
            </h2>

            <button
              onClick={mesSiguiente}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Encabezado de días */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="text-center font-semibold text-gray-600 text-sm py-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-2">
            {dias.map((fecha, index) => {
              const citasDelDia = obtenerCitasPorDia(fecha);
              const esHoyDia = esHoy(fecha);

              return (
                <div
                  key={index}
                  className={clsx(
                    'min-h-[120px] p-2 rounded-lg border-2 transition-all',
                    fecha
                      ? esHoyDia
                        ? 'bg-calma-50 border-calma-600'
                        : 'bg-white border-gray-200 hover:border-calma-300'
                      : 'bg-gray-50 border-transparent'
                  )}
                >
                  {fecha && (
                    <>
                      {/* Número del día */}
                      <div
                        className={clsx(
                          'text-sm font-semibold mb-1',
                          esHoyDia ? 'text-calma-700' : 'text-gray-700'
                        )}
                      >
                        {fecha.getDate()}
                      </div>

                      {/* Citas del día */}
                      <div className="space-y-1">
                        {citasDelDia.slice(0, 3).map((cita) => (
                          <button
                            key={cita.id}
                            onClick={() => setCitaSeleccionada(cita)}
                            className="w-full text-left px-2 py-1 bg-calma-600 text-white text-xs rounded hover:bg-calma-700 transition-colors truncate"
                          >
                            {formatearHora(cita.fecha_hora)} - {cita.paciente.nombre}
                          </button>
                        ))}
                        {citasDelDia.length > 3 && (
                          <div className="text-xs text-gray-600 text-center">
                            +{citasDelDia.length - 3} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-calma-50 border-2 border-calma-600 rounded"></div>
              <span className="text-gray-600">Día actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-calma-600 rounded"></div>
              <span className="text-gray-600">Cita agendada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle de cita */}
      {citaSeleccionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setCitaSeleccionada(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detalle de Cita</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Paciente:</p>
                  <p className="font-medium text-gray-900">
                    {citaSeleccionada.paciente.nombre} {citaSeleccionada.paciente.apellido}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Fecha y hora:</p>
                  <p className="font-medium text-gray-900">
                    {new Date(citaSeleccionada.fecha_hora).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatearHora(citaSeleccionada.fecha_hora)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Duración:</p>
                  <p className="font-medium text-gray-900">{citaSeleccionada.duracion} minutos</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {citaSeleccionada.modalidad === 'VIRTUAL' ? (
                  <VideoCameraIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-gray-600">Modalidad:</p>
                  <p className="font-medium text-gray-900">
                    {citaSeleccionada.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCitaSeleccionada(null)}
              className="w-full mt-6 px-4 py-2 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
