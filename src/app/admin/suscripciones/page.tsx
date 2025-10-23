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
import { AdminHeader, AdminStatCard } from '../../../lib/componentes/admin';

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

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando suscripciones"
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
          <p className="mt-4 text-gray-600 text-lg">Cargando suscripciones...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* Header de la página */}
      <AdminHeader
        titulo="Gestión de Suscripciones 💳"
        descripcion="Administra y monitorea las suscripciones y planes de todos los usuarios"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">{/* Espacio para continuar el contenido */}

      {/* Tarjetas de estadísticas animadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            titulo: 'Total Suscripciones',
            valor: estadisticasResumen.totalSuscripciones,
            cambio: estadisticasResumen.cambioHoy,
            icono: CreditCard,
            color: 'from-teal-400 to-teal-600',
            tendencia: 'up' as const
          },
          {
            titulo: 'Activas',
            valor: estadisticasResumen.suscripcionesActivas,
            cambio: 3,
            icono: CheckCircle,
            color: 'from-cyan-400 to-cyan-600',
            tendencia: 'up' as const
          },
          {
            titulo: 'Canceladas',
            valor: estadisticasResumen.suscripcionesCanceladas,
            cambio: -1,
            icono: XCircle,
            color: 'from-amber-400 to-orange-600',
            tendencia: 'down' as const
          },
          {
            titulo: 'Ingresos Mensuales',
            valor: estadisticasResumen.ingresosMensuales,
            prefijo: '$',
            cambio: 5,
            icono: DollarSign,
            color: 'from-purple-400 to-purple-600',
            tendencia: 'up' as const
          }
        ].map((tarjeta, index) => (
          <AdminStatCard
            key={tarjeta.titulo}
            titulo={tarjeta.titulo}
            valor={tarjeta.valor}
            icono={tarjeta.icono}
            color={tarjeta.color}
            cambio={tarjeta.cambio}
            tendencia={tarjeta.tendencia}
            prefijo={tarjeta.prefijo || ''}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distribución de planes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Planes
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={datosDistribucionPlanes}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
                label={({ nombre, percent }: any) => `${nombre} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {datosDistribucionPlanes.map((entry, index) => (
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

        {/* Ingresos mensuales */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ingresos Mensuales
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosIngresosMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mes" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="ingresos" fill="#14B8A6" radius={[8, 8, 0, 0]} />
            </BarChart>
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
      </motion.div>

      {/* Tabla de suscripciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
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
                    <TableCell><Skeleton className="h-12 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
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
      </motion.div>

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
      </main>
    </>
  );
}
