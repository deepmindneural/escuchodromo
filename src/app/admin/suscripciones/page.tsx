'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';
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
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Skeleton } from '../../../lib/componentes/ui/skeleton';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { toast, Toaster } from 'react-hot-toast';

interface Suscripcion {
  id: string;
  plan: string;
  periodo: string;
  precio: number;
  moneda: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_proximo_pago: string | null; // Mapeado desde fecha_renovacion en línea 98
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export default function AdminSuscripciones() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPlan, setFiltroPlan] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  // Estados para gráficos y estadísticas mejoradas
  const [datosDistribucionPlanes, setDatosDistribucionPlanes] = useState<any[]>([
    { nombre: 'Básico', valor: 0, color: '#3B82F6' },
    { nombre: 'Premium', valor: 0, color: '#8B5CF6' },
    { nombre: 'Profesional', valor: 0, color: '#14B8A6' },
  ]);
  const [datosIngresosMensuales, setDatosIngresosMensuales] = useState<any[]>([]);
  const [estadisticasResumen, setEstadisticasResumen] = useState({
    totalSuscripciones: 0,
    suscripcionesActivas: 0,
    suscripcionesCanceladas: 0,
    ingresosMensuales: 0,
    cambioHoy: 0,
  });

  useEffect(() => {
    cargarSuscripciones();
  }, [paginaActual, busqueda, filtroPlan, filtroEstado]);

  const cargarSuscripciones = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const limite = 10;
      const offset = (paginaActual - 1) * limite;

      // Usar función RPC optimizada que evita problemas con RLS
      const { data: suscripcionesData, error: suscripcionesError } = await supabase
        .rpc('buscar_suscripciones', {
          p_limit: limite,
          p_offset: offset,
          p_busqueda: busqueda || null,
          p_plan_filtro: filtroPlan || null,
          p_estado_filtro: filtroEstado || null,
        });

      if (suscripcionesError) {
        console.error('Error al cargar suscripciones:', suscripcionesError);
        toast.error('Error al cargar suscripciones');
        return;
      }

      // Transformar datos al formato esperado por la UI
      const suscripcionesFormateadas = (suscripcionesData || []).map((s: any) => ({
        id: s.id,
        plan: s.plan,
        periodo: s.periodo,
        precio: s.precio,
        moneda: s.moneda,
        estado: s.estado,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin,
        fecha_proximo_pago: s.fecha_renovacion, // La RPC usa fecha_renovacion
        usuario: {
          id: s.usuario_id,
          nombre: s.usuario_nombre,
          email: s.usuario_email
        }
      }));

      setSuscripciones(suscripcionesFormateadas);

      // Obtener total usando función RPC de estadísticas
      const { data: estadisticasData } = await supabase
        .rpc('obtener_estadisticas_suscripciones');

      const total = estadisticasData?.total || 0;
      const totalPaginas = Math.ceil(total / limite);
      setPaginacion({
        pagina: paginaActual,
        limite,
        total,
        totalPaginas,
      });

      // Calcular estadísticas de resumen
      const activas = (suscripcionesFormateadas || []).filter(
        (s: any) => s.estado === 'activa'
      ).length;
      const canceladas = (suscripcionesFormateadas || []).filter(
        (s: any) => s.estado === 'cancelada' || s.estado === 'vencida'
      ).length;
      const ingresos = (suscripcionesFormateadas || [])
        .filter((s: any) => s.estado === 'activa' && s.periodo === 'mensual')
        .reduce((sum: number, s: any) => sum + s.precio, 0);

      // Calcular distribución por planes
      const basico = (suscripcionesFormateadas || []).filter(
        (s: any) => s.plan === 'basico'
      ).length;
      const premium = (suscripcionesFormateadas || []).filter(
        (s: any) => s.plan === 'premium'
      ).length;
      const profesional = (suscripcionesFormateadas || []).filter(
        (s: any) => s.plan === 'profesional'
      ).length;

      setDatosDistribucionPlanes([
        { nombre: 'Básico', valor: basico, color: '#3B82F6' },
        { nombre: 'Premium', valor: premium, color: '#8B5CF6' },
        { nombre: 'Profesional', valor: profesional, color: '#14B8A6' },
      ]);

      setEstadisticasResumen({
        totalSuscripciones: total || 0,
        suscripcionesActivas: activas,
        suscripcionesCanceladas: canceladas,
        ingresosMensuales: Math.round(ingresos),
        cambioHoy: 2, // Simular cambio
      });

      // Simular ingresos por mes (o cargar desde RPC)
      setDatosIngresosMensuales([
        { mes: 'Ene', ingresos: 45000 },
        { mes: 'Feb', ingresos: 52000 },
        { mes: 'Mar', ingresos: 48000 },
        { mes: 'Abr', ingresos: 61000 },
        { mes: 'May', ingresos: 55000 },
        { mes: 'Jun', ingresos: Math.round(ingresos) },
      ]);
    } catch (error) {
      console.error('Error al cargar suscripciones:', error);
      toast.error('Error al cargar suscripciones');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstado = async (suscripcionId: string, nuevoEstado: string) => {
    try {
      const supabase = obtenerClienteNavegador();

      // IMPORTANTE: Admin NO puede actualizar suscripciones directamente por seguridad
      // Debe usarse una Edge Function que valide con Stripe
      // Por ahora, mostramos un mensaje informativo

      toast.error('La actualización de suscripciones debe realizarse desde la página de detalles del usuario', {
        duration: 4000,
      });

      // TODO: Implementar Edge Function admin-actualizar-suscripcion que:
      // 1. Valide que el admin tenga permisos
      // 2. Registre la acción en AuditLogAdmin
      // 3. Valide el cambio con Stripe si es necesario
      // 4. Actualice la suscripción usando service_role

      /*
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesión no válida');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-actualizar-suscripcion', {
        body: { suscripcion_id: suscripcionId, nuevo_estado: nuevoEstado },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error('Error al cambiar estado:', error);
        toast.error('Error al cambiar estado');
        return;
      }

      toast.success('Estado actualizado correctamente');
      cargarSuscripciones();
      */
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatearPrecio = (precio: number, moneda: string) => {
    const formato = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda === 'COP' ? 'COP' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formato.format(precio);
  };

  const obtenerBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge className="bg-green-100 text-green-800">Activa</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'pausada':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausada</Badge>;
      case 'vencida':
        return <Badge className="bg-gray-100 text-gray-800">Vencida</Badge>;
      case 'cancelar_al_final':
        return <Badge className="bg-orange-100 text-orange-800">Cancelar al final</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const obtenerBadgePlan = (plan: string) => {
    switch (plan) {
      case 'basico':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Básico</Badge>;
      case 'premium':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">Premium</Badge>;
      case 'profesional':
        return <Badge variant="outline" className="border-teal-300 text-teal-700">Profesional</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Suscripciones</h1>
        <p className="text-gray-600 mt-1">
          Administra y monitorea las suscripciones de los usuarios
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suscripciones</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paginacion?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {suscripciones.filter(s => s.estado === 'activa').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {suscripciones.filter(s => s.estado === 'cancelada' || s.estado === 'vencida').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatearPrecio(
                suscripciones
                  .filter(s => s.estado === 'activa' && s.periodo === 'mensual')
                  .reduce((sum, s) => sum + s.precio, 0),
                'COP'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={filtroPlan || 'todos'}
              onValueChange={(value) => {
                setFiltroPlan(value === 'todos' ? '' : value);
                setPaginaActual(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los planes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los planes</SelectItem>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="profesional">Profesional</SelectItem>
              </SelectContent>
            </Select>

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
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="cancelar_al_final">Cancelar al final</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setBusqueda('');
                setFiltroPlan('');
                setFiltroEstado('');
                setPaginaActual(1);
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de suscripciones */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Próximo Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : suscripciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No se encontraron suscripciones
                  </TableCell>
                </TableRow>
              ) : (
                suscripciones.map((suscripcion) => (
                  <TableRow key={suscripcion.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{suscripcion.usuario?.nombre || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">
                          {suscripcion.usuario?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{obtenerBadgePlan(suscripcion.plan)}</TableCell>
                    <TableCell>
                      <span className="capitalize">{suscripcion.periodo}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatearPrecio(suscripcion.precio, suscripcion.moneda)}
                      </span>
                    </TableCell>
                    <TableCell>{obtenerBadgeEstado(suscripcion.estado)}</TableCell>
                    <TableCell>{formatearFecha(suscripcion.fecha_inicio)}</TableCell>
                    <TableCell>{formatearFecha(suscripcion.fecha_fin)}</TableCell>
                    <TableCell>
                      {suscripcion.fecha_proximo_pago
                        ? formatearFecha(suscripcion.fecha_proximo_pago)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={suscripcion.estado}
                        onValueChange={(value) => cambiarEstado(suscripcion.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activa">Activa</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                          <SelectItem value="pausada">Pausada</SelectItem>
                          <SelectItem value="vencida">Vencida</SelectItem>
                          <SelectItem value="cancelar_al_final">Cancelar al final</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      {paginacion && paginacion.totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginacion.pagina - 1) * paginacion.limite + 1} a{' '}
            {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{' '}
            {paginacion.total} suscripciones
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
      )}
    </div>
  );
}
