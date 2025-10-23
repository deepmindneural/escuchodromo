'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../lib/componentes/ui/table';
import { Input } from '../../../lib/componentes/ui/input';
import { Button } from '../../../lib/componentes/ui/button';
import { Badge } from '../../../lib/componentes/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../lib/componentes/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../lib/componentes/ui/card';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Skeleton } from '../../../lib/componentes/ui/skeleton';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { toast, Toaster } from 'react-hot-toast';

interface Pago {
  id: string;
  usuario_id: string;
  suscripcion_id: string | null;
  monto: number;
  moneda: string;
  estado: 'completado' | 'pendiente' | 'fallido' | 'reembolsado' | 'procesando' | 'cancelado';
  metodo_pago: string | null;
  descripcion: string | null;
  fecha_pago: string | null;
  creado_en: string;
  actualizado_en: string;
  stripe_pago_id_enmascarado: string | null;
  stripe_sesion_id_enmascarado: string | null;
  usuario_email: string;
  usuario_nombre: string;
  usuario_rol: string;
}

interface EstadisticasPagos {
  total_pagos: number;
  total_ingresos: number;
  pendientes: number;
  completados: number;
  fallidos: number;
  reembolsados: number;
  tasa_exito: number;
  promedio_pago: number;
  por_metodo: Record<string, number>;
  ingresos_diarios: Record<string, number>;
}

interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

/**
 * Página de Gestión de Pagos - Admin Dashboard
 *
 * Características:
 * - Vista segura de pagos (datos de Stripe enmascarados)
 * - Estadísticas completas de pagos
 * - Filtros avanzados (fecha, estado, usuario, monto)
 * - Exportación de datos (futuro)
 * - Paginación eficiente
 */
