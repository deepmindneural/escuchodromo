'use client';

import { useEffect, useState } from 'react';
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

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 text-white rounded-xl shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
              <p className="text-green-100 mt-1">
                Vista completa de transacciones y estadísticas
              </p>
            </div>
          </div>
          <Button
            onClick={handleExportar}
            className="bg-white text-green-700 hover:bg-green-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats rápidas */}
        {paginacion && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-green-100 text-sm">Total pagos</p>
              <p className="text-2xl font-bold">{paginacion.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-green-100 text-sm">Mostrando</p>
              <p className="text-2xl font-bold">{pagos.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-green-100 text-sm">Página</p>
              <p className="text-2xl font-bold">{paginaActual} de {paginacion.totalPaginas}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-green-100 text-sm">Por página</p>
              <p className="text-2xl font-bold">{paginacion.limite}</p>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas de pagos */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatearMonto(estadisticas.total_ingresos, 'COP')}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.total_pagos} transacciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.tasa_exito}%</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.completados} completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Pago</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatearMonto(estadisticas.promedio_pago, 'COP')}
              </div>
              <p className="text-xs text-muted-foreground">
                Por transacción
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problemas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.fallidos + estadisticas.reembolsados}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.fallidos} fallidos, {estadisticas.reembolsados} reembolsados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
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

      {/* Tabla de pagos */}
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
                      <TableCell colSpan={7}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
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
    </div>
  );
}
