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
import { ModalConfirmacion } from '@/lib/componentes/ui/modal-confirmacion';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import {
  obtenerPacientesProfesional,
  obtenerMetricasProfesional,
  obtenerProximasCitas,
} from '@/lib/supabase/queries/profesional';
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
  const supabase = obtenerClienteNavegador();

  const [cargando, setCargando] = useState(true);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);

  // Estados de datos
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citasProximas, setCitasProximas] = useState<Cita[]>([]);

  // Estado para modal de confirmación
  const [citaACancelar, setCitaACancelar] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

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
        .eq('auth_id', session.user.id)
        .single();

      if (errorUsuario || !usuario) {
        toast.error('Error al cargar información del usuario');
        return;
      }

      // Type assertion para evitar tipo 'never' por falta de definiciones en Database
      const usuarioData = usuario as { id: string; rol: 'USUARIO' | 'TERAPEUTA' | 'ADMIN' };

      if (usuarioData.rol !== 'TERAPEUTA' && usuarioData.rol !== 'ADMIN') {
        toast.error('No tienes permisos para acceder a este dashboard');
        router.push('/dashboard');
        return;
      }

      setProfesionalId(usuarioData.id);

      // Cargar próximas citas del profesional
      const { data: citasData, error: errorCitas } = await obtenerProximasCitas(usuarioData.id, 10);

      if (errorCitas) {
        console.error('Error obteniendo próximas citas:', errorCitas);
        toast.error('Error al cargar las próximas citas');
      } else if (citasData) {
        const citasFormateadas: Cita[] = citasData.map((cita) => ({
          id: cita.id,
          paciente: {
            nombre: cita.paciente.nombre,
            apellido: cita.paciente.apellido || '',
            foto: cita.paciente.foto_perfil,
          },
          fecha: cita.fecha_hora,
          duracion: cita.duracion,
          modalidad: cita.modalidad.toUpperCase() as 'VIRTUAL' | 'PRESENCIAL',
          estado: cita.estado.toUpperCase() as
            | 'PENDIENTE'
            | 'CONFIRMADA'
            | 'COMPLETADA'
            | 'CANCELADA'
            | 'NO_ASISTIO',
        }));
        setCitasProximas(citasFormateadas);
      }

      // Cargar pacientes del profesional
      const { data: pacientesData, error: errorPacientes } = await obtenerPacientesProfesional(
        usuarioData.id
      );

      if (errorPacientes) {
        console.error('Error obteniendo pacientes:', errorPacientes);
        toast.error('Error al cargar los pacientes');
      } else if (pacientesData) {
        const pacientesFormateados: Paciente[] = pacientesData.map((paciente) => ({
          id: paciente.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido || '',
          ultimoContacto: paciente.ultima_cita || new Date(),
          estadoEmocional: paciente.estado_emocional || 'ESTABLE',
          progreso: paciente.progreso || 0,
          sesionesCompletadas: paciente.citas_completadas,
          sesionesProgramadas: paciente.total_citas,
        }));
        setPacientes(pacientesFormateados);
      }

      // Cargar métricas del profesional
      const { data: metricasData, error: errorMetricas } = await obtenerMetricasProfesional(
        usuarioData.id
      );

      if (errorMetricas) {
        console.error('Error obteniendo métricas:', errorMetricas);
        toast.error('Error al cargar las métricas');
      } else if (metricasData) {
        // Calcular cambios basados en tendencias
        const calcularCambio = (tendencia: number[]) => {
          if (tendencia.length < 2) return { valor: 0, porcentaje: 0, tipo: 'neutro' as const };
          const valorActual = tendencia[tendencia.length - 1];
          const valorAnterior = tendencia[tendencia.length - 2];
          const cambioValor = valorActual - valorAnterior;
          const cambioPorcentaje =
            valorAnterior > 0 ? Math.round((cambioValor / valorAnterior) * 100) : 0;
          return {
            valor: cambioValor,
            porcentaje: Math.abs(cambioPorcentaje),
            tipo: (cambioValor >= 0 ? 'positivo' : 'negativo') as 'positivo' | 'negativo',
          };
        };

        // Formatear ingresos en pesos colombianos
        const formatearMoneda = (valor: number) => {
          return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
          }).format(valor);
        };

        const cambioPacientes = calcularCambio(metricasData.tendenciaPacientes);
        const cambioCitas = calcularCambio(metricasData.tendenciaCitas);
        const cambioAdherencia = calcularCambio(metricasData.tendenciaAdherencia);
        const cambioIngresos = {
          valor: metricasData.ingresosMes - metricasData.ingresosMesAnterior,
          porcentaje:
            metricasData.ingresosMesAnterior > 0
              ? Math.round(
                  ((metricasData.ingresosMes - metricasData.ingresosMesAnterior) /
                    metricasData.ingresosMesAnterior) *
                    100
                )
              : 0,
          tipo:
            metricasData.ingresosMes >= metricasData.ingresosMesAnterior
              ? ('positivo' as const)
              : ('negativo' as const),
        };

        const metricasFormateadas: Metrica[] = [
          {
            id: 'pacientes',
            titulo: 'Pacientes activos',
            valor: metricasData.pacientesActivos,
            cambio: cambioPacientes,
            icono: <UserGroupIcon className="w-6 h-6" />,
            datosGrafica: metricasData.tendenciaPacientes,
            tendencia:
              cambioPacientes.tipo === 'positivo'
                ? 'positiva'
                : cambioPacientes.tipo === 'negativo'
                  ? 'negativa'
                  : 'neutra',
            descripcionGrafica: 'Evolución de pacientes activos en las últimas 4 semanas',
            colorGrafica: '#0EA5E9',
          },
          {
            id: 'citas',
            titulo: 'Citas esta semana',
            valor: metricasData.citasEstaSemana,
            cambio: cambioCitas,
            icono: <CalendarDaysIcon className="w-6 h-6" />,
            datosGrafica: metricasData.tendenciaCitas,
            tendencia:
              cambioCitas.tipo === 'positivo'
                ? 'positiva'
                : cambioCitas.tipo === 'negativo'
                  ? 'negativa'
                  : 'neutra',
            descripcionGrafica: 'Citas programadas en las últimas 4 semanas',
            colorGrafica: '#F59E0B',
          },
          {
            id: 'adherencia',
            titulo: 'Tasa de adherencia',
            valor: `${metricasData.tasaAdherencia}%`,
            cambio: cambioAdherencia,
            icono: <ChartBarIcon className="w-6 h-6" />,
            datosGrafica: metricasData.tendenciaAdherencia,
            tendencia:
              cambioAdherencia.tipo === 'positivo'
                ? 'positiva'
                : cambioAdherencia.tipo === 'negativo'
                  ? 'negativa'
                  : 'neutra',
            descripcionGrafica: 'Porcentaje de adherencia en las últimas 4 semanas',
            colorGrafica: '#22C55E',
          },
          {
            id: 'ingresos',
            titulo: 'Ingresos del mes',
            valor: formatearMoneda(metricasData.ingresosMes),
            cambio: cambioIngresos,
            icono: <BanknotesIcon className="w-6 h-6" />,
            datosGrafica: metricasData.tendenciaIngresos,
            tendencia:
              cambioIngresos.tipo === 'positivo'
                ? 'positiva'
                : cambioIngresos.tipo === 'negativo'
                  ? 'negativa'
                  : 'neutra',
            descripcionGrafica: 'Ingresos mensuales en las últimas 4 semanas',
            colorGrafica: '#A855F7',
          },
        ];

        setMetricas(metricasFormateadas);
      }
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

  const manejarCancelarCita = (citaId: string) => {
    setCitaACancelar(citaId);
  };

  const confirmarCancelacion = async () => {
    if (!citaACancelar) return;

    try {
      setCancelando(true);
      const { error } = await supabase
        .from('Cita')
        .update({ estado: 'cancelada' } as any) // Type assertion por falta de definición de Cita en Database
        .eq('id', citaACancelar);

      if (error) throw error;

      toast.success('Cita cancelada exitosamente');
      setCitaACancelar(null);
      cargarDatosDashboard();
    } catch (error) {
      console.error('Error cancelando cita:', error);
      toast.error('No se pudo cancelar la cita');
    } finally {
      setCancelando(false);
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
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando dashboard profesional"
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            aria-hidden="true"
          />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de confirmación de cancelación */}
      <ModalConfirmacion
        abierto={!!citaACancelar}
        onCerrar={() => setCitaACancelar(null)}
        onConfirmar={confirmarCancelacion}
        titulo="Cancelar cita"
        descripcion="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer y el paciente será notificado."
        textoConfirmar="Sí, cancelar cita"
        textoCancelar="No, mantener cita"
        peligroso={true}
        cargando={cancelando}
      />

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
