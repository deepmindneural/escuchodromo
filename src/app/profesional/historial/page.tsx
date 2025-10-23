'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Download,
  Eye,
  DollarSign,
  MessageSquare,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/lib/componentes/ui/button';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import toast, { Toaster } from 'react-hot-toast';

interface RegistroHistorial {
  id: string;
  tipo: 'cita' | 'evaluacion' | 'pago' | 'mensaje' | 'alerta';
  fecha: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
  };
  titulo: string;
  descripcion: string;
  estado?: string;
  monto?: number;
  puntuacion?: number;
  severidad?: string;
  urgencia?: 'bajo' | 'medio' | 'alto' | 'critico';
}

interface EstadisticasGenerales {
  totalCitas: number;
  citasCompletadas: number;
  citasPendientes: number;
  totalEvaluaciones: number;
  totalPagos: number;
  ingresoTotal: number;
  pacientesActivos: number;
  alertasCriticas: number;
}

/**
 * Página: Historial Completo del Profesional
 *
 * Muestra todo el historial de actividades del profesional:
 * - Citas realizadas
 * - Evaluaciones de pacientes
 * - Pagos recibidos
 * - Mensajes importantes
 * - Alertas críticas
 */
export default function PaginaHistorialProfesional() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const [cargando, setCargando] = useState(true);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroHistorial[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'cita' | 'evaluacion' | 'pago' | 'alerta'>('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  useEffect(() => {
    if (profesionalId) {
      cargarHistorial();
      cargarEstadisticas();
    }
  }, [profesionalId]);

  useEffect(() => {
    aplicarFiltros();
  }, [registros, busqueda, tipoFiltro, fechaInicio, fechaFin]);

  const verificarAutenticacion = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      const { data: usuarioData, error } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('auth_id', session.user.id)
        .single();

      if (error || !usuarioData || (usuarioData.rol !== 'TERAPEUTA' && usuarioData.rol !== 'ADMIN')) {
        router.push('/dashboard');
        return;
      }

      setProfesionalId(usuarioData.id);
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarHistorial = async () => {
    if (!profesionalId) return;

    setCargando(true);

    try {
      const registrosHistorial: RegistroHistorial[] = [];

      // 1. Cargar Citas
      const { data: citas, error: citasError } = await supabase
        .from('Cita')
        .select(`
          id,
          fecha_hora,
          estado,
          duracion,
          modalidad,
          paciente:paciente_id (
            id,
            nombre,
            apellido
          )
        `)
        .eq('profesional_id', profesionalId)
        .order('fecha_hora', { ascending: false })
        .limit(50);

      if (!citasError && citas) {
        citas.forEach((cita: any) => {
          registrosHistorial.push({
            id: cita.id,
            tipo: 'cita',
            fecha: cita.fecha_hora,
            paciente: Array.isArray(cita.paciente) ? cita.paciente[0] : cita.paciente,
            titulo: `Cita ${cita.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}`,
            descripcion: `${cita.duracion} minutos - ${cita.estado}`,
            estado: cita.estado,
          });
        });
      }

      // 2. Cargar Evaluaciones de pacientes
      const { data: pacientes } = await supabase
        .from('Cita')
        .select('paciente_id')
        .eq('profesional_id', profesionalId);

      if (pacientes) {
        const pacienteIds = [...new Set(pacientes.map((c: any) => c.paciente_id))];

        const { data: evaluaciones, error: evalError } = await supabase
          .from('Evaluacion')
          .select(`
            id,
            creado_en,
            puntuacion,
            severidad,
            usuario_id,
            test:test_id (
              codigo,
              nombre
            )
          `)
          .in('usuario_id', pacienteIds)
          .order('creado_en', { ascending: false })
          .limit(30);

        if (!evalError && evaluaciones) {
          for (const evaluacion of evaluaciones) {
            const { data: paciente } = await supabase
              .from('Usuario')
              .select('id, nombre, apellido')
              .eq('id', evaluacion.usuario_id)
              .single();

            if (paciente) {
              const test = Array.isArray(evaluacion.test) ? evaluacion.test[0] : evaluacion.test;
              registrosHistorial.push({
                id: evaluacion.id,
                tipo: 'evaluacion',
                fecha: evaluacion.creado_en,
                paciente,
                titulo: `Evaluación ${test?.codigo || 'N/A'}`,
                descripcion: `${test?.nombre || 'Evaluación'} - ${evaluacion.severidad}`,
                puntuacion: evaluacion.puntuacion,
                severidad: evaluacion.severidad,
              });
            }
          }
        }
      }

      // 3. Cargar Pagos de Citas
      const { data: pagos, error: pagosError } = await supabase
        .from('PagoCita')
        .select(`
          id,
          creado_en,
          monto,
          moneda,
          estado,
          usuario:usuario_id (
            id,
            nombre,
            apellido
          )
        `)
        .eq('estado', 'completado')
        .order('creado_en', { ascending: false })
        .limit(30);

      if (!pagosError && pagos) {
        pagos.forEach((pago: any) => {
          const usuario = Array.isArray(pago.usuario) ? pago.usuario[0] : pago.usuario;
          registrosHistorial.push({
            id: pago.id,
            tipo: 'pago',
            fecha: pago.creado_en,
            paciente: usuario,
            titulo: 'Pago de Cita',
            descripcion: `${pago.monto} ${pago.moneda} - ${pago.estado}`,
            monto: pago.monto,
            estado: pago.estado,
          });
        });
      }

      // 4. Cargar Alertas Críticas
      const { data: alertas, error: alertasError } = await supabase
        .from('AlertaUrgente')
        .select(`
          id,
          creado_en,
          tipo_alerta,
          nivel_urgencia,
          titulo,
          descripcion,
          estado,
          usuario:usuario_id (
            id,
            nombre,
            apellido
          )
        `)
        .order('creado_en', { ascending: false })
        .limit(20);

      if (!alertasError && alertas) {
        alertas.forEach((alerta: any) => {
          const usuario = alerta.usuario ? (Array.isArray(alerta.usuario) ? alerta.usuario[0] : alerta.usuario) : null;
          if (usuario) {
            registrosHistorial.push({
              id: alerta.id,
              tipo: 'alerta',
              fecha: alerta.creado_en,
              paciente: usuario,
              titulo: alerta.titulo || 'Alerta Crítica',
              descripcion: alerta.descripcion || alerta.tipo_alerta,
              estado: alerta.estado,
              urgencia: alerta.nivel_urgencia,
            });
          }
        });
      }

      // Ordenar todos los registros por fecha descendente
      registrosHistorial.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setRegistros(registrosHistorial);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    if (!profesionalId) return;

    try {
      // Estadísticas de Citas
      const { data: citas } = await supabase
        .from('Cita')
        .select('id, estado')
        .eq('profesional_id', profesionalId);

      const totalCitas = citas?.length || 0;
      const citasCompletadas = citas?.filter((c: any) => c.estado === 'completada').length || 0;
      const citasPendientes = citas?.filter((c: any) => c.estado === 'pendiente' || c.estado === 'confirmada').length || 0;

      // Pacientes únicos
      const pacientesUnicos = citas ? [...new Set(citas.map((c: any) => c.paciente_id))] : [];
      const pacientesActivos = pacientesUnicos.length;

      // Evaluaciones
      const { data: evaluaciones } = await supabase
        .from('Evaluacion')
        .select('id')
        .in('usuario_id', pacientesUnicos);

      const totalEvaluaciones = evaluaciones?.length || 0;

      // Pagos
      const { data: pagos } = await supabase
        .from('PagoCita')
        .select('monto, estado');

      const totalPagos = pagos?.length || 0;
      const ingresoTotal = pagos
        ?.filter((p: any) => p.estado === 'completado')
        .reduce((sum: number, p: any) => sum + (p.monto || 0), 0) || 0;

      // Alertas críticas sin atender
      const { data: alertas } = await supabase
        .from('AlertaUrgente')
        .select('id')
        .eq('estado', 'pendiente');

      const alertasCriticas = alertas?.length || 0;

      setEstadisticas({
        totalCitas,
        citasCompletadas,
        citasPendientes,
        totalEvaluaciones,
        totalPagos,
        ingresoTotal,
        pacientesActivos,
        alertasCriticas,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...registros];

    // Filtro por tipo
    if (tipoFiltro !== 'todos') {
      filtrados = filtrados.filter((r) => r.tipo === tipoFiltro);
    }

    // Filtro por búsqueda (nombre paciente o título)
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (r) =>
          r.paciente?.nombre?.toLowerCase().includes(busquedaLower) ||
          r.paciente?.apellido?.toLowerCase().includes(busquedaLower) ||
          r.titulo.toLowerCase().includes(busquedaLower) ||
          r.descripcion.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      filtrados = filtrados.filter((r) => new Date(r.fecha) >= new Date(fechaInicio));
    }
    if (fechaFin) {
      filtrados = filtrados.filter((r) => new Date(r.fecha) <= new Date(fechaFin));
    }

    setRegistrosFiltrados(filtrados);
  };

  const exportarHistorial = () => {
    toast.success('Exportando historial...', { duration: 2000 });
    // TODO: Implementar exportación a CSV/PDF
  };

  const verDetalle = (registro: RegistroHistorial) => {
    if (registro.tipo === 'cita') {
      // TODO: Abrir modal con detalles de cita
      toast.info('Detalle de cita próximamente');
    } else if (registro.tipo === 'evaluacion') {
      router.push(`/pacientes/${registro.paciente.id}/progreso`);
    } else if (registro.tipo === 'pago') {
      toast.info('Detalle de pago próximamente');
    } else if (registro.tipo === 'alerta') {
      toast.warning('Ver alerta crítica');
    }
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'cita':
        return <Calendar className="h-5 w-5" />;
      case 'evaluacion':
        return <Activity className="h-5 w-5" />;
      case 'pago':
        return <DollarSign className="h-5 w-5" />;
      case 'mensaje':
        return <MessageSquare className="h-5 w-5" />;
      case 'alerta':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'cita':
        return 'bg-blue-100 text-blue-700';
      case 'evaluacion':
        return 'bg-purple-100 text-purple-700';
      case 'pago':
        return 'bg-green-100 text-green-700';
      case 'mensaje':
        return 'bg-gray-100 text-gray-700';
      case 'alerta':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-calma-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial Completo</h1>
        <p className="text-gray-600">
          Visualiza todas tus actividades profesionales en un solo lugar
        </p>
      </div>

      {/* Estadísticas Generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Citas Totales</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalCitas}</p>
                <p className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  {estadisticas.citasCompletadas} completadas
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Evaluaciones</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalEvaluaciones}</p>
                <p className="text-xs text-gray-500">{estadisticas.pacientesActivos} pacientes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${estadisticas.ingresoTotal.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{estadisticas.totalPagos} pagos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alertas</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.alertasCriticas}</p>
                <p className="text-xs text-red-600">Requieren atención</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Paciente, título..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Tipo
            </label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="cita">Citas</option>
              <option value="evaluacion">Evaluaciones</option>
              <option value="pago">Pagos</option>
              <option value="alerta">Alertas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setBusqueda('');
              setTipoFiltro('todos');
              setFechaInicio('');
              setFechaFin('');
            }}
          >
            Limpiar Filtros
          </Button>
          <Button onClick={exportarHistorial} className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-3">
        {registrosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron registros</p>
          </div>
        ) : (
          registrosFiltrados.map((registro) => (
            <motion.div
              key={registro.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => verDetalle(registro)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getColorTipo(registro.tipo)}`}>
                  {getIconoTipo(registro.tipo)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{registro.titulo}</h3>
                      <p className="text-sm text-gray-600">{registro.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatearFecha(registro.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <User className="h-4 w-4" />
                      {registro.paciente?.nombre} {registro.paciente?.apellido}
                    </span>

                    {registro.monto && (
                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        ${registro.monto.toLocaleString()}
                      </span>
                    )}

                    {registro.urgencia && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          registro.urgencia === 'critico'
                            ? 'bg-red-100 text-red-700'
                            : registro.urgencia === 'alto'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {registro.urgencia.toUpperCase()}
                      </span>
                    )}

                    {registro.severidad && (
                      <span className="text-purple-600 font-medium text-xs">
                        {registro.severidad.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
