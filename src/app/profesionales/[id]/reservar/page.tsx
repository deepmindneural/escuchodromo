'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CalendarioMensual } from '@/lib/componentes/CalendarioMensual';
import { SlotsDisponibles, type SlotHorario } from '@/lib/componentes/SlotsDisponibles';
import { SelectorDuracion } from '@/lib/componentes/SelectorDuracion';
import { SelectorModalidad, type Modalidad } from '@/lib/componentes/SelectorModalidad';
import { ModalConfirmacion } from '@/lib/componentes/ModalConfirmacion';
import { createClient } from '@/lib/supabase/client';
import { formatearParaAPI, formatearFechaHora, formatearFechaCorta } from '@/lib/utils/fechas';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface DatosProfesional {
  id: string;
  nombre: string;
  apellido: string;
  especialidad?: string;
  foto_perfil?: string;
  direccion_consultorio?: string;
  tarifa_30min?: number;
  tarifa_60min?: number;
}

/**
 * Página de Reserva de Cita con Profesional
 *
 * Flujo completo:
 * 1. Seleccionar duración (30 o 60 min)
 * 2. Seleccionar modalidad (virtual o presencial)
 * 3. Seleccionar fecha en calendario
 * 4. Seleccionar hora disponible
 * 5. Escribir motivo de consulta
 * 6. Confirmar reserva
 * 7. Pantalla de éxito
 */
