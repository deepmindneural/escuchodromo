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
  ArrowTrendingUpIcon,
  ShieldCheckIcon as Shield,
} from '@heroicons/react/24/outline';
import { Zap } from 'lucide-react';
import { GridMetricas, type Metrica } from '@/lib/componentes/GridMetricas';
import { TablaPacientes, type Paciente } from '@/lib/componentes/TablaPacientes';
import { ProximasCitas, type Cita } from '@/lib/componentes/ProximasCitas';
import { CitasDelDia } from '@/lib/componentes/CitasDelDia';
import { ModalConfirmacion } from '@/lib/componentes/ui/modal-confirmacion';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import {
  obtenerPacientesProfesional,
  obtenerMetricasProfesional,
  obtenerProximasCitas,
  obtenerCitasHoy,
  type CitaDelDia,
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
  const [tieneSuscripcionActiva, setTieneSuscripcionActiva] = useState(true);

  // Estados de datos
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citasProximas, setCitasProximas] = useState<Cita[]>([]);
  const [citasHoy, setCitasHoy] = useState<CitaDelDia[]>([]);

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

      // Verificar suscripción activa
      const { data: suscripcionData } = await supabase
        .from('Suscripcion')
        .select('estado')
        .eq('usuario_id', usuarioData.id)
        .in('estado', ['activa', 'trial'])
        .single();

      setTieneSuscripcionActiva(!!suscripcionData);

      // Cargar citas de hoy
      const { data: citasHoyData, error: errorCitasHoy } = await obtenerCitasHoy(usuarioData.id);

      if (errorCitasHoy) {
        console.error('Error obteniendo citas de hoy:', errorCitasHoy);
        toast.error('Error al cargar las citas de hoy');
      } else if (citasHoyData) {
        setCitasHoy(citasHoyData);
      }

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

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
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
    <div className="min-h-screen bg-gradient-to-br from-calma-50/50 via-white to-esperanza-50/50">
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
        className="relative bg-gradient-to-r from-calma-600 via-calma-500 to-esperanza-500 text-white shadow-2xl overflow-hidden"
      >
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <HeartIcon className="w-8 h-8 text-white" aria-hidden="true" />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold tracking-tight"
                  >
                    ¡Hola, {nombreProfesional}!
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-base md:text-lg mt-1"
                  >
                    Bienvenido a tu espacio profesional de apoyo terapéutico
                  </motion.p>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 ml-18"
              >
                <SparklesIcon className="w-5 h-5 text-yellow-300 animate-pulse" aria-hidden="true" />
                <span className="text-sm text-white/80">
                  Gestiona tus pacientes y citas programadas
                </span>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/profesional/perfil')}
              className="px-6 py-3.5 bg-white text-calma-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-white/50 flex items-center gap-2 group"
            >
              <span>Ver mi perfil</span>
              <ArrowTrendingUpIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="space-y-8">
          {/* Banner de Suscripción (si no tiene plan activo) */}
          {!tieneSuscripcionActiva && (
            <motion.div variants={itemVariants}>
              <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden">
                {/* Patrón decorativo */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                </div>

                <div className="relative px-6 py-8 md:px-10 md:py-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
                          <Zap className="w-7 h-7 text-yellow-900" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">
                          Activa tu plan profesional
                        </h3>
                      </div>
                      <p className="text-blue-100 text-base md:text-lg leading-relaxed max-w-2xl">
                        Para comenzar a atender pacientes y acceder a todas las herramientas profesionales,
                        necesitas activar un plan de suscripción. Prueba gratis durante 14 días.
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <Shield className="w-5 h-5 text-blue-200" />
                        <span className="text-sm text-blue-200">
                          Sin compromiso · Cancela cuando quieras
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/profesional/planes')}
                        className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group"
                      >
                        <span>Ver planes disponibles</span>
                        <ArrowTrendingUpIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                      <p className="text-center text-blue-100 text-sm">
                        Desde $99.900 COP/mes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Citas de Hoy - Banner prominente */}
          {citasHoy.length > 0 && (
            <motion.div variants={itemVariants}>
              <CitasDelDia
                citas={citasHoy}
                cargando={false}
                onIniciarSesion={manejarIniciarSesion}
                onVerPaciente={manejarClickPaciente}
                onCancelar={manejarCancelarCita}
              />
            </motion.div>
          )}

          {/* Métricas con animación mejorada */}
          <motion.section variants={itemVariants} aria-labelledby="metricas-titulo">
            <h2 id="metricas-titulo" className="sr-only">
              Métricas principales
            </h2>
            <GridMetricas metricas={metricas} columnas={4} />
          </motion.section>

          {/* Grid de 2 columnas: Tabla de pacientes + Próximas citas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Tabla de pacientes (2/3 del ancho) */}
            <motion.section
              variants={itemVariants}
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
            <motion.section variants={itemVariants} aria-labelledby="citas-titulo">
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
            variants={itemVariants}
            className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8 overflow-hidden group hover:shadow-2xl transition-all duration-300"
            aria-labelledby="acciones-titulo"
          >
            {/* Gradiente decorativo de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-calma-100 to-esperanza-100 rounded-full filter blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-calma-500 to-esperanza-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrophyIcon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h3 id="acciones-titulo" className="text-2xl font-bold text-gray-900">
                  Acciones rápidas
                </h3>
              </div>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/profesional/calendario')}
                  className="px-6 py-4 bg-gradient-to-r from-calma-600 to-calma-700 text-white rounded-xl hover:from-calma-700 hover:to-calma-800 font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-calma-300 flex items-center gap-3 group"
                >
                  <CalendarDaysIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Ver calendario completo</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/profesional/pacientes')}
                  className="px-6 py-4 bg-white text-calma-700 border-2 border-calma-600 rounded-xl hover:bg-calma-50 font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-calma-300 flex items-center gap-3 group"
                >
                  <UserGroupIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Gestionar pacientes</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/profesional/disponibilidad')}
                  className="px-6 py-4 bg-white text-esperanza-700 border-2 border-esperanza-600 rounded-xl hover:bg-esperanza-50 font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-esperanza-300 flex items-center gap-3 group"
                >
                  <ClockIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Configurar disponibilidad</span>
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* Mensaje de soporte emocional mejorado */}
          <motion.div
            variants={itemVariants}
            className="relative bg-gradient-to-r from-esperanza-100 via-calma-50 to-serenidad-100 border-l-4 border-esperanza-500 rounded-2xl p-8 shadow-lg overflow-hidden"
            role="complementary"
            aria-label="Mensaje de apoyo"
          >
            {/* Patrón decorativo */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-esperanza-200 rounded-full filter blur-3xl opacity-30"></div>

            <div className="relative flex items-start gap-5">
              <div className="flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 bg-gradient-to-br from-esperanza-500 to-calma-500 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <HeartIcon className="w-8 h-8 text-white" aria-hidden="true" />
                </motion.div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  Gracias por tu dedicación
                  <SparklesIcon className="w-5 h-5 text-esperanza-600" />
                </h4>
                <p className="text-gray-700 leading-relaxed text-base">
                  Tu trabajo como profesional de la salud mental es fundamental para el bienestar de tus pacientes.
                  Recuerda que también es importante cuidar de tu propio bienestar emocional. Si necesitas apoyo,
                  no dudes en contactar a nuestro equipo de supervisión.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
