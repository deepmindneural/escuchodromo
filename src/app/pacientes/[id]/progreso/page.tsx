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

      // Cargar evaluaciones reales
      const evaluacionesData = await obtenerEvaluacionesPaciente(pacienteId);

      // Convertir a formato EvaluacionTabla
      const evaluacionesFormateadas: EvaluacionTabla[] = evaluacionesData.map((ev) => ({
        id: ev.id,
        tipo_evaluacion: ev.test.codigo as 'PHQ-9' | 'GAD-7' | 'Otro',
        puntuacion_total: ev.puntuacion,
        nivel_severidad: ev.severidad || 'No especificado',
        fecha_evaluacion: new Date(ev.creado_en),
      }));
      setEvaluaciones(evaluacionesFormateadas);

      // Cargar evolución PHQ-9 y GAD-7
      const phq9Data = await obtenerEvolucionPHQ9(pacienteId);
      setEvolucionPHQ9(phq9Data);

      const gad7Data = await obtenerEvolucionGAD7(pacienteId);
      setEvolucionGAD7(gad7Data);

      // Cargar resumen
      const resumenData = await obtenerResumenEvaluaciones(pacienteId);
      setResumen(resumenData);

      // Cargar sesiones/citas
      const { data: citasData } = await supabase
        .from('Cita')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha_hora', { ascending: false })
        .limit(10);

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
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando progreso del paciente...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-4">
            {paciente.foto ? (
              <img
                src={paciente.foto}
                alt={`${paciente.nombre} ${paciente.apellido}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {paciente.nombre.charAt(0)}
                {paciente.apellido.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Progreso de {paciente.nombre} {paciente.apellido}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{paciente.email}</p>
              {resumen && (
                <p className="text-sm text-gray-500 mt-1">
                  {resumen.total} evaluaciones realizadas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Métricas de resumen */}
          {resumen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* PHQ-9 */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">PHQ-9 (Depresión)</h3>
                {resumen.phq9.ultima_puntuacion !== null ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {resumen.phq9.ultima_puntuacion}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resumen.phq9.ultima_severidad || 'Sin clasificar'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {resumen.phq9.total_realizadas} evaluaciones
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin evaluaciones</p>
                )}
              </div>

              {/* GAD-7 */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">GAD-7 (Ansiedad)</h3>
                {resumen.gad7.ultima_puntuacion !== null ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {resumen.gad7.ultima_puntuacion}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resumen.gad7.ultima_severidad || 'Sin clasificar'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {resumen.gad7.total_realizadas} evaluaciones
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin evaluaciones</p>
                )}
              </div>

              {/* Total Evaluaciones */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Evaluaciones</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">{resumen.total}</p>
                <p className="text-xs text-gray-500">Completadas</p>
              </div>

              {/* Sesiones */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Sesiones</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">{sesiones.length}</p>
                <p className="text-xs text-gray-500">Registradas</p>
              </div>
            </motion.div>
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
    </div>
  );
}