export default function PaginaReservarCita() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const profesionalId = params.id as string;

  // Estado del profesional
  const [profesional, setProfesional] = useState<DatosProfesional | null>(null);
  const [cargandoProfesional, setCargandoProfesional] = useState(true);

  // Estado del formulario de reserva
  const [duracionSeleccionada, setDuracionSeleccionada] = useState<number>(60);
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState<Modalidad>('VIRTUAL');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotHorario | null>(null);
  const [motivoConsulta, setMotivoConsulta] = useState('');

  // Estado de disponibilidad
  const [slots, setSlots] = useState<SlotHorario[]>([]);
  const [fechasConDisponibilidad, setFechasConDisponibilidad] = useState<Date[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  // Estado del modal y reserva
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [datosReserva, setDatosReserva] = useState<any>(null);

  // Cargar datos del profesional
  useEffect(() => {
    cargarDatosProfesional();
  }, [profesionalId]);

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    if (fechaSeleccionada && profesional) {
      cargarSlotsDisponibles();
    }
  }, [fechaSeleccionada, profesional]);

  const cargarDatosProfesional = async () => {
    try {
      setCargandoProfesional(true);

      const { data, error } = await supabase
        .from('Usuario')
        .select('id, nombre, apellido, PerfilUsuario(*)')
        .eq('id', profesionalId)
        .single();

      if (error) throw error;

      if (data) {
        setProfesional({
          id: data.id,
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          especialidad: data.PerfilUsuario?.especialidad,
          foto_perfil: data.PerfilUsuario?.foto_perfil,
          direccion_consultorio: data.PerfilUsuario?.direccion,
          tarifa_30min: 80000,
          tarifa_60min: 150000,
        });
      }
    } catch (error) {
      console.error('Error cargando profesional:', error);
      toast.error('No se pudo cargar la información del profesional');
    } finally {
      setCargandoProfesional(false);
    }
  };

  const cargarSlotsDisponibles = async () => {
    if (!fechaSeleccionada || !profesional) return;

    try {
      setCargandoSlots(true);
      const fechaFormateada = formatearParaAPI(fechaSeleccionada);

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        toast.error('Debes iniciar sesión para reservar una cita');
        router.push('/iniciar-sesion');
        return;
      }

      const response = await supabase.functions.invoke('disponibilidad-profesional', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // @ts-ignore - Supabase types issue
        body: {
          profesional_id: profesional.id,
          fecha: fechaFormateada,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success && response.data?.slots) {
        setSlots(response.data.slots);
      } else {
        setSlots([]);
      }
    } catch (error: any) {
      console.error('Error cargando slots:', error);
      toast.error('No se pudieron cargar los horarios disponibles');
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  };

  const abrirModalConfirmacion = () => {
    if (!validarFormulario()) return;
    setModalAbierto(true);
  };

  const validarFormulario = (): boolean => {
    if (!fechaSeleccionada) {
      toast.error('Selecciona una fecha');
      return false;
    }
    if (!slotSeleccionado) {
      toast.error('Selecciona un horario');
      return false;
    }
    if (!motivoConsulta.trim()) {
      toast.error('Describe el motivo de tu consulta');
      return false;
    }
    if (motivoConsulta.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres');
      return false;
    }
    return true;
  };

  const confirmarReserva = async () => {
    if (!fechaSeleccionada || !slotSeleccionado || !profesional) return;

    try {
      setReservando(true);

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        toast.error('Debes iniciar sesión para reservar');
        router.push('/iniciar-sesion');
        return;
      }

      // Construir fecha-hora ISO
      const fechaFormateada = formatearParaAPI(fechaSeleccionada);
      const fechaHoraISO = `${fechaFormateada}T${slotSeleccionado.hora_inicio}:00`;

      const response = await supabase.functions.invoke('reservar-cita', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          profesional_id: profesional.id,
          fecha_hora: fechaHoraISO,
          duracion: duracionSeleccionada,
          modalidad: modalidadSeleccionada,
          motivo_consulta: motivoConsulta.trim(),
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        setDatosReserva(response.data.cita);
        setModalAbierto(false);
        setReservaExitosa(true);
        toast.success('¡Cita reservada exitosamente!');
      } else {
        throw new Error('No se pudo completar la reserva');
      }
    } catch (error: any) {
      console.error('Error reservando cita:', error);
      toast.error(error.message || 'No se pudo reservar la cita');
    } finally {
      setReservando(false);
    }
  };

  // Calcular precio según duración
  const precioActual =
    duracionSeleccionada === 30
      ? profesional?.tarifa_30min || 80000
      : profesional?.tarifa_60min || 150000;

  // Pantalla de carga
  if (cargandoProfesional) {
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

  // Pantalla de éxito
  if (reservaExitosa && datosReserva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calma-50 to-esperanza-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-esperanza-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-esperanza-600" aria-hidden="true" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Cita reservada exitosamente!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Hemos enviado la confirmación a tu correo electrónico con todos los detalles
          </p>

          {/* Resumen de la cita */}
          <div className="bg-calma-50 rounded-lg p-6 text-left mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Resumen de tu cita</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600">Profesional:</dt>
                <dd className="font-medium text-gray-900">
                  {profesional.nombre} {profesional.apellido}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Fecha y hora:</dt>
                <dd className="font-medium text-gray-900">
                  {fechaSeleccionada && formatearFechaHora(fechaSeleccionada)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Duración:</dt>
                <dd className="font-medium text-gray-900">{duracionSeleccionada} minutos</dd>
              </div>
              <div>
                <dt className="text-gray-600">Modalidad:</dt>
                <dd className="font-medium text-gray-900">
                  {modalidadSeleccionada === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium"
            >
              Ver mis citas
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-white text-calma-600 border-2 border-calma-600 rounded-lg hover:bg-calma-50 font-medium"
            >
              Reservar otra cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de reserva
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
            {profesional.foto_perfil ? (
              <img
                src={profesional.foto_perfil}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-calma-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-bold text-xl">
                {profesional.nombre.charAt(0)}
                {profesional.apellido.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Reservar cita con {profesional.nombre} {profesional.apellido}
              </h1>
              {profesional.especialidad && (
                <p className="text-gray-600">{profesional.especialidad}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal - Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Paso 1: Duración */}
            <section
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              aria-labelledby="titulo-duracion"
            >
              <h2 id="titulo-duracion" className="text-xl font-bold text-gray-900 mb-6">
                1. Duración de la sesión
              </h2>
              <SelectorDuracion
                duracionSeleccionada={duracionSeleccionada}
                onCambiarDuracion={setDuracionSeleccionada}
                opciones={[
                  { valor: 30, precio: profesional.tarifa_30min || 80000, etiqueta: 'Sesión corta' },
                  { valor: 60, precio: profesional.tarifa_60min || 150000, etiqueta: 'Sesión completa' },
                ]}
              />
            </section>

            {/* Paso 2: Modalidad */}
            <section
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              aria-labelledby="titulo-modalidad"
            >
              <h2 id="titulo-modalidad" className="text-xl font-bold text-gray-900 mb-6">
                2. Modalidad de atención
              </h2>
              <SelectorModalidad
                modalidadSeleccionada={modalidadSeleccionada}
                onCambiarModalidad={setModalidadSeleccionada}
                direccionPresencial={profesional.direccion_consultorio}
              />
            </section>

            {/* Paso 3: Fecha */}
            <section
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              aria-labelledby="titulo-fecha"
            >
              <h2 id="titulo-fecha" className="text-xl font-bold text-gray-900 mb-6">
                3. Selecciona la fecha
              </h2>
              <CalendarioMensual
                fechaSeleccionada={fechaSeleccionada}
                onSeleccionarFecha={(fecha) => {
                  setFechaSeleccionada(fecha);
                  setSlotSeleccionado(null); // Reset slot selection
                }}
                fechasConDisponibilidad={fechasConDisponibilidad}
              />
            </section>

            {/* Paso 4: Horario */}
            {fechaSeleccionada && (
              <section
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                aria-labelledby="titulo-horario"
              >
                <h2 id="titulo-horario" className="text-xl font-bold text-gray-900 mb-6">
                  4. Selecciona el horario
                </h2>
                {cargandoSlots ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-calma-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-600">Cargando horarios...</p>
                  </div>
                ) : (
                  <SlotsDisponibles
                    slots={slots}
                    slotSeleccionado={slotSeleccionado}
                    onSeleccionarSlot={setSlotSeleccionado}
                    duracionSesion={duracionSeleccionada}
                  />
                )}
              </section>
            )}

            {/* Paso 5: Motivo */}
            {fechaSeleccionada && slotSeleccionado && (
              <section
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                aria-labelledby="titulo-motivo"
              >
                <h2 id="titulo-motivo" className="text-xl font-bold text-gray-900 mb-6">
                  5. Motivo de la consulta
                </h2>
                <div>
                  <label htmlFor="motivo-consulta" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe brevemente el motivo de tu consulta
                  </label>
                  <textarea
                    id="motivo-consulta"
                    rows={4}
                    value={motivoConsulta}
                    onChange={(e) => setMotivoConsulta(e.target.value)}
                    className={clsx(
                      'w-full px-4 py-3 border-2 rounded-lg resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-calma-500',
                      'text-gray-900 placeholder-gray-400',
                      motivoConsulta.trim().length >= 10
                        ? 'border-esperanza-300 bg-esperanza-50'
                        : 'border-gray-300 bg-white'
                    )}
                    placeholder="Ej: Me gustaría trabajar en mejorar mi ansiedad y manejo del estrés laboral..."
                    aria-describedby="motivo-ayuda"
                  />
                  <p id="motivo-ayuda" className="text-sm text-gray-600 mt-2">
                    Mínimo 10 caracteres. Esta información ayudará al profesional a prepararse para tu sesión.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Columna lateral - Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de reserva</h3>

              <dl className="space-y-3 text-sm mb-6">
                <div>
                  <dt className="text-gray-600">Duración:</dt>
                  <dd className="font-medium text-gray-900">{duracionSeleccionada} minutos</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Modalidad:</dt>
                  <dd className="font-medium text-gray-900">
                    {modalidadSeleccionada === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                  </dd>
                </div>
                {fechaSeleccionada && (
                  <div>
                    <dt className="text-gray-600">Fecha:</dt>
                    <dd className="font-medium text-gray-900">{formatearFechaCorta(fechaSeleccionada)}</dd>
                  </div>
                )}
                {slotSeleccionado && (
                  <div>
                    <dt className="text-gray-600">Hora:</dt>
                    <dd className="font-medium text-gray-900">{slotSeleccionado.hora_inicio}</dd>
                  </div>
                )}
              </dl>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-2xl font-bold text-calma-700">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                    }).format(precioActual)}
                  </span>
                </div>
              </div>

              <button
                onClick={abrirModalConfirmacion}
                disabled={!fechaSeleccionada || !slotSeleccionado || !motivoConsulta.trim() || motivoConsulta.trim().length < 10}
                className={clsx(
                  'w-full px-6 py-3 rounded-lg font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                  {
                    'bg-calma-600 text-white hover:bg-calma-700 cursor-pointer':
                      fechaSeleccionada && slotSeleccionado && motivoConsulta.trim().length >= 10,
                    'bg-gray-200 text-gray-500 cursor-not-allowed':
                      !fechaSeleccionada || !slotSeleccionado || motivoConsulta.trim().length < 10,
                  }
                )}
              >
                Continuar con la reserva
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {fechaSeleccionada && slotSeleccionado && (
        <ModalConfirmacion
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          onConfirmar={confirmarReserva}
          cargando={reservando}
          datos={{
            profesional: {
              nombre: profesional.nombre,
              apellido: profesional.apellido,
              especialidad: profesional.especialidad,
              foto: profesional.foto_perfil,
            },
            fecha: formatearFechaHora(fechaSeleccionada),
            hora: slotSeleccionado.hora_inicio,
            duracion: duracionSeleccionada,
            modalidad: modalidadSeleccionada,
            precio: precioActual,
            direccion: modalidadSeleccionada === 'PRESENCIAL' ? profesional.direccion_consultorio : undefined,
          }}
        />
      )}
    </div>
  );
}
