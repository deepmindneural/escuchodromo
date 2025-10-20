'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClockIcon,
  PlusIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { SelectorHorarios } from '@/lib/componentes/SelectorHorarios';
import { BloqueHorario, type Horario } from '@/lib/componentes/BloqueHorario';

interface HorarioCompleto extends Horario {
  dia_semana: number;
  duracion_sesion: number;
}

interface HorariosPorDia {
  [diaSemana: number]: HorarioCompleto[];
}

const DIAS_SEMANA = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 0, nombre: 'Domingo' },
];

/**
 * Página: Configuración de Disponibilidad
 *
 * Permite a los profesionales configurar su disponibilidad horaria
 * para que los pacientes puedan reservar citas.
 */
export default function DisponibilidadProfesional() {
  const router = useRouter();
  const supabase = createClient();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [perfilProfesionalId, setPerfilProfesionalId] = useState<string | null>(null);

  // Estado de horarios por día
  const [horariosPorDia, setHorariosPorDia] = useState<HorariosPorDia>({});

  // Estado para acordeón (qué días están expandidos)
  const [diasExpandidos, setDiasExpandidos] = useState<Set<number>>(
    new Set([1, 2, 3, 4, 5]) // Lunes a Viernes expandidos por defecto
  );

  // Estado para agregar nuevo horario
  const [agregarHorarioEnDia, setAgregarHorarioEnDia] = useState<number | null>(null);
  const [nuevoHorarioInicio, setNuevoHorarioInicio] = useState('');
  const [nuevoHorarioFin, setNuevoHorarioFin] = useState('');
  const [errorNuevoHorario, setErrorNuevoHorario] = useState('');

  // Estado para editar horario
  const [editandoHorarioId, setEditandoHorarioId] = useState<string | null>(null);
  const [editarHorarioInicio, setEditarHorarioInicio] = useState('');
  const [editarHorarioFin, setEditarHorarioFin] = useState('');
  const [errorEditarHorario, setErrorEditarHorario] = useState('');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
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

      // Verificar que es profesional
      const { data: usuario, error: errorUsuario } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('id', session.user.id)
        .single();

      if (errorUsuario || !usuario || (usuario.rol !== 'TERAPEUTA' && usuario.rol !== 'ADMIN')) {
        toast.error('No tienes permisos para acceder a esta página');
        router.push('/dashboard');
        return;
      }

      setProfesionalId(usuario.id);

      // Obtener perfil profesional
      const { data: perfil, error: errorPerfil } = await supabase
        .from('PerfilProfesional')
        .select('id')
        .eq('usuario_id', usuario.id)
        .single();

      if (errorPerfil || !perfil) {
        toast.error('No se encontró tu perfil profesional');
        return;
      }

      setPerfilProfesionalId(perfil.id);

      // Cargar horarios existentes
      await cargarHorarios(perfil.id);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setCargando(false);
    }
  };

  const cargarHorarios = async (perfilId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('obtener-disponibilidad', {
        method: 'GET',
      });

      if (error) {
        console.error('Error cargando horarios:', error);
        return;
      }

      if (data?.success && data?.horarios) {
        // Agrupar horarios por día
        const horariosAgrupados: HorariosPorDia = {};

        data.horarios.forEach((horario: any) => {
          if (!horariosAgrupados[horario.dia_semana]) {
            horariosAgrupados[horario.dia_semana] = [];
          }

          horariosAgrupados[horario.dia_semana].push({
            id: horario.id,
            dia_semana: horario.dia_semana,
            hora_inicio: horario.hora_inicio,
            hora_fin: horario.hora_fin,
            duracion_sesion: horario.duracion_sesion || 60,
            activo: horario.activo,
          });
        });

        setHorariosPorDia(horariosAgrupados);
      }
    } catch (error) {
      console.error('Error en cargarHorarios:', error);
    }
  };

  const toggleDiaExpandido = (diaSemana: number) => {
    const nuevoSet = new Set(diasExpandidos);
    if (nuevoSet.has(diaSemana)) {
      nuevoSet.delete(diaSemana);
    } else {
      nuevoSet.add(diaSemana);
    }
    setDiasExpandidos(nuevoSet);
  };

  const iniciarAgregarHorario = (diaSemana: number) => {
    setAgregarHorarioEnDia(diaSemana);
    setNuevoHorarioInicio('');
    setNuevoHorarioFin('');
    setErrorNuevoHorario('');
  };

  const cancelarAgregarHorario = () => {
    setAgregarHorarioEnDia(null);
    setNuevoHorarioInicio('');
    setNuevoHorarioFin('');
    setErrorNuevoHorario('');
  };

  const validarSolapamiento = (
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    excluirId?: string
  ): string | null => {
    const horariosDelDia = horariosPorDia[diaSemana] || [];

    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    const inicioMinutos = horaInicioH * 60 + horaInicioM;
    const finMinutos = horaFinH * 60 + horaFinM;

    // Validar que hora_fin > hora_inicio
    if (finMinutos <= inicioMinutos) {
      return 'La hora de fin debe ser posterior a la hora de inicio';
    }

    // Validar duración mínima de 30 minutos
    if (finMinutos - inicioMinutos < 30) {
      return 'El bloque debe tener una duración mínima de 30 minutos';
    }

    // Verificar solapamiento con otros horarios
    for (const horario of horariosDelDia) {
      if (excluirId && horario.id === excluirId) continue;

      const [existenteInicioH, existenteInicioM] = horario.hora_inicio.split(':').map(Number);
      const [existenteFinH, existenteFinM] = horario.hora_fin.split(':').map(Number);
      const existenteInicio = existenteInicioH * 60 + existenteInicioM;
      const existenteFin = existenteFinH * 60 + existenteFinM;

      // Verificar solapamiento
      if (
        (inicioMinutos >= existenteInicio && inicioMinutos < existenteFin) ||
        (finMinutos > existenteInicio && finMinutos <= existenteFin) ||
        (inicioMinutos <= existenteInicio && finMinutos >= existenteFin)
      ) {
        return `Este horario se solapa con ${horario.hora_inicio} - ${horario.hora_fin}`;
      }
    }

    return null;
  };

  const agregarHorario = () => {
    if (!agregarHorarioEnDia || !nuevoHorarioInicio || !nuevoHorarioFin) {
      setErrorNuevoHorario('Debes seleccionar ambas horas');
      return;
    }

    const error = validarSolapamiento(agregarHorarioEnDia, nuevoHorarioInicio, nuevoHorarioFin);
    if (error) {
      setErrorNuevoHorario(error);
      return;
    }

    // Agregar horario localmente
    const nuevoHorario: HorarioCompleto = {
      id: `temp-${Date.now()}`, // ID temporal hasta guardar
      dia_semana: agregarHorarioEnDia,
      hora_inicio: nuevoHorarioInicio,
      hora_fin: nuevoHorarioFin,
      duracion_sesion: 60,
      activo: true,
    };

    setHorariosPorDia((prev) => ({
      ...prev,
      [agregarHorarioEnDia]: [...(prev[agregarHorarioEnDia] || []), nuevoHorario],
    }));

    toast.success('Horario agregado. Recuerda guardar los cambios.');
    cancelarAgregarHorario();
  };

  const iniciarEditarHorario = (horario: HorarioCompleto) => {
    setEditandoHorarioId(horario.id);
    setEditarHorarioInicio(horario.hora_inicio);
    setEditarHorarioFin(horario.hora_fin);
    setErrorEditarHorario('');
  };

  const cancelarEditarHorario = () => {
    setEditandoHorarioId(null);
    setEditarHorarioInicio('');
    setEditarHorarioFin('');
    setErrorEditarHorario('');
  };

  const guardarEdicionHorario = (diaSemana: number) => {
    if (!editandoHorarioId || !editarHorarioInicio || !editarHorarioFin) {
      setErrorEditarHorario('Debes seleccionar ambas horas');
      return;
    }

    const error = validarSolapamiento(
      diaSemana,
      editarHorarioInicio,
      editarHorarioFin,
      editandoHorarioId
    );
    if (error) {
      setErrorEditarHorario(error);
      return;
    }

    // Actualizar horario localmente
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaSemana]: prev[diaSemana].map((h) =>
        h.id === editandoHorarioId
          ? { ...h, hora_inicio: editarHorarioInicio, hora_fin: editarHorarioFin }
          : h
      ),
    }));

    toast.success('Horario actualizado. Recuerda guardar los cambios.');
    cancelarEditarHorario();
  };

  const eliminarHorario = (diaSemana: number, horarioId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) {
      return;
    }

    setHorariosPorDia((prev) => ({
      ...prev,
      [diaSemana]: prev[diaSemana].filter((h) => h.id !== horarioId),
    }));

    toast.success('Horario eliminado. Recuerda guardar los cambios.');
  };

  const toggleActivoHorario = (diaSemana: number, horarioId: string) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaSemana]: prev[diaSemana].map((h) =>
        h.id === horarioId ? { ...h, activo: !h.activo } : h
      ),
    }));
  };

  const aplicarPlantilla = (plantilla: 'laboral' | 'tarde' | 'completo') => {
    if (
      !confirm(
        'Esto reemplazará todos tus horarios actuales. ¿Deseas continuar?'
      )
    ) {
      return;
    }

    const nuevosHorarios: HorariosPorDia = {};

    const plantillas = {
      laboral: { dias: [1, 2, 3, 4, 5], inicio: '09:00', fin: '17:00' },
      tarde: { dias: [1, 2, 3, 4, 5], inicio: '14:00', fin: '20:00' },
      completo: { dias: [1, 2, 3, 4, 5, 6], inicio: '08:00', fin: '20:00' },
    };

    const config = plantillas[plantilla];

    config.dias.forEach((dia) => {
      nuevosHorarios[dia] = [
        {
          id: `temp-${dia}-${Date.now()}`,
          dia_semana: dia,
          hora_inicio: config.inicio,
          hora_fin: config.fin,
          duracion_sesion: 60,
          activo: true,
        },
      ];
    });

    setHorariosPorDia(nuevosHorarios);
    toast.success('Plantilla aplicada. Recuerda guardar los cambios.');
  };

  const guardarCambios = async () => {
    if (!perfilProfesionalId) {
      toast.error('No se pudo identificar tu perfil profesional');
      return;
    }

    try {
      setGuardando(true);

      // Preparar array de horarios para enviar
      const horariosParaGuardar = Object.values(horariosPorDia)
        .flat()
        .map((h) => ({
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          duracion_sesion: h.duracion_sesion,
          activo: h.activo,
        }));

      const { data, error } = await supabase.functions.invoke('configurar-disponibilidad', {
        method: 'POST',
        body: { horarios: horariosParaGuardar },
      });

      if (error) {
        console.error('Error guardando:', error);
        toast.error('Error al guardar la disponibilidad');
        return;
      }

      if (data?.success) {
        toast.success(data.mensaje || 'Disponibilidad actualizada correctamente');
        // Recargar horarios desde el servidor
        await cargarHorarios(perfilProfesionalId);
      } else {
        toast.error(data?.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error en guardarCambios:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const calcularEstadisticas = () => {
    let totalBloques = 0;
    let totalMinutos = 0;

    Object.values(horariosPorDia)
      .flat()
      .filter((h) => h.activo)
      .forEach((h) => {
        const [horaInicioH, horaInicioM] = h.hora_inicio.split(':').map(Number);
        const [horaFinH, horaFinM] = h.hora_fin.split(':').map(Number);
        const minutos = (horaFinH * 60 + horaFinM) - (horaInicioH * 60 + horaInicioM);
        totalMinutos += minutos;
        totalBloques++;
      });

    const sesiones30min = Math.floor(totalMinutos / 30);
    const sesiones60min = Math.floor(totalMinutos / 60);

    return { totalBloques, sesiones30min, sesiones60min };
  };

  const { totalBloques, sesiones30min, sesiones60min } = calcularEstadisticas();

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <ClockIcon className="h-8 w-8 text-calma-600" aria-hidden="true" />
                Mi Disponibilidad
              </h1>
              <p className="text-gray-600 mt-1">
                Configura los días y horarios en que estarás disponible para atender pacientes
              </p>
            </div>

            {/* Botón guardar (desktop) */}
            <button
              onClick={guardarCambios}
              disabled={guardando}
              className="hidden sm:flex items-center gap-2 px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
            >
              {guardando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Estadísticas y plantillas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estadísticas */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-calma-600" aria-hidden="true" />
                Resumen de disponibilidad
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Bloques configurados:</dt>
                  <dd className="font-semibold text-gray-900">{totalBloques}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Sesiones de 30 min/semana:</dt>
                  <dd className="font-semibold text-gray-900">{sesiones30min}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Sesiones de 60 min/semana:</dt>
                  <dd className="font-semibold text-gray-900">{sesiones60min}</dd>
                </div>
              </dl>
            </div>

            {/* Plantillas rápidas */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-calma-600" aria-hidden="true" />
                Plantillas rápidas
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => aplicarPlantilla('laboral')}
                  className="w-full text-left px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500"
                >
                  <strong>Lun-Vie 9:00-17:00</strong>
                  <span className="block text-xs text-gray-600">Horario laboral estándar</span>
                </button>
                <button
                  onClick={() => aplicarPlantilla('tarde')}
                  className="w-full text-left px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500"
                >
                  <strong>Lun-Vie 14:00-20:00</strong>
                  <span className="block text-xs text-gray-600">Horario de tarde</span>
                </button>
                <button
                  onClick={() => aplicarPlantilla('completo')}
                  className="w-full text-left px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500"
                >
                  <strong>Lun-Sáb 8:00-20:00</strong>
                  <span className="block text-xs text-gray-600">Horario completo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vista semanal */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Configuración semanal</h2>

            {DIAS_SEMANA.map((dia) => {
              const horariosDelDia = horariosPorDia[dia.numero] || [];
              const expandido = diasExpandidos.has(dia.numero);
              const agregandoEnEsteDia = agregarHorarioEnDia === dia.numero;

              return (
                <div key={dia.numero} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header del día */}
                  <button
                    onClick={() => toggleDiaExpandido(dia.numero)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-calma-500"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">{dia.nombre}</span>
                      {horariosDelDia.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-calma-100 text-calma-800">
                          {horariosDelDia.length} {horariosDelDia.length === 1 ? 'horario' : 'horarios'}
                        </span>
                      )}
                    </div>
                    {expandido ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>

                  {/* Contenido del día */}
                  {expandido && (
                    <div className="px-6 pb-6 space-y-4">
                      {/* Horarios existentes */}
                      {horariosDelDia.length > 0 ? (
                        <div className="space-y-3">
                          {horariosDelDia.map((horario) => {
                            const editandoEste = editandoHorarioId === horario.id;

                            return (
                              <div key={horario.id}>
                                {editandoEste ? (
                                  <div className="border-2 border-calma-500 rounded-lg p-4 bg-calma-50">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                                      Editar horario
                                    </h4>
                                    <SelectorHorarios
                                      horaInicio={editarHorarioInicio}
                                      horaFin={editarHorarioFin}
                                      onHoraInicioChange={setEditarHorarioInicio}
                                      onHoraFinChange={setEditarHorarioFin}
                                      error={errorEditarHorario}
                                    />
                                    <div className="flex gap-2 mt-4">
                                      <button
                                        onClick={() => guardarEdicionHorario(dia.numero)}
                                        className="flex-1 px-4 py-2 bg-calma-600 text-white rounded-lg hover:bg-calma-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-calma-500"
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        onClick={cancelarEditarHorario}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <BloqueHorario
                                    horario={horario}
                                    onEditar={() => iniciarEditarHorario(horario)}
                                    onEliminar={() => eliminarHorario(dia.numero, horario.id)}
                                    onToggleActivo={() => toggleActivoHorario(dia.numero, horario.id)}
                                    editando={false}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic py-4">
                          Sin horarios configurados
                        </p>
                      )}

                      {/* Agregar nuevo horario */}
                      {agregandoEnEsteDia ? (
                        <div className="border-2 border-dashed border-calma-300 rounded-lg p-4 bg-calma-50">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Agregar nuevo horario
                          </h4>
                          <SelectorHorarios
                            horaInicio={nuevoHorarioInicio}
                            horaFin={nuevoHorarioFin}
                            onHoraInicioChange={setNuevoHorarioInicio}
                            onHoraFinChange={setNuevoHorarioFin}
                            error={errorNuevoHorario}
                          />
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={agregarHorario}
                              className="flex-1 px-4 py-2 bg-calma-600 text-white rounded-lg hover:bg-calma-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-calma-500"
                            >
                              Agregar
                            </button>
                            <button
                              onClick={cancelarAgregarHorario}
                              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => iniciarAgregarHorario(dia.numero)}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-calma-500 hover:bg-calma-50 transition-colors text-gray-600 hover:text-calma-600 font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-calma-500"
                        >
                          <PlusIcon className="h-5 w-5" aria-hidden="true" />
                          Agregar horario
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botón guardar (sticky en móvil) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={guardarCambios}
          disabled={guardando}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-calma-500"
        >
          {guardando ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}
