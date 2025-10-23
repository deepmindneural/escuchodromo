'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaCalendar, FaClock, FaVideo, FaMapMarkerAlt, FaUserMd,
  FaCheckCircle, FaClock as FaPending, FaTimesCircle, FaBan,
  FaArrowLeft, FaExternalLinkAlt
} from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { useUsuario } from '../../lib/supabase/hooks';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  avatar_url?: string;
}

interface PerfilProfesional {
  especialidades?: string[];
  tarifa_por_sesion?: number;
}

interface Cita {
  id: string;
  fecha_hora: string;
  duracion: number;
  estado: string;
  modalidad: string;
  motivo_consulta?: string;
  link_videollamada?: string;
  creado_en: string;
  profesional: Profesional;
  perfil_profesional?: PerfilProfesional;
}

interface Estadisticas {
  proximas: number;
  pasadas: number;
  canceladas: number;
  total: number;
}

type FiltroEstado = 'todas' | 'proximas' | 'pasadas' | 'canceladas';

export default function MisCitasPage() {
  const router = useRouter();
  const { usuario, cargando: cargandoAuth } = useUsuario();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    proximas: 0,
    pasadas: 0,
    canceladas: 0,
    total: 0
  });
  const [filtro, setFiltro] = useState<FiltroEstado>('todas');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuario) {
      cargarCitas(filtro);
    }
  }, [usuario, filtro]);

  const cargarCitas = async (estado: FiltroEstado) => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/listar-citas-usuario?estado=${estado}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setCitas(data.citas || []);
        setEstadisticas(data.estadisticas || {
          proximas: 0,
          pasadas: 0,
          canceladas: 0,
          total: 0
        });
      } else {
        console.error('Error al cargar citas:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const obtenerEstadoBadge = (estado: string) => {
    const badges: Record<string, { color: string; icon: JSX.Element; texto: string }> = {
      pendiente: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <FaPending className="mr-1" />,
        texto: 'Pendiente'
      },
      confirmada: {
        color: 'bg-green-100 text-green-800',
        icon: <FaCheckCircle className="mr-1" />,
        texto: 'Confirmada'
      },
      completada: {
        color: 'bg-blue-100 text-blue-800',
        icon: <FaCheckCircle className="mr-1" />,
        texto: 'Completada'
      },
      cancelada: {
        color: 'bg-red-100 text-red-800',
        icon: <FaBan className="mr-1" />,
        texto: 'Cancelada'
      },
      no_asistio: {
        color: 'bg-gray-100 text-gray-800',
        icon: <FaTimesCircle className="mr-1" />,
        texto: 'No asistió'
      }
    };

    const badge = badges[estado] || badges.pendiente;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.icon}
        {badge.texto}
      </span>
    );
  };

  const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const esCitaProxima = (cita: Cita) => {
    const fecha = new Date(cita.fecha_hora);
    const ahora = new Date();
    const unDiaAntes = new Date(fecha.getTime() - 24 * 60 * 60 * 1000);

    return fecha > ahora && ahora >= unDiaAntes && ['confirmada', 'pendiente'].includes(cita.estado);
  };

  if (cargandoAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-4">
            <FaArrowLeft className="mr-2" />
            Volver al Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas</h1>
          <p className="text-gray-600">Gestiona tus citas con profesionales</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-3xl font-bold mb-1">{estadisticas.total}</div>
            <div className="text-blue-100 text-sm">Total de Citas</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-3xl font-bold mb-1">{estadisticas.proximas}</div>
            <div className="text-green-100 text-sm">Próximas</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-3xl font-bold mb-1">{estadisticas.pasadas}</div>
            <div className="text-purple-100 text-sm">Completadas</div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-3xl font-bold mb-1">{estadisticas.canceladas}</div>
            <div className="text-red-100 text-sm">Canceladas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {(['todas', 'proximas', 'pasadas', 'canceladas'] as FiltroEstado[]).map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltro(estado)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  filtro === estado
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Citas */}
        {cargando ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando citas...</p>
          </div>
        ) : citas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaCalendar className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes citas {filtro !== 'todas' ? filtro : ''}
            </h3>
            <p className="text-gray-600 mb-6">
              Encuentra un profesional y agenda tu primera cita
            </p>
            <Link href="/profesionales">
              <button className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                Buscar Profesionales
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {citas.map((cita) => (
              <motion.div
                key={cita.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex items-start space-x-4 mb-4 md:mb-0">
                      {/* Avatar del profesional */}
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {cita.profesional?.avatar_url ? (
                          <img
                            src={cita.profesional.avatar_url}
                            alt={`${cita.profesional.nombre} ${cita.profesional.apellido}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {cita.profesional.nombre?.charAt(0)}{cita.profesional.apellido?.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {cita.profesional.nombre} {cita.profesional.apellido}
                        </h3>
                        {cita.perfil_profesional?.especialidades && cita.perfil_profesional.especialidades.length > 0 && (
                          <p className="text-sm text-gray-600 mb-2">
                            {cita.perfil_profesional.especialidades.join(', ')}
                          </p>
                        )}
                        {obtenerEstadoBadge(cita.estado)}
                      </div>
                    </div>

                    {/* Alerta para citas próximas */}
                    {esCitaProxima(cita) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
                        <strong>¡Próxima cita!</strong> En menos de 24 horas
                      </div>
                    )}
                  </div>

                  {/* Detalles de la cita */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-gray-700">
                      <FaCalendar className="text-teal-600 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Fecha</div>
                        <div className="font-medium">{formatearFecha(cita.fecha_hora)}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <FaClock className="text-teal-600 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Hora</div>
                        <div className="font-medium">{formatearHora(cita.fecha_hora)}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <FaClock className="text-teal-600 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Duración</div>
                        <div className="font-medium">{cita.duracion} minutos</div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-700">
                      {cita.modalidad === 'virtual' ? (
                        <FaVideo className="text-teal-600 mr-2" />
                      ) : (
                        <FaMapMarkerAlt className="text-teal-600 mr-2" />
                      )}
                      <div>
                        <div className="text-xs text-gray-500">Modalidad</div>
                        <div className="font-medium capitalize">{cita.modalidad}</div>
                      </div>
                    </div>
                  </div>

                  {/* Motivo de consulta */}
                  {cita.motivo_consulta && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-xs text-gray-500 mb-1">Motivo de consulta</div>
                      <p className="text-gray-700">{cita.motivo_consulta}</p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    {/* Botón para unirse a videollamada */}
                    {cita.modalidad === 'virtual' &&
                     cita.link_videollamada &&
                     esCitaProxima(cita) && (
                      <a
                        href={cita.link_videollamada}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FaVideo className="mr-2" />
                        Unirse a la videollamada
                        <FaExternalLinkAlt className="ml-2 text-sm" />
                      </a>
                    )}

                    {/* Ver detalles del profesional */}
                    <Link href={`/profesionales/${cita.profesional.id}`}>
                      <button className="inline-flex items-center px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                        <FaUserMd className="mr-2" />
                        Ver perfil profesional
                      </button>
                    </Link>

                    {/* Botón para cancelar (solo si está pendiente o confirmada) */}
                    {['pendiente', 'confirmada'].includes(cita.estado) && (
                      <button
                        onClick={() => {
                          // TODO: Implementar cancelación
                          alert('Funcionalidad de cancelación próximamente');
                        }}
                        className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <FaTimesCircle className="mr-2" />
                        Cancelar cita
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA para buscar profesionales */}
        {!cargando && citas.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">¿Necesitas agendar otra cita?</h3>
            <p className="mb-6 text-white/90">Encuentra el profesional ideal para ti</p>
            <Link href="/profesionales">
              <button className="px-8 py-3 bg-white text-teal-600 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                Buscar Profesionales
              </button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
