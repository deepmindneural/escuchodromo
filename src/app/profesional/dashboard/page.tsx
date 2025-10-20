'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { GridMetricas, type Metrica } from '@/lib/componentes/GridMetricas';
import { TablaPacientes, type Paciente } from '@/lib/componentes/TablaPacientes';
import { ProximasCitas, type Cita } from '@/lib/componentes/ProximasCitas';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

/**
 * Dashboard Profesional
 *
 * Muestra:
 * - Métricas clave (pacientes activos, citas, adherencia, ingresos)
 * - Tabla de pacientes con estado emocional y progreso
 * - Próximas citas con acciones rápidas
 */
export default function DashboardProfesional() {
  const router = useRouter();
  const supabase = createClient();

  const [cargando, setCargando] = useState(true);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);

  // Estados de datos
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citasProximas, setCitasProximas] = useState<Cita[]>([]);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      setCargando(true);

      // Verificar sesión
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Verificar que el usuario es profesional
      const { data: usuario, error: errorUsuario } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('id', session.user.id)
        .single();

      if (errorUsuario || !usuario) {
        toast.error('Error al cargar información del usuario');
        return;
      }

      if (usuario.rol !== 'TERAPEUTA' && usuario.rol !== 'ADMIN') {
        toast.error('No tienes permisos para acceder a este dashboard');
        router.push('/dashboard');
        return;
      }

      setProfesionalId(usuario.id);

      // Cargar citas del profesional
      const { data: citas, error: errorCitas } = await supabase
        .from('Cita')
        .select(
          `
          id,
          fecha_hora,
          duracion,
          estado,
          modalidad,
          paciente:Usuario!Cita_paciente_id_fkey(
            id,
            nombre,
            apellido,
            PerfilUsuario(foto_perfil)
          )
        `
        )
        .eq('profesional_id', usuario.id)
        .gte('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(10);

      if (!errorCitas && citas) {
        const citasFormateadas: Cita[] = citas.map((cita: any) => ({
          id: cita.id,
          paciente: {
            nombre: cita.paciente?.nombre || '',
            apellido: cita.paciente?.apellido || '',
            foto: cita.paciente?.PerfilUsuario?.foto_perfil,
          },
          fecha: new Date(cita.fecha_hora),
          duracion: cita.duracion || 60,
          modalidad: cita.modalidad || 'VIRTUAL',
          estado: cita.estado || 'PENDIENTE',
        }));
        setCitasProximas(citasFormateadas);
      }

      // Cargar pacientes (simulado - aquí deberías hacer queries reales)
      const pacientesMock: Paciente[] = [
        {
          id: '1',
          nombre: 'María',
          apellido: 'González',
          ultimoContacto: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          estadoEmocional: 'ESTABLE',
          progreso: 75,
          sesionesCompletadas: 8,
          sesionesProgramadas: 12,
        },
        {
          id: '2',
          nombre: 'Juan',
          apellido: 'Pérez',
          ultimoContacto: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          estadoEmocional: 'ALERTA',
          progreso: 45,
          sesionesCompletadas: 4,
          sesionesProgramadas: 10,
        },
        {
          id: '3',
          nombre: 'Ana',
          apellido: 'Martínez',
          ultimoContacto: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          estadoEmocional: 'CRITICO',
          progreso: 30,
          sesionesCompletadas: 2,
          sesionesProgramadas: 8,
        },
      ];
      setPacientes(pacientesMock);

      // Cargar métricas
      const metricasMock: Metrica[] = [
        {
          id: 'pacientes',
          titulo: 'Pacientes activos',
          valor: 24,
          cambio: {
            valor: 3,
            porcentaje: 14,
            tipo: 'positivo',
          },
          icono: <UserGroupIcon className="w-6 h-6" />,
          datosGrafica: [18, 20, 21, 24],
          tendencia: 'positiva',
          descripcionGrafica: 'Evolución de pacientes activos en las últimas 4 semanas',
          colorGrafica: '#0EA5E9',
        },
        {
          id: 'citas',
          titulo: 'Citas esta semana',
          valor: 12,
          cambio: {
            valor: -2,
            porcentaje: -14,
            tipo: 'negativo',
          },
          icono: <CalendarDaysIcon className="w-6 h-6" />,
          datosGrafica: [15, 14, 16, 12],
          tendencia: 'negativa',
          descripcionGrafica: 'Citas programadas en las últimas 4 semanas',
          colorGrafica: '#F59E0B',
        },
        {
          id: 'adherencia',
          titulo: 'Tasa de adherencia',
          valor: '85%',
          cambio: {
            valor: 5,
            porcentaje: 6,
            tipo: 'positivo',
          },
          icono: <ChartBarIcon className="w-6 h-6" />,
          datosGrafica: [78, 82, 83, 85],
          tendencia: 'positiva',
          descripcionGrafica: 'Porcentaje de adherencia en las últimas 4 semanas',
          colorGrafica: '#22C55E',
        },
        {
          id: 'ingresos',
          titulo: 'Ingresos del mes',
          valor: '$3,450,000',
          cambio: {
            valor: 450000,
            porcentaje: 15,
            tipo: 'positivo',
          },
          icono: <BanknotesIcon className="w-6 h-6" />,
          datosGrafica: [2800000, 3000000, 3200000, 3450000],
          tendencia: 'positiva',
          descripcionGrafica: 'Ingresos mensuales en las últimas 4 semanas',
          colorGrafica: '#A855F7',
        },
      ];
      setMetricas(metricasMock);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setCargando(false);
    }
  };

  const manejarClickPaciente = (paciente: Paciente) => {
    router.push(`/pacientes/${paciente.id}/progreso`);
  };

  const manejarCancelarCita = async (citaId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('Cita')
        .update({ estado: 'CANCELADA' })
        .eq('id', citaId);

      if (error) throw error;

      toast.success('Cita cancelada exitosamente');
      cargarDatosDashboard();
    } catch (error) {
      console.error('Error cancelando cita:', error);
      toast.error('No se pudo cancelar la cita');
    }
  };

  const manejarReprogramarCita = (citaId: string) => {
    toast('Función de reprogramación en desarrollo', {
      icon: 'ℹ️',
    });
  };

  const manejarIniciarSesion = (citaId: string) => {
    router.push(`/chat?cita=${citaId}`);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dashboard Profesional
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus pacientes y citas programadas
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Métricas */}
          <section aria-labelledby="metricas-titulo">
            <h2 id="metricas-titulo" className="sr-only">
              Métricas principales
            </h2>
            <GridMetricas metricas={metricas} columnas={4} />
          </section>

          {/* Grid de 2 columnas: Tabla de pacientes + Próximas citas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tabla de pacientes (2/3 del ancho) */}
            <section className="lg:col-span-2" aria-labelledby="pacientes-titulo">
              <h2 id="pacientes-titulo" className="sr-only">
                Lista de pacientes
              </h2>
              <TablaPacientes
                pacientes={pacientes}
                onClickPaciente={manejarClickPaciente}
                cargando={false}
              />
            </section>

            {/* Próximas citas (1/3 del ancho) */}
            <section aria-labelledby="citas-titulo">
              <h2 id="citas-titulo" className="sr-only">
                Próximas citas
              </h2>
              <ProximasCitas
                citas={citasProximas}
                onCancelar={manejarCancelarCita}
                onReprogramar={manejarReprogramarCita}
                onIniciarSesion={manejarIniciarSesion}
                cargando={false}
                limite={5}
              />
            </section>
          </div>

          {/* Acciones rápidas */}
          <section
            className="bg-calma-50 border border-calma-200 rounded-lg p-6"
            aria-labelledby="acciones-titulo"
          >
            <h3 id="acciones-titulo" className="text-lg font-semibold text-gray-900 mb-4">
              Acciones rápidas
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/profesional/calendario')}
                className="px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
              >
                Ver calendario completo
              </button>
              <button
                onClick={() => router.push('/profesional/pacientes')}
                className="px-6 py-3 bg-white text-calma-600 border-2 border-calma-600 rounded-lg hover:bg-calma-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
              >
                Gestionar pacientes
              </button>
              <button
                onClick={() => router.push('/profesional/disponibilidad')}
                className="px-6 py-3 bg-white text-calma-600 border-2 border-calma-600 rounded-lg hover:bg-calma-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
              >
                Configurar disponibilidad
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
