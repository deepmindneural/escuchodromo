'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BanknotesIcon,
  ClockIcon,
  HeartIcon,
  TrophyIcon,
  SparklesIcon,
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
import toast, { Toaster } from 'react-hot-toast';

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
  const [nombreProfesional, setNombreProfesional] = useState<string>('');

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
        .select('id, rol, nombre')
        .eq('auth_id', session.user.id)
        .single();

      if (errorUsuario || !usuario) {
        toast.error('Error al cargar información del usuario');
        return;
      }

      // Type assertion para evitar tipo 'never' por falta de definiciones en Database
      const usuarioData = usuario as { id: string; rol: 'USUARIO' | 'TERAPEUTA' | 'ADMIN'; nombre: string };

      if (usuarioData.rol !== 'TERAPEUTA' && usuarioData.rol !== 'ADMIN') {
        toast.error('No tienes permisos para acceder a este dashboard');
        router.push('/dashboard');
        return;
      }

      setProfesionalId(usuarioData.id);
      setNombreProfesional(usuarioData.nombre || 'Profesional');

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
            colorGrafica: '#14B8A6',
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
        className="min-h-screen bg-gradient-to-br from-calma-50 via-white to-esperanza-50 flex items-center justify-center"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative mx-auto mb-6">
            <div
              className="w-20 h-20 border-4 border-calma-200 border-t-calma-600 rounded-full animate-spin"
              aria-hidden="true"
            />
            <HeartIcon className="w-8 h-8 text-calma-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-gray-700 text-lg font-medium">Cargando dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Preparando tu información</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calma-50 via-white to-esperanza-50">
      <Toaster position="top-right" />

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

      {/* Header con bienvenida personalizada */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-calma-600 via-calma-500 to-esperanza-500 text-white shadow-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <HeartIcon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  ¡Hola, {nombreProfesional}! 👋
                </h1>
              </div>
              <p className="text-white/90 text-lg ml-15">
                Bienvenido a tu espacio profesional de apoyo terapéutico
              </p>
              <div className="flex items-center gap-2 mt-3 ml-15">
                <SparklesIcon className="w-5 h-5 text-yellow-300" aria-hidden="true" />
                <span className="text-sm text-white/80">
                  Gestiona tus pacientes y citas programadas
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/profesional/perfil')}
              className="px-6 py-3 bg-white text-calma-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-calma-600"
            >
              Ver mi perfil
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Métricas con animación */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            aria-labelledby="metricas-titulo"
          >
            <h2 id="metricas-titulo" className="sr-only">
              Métricas principales
            </h2>
            <GridMetricas metricas={metricas} columnas={4} />
          </motion.section>

          {/* Grid de 2 columnas: Tabla de pacientes + Próximas citas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tabla de pacientes (2/3 del ancho) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:col-span-2"
              aria-labelledby="pacientes-titulo"
            >
              <h2 id="pacientes-titulo" className="sr-only">
                Lista de pacientes
              </h2>
              <TablaPacientes
                pacientes={pacientes}
                onClickPaciente={manejarClickPaciente}
                cargando={false}
              />
            </motion.section>

            {/* Próximas citas (1/3 del ancho) */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              aria-labelledby="citas-titulo"
            >
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
            </motion.section>
          </div>

          {/* Acciones rápidas con diseño mejorado */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-calma-100 p-8 hover:shadow-xl transition-shadow"
            aria-labelledby="acciones-titulo"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-calma-500 to-esperanza-500 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 id="acciones-titulo" className="text-xl font-bold text-gray-900">
                Acciones rápidas
              </h3>
            </div>
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/profesional/calendario')}
                className="px-6 py-3.5 bg-gradient-to-r from-calma-600 to-calma-700 text-white rounded-xl hover:from-calma-700 hover:to-calma-800 font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <CalendarDaysIcon className="w-5 h-5" />
                Ver calendario completo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/profesional/pacientes')}
                className="px-6 py-3.5 bg-white text-calma-700 border-2 border-calma-600 rounded-xl hover:bg-calma-50 font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <UserGroupIcon className="w-5 h-5" />
                Gestionar pacientes
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/profesional/disponibilidad')}
                className="px-6 py-3.5 bg-white text-esperanza-700 border-2 border-esperanza-600 rounded-xl hover:bg-esperanza-50 font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-esperanza-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <ClockIcon className="w-5 h-5" />
                Configurar disponibilidad
              </motion.button>
            </div>
          </motion.section>

          {/* Mensaje de soporte emocional */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-gradient-to-r from-esperanza-100 via-calma-50 to-serenidad-100 border-l-4 border-esperanza-500 rounded-xl p-6 shadow-md"
            role="complementary"
            aria-label="Mensaje de apoyo"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-esperanza-500 rounded-full flex items-center justify-center">
                  <HeartIcon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Gracias por tu dedicación
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  Tu trabajo como profesional de la salud mental es fundamental para el bienestar de tus pacientes.
                  Recuerda que también es importante cuidar de tu propio bienestar emocional. Si necesitas apoyo,
                  no dudes en contactar a nuestro equipo de supervisión.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