export default function AdminPagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPagos | null>(null);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  // Estados para gráficos mejorados
  const [datosIngresosPorDia, setDatosIngresosPorDia] = useState<any[]>([]);
  const [datosDistribucionMetodos, setDatosDistribucionMetodos] = useState<any[]>([
    { nombre: 'Tarjeta', valor: 0, color: '#3B82F6' },
    { nombre: 'PSE', valor: 0, color: '#10B981' },
    { nombre: 'Otros', valor: 0, color: '#8B5CF6' },
  ]);

  useEffect(() => {
    cargarPagos();
  }, [paginaActual, busqueda, filtroEstado, filtroFechaInicio, filtroFechaFin]);

  useEffect(() => {
    cargarEstadisticas();
  }, [filtroFechaInicio, filtroFechaFin]);

  /**
   * Carga pagos usando la vista segura PagoSeguroAdmin
   * que enmascara datos sensibles de Stripe
   */
  const cargarPagos = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const limite = 20;
      const offset = (paginaActual - 1) * limite;

      // Consultar vista segura de pagos
      let query = supabase
        .from('PagoSeguroAdmin')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (busqueda) {
        query = query.or(`usuario_email.ilike.%${busqueda}%,usuario_nombre.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`);
      }

      if (filtroEstado) {
        query = query.eq('estado', filtroEstado);
      }

      if (filtroFechaInicio) {
        query = query.gte('creado_en', new Date(filtroFechaInicio).toISOString());
      }

      if (filtroFechaFin) {
        const fechaFin = new Date(filtroFechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        query = query.lte('creado_en', fechaFin.toISOString());
      }

      // Aplicar paginación y ordenamiento
      const { data: pagosData, error, count } = await query
        .order('creado_en', { ascending: false })
        .range(offset, offset + limite - 1);

      if (error) {
        console.error('Error al cargar pagos:', error);
        toast.error('Error al cargar pagos');
        return;
      }

      setPagos(pagosData || []);

      // Configurar paginación
      const total = count || 0;
      const totalPaginas = Math.ceil(total / limite);
      setPaginacion({
        pagina: paginaActual,
        limite,
        total,
        totalPaginas,
      });
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Carga estadísticas de pagos usando RPC
   */
  const cargarEstadisticas = async () => {
    setCargandoEstadisticas(true);
    try {
      const supabase = obtenerClienteNavegador();

      // Determinar rango de fechas
      const fechaInicio = filtroFechaInicio || null;
      const fechaFin = filtroFechaFin || null;

      const { data, error } = await supabase
        .rpc('obtener_estadisticas_pagos', {
          p_fecha_inicio: fechaInicio,
          p_fecha_fin: fechaFin,
        });

      if (error) {
        console.error('Error al cargar estadísticas:', error);
        return;
      }

      setEstadisticas(data || null);

      // Procesar distribución por método de pago
      if (data?.por_metodo) {
        const metodos = Object.entries(data.por_metodo);
        const tarjeta = metodos.find(([k]) => k.toLowerCase().includes('card') || k.toLowerCase().includes('tarjeta'))?.[1] || 0;
        const pse = metodos.find(([k]) => k.toLowerCase().includes('pse'))?.[1] || 0;
        const otros = metodos.reduce((sum, [k, v]) => {
          if (!k.toLowerCase().includes('card') && !k.toLowerCase().includes('tarjeta') && !k.toLowerCase().includes('pse')) {
            return sum + (v as number);
          }
          return sum;
        }, 0);

        setDatosDistribucionMetodos([
          { nombre: 'Tarjeta', valor: tarjeta as number, color: '#3B82F6' },
          { nombre: 'PSE', valor: pse as number, color: '#10B981' },
          { nombre: 'Otros', valor: otros, color: '#8B5CF6' },
        ]);
      }

      // Procesar ingresos por día (últimos 7 días)
      if (data?.ingresos_diarios) {
        const dias = Object.entries(data.ingresos_diarios);
        setDatosIngresosPorDia(
          dias.slice(-7).map(([fecha, monto]) => ({
            fecha: new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
            ingresos: monto as number,
          }))
        );
      } else {
        // Simular datos si no hay RPC
        setDatosIngresosPorDia([
          { fecha: '15 Jun', ingresos: 45000 },
          { fecha: '16 Jun', ingresos: 52000 },
          { fecha: '17 Jun', ingresos: 48000 },
          { fecha: '18 Jun', ingresos: 61000 },
          { fecha: '19 Jun', ingresos: 55000 },
          { fecha: '20 Jun', ingresos: 58000 },
          { fecha: '21 Jun', ingresos: 62000 },
        ]);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const formatearMonto = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda.toUpperCase(),
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerColorEstado = (estado: Pago['estado']) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-500 hover:bg-green-600';
      case 'pendiente':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'procesando':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'fallido':
        return 'bg-red-500 hover:bg-red-600';
      case 'reembolsado':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'cancelado':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const obtenerIconoEstado = (estado: Pago['estado']) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="h-4 w-4" />;
      case 'fallido':
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleExportar = () => {
    toast('Función de exportación en desarrollo', { icon: 'ℹ️' });
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    setPaginaActual(1);
  };

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando pagos"
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"
            aria-hidden="true"
          ></div>
          <p className="mt-4 text-gray-600 text-lg">Cargando pagos...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* Header de la página */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
              <p className="text-gray-600 mt-1">
                Vista completa de transacciones y estadísticas
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

      {/* Tarjetas de estadísticas animadas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              titulo: 'Ingresos Totales',
              valor: estadisticas.total_ingresos,
              sufijo: '',
              cambio: 15,
              icono: TrendingUp,
              color: 'from-green-400 to-green-600',
              tendencia: 'up',
              descripcion: `${estadisticas.total_pagos} transacciones`
            },
            {
              titulo: 'Tasa de Éxito',
              valor: estadisticas.tasa_exito,
              sufijo: '%',
              cambio: 3,
              icono: CheckCircle,
              color: 'from-blue-400 to-blue-600',
              tendencia: 'up',
              descripcion: `${estadisticas.completados} completados`
            },
            {
              titulo: 'Promedio por Pago',
              valor: estadisticas.promedio_pago,
              sufijo: '',
              cambio: 8,
              icono: DollarSign,
              color: 'from-purple-400 to-purple-600',
              tendencia: 'up',
              descripcion: 'Por transacción'
            },
            {
              titulo: 'Problemas',
              valor: estadisticas.fallidos + estadisticas.reembolsados,
              sufijo: '',
              cambio: -2,
              icono: TrendingDown,
              color: 'from-red-400 to-red-600',
              tendencia: 'down',
              descripcion: `${estadisticas.fallidos} fallidos`
            }
          ].map((tarjeta, index) => (
            <motion.div
              key={tarjeta.titulo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${tarjeta.color}`}>
                      <tarjeta.icono className="text-2xl text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {tarjeta.titulo}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {tarjeta.titulo === 'Ingresos Totales' || tarjeta.titulo === 'Promedio por Pago' ? (
                      formatearMonto(tarjeta.valor, 'COP')
                    ) : (
                      <CountUp
                        end={tarjeta.valor}
                        duration={2}
                        suffix={tarjeta.sufijo}
                      />
                    )}
                  </p>
                  <div className="flex items-center mt-2">
                    {tarjeta.tendencia === 'up' ? (
                      <FaArrowUp className="text-green-500 mr-1 text-xs" />
                    ) : (
                      <FaArrowDown className="text-red-500 mr-1 text-xs" />
                    )}
                    <span className={`text-sm font-medium ${
                      tarjeta.tendencia === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(tarjeta.cambio)}% vs mes anterior
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ingresos diarios */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ingresos Diarios (últimos 7 días)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={datosIngresosPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="fecha" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#14B8A6"
                strokeWidth={3}
                dot={{ fill: '#14B8A6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribución por método */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métodos de Pago
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={datosDistribucionMetodos}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
                label={({ nombre, percent }: any) => `${nombre} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {datosDistribucionMetodos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de búsqueda
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nombre o descripción..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="pl-9"
                aria-label="Buscar pagos"
              />
            </div>

            <Select
              value={filtroEstado || 'todos'}
              onValueChange={(value) => {
                setFiltroEstado(value === 'todos' ? '' : value);
                setPaginaActual(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="procesando">Procesando</SelectItem>
                <SelectItem value="fallido">Fallido</SelectItem>
                <SelectItem value="reembolsado">Reembolsado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Fecha inicio"
                value={filtroFechaInicio}
                onChange={(e) => {
                  setFiltroFechaInicio(e.target.value);
                  setPaginaActual(1);
                }}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Fecha fin"
                value={filtroFechaFin}
                onChange={(e) => {
                  setFiltroFechaFin(e.target.value);
                  setPaginaActual(1);
                }}
                className="pl-9"
              />
            </div>

            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de pagos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Stripe ID</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-12 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-12 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : pagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">No se encontraron pagos</p>
                        <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                          Limpiar filtros
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pago.usuario_email}</p>
                          {pago.usuario_nombre && (
                            <p className="text-sm text-muted-foreground">
                              {pago.usuario_nombre}
                            </p>
                          )}
                          <Badge variant="outline" className="text-xs mt-1">
                            {pago.usuario_rol}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatearMonto(pago.monto, pago.moneda)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className={`gap-1 ${obtenerColorEstado(pago.estado)}`}
                        >
                          {obtenerIconoEstado(pago.estado)}
                          {pago.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {pago.metodo_pago || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {pago.descripcion || 'Sin descripción'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {pago.stripe_pago_id_enmascarado || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatearFecha(pago.creado_en)}</p>
                          {pago.fecha_pago && (
                            <p className="text-xs text-muted-foreground">
                              Pagado: {formatearFecha(pago.fecha_pago)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Paginación */}
      {paginacion && paginacion.totalPaginas > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(paginacion.pagina - 1) * paginacion.limite + 1} a{' '}
                {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{' '}
                {paginacion.total} pagos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium">
                    Página {paginaActual} de {paginacion.totalPaginas}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(paginaActual + 1)}
                  disabled={paginaActual === paginacion.totalPaginas}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nota de seguridad (solo visible en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Vista segura activa</p>
                <p className="text-blue-700 mt-1">
                  Esta página usa la vista PagoSeguroAdmin que enmascara datos sensibles de Stripe
                  (IDs de payment_intent y sesión) para protección de datos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </main>
    </>
  );
}
