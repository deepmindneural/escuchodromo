'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  CheckCircle,
  Activity,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/lib/componentes/ui/button';
import { TimelineSesiones, type SesionTimeline } from '@/lib/componentes/TimelineSesiones';
import { TablaEvaluaciones, type EvaluacionTabla } from '@/lib/componentes/TablaEvaluaciones';
import { GraficaEvolucion, type PuntoEvolucion } from '@/lib/componentes/GraficaEvolucion';
import { AlertasClinicas } from '@/lib/componentes/AlertasClinicas';
import Link from 'next/link';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import {
  obtenerEvaluacionesPaciente,
  obtenerEvolucionPHQ9,
  obtenerEvolucionGAD7,
  obtenerResumenEvaluaciones,
  type EvaluacionDetalle,
  type EvolucionScore,
} from '@/lib/supabase/queries/evaluaciones';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface DatosPaciente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  foto?: string;
}

/**
 * Página de Visualización de Progreso del Paciente
 *
 * Muestra:
 * - Tabla de evaluaciones (PHQ-9, GAD-7)
 * - Gráficas de evolución temporal
 * - Timeline de sesiones
 * - Métricas y resumen
 */
export default function PaginaProgresoPaciente() {
  const params = useParams();
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const pacienteId = params.id as string;

  const [cargando, setCargando] = useState(true);
  const [paciente, setPaciente] = useState<DatosPaciente | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionTabla[]>([]);
  const [sesiones, setSesiones] = useState<SesionTimeline[]>([]);
  const [evolucionPHQ9, setEvolucionPHQ9] = useState<EvolucionScore[]>([]);
  const [evolucionGAD7, setEvolucionGAD7] = useState<EvolucionScore[]>([]);
  const [resumen, setResumen] = useState<any>(null);

  useEffect(() => {
    cargarDatosProgreso();
  }, [pacienteId]);

  /**
   * Calcula información contextual del tratamiento
   */
  const obtenerContextoTratamiento = () => {
    if (sesiones.length === 0) return null;

    // Ordenar sesiones por fecha
    const sesionesOrdenadas = [...sesiones].sort((a, b) =>
      a.fecha_hora.getTime() - b.fecha_hora.getTime()
    );

    // Primera cita (inicio del tratamiento)
    const primeraCita = sesionesOrdenadas[0];
    const fechaInicio = primeraCita.fecha_hora;

    // Última sesión completada
    const sesionesCompletadas = sesionesOrdenadas.filter(s => s.estado === 'completada');
    const ultimaSesion = sesionesCompletadas[sesionesCompletadas.length - 1];

    // Tiempo en tratamiento
    const diasEnTratamiento = Math.floor(
      (Date.now() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
    );
    const mesesEnTratamiento = Math.floor(diasEnTratamiento / 30);

    return {
      fechaInicio,
      ultimaSesion,
      diasEnTratamiento,
      mesesEnTratamiento,
      totalSesionesCompletadas: sesionesCompletadas.length,
    };
  };

  /**
   * Calcula la tendencia global de una serie de puntuaciones
   */
  const calcularTendenciaGlobal = (datos: EvolucionScore[]): 'mejorando' | 'empeoramiento' | 'estable' | null => {
    if (datos.length < 2) return null;

    // Tomar últimos 3 puntos si hay suficientes
    const ultimosPuntos = datos.slice(-3);
    const primera = ultimosPuntos[0].puntuacion;
    const ultima = ultimosPuntos[ultimosPuntos.length - 1].puntuacion;

    const diferencia = ultima - primera;

    if (diferencia <= -3) return 'mejorando'; // Mejoría significativa
    if (diferencia >= 3) return 'empeorando'; // Empeoramiento significativo
    return 'estable';
  };

  /**
   * Combina datos de evolución PHQ-9 y GAD-7 en formato para gráfica
   */
  const combinarDatosEvolucion = (): PuntoEvolucion[] => {
    const mapaFechas = new Map<string, PuntoEvolucion>();

    // Agregar datos PHQ-9
    evolucionPHQ9.forEach(punto => {
      const fechaKey = new Date(punto.fecha).toISOString().split('T')[0];
      mapaFechas.set(fechaKey, {
        fecha: new Date(punto.fecha),
        phq9: punto.puntuacion,
      });
    });

    // Agregar datos GAD-7
    evolucionGAD7.forEach(punto => {
      const fechaKey = new Date(punto.fecha).toISOString().split('T')[0];
      const existente = mapaFechas.get(fechaKey);
      mapaFechas.set(fechaKey, {
        fecha: new Date(punto.fecha),
        phq9: existente?.phq9,
        gad7: punto.puntuacion,
      });
    });

    // Convertir a array y ordenar por fecha
    return Array.from(mapaFechas.values())
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  };

  const cargarDatosProgreso = async () => {
    try {
      setCargando(true);

      // Verificar sesión y permisos
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Obtener el ID del profesional autenticado
      const { data: usuarioActual } = await supabase
        .from('Usuario')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (!usuarioActual) {
        toast.error('No se pudo verificar tu identidad');
        router.push('/iniciar-sesion');
        return;
      }

      const profesionalId = usuarioActual.id;

      // Cargar datos del paciente usando la función de BD
      const { data: datosPaciente, error: errorPaciente } = await supabase
        .rpc('obtener_datos_paciente_para_profesional', {
          p_profesional_id: profesionalId,
          p_paciente_id: pacienteId
        });

      if (errorPaciente || !datosPaciente || datosPaciente.length === 0) {
        toast.error('No tienes permiso para ver este paciente o no existe');
        router.push('/profesional/pacientes');
        setCargando(false);
        return;
      }

      const pacienteData = datosPaciente[0];
      setPaciente({
        id: pacienteData.id,
        nombre: pacienteData.nombre || '',
        apellido: pacienteData.apellido || '',
        email: pacienteData.email || '',
        foto: pacienteData.imagen,
      });

      // ✅ OPTIMIZACIÓN: Cargar todos los datos en paralelo
      const [
        evaluacionesData,
        phq9Data,
        gad7Data,
        resumenData,
        { data: citasData }
      ] = await Promise.all([
        obtenerEvaluacionesPaciente(pacienteId),
        obtenerEvolucionPHQ9(pacienteId),
        obtenerEvolucionGAD7(pacienteId),
        obtenerResumenEvaluaciones(pacienteId),
        supabase
          .from('Cita')
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_hora', { ascending: false })
          .limit(10)
      ]);

      // Convertir a formato EvaluacionTabla
      const evaluacionesFormateadas: EvaluacionTabla[] = evaluacionesData.map((ev) => ({
        id: ev.id,
        tipo_evaluacion: ev.test.codigo as 'PHQ-9' | 'GAD-7' | 'Otro',
        puntuacion_total: ev.puntuacion,
        nivel_severidad: ev.severidad || 'No especificado',
        fecha_evaluacion: new Date(ev.creado_en),
      }));
      setEvaluaciones(evaluacionesFormateadas);

      // Establecer evolución y resumen
      setEvolucionPHQ9(phq9Data);
      setEvolucionGAD7(gad7Data);
      setResumen(resumenData);

      if (citasData) {
        const sesionesFormateadas: SesionTimeline[] = citasData.map((cita: any) => ({
          id: cita.id,
          fecha_hora: new Date(cita.fecha_hora),
          duracion: cita.duracion || 60,
          modalidad: cita.modalidad || 'virtual',
          estado: cita.estado || 'pendiente',
          motivo_consulta: cita.motivo_consulta,
          notas_profesional: cita.notas_profesional,
          notas_paciente: cita.notas_paciente,
        }));
        setSesiones(sesionesFormateadas);
      }
    } catch (error) {
      console.error('Error cargando progreso:', error);
      toast.error('Error al cargar el progreso del paciente');
    } finally {
      setCargando(false);
    }
  };


  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="w-16 h-16 text-calma-600 animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-900 font-medium">Cargando información del paciente</p>
          <p className="text-sm text-gray-600 mt-2">
            Obteniendo evaluaciones, sesiones y análisis de progreso...
          </p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-alerta-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paciente no encontrado</h1>
          <p className="text-gray-600 mb-6">No se pudo cargar la información del paciente</p>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-calma-500 rounded-lg p-2 transition-colors"
            aria-label="Volver a lista de pacientes"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-4">
            {paciente.foto ? (
              <img
                src={paciente.foto}
                alt={`${paciente.nombre} ${paciente.apellido}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-calma-200"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-calma-400 to-calma-500 flex items-center justify-center text-white font-bold text-xl shadow-lg"
                role="img"
                aria-label={`Avatar de ${paciente.nombre} ${paciente.apellido}`}
              >
                {paciente.nombre.charAt(0)}
                {paciente.apellido.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Progreso de {paciente.nombre} {paciente.apellido}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{paciente.email}</p>

              {/* Contexto terapéutico */}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                {resumen && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-calma-600" aria-hidden="true" />
                    <span>{resumen.total} evaluaciones realizadas</span>
                  </div>
                )}

                {(() => {
                  const contexto = obtenerContextoTratamiento();
                  if (!contexto) return null;

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-calma-600" aria-hidden="true" />
                        <span>
                          {contexto.mesesEnTratamiento > 0
                            ? `${contexto.mesesEnTratamiento} ${contexto.mesesEnTratamiento === 1 ? 'mes' : 'meses'} en tratamiento`
                            : `${contexto.diasEnTratamiento} días en tratamiento`}
                        </span>
                      </div>

                      {contexto.ultimaSesion && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-calma-600" aria-hidden="true" />
                          <span>
                            Última sesión: {contexto.ultimaSesion.fecha_hora.toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main role="main" aria-label="Contenido principal de progreso del paciente">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Alertas Clínicas */}
            {resumen && (
              <AlertasClinicas
                phq9={resumen.phq9.ultima_puntuacion}
                gad7={resumen.gad7.ultima_puntuacion}
                fechaUltimaEvaluacion={resumen.phq9.fecha_ultima || resumen.gad7.fecha_ultima}
                tendencias={{
                  phq9: calcularTendenciaGlobal(evolucionPHQ9),
                  gad7: calcularTendenciaGlobal(evolucionGAD7),
                }}
              />
            )}

            {/* Métricas de resumen */}
            {resumen && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                role="region"
                aria-label="Resumen de indicadores clínicos del paciente"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
              {/* PHQ-9 */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6" role="article" aria-labelledby="metrica-phq9">
                <h3 id="metrica-phq9" className="text-sm font-medium text-gray-600 mb-2">PHQ-9 (Depresión)</h3>
                {resumen.phq9.ultima_puntuacion !== null ? (
                  <div aria-live="polite" aria-atomic="true">
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {resumen.phq9.ultima_puntuacion}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resumen.phq9.ultima_severidad || 'Sin clasificar'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {resumen.phq9.total_realizadas} evaluaciones
                    </p>
                    <span className="sr-only">
                      Última puntuación PHQ-9: {resumen.phq9.ultima_puntuacion}, severidad {resumen.phq9.ultima_severidad}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin evaluaciones</p>
                )}
              </div>

              {/* GAD-7 */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6" role="article" aria-labelledby="metrica-gad7">
                <h3 id="metrica-gad7" className="text-sm font-medium text-gray-600 mb-2">GAD-7 (Ansiedad)</h3>
                {resumen.gad7.ultima_puntuacion !== null ? (
                  <div aria-live="polite" aria-atomic="true">
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {resumen.gad7.ultima_puntuacion}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resumen.gad7.ultima_severidad || 'Sin clasificar'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {resumen.gad7.total_realizadas} evaluaciones
                    </p>
                    <span className="sr-only">
                      Última puntuación GAD-7: {resumen.gad7.ultima_puntuacion}, severidad {resumen.gad7.ultima_severidad}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin evaluaciones</p>
                )}
              </div>

              {/* Total Evaluaciones */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6" role="article" aria-labelledby="metrica-total">
                <h3 id="metrica-total" className="text-sm font-medium text-gray-600 mb-2">Total Evaluaciones</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1" aria-live="polite">{resumen.total}</p>
                <p className="text-xs text-gray-500">Completadas</p>
              </div>

              {/* Sesiones */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6" role="article" aria-labelledby="metrica-sesiones">
                <h3 id="metrica-sesiones" className="text-sm font-medium text-gray-600 mb-2">Sesiones</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1" aria-live="polite">{sesiones.length}</p>
                <p className="text-xs text-gray-500">Registradas</p>
              </div>
            </motion.section>
          )}

          {/* Gráficas de Evolución */}
          {(evolucionPHQ9.length > 0 || evolucionGAD7.length > 0) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              role="region"
              aria-label="Gráfica de evolución de indicadores clínicos"
            >
              <GraficaEvolucion
                datos={combinarDatosEvolucion()}
                titulo="Evolución de Indicadores Clínicos"
                descripcion="Gráfica que muestra la evolución temporal de los puntajes PHQ-9 (depresión) y GAD-7 (ansiedad) del paciente. Puntajes más bajos indican mejoría."
                altura={400}
              />
            </motion.section>
          )}

          {/* Tabla de Evaluaciones */}
          {evaluaciones.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TablaEvaluaciones evaluaciones={evaluaciones} />
            </motion.section>
          )}

          {/* Timeline de Sesiones */}
          {sesiones.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TimelineSesiones sesiones={sesiones} />
            </motion.section>
          )}

          {/* Mensaje si no hay datos */}
          {evaluaciones.length === 0 && sesiones.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-md p-12 text-center"
            >
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sin datos de progreso aún
              </h3>
              <p className="text-gray-600">
                Este paciente aún no tiene evaluaciones ni sesiones registradas.
              </p>
            </motion.div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
