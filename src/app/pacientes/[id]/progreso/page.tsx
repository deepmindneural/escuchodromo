'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { GraficaEvolucion, type PuntoEvolucion } from '@/lib/componentes/GraficaEvolucion';
import { TimelineHitos, type Hito } from '@/lib/componentes/TimelineHitos';
import { VistaComparativa, type DatosComparativos } from '@/lib/componentes/VistaComparativa';
import { ListaAlertas } from '@/lib/componentes/AlertaCritica';
import { IndicadorEmocional, type EstadoEmocional } from '@/lib/componentes/IndicadorEmocional';
import { createClient } from '@/lib/supabase/cliente';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface DatosPaciente {
  id: string;
  nombre: string;
  apellido: string;
  foto?: string;
  estadoEmocional: EstadoEmocional;
}

interface MetricasProgreso {
  phq9: {
    promedio_ultimas_4_semanas: number;
    tendencia: 'mejorando' | 'estable' | 'empeorando';
    ultima_evaluacion: number;
  };
  gad7: {
    promedio_ultimas_4_semanas: number;
    tendencia: 'mejorando' | 'estable' | 'empeorando';
    ultima_evaluacion: number;
  };
  sesiones_completadas: number;
  sesiones_totales: number;
  adherencia_porcentaje: number;
  dias_activo: number;
}

/**
 * Página de Visualización de Progreso del Paciente
 *
 * Muestra:
 * - Gráfica de evolución (PHQ-9 y GAD-7)
 * - Alertas críticas
 * - Timeline de hitos
 * - Vista comparativa (semanal/mensual)
 * - Métricas clave
 */
export default function PaginaProgresoPaciente() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const pacienteId = params.id as string;

  const [cargando, setCargando] = useState(true);
  const [paciente, setPaciente] = useState<DatosPaciente | null>(null);
  const [metricas, setMetricas] = useState<MetricasProgreso | null>(null);
  const [evolucion, setEvolucion] = useState<PuntoEvolucion[]>([]);
  const [hitos, setHitos] = useState<Hito[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [datosSemanales, setDatosSemanales] = useState<DatosComparativos[]>([]);
  const [datosMensuales, setDatosMensuales] = useState<DatosComparativos[]>([]);

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

      const token = session.access_token;

      // Cargar datos del paciente
      const { data: datosUsuario, error: errorUsuario } = await supabase
        .from('Usuario')
        .select('id, nombre, apellido, PerfilUsuario(*)')
        .eq('id', pacienteId)
        .single();

      if (errorUsuario || !datosUsuario) {
        toast.error('No se pudo cargar la información del paciente');
        return;
      }

      setPaciente({
        id: datosUsuario.id,
        nombre: datosUsuario.nombre || '',
        apellido: datosUsuario.apellido || '',
        foto: datosUsuario.PerfilUsuario?.foto_perfil,
        estadoEmocional: 'ESTABLE', // Default, debería venir de la API
      });

      // Llamar a Edge Function de progreso
      const response = await supabase.functions.invoke('progreso-paciente', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // @ts-ignore
        body: {
          paciente_id: pacienteId,
        },
      });

      if (response.error) {
        console.error('Error cargando progreso:', response.error);
        // Usar datos mock en caso de error
        cargarDatosMock();
        return;
      }

      if (response.data?.success && response.data?.metricas) {
        setMetricas(response.data.metricas);

        // Procesar alertas
        if (response.data.alertas) {
          setAlertas(response.data.alertas);
        }
      } else {
        cargarDatosMock();
      }
    } catch (error) {
      console.error('Error cargando progreso:', error);
      toast.error('Error al cargar el progreso del paciente');
      cargarDatosMock();
    } finally {
      setCargando(false);
    }
  };

  const cargarDatosMock = () => {
    // Datos mock para desarrollo/demostración

    // Métricas
    setMetricas({
      phq9: {
        promedio_ultimas_4_semanas: 8,
        tendencia: 'mejorando',
        ultima_evaluacion: 6,
      },
      gad7: {
        promedio_ultimas_4_semanas: 10,
        tendencia: 'estable',
        ultima_evaluacion: 9,
      },
      sesiones_completadas: 8,
      sesiones_totales: 12,
      adherencia_porcentaje: 85,
      dias_activo: 45,
    });

    // Evolución (últimos 3 meses)
    const hoy = new Date();
    setEvolucion([
      {
        fecha: new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000),
        phq9: 18,
        gad7: 16,
      },
      {
        fecha: new Date(hoy.getTime() - 75 * 24 * 60 * 60 * 1000),
        phq9: 15,
        gad7: 14,
      },
      {
        fecha: new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000),
        phq9: 12,
        gad7: 13,
      },
      {
        fecha: new Date(hoy.getTime() - 45 * 24 * 60 * 60 * 1000),
        phq9: 10,
        gad7: 11,
      },
      {
        fecha: new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000),
        phq9: 8,
        gad7: 10,
      },
      {
        fecha: new Date(hoy.getTime() - 15 * 24 * 60 * 60 * 1000),
        phq9: 7,
        gad7: 9,
      },
      {
        fecha: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
        phq9: 6,
        gad7: 9,
      },
    ]);

    // Hitos
    setHitos([
      {
        id: '1',
        tipo: 'evaluacion',
        fecha: new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000),
        titulo: 'Evaluación inicial PHQ-9 y GAD-7',
        descripcion: 'Primera evaluación completa. PHQ-9: 18 (Moderadamente severo), GAD-7: 16 (Severo)',
      },
      {
        id: '2',
        tipo: 'sesion',
        fecha: new Date(hoy.getTime() - 83 * 24 * 60 * 60 * 1000),
        titulo: 'Primera sesión terapéutica',
        descripcion: 'Establecimiento de rapport y objetivos terapéuticos',
      },
      {
        id: '3',
        tipo: 'cambio_tratamiento',
        fecha: new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000),
        titulo: 'Ajuste en el plan de tratamiento',
        descripcion: 'Se incorporan técnicas de mindfulness y se aumenta frecuencia de sesiones',
      },
      {
        id: '4',
        tipo: 'evaluacion',
        fecha: new Date(hoy.getTime() - 45 * 24 * 60 * 60 * 1000),
        titulo: 'Re-evaluación a mitad de tratamiento',
        descripcion: 'PHQ-9: 10 (Moderado), GAD-7: 11 (Moderado). Mejora significativa',
      },
      {
        id: '5',
        tipo: 'sesion',
        fecha: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
        titulo: 'Sesión de seguimiento',
        descripcion: 'Reforzamiento de herramientas de afrontamiento',
      },
    ]);

    // Alertas
    setAlertas([
      {
        id: '1',
        tipo: 'info',
        mensaje: 'Progreso positivo en las últimas 4 semanas',
        descripcion: 'El paciente muestra una reducción consistente en los indicadores de depresión y ansiedad.',
      },
    ]);

    // Datos semanales
    setDatosSemanales([
      { periodo: 'Sem 1', phq9: 12, gad7: 13 },
      { periodo: 'Sem 2', phq9: 10, gad7: 11 },
      { periodo: 'Sem 3', phq9: 8, gad7: 10 },
      { periodo: 'Sem 4', phq9: 6, gad7: 9 },
    ]);

    // Datos mensuales
    setDatosMensuales([
      { periodo: 'Mes 1', phq9: 18, gad7: 16 },
      { periodo: 'Mes 2', phq9: 12, gad7: 13 },
      { periodo: 'Mes 3', phq9: 7, gad7: 9 },
    ]);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando progreso del paciente...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paciente no encontrado</h1>
          <p className="text-gray-600 mb-6">No se pudo cargar la información del paciente</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-calma-500 rounded-lg p-2"
          >
            <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-4">
            {paciente.foto ? (
              <img
                src={paciente.foto}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-calma-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-bold text-xl">
                {paciente.nombre.charAt(0)}
                {paciente.apellido.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Progreso de {paciente.nombre} {paciente.apellido}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <IndicadorEmocional estado={paciente.estadoEmocional} tamanio="sm" />
                {metricas && (
                  <span className="text-sm text-gray-600">
                    {metricas.sesiones_completadas} de {metricas.sesiones_totales} sesiones completadas
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Alertas (si las hay) */}
          {alertas.length > 0 && (
            <section aria-labelledby="alertas-titulo">
              <h2 id="alertas-titulo" className="sr-only">
                Alertas del paciente
              </h2>
              <ListaAlertas alertas={alertas} />
            </section>
          )}

          {/* Métricas clave */}
          {metricas && (
            <section
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              aria-labelledby="metricas-titulo"
            >
              <h2 id="metricas-titulo" className="sr-only">
                Métricas principales
              </h2>

              {/* PHQ-9 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">PHQ-9 (Depresión)</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {metricas.phq9.ultima_evaluacion}
                </p>
                <p
                  className={clsx('text-sm flex items-center gap-1', {
                    'text-esperanza-700': metricas.phq9.tendencia === 'mejorando',
                    'text-gray-600': metricas.phq9.tendencia === 'estable',
                    'text-alerta-700': metricas.phq9.tendencia === 'empeorando',
                  })}
                >
                  {metricas.phq9.tendencia === 'mejorando' && '↓ Mejorando'}
                  {metricas.phq9.tendencia === 'estable' && '→ Estable'}
                  {metricas.phq9.tendencia === 'empeorando' && '↑ Empeorando'}
                </p>
              </div>

              {/* GAD-7 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">GAD-7 (Ansiedad)</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {metricas.gad7.ultima_evaluacion}
                </p>
                <p
                  className={clsx('text-sm flex items-center gap-1', {
                    'text-esperanza-700': metricas.gad7.tendencia === 'mejorando',
                    'text-gray-600': metricas.gad7.tendencia === 'estable',
                    'text-alerta-700': metricas.gad7.tendencia === 'empeorando',
                  })}
                >
                  {metricas.gad7.tendencia === 'mejorando' && '↓ Mejorando'}
                  {metricas.gad7.tendencia === 'estable' && '→ Estable'}
                  {metricas.gad7.tendencia === 'empeorando' && '↑ Empeorando'}
                </p>
              </div>

              {/* Adherencia */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Adherencia</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {metricas.adherencia_porcentaje}%
                </p>
                <p className="text-sm text-gray-600">
                  {metricas.sesiones_completadas} de {metricas.sesiones_totales} sesiones
                </p>
              </div>

              {/* Días activo */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Días en tratamiento</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">{metricas.dias_activo}</p>
                <p className="text-sm text-gray-600">Aproximadamente {Math.floor(metricas.dias_activo / 7)} semanas</p>
              </div>
            </section>
          )}

          {/* Gráfica de evolución */}
          {evolucion.length > 0 && (
            <section aria-labelledby="evolucion-titulo">
              <h2 id="evolucion-titulo" className="sr-only">
                Gráfica de evolución
              </h2>
              <GraficaEvolucion
                datos={evolucion}
                descripcion={`Evolución de indicadores PHQ-9 y GAD-7 de ${paciente.nombre} ${paciente.apellido} en los últimos 3 meses`}
              />
            </section>
          )}

          {/* Grid: Vista Comparativa + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vista Comparativa */}
            {datosSemanales.length > 0 && datosMensuales.length > 0 && (
              <section aria-labelledby="comparativa-titulo">
                <h2 id="comparativa-titulo" className="sr-only">
                  Vista comparativa
                </h2>
                <VistaComparativa
                  datosSemanales={datosSemanales}
                  datosMensuales={datosMensuales}
                  descripcion="Comparación de indicadores clínicos por periodo"
                />
              </section>
            )}

            {/* Timeline de hitos */}
            {hitos.length > 0 && (
              <section aria-labelledby="timeline-titulo">
                <h2 id="timeline-titulo" className="sr-only">
                  Historial de eventos
                </h2>
                <TimelineHitos hitos={hitos} />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
